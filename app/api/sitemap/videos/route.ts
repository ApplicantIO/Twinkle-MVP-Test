import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 10000,
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching sitemap videos:", error);
    return NextResponse.json([], { status: 200 });
  }
}
