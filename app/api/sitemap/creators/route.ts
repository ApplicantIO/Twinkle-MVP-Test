import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const creators = await prisma.user.findMany({
      select: { name: true, updatedAt: true },
      where: {
        role: "creator",
        name: { not: null },
      },
      orderBy: { updatedAt: "desc" },
    });

    const payload = creators
      .filter((creator) => creator.name)
      .map((creator) => ({
        username: creator.name as string,
        updatedAt: creator.updatedAt,
      }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching sitemap creators:", error);
    return NextResponse.json([], { status: 200 });
  }
}
