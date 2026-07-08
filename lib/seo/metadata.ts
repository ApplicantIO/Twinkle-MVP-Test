import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OG_IMAGE, SITE_URL } from "./constants";

function normalizeUsername(username: string): string {
  const trimmed = username.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

export async function generateWatchMetadata(id: string): Promise<Metadata> {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!video) {
      return {
        title: "Video | Twinkle",
        description: "Twinkle platformasida video tomosha qiling.",
      };
    }

    const creatorName = video.user.name ?? "Twinkle";
    const title = `${video.title} — ${creatorName}`;
    const description =
      video.description?.slice(0, 160) ??
      `${video.title} — Twinkle platformasida tomosha qiling.`;
    const thumbnailUrl = video.thumbnailUrl ?? DEFAULT_OG_IMAGE;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/watch/${id}`,
      },
      openGraph: {
        type: "video.other",
        title,
        description,
        url: `${SITE_URL}/watch/${id}`,
        siteName: "Twinkle",
        images: [
          {
            url: thumbnailUrl,
            width: 1280,
            height: 720,
            alt: video.title,
          },
        ],
        videos: [
          {
            url: video.videoUrl,
            type: "video/mp4",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [thumbnailUrl],
      },
    };
  } catch {
    return {
      title: "Video | Twinkle",
      description: "Twinkle platformasida video tomosha qiling.",
    };
  }
}

export async function generateCreatorMetadata(
  username: string
): Promise<Metadata> {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    return {
      title: "Creator | Twinkle",
      description: "Twinkle'da creator profilini ko'ring.",
    };
  }

  try {
    const creator = await prisma.user.findFirst({
      where: {
        name: { equals: normalizedUsername, mode: "insensitive" },
        role: "creator",
      },
      select: {
        name: true,
        aboutText: true,
        profileImageUrl: true,
        bannerUrl: true,
      },
    });

    if (!creator?.name) {
      return {
        title: `@${normalizedUsername} | Twinkle`,
        description: "Twinkle'da creator profilini ko'ring.",
      };
    }

    const title = `${creator.name} (@${normalizedUsername}) | Twinkle`;
    const description =
      creator.aboutText?.slice(0, 160) ??
      `${creator.name} Twinkle platformasida kontent yaratuvchi.`;

    const ogImage =
      creator.bannerUrl ?? creator.profileImageUrl ?? DEFAULT_OG_IMAGE;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/${normalizedUsername}`,
      },
      openGraph: {
        type: "profile",
        title,
        description,
        url: `${SITE_URL}/${normalizedUsername}`,
        siteName: "Twinkle",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${creator.name} — Twinkle`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [creator.profileImageUrl ?? DEFAULT_OG_IMAGE],
      },
    };
  } catch {
    return {
      title: `@${normalizedUsername} | Twinkle`,
      description: "Twinkle'da creator profilini ko'ring.",
    };
  }
}

export function generateSearchMetadata(query?: string): Metadata {
  const trimmedQuery = query?.trim() ?? "";

  return {
    title: trimmedQuery
      ? `"${trimmedQuery}" — Qidiruv natijalari | Twinkle`
      : "Qidiruv | Twinkle",
    description: trimmedQuery
      ? `"${trimmedQuery}" bo'yicha Twinkle'dagi video va kreatorlar.`
      : "Twinkle'da video va kreatorlarni qidiring.",
    robots: {
      index: false,
      follow: true,
    },
  };
}
