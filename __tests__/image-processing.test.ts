import sharp from 'sharp';
import {
  generateThumbnail,
  generateMedium,
  generateFull,
  processImage,
  stripMetadata,
} from '../src/lib/image/processing';
import { VARIANT_CONFIGS } from '../src/lib/image/types';

// Helper function to create a test image buffer
async function createTestImage(
  width: number,
  height: number
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe('Image Processing Utilities', () => {
  describe('generateThumbnail', () => {
    it('should generate a thumbnail with correct dimensions', async () => {
      const testImage = await createTestImage(1000, 1000);
      const thumbnail = await generateThumbnail(testImage);

      expect(thumbnail.buffer).toBeInstanceOf(Buffer);
      expect(thumbnail.width).toBeLessThanOrEqual(
        VARIANT_CONFIGS.thumbnail.width
      );
      expect(thumbnail.height).toBeLessThanOrEqual(
        VARIANT_CONFIGS.thumbnail.height
      );
      expect(thumbnail.format).toBe('webp');
    });

    it('should not upscale small images', async () => {
      const testImage = await createTestImage(200, 200);
      const thumbnail = await generateThumbnail(testImage);

      expect(thumbnail.width).toBeLessThanOrEqual(200);
      expect(thumbnail.height).toBeLessThanOrEqual(200);
    });

    it('should reduce file size', async () => {
      const testImage = await createTestImage(1000, 1000);
      const thumbnail = await generateThumbnail(testImage);

      expect(thumbnail.size).toBeLessThan(testImage.length);
    });
  });

  describe('generateMedium', () => {
    it('should generate a medium variant with correct dimensions', async () => {
      const testImage = await createTestImage(2000, 2000);
      const medium = await generateMedium(testImage);

      expect(medium.buffer).toBeInstanceOf(Buffer);
      expect(medium.width).toBeLessThanOrEqual(VARIANT_CONFIGS.medium.width);
      expect(medium.height).toBeLessThanOrEqual(VARIANT_CONFIGS.medium.height);
      expect(medium.format).toBe('webp');
    });

    it('should fit image within dimensions', async () => {
      const testImage = await createTestImage(1600, 800);
      const medium = await generateMedium(testImage);

      // With 'contain' fit, the image should fit within 800x800
      expect(medium.width).toBeLessThanOrEqual(800);
      expect(medium.height).toBeLessThanOrEqual(800);
      expect(medium.format).toBe('webp');
    });
  });

  describe('generateFull', () => {
    it('should generate a full variant with correct max dimensions', async () => {
      const testImage = await createTestImage(3000, 3000);
      const full = await generateFull(testImage);

      expect(full.buffer).toBeInstanceOf(Buffer);
      expect(full.width).toBeLessThanOrEqual(VARIANT_CONFIGS.full.width);
      expect(full.height).toBeLessThanOrEqual(VARIANT_CONFIGS.full.height);
      expect(full.format).toBe('webp');
    });

    it('should not upscale images smaller than max dimensions', async () => {
      const testImage = await createTestImage(1000, 1000);
      const full = await generateFull(testImage);

      expect(full.width).toBeLessThanOrEqual(1000);
      expect(full.height).toBeLessThanOrEqual(1000);
    });
  });

  describe('processImage', () => {
    it('should generate all three variants', async () => {
      const testImage = await createTestImage(2000, 2000);
      const processed = await processImage(testImage);

      expect(processed.thumbnail).toBeDefined();
      expect(processed.medium).toBeDefined();
      expect(processed.full).toBeDefined();
      expect(processed.originalMetadata).toBeDefined();
    });

    it('should include original metadata', async () => {
      const testImage = await createTestImage(2000, 1500);
      const processed = await processImage(testImage);

      expect(processed.originalMetadata.width).toBe(2000);
      expect(processed.originalMetadata.height).toBe(1500);
      expect(processed.originalMetadata.size).toBe(testImage.length);
    });

    it('should generate variants with decreasing sizes', async () => {
      const testImage = await createTestImage(2000, 2000);
      const processed = await processImage(testImage);

      expect(processed.thumbnail.width).toBeLessThan(processed.medium.width);
      expect(processed.medium.width).toBeLessThanOrEqual(processed.full.width);
    });
  });

  describe('stripMetadata', () => {
    it('should strip metadata from image', async () => {
      const testImage = await createTestImage(500, 500);
      const stripped = await stripMetadata(testImage);

      expect(stripped).toBeInstanceOf(Buffer);
      expect(stripped.length).toBeGreaterThan(0);
    });

    it('should preserve image data', async () => {
      const testImage = await createTestImage(500, 500);
      const stripped = await stripMetadata(testImage);

      const originalMetadata = await sharp(testImage).metadata();
      const strippedMetadata = await sharp(stripped).metadata();

      expect(strippedMetadata.width).toBe(originalMetadata.width);
      expect(strippedMetadata.height).toBe(originalMetadata.height);
    });
  });
});
