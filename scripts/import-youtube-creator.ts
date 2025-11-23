/**
 * Script to import a YouTube creator's profile and videos to Twinkle
 * 
 * Usage: npx tsx scripts/import-youtube-creator.ts <youtube-channel-url>
 * Example: npx tsx scripts/import-youtube-creator.ts https://www.youtube.com/@ozimizuz
 * 
 * Note: This script requires yt-dlp to be installed:
 *   macOS: brew install yt-dlp
 *   Linux: pip install yt-dlp
 *   Windows: pip install yt-dlp
 */

import { execSync } from 'child_process';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  subscriberCount?: number;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  uploadDate: string;
  viewCount: number;
  duration: number;
  url: string;
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

async function getChannelInfo(channelUrl: string): Promise<YouTubeChannelInfo> {
  console.log('Fetching channel information...');
  
  try {
    const ytdlp = getYtDlpCommand();
    // Get channel info from a channel page
    const command = `${ytdlp} --dump-json --no-download --skip-download --flat-playlist "${channelUrl}" 2>/dev/null | head -1`;
    const output = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    
    // Try to get channel metadata from channel page
    let channelData = data;
    try {
      const ytdlp = getYtDlpCommand();
      const channelInfoCmd = `${ytdlp} --dump-json --no-download --skip-download "${channelUrl}/about" 2>/dev/null | head -1`;
      const channelOutput = execSync(channelInfoCmd, { encoding: 'utf-8' });
      channelData = JSON.parse(channelOutput);
    } catch {
      // If about page fails, use video data
    }
    
    return {
      id: channelData.channel_id || data.channel_id || data.id || 'unknown',
      title: channelData.channel || data.channel || data.uploader || 'Unknown Creator',
      description: channelData.description || data.description || '',
      thumbnail: channelData.thumbnail || data.thumbnail || data.avatar || '',
      banner: channelData.banner || data.banner || undefined,
      subscriberCount: channelData.channel_follower_count || data.channel_follower_count || 0,
    };
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw new Error('Failed to fetch channel information. Make sure yt-dlp is installed and the URL is correct.');
  }
}

async function getChannelVideos(channelUrl: string, maxVideos: number = 50): Promise<YouTubeVideo[]> {
  console.log(`Fetching up to ${maxVideos} videos from channel...`);
  
  try {
    const ytdlp = getYtDlpCommand();
    const command = `${ytdlp} --dump-json --flat-playlist --no-download --skip-download --playlist-end ${maxVideos} "${channelUrl}/videos" 2>/dev/null`;
    const output = execSync(command, { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    const videos: YouTubeVideo[] = [];
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.id && data.title) {
          // Get full video details
          const videoUrl = `https://www.youtube.com/watch?v=${data.id}`;
          const videoDetails = await getVideoDetails(videoUrl);
          
          videos.push({
            id: data.id,
            title: data.title || 'Untitled',
            description: videoDetails.description || '',
            thumbnail: videoDetails.thumbnail || data.thumbnail || '',
            uploadDate: videoDetails.uploadDate || data.upload_date || new Date().toISOString(),
            viewCount: videoDetails.viewCount || data.view_count || 0,
            duration: videoDetails.duration || data.duration || 0,
            url: videoUrl,
          });
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos from channel.');
  }
}

async function getVideoDetails(videoUrl: string): Promise<Partial<YouTubeVideo>> {
  try {
    const ytdlp = getYtDlpCommand();
    const command = `${ytdlp} --dump-json --no-download --skip-download "${videoUrl}" 2>/dev/null`;
    const output = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    
    return {
      description: data.description || '',
      thumbnail: data.thumbnail || '',
      uploadDate: data.upload_date || data.release_date || new Date().toISOString(),
      viewCount: data.view_count || 0,
      duration: data.duration || 0,
    };
  } catch {
    // Return empty if we can't get details
    return {};
  }
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

async function importCreator(channelUrl: string) {
  console.log(`\n🚀 Starting import for: ${channelUrl}\n`);
  
  // Check if yt-dlp is installed
  if (!(await checkYtDlpInstalled())) {
    console.error('❌ Error: yt-dlp is not installed.');
    console.log('\nPlease install yt-dlp first:');
    console.log('  macOS: python3 -m pip install yt-dlp --user');
    console.log('  Linux: pip install yt-dlp');
    console.log('  Windows: pip install yt-dlp\n');
    process.exit(1);
  }
  
  try {
    // Get channel info
    const channelInfo = await getChannelInfo(channelUrl);
    console.log(`✅ Found channel: ${channelInfo.title}`);
    
    // Check if creator already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: `youtube_${channelInfo.id}@imported.local`,
      },
    });
    
    let creatorId: string;
    
    if (existingUser) {
      console.log(`⚠️  Creator already exists, updating...`);
      creatorId = existingUser.id;
      
      // Update creator info
      await prisma.user.update({
        where: { id: creatorId },
        data: {
          name: channelInfo.title,
          aboutText: channelInfo.description.substring(0, 500) || null,
          role: 'creator',
        },
      });
    } else {
      // Create creator account
      console.log('Creating creator account...');
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
      console.log(`✅ Created creator account: ${creator.id}`);
    }
    
    // Download profile image
    if (channelInfo.thumbnail) {
      console.log('Downloading profile image...');
      const profilePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', `${creatorId}.jpg`);
      const profileUrl = await downloadImage(channelInfo.thumbnail, profilePath);
      if (profileUrl) {
        await prisma.user.update({
          where: { id: creatorId },
          data: { profileImageUrl: profileUrl },
        });
        console.log('✅ Profile image downloaded');
      }
    }
    
    // Download banner if available
    if (channelInfo.banner) {
      console.log('Downloading banner image...');
      const bannerPath = path.join(process.cwd(), 'public', 'uploads', 'banners', `${creatorId}.jpg`);
      const bannerUrl = await downloadImage(channelInfo.banner, bannerPath);
      if (bannerUrl) {
        await prisma.user.update({
          where: { id: creatorId },
          data: { bannerUrl: bannerUrl },
        });
        console.log('✅ Banner image downloaded');
      }
    }
    
    // Get videos
    const videos = await getChannelVideos(channelUrl, 50);
    console.log(`\n✅ Found ${videos.length} videos`);
    
    // Import videos
    let imported = 0;
    let skipped = 0;
    
    for (const video of videos) {
      try {
        // Check if video already exists
        const existingVideo = await prisma.video.findFirst({
          where: {
            videoUrl: video.url,
            userId: creatorId,
          },
        });
        
        if (existingVideo) {
          skipped++;
          continue;
        }
        
        // Download thumbnail
        let thumbnailUrl: string | null = null;
        if (video.thumbnail) {
          const thumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', `${video.id}.jpg`);
          const thumbUrl = await downloadImage(video.thumbnail, thumbPath);
          thumbnailUrl = thumbUrl;
        }
        
        // Create video entry with YouTube embed URL
        // Note: Actual video file is not downloaded, we use YouTube embed
        const embedUrl = `https://www.youtube.com/embed/${video.id}`;
        
        await prisma.video.create({
          data: {
            title: video.title,
            description: video.description.substring(0, 2000) || null,
            videoUrl: embedUrl, // Using embed URL instead of direct file
            thumbnailUrl: thumbnailUrl,
            userId: creatorId,
            views: video.viewCount,
            createdAt: new Date(video.uploadDate),
          },
        });
        
        imported++;
        console.log(`  ✅ Imported: ${video.title.substring(0, 50)}...`);
      } catch (error) {
        console.error(`  ❌ Error importing video ${video.title}:`, error);
      }
    }
    
    console.log(`\n✨ Import complete!`);
    console.log(`   - Creator: ${channelInfo.title}`);
    console.log(`   - Videos imported: ${imported}`);
    console.log(`   - Videos skipped: ${skipped}`);
    console.log(`   - Creator ID: ${creatorId}`);
    console.log(`\n📝 Note: Videos use YouTube embed URLs. To use local video files,`);
    console.log(`   you'll need to download them separately and update the videoUrl field.\n`);
    
  } catch (error) {
    console.error('\n❌ Error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const channelUrl = process.argv[2];

if (!channelUrl) {
  console.error('❌ Error: YouTube channel URL is required');
  console.log('\nUsage: npx tsx scripts/import-youtube-creator.ts <youtube-channel-url>');
  console.log('Example: npx tsx scripts/import-youtube-creator.ts https://www.youtube.com/@ozimizuz\n');
  process.exit(1);
}

importCreator(channelUrl).catch(console.error);

