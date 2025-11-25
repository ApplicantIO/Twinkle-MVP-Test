import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Sample videos for design purposes when database is empty
function getSampleVideoById(id: string): any | null {
  const sampleVideos = [
    {
      id: 'sample-live-1',
      userId: 'sample-creator-5',
      title: 'Lo-Fi Hip Hop Radio - Beats to Relax/Study To',
      description: 'Chill beats for studying, working, and relaxing',
      thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      views: 0,
      liveViewers: 1500,
      category: 'Music',
      type: 'free',
      isLive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-5',
        name: 'Lo-Fi Girl',
        profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128',
      },
    },
    {
      id: 'sample-live-2',
      userId: 'sample-creator-6',
      title: 'Live Masterclass: Advanced Video Editing Techniques',
      description: 'Join us for a live masterclass on professional video editing',
      thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      views: 0,
      liveViewers: 300,
      category: 'Education',
      type: 'paid',
      price: 80000,
      currency: 'UZS',
      isLive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-6',
        name: 'Pro Video Academy',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Pro+Video&background=ef4444&color=fff&size=128',
      },
    },
    {
      id: 'sample-live-3',
      userId: 'sample-creator-7',
      title: 'Premium Concert Live Stream - Exclusive Performance',
      description: 'Join us for an exclusive live concert performance',
      thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ',
      views: 0,
      liveViewers: 5200,
      category: 'Entertainment',
      type: 'subscription',
      isLive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-7',
        name: 'Premium Music Live',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Premium+Music&background=10b981&color=fff&size=128',
      },
    },
    {
      id: 'youtube-C4qJeIjNd2U',
      userId: 'youtube-creator-1',
      title: 'Lo-Fi Girl - Live Stream',
      description: 'Chill beats for studying and relaxing',
      thumbnailUrl: 'https://img.youtube.com/vi/C4qJeIjNd2U/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/C4qJeIjNd2U',
      views: 1250000,
      category: 'Music',
      type: 'free',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-1',
        name: 'Lo-Fi Girl',
        profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128',
      },
    },
    {
      id: 'youtube-O96OfsXdygU',
      userId: 'youtube-creator-2',
      title: "Konsta - Do'st (Official Music Video)",
      description: 'Official music video',
      thumbnailUrl: 'https://img.youtube.com/vi/O96OfsXdygU/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/O96OfsXdygU',
      views: 850000,
      category: 'Music',
      type: 'free',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-2',
        name: 'Konsta',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=ef4444&color=fff&size=128',
      },
    },
    {
      id: 'youtube-jX3Sz7OGE24',
      userId: 'youtube-creator-3',
      title: 'UPG Video',
      description: 'UPG content',
      thumbnailUrl: 'https://img.youtube.com/vi/jX3Sz7OGE24/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jX3Sz7OGE24',
      views: 450000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-3',
        name: 'UPG',
        profileImageUrl: 'https://ui-avatars.com/api/?name=UPG&background=10b981&color=fff&size=128',
      },
    },
    {
      id: 'youtube-KusNJWidU4E',
      userId: 'youtube-creator-4',
      title: 'Ixa Reaksiya',
      description: 'Reaction video',
      thumbnailUrl: 'https://img.youtube.com/vi/KusNJWidU4E/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/KusNJWidU4E',
      views: 320000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-4',
        name: 'Ixa Reaksiya',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Ixa&background=ec4899&color=fff&size=128',
      },
    },
    {
      id: 'youtube-oqZGEwKW1SA',
      userId: 'youtube-creator-5',
      title: "O'zimiz Uz",
      description: 'Uzbek content',
      thumbnailUrl: 'https://img.youtube.com/vi/oqZGEwKW1SA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/oqZGEwKW1SA',
      views: 680000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-5',
        name: "O'zimiz Uz",
        profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'youtube-MTQDIQ3XsjA',
      userId: 'youtube-creator-6',
      title: 'Reaktor',
      description: 'Reactor content',
      thumbnailUrl: 'https://img.youtube.com/vi/MTQDIQ3XsjA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/MTQDIQ3XsjA',
      views: 520000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-6',
        name: 'Reaktor',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Reaktor&background=f59e0b&color=fff&size=128',
      },
    },
    {
      id: 'youtube-jHxPEAzaay4',
      userId: 'youtube-creator-7',
      title: 'NQE Podcast',
      description: 'Podcast episode',
      thumbnailUrl: 'https://img.youtube.com/vi/jHxPEAzaay4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jHxPEAzaay4',
      views: 180000,
      category: 'Podcast',
      type: 'free',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-7',
        name: 'NQE Podcast',
        profileImageUrl: 'https://ui-avatars.com/api/?name=NQE&background=8b5cf6&color=fff&size=128',
      },
    },
    {
      id: 'youtube-EzvbW5QiYaA',
      userId: 'youtube-creator-8',
      title: 'Kunduziy',
      description: 'Kunduziy content',
      thumbnailUrl: 'https://img.youtube.com/vi/EzvbW5QiYaA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/EzvbW5QiYaA',
      views: 290000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-8',
        name: 'Kunduziy',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Kunduziy&background=10b981&color=fff&size=128',
      },
    },
    {
      id: 'youtube-f6LcqfWPRKc',
      userId: 'youtube-creator-9',
      title: 'Ziyokhonov',
      description: 'Ziyokhonov content',
      thumbnailUrl: 'https://img.youtube.com/vi/f6LcqfWPRKc/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/f6LcqfWPRKc',
      views: 410000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-9',
        name: 'Ziyokhonov',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Ziyokhonov&background=ef4444&color=fff&size=128',
      },
    },
    {
      id: 'youtube-4ymODZahOc4',
      userId: 'youtube-creator-10',
      title: 'Subyektiv',
      description: 'Subyektiv content',
      thumbnailUrl: 'https://img.youtube.com/vi/4ymODZahOc4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/4ymODZahOc4',
      views: 360000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-10',
        name: 'Subyektiv',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Subyektiv&background=ec4899&color=fff&size=128',
      },
    },
    {
      id: 'youtube-moC2ww1EPFc',
      userId: 'youtube-creator-11',
      title: 'Abuser',
      description: 'Abuser content',
      thumbnailUrl: 'https://img.youtube.com/vi/moC2ww1EPFc/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/moC2ww1EPFc',
      views: 240000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-11',
        name: 'Abuser',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Abuser&background=f59e0b&color=fff&size=128',
      },
    },
    {
      id: 'youtube-LPTKcovO2X0',
      userId: 'youtube-creator-12',
      title: 'Laylo - Music Video',
      description: 'Laylo official music video',
      thumbnailUrl: 'https://img.youtube.com/vi/LPTKcovO2X0/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/LPTKcovO2X0',
      views: 950000,
      category: 'Music',
      type: 'free',
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-12',
        name: 'Laylo',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Laylo&background=8b5cf6&color=fff&size=128',
      },
    },
    {
      id: 'youtube-JFB-LfJzLcQ',
      userId: 'youtube-creator-12',
      title: 'Laylo - Half-blood (Official Lyric Video)',
      description: 'Official lyric video',
      thumbnailUrl: 'https://img.youtube.com/vi/JFB-LfJzLcQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/JFB-LfJzLcQ',
      views: 720000,
      category: 'Music',
      type: 'free',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-12',
        name: 'Laylo',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Laylo&background=8b5cf6&color=fff&size=128',
      },
    },
    {
      id: 'youtube-Bybqwt4RCjI',
      userId: 'youtube-creator-13',
      title: 'Nma Gap shaha dolimov',
      description: 'Nma Gap content',
      thumbnailUrl: 'https://img.youtube.com/vi/Bybqwt4RCjI/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/Bybqwt4RCjI',
      views: 580000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-13',
        name: 'Nma Gap',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Nma+Gap&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'youtube-enaOSQEDhfk',
      userId: 'youtube-creator-14',
      title: 'Mirshakar Fayzullayev',
      description: 'Mirshakar Fayzullayev content',
      thumbnailUrl: 'https://img.youtube.com/vi/enaOSQEDhfk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/enaOSQEDhfk',
      views: 380000,
      category: 'Entertainment',
      type: 'free',
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'youtube-creator-14',
        name: 'Mirshakar Fayzullayev',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Mirshakar&background=10b981&color=fff&size=128',
      },
    },
  ];

  return sampleVideos.find(v => v.id === id) || null;
}

// GET funksiyasida context param types ishlatildi
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; 
  
  try {
    let video;
    
    try {
      video = await prisma.video.findUnique({
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
    } catch (dbError) {
      // If database query fails, try sample videos
      console.error('Database query failed, trying sample videos:', dbError);
      video = null;
    }

    // If not found in database, try sample videos
    if (!video) {
      const sampleVideo = getSampleVideoById(id);
      if (sampleVideo) {
        return NextResponse.json({ video: sampleVideo });
      }
      
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Increment view count (only for database videos)
    try {
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
    } catch (updateError) {
      // Ignore update errors for sample videos
      console.error('Error updating video stats:', updateError);
    }

    return NextResponse.json({ video });
  } catch (_error: unknown) {
    console.error('Error fetching video:', _error);
    // Try sample videos as fallback
    const sampleVideo = getSampleVideoById(id);
    if (sampleVideo) {
      return NextResponse.json({ video: sampleVideo });
    }
    
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