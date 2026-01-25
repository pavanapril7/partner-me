/**
 * Cleanup Anonymous Submissions Script
 * 
 * This script removes all anonymous submissions and their associated images
 * from both the database and file storage.
 * 
 * Usage: npx tsx scripts/cleanup-anonymous-submissions.ts
 */

import { prisma } from '../src/lib/prisma';
import { createStorageProvider } from '../src/lib/storage';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupAnonymousSubmissions() {
  console.log('🧹 Starting cleanup of anonymous submissions...\n');

  try {
    // Get all anonymous submissions with their images
    const submissions = await prisma.anonymousSubmission.findMany({
      include: {
        images: {
          include: {
            image: {
              include: {
                variants: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${submissions.length} anonymous submissions\n`);

    if (submissions.length === 0) {
      console.log('✅ No anonymous submissions to clean up');
      return;
    }

    const storage = createStorageProvider();
    let deletedImages = 0;
    let deletedFiles = 0;
    let failedFiles = 0;

    // Delete images and their files
    for (const submission of submissions) {
      console.log(`\n🗑️  Processing submission: ${submission.id}`);
      console.log(`   Title: ${submission.title}`);
      console.log(`   Status: ${submission.status}`);
      console.log(`   Images: ${submission.images.length}`);

      for (const submissionImage of submission.images) {
        const image = submissionImage.image;
        console.log(`   - Deleting image: ${image.id}`);

        // Delete all variants from storage
        for (const variant of image.variants) {
          try {
            const deleted = await storage.delete(variant.storagePath);
            if (deleted) {
              deletedFiles++;
              console.log(`     ✓ Deleted ${variant.variant} variant`);
            } else {
              failedFiles++;
              console.log(`     ✗ Failed to delete ${variant.variant} variant`);
            }
          } catch (error) {
            failedFiles++;
            console.error(`     ✗ Error deleting ${variant.variant}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }

        deletedImages++;
      }
    }

    // Delete from database (cascading will handle related records)
    console.log('\n🗄️  Deleting from database...');
    
    const result = await prisma.anonymousSubmission.deleteMany({});
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Deleted ${result.count} submissions`);
    console.log(`   - Deleted ${deletedImages} images`);
    console.log(`   - Deleted ${deletedFiles} files from storage`);
    if (failedFiles > 0) {
      console.log(`   - Failed to delete ${failedFiles} files`);
    }

    // Clean up empty temp directories
    console.log('\n🧹 Cleaning up empty temp directories...');
    const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
    
    if (fs.existsSync(tempDir)) {
      const tempDirs = fs.readdirSync(tempDir);
      let removedDirs = 0;

      for (const dir of tempDirs) {
        const dirPath = path.join(tempDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          try {
            const files = fs.readdirSync(dirPath);
            if (files.length === 0) {
              fs.rmdirSync(dirPath);
              removedDirs++;
            }
          } catch (error) {
            console.error(`   ✗ Error removing directory ${dir}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }

      if (removedDirs > 0) {
        console.log(`   ✓ Removed ${removedDirs} empty directories`);
      } else {
        console.log(`   - No empty directories to remove`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAnonymousSubmissions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
