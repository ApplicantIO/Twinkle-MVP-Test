// app/api/comments/route.ts
// GET /api/comments?videoId=xxx — videoning commentlarini olish
// POST /api/comments — yangi comment yozish

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-this-jwt-secret-for-dev"
);

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET — videoId bo'yicha commentlarni olish
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        videoId,
        parentId: null, // faqat top-level commentlar
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST — yangi comment yozish
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Login qilish kerak" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId, content, parentId } = body;

    if (!videoId || !content?.trim()) {
      return NextResponse.json(
        { error: "videoId va content kerak" },
        { status: 400 }
      );
    }

    if (content.trim().length > 1000) {
      return NextResponse.json(
        { error: "Comment 1000 belgidan oshmasin" },
        { status: 400 }
      );
    }

    // Video mavjudligini tekshirish
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video topilmadi" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        videoId,
        userId: user.id,
        content: content.trim(),
        parentId: parentId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImageUrl: true,
          },
        },
        replies: true,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "Comment saqlanmadi" },
      { status: 500 }
    );
  }
}
