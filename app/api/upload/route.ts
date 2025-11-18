import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only creators can upload videos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as string | null;

    if (!videoFile || !title) {
      return NextResponse.json(
        { error: 'Video file and title are required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', user.id);
    await mkdir(uploadsDir, { recursive: true });

    // Save video file
    const videoBytes = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    const videoFileName = `${Date.now()}_${videoFile.name}`;
    const videoPath = join(uploadsDir, videoFileName);
    await writeFile(videoPath, videoBuffer);
    const videoUrl = `/uploads/${user.id}/${videoFileName}`;

    // Save thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
      const thumbnailBytes = await thumbnailFile.arrayBuffer();
      const thumbnailBuffer = Buffer.from(thumbnailBytes);
      const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;
      const thumbnailPath = join(uploadsDir, thumbnailFileName);
      await writeFile(thumbnailPath, thumbnailBuffer);
      thumbnailUrl = `/uploads/${user.id}/${thumbnailFileName}`;
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl,
        category: category || null,
        userId: user.id,
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

    return NextResponse.json({ video });
  } catch (_error: unknown) {
    console.error('Upload error:', _error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

