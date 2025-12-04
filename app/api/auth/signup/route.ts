import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    
    // Normalize name: strip "@" prefix if present and trim whitespace (for username-style signup)
    const normalizedName = name 
      ? (name.startsWith('@') ? name.slice(1) : name).trim()
      : null;
    
    // Atomic username check and user creation using transaction to prevent race conditions
    const user = await prisma.$transaction(async (tx) => {
      // Check if username (name) already exists (case-insensitive) - atomic check
      if (normalizedName) {
        const existingUsers = await tx.user.findMany({
          where: { name: { not: null } },
        });
        const nameExists = existingUsers.some(
          (u) => u.name && u.name.toLowerCase() === normalizedName.toLowerCase()
        );
        if (nameExists) {
          throw new Error('USERNAME_TAKEN');
        }
      }
      
      // Create user atomically within the same transaction
      return await tx.user.create({
        data: {
          email,
          passwordHash,
          name: normalizedName,
          role: 'viewer',
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          profileImageUrl: true,
          createdAt: true,
        },
      });
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user,
      token,
    });
  } catch (error: unknown) {
    console.error('Signup error:', error);
    
    // Handle username taken error from transaction
    if (error instanceof Error && error.message === 'USERNAME_TAKEN') {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }
    
    // Handle Prisma unique constraint errors (e.g., duplicate email)
    if (error && typeof error === 'object' && 'code' in error) {
      // P2002 is Prisma's unique constraint violation error code
      if (error.code === 'P2002') {
        const target = (error as { meta?: { target?: string[] } }).meta?.target;
        if (target?.includes('email')) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

