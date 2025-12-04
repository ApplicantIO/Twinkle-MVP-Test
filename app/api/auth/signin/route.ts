import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    // Debug logging (development only to prevent sensitive data exposure in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] Received request:', {
        identifier: identifier ? `${identifier.substring(0, 3)}***` : 'empty',
        passwordLength: password?.length || 0,
      });
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Normalize identifier: trim whitespace and strip "@" prefix if present (for username-style login)
    const normalizedIdentifier = identifier.trim().startsWith('@') 
      ? identifier.trim().slice(1) 
      : identifier.trim();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] Normalized identifier:', normalizedIdentifier);
    }
    
    // Try to find by email first (exact match)
    let user = await prisma.user.findUnique({ where: { email: normalizedIdentifier } });
    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] Email lookup result:', user ? `Found user: ${user.email}` : 'No user found by email');
    }
    
    // If not found by email, try to find by name (case-insensitive)
    if (!user) {
      // First try exact match
      user = await prisma.user.findFirst({ where: { name: normalizedIdentifier } });
      if (process.env.NODE_ENV === 'development') {
        console.log('[SIGNIN] Exact name match result:', user ? `Found user: ${user.name}` : 'No exact match');
      }
      
      // If not found, try case-insensitive match
      // Fetch users with names and filter in memory (more efficient than raw SQL for small datasets)
      if (!user) {
        const usersWithNames = await prisma.user.findMany({
          where: { name: { not: null } },
        });
        // Only log sensitive user data in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[SIGNIN] All users with names:', usersWithNames.map(u => ({ id: u.id, name: u.name, email: u.email })));
        }
        
        user = usersWithNames.find(
          (u) => u.name && u.name.toLowerCase() === normalizedIdentifier.toLowerCase()
        ) || null;
        if (process.env.NODE_ENV === 'development') {
          console.log('[SIGNIN] Case-insensitive name match result:', user ? `Found user: ${user.name}` : 'No case-insensitive match');
        }
      }
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[SIGNIN] ERROR: User not found');
      }
      return NextResponse.json(
        { error: 'Invalid identifier or password' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPasswordHash: !!user.passwordHash,
      });
    }

    // Verify password - handle potential errors and trim password
    let isValid = false;
    try {
      isValid = await verifyPassword(password.trim(), user.passwordHash);
      if (process.env.NODE_ENV === 'development') {
        console.log('[SIGNIN] Password verification result:', isValid);
      }
    } catch (verifyError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SIGNIN] Password verification error:', verifyError);
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[SIGNIN] ERROR: Password verification failed');
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] Password verified successfully, generating token...');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[SIGNIN] ✅ Login successful for user:', user.email);
    }

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
  } catch (error: unknown) {
    // Always log errors, but only include sensitive details in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (process.env.NODE_ENV === 'development') {
      console.error('[SIGNIN] ❌ Signin error:', error);
      console.error('[SIGNIN] Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      // In production, log minimal error info without sensitive data
      console.error('[SIGNIN] ❌ Signin error occurred');
    }
    return NextResponse.json(
      { error: 'Failed to sign in', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

