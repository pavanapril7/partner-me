#!/usr/bin/env tsx
/**
 * Migration script for URL-based images
 * 
 * This script migrates existing business ideas that use URL-based images
 * to the new uploaded image system. It:
 * 1. Downloads images from existing URLs
 * 2. Validates and processes them
 * 3. Uploads to the storage system
 * 4. Creates Image and ImageVariant records
 * 5. Associates images with business ideas
 * 
 * Requirements: 7.1, 7.2, 7.4
 * 
 * Usage: npx tsx scripts/migrate-url-images.ts [--dry-run]
 */

// Load environment variables first
import 'dotenv/config';

import { prisma } from '../src/lib/prisma';
import { createStorageProvider } from '../src/lib/storage';
import { validateImage } from '../src/lib/image/validation';
import { processImage } from '../src/lib/image/processing';
import { ImageVariantType } from '@prisma/client';

interface MigrationStats {
  businessIdeasFound: number;
  businessIdeasMigrated: number;
  imagesDownloaded: number;
  imagesFailed: number;
  errors: string[];
}

interface DownloadedImage {
  url: string;
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * Download an image from a URL
 */
async function downloadImage(url: string): Promise<DownloadedImage | null> {
  try {
    console.log(`    Downloading: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageMigrationBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`    ✗ HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Extract filename from URL or generate one
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split('/').pop() || 'image.jpg';

    return {
      url,
      buffer,
      mimeType: contentType,
      filename,
    };
  } catch (error) {
    console.error(`    ✗ Download failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Generate storage path for an image
 * Requirements: 7.2
 */
function generateStoragePath(
  businessIdeaId: string,
  imageId: string,
  variant: 'full' | 'medium' | 'thumbnail'
): string {
  return `business-ideas/${businessIdeaId}/${imageId}/${variant}.webp`;
}

/**
 * Migrate a single business idea's images
 */
async function migrateBusinessIdea(
  businessIdea: { id: string; title: string; images: string[] },
  storage: ReturnType<typeof createStorageProvider>,
  dryRun: boolean
): Promise<{ success: boolean; imagesProcessed: number; errors: string[] }> {
  const errors: string[] = [];
  let imagesProcessed = 0;

  console.log(`\n📦 Processing: ${businessIdea.title} (${businessIdea.id})`);
  console.log(`   URLs to migrate: ${businessIdea.images.length}`);

  for (let order = 0; order < businessIdea.images.length; order++) {
    const url = businessIdea.images[order];
    console.log(`\n  [${order + 1}/${businessIdea.images.length}] Processing image:`);

    try {
      // Download image
      const downloaded = await downloadImage(url);
      if (!downloaded) {
        errors.push(`Failed to download: ${url}`);
        continue;
      }

      console.log(`    ✓ Downloaded (${(downloaded.buffer.length / 1024).toFixed(2)} KB)`);

      // Validate image
      const validation = await validateImage(
        downloaded.buffer,
        downloaded.mimeType,
        downloaded.filename
      );

      if (!validation.valid) {
        console.error(`    ✗ Validation failed: ${validation.error}`);
        errors.push(`Validation failed for ${url}: ${validation.error}`);
        continue;
      }

      console.log(`    ✓ Validated (${validation.metadata!.width}x${validation.metadata!.height})`);

      if (dryRun) {
        console.log(`    ⊘ Dry run - skipping upload and database operations`);
        imagesProcessed++;
        continue;
      }

      // Process image and generate variants
      const processed = await processImage(downloaded.buffer);
      console.log(`    ✓ Generated variants (thumbnail, medium, full)`);

      // Generate unique image ID
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Upload variants to storage
      const fullPath = generateStoragePath(businessIdea.id, imageId, 'full');
      const mediumPath = generateStoragePath(businessIdea.id, imageId, 'medium');
      const thumbnailPath = generateStoragePath(businessIdea.id, imageId, 'thumbnail');

      await Promise.all([
        storage.upload(processed.full.buffer, fullPath, 'image/webp'),
        storage.upload(processed.medium.buffer, mediumPath, 'image/webp'),
        storage.upload(processed.thumbnail.buffer, thumbnailPath, 'image/webp'),
      ]);

      console.log(`    ✓ Uploaded to storage`);

      // Create Image record in database
      // Requirements: 7.1, 7.4
      const image = await prisma.image.create({
        data: {
          id: imageId,
          businessIdeaId: businessIdea.id,
          filename: downloaded.filename,
          storagePath: fullPath,
          mimeType: 'image/webp',
          size: processed.full.size,
          width: processed.originalMetadata.width,
          height: processed.originalMetadata.height,
          order,
          variants: {
            create: [
              {
                variant: ImageVariantType.THUMBNAIL,
                storagePath: thumbnailPath,
                width: processed.thumbnail.width,
                height: processed.thumbnail.height,
                size: processed.thumbnail.size,
              },
              {
                variant: ImageVariantType.MEDIUM,
                storagePath: mediumPath,
                width: processed.medium.width,
                height: processed.medium.height,
                size: processed.medium.size,
              },
              {
                variant: ImageVariantType.FULL,
                storagePath: fullPath,
                width: processed.full.width,
                height: processed.full.height,
                size: processed.full.size,
              },
            ],
          },
        },
      });

      console.log(`    ✓ Created database records (Image ID: ${image.id})`);
      imagesProcessed++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`    ✗ Error processing image:`, errorMsg);
      errors.push(`Error processing ${url}: ${errorMsg}`);
    }
  }

  return {
    success: errors.length === 0,
    imagesProcessed,
    errors,
  };
}

/**
 * Find business ideas that need migration
 */
async function findBusinessIdeasToMigrate() {
  // Find business ideas that have URL-based images (non-empty images array)
  // and don't have any uploaded images yet
  const businessIdeas = await prisma.businessIdea.findMany({
    where: {
      images: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      title: true,
      images: true,
      uploadedImages: {
        select: {
          id: true,
        },
      },
    },
  });

  // Filter to only those without uploaded images
  return businessIdeas
    .filter((idea) => idea.uploadedImages.length === 0)
    .map((idea) => ({
      id: idea.id,
      title: idea.title,
      images: idea.images,
    }));
}

/**
 * Main migration function
 */
async function migrateImages(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    businessIdeasFound: 0,
    businessIdeasMigrated: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
    errors: [],
  };

  console.log('🔍 Searching for business ideas with URL-based images...\n');

  try {
    const businessIdeas = await findBusinessIdeasToMigrate();
    stats.businessIdeasFound = businessIdeas.length;

    if (businessIdeas.length === 0) {
      console.log('✨ No business ideas found that need migration!\n');
      return stats;
    }

    console.log(`Found ${businessIdeas.length} business idea(s) to migrate`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
    }

    const storage = createStorageProvider();

    for (const businessIdea of businessIdeas) {
      const result = await migrateBusinessIdea(businessIdea, storage, dryRun);
      
      if (result.success) {
        stats.businessIdeasMigrated++;
      }
      
      stats.imagesDownloaded += result.imagesProcessed;
      stats.imagesFailed += result.errors.length;
      stats.errors.push(...result.errors);
    }

    return stats;
  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Print migration summary
 */
function printSummary(stats: MigrationStats, dryRun: boolean) {
  console.log('\n═══════════════════════════════════════');
  console.log('         MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  
  if (dryRun) {
    console.log('Mode:                      DRY RUN');
  }
  
  console.log(`Business ideas found:      ${stats.businessIdeasFound}`);
  console.log(`Business ideas migrated:   ${stats.businessIdeasMigrated}`);
  console.log(`Images downloaded:         ${stats.imagesDownloaded}`);
  console.log(`Images failed:             ${stats.imagesFailed}`);
  console.log('═══════════════════════════════════════\n');

  if (stats.errors.length > 0) {
    console.log('⚠️  Errors encountered:');
    stats.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (dryRun) {
    console.log('ℹ️  This was a dry run. Run without --dry-run to perform actual migration.');
  } else if (stats.imagesFailed > 0) {
    console.log('⚠️  Some images failed to migrate. Check errors above.');
  } else if (stats.businessIdeasMigrated > 0) {
    console.log('✅ Migration completed successfully!');
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('╔═══════════════════════════════════════╗');
  console.log('║   URL-BASED IMAGES MIGRATION SCRIPT   ║');
  console.log('╚═══════════════════════════════════════╝\n');

  try {
    const stats = await migrateImages(dryRun);
    printSummary(stats, dryRun);
    process.exit(stats.imagesFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
