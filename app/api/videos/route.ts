import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const videos = await prisma.video.findMany({
      where: userId ? { userId } : undefined,
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
      orderBy: { createdAt: 'desc' },
      ...(Number.isFinite(limit) && limit && limit > 0 ? { take: limit } : {}),
    });

    return NextResponse.json({ videos });
  } catch (error: unknown) {
    console.error('Error loading videos list:', error);
    return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
  }
}
