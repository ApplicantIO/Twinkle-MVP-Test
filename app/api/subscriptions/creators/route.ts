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

    // Get latest video for each creator to determine activity and live status
    const creatorsWithActivity: CreatorWithActivity[] = await Promise.all(
      creators.map(async (creator) => {
        // Get latest video to determine activity timestamp and live status
        const latestVideo = await prisma.video.findFirst({
          where: { userId: creator.id },
          orderBy: { createdAt: 'desc' },
          select: { 
            createdAt: true,
            // NOTE: isLive and liveViewers fields are hardcoded to false/0 because
            // they don't exist in the Prisma schema yet. To properly implement:
            // 1. Add "isLive Boolean @default(false)" and "liveViewers Int?" to Video model
            // 2. Run: npx prisma migrate dev --name add_video_live_fields
            // 3. Uncomment the lines below and remove hardcoding:
            // isLive: true,
            // liveViewers: true,
          },
        });

        // Get the most recent activity timestamp
        const latestActivity = latestVideo?.createdAt || null;

        // Check live status from latest video (default to false if field doesn't exist)
        // @ts-ignore - isLive may not exist in schema
        const isLive = latestVideo?.isLive === true;
        // @ts-ignore - liveViewers may not exist in schema
        const liveViewers = (latestVideo?.liveViewers as number) || 0;

        return {
          id: creator.id,
          name: creator.name || undefined,
          profileImageUrl: creator.profileImageUrl || undefined,
          isLive: isLive || false, // Default to false if not available
          liveViewers: liveViewers || 0,
          latestActivity,
        };
      })
    );

    // Sort creators with strict priority: LIVE > LIFO (Latest In, First Out)
    // 1. HIGHEST PRIORITY: Live creators ALWAYS appear first, regardless of timestamp
    // 2. SECONDARY PRIORITY: All other creators sorted by latest activity (LIFO - newest first)
    creatorsWithActivity.sort((a, b) => {
      // Priority 1: LIVE videos/broadcasts ALWAYS on top
      if (a.isLive && !b.isLive) return -1; // a is live, b is not -> a comes first
      if (!a.isLive && b.isLive) return 1;  // b is live, a is not -> b comes first
      
      // If both are live, maintain their relative order (or sort by viewers if needed)
      // For now, we keep the order as-is for live items
      if (a.isLive && b.isLive) {
        // Optional: Sort live creators by viewer count (highest first)
        return (b.liveViewers || 0) - (a.liveViewers || 0);
      }
      
      // Priority 2: LIFO - Sort by latest activity timestamp (newest first)
      // Most recent activity appears first (Last In, First Out)
      const aTime = a.latestActivity?.getTime() || 0;
      const bTime = b.latestActivity?.getTime() || 0;
      
      // If no activity timestamp, push to bottom
      if (aTime === 0 && bTime === 0) return 0;
      if (aTime === 0) return 1;  // a has no activity -> a goes to bottom
      if (bTime === 0) return -1; // b has no activity -> b goes to bottom
      
      // LIFO: Newer timestamp (larger number) comes first
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

