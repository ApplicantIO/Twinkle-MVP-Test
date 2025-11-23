import { NextRequest, NextResponse } from 'next/server';
import { mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if video file exists
    const videoFilePath = join(process.cwd(), 'twinkle-video.mp4');
    
    if (!existsSync(videoFilePath)) {
      return NextResponse.json(
        { error: 'twinkle-video.mp4 not found in project root' },
        { status: 404 }
      );
    }

    // Check if creator already exists
    let creator = await prisma.user.findFirst({
      where: {
        email: 'official@twinkle.uz',
      },
    });

    if (creator) {
      // Update existing creator
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
    }

    // Create uploads directory for creator
    const uploadsDir = join(process.cwd(), 'public', 'uploads', creator.id);
    await mkdir(uploadsDir, { recursive: true });

    // Copy video file to uploads directory
    const videoFileName = `twinkle-video-${Date.now()}.mp4`;
    const videoDestPath = join(uploadsDir, videoFileName);
    await copyFile(videoFilePath, videoDestPath);
    const videoUrl = `/uploads/${creator.id}/${videoFileName}`;

    // Check if video already exists
    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl: videoUrl,
        userId: creator.id,
      },
    });

    let video;
    if (existingVideo) {
      video = existingVideo;
    } else {
      // Create video record
      video = await prisma.video.create({
        data: {
          title: 'Welcome to Twinkle - #SaviyaliKontent =)',
          description: 'Official Twinkle platform introduction video. Join us for the best content!',
          videoUrl: videoUrl,
          thumbnailUrl: null,
          userId: creator.id,
          views: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        email: creator.email,
        name: creator.name,
      },
      video: {
        id: video.id,
        title: video.title,
        url: video.videoUrl,
      },
      message: 'Official Twinkle Creator setup complete!',
    });
  } catch (error) {
    console.error('Error setting up Twinkle creator:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup Twinkle creator' },
      { status: 500 }
    );
  }
}

