import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  uploadDate: string;
  viewCount: number;
  url: string;
}

function getYtDlpCommand(): string {
  try {
    execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
    return 'python3 -m yt_dlp';
  } catch {
    return 'yt-dlp';
  }
}

async function getChannelInfo(channelUrl: string): Promise<YouTubeChannelInfo> {
  const ytdlp = getYtDlpCommand();
  const command = `${ytdlp} --dump-json --no-download --skip-download --flat-playlist "${channelUrl}" 2>/dev/null | head -1`;
  const output = execSync(command, { encoding: 'utf-8' });
  const data = JSON.parse(output);
  
  let channelData = data;
  try {
    const channelInfoCmd = `${ytdlp} --dump-json --no-download --skip-download "${channelUrl}/about" 2>/dev/null | head -1`;
    const channelOutput = execSync(channelInfoCmd, { encoding: 'utf-8' });
    channelData = JSON.parse(channelOutput);
  } catch {
    // Use video data if about page fails
  }
  
  return {
    id: channelData.channel_id || data.channel_id || data.id || 'unknown',
    title: channelData.channel || data.channel || data.uploader || 'Unknown Creator',
    description: channelData.description || data.description || '',
    thumbnail: channelData.thumbnail || data.thumbnail || data.avatar || '',
    banner: channelData.banner || data.banner || undefined,
  };
}

async function getChannelVideos(channelUrl: string, maxVideos: number = 50): Promise<YouTubeVideo[]> {
  const ytdlp = getYtDlpCommand();
  const command = `${ytdlp} --dump-json --flat-playlist --no-download --skip-download --playlist-end ${maxVideos} "${channelUrl}/videos" 2>/dev/null`;
  const output = execSync(command, { encoding: 'utf-8' });
  const lines = output.trim().split('\n').filter(line => line.trim());
  
  const videos: YouTubeVideo[] = [];
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      if (data.id && data.title) {
        const videoUrl = `https://www.youtube.com/watch?v=${data.id}`;
        videos.push({
          id: data.id,
          title: data.title || 'Untitled',
          description: '',
          thumbnail: data.thumbnail || '',
          uploadDate: data.upload_date || new Date().toISOString(),
          viewCount: data.view_count || 0,
          url: videoUrl,
        });
      }
    } catch {
      continue;
    }
  }
  
  return videos;
}

async function downloadImage(url: string, savePath: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
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

export async function POST(request: NextRequest) {
  try {
    const { channelUrl } = await request.json();
    
    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // Get channel info
    const channelInfo = await getChannelInfo(channelUrl);
    
    // Check if creator already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: `youtube_${channelInfo.id}@imported.local`,
      },
    });
    
    let creatorId: string;
    
    if (existingUser) {
      creatorId = existingUser.id;
      await prisma.user.update({
        where: { id: creatorId },
        data: {
          name: channelInfo.title,
          aboutText: channelInfo.description.substring(0, 500) || null,
          role: 'creator',
        },
      });
    } else {
      const hashedPassword = await bcrypt.hash('imported_' + Date.now(), 10);
      const creator = await prisma.user.create({
        data: {
          email: `youtube_${channelInfo.id}@imported.local`,
          passwordHash: hashedPassword,
          name: channelInfo.title,
          aboutText: channelInfo.description.substring(0, 500) || null,
          role: 'creator',
        },
      });
      creatorId = creator.id;
    }
    
    // Download profile image
    if (channelInfo.thumbnail) {
      const profilePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', `${creatorId}.jpg`);
      const profileUrl = await downloadImage(channelInfo.thumbnail, profilePath);
      if (profileUrl) {
        await prisma.user.update({
          where: { id: creatorId },
          data: { profileImageUrl: profileUrl },
        });
      }
    }
    
    // Get videos
    const videos = await getChannelVideos(channelUrl, 50);
    
    // Import videos
    let imported = 0;
    let skipped = 0;
    
    for (const video of videos) {
      try {
        const existingVideo = await prisma.video.findFirst({
          where: {
            videoUrl: { contains: video.id },
            userId: creatorId,
          },
        });
        
        if (existingVideo) {
          skipped++;
          continue;
        }
        
        let thumbnailUrl: string | null = null;
        if (video.thumbnail) {
          const thumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', `${video.id}.jpg`);
          const thumbUrl = await downloadImage(video.thumbnail, thumbPath);
          thumbnailUrl = thumbUrl;
        }
        
        const embedUrl = `https://www.youtube.com/embed/${video.id}`;
        
        await prisma.video.create({
          data: {
            title: video.title,
            description: video.description.substring(0, 2000) || null,
            videoUrl: embedUrl,
            thumbnailUrl: thumbnailUrl,
            userId: creatorId,
            views: video.viewCount,
            createdAt: new Date(video.uploadDate),
          },
        });
        
        imported++;
      } catch (error) {
        console.error(`Error importing video ${video.title}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      creator: {
        id: creatorId,
        name: channelInfo.title,
      },
      imported,
      skipped,
    });
  } catch (error) {
    console.error('Error importing YouTube channel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import channel' },
      { status: 500 }
    );
  }
}

