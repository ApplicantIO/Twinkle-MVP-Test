import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check if a user exists in the database
 * Usage: GET /api/admin/check-user?email=yupbekha@twinkle.uz
 *        GET /api/admin/check-user?name=yupbekha
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    if (!email && !name) {
      return NextResponse.json(
        { error: 'Please provide either email or name parameter' },
        { status: 400 }
      );
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          createdAt: true,
        },
      });
    } else if (name) {
      // Try exact match first
      user = await prisma.user.findFirst({
        where: { name },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      // If not found, try case-insensitive
      if (!user) {
        const usersWithNames = await prisma.user.findMany({
          where: { name: { not: null } },
        });
        user = usersWithNames.find(
          (u) => u.name && u.name.toLowerCase() === name.toLowerCase()
        ) || null;
      }
    }

    if (!user) {
      return NextResponse.json({
        found: false,
        message: `No user found with ${email ? `email: ${email}` : `name: ${name}`}`,
      });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPasswordHash: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: 'Failed to check user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

