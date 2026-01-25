/**
 * Simple Temp Images Cleanup Script
 * 
 * Removes all temporary uploaded images from storage
 * 
 * Usage: npx tsx scripts/cleanup-temp-images-simple.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function cleanupTempImages() {
  console.log('🧹 Cleaning up temporary images...\n');

  const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp');

  if (!fs.existsSync(tempDir)) {
    console.log('✅ No temp directory found - nothing to clean');
    return;
  }

  const items = fs.readdirSync(tempDir);
  let deletedDirs = 0;
  let deletedFiles = 0;

  for (const item of items) {
    const itemPath = path.join(tempDir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Remove directory and all its contents
      fs.rmSync(itemPath, { recursive: true, force: true });
      deletedDirs++;
      console.log(`✓ Deleted: ${item}`);
    } else if (stats.isFile()) {
      // Remove individual file
      fs.unlinkSync(itemPath);
      deletedFiles++;
      console.log(`✓ Deleted file: ${item}`);
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   - Deleted ${deletedDirs} directories`);
  console.log(`   - Deleted ${deletedFiles} files`);
}

// Run the cleanup
try {
  cleanupTempImages();
  console.log('\n✨ Done!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
}
