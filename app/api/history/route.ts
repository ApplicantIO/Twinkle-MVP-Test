import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET: Fetch watch history for authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const history = await prisma.watchHistory.findMany({
      where: {
        userId: payload.id,
      },
      orderBy: {
        lastWatchedAt: 'desc',
      },
      take: 100, // Limit to last 100 entries
      include: {
        video: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching watch history:', error);
    
    // Handle specific Prisma errors
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      // Table doesn't exist - return empty array instead of error
      // This can happen if schema hasn't been migrated yet
      return NextResponse.json({ history: [] });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch watch history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST: Save or update watch history entry
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, progress, videoDuration, playlistId } = body;

    if (!videoId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, progress' },
        { status: 400 }
      );
    }

    // Upsert: Update if exists, create if not
    const historyEntry = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: payload.id,
          videoId: videoId,
        },
      },
      update: {
        progress: progress,
        videoDuration: videoDuration || null,
        playlistId: playlistId || null,
        lastWatchedAt: new Date(),
      },
      create: {
        userId: payload.id,
        videoId: videoId,
        progress: progress,
        videoDuration: videoDuration || null,
        playlistId: playlistId || null,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, history: historyEntry });
  } catch (error: any) {
    console.error('Error saving watch history:', error);
    
    // Handle specific Prisma errors
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      // Table doesn't exist - return error indicating migration needed
      return NextResponse.json(
        { 
          error: 'Watch history table not found. Please run database migration.',
          code: 'MIGRATION_NEEDED'
        },
        { status: 503 } // Service Unavailable - temporary state
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save watch history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: Clear all watch history for authenticated user
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await prisma.watchHistory.deleteMany({
      where: {
        userId: payload.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing watch history:', error);
    
    // Handle specific Prisma errors
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      // Table doesn't exist - return success anyway (nothing to clear)
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to clear watch history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
