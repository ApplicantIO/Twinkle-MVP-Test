import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Normalize username: strip @ prefix if present and trim
    const normalizedUsername = username.trim().startsWith('@') 
      ? username.trim().slice(1) 
      : username.trim();

    if (!normalizedUsername) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if username exists (case-insensitive) - Use database-level filtering for performance
    const existingUser = await prisma.user.findFirst({
      where: {
        name: {
          equals: normalizedUsername,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    
    const nameExists = !!existingUser;

    return NextResponse.json({
      available: !nameExists,
      exists: nameExists,
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Failed to check username' },
      { status: 500 }
    );
  }
}