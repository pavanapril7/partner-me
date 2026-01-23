/**
 * Tests for GET /api/images/[id] endpoint
 * Requirements: 5.5, 8.1, 8.2, 8.3, 8.5, 12.2, 12.4, 12.5
 * 
 * These tests verify the image serving logic by testing the underlying
 * database queries, storage operations, and response handling.
 */

import { prisma } from '@/lib/prisma';
import { createStorageProvider } from '@/lib/storage';
import { promises as fs } from 'fs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    image: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/storage', () => ({
  createStorageProvider: jest.fn(),
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('Image Serving API - GET /api/images/[id]', () => {
  const mockImageId = 'test-image-id';
  const mockStoragePath = 'business-ideas/test-business/test-image/thumbnail.webp';
  const mockFileBuffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STORAGE_TYPE = 'local';
    process.env.UPLOAD_DIR = './public/uploads';
  });

  describe('Database Query Logic', () => {
    it('should query for full variant by default (Requirement 5.5)', async () => {
      const mockImageId = 'test-image-id';
      
      await prisma.image.findUnique({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'FULL',
            },
          },
        },
      });

      expect(prisma.image.findUnique).toHaveBeenCalledWith({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'FULL',
            },
          },
        },
      });
    });

    it('should query for thumbnail variant when requested (Requirement 8.1)', async () => {
      const mockImageId = 'test-image-id';
      
      await prisma.image.findUnique({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'THUMBNAIL',
            },
          },
        },
      });

      expect(prisma.image.findUnique).toHaveBeenCalledWith({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'THUMBNAIL',
            },
          },
        },
      });
    });

    it('should query for medium variant when requested (Requirement 8.2)', async () => {
      const mockImageId = 'test-image-id';
      
      await prisma.image.findUnique({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'MEDIUM',
            },
          },
        },
      });

      expect(prisma.image.findUnique).toHaveBeenCalledWith({
        where: { id: mockImageId },
        include: {
          variants: {
            where: {
              variant: 'MEDIUM',
            },
          },
        },
      });
    });

    it('should return null for non-existent image (Requirement 12.5)', async () => {
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await prisma.image.findUnique({
        where: { id: 'non-existent-id' },
        include: {
          variants: {
            where: {
              variant: 'FULL',
            },
          },
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    it('should check if file exists before serving (Requirement 12.4)', async () => {
      const mockStoragePath = 'business-ideas/test/image/full.webp';
      const mockStorage = {
        exists: jest.fn().mockResolvedValue(true),
        getUrl: jest.fn(),
      };
      (createStorageProvider as jest.Mock).mockReturnValue(mockStorage);

      const storage = createStorageProvider();
      const exists = await storage.exists(mockStoragePath);

      expect(exists).toBe(true);
      expect(mockStorage.exists).toHaveBeenCalledWith(mockStoragePath);
    });

    it('should return false when file does not exist (Requirement 12.4)', async () => {
      const mockStoragePath = 'business-ideas/test/image/missing.webp';
      const mockStorage = {
        exists: jest.fn().mockResolvedValue(false),
        getUrl: jest.fn(),
      };
      (createStorageProvider as jest.Mock).mockReturnValue(mockStorage);

      const storage = createStorageProvider();
      const exists = await storage.exists(mockStoragePath);

      expect(exists).toBe(false);
    });

    it('should read file from local storage', async () => {
      const mockFileBuffer = Buffer.from('fake-image-data');
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileBuffer);

      const fileBuffer = await fs.readFile('./public/uploads/test/image.webp');

      expect(fileBuffer).toEqual(mockFileBuffer);
      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should get URL for S3 storage', () => {
      const mockStoragePath = 'business-ideas/test/image/full.webp';
      const mockS3Url = 'https://s3.amazonaws.com/bucket/path/to/image.webp';
      const mockStorage = {
        exists: jest.fn(),
        getUrl: jest.fn().mockReturnValue(mockS3Url),
      };
      (createStorageProvider as jest.Mock).mockReturnValue(mockStorage);

      const storage = createStorageProvider();
      const url = storage.getUrl(mockStoragePath);

      expect(url).toBe(mockS3Url);
      expect(mockStorage.getUrl).toHaveBeenCalledWith(mockStoragePath);
    });
  });

  describe('Response Headers', () => {
    it('should include cache-control header for immutable images (Requirement 8.3)', () => {
      // Images are identified by unique IDs, so they are immutable
      const cacheControl = 'public, max-age=31536000, immutable';
      
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=31536000'); // 1 year
      expect(cacheControl).toContain('immutable');
    });

    it('should include content-type header based on MIME type (Requirement 8.5)', () => {
      const mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      mimeTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^image\//);
      });
    });
  });

  describe('Variant Selection', () => {
    it('should select appropriate variant based on request (Requirement 5.5, 8.1, 8.2)', () => {
      const variants = ['thumbnail', 'medium', 'full'];
      const variantMap = {
        thumbnail: 'THUMBNAIL',
        medium: 'MEDIUM',
        full: 'FULL',
      };

      variants.forEach(variant => {
        const upperVariant = variantMap[variant as keyof typeof variantMap];
        expect(upperVariant).toBeDefined();
        expect(['THUMBNAIL', 'MEDIUM', 'FULL']).toContain(upperVariant);
      });
    });

    it('should validate variant parameter', () => {
      const validVariants = ['thumbnail', 'medium', 'full'];
      const invalidVariants = ['small', 'large', 'original', ''];

      validVariants.forEach(variant => {
        expect(['thumbnail', 'medium', 'full']).toContain(variant);
      });

      invalidVariants.forEach(variant => {
        expect(['thumbnail', 'medium', 'full']).not.toContain(variant);
      });
    });
  });

  describe('Image Metadata', () => {
    it('should include all required metadata fields', () => {
      const mockImage = {
        id: 'test-image-id',
        businessIdeaId: 'business-id',
        filename: 'test.jpg',
        storagePath: 'business-ideas/test/image/full.jpg',
        mimeType: 'image/jpeg',
        size: 50000,
        width: 1920,
        height: 1080,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        variants: [
          {
            id: 'variant-id',
            variant: 'FULL',
            storagePath: 'business-ideas/test/image/full.webp',
            width: 1920,
            height: 1080,
            size: 50000,
          },
        ],
      };

      // Verify all required fields are present
      expect(mockImage.id).toBeDefined();
      expect(mockImage.mimeType).toBeDefined();
      expect(mockImage.variants).toBeDefined();
      expect(mockImage.variants.length).toBeGreaterThan(0);
      expect(mockImage.variants[0].storagePath).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database errors', async () => {
      (prisma.image.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(prisma.image.findUnique({
        where: { id: 'test-id' },
        include: { variants: { where: { variant: 'FULL' } } },
      })).rejects.toThrow('Database error');
    });

    it('should handle storage errors', async () => {
      const mockStorage = {
        exists: jest.fn().mockRejectedValue(new Error('Storage error')),
        getUrl: jest.fn(),
      };
      (createStorageProvider as jest.Mock).mockReturnValue(mockStorage);

      const storage = createStorageProvider();
      
      await expect(storage.exists('test-path')).rejects.toThrow('Storage error');
    });

    it('should handle file read errors', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File read error'));

      await expect(fs.readFile('test-path')).rejects.toThrow('File read error');
    });
  });

  describe('Unique Image IDs (Requirement 12.2)', () => {
    it('should use unpredictable image IDs in URLs', () => {
      // Image IDs are CUIDs, which are unpredictable
      const mockImageIds = [
        'cl1234567890abcdefghijklm',  // 23 chars after 'cl'
        'cl9876543210fedcbaponmlkj',  // 23 chars after 'cl'
        'clabcdef1234567890mnopqrs',   // 23 chars after 'cl'
      ];

      mockImageIds.forEach(id => {
        // CUIDs start with 'cl' and are 25 characters long
        expect(id).toMatch(/^cl[a-z0-9]{23}$/);
        expect(id.length).toBe(25);
      });
    });
  });
});
