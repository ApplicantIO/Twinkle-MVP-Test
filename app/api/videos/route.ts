import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getUserSubscriptions } from '@/lib/firebase/subscriptions';
import { Video } from '@/types';

// Sample videos for design purposes when database is empty
function getSampleVideos(): any[] {
  const sampleVideos = [
    // Live videos
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
      createdAt: new Date(), // Live now
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
      createdAt: new Date(), // Live now
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
      createdAt: new Date(), // Live now
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-7',
        name: 'Premium Music Live',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Premium+Music&background=10b981&color=fff&size=128',
      },
    },
    // Imported YouTube videos
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
    // Twinkle Star Test Video
    {
      id: 'twinkle_star_test_video',
      userId: 'twinkle-creator-1',
      title: 'Twinkle Star Test',
      description: 'A test video for the Twinkle platform featuring the official Twinkle Star content.',
      thumbnailUrl: 'https://ui-avatars.com/api/?name=Twinkle+Star&background=7C5FD9&color=fff&size=128',
      videoUrl: '/videos/twinkle-video.mp4',
      views: 12500,
      category: 'Entertainment',
      type: 'free',
      duration: 15,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'twinkle-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128',
      },
    },
    // Twinkle Star - Paid Content Test
    {
      id: 'twinkle_paid_content',
      userId: 'twinkle-creator-1',
      title: 'Twinkle Star - Paid Content Test',
      description: 'A test video for the Twinkle platform featuring paid content. This video requires purchase to view.',
      thumbnailUrl: 'https://ui-avatars.com/api/?name=Twinkle+Star&background=7C5FD9&color=fff&size=128',
      videoUrl: '/videos/twinkle-video.mp4',
      views: 8500,
      category: 'Entertainment',
      type: 'paid',
      price: 4.99,
      currency: 'USD',
      duration: 15,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'twinkle-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128',
      },
    },
    // Twinkle Star - Membership Content Test
    {
      id: 'twinkle_membership_content',
      userId: 'twinkle-creator-1',
      title: 'Twinkle Star - Membership Content Test',
      description: 'A test video for the Twinkle platform featuring subscription/membership content. This video requires channel membership to view.',
      thumbnailUrl: 'https://ui-avatars.com/api/?name=Twinkle+Star&background=7C5FD9&color=fff&size=128',
      videoUrl: '/videos/twinkle-video.mp4',
      views: 6200,
      category: 'Entertainment',
      type: 'subscription',
      duration: 15,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      user: {
        id: 'twinkle-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128',
      },
    },
    // Twinkle Live Video Test
    {
      id: 'twinkle_live_video_test',
      userId: 'twinkle-creator-1',
      title: 'Twinkle Live Video Test',
      description: 'A live streaming test video for the Twinkle platform.',
      thumbnailUrl: 'https://ui-avatars.com/api/?name=Twinkle+Live&background=ef4444&color=fff&size=128',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      views: 5000,
      liveViewers: 1200,
      category: 'Entertainment',
      type: 'free',
      isLive: true,
      createdAt: new Date(), // Live now
      updatedAt: new Date(),
      user: {
        id: 'twinkle-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128',
      },
    },
  ];

  return sampleVideos;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

    let videos;

  try {

    if (userId) {
      try {
      videos = await prisma.video.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      } catch (dbError) {
        console.error('Database query failed:', dbError);
        videos = [];
      }
    } else if (search) {
      try {
      videos = await prisma.video.findMany({
        where: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
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
        orderBy: { createdAt: 'desc' },
      });
      } catch (dbError) {
        console.error('Database query failed:', dbError);
        videos = [];
      }
    } else {
      // Homepage feed: prioritize subscribed creators, then show recommendations
      try {
        let subscribedCreatorIds: string[] = [];
        
        if (token) {
          try {
            const payload = verifyToken(token);
            try {
              subscribedCreatorIds = await getUserSubscriptions(payload.id);
            } catch (firebaseError) {
              // If Firebase is not configured or there's an error, continue without subscriptions
              console.error('Error fetching subscriptions from Firebase (continuing without subscriptions):', firebaseError);
            }
          } catch (tokenError) {
            // Invalid token, continue without subscriptions
            console.error('Invalid token (continuing without subscriptions):', tokenError);
          }
        }

        // Fetch all videos
        const allVideos = await prisma.video.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
          take: 100,
        });

        // Separate videos from subscribed creators and others
        const subscribedVideos: typeof allVideos = [];
        const recommendedVideos: typeof allVideos = [];

        allVideos.forEach((video) => {
          if (subscribedCreatorIds.length > 0 && subscribedCreatorIds.includes(video.userId)) {
            subscribedVideos.push(video);
          } else {
            recommendedVideos.push(video);
          }
        });

        // Combine: subscribed first, then recommendations
        videos = [...subscribedVideos, ...recommendedVideos].slice(0, 50);

        // If no videos found, return sample videos for design purposes
        if (videos.length === 0) {
          videos = getSampleVideos();
        }
      } catch (dbError) {
        // If database query fails, return sample videos for design purposes
        console.error('Database query failed, returning sample videos:', dbError);
        videos = getSampleVideos();
      }
    }

    return NextResponse.json({ videos });
  } catch (_error: unknown) {
    console.error('Error fetching videos:', _error);
    // If there's any error, return sample videos for design purposes
    // This ensures the homepage always works even if database is not connected
    try {
      videos = getSampleVideos();
      return NextResponse.json({ videos });
    } catch (sampleError) {
      console.error('Error getting sample videos:', sampleError);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
    }
  }
}

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

    const { title, description, videoUrl, thumbnailUrl, category } = await request.json();

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Title and video URL are required' },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
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

    return NextResponse.json({ video }, { status: 201 });
  } catch (_error: unknown) {
    console.error('Error creating video:', _error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

