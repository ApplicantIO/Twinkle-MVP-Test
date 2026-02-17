import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Sample creators (username -> profile) for when DB has no User record */
const SAMPLE_CREATORS: Record<
  string,
  { id: string; username: string; name: string; profileImageUrl: string }
> = {
  konsta: { id: 'konsta-creator', username: 'konsta', name: 'Konsta', profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=7C5FD9&color=fff&size=128' },
  'konsta-creator': { id: 'konsta-creator', username: 'konsta', name: 'Konsta', profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=7C5FD9&color=fff&size=128' },
  lofigirl: { id: 'youtube-creator-1', username: 'lofigirl', name: 'Lo-Fi Girl', profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128' },
  'lofi-girl': { id: 'youtube-creator-1', username: 'lofigirl', name: 'Lo-Fi Girl', profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128' },
  'youtube-creator-1': { id: 'youtube-creator-1', username: 'lofigirl', name: 'Lo-Fi Girl', profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128' },
  konsta2: { id: 'youtube-creator-2', username: 'konsta2', name: 'Konsta', profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=ef4444&color=fff&size=128' },
  'youtube-creator-2': { id: 'youtube-creator-2', username: 'konsta2', name: 'Konsta', profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=ef4444&color=fff&size=128' },
  upg: { id: 'youtube-creator-3', username: 'upg', name: 'UPG', profileImageUrl: 'https://ui-avatars.com/api/?name=UPG&background=10b981&color=fff&size=128' },
  'youtube-creator-3': { id: 'youtube-creator-3', username: 'upg', name: 'UPG', profileImageUrl: 'https://ui-avatars.com/api/?name=UPG&background=10b981&color=fff&size=128' },
  'ixa-reaksiya': { id: 'youtube-creator-4', username: 'ixa-reaksiya', name: 'Ixa Reaksiya', profileImageUrl: 'https://ui-avatars.com/api/?name=Ixa&background=ec4899&color=fff&size=128' },
  'youtube-creator-4': { id: 'youtube-creator-4', username: 'ixa-reaksiya', name: 'Ixa Reaksiya', profileImageUrl: 'https://ui-avatars.com/api/?name=Ixa&background=ec4899&color=fff&size=128' },
  ozimiz: { id: 'youtube-creator-5', username: 'ozimiz', name: "O'zimiz Uz", profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128' },
  'youtube-creator-5': { id: 'youtube-creator-5', username: 'ozimiz', name: "O'zimiz Uz", profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128' },
  'sample-creator-5': { id: 'sample-creator-5', username: 'lofigirl', name: 'Lo-Fi Girl', profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128' },
  'sample-creator-1': { id: 'sample-creator-1', username: 'ozimiz', name: "O'zimiz", profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128' },
  romalive: { id: 'sample-creator-2', username: 'romalive', name: 'Roma Live', profileImageUrl: 'https://ui-avatars.com/api/?name=Roma+Live&background=ef4444&color=fff&size=128' },
  'sample-creator-2': { id: 'sample-creator-2', username: 'romalive', name: 'Roma Live', profileImageUrl: 'https://ui-avatars.com/api/?name=Roma+Live&background=ef4444&color=fff&size=128' },
  gta6daily: { id: 'sample-creator-3', username: 'gta6daily', name: 'GTA 6 Daily', profileImageUrl: 'https://ui-avatars.com/api/?name=GTA6&background=10b981&color=fff&size=128' },
  'sample-creator-3': { id: 'sample-creator-3', username: 'gta6daily', name: 'GTA 6 Daily', profileImageUrl: 'https://ui-avatars.com/api/?name=GTA6&background=10b981&color=fff&size=128' },
  'sample-creator-4': { id: 'sample-creator-4', username: 'twinkle', name: 'Twinkle Official', profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=8b5cf6&color=fff&size=128' },
  creativestudio: { id: 'sample-creator-5', username: 'creativestudio', name: 'Creative Studio', profileImageUrl: 'https://ui-avatars.com/api/?name=Creative&background=f59e0b&color=fff&size=128' },
  provideoacademy: { id: 'sample-creator-6', username: 'provideoacademy', name: 'Pro Video Academy', profileImageUrl: 'https://ui-avatars.com/api/?name=Pro+Video&background=ef4444&color=fff&size=128' },
  'sample-creator-6': { id: 'sample-creator-6', username: 'provideoacademy', name: 'Pro Video Academy', profileImageUrl: 'https://ui-avatars.com/api/?name=Pro+Video&background=ef4444&color=fff&size=128' },
  premiummusic: { id: 'sample-creator-7', username: 'premiummusic', name: 'Premium Music Live', profileImageUrl: 'https://ui-avatars.com/api/?name=Premium+Music&background=10b981&color=fff&size=128' },
  'sample-creator-7': { id: 'sample-creator-7', username: 'premiummusic', name: 'Premium Music Live', profileImageUrl: 'https://ui-avatars.com/api/?name=Premium+Music&background=10b981&color=fff&size=128' },
  twinkle: { id: 'twinkle-creator-1', username: 'twinkle', name: 'Twinkle Official', profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128' },
  twinkleofficial: { id: 'twinkle-creator-1', username: 'twinkle', name: 'Twinkle Official', profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128' },
  'twinkle-creator-1': { id: 'twinkle-creator-1', username: 'twinkle', name: 'Twinkle Official', profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle+Official&background=7C5FD9&color=fff&size=128' },
  upggaming: { id: 'upg-gaming-creator', username: 'upggaming', name: 'UPG Gaming', profileImageUrl: 'https://ui-avatars.com/api/?name=UPG+Gaming&background=ef4444&color=fff&size=128' },
  'upg-gaming-creator': { id: 'upg-gaming-creator', username: 'upggaming', name: 'UPG Gaming', profileImageUrl: 'https://ui-avatars.com/api/?name=UPG+Gaming&background=ef4444&color=fff&size=128' },
  reaktor: { id: 'youtube-creator-6', username: 'reaktor', name: 'Reaktor', profileImageUrl: 'https://ui-avatars.com/api/?name=Reaktor&background=f59e0b&color=fff&size=128' },
  'youtube-creator-6': { id: 'youtube-creator-6', username: 'reaktor', name: 'Reaktor', profileImageUrl: 'https://ui-avatars.com/api/?name=Reaktor&background=f59e0b&color=fff&size=128' },
  nqepodcast: { id: 'youtube-creator-7', username: 'nqepodcast', name: 'NQE Podcast', profileImageUrl: 'https://ui-avatars.com/api/?name=NQE&background=8b5cf6&color=fff&size=128' },
  'youtube-creator-7': { id: 'youtube-creator-7', username: 'nqepodcast', name: 'NQE Podcast', profileImageUrl: 'https://ui-avatars.com/api/?name=NQE&background=8b5cf6&color=fff&size=128' },
  kunduziy: { id: 'youtube-creator-8', username: 'kunduziy', name: 'Kunduziy', profileImageUrl: 'https://ui-avatars.com/api/?name=Kunduziy&background=10b981&color=fff&size=128' },
  'youtube-creator-8': { id: 'youtube-creator-8', username: 'kunduziy', name: 'Kunduziy', profileImageUrl: 'https://ui-avatars.com/api/?name=Kunduziy&background=10b981&color=fff&size=128' },
  ziyokhonov: { id: 'youtube-creator-9', username: 'ziyokhonov', name: 'Ziyokhonov', profileImageUrl: 'https://ui-avatars.com/api/?name=Ziyokhonov&background=ef4444&color=fff&size=128' },
  'youtube-creator-9': { id: 'youtube-creator-9', username: 'ziyokhonov', name: 'Ziyokhonov', profileImageUrl: 'https://ui-avatars.com/api/?name=Ziyokhonov&background=ef4444&color=fff&size=128' },
  subyektiv: { id: 'youtube-creator-10', username: 'subyektiv', name: 'Subyektiv', profileImageUrl: 'https://ui-avatars.com/api/?name=Subyektiv&background=ec4899&color=fff&size=128' },
  'youtube-creator-10': { id: 'youtube-creator-10', username: 'subyektiv', name: 'Subyektiv', profileImageUrl: 'https://ui-avatars.com/api/?name=Subyektiv&background=ec4899&color=fff&size=128' },
  abuser: { id: 'youtube-creator-11', username: 'abuser', name: 'Abuser', profileImageUrl: 'https://ui-avatars.com/api/?name=Abuser&background=f59e0b&color=fff&size=128' },
  'youtube-creator-11': { id: 'youtube-creator-11', username: 'abuser', name: 'Abuser', profileImageUrl: 'https://ui-avatars.com/api/?name=Abuser&background=f59e0b&color=fff&size=128' },
  laylo: { id: 'youtube-creator-12', username: 'laylo', name: 'Laylo', profileImageUrl: 'https://ui-avatars.com/api/?name=Laylo&background=8b5cf6&color=fff&size=128' },
  'youtube-creator-12': { id: 'youtube-creator-12', username: 'laylo', name: 'Laylo', profileImageUrl: 'https://ui-avatars.com/api/?name=Laylo&background=8b5cf6&color=fff&size=128' },
  nmagap: { id: 'youtube-creator-13', username: 'nmagap', name: 'Nma Gap', profileImageUrl: 'https://ui-avatars.com/api/?name=Nma+Gap&background=6366f1&color=fff&size=128' },
  'youtube-creator-13': { id: 'youtube-creator-13', username: 'nmagap', name: 'Nma Gap', profileImageUrl: 'https://ui-avatars.com/api/?name=Nma+Gap&background=6366f1&color=fff&size=128' },
  mirshakar: { id: 'youtube-creator-14', username: 'mirshakar', name: 'Mirshakar Fayzullayev', profileImageUrl: 'https://ui-avatars.com/api/?name=Mirshakar&background=10b981&color=fff&size=128' },
  'youtube-creator-14': { id: 'youtube-creator-14', username: 'mirshakar', name: 'Mirshakar Fayzullayev', profileImageUrl: 'https://ui-avatars.com/api/?name=Mirshakar&background=10b981&color=fff&size=128' },
};

/** Normalize slug for lookup (lowercase, trim) */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  const normalized = normalizeSlug(slug);

  try {
    // 1. Try DB: find by id
    let user = await prisma.user.findUnique({
      where: { id: slug },
      select: { id: true, username: true, name: true, profileImageUrl: true, bannerUrl: true, aboutText: true },
    });

    // 2. Try DB: find by username
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ username: { equals: normalized, mode: 'insensitive' } }, { username: slug }],
        },
        select: { id: true, username: true, name: true, profileImageUrl: true, bannerUrl: true, aboutText: true },
      });
    }

    // 3. Fallback: sample creators
    if (!user) {
      const sample = SAMPLE_CREATORS[normalized] ?? SAMPLE_CREATORS[slug];
      if (sample) {
        return NextResponse.json({
          creator: {
            id: sample.id,
            username: sample.username,
            name: sample.name,
            profileImageUrl: sample.profileImageUrl,
            bannerUrl: null,
            aboutText: null,
          },
        });
      }
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    return NextResponse.json({
      creator: {
        id: user.id,
        username: user.username ?? user.id,
        name: user.name ?? 'Unknown Creator',
        profileImageUrl: user.profileImageUrl ?? null,
        bannerUrl: user.bannerUrl ?? null,
        aboutText: user.aboutText ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching creator:', error);
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }
}
