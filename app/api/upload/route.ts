import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { put } from '@vercel/blob';
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

    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    let videoUrl: string;
    let thumbnailUrl: string | null = null;

    if (useBlob) {
      // Vercel Blob (production / when token is set)
      const videoBlob = await put(`videos/${user.id}/${Date.now()}_${videoFile.name}`, videoFile, { access: 'public' });
      videoUrl = videoBlob.url;

      if (thumbnailFile) {
        const thumbBlob = await put(`thumbnails/${user.id}/${Date.now()}_${thumbnailFile.name}`, thumbnailFile, { access: 'public' });
        thumbnailUrl = thumbBlob.url;
      }
    } else {
      // Fallback: local disk (development without Blob token)
      const uploadsDir = join(process.cwd(), 'public', 'uploads', user.id);
      await mkdir(uploadsDir, { recursive: true });

      const videoFileName = `${Date.now()}_${videoFile.name}`;
      const videoBytes = await videoFile.arrayBuffer();
      await writeFile(join(uploadsDir, videoFileName), Buffer.from(videoBytes));
      videoUrl = `/uploads/${user.id}/${videoFileName}`;

      if (thumbnailFile) {
        const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;
        const thumbnailBytes = await thumbnailFile.arrayBuffer();
        await writeFile(join(uploadsDir, thumbnailFileName), Buffer.from(thumbnailBytes));
        thumbnailUrl = `/uploads/${user.id}/${thumbnailFileName}`;
      }
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

