import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { generateCreatorMetadata } from "@/lib/seo/metadata";
import { creatorProfileSchema } from "@/lib/seo/schemas";
import CreatorProfileClient from "./CreatorProfileClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return generateCreatorMetadata(username);
}

function normalizeUsername(username: string): string {
  const trimmed = username.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);

  let profileSchema: ReturnType<typeof creatorProfileSchema> | null = null;

  if (username) {
    try {
      const creator = await prisma.user.findFirst({
        where: {
          name: { equals: username, mode: "insensitive" },
          role: "creator",
        },
        select: {
          name: true,
          aboutText: true,
          profileImageUrl: true,
        },
      });

      if (creator?.name) {
        profileSchema = creatorProfileSchema({
          name: creator.name,
          username: creator.name,
          bio: creator.aboutText ?? undefined,
          avatarUrl: creator.profileImageUrl ?? undefined,
          subscriberCount: 0,
        });
      }
    } catch {
      // JSON-LD is optional; page still renders without it
    }
  }

  return (
    <>
      {profileSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
        />
      ) : null}
      <CreatorProfileClient />
    </>
  );
}
