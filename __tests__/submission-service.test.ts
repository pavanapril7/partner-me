/**
 * Tests for submission service layer
 * 
 * These tests verify the business logic for anonymous submissions
 */

import { prisma } from '../src/lib/prisma';
import {
  createAnonymousSubmission,
  getPendingSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
  updateSubmission,
  getSubmissionStats,
} from '../src/lib/submission-service';
import { SubmissionStatus } from '@prisma/client';

// Mock data
const mockSubmissionInput = {
  title: 'Test Business Idea',
  description: 'This is a test business idea description with enough characters.',
  budgetMin: 10000,
  budgetMax: 50000,
  contactEmail: 'test@example.com',
  contactPhone: '+1234567890',
  submitterIp: '192.168.1.1',
  imageIds: [],
};

let mockAdminUserId: string;

describe('Submission Service', () => {
  // Create a test admin user before all tests
  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: 'test-admin@example.com',
        name: 'Test Admin',
        isAdmin: true,
      },
    });
    mockAdminUserId = adminUser.id;
  });

  // Clean up test data after each test
  afterEach(async () => {
    await prisma.submissionAuditLog.deleteMany({});
    await prisma.anonymousSubmissionImage.deleteMany({});
    await prisma.anonymousSubmission.deleteMany({});
    await prisma.image.deleteMany({
      where: { businessIdeaId: null },
    });
    await prisma.businessIdea.deleteMany({
      where: {
        title: { contains: 'Test' },
      },
    });
  });

  // Clean up admin user after all tests
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test-admin@example.com' },
    });
    await prisma.$disconnect();
  });

  describe('createAnonymousSubmission', () => {
    it('should create a submission with PENDING status', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      expect(submission).toBeDefined();
      expect(submission?.status).toBe(SubmissionStatus.PENDING);
      expect(submission?.title).toBe(mockSubmissionInput.title);
      expect(submission?.description).toBe(mockSubmissionInput.description);
      expect(submission?.budgetMin).toBe(mockSubmissionInput.budgetMin);
      expect(submission?.budgetMax).toBe(mockSubmissionInput.budgetMax);
      expect(submission?.contactEmail).toBe(mockSubmissionInput.contactEmail);
      expect(submission?.contactPhone).toBe(mockSubmissionInput.contactPhone);
      expect(submission?.submitterIp).toBe(mockSubmissionInput.submitterIp);
    });

    it('should flag submissions with spam patterns', async () => {
      const spamSubmission = {
        ...mockSubmissionInput,
        title: 'BUY NOW!!! CLICK HERE!!!',
        description: 'MAKE MONEY FAST!!!! GUARANTEED RESULTS!!!! CLICK HERE NOW!!!!',
      };

      const submission = await createAnonymousSubmission(spamSubmission);

      expect(submission?.flaggedForReview).toBe(true);
      expect(submission?.flagReason).toBeDefined();
    });

    it('should create audit log entry', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const auditLogs = await prisma.submissionAuditLog.findMany({
        where: { submissionId: submission?.id },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('CREATED');
      expect(auditLogs[0].performedBy).toBeNull(); // System action
    });
  });

  describe('getPendingSubmissions', () => {
    it('should return only pending submissions', async () => {
      // Create submissions with different statuses
      const pending1 = await createAnonymousSubmission(mockSubmissionInput);
      const pending2 = await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Another Test',
      });

      // Manually create an approved submission
      await prisma.anonymousSubmission.create({
        data: {
          title: 'Approved Test',
          description: mockSubmissionInput.description,
          budgetMin: mockSubmissionInput.budgetMin,
          budgetMax: mockSubmissionInput.budgetMax,
          contactEmail: mockSubmissionInput.contactEmail,
          contactPhone: mockSubmissionInput.contactPhone,
          submitterIp: mockSubmissionInput.submitterIp,
          status: SubmissionStatus.APPROVED,
        },
      });

      const result = await getPendingSubmissions();

      expect(result.data).toHaveLength(2);
      expect(result.data.every((s) => s.status === SubmissionStatus.PENDING)).toBe(true);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by search keyword', async () => {
      await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Mobile App Idea',
      });
      await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Web Platform Idea',
      });

      const result = await getPendingSubmissions({ search: 'Mobile' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toContain('Mobile');
    });

    it('should filter by flagged status', async () => {
      await createAnonymousSubmission(mockSubmissionInput);
      await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'BUY NOW CLICK HERE',
        description: 'MAKE MONEY FAST GUARANTEED',
      });

      const result = await getPendingSubmissions({ flagged: true });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((s) => s.flaggedForReview)).toBe(true);
    });

    it('should paginate results', async () => {
      // Create 5 submissions
      for (let i = 0; i < 5; i++) {
        await createAnonymousSubmission({
          ...mockSubmissionInput,
          title: `Test ${i}`,
        });
      }

      const page1 = await getPendingSubmissions({ page: 1, limit: 2 });
      const page2 = await getPendingSubmissions({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.total).toBe(5);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission with complete details', async () => {
      const created = await createAnonymousSubmission(mockSubmissionInput);

      const submission = await getSubmissionById(created!.id);

      expect(submission).toBeDefined();
      expect(submission?.id).toBe(created?.id);
      expect(submission?.images).toBeDefined();
      expect(submission?.auditLogs).toBeDefined();
      expect(submission?.auditLogs.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent submission', async () => {
      const submission = await getSubmissionById('non-existent-id');

      expect(submission).toBeNull();
    });
  });

  describe('approveSubmission', () => {
    it('should create business idea and update submission status', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const result = await approveSubmission(submission!.id, mockAdminUserId);

      expect(result.businessIdea).toBeDefined();
      expect(result.businessIdea.title).toBe(mockSubmissionInput.title);
      expect(result.businessIdea.description).toBe(mockSubmissionInput.description);
      expect(result.businessIdea.budgetMin).toBe(mockSubmissionInput.budgetMin);
      expect(result.businessIdea.budgetMax).toBe(mockSubmissionInput.budgetMax);

      expect(result.submission.status).toBe(SubmissionStatus.APPROVED);
      expect(result.submission.approvedById).toBe(mockAdminUserId);
      expect(result.submission.reviewedAt).toBeDefined();
      expect(result.submission.businessIdeaId).toBe(result.businessIdea.id);
    });

    it('should apply overrides when provided', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const overrides = {
        title: 'Modified Title',
        budgetMin: 20000,
      };

      const result = await approveSubmission(
        submission!.id,
        mockAdminUserId,
        overrides
      );

      expect(result.businessIdea.title).toBe(overrides.title);
      expect(result.businessIdea.budgetMin).toBe(overrides.budgetMin);
      expect(result.businessIdea.description).toBe(mockSubmissionInput.description);
    });

    it('should create audit log entry', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      await approveSubmission(submission!.id, mockAdminUserId);

      const auditLogs = await prisma.submissionAuditLog.findMany({
        where: {
          submissionId: submission!.id,
          action: 'APPROVED',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].performedBy).toBe(mockAdminUserId);
    });

    it('should throw error for non-pending submission', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);
      await approveSubmission(submission!.id, mockAdminUserId);

      await expect(
        approveSubmission(submission!.id, mockAdminUserId)
      ).rejects.toThrow('Only PENDING submissions can be approved');
    });
  });

  describe('rejectSubmission', () => {
    it('should update submission status to REJECTED', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const result = await rejectSubmission(
        submission!.id,
        mockAdminUserId,
        'Not suitable for platform'
      );

      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(result.rejectedById).toBe(mockAdminUserId);
      expect(result.rejectionReason).toBe('Not suitable for platform');
      expect(result.reviewedAt).toBeDefined();
    });

    it('should work without rejection reason', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const result = await rejectSubmission(submission!.id, mockAdminUserId);

      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(result.rejectionReason).toBeNull();
    });

    it('should create audit log entry', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      await rejectSubmission(submission!.id, mockAdminUserId, 'Test reason');

      const auditLogs = await prisma.submissionAuditLog.findMany({
        where: {
          submissionId: submission!.id,
          action: 'REJECTED',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].performedBy).toBe(mockAdminUserId);
    });

    it('should throw error for non-pending submission', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);
      await rejectSubmission(submission!.id, mockAdminUserId);

      await expect(
        rejectSubmission(submission!.id, mockAdminUserId)
      ).rejects.toThrow('Only PENDING submissions can be rejected');
    });
  });

  describe('updateSubmission', () => {
    it('should update submission fields', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      const updates = {
        title: 'Updated Title',
        budgetMin: 15000,
        budgetMax: 60000,
      };

      const result = await updateSubmission(
        submission!.id,
        mockAdminUserId,
        updates
      );

      expect(result.title).toBe(updates.title);
      expect(result.budgetMin).toBe(updates.budgetMin);
      expect(result.budgetMax).toBe(updates.budgetMax);
      expect(result.description).toBe(mockSubmissionInput.description); // Unchanged
    });

    it('should preserve original submission timestamp', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);
      const originalSubmittedAt = submission!.submittedAt;

      // Wait a bit to ensure timestamps would differ
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await updateSubmission(submission!.id, mockAdminUserId, {
        title: 'Updated Title',
      });

      expect(result.submittedAt.getTime()).toBe(originalSubmittedAt.getTime());
    });

    it('should create audit log with changes', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);

      await updateSubmission(submission!.id, mockAdminUserId, {
        title: 'Updated Title',
      });

      const auditLogs = await prisma.submissionAuditLog.findMany({
        where: {
          submissionId: submission!.id,
          action: 'EDITED',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].performedBy).toBe(mockAdminUserId);
      expect(auditLogs[0].details).toBeDefined();
    });

    it('should throw error for non-pending submission', async () => {
      const submission = await createAnonymousSubmission(mockSubmissionInput);
      await approveSubmission(submission!.id, mockAdminUserId);

      await expect(
        updateSubmission(submission!.id, mockAdminUserId, { title: 'New Title' })
      ).rejects.toThrow('Only PENDING submissions can be edited');
    });
  });

  describe('getSubmissionStats', () => {
    it('should return accurate statistics', async () => {
      // Create various submissions
      await createAnonymousSubmission(mockSubmissionInput); // Pending
      await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Test 2',
      }); // Pending

      const submission3 = await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Test 3',
      });
      await approveSubmission(submission3!.id, mockAdminUserId); // Approved

      const submission4 = await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'Test 4',
      });
      await rejectSubmission(submission4!.id, mockAdminUserId); // Rejected

      const stats = await getSubmissionStats();

      expect(stats.pending).toBe(2);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.approvedLast30Days).toBe(1);
      expect(stats.rejectedLast30Days).toBe(1);
      expect(stats.averageReviewTimeHours).toBeGreaterThanOrEqual(0);
    });

    it('should count flagged submissions', async () => {
      await createAnonymousSubmission({
        ...mockSubmissionInput,
        title: 'BUY NOW CLICK HERE',
        description: 'MAKE MONEY FAST GUARANTEED',
      });

      const stats = await getSubmissionStats();

      expect(stats.flaggedCount).toBeGreaterThan(0);
    });

    it('should return zero for empty database', async () => {
      const stats = await getSubmissionStats();

      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.averageReviewTimeHours).toBe(0);
    });
  });
});
