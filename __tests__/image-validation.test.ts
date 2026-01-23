import {
  isValidMimeType,
  isValidExtension,
  validateFileSize,
  validateDimensions,
  validateFileSignature,
} from '../src/lib/image/validation';
import { VALIDATION_CONSTRAINTS } from '../src/lib/image/types';

describe('Image Validation Utilities', () => {
  describe('isValidMimeType', () => {
    it('should accept valid MIME types', () => {
      expect(isValidMimeType('image/jpeg')).toBe(true);
      expect(isValidMimeType('image/png')).toBe(true);
      expect(isValidMimeType('image/webp')).toBe(true);
      expect(isValidMimeType('image/gif')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(isValidMimeType('image/bmp')).toBe(false);
      expect(isValidMimeType('application/pdf')).toBe(false);
      expect(isValidMimeType('text/plain')).toBe(false);
      expect(isValidMimeType('video/mp4')).toBe(false);
    });
  });

  describe('isValidExtension', () => {
    it('should accept valid extensions', () => {
      expect(isValidExtension('image.jpg')).toBe(true);
      expect(isValidExtension('image.jpeg')).toBe(true);
      expect(isValidExtension('image.png')).toBe(true);
      expect(isValidExtension('image.webp')).toBe(true);
      expect(isValidExtension('image.gif')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isValidExtension('image.JPG')).toBe(true);
      expect(isValidExtension('image.PNG')).toBe(true);
      expect(isValidExtension('image.WEBP')).toBe(true);
    });

    it('should reject invalid extensions', () => {
      expect(isValidExtension('image.bmp')).toBe(false);
      expect(isValidExtension('document.pdf')).toBe(false);
      expect(isValidExtension('file.txt')).toBe(false);
    });

    it('should handle files without extensions', () => {
      expect(isValidExtension('image')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const result = validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept files at the size limit', () => {
      const result = validateFileSize(VALIDATION_CONSTRAINTS.MAX_FILE_SIZE);
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const result = validateFileSize(
        VALIDATION_CONSTRAINTS.MAX_FILE_SIZE + 1
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });

    it('should reject empty files', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('validateDimensions', () => {
    it('should accept valid dimensions', () => {
      const result = validateDimensions(800, 600);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept minimum dimensions', () => {
      const result = validateDimensions(
        VALIDATION_CONSTRAINTS.MIN_WIDTH,
        VALIDATION_CONSTRAINTS.MIN_HEIGHT
      );
      expect(result.valid).toBe(true);
    });

    it('should accept maximum dimensions', () => {
      const result = validateDimensions(
        VALIDATION_CONSTRAINTS.MAX_WIDTH,
        VALIDATION_CONSTRAINTS.MAX_HEIGHT
      );
      expect(result.valid).toBe(true);
    });

    it('should reject dimensions below minimum', () => {
      const result = validateDimensions(100, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject dimensions above maximum', () => {
      const result = validateDimensions(5000, 5000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not exceed');
    });
  });

  describe('validateFileSignature', () => {
    it('should validate JPEG signature', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateFileSignature(jpegBuffer, 'image/jpeg')).toBe(true);
    });

    it('should validate PNG signature', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(validateFileSignature(pngBuffer, 'image/png')).toBe(true);
    });

    it('should validate GIF87a signature', () => {
      const gifBuffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00,
      ]);
      expect(validateFileSignature(gifBuffer, 'image/gif')).toBe(true);
    });

    it('should validate GIF89a signature', () => {
      const gifBuffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00,
      ]);
      expect(validateFileSignature(gifBuffer, 'image/gif')).toBe(true);
    });

    it('should reject mismatched signatures', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(validateFileSignature(jpegBuffer, 'image/png')).toBe(false);
    });

    it('should reject invalid signatures', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validateFileSignature(invalidBuffer, 'image/jpeg')).toBe(false);
    });

    it('should reject buffers shorter than signature', () => {
      const shortBuffer = Buffer.from([0xff, 0xd8]);
      expect(validateFileSignature(shortBuffer, 'image/jpeg')).toBe(false);
    });
  });
});
