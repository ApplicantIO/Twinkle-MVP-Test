import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserSubscriptions } from '@/lib/firebase/subscriptions';
import { prisma } from '@/lib/prisma';

interface CreatorWithActivity {
  id: string;
  name?: string;
  profileImageUrl?: string;
  isLive: boolean;
  liveViewers?: number;
  latestActivity: Date | null;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    // Get user's subscriptions from Firebase
    let creatorIds: string[] = [];
    try {
      creatorIds = await getUserSubscriptions(payload.id);
    } catch (error) {
      // If Firebase is not configured or there's an error, return empty array
      console.error('Error fetching subscriptions from Firebase:', error);
      return NextResponse.json({ creators: [] });
    }
    
    if (creatorIds.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    // Get creator details from Prisma
    const creators = await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
        role: { in: ['creator', 'admin'] },
      },
      select: {
        id: true,
        name: true,
        profileImageUrl: true,
      },
    });

    // Get latest video for each creator to determine activity
    const creatorsWithActivity: CreatorWithActivity[] = await Promise.all(
      creators.map(async (creator) => {
        // Get latest video
        const latestVideo = await prisma.video.findFirst({
          where: { userId: creator.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        // TODO: Check if creator is live (this would need a live streams table or field)
        // For now, we'll assume no one is live
        const isLive = false;
        const liveViewers = 0;

        return {
          id: creator.id,
          name: creator.name || undefined,
          profileImageUrl: creator.profileImageUrl || undefined,
          isLive,
          liveViewers,
          latestActivity: latestVideo?.createdAt || null,
        };
      })
    );

    // Sort creators:
    // 1. Live creators first (by viewers descending)
    // 2. Then by latest activity (most recent first)
    creatorsWithActivity.sort((a, b) => {
      // Live creators always come first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // If both are live, sort by viewers
      if (a.isLive && b.isLive) {
        return (b.liveViewers || 0) - (a.liveViewers || 0);
      }
      
      // Otherwise, sort by latest activity
      const aTime = a.latestActivity?.getTime() || 0;
      const bTime = b.latestActivity?.getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ creators: creatorsWithActivity });
  } catch (error) {
    console.error('Error fetching subscribed creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribed creators' },
      { status: 500 }
    );
  }
}

