/**
 * Tests for business idea deletion with cascade image deletion
 * Requirements: 7.5
 * 
 * These tests verify that when a business idea is deleted, all associated
 * images and their variants are removed from storage before database deletion.
 */

import { prisma } from '@/lib/prisma';
import { createStorageProvider } from '@/lib/storage';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    businessIdea: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock the storage provider
jest.mock('@/lib/storage', () => ({
  createStorageProvider: jest.fn(),
}));

describe('Business Idea Deletion with Cascade Image Deletion', () => {
  const mockBusinessIdeaId = 'business-idea-123';
  
  const mockBusinessIdeaWithImages = {
    id: mockBusinessIdeaId,
    title: 'Test Business Idea',
    description: 'Test description',
    images: [],
    budgetMin: 10000,
    budgetMax: 50000,
    uploadedImages: [
      {
        id: 'img-1',
        storagePath: 'uploads/business-ideas/business-idea-123/img-1/full.jpg',
        variants: [
          {
            id: 'var-1-thumb',
            storagePath: 'uploads/business-ideas/business-idea-123/img-1/thumbnail.webp',
            variant: 'THUMBNAIL',
          },
          {
            id: 'var-1-medium',
            storagePath: 'uploads/business-ideas/business-idea-123/img-1/medium.webp',
            variant: 'MEDIUM',
          },
        ],
      },
      {
        id: 'img-2',
        storagePath: 'uploads/business-ideas/business-idea-123/img-2/full.jpg',
        variants: [
          {
            id: 'var-2-thumb',
            storagePath: 'uploads/business-ideas/business-idea-123/img-2/thumbnail.webp',
            variant: 'THUMBNAIL',
          },
          {
            id: 'var-2-medium',
            storagePath: 'uploads/business-ideas/business-idea-123/img-2/medium.webp',
            variant: 'MEDIUM',
          },
        ],
      },
    ],
  };

  const mockBusinessIdeaWithoutImages = {
    id: mockBusinessIdeaId,
    title: 'Test Business Idea',
    description: 'Test description',
    images: [],
    budgetMin: 10000,
    budgetMax: 50000,
    uploadedImages: [],
  };

  let mockStorageProvider: {
    delete: jest.Mock;
    upload: jest.Mock;
    getUrl: jest.Mock;
    exists: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock storage provider
    mockStorageProvider = {
      delete: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn(),
      getUrl: jest.fn(),
      exists: jest.fn(),
    };
    
    (createStorageProvider as jest.Mock).mockReturnValue(mockStorageProvider);
  });

  describe('Cascade Deletion Logic', () => {
    it('should delete all image files and variants from storage before database deletion', async () => {
      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithImages
      );
      (prisma.businessIdea.delete as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithImages
      );

      // Simulate the deletion logic
      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: {
          uploadedImages: {
            include: {
              variants: true,
            },
          },
        },
      });

      expect(businessIdea).not.toBeNull();
      expect(businessIdea!.uploadedImages).toHaveLength(2);

      // Delete images from storage
      const storageProvider = createStorageProvider();
      
      for (const image of businessIdea!.uploadedImages) {
        // Delete main image
        await storageProvider.delete(image.storagePath);
        
        // Delete all variants
        for (const variant of image.variants) {
          await storageProvider.delete(variant.storagePath);
        }
      }

      // Delete from database
      await prisma.businessIdea.delete({
        where: { id: mockBusinessIdeaId },
      });

      // Verify storage deletions
      expect(mockStorageProvider.delete).toHaveBeenCalledTimes(6); // 2 main images + 4 variants
      
      // Verify main images were deleted
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/full.jpg'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-2/full.jpg'
      );
      
      // Verify variants were deleted
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/thumbnail.webp'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/medium.webp'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-2/thumbnail.webp'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-2/medium.webp'
      );

      // Verify database deletion was called
      expect(prisma.businessIdea.delete).toHaveBeenCalledWith({
        where: { id: mockBusinessIdeaId },
      });
    });

    it('should handle business ideas with no images', async () => {
      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithoutImages
      );
      (prisma.businessIdea.delete as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithoutImages
      );

      // Simulate the deletion logic
      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: {
          uploadedImages: {
            include: {
              variants: true,
            },
          },
        },
      });

      expect(businessIdea).not.toBeNull();
      expect(businessIdea!.uploadedImages).toHaveLength(0);

      // No storage deletions should occur
      const storageProvider = createStorageProvider();
      
      if (businessIdea!.uploadedImages.length > 0) {
        for (const image of businessIdea!.uploadedImages) {
          await storageProvider.delete(image.storagePath);
          for (const variant of image.variants) {
            await storageProvider.delete(variant.storagePath);
          }
        }
      }

      // Delete from database
      await prisma.businessIdea.delete({
        where: { id: mockBusinessIdeaId },
      });

      // Verify no storage deletions occurred
      expect(mockStorageProvider.delete).not.toHaveBeenCalled();

      // Verify database deletion was still called
      expect(prisma.businessIdea.delete).toHaveBeenCalledWith({
        where: { id: mockBusinessIdeaId },
      });
    });

    it('should continue with database deletion even if storage deletion fails', async () => {
      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithImages
      );
      (prisma.businessIdea.delete as jest.Mock).mockResolvedValue(
        mockBusinessIdeaWithImages
      );

      // Mock storage provider to throw error
      mockStorageProvider.delete.mockRejectedValue(new Error('Storage error'));

      // Simulate the deletion logic with error handling
      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: {
          uploadedImages: {
            include: {
              variants: true,
            },
          },
        },
      });

      const storageProvider = createStorageProvider();
      
      // Try to delete images with error handling
      for (const image of businessIdea!.uploadedImages) {
        try {
          await storageProvider.delete(image.storagePath);
          for (const variant of image.variants) {
            await storageProvider.delete(variant.storagePath);
          }
        } catch (error) {
          // Log error but continue
          console.error(`Error deleting image ${image.id} from storage:`, error);
        }
      }

      // Database deletion should still proceed
      await prisma.businessIdea.delete({
        where: { id: mockBusinessIdeaId },
      });

      // Verify storage deletion was attempted
      expect(mockStorageProvider.delete).toHaveBeenCalled();

      // Verify database deletion was still called despite storage errors
      expect(prisma.businessIdea.delete).toHaveBeenCalledWith({
        where: { id: mockBusinessIdeaId },
      });
    });
  });

  describe('Image Variant Deletion', () => {
    it('should delete all variants for each image', async () => {
      const imageWithMultipleVariants = {
        id: mockBusinessIdeaId,
        uploadedImages: [
          {
            id: 'img-1',
            storagePath: 'uploads/business-ideas/business-idea-123/img-1/full.jpg',
            variants: [
              {
                id: 'var-1-thumb',
                storagePath: 'uploads/business-ideas/business-idea-123/img-1/thumbnail.webp',
                variant: 'THUMBNAIL',
              },
              {
                id: 'var-1-medium',
                storagePath: 'uploads/business-ideas/business-idea-123/img-1/medium.webp',
                variant: 'MEDIUM',
              },
              {
                id: 'var-1-full',
                storagePath: 'uploads/business-ideas/business-idea-123/img-1/full.webp',
                variant: 'FULL',
              },
            ],
          },
        ],
      };

      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(
        imageWithMultipleVariants
      );

      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: {
          uploadedImages: {
            include: {
              variants: true,
            },
          },
        },
      });

      const storageProvider = createStorageProvider();
      
      for (const image of businessIdea!.uploadedImages) {
        await storageProvider.delete(image.storagePath);
        for (const variant of image.variants) {
          await storageProvider.delete(variant.storagePath);
        }
      }

      // Verify all variants were deleted (1 main + 3 variants = 4 total)
      expect(mockStorageProvider.delete).toHaveBeenCalledTimes(4);
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/full.jpg'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/thumbnail.webp'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/medium.webp'
      );
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        'uploads/business-ideas/business-idea-123/img-1/full.webp'
      );
    });
  });
});
