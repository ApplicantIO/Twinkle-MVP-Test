/**
 * Script to create Official Twinkle Creator profile and upload twinkle-video.mp4
 */

import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

async function setupTwinkleCreator() {
  try {
    console.log('\n🚀 Setting up Official Twinkle Creator...\n');

    // Check if video file exists
    const videoFilePath = path.join(process.cwd(), 'twinkle-video.mp4');
    if (!fs.existsSync(videoFilePath)) {
      console.error('❌ Error: twinkle-video.mp4 not found in project root');
      process.exit(1);
    }

    // Check if creator already exists
    let creator = await prisma.user.findFirst({
      where: {
        email: 'official@twinkle.uz',
      },
    });

    if (creator) {
      console.log('✅ Official Twinkle Creator already exists, updating...');
      creator = await prisma.user.update({
        where: { id: creator.id },
        data: {
          name: 'Official Twinkle',
          role: 'creator',
          aboutText: 'Official Twinkle channel - #SaviyaliKontent =)',
        },
      });
    } else {
      // Create creator account
      console.log('Creating Official Twinkle Creator account...');
      const hashedPassword = await bcrypt.hash('twinkle2024', 10);
      
      creator = await prisma.user.create({
        data: {
          email: 'official@twinkle.uz',
          passwordHash: hashedPassword,
          name: 'Official Twinkle',
          role: 'creator',
          aboutText: 'Official Twinkle channel - #SaviyaliKontent =)',
        },
      });
      console.log(`✅ Created creator account: ${creator.id}`);
    }

    // Create uploads directory for creator
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', creator.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Copy video file to uploads directory
    const videoFileName = `twinkle-video-${Date.now()}.mp4`;
    const videoDestPath = path.join(uploadsDir, videoFileName);
    fs.copyFileSync(videoFilePath, videoDestPath);
    const videoUrl = `/uploads/${creator.id}/${videoFileName}`;
    console.log(`✅ Video file copied to: ${videoUrl}`);

    // Check if video already exists
    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl: videoUrl,
        userId: creator.id,
      },
    });

    if (existingVideo) {
      console.log('⚠️  Video already exists in database');
      console.log(`   Video ID: ${existingVideo.id}`);
      console.log(`   Title: ${existingVideo.title}`);
    } else {
      // Create video record
      console.log('Creating video record...');
      const video = await prisma.video.create({
        data: {
          title: 'Welcome to Twinkle - #SaviyaliKontent =)',
          description: 'Official Twinkle platform introduction video. Join us for the best content!',
          videoUrl: videoUrl,
          thumbnailUrl: null, // Can add thumbnail later
          userId: creator.id,
          views: 0,
        },
      });
      console.log(`✅ Video created: ${video.id}`);
      console.log(`   Title: ${video.title}`);
    }

    console.log('\n✨ Setup complete!');
    console.log(`\n📝 Creator Details:`);
    console.log(`   Email: official@twinkle.uz`);
    console.log(`   Password: twinkle2024`);
    console.log(`   Creator ID: ${creator.id}`);
    console.log(`\n🎬 Video is now available on the homepage!\n`);

  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTwinkleCreator();

