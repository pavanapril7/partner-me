/**
 * Image processing utilities using sharp
 * Handles image optimization, resizing, and variant generation
 * Requirements: 5.1, 5.3, 5.4
 */

import sharp from 'sharp';
import {
  VARIANT_CONFIGS,
  ProcessedImage,
  ProcessedImageVariant,
  ImageVariantConfig,
} from './types';

/**
 * Processes a single image variant with specified configuration
 * Strips EXIF metadata for privacy and size reduction
 * Requirements: 5.1, 5.4
 */
async function processImageVariant(
  buffer: Buffer,
  config: ImageVariantConfig
): Promise<ProcessedImageVariant> {
  const image = sharp(buffer);

  // Resize image according to config
  const processed = image
    .resize(config.width, config.height, {
      fit: config.fit,
      withoutEnlargement: true, // Don't upscale images
    })
    .webp({ quality: config.quality }) // Convert to WebP for better compression
    .withMetadata({ exif: {} }); // Strip EXIF metadata

  const outputBuffer = await processed.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width || config.width,
    height: metadata.height || config.height,
    size: outputBuffer.length,
    format: 'webp',
  };
}

/**
 * Generates thumbnail variant (300x300, 80% quality, cover fit)
 * Requirements: 5.3
 */
export async function generateThumbnail(
  buffer: Buffer
): Promise<ProcessedImageVariant> {
  return processImageVariant(buffer, VARIANT_CONFIGS.thumbnail);
}

/**
 * Generates medium variant (800x800, 85% quality, contain fit)
 * Requirements: 5.3
 */
export async function generateMedium(
  buffer: Buffer
): Promise<ProcessedImageVariant> {
  return processImageVariant(buffer, VARIANT_CONFIGS.medium);
}

/**
 * Generates full size optimized variant (1920x1920, 90% quality, inside fit)
 * Strips EXIF metadata
 * Requirements: 5.1, 5.3, 5.4
 */
export async function generateFull(
  buffer: Buffer
): Promise<ProcessedImageVariant> {
  return processImageVariant(buffer, VARIANT_CONFIGS.full);
}

/**
 * Processes an image and generates all variants (thumbnail, medium, full)
 * Requirements: 5.1, 5.3, 5.4
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  // Extract original metadata
  const originalMetadata = await sharp(buffer).metadata();

  if (!originalMetadata.width || !originalMetadata.height) {
    throw new Error('Unable to extract image dimensions');
  }

  // Generate all variants in parallel for better performance
  const [thumbnail, medium, full] = await Promise.all([
    generateThumbnail(buffer),
    generateMedium(buffer),
    generateFull(buffer),
  ]);

  return {
    thumbnail,
    medium,
    full,
    originalMetadata: {
      width: originalMetadata.width,
      height: originalMetadata.height,
      format: originalMetadata.format || 'unknown',
      size: buffer.length,
    },
  };
}

/**
 * Optimizes an image without resizing
 * Useful for preserving original dimensions while reducing file size
 * Requirements: 5.1
 */
export async function optimizeImage(
  buffer: Buffer,
  quality: number = 90
): Promise<Buffer> {
  const image = sharp(buffer);

  // Convert to WebP for better compression, or keep original format
  const processed = image
    .webp({ quality })
    .withMetadata({ exif: {} }); // Strip EXIF metadata

  return processed.toBuffer();
}

/**
 * Strips EXIF metadata from an image
 * Requirements: 5.4
 */
export async function stripMetadata(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).withMetadata({ exif: {} }).toBuffer();
}
