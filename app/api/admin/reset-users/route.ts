import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * API endpoint to reset all users and create a new default user
 * WARNING: This will delete ALL existing users!
 */
export async function POST(request: NextRequest) {
  try {
    // Delete all existing users (this will cascade delete their videos and analytics)
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`Deleted ${deleteResult.count} existing users`);

    // Create the new default user
    const hashedPassword = await bcrypt.hash('#User123', 10);
    const fullName = 'Bekha Say'; // First name + Last name
    
    const newUser = await prisma.user.create({
      data: {
        email: 'yupbekha@twinkle.uz',
        passwordHash: hashedPassword,
        name: 'yupbekha', // Username (without @)
        role: 'viewer', // Type: user
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All users removed and default user created',
      deletedCount: deleteResult.count,
      newUser: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.name,
        role: newUser.role,
        loginInfo: {
          identifier: 'yupbekha', // Can also use '@yupbekha' or 'yupbekha@twinkle.uz',
          password: '#User123',
        },
      },
    });
  } catch (error) {
    console.error('Error resetting users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

