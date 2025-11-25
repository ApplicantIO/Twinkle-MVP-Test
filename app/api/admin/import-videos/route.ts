import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  uploadDate: string;
  viewCount: number;
  duration: number;
  url: string;
  channelId: string;
  channelName: string;
  channelThumbnail?: string;
}

function getYtDlpCommand(): string {
  try {
    execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
    return 'python3 -m yt_dlp';
  } catch {
    return 'yt-dlp';
  }
}

async function getVideoData(videoUrl: string): Promise<YouTubeVideoData> {
  try {
    const ytdlp = getYtDlpCommand();
    // Extract just the video ID from URL to avoid issues with query parameters
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const cleanUrl = videoIdMatch 
      ? `https://www.youtube.com/watch?v=${videoIdMatch[1]}`
      : videoUrl;
    
    const command = `${ytdlp} --dump-json --no-download --skip-download "${cleanUrl}" 2>/dev/null`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(output);
    
    const videoId = videoIdMatch ? videoIdMatch[1] : data.id;
    
    return {
      id: videoId,
      title: data.title || 'Untitled Video',
      description: data.description || '',
      thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      uploadDate: data.upload_date || data.release_date || new Date().toISOString(),
      viewCount: data.view_count || 0,
      duration: data.duration || 0,
      url: cleanUrl,
      channelId: data.channel_id || data.channel || 'unknown',
      channelName: data.channel || data.uploader || data.channel_name || 'Unknown Creator',
      channelThumbnail: data.channel_thumbnail || data.uploader_thumbnail || undefined,
    };
  } catch (error) {
    console.error(`Error fetching video data for ${videoUrl}:`, error);
    throw new Error(`Failed to fetch video data for ${videoUrl}`);
  }
}

async function downloadImage(url: string, savePath: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(savePath, buffer);
    return `/uploads/${path.basename(dir)}/${path.basename(savePath)}`;
  } catch {
    return null;
  }
}

async function getOrCreateCreator(channelId: string, channelName: string, channelThumbnail?: string): Promise<string> {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: `youtube_${channelId}@imported.local`,
    },
  });
  
  if (existingUser) {
    return existingUser.id;
  }
  
  const hashedPassword = await bcrypt.hash('imported_' + Date.now(), 10);
  
  const creator = await prisma.user.create({
    data: {
      email: `youtube_${channelId}@imported.local`,
      passwordHash: hashedPassword,
      name: channelName,
      role: 'creator',
    },
  });
  
  if (channelThumbnail) {
    try {
      const profilePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', `${creator.id}.jpg`);
      const profileUrl = await downloadImage(channelThumbnail, profilePath);
      if (profileUrl) {
        await prisma.user.update({
          where: { id: creator.id },
          data: { profileImageUrl: profileUrl },
        });
      }
    } catch {
      // Ignore profile image errors
    }
  }
  
  return creator.id;
}

async function importVideo(videoData: YouTubeVideoData): Promise<boolean> {
  try {
    const embedUrl = `https://www.youtube.com/embed/${videoData.id}`;
    
    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl: embedUrl,
      },
    });
    
    if (existingVideo) {
      return false; // Already exists
    }
    
    const creatorId = await getOrCreateCreator(
      videoData.channelId,
      videoData.channelName,
      videoData.channelThumbnail
    );
    
    let thumbnailUrl: string | null = null;
    if (videoData.thumbnail) {
      const thumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', `${videoData.id}.jpg`);
      thumbnailUrl = await downloadImage(videoData.thumbnail, thumbPath);
    }
    
    let uploadDate: Date;
    if (videoData.uploadDate) {
      if (videoData.uploadDate.match(/^\d{8}$/)) {
        const year = parseInt(videoData.uploadDate.substring(0, 4));
        const month = parseInt(videoData.uploadDate.substring(4, 6)) - 1;
        const day = parseInt(videoData.uploadDate.substring(6, 8));
        uploadDate = new Date(year, month, day);
      } else {
        uploadDate = new Date(videoData.uploadDate);
      }
    } else {
      uploadDate = new Date();
    }
    
    await prisma.video.create({
      data: {
        title: videoData.title,
        description: videoData.description.substring(0, 2000) || null,
        videoUrl: embedUrl,
        thumbnailUrl: thumbnailUrl,
        userId: creatorId,
        views: videoData.viewCount,
        duration: videoData.duration > 0 ? Math.round(videoData.duration) : null,
        createdAt: uploadDate,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error importing video:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrls } = await request.json();
    
    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'videoUrls array is required' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const url of videoUrls) {
      try {
        const videoData = await getVideoData(url);
        const success = await importVideo(videoData);
        
        if (success) {
          imported++;
        } else {
          skipped++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${url}: ${errorMsg}`);
        console.error(`Failed to import ${url}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in import-videos API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import videos' },
      { status: 500 }
    );
  }
}

