/**
 * Tests for GET /api/business-ideas endpoint
 * Requirements: 1.4, 10.3
 * 
 * These tests verify that the public business ideas endpoint:
 * - Returns all approved business ideas (admin-created and approved anonymous submissions)
 * - Does NOT include pending or rejected anonymous submissions
 */

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/business-ideas/route';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    businessIdea: {
      findMany: jest.fn(),
    },
    anonymousSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/business-ideas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all business ideas from the BusinessIdea table', async () => {
    const mockBusinessIdeas = [
      {
        id: 'idea-1',
        title: 'Admin Created Idea',
        description: 'Created by admin',
        images: [],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        uploadedImages: [],
      },
      {
        id: 'idea-2',
        title: 'Approved Anonymous Submission',
        description: 'Was an anonymous submission, now approved',
        images: [],
        budgetMin: 20000,
        budgetMax: 100000,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        uploadedImages: [],
      },
    ];

    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(mockBusinessIdeas);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].title).toBe('Admin Created Idea');
    expect(data.data[1].title).toBe('Approved Anonymous Submission');
  });

  it('should query with correct parameters including uploadedImages', async () => {
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(prisma.businessIdea.findMany).toHaveBeenCalledWith({
      include: {
        uploadedImages: {
          orderBy: {
            order: 'asc',
          },
          include: {
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should return business ideas ordered by createdAt descending', async () => {
    const mockBusinessIdeas = [
      {
        id: 'idea-3',
        title: 'Newest Idea',
        description: 'Created most recently',
        images: [],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        uploadedImages: [],
      },
      {
        id: 'idea-1',
        title: 'Oldest Idea',
        description: 'Created first',
        images: [],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        uploadedImages: [],
      },
    ];

    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(mockBusinessIdeas);

    const response = await GET();
    const data = await response.json();

    expect(data.data[0].title).toBe('Newest Idea');
    expect(data.data[1].title).toBe('Oldest Idea');
  });

  it('should return empty array when no business ideas exist', async () => {
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('should handle database errors gracefully', async () => {
    (prisma.businessIdea.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  describe('Anonymous Submission Isolation', () => {
    it('should NOT include pending anonymous submissions in results', async () => {
      // This test verifies that pending anonymous submissions are isolated
      // from the public business ideas query
      
      // Mock: BusinessIdea table has 1 admin-created idea
      const mockBusinessIdeas = [
        {
          id: 'idea-1',
          title: 'Admin Created Idea',
          description: 'Created by admin',
          images: [],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          uploadedImages: [],
        },
      ];

      (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(mockBusinessIdeas);

      // Mock: AnonymousSubmission table has 2 pending submissions
      // These should NOT appear in the business ideas query
      const mockPendingSubmissions = [
        {
          id: 'sub-1',
          title: 'Pending Submission 1',
          description: 'Waiting for approval',
          status: 'PENDING',
          budgetMin: 15000,
          budgetMax: 60000,
          submittedAt: new Date('2024-01-02'),
        },
        {
          id: 'sub-2',
          title: 'Pending Submission 2',
          description: 'Also waiting',
          status: 'PENDING',
          budgetMin: 20000,
          budgetMax: 80000,
          submittedAt: new Date('2024-01-03'),
        },
      ];

      (prisma.anonymousSubmission.findMany as jest.Mock).mockResolvedValue(
        mockPendingSubmissions
      );

      const response = await GET();
      const data = await response.json();

      // Should only return the 1 business idea, not the 2 pending submissions
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Admin Created Idea');
      
      // Verify that pending submissions are not in the results
      const titles = data.data.map((idea: any) => idea.title);
      expect(titles).not.toContain('Pending Submission 1');
      expect(titles).not.toContain('Pending Submission 2');
    });

    it('should NOT include rejected anonymous submissions in results', async () => {
      // This test verifies that rejected anonymous submissions are isolated
      // from the public business ideas query
      
      const mockBusinessIdeas = [
        {
          id: 'idea-1',
          title: 'Admin Created Idea',
          description: 'Created by admin',
          images: [],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          uploadedImages: [],
        },
      ];

      (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(mockBusinessIdeas);

      // Mock: AnonymousSubmission table has rejected submissions
      const mockRejectedSubmissions = [
        {
          id: 'sub-1',
          title: 'Rejected Submission',
          description: 'Was rejected',
          status: 'REJECTED',
          rejectionReason: 'Does not meet quality standards',
          budgetMin: 15000,
          budgetMax: 60000,
          submittedAt: new Date('2024-01-02'),
          reviewedAt: new Date('2024-01-03'),
        },
      ];

      (prisma.anonymousSubmission.findMany as jest.Mock).mockResolvedValue(
        mockRejectedSubmissions
      );

      const response = await GET();
      const data = await response.json();

      // Should only return the 1 business idea, not the rejected submission
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Admin Created Idea');
      
      // Verify that rejected submission is not in the results
      const titles = data.data.map((idea: any) => idea.title);
      expect(titles).not.toContain('Rejected Submission');
    });

    it('should include approved anonymous submissions that created BusinessIdea records', async () => {
      // When an anonymous submission is approved, it creates a BusinessIdea record
      // This test verifies that approved submissions appear in the public list
      
      const mockBusinessIdeas = [
        {
          id: 'idea-1',
          title: 'Admin Created Idea',
          description: 'Created by admin',
          images: [],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          uploadedImages: [],
        },
        {
          id: 'idea-2',
          title: 'Approved Anonymous Submission',
          description: 'Was approved and migrated to BusinessIdea',
          images: [],
          budgetMin: 20000,
          budgetMax: 100000,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          uploadedImages: [],
        },
      ];

      (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(mockBusinessIdeas);

      const response = await GET();
      const data = await response.json();

      // Should return both business ideas
      expect(data.data).toHaveLength(2);
      expect(data.data[0].title).toBe('Admin Created Idea');
      expect(data.data[1].title).toBe('Approved Anonymous Submission');
    });
  });
});
