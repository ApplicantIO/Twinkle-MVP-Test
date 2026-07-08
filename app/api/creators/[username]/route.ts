import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeUsername(username: string): string {
  const trimmed = username.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await context.params;
  const username = normalizeUsername(rawUsername);

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        name: { equals: username, mode: "insensitive" },
        role: "creator",
      },
      select: {
        id: true,
        name: true,
        profileImageUrl: true,
        bannerUrl: true,
        aboutText: true,
        updatedAt: true,
      },
    });

    if (!user?.name) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      creator: {
        id: user.id,
        username: user.name,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        bannerUrl: user.bannerUrl,
        aboutText: user.aboutText,
        bio: user.aboutText,
        avatarUrl: user.profileImageUrl,
        subscriberCount: 0,
        videoCount: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator" },
      { status: 500 }
    );
  }
}
