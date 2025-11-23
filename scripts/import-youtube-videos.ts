/**
 * Script to import individual YouTube videos to Twinkle
 * 
 * Usage: npx tsx scripts/import-youtube-videos.ts <video-url-1> <video-url-2> ...
 * Example: npx tsx scripts/import-youtube-videos.ts https://www.youtube.com/watch?v=VIDEO_ID
 * 
 * Note: This script requires yt-dlp to be installed:
 *   macOS: python3 -m pip install yt-dlp --user
 *   Linux: pip install yt-dlp
 *   Windows: pip install yt-dlp
 */

import { execSync } from 'child_process';
import { prisma } from '../lib/prisma';
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

async function checkYtDlpInstalled(): Promise<boolean> {
  try {
    execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('yt-dlp --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
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
  console.log(`\n📥 Fetching video data: ${videoUrl}`);
  
  try {
    const ytdlp = getYtDlpCommand();
    const command = `${ytdlp} --dump-json --no-download --skip-download "${videoUrl}" 2>/dev/null`;
    const output = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    
    // Extract video ID from URL if not in data
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : data.id;
    
    return {
      id: videoId,
      title: data.title || 'Untitled Video',
      description: data.description || '',
      thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      uploadDate: data.upload_date || data.release_date || new Date().toISOString(),
      viewCount: data.view_count || 0,
      duration: data.duration || 0,
      url: videoUrl,
      channelId: data.channel_id || data.channel || 'unknown',
      channelName: data.channel || data.uploader || data.channel_name || 'Unknown Creator',
      channelThumbnail: data.channel_thumbnail || data.uploader_thumbnail || undefined,
    };
  } catch (error) {
    console.error(`❌ Error fetching video data:`, error);
    throw new Error(`Failed to fetch video data for ${videoUrl}`);
  }
}

async function downloadImage(url: string, savePath: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️  Failed to download image: ${url}`);
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(savePath, buffer);
    return `/uploads/${path.basename(dir)}/${path.basename(savePath)}`;
  } catch (error) {
    console.warn(`⚠️  Error downloading image ${url}:`, error);
    return null;
  }
}

async function getOrCreateCreator(channelId: string, channelName: string, channelThumbnail?: string): Promise<string> {
  // Check if creator already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: `youtube_${channelId}@imported.local`,
    },
  });
  
  if (existingUser) {
    console.log(`  ✅ Creator exists: ${channelName}`);
    return existingUser.id;
  }
  
  // Create creator account
  console.log(`  📝 Creating creator: ${channelName}`);
  const hashedPassword = await bcrypt.hash('imported_' + Date.now(), 10);
  
  const creator = await prisma.user.create({
    data: {
      email: `youtube_${channelId}@imported.local`,
      passwordHash: hashedPassword,
      name: channelName,
      role: 'creator',
    },
  });
  
  // Download profile image if available
  if (channelThumbnail) {
    try {
      const profilePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', `${creator.id}.jpg`);
      const profileUrl = await downloadImage(channelThumbnail, profilePath);
      if (profileUrl) {
        await prisma.user.update({
          where: { id: creator.id },
          data: { profileImageUrl: profileUrl },
        });
        console.log(`  ✅ Profile image downloaded`);
      }
    } catch (error) {
      console.warn(`  ⚠️  Failed to download profile image`);
    }
  }
  
  return creator.id;
}

async function importVideo(videoData: YouTubeVideoData): Promise<boolean> {
  try {
    // Check if video already exists
    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl: `https://www.youtube.com/embed/${videoData.id}`,
      },
    });
    
    if (existingVideo) {
      console.log(`  ⏭️  Video already exists, skipping: ${videoData.title}`);
      return false;
    }
    
    // Get or create creator
    const creatorId = await getOrCreateCreator(
      videoData.channelId,
      videoData.channelName,
      videoData.channelThumbnail
    );
    
    // Download thumbnail
    let thumbnailUrl: string | null = null;
    if (videoData.thumbnail) {
      const thumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', `${videoData.id}.jpg`);
      thumbnailUrl = await downloadImage(videoData.thumbnail, thumbPath);
    }
    
    // Create video entry with YouTube embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoData.id}`;
    
    // Parse upload date
    let uploadDate: Date;
    if (videoData.uploadDate) {
      // Format: YYYYMMDD
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
    
    console.log(`  ✅ Imported: ${videoData.title}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error importing video:`, error);
    return false;
  }
}

async function importVideos(videoUrls: string[]) {
  console.log(`\n🚀 Starting import of ${videoUrls.length} videos\n`);
  
  // Check if yt-dlp is installed
  if (!(await checkYtDlpInstalled())) {
    console.error('❌ Error: yt-dlp is not installed.');
    console.log('\nPlease install yt-dlp first:');
    console.log('  macOS: python3 -m pip install yt-dlp --user');
    console.log('  Linux: pip install yt-dlp');
    console.log('  Windows: pip install yt-dlp\n');
    process.exit(1);
  }
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < videoUrls.length; i++) {
    const url = videoUrls[i];
    console.log(`\n[${i + 1}/${videoUrls.length}] Processing: ${url}`);
    
    try {
      const videoData = await getVideoData(url);
      const success = await importVideo(videoData);
      
      if (success) {
        imported++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to import video:`, error);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    if (i < videoUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n✨ Import complete!`);
  console.log(`   - Videos imported: ${imported}`);
  console.log(`   - Videos skipped: ${skipped}`);
  console.log(`   - Videos failed: ${failed}`);
  console.log(`\n📝 Note: Videos use YouTube embed URLs. To use local video files,`);
  console.log(`   you'll need to download them separately and update the videoUrl field.\n`);
}

// Run the script
const videoUrls = process.argv.slice(2);

if (videoUrls.length === 0) {
  console.error('❌ Error: At least one YouTube video URL is required');
  console.log('\nUsage: npx tsx scripts/import-youtube-videos.ts <video-url-1> <video-url-2> ...');
  console.log('Example: npx tsx scripts/import-youtube-videos.ts https://www.youtube.com/watch?v=VIDEO_ID\n');
  process.exit(1);
}

importVideos(videoUrls)
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    prisma.$disconnect();
    process.exit(1);
  });

