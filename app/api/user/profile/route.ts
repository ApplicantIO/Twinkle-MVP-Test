import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const formData = await request.formData();
    
    const name = formData.get('name') as string | null;
    const aboutText = formData.get('aboutText') as string | null;
    const profileImage = formData.get('profileImage') as File | null;
    const bannerImage = formData.get('bannerImage') as File | null;

    const updateData: Record<string, string | boolean | Date> = {};
    
    if (name) updateData.name = name;
    if (aboutText) updateData.aboutText = aboutText;

    // Handle profile image upload
    if (profileImage) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
      await mkdir(uploadsDir, { recursive: true });
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${payload.id}_${Date.now()}_${profileImage.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      updateData.profileImageUrl = `/uploads/profiles/${fileName}`;
    }

    // Handle banner image upload
    if (bannerImage) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'banners');
      await mkdir(uploadsDir, { recursive: true });
      const bytes = await bannerImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${payload.id}_${Date.now()}_${bannerImage.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      updateData.bannerUrl = `/uploads/banners/${fileName}`;
    }

    const user = await prisma.user.update({
      where: { id: payload.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        profileImageUrl: true,
        bannerUrl: true,
        aboutText: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (_error: unknown) {
    console.error('Error updating profile:', _error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

