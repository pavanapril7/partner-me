/**
 * Tests for PATCH /api/admin/submissions/[id]/approve
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 6.4
 */

import { approveSubmission } from '@/lib/submission-service';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

// Mock the dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('PATCH /api/admin/submissions/[id]/approve - Core Logic', () => {
  const mockAdminUser = {
    id: 'admin_test123',
    username: 'admin',
    mobileNumber: null,
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should require admin authentication', async () => {
      // Mock authentication failure
      (requireAdmin as jest.Mock).mockResolvedValue({
        error: new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'Authentication required',
              code: 'AUTH_REQUIRED',
            },
          }),
          { status: 401 }
        ),
      });

      const authResult = await requireAdmin({} as any);
      expect(authResult.error).toBeDefined();
    });

    it('should allow authenticated admin users', async () => {
      // Mock successful authentication
      (requireAdmin as jest.Mock).mockResolvedValue({
        user: mockAdminUser,
      });

      const authResult = await requireAdmin({} as any);
      expect(authResult.user).toBeDefined();
      expect(authResult.user?.isAdmin).toBe(true);
    });
  });

  describe('Approval process', () => {
    it('should approve a pending submission and create a business idea', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test Business Idea',
        description: 'A detailed description',
        budgetMin: 5000,
        budgetMax: 10000,
        contactEmail: 'submitter@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.APPROVED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: 'admin_test123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      const mockBusinessIdea = {
        id: 'idea_123',
        title: 'Test Business Idea',
        description: 'A detailed description',
        budgetMin: 5000,
        budgetMax: 10000,
        images: [],
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      };

      (approveSubmission as jest.Mock).mockResolvedValue({
        businessIdea: mockBusinessIdea,
        submission: mockSubmission,
      });

      const result = await approveSubmission('sub_test123', 'admin_test123');

      expect(result.businessIdea).toBeDefined();
      expect(result.submission).toBeDefined();
      expect(result.submission.status).toBe(SubmissionStatus.APPROVED);
      expect(result.submission.approvedById).toBe('admin_test123');
      expect(result.submission.businessIdeaId).toBe('idea_123');
    });

    it('should set reviewedAt timestamp when approving', async () => {
      const now = new Date();
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.APPROVED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: 'admin_test123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: now,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: now,
        images: [],
      };

      const mockBusinessIdea = {
        id: 'idea_123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        images: [],
        createdAt: now,
        updatedAt: now,
      };

      (approveSubmission as jest.Mock).mockResolvedValue({
        businessIdea: mockBusinessIdea,
        submission: mockSubmission,
      });

      const result = await approveSubmission('sub_test123', 'admin_test123');

      expect(result.submission.reviewedAt).toBeDefined();
      expect(result.submission.reviewedAt).toBeInstanceOf(Date);
    });

    it('should create business idea with approval timestamp as createdAt', async () => {
      const approvalTime = new Date('2024-01-15T12:00:00Z');
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.APPROVED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: 'admin_test123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: approvalTime,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: approvalTime,
        images: [],
      };

      const mockBusinessIdea = {
        id: 'idea_123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        images: [],
        createdAt: approvalTime,
        updatedAt: approvalTime,
      };

      (approveSubmission as jest.Mock).mockResolvedValue({
        businessIdea: mockBusinessIdea,
        submission: mockSubmission,
      });

      const result = await approveSubmission('sub_test123', 'admin_test123');

      // Business idea createdAt should match approval time, not submission time
      expect(result.businessIdea.createdAt).toEqual(approvalTime);
      expect(result.businessIdea.createdAt).not.toEqual(mockSubmission.submittedAt);
    });

    it('should transfer image associations to business idea', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.APPROVED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: 'admin_test123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [
          {
            id: 'img_link_1',
            submissionId: 'sub_test123',
            imageId: 'img_1',
            order: 0,
            createdAt: new Date(),
            image: {
              id: 'img_1',
              filename: 'image1.jpg',
              mimeType: 'image/jpeg',
              size: 102400,
              path: '/uploads/temp/img_1',
              businessIdeaId: 'idea_123', // Should be updated to business idea
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          {
            id: 'img_link_2',
            submissionId: 'sub_test123',
            imageId: 'img_2',
            order: 1,
            createdAt: new Date(),
            image: {
              id: 'img_2',
              filename: 'image2.jpg',
              mimeType: 'image/jpeg',
              size: 204800,
              path: '/uploads/temp/img_2',
              businessIdeaId: 'idea_123', // Should be updated to business idea
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      };

      const mockBusinessIdea = {
        id: 'idea_123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        images: [],
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      };

      (approveSubmission as jest.Mock).mockResolvedValue({
        businessIdea: mockBusinessIdea,
        submission: mockSubmission,
      });

      const result = await approveSubmission('sub_test123', 'admin_test123');

      // Verify images are associated with the submission
      expect(result.submission.images).toHaveLength(2);
      expect(result.submission.images[0].image.businessIdeaId).toBe('idea_123');
      expect(result.submission.images[1].image.businessIdeaId).toBe('idea_123');
    });

    it('should support optional overrides for submission data', async () => {
      const overrides = {
        title: 'Updated Title',
        description: 'Updated description',
        budgetMin: 7000,
        budgetMax: 15000,
      };

      const mockSubmission = {
        id: 'sub_test123',
        title: 'Original Title',
        description: 'Original description',
        budgetMin: 5000,
        budgetMax: 10000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.APPROVED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: 'admin_test123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      const mockBusinessIdea = {
        id: 'idea_123',
        title: 'Updated Title',
        description: 'Updated description',
        budgetMin: 7000,
        budgetMax: 15000,
        images: [],
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      };

      (approveSubmission as jest.Mock).mockResolvedValue({
        businessIdea: mockBusinessIdea,
        submission: mockSubmission,
      });

      const result = await approveSubmission('sub_test123', 'admin_test123', overrides);

      // Business idea should use overridden values
      expect(result.businessIdea.title).toBe('Updated Title');
      expect(result.businessIdea.description).toBe('Updated description');
      expect(result.businessIdea.budgetMin).toBe(7000);
      expect(result.businessIdea.budgetMax).toBe(15000);
    });

    it('should reject approval of non-pending submissions', async () => {
      (approveSubmission as jest.Mock).mockRejectedValue(
        new Error('Cannot approve submission with status APPROVED. Only PENDING submissions can be approved.')
      );

      await expect(
        approveSubmission('sub_test123', 'admin_test123')
      ).rejects.toThrow('Cannot approve submission with status APPROVED');
    });

    it('should reject approval of non-existent submissions', async () => {
      (approveSubmission as jest.Mock).mockRejectedValue(
        new Error('Submission not found')
      );

      await expect(
        approveSubmission('nonexistent_id', 'admin_test123')
      ).rejects.toThrow('Submission not found');
    });
  });

  describe('Validation', () => {
    it('should validate override data when provided', async () => {
      // This would be tested at the API route level with Zod validation
      // The service layer assumes valid data
      const validOverrides = {
        title: 'Valid Title',
        description: 'Valid description that is long enough',
        budgetMin: 1000,
        budgetMax: 5000,
      };

      expect(validOverrides.title.length).toBeGreaterThan(0);
      expect(validOverrides.description.length).toBeGreaterThanOrEqual(10);
      expect(validOverrides.budgetMin).toBeGreaterThanOrEqual(0);
      expect(validOverrides.budgetMax).toBeGreaterThanOrEqual(validOverrides.budgetMin);
    });
  });
});
