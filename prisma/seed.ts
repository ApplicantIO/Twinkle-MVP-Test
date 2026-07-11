import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── USERS ───────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@twinkle.uz' },
    update: {},
    create: {
      email: 'admin@twinkle.uz',
      passwordHash,
      role: UserRole.admin,
      name: 'Twinkle Admin',
      username: 'twinkle_official',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Admin&background=7C5FD9&color=fff&size=128',
    },
  });

  const konsta = await prisma.user.upsert({
    where: { email: 'konsta@twinkle.uz' },
    update: {},
    create: {
      email: 'konsta@twinkle.uz',
      passwordHash,
      role: UserRole.creator,
      name: 'Konsta',
      username: 'konsta',
      aboutText: "O'zbek rap va hip-hop ijrochisi. Musiqa, she'riyat va san'at haqida.",
      profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=E53E3E&color=fff&size=128',
      bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=300&fit=crop',
    },
  });

  const ozimiz = await prisma.user.upsert({
    where: { email: 'ozimiz@twinkle.uz' },
    update: {},
    create: {
      email: 'ozimiz@twinkle.uz',
      passwordHash,
      role: UserRole.creator,
      name: "O'zimiz",
      username: 'ozimizuz',
      aboutText: "SHAXSIY ADOVATSIZ - YUMORISTIK TANQID. O'zbek komediya va entertainment kanali.",
      profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=FF6B35&color=fff&size=128',
      bannerUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=300&fit=crop',
    },
  });

  const reaktor = await prisma.user.upsert({
    where: { email: 'reaktor@twinkle.uz' },
    update: {},
    create: {
      email: 'reaktor@twinkle.uz',
      passwordHash,
      role: UserRole.creator,
      name: 'Reaktor',
      username: 'reaktor',
      aboutText: "Ilm-fan, texnologiya va jamiyat haqida chuqur tahlil.",
      profileImageUrl: 'https://ui-avatars.com/api/?name=Reaktor&background=38A169&color=fff&size=128',
      bannerUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=300&fit=crop',
    },
  });

  const upg = await prisma.user.upsert({
    where: { email: 'upg@twinkle.uz' },
    update: {},
    create: {
      email: 'upg@twinkle.uz',
      passwordHash,
      role: UserRole.creator,
      name: 'UPG Gaming',
      username: 'upggaming',
      aboutText: "O'zbek gaming va entertainment kanali.",
      profileImageUrl: 'https://ui-avatars.com/api/?name=UPG&background=3182CE&color=fff&size=128',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=300&fit=crop',
    },
  });

  const lofi = await prisma.user.upsert({
    where: { email: 'lofi@twinkle.uz' },
    update: {},
    create: {
      email: 'lofi@twinkle.uz',
      passwordHash,
      role: UserRole.creator,
      name: 'Lo-Fi Girl',
      username: 'lofigirl',
      aboutText: '24/7 lofi hip hop radio — beats to relax/study to.',
      profileImageUrl: 'https://ui-avatars.com/api/?name=LG&background=9F7AEA&color=fff&size=128',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=300&fit=crop',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@twinkle.uz' },
    update: {},
    create: {
      email: 'viewer@twinkle.uz',
      passwordHash,
      role: UserRole.viewer,
      name: 'Test Viewer',
      username: 'testviewer',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Test+Viewer&background=718096&color=fff&size=128',
    },
  });

  console.log('✅ Users created');

  // ─── VIDEOS ──────────────────────────────────────────────────────────────

  const dost = await prisma.video.upsert({
    where: { id: 'youtube-KO-dost' },
    update: {},
    create: {
      id: 'youtube-KO-dost',
      userId: konsta.id,
      title: "Konsta - Do'st (Official Music Video)",
      description: "Konsta'ning yangi musiqiy videosi. Do'stlik, sadoqat va hayot haqida.",
      thumbnailUrl: 'https://img.youtube.com/vi/jX3Sz7OGE24/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jX3Sz7OGE24',
      views: 850000,
      likes: 45000,
      category: 'Music',
    },
  });

  const vatan = await prisma.video.upsert({
    where: { id: 'youtube-KO-vatan' },
    update: {},
    create: {
      id: 'youtube-KO-vatan',
      userId: konsta.id,
      title: "Konsta - Vatan (Official Music Video)",
      description: "Vatanga bag'ishlangan kuy.",
      thumbnailUrl: 'https://img.youtube.com/vi/KusNJWidU4E/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/KusNJWidU4E',
      views: 620000,
      likes: 32000,
      category: 'Music',
    },
  });

  const kerosinchi = await prisma.video.upsert({
    where: { id: 'youtube-OZ-kerosinchi' },
    update: {},
    create: {
      id: 'youtube-OZ-kerosinchi',
      userId: ozimiz.id,
      title: "KEROSINCHI KELIN - KUNDUZIY & FARRUKH SHARIPOV | O'ZIMIZ",
      description: "O'zimiz'ning yangi komediya skechi.",
      thumbnailUrl: 'https://img.youtube.com/vi/C4qJeIjNd2U/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/C4qJeIjNd2U',
      views: 196000,
      likes: 12000,
      category: 'Comedy',
    },
  });

  const kichkina = await prisma.video.upsert({
    where: { id: 'youtube-OZ-kichkina' },
    update: {},
    create: {
      id: 'youtube-OZ-kichkina',
      userId: ozimiz.id,
      title: "KICHKINA TABIB - Dilshodbek Kattabekov & Farrux Sharipov | O'ZIMIZ",
      description: "Kichkina tabib haqida yumoristik skeч.",
      thumbnailUrl: 'https://img.youtube.com/vi/O96OfsXdygU/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/O96OfsXdygU',
      views: 154000,
      likes: 9800,
      category: 'Comedy',
    },
  });

  const burchakli = await prisma.video.upsert({
    where: { id: 'youtube-OZ-burchakli' },
    update: {},
    create: {
      id: 'youtube-OZ-burchakli',
      userId: ozimiz.id,
      title: "5 BURCHAKLI SEVGI - FARRUX SHARIPOV & IXA | O'ZIMIZ",
      description: "5 burchakli sevgi haqida komik dramatik hikoya.",
      thumbnailUrl: 'https://img.youtube.com/vi/oqZGEwKW1SA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/oqZGEwKW1SA',
      views: 206000,
      likes: 14500,
      category: 'Comedy',
    },
  });

  const science = await prisma.video.upsert({
    where: { id: 'youtube-RE-science' },
    update: {},
    create: {
      id: 'youtube-RE-science',
      userId: reaktor.id,
      title: "Reaktor - Ilm-fan va Jamiyat: Chuqur Tahlil (Official Video)",
      description: "Ilm-fan, texnologiya va zamonaviy jamiyat.",
      thumbnailUrl: 'https://img.youtube.com/vi/MTQDIQ3XsjA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/MTQDIQ3XsjA',
      views: 520000,
      likes: 28000,
      category: 'Education',
    },
  });

  await prisma.video.upsert({
    where: { id: 'youtube-RE-tech' },
    update: {},
    create: {
      id: 'youtube-RE-tech',
      userId: reaktor.id,
      title: "Sun'iy Intellekt O'zbekistonda: Imkoniyatlar va Xatarlar",
      description: "AI texnologiyalari O'zbekiston iqtisodiyotiga ta'siri.",
      thumbnailUrl: 'https://img.youtube.com/vi/jHxPEAzaay4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jHxPEAzaay4',
      views: 380000,
      likes: 19000,
      category: 'Education',
    },
  });

  await prisma.video.upsert({
    where: { id: 'youtube-UPG-stray' },
    update: {},
    create: {
      id: 'youtube-UPG-stray',
      userId: upg.id,
      title: "UPG - Stray'ni ma'nosi - Comedy Video Series (Official Video)",
      description: "UPG Gaming'ning yangi komediya video seriyasi.",
      thumbnailUrl: 'https://img.youtube.com/vi/EzvbW5QiYaA/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/EzvbW5QiYaA',
      views: 450000,
      likes: 23000,
      category: 'Gaming',
    },
  });

  await prisma.video.upsert({
    where: { id: 'youtube-LG-lofi' },
    update: {},
    create: {
      id: 'youtube-LG-lofi',
      userId: lofi.id,
      title: "Lofi Girl - 24/7 lofi hip hop radio - beats to relax/study to",
      description: "24/7 davomida lofi hip hop musiqa.",
      thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      views: 1300000,
      likes: 67000,
      category: 'Music',
    },
  });

  await prisma.video.upsert({
    where: { id: 'youtube-TW-intro' },
    update: {},
    create: {
      id: 'youtube-TW-intro',
      userId: admin.id,
      title: "Twinkle platformasini tanishtiramiz — Creator Monetization Platform",
      description: "Twinkle — O'zbekiston kreatorlari uchun monetizatsiya platformasi.",
      thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      views: 9000,
      likes: 1200,
      category: 'Technology',
    },
  });

  console.log('✅ 10 videos created');

  // ─── MOCK COMMENTS ───────────────────────────────────────────────────────

  // Do'st videosiga commentlar
  const comment1 = await prisma.comment.create({
    data: {
      videoId: dost.id,
      userId: viewer.id,
      content: "Bu qo'shiq juda zo'r! Konsta har safar yangi darajaga ko'tariladi 🔥",
      likes: 234,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: dost.id,
      userId: ozimiz.id,
      content: "Aka, bu videoni ko'rib ko'zlarim yoshlandi. Barakalla!",
      likes: 189,
    },
  });

  // Reply to comment1
  await prisma.comment.create({
    data: {
      videoId: dost.id,
      userId: reaktor.id,
      content: "Men ham shunday derdim, bu yil eng yaxshi o'zbek qo'shig'i!",
      likes: 67,
      parentId: comment1.id,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: dost.id,
      userId: upg.id,
      content: "Videography ham juda professional bo'libdi. Kim suratga oldi?",
      likes: 45,
    },
  });

  // Kerosinchi videosiga commentlar
  const comment2 = await prisma.comment.create({
    data: {
      videoId: kerosinchi.id,
      userId: viewer.id,
      content: "Kunduziy va Farrux dueti hammavaqt zo'r naticha beradi 😂",
      likes: 456,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: kerosinchi.id,
      userId: konsta.id,
      content: "O'zimiz har safar o'zidan o'tkazib yuboradi, chapak!",
      likes: 312,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: kerosinchi.id,
      userId: upg.id,
      content: "Shu epizodni 5 marta ko'rdim hali ham kulyapman 😂😂",
      likes: 198,
      parentId: comment2.id,
    },
  });

  // Science videosiga commentlar
  await prisma.comment.create({
    data: {
      videoId: science.id,
      userId: viewer.id,
      content: "Reaktor har doim miyamni ishlattirib qo'yadi. Rahmat bunday kontentlar uchun!",
      likes: 567,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: science.id,
      userId: konsta.id,
      content: "Bu mavzuni juda chuqur yoritibsiz. Davom eting!",
      likes: 234,
    },
  });

  await prisma.comment.create({
    data: {
      videoId: vatan.id,
      userId: viewer.id,
      content: "Vatan degan so'zni eshitganda yurak titraydi. Rahmat Konsta aka ❤️🇺🇿",
      likes: 890,
    },
  });

  console.log('✅ Mock comments created');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   admin@twinkle.uz / password123 (admin)');
  console.log('   konsta@twinkle.uz / password123 (creator)');
  console.log('   ozimiz@twinkle.uz / password123 (creator)');
  console.log('   viewer@twinkle.uz / password123 (viewer)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
