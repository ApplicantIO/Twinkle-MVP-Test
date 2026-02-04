/**
 * Quick script to check if videos exist in the database
 */

import { prisma } from '../lib/prisma';

async function checkVideos() {
  try {
    const videoCount = await prisma.video.count();
    console.log(`\n📊 Total videos in database: ${videoCount}\n`);

    if (videoCount === 0) {
      console.log('❌ No videos found in database.');
      console.log('   Upload videos via Creator Studio: /studio\n');
      return;
    }

    const videos = await prisma.video.findMany({
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📹 Recent videos:\n');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Creator: ${video.user?.name || 'Unknown'} (${video.user?.email})`);
      console.log(`   Views: ${video.views}`);
      console.log(`   Created: ${video.createdAt}`);
      console.log(`   URL: ${video.videoUrl.substring(0, 50)}...`);
      console.log('');
    });

    const creators = await prisma.user.findMany({
      where: { role: 'creator' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { videos: true },
        },
      },
    });

    console.log('👤 Creators:\n');
    creators.forEach((creator) => {
      console.log(`- ${creator.name || 'Unknown'} (${creator.email})`);
      console.log(`  Videos: ${creator._count.videos}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideos();

