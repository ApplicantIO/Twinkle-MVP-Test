import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { generateWatchMetadata } from "@/lib/seo/metadata";
import { videoObjectSchema } from "@/lib/seo/schemas";
import WatchPageClient from "./WatchPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return generateWatchMetadata(id);
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let videoSchema: ReturnType<typeof videoObjectSchema> | null = null;

  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (video) {
      videoSchema = videoObjectSchema({
        id: video.id,
        title: video.title,
        description: video.description ?? video.title,
        thumbnailUrl: video.thumbnailUrl ?? "",
        videoUrl: video.videoUrl,
        createdAt: video.createdAt.toISOString(),
        views: video.views,
        creatorName: video.user.name ?? "Twinkle",
        creatorUsername: video.user.name ?? "twinkle",
      });
    }
  } catch {
    // JSON-LD is optional; page still renders without it
  }

  return (
    <>
      {videoSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      ) : null}
      <WatchPageClient />
    </>
  );
}
