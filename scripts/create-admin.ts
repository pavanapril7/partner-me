/**
 * Script to create an admin user for testing
 * Usage: npx tsx scripts/create-admin.ts <username> <password>
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <username> <password>');
    process.exit(1);
  }

  try {
    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        isAdmin: true,
      },
    });

    console.log('Admin user created successfully:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Is Admin: ${user.isAdmin}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.error('Error: Username already exists');
    } else {
      console.error('Error creating admin user:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
