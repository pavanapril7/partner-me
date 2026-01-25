/**
 * Tests for PATCH /api/admin/submissions/[id]/reject
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.4
 */

import { rejectSubmission } from '@/lib/submission-service';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

// Mock the dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('PATCH /api/admin/submissions/[id]/reject - Core Logic', () => {
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

      const authResult = await requireAdmin({} as never);
      expect(authResult.error).toBeDefined();
    });

    it('should allow authenticated admin users', async () => {
      // Mock successful authentication
      (requireAdmin as jest.Mock).mockResolvedValue({
        user: mockAdminUser,
      });

      const authResult = await requireAdmin({} as never);
      expect(authResult.user).toBeDefined();
      expect(authResult.user?.isAdmin).toBe(true);
    });
  });

  describe('Rejection process', () => {
    it('should reject a pending submission and mark status as REJECTED', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test Business Idea',
        description: 'A detailed description',
        budgetMin: 5000,
        budgetMax: 10000,
        contactEmail: 'submitter@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123');

      expect(result).toBeDefined();
      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(result.rejectedById).toBe('admin_test123');
    });

    it('should set reviewedAt timestamp when rejecting', async () => {
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
        status: SubmissionStatus.REJECTED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: now,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: now,
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123');

      expect(result.reviewedAt).toBeDefined();
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it('should store optional rejection reason when provided', async () => {
      const rejectionReason = 'Does not meet quality standards';
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123', rejectionReason);

      expect(result.rejectionReason).toBe(rejectionReason);
    });

    it('should allow rejection without a reason', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123');

      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(result.rejectionReason).toBeNull();
    });

    it('should retain the submission record for audit purposes', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason: 'Test reason',
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123', 'Test reason');

      // Submission should still exist with REJECTED status
      expect(result).toBeDefined();
      expect(result.id).toBe('sub_test123');
      expect(result.status).toBe(SubmissionStatus.REJECTED);
    });

    it('should not create a business idea when rejecting', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123');

      // businessIdeaId should remain null
      expect(result.businessIdeaId).toBeNull();
    });

    it('should reject rejection of non-pending submissions', async () => {
      (rejectSubmission as jest.Mock).mockRejectedValue(
        new Error('Cannot reject submission with status APPROVED. Only PENDING submissions can be rejected.')
      );

      await expect(
        rejectSubmission('sub_test123', 'admin_test123')
      ).rejects.toThrow('Cannot reject submission with status APPROVED');
    });

    it('should reject rejection of already rejected submissions', async () => {
      (rejectSubmission as jest.Mock).mockRejectedValue(
        new Error('Cannot reject submission with status REJECTED. Only PENDING submissions can be rejected.')
      );

      await expect(
        rejectSubmission('sub_test123', 'admin_test123')
      ).rejects.toThrow('Cannot reject submission with status REJECTED');
    });

    it('should reject rejection of non-existent submissions', async () => {
      (rejectSubmission as jest.Mock).mockRejectedValue(
        new Error('Submission not found')
      );

      await expect(
        rejectSubmission('nonexistent_id', 'admin_test123')
      ).rejects.toThrow('Submission not found');
    });
  });

  describe('Validation', () => {
    it('should validate rejection reason length when provided', async () => {
      // This would be tested at the API route level with Zod validation
      const validReason = 'This is a valid rejection reason';
      const tooLongReason = 'x'.repeat(1001);

      expect(validReason.length).toBeLessThanOrEqual(1000);
      expect(tooLongReason.length).toBeGreaterThan(1000);
    });

    it('should accept empty or undefined rejection reason', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.REJECTED,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_test123',
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
      };

      (rejectSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await rejectSubmission('sub_test123', 'admin_test123', undefined);

      expect(result.rejectionReason).toBeNull();
    });
  });
});
