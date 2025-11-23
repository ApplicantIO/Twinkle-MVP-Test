import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getUserSubscriptions } from '@/lib/firebase/subscriptions';
import { Video } from '@/types';

// Sample videos for design purposes when database is empty
function getSampleVideos(): any[] {
  const sampleVideos = [
    {
      id: 'sample-1',
      userId: 'sample-creator-1',
      title: 'Getting Started with Twinkle - Platform Overview',
      description: 'Learn about the amazing features of Twinkle platform',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      views: 125000,
      category: 'Tutorial',
      type: 'free',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'sample-2',
      userId: 'sample-creator-2',
      title: 'Top 10 Features You Need to Know',
      description: 'Discover the most useful features on Twinkle',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      views: 89000,
      category: 'Education',
      type: 'paid',
      price: 50000,
      currency: 'UZS',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-2',
        name: 'Tech Reviews',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Tech+Reviews&background=10b981&color=fff&size=128',
      },
    },
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
      id: 'sample-3',
      userId: 'sample-creator-1',
      title: 'How to Create Amazing Content',
      description: 'Tips and tricks for content creators',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
      views: 156000,
      category: 'Tutorial',
      type: 'subscription',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'sample-4',
      userId: 'sample-creator-3',
      title: 'Best Practices for Video Production',
      description: 'Professional video production techniques',
      thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
      views: 234000,
      category: 'Education',
      type: 'paid',
      price: 75000,
      currency: 'UZS',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-3',
        name: 'Creative Studio',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=f59e0b&color=fff&size=128',
      },
    },
    {
      id: 'sample-5',
      userId: 'sample-creator-2',
      title: 'Understanding the Platform Interface',
      description: 'A detailed walkthrough of the Twinkle interface',
      thumbnailUrl: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/L_jWHffIx5E',
      views: 67000,
      category: 'Tutorial',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-2',
        name: 'Tech Reviews',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Tech+Reviews&background=10b981&color=fff&size=128',
      },
    },
    {
      id: 'sample-6',
      userId: 'sample-creator-4',
      title: 'Community Highlights - Best of This Week',
      description: 'Check out the best content from our community',
      thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ',
      views: 189000,
      category: 'Entertainment',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-4',
        name: 'Community Hub',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Community+Hub&background=ec4899&color=fff&size=128',
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
      id: 'sample-7',
      userId: 'sample-creator-1',
      title: 'Advanced Features Tutorial',
      description: 'Learn about advanced features and settings',
      thumbnailUrl: 'https://img.youtube.com/vi/ZbZSe6N_BXs/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/ZbZSe6N_BXs',
      views: 98000,
      category: 'Tutorial',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'sample-8',
      userId: 'sample-creator-3',
      title: 'Behind the Scenes - How We Built Twinkle',
      description: 'An inside look at the development process',
      thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      views: 145000,
      category: 'Behind the Scenes',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-3',
        name: 'Creative Studio',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=f59e0b&color=fff&size=128',
      },
    },
    {
      id: 'sample-9',
      userId: 'sample-creator-2',
      title: 'Tips for Growing Your Channel',
      description: 'Expert advice on growing your audience',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
      views: 112000,
      category: 'Education',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-2',
        name: 'Tech Reviews',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Tech+Reviews&background=10b981&color=fff&size=128',
      },
    },
    {
      id: 'sample-10',
      userId: 'sample-creator-4',
      title: 'Weekly Update - New Features Released',
      description: 'Stay updated with the latest platform features',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      views: 76000,
      category: 'News',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-4',
        name: 'Community Hub',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Community+Hub&background=ec4899&color=fff&size=128',
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
    {
      id: 'sample-11',
      userId: 'sample-creator-1',
      title: 'Getting Started Guide for New Users',
      description: 'Everything you need to know to get started',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      views: 203000,
      category: 'Tutorial',
      createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-1',
        name: 'Twinkle Official',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=6366f1&color=fff&size=128',
      },
    },
    {
      id: 'sample-12',
      userId: 'sample-creator-3',
      title: 'Creative Content Ideas for Your Channel',
      description: 'Inspiration for your next video project',
      thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
      views: 134000,
      category: 'Education',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      updatedAt: new Date(),
      user: {
        id: 'sample-creator-3',
        name: 'Creative Studio',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=f59e0b&color=fff&size=128',
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

