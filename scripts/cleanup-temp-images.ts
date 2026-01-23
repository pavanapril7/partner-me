#!/usr/bin/env tsx
/**
 * Cleanup script for temporary images
 * 
 * This script identifies and deletes temporary images from incomplete business idea creation
 * that are older than 24 hours. Temp images are stored in the temp/ directory and should be
 * moved to business-ideas/ when a business idea is created. If they remain in temp/ for more
 * than 24 hours, they are considered abandoned and should be cleaned up.
 * 
 * Usage: npx tsx scripts/cleanup-temp-images.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { createStorageProvider } from '../src/lib/storage';
import { LocalStorageProvider } from '../src/lib/storage/local-provider';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface CleanupStats {
  directoriesFound: number;
  directoriesDeleted: number;
  filesDeleted: number;
  errors: number;
}

/**
 * Get the temp directory path based on storage configuration
 */
function getTempDirectory(): string {
  const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
  return path.join(uploadDir, 'temp');
}

/**
 * Check if a directory is older than 24 hours
 */
async function isOlderThan24Hours(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    const ageMs = Date.now() - stats.mtimeMs;
    return ageMs > TWENTY_FOUR_HOURS_MS;
  } catch (error) {
    console.error(`  ✗ Error checking directory age: ${error}`);
    return false;
  }
}

/**
 * Recursively delete a directory and all its contents
 */
async function deleteDirectory(dirPath: string): Promise<number> {
  let filesDeleted = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        filesDeleted += await deleteDirectory(fullPath);
      } else {
        await fs.unlink(fullPath);
        filesDeleted++;
        console.log(`    ✓ Deleted file: ${entry.name}`);
      }
    }

    // Remove the now-empty directory
    await fs.rmdir(dirPath);
    console.log(`  ✓ Deleted directory: ${path.basename(dirPath)}`);

    return filesDeleted;
  } catch (error) {
    console.error(`  ✗ Error deleting directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Find and clean up temp image directories older than 24 hours
 */
async function cleanupTempImages(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    directoriesFound: 0,
    directoriesDeleted: 0,
    filesDeleted: 0,
    errors: 0,
  };

  console.log('🔍 Searching for temporary images...\n');

  const tempDir = getTempDirectory();

  try {
    // Check if temp directory exists
    try {
      await fs.access(tempDir);
    } catch {
      console.log(`✨ Temp directory does not exist: ${tempDir}`);
      console.log('   Nothing to clean up!\n');
      return stats;
    }

    // Read all entries in temp directory
    const entries = await fs.readdir(tempDir, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory());

    stats.directoriesFound = directories.length;

    if (directories.length === 0) {
      console.log('✨ No temporary image directories found. Temp directory is clean!\n');
      return stats;
    }

    console.log(`Found ${directories.length} temporary image director(ies):\n`);

    for (const dir of directories) {
      const dirPath = path.join(tempDir, dir.name);
      console.log(`Processing directory: ${dir.name}`);

      try {
        // Check if directory is older than 24 hours
        const isOld = await isOlderThan24Hours(dirPath);

        if (!isOld) {
          console.log(`  ⏭️  Skipping (less than 24 hours old)\n`);
          continue;
        }

        // Get directory stats for logging
        const dirStats = await fs.stat(dirPath);
        const ageHours = Math.floor((Date.now() - dirStats.mtimeMs) / (60 * 60 * 1000));
        console.log(`  Age: ${ageHours} hours`);

        // Delete the directory and all its contents
        const filesDeleted = await deleteDirectory(dirPath);
        stats.filesDeleted += filesDeleted;
        stats.directoriesDeleted++;

        console.log('');
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ Error processing directory ${dir.name}:`, error);
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
  console.log(`Temp directories found:    ${stats.directoriesFound}`);
  console.log(`Directories deleted:       ${stats.directoriesDeleted}`);
  console.log(`Files deleted:             ${stats.filesDeleted}`);
  console.log(`Errors encountered:        ${stats.errors}`);
  console.log('═══════════════════════════════════════\n');

  if (stats.errors > 0) {
    console.log('⚠️  Some errors occurred during cleanup. Check logs above.');
  } else if (stats.directoriesDeleted > 0) {
    console.log('✅ Cleanup completed successfully!');
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   TEMP IMAGES CLEANUP SCRIPT          ║');
  console.log('╚═══════════════════════════════════════╝\n');

  try {
    const stats = await cleanupTempImages();
    printSummary(stats);
    process.exit(stats.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
