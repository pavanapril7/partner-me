#!/usr/bin/env tsx
/**
 * Cleanup script for orphaned images
 * 
 * This script identifies and deletes images that are not associated with any business idea
 * and are older than 24 hours. It removes both database records and storage files.
 * 
 * Usage: npx tsx scripts/cleanup-orphaned-images.ts
 */

import { prisma } from '../src/lib/prisma';
import { createStorageProvider } from '../src/lib/storage';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface CleanupStats {
  imagesFound: number;
  imagesDeleted: number;
  variantsDeleted: number;
  storageFilesDeleted: number;
  errors: number;
}

/**
 * Find orphaned images (images not associated with any business idea)
 * that are older than 24 hours
 */
async function findOrphanedImages() {
  const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  const orphanedImages = await prisma.image.findMany({
    where: {
      businessIdeaId: null,
      createdAt: {
        lt: twentyFourHoursAgo,
      },
    },
    include: {
      variants: true,
    },
  });

  return orphanedImages;
}

/**
 * Delete an image and all its variants from storage
 */
async function deleteImageFromStorage(
  storagePath: string,
  variantPaths: string[],
  storage: ReturnType<typeof createStorageProvider>
): Promise<number> {
  let deletedCount = 0;

  // Delete main image
  try {
    await storage.delete(storagePath);
    deletedCount++;
    console.log(`  ✓ Deleted main image: ${storagePath}`);
  } catch (error) {
    console.error(`  ✗ Failed to delete main image ${storagePath}:`, error);
  }

  // Delete variants
  for (const variantPath of variantPaths) {
    try {
      await storage.delete(variantPath);
      deletedCount++;
      console.log(`  ✓ Deleted variant: ${variantPath}`);
    } catch (error) {
      console.error(`  ✗ Failed to delete variant ${variantPath}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanupOrphanedImages(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    imagesFound: 0,
    imagesDeleted: 0,
    variantsDeleted: 0,
    storageFilesDeleted: 0,
    errors: 0,
  };

  console.log('🔍 Searching for orphaned images...\n');

  try {
    const orphanedImages = await findOrphanedImages();
    stats.imagesFound = orphanedImages.length;

    if (orphanedImages.length === 0) {
      console.log('✨ No orphaned images found. Database is clean!\n');
      return stats;
    }

    console.log(`Found ${orphanedImages.length} orphaned image(s) to clean up:\n`);

    const storage = createStorageProvider();

    for (const image of orphanedImages) {
      console.log(`Processing image ${image.id} (${image.filename}):`);
      console.log(`  Created: ${image.createdAt.toISOString()}`);
      console.log(`  Storage path: ${image.storagePath}`);
      console.log(`  Variants: ${image.variants.length}`);

      try {
        // Delete from storage
        const variantPaths = image.variants.map((v) => v.storagePath);
        const deletedFiles = await deleteImageFromStorage(
          image.storagePath,
          variantPaths,
          storage
        );
        stats.storageFilesDeleted += deletedFiles;

        // Delete from database (cascade will delete variants)
        await prisma.image.delete({
          where: { id: image.id },
        });

        stats.imagesDeleted++;
        stats.variantsDeleted += image.variants.length;

        console.log(`  ✓ Deleted image record from database\n`);
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ Error deleting image ${image.id}:`, error);
        console.log('');
      }
    }

    return stats;
  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    throw error;
  }
}

/**
 * Print cleanup summary
 */
function printSummary(stats: CleanupStats) {
  console.log('═══════════════════════════════════════');
  console.log('           CLEANUP SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Orphaned images found:     ${stats.imagesFound}`);
  console.log(`Images deleted:            ${stats.imagesDeleted}`);
  console.log(`Variants deleted:          ${stats.variantsDeleted}`);
  console.log(`Storage files deleted:     ${stats.storageFilesDeleted}`);
  console.log(`Errors encountered:        ${stats.errors}`);
  console.log('═══════════════════════════════════════\n');

  if (stats.errors > 0) {
    console.log('⚠️  Some errors occurred during cleanup. Check logs above.');
  } else if (stats.imagesDeleted > 0) {
    console.log('✅ Cleanup completed successfully!');
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   ORPHANED IMAGES CLEANUP SCRIPT      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  try {
    const stats = await cleanupOrphanedImages();
    printSummary(stats);
    process.exit(stats.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
