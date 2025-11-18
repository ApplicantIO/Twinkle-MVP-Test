import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Try to find by email first, then by name (best-effort fallback for username-like login)
    let user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) {
      user = await prisma.user.findFirst({ where: { name: identifier } });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid identifier or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (_error: unknown) {
    console.error('Signin error:', _error);
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}

