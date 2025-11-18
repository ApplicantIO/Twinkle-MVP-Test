import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET funksiyasida context param types ishlatildi
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; 
  
  try {
    const video = await prisma.video.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            bannerUrl: true,
            aboutText: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.video.update({
      where: { id: id },
      data: { views: { increment: 1 } },
    });

    // Record analytics
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    await prisma.analytics.create({
      data: {
        videoId: id,
        viewerIp: clientIp,
      },
    });

    return NextResponse.json({ video });
  } catch (_error: unknown) {
    console.error('Error fetching video:', _error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

// PATCH funksiyasida ham 'any' ishlatildi
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const video = await prisma.video.findUnique({
      where: { id: id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.userId !== payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only edit your own videos' },
          { status: 403 }
        );
      }
    }

    const { title, description, category } = await request.json();

    const updated = await prisma.video.update({
      where: { id: id },
      data: {
        title: title || video.title,
        description: description !== undefined ? description : video.description,
        category: category !== undefined ? category : video.category,
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

    return NextResponse.json({ video: updated });
  } catch (_error: unknown) {
    console.error('Error updating video:', _error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE funksiyasida ham 'any' ishlatildi
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const video = await prisma.video.findUnique({
      where: { id: id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (video.userId !== payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only delete your own videos' },
          { status: 403 }
        );
      }
    }

    await prisma.video.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (_error: unknown) {
    console.error('Error deleting video:', _error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}