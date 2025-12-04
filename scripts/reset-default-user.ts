/**
 * Script to remove all existing users and create a new default user
 * WARNING: This will delete ALL existing users and their associated data!
 */

import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';

async function resetDefaultUser() {
  try {
    console.log('\n🔄 Resetting users and creating default user...\n');

    // Delete all existing users (this will cascade delete their videos and analytics)
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} existing user(s)`);

    // Create the new default user
    const hashedPassword = await bcrypt.hash('#User123', 10);
    
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

    console.log('\n✅ Default user created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('   Username: yupbekha (or @yupbekha)');
    console.log('   Email: yupbekha@twinkle.uz');
    console.log('   Password: #User123');
    console.log('\n   User Details:');
    console.log(`   - First Name: Bekha`);
    console.log(`   - Last Name: Say`);
    console.log(`   - Role: ${newUser.role}`);
    console.log(`   - User ID: ${newUser.id}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  }
}

resetDefaultUser();

