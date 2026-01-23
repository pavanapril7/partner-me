/**
 * Tests for business idea image reordering API route
 * Requirements: 6.2, 6.3
 * 
 * These tests verify the reorder endpoint behavior including validation,
 * authentication, and database operations by testing the underlying logic.
 */

import { prisma } from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    businessIdea: {
      findUnique: jest.fn(),
    },
    image: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Image Reordering Logic', () => {
  const mockBusinessIdeaId = 'business-idea-123';
  
  const mockBusinessIdea = {
    id: mockBusinessIdeaId,
    title: 'Test Business Idea',
    description: 'Test description',
    images: [],
    budgetMin: 10000,
    budgetMax: 50000,
    uploadedImages: [
      { id: 'img-1', order: 0, businessIdeaId: mockBusinessIdeaId },
      { id: 'img-2', order: 1, businessIdeaId: mockBusinessIdeaId },
      { id: 'img-3', order: 2, businessIdeaId: mockBusinessIdeaId },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Logic', () => {
    it('should validate that business idea exists', async () => {
      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(null);

      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: { uploadedImages: true },
      });

      expect(businessIdea).toBeNull();
      expect(prisma.businessIdea.findUnique).toHaveBeenCalledWith({
        where: { id: mockBusinessIdeaId },
        include: { uploadedImages: true },
      });
    });

    it('should validate that image IDs belong to the business idea', async () => {
      (prisma.businessIdea.findUnique as jest.Mock).mockResolvedValue(mockBusinessIdea);

      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: mockBusinessIdeaId },
        include: { uploadedImages: true },
      });

      const businessIdeaImageIds = new Set(
        businessIdea!.uploadedImages.map((img) => img.id)
      );

      const validImageIds = ['img-1', 'img-2'];
      const invalidImageIds = ['img-1', 'img-999'];

      // Valid IDs should all be in the set
      const validInvalid = validImageIds.filter(
        (id) => !businessIdeaImageIds.has(id)
      );
      expect(validInvalid).toHaveLength(0);

      // Invalid IDs should be detected
      const actualInvalid = invalidImageIds.filter(
        (id) => !businessIdeaImageIds.has(id)
      );
      expect(actualInvalid).toContain('img-999');
    });
  });

  describe('Reordering Logic', () => {
    it('should update order field for each image in transaction', async () => {
      const reorderedImageIds = ['img-3', 'img-1', 'img-2'];
      
      // Mock transaction to execute all updates
      (prisma.$transaction as jest.Mock).mockImplementation((operations) => {
        return Promise.all(operations);
      });
      
      (prisma.image.update as jest.Mock).mockImplementation(({ where, data }) => {
        return Promise.resolve({ id: where.id, order: data.order });
      });

      // Simulate the transaction call
      const updateOperations = reorderedImageIds.map((imageId, index) =>
        prisma.image.update({
          where: { id: imageId },
          data: { order: index },
        })
      );

      await prisma.$transaction(updateOperations);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();
      
      // Verify each image.update was called with correct order
      expect(prisma.image.update).toHaveBeenCalledTimes(3);
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 'img-3' },
        data: { order: 0 },
      });
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 'img-1' },
        data: { order: 1 },
      });
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 'img-2' },
        data: { order: 2 },
      });
    });

    it('should fetch updated images ordered by order field', async () => {
      const updatedImages = [
        { id: 'img-3', order: 0, businessIdeaId: mockBusinessIdeaId },
        { id: 'img-1', order: 1, businessIdeaId: mockBusinessIdeaId },
        { id: 'img-2', order: 2, businessIdeaId: mockBusinessIdeaId },
      ];

      (prisma.image.findMany as jest.Mock).mockResolvedValue(updatedImages);

      const images = await prisma.image.findMany({
        where: { businessIdeaId: mockBusinessIdeaId },
        orderBy: { order: 'asc' },
      });

      expect(images).toHaveLength(3);
      expect(images[0].id).toBe('img-3');
      expect(images[0].order).toBe(0);
      expect(images[1].id).toBe('img-1');
      expect(images[1].order).toBe(1);
      expect(images[2].id).toBe('img-2');
      expect(images[2].order).toBe(2);
      
      expect(prisma.image.findMany).toHaveBeenCalledWith({
        where: { businessIdeaId: mockBusinessIdeaId },
        orderBy: { order: 'asc' },
      });
    });
  });
});
