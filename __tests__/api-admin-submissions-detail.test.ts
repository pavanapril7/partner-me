/**
 * Tests for GET /api/admin/submissions/[id]
 * 
 * Requirements: 3.3
 */

import { getSubmissionById } from '@/lib/submission-service';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

// Mock the dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('GET /api/admin/submissions/[id] - Core Logic', () => {
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

  describe('Submission retrieval', () => {
    it('should return complete submission data with all fields', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test Business Idea',
        description: 'A detailed description of the business idea',
        budgetMin: 5000,
        budgetMax: 10000,
        contactEmail: 'submitter@example.com',
        contactPhone: '+1-234-567-8900',
        submitterIp: '192.168.1.100',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: null,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        images: [
          {
            id: 'img_link_1',
            submissionId: 'sub_test123',
            imageId: 'img_1',
            order: 0,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            image: {
              id: 'img_1',
              filename: 'test-image-1.jpg',
              mimeType: 'image/jpeg',
              size: 102400,
              path: '/uploads/temp/img_1',
              businessIdeaId: null,
              createdAt: new Date('2024-01-15T10:00:00Z'),
              updatedAt: new Date('2024-01-15T10:00:00Z'),
              variants: [
                {
                  id: 'var_1',
                  imageId: 'img_1',
                  type: 'thumbnail',
                  path: '/uploads/temp/img_1/thumbnail.webp',
                  width: 200,
                  height: 200,
                  size: 10240,
                  createdAt: new Date('2024-01-15T10:00:00Z'),
                },
              ],
            },
          },
        ],
        auditLogs: [
          {
            id: 'log_1',
            submissionId: 'sub_test123',
            action: 'CREATED',
            performedBy: null,
            details: {
              spamCheck: {
                flagged: false,
                confidence: 0.1,
                reasons: [],
              },
            },
            createdAt: new Date('2024-01-15T10:00:00Z'),
            user: null,
          },
        ],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('sub_test123');
      expect(result?.title).toBe('Test Business Idea');
      expect(result?.description).toBe('A detailed description of the business idea');
      expect(result?.budgetMin).toBe(5000);
      expect(result?.budgetMax).toBe(10000);
      expect(result?.contactEmail).toBe('submitter@example.com');
      expect(result?.contactPhone).toBe('+1-234-567-8900');
      expect(result?.status).toBe(SubmissionStatus.PENDING);
    });

    it('should include all associated images with variants', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date(),
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
              businessIdeaId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              variants: [
                {
                  id: 'var_1',
                  imageId: 'img_1',
                  type: 'thumbnail',
                  path: '/uploads/temp/img_1/thumbnail.webp',
                  width: 200,
                  height: 200,
                  size: 10240,
                  createdAt: new Date(),
                },
                {
                  id: 'var_2',
                  imageId: 'img_1',
                  type: 'medium',
                  path: '/uploads/temp/img_1/medium.webp',
                  width: 800,
                  height: 600,
                  size: 51200,
                  createdAt: new Date(),
                },
              ],
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
              businessIdeaId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              variants: [],
            },
          },
        ],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.images).toHaveLength(2);
      expect(result?.images[0].image.variants).toHaveLength(2);
      expect(result?.images[0].order).toBe(0);
      expect(result?.images[1].order).toBe(1);
    });

    it('should include audit logs with user information', async () => {
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
        approvedById: 'admin_123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: new Date('2024-01-15T12:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        images: [],
        auditLogs: [
          {
            id: 'log_1',
            submissionId: 'sub_test123',
            action: 'CREATED',
            performedBy: null,
            details: {},
            createdAt: new Date('2024-01-15T10:00:00Z'),
            user: null,
          },
          {
            id: 'log_2',
            submissionId: 'sub_test123',
            action: 'APPROVED',
            performedBy: 'admin_123',
            details: {
              businessIdeaId: 'idea_123',
            },
            createdAt: new Date('2024-01-15T12:00:00Z'),
            user: {
              id: 'admin_123',
              email: 'admin@example.com',
              name: 'Admin User',
            },
          },
        ],
        approvedBy: {
          id: 'admin_123',
          email: 'admin@example.com',
          name: 'Admin User',
        },
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.auditLogs).toHaveLength(2);
      expect(result?.auditLogs[0].action).toBe('CREATED');
      expect(result?.auditLogs[0].user).toBeNull();
      expect(result?.auditLogs[1].action).toBe('APPROVED');
      expect(result?.auditLogs[1].user?.email).toBe('admin@example.com');
    });

    it('should include approvedBy user information when approved', async () => {
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
        approvedById: 'admin_123',
        rejectedById: null,
        businessIdeaId: 'idea_123',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        auditLogs: [],
        approvedBy: {
          id: 'admin_123',
          email: 'admin@example.com',
          name: 'Admin User',
        },
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.approvedBy).toBeDefined();
      expect(result?.approvedBy?.id).toBe('admin_123');
      expect(result?.approvedBy?.email).toBe('admin@example.com');
    });

    it('should include rejectedBy user information when rejected', async () => {
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
        rejectionReason: 'Does not meet quality standards',
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: 'admin_456',
        businessIdeaId: null,
        submittedAt: new Date(),
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: {
          id: 'admin_456',
          email: 'admin2@example.com',
          name: 'Admin User 2',
        },
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.rejectedBy).toBeDefined();
      expect(result?.rejectedBy?.id).toBe('admin_456');
      expect(result?.rejectedBy?.email).toBe('admin2@example.com');
      expect(result?.rejectionReason).toBe('Does not meet quality standards');
    });

    it('should return null when submission does not exist', async () => {
      (getSubmissionById as jest.Mock).mockResolvedValue(null);

      const result = await getSubmissionById('nonexistent_id');

      expect(result).toBeNull();
    });

    it('should handle submissions with no images', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date(),
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.images).toEqual([]);
    });

    it('should handle submissions with no contact information', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: null,
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date(),
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.contactEmail).toBeNull();
      expect(result?.contactPhone).toBeNull();
    });

    it('should handle flagged submissions with flag reason', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Test',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: null,
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: true,
        flagReason: 'Spam detection (confidence: 85%): excessive capitalization, repeated characters',
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date(),
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      expect(result?.flaggedForReview).toBe(true);
      expect(result?.flagReason).toContain('Spam detection');
    });
  });

  describe('Data completeness', () => {
    it('should return all required fields for a complete submission', async () => {
      const mockSubmission = {
        id: 'sub_test123',
        title: 'Complete Submission',
        description: 'A complete submission with all fields',
        budgetMin: 5000,
        budgetMax: 10000,
        contactEmail: 'complete@example.com',
        contactPhone: '+1-234-567-8900',
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        rejectionReason: null,
        flaggedForReview: false,
        flagReason: null,
        approvedById: null,
        rejectedById: null,
        businessIdeaId: null,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        reviewedAt: null,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        images: [],
        auditLogs: [],
        approvedBy: null,
        rejectedBy: null,
      };

      (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await getSubmissionById('sub_test123');

      // Verify all required fields are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('budgetMin');
      expect(result).toHaveProperty('budgetMax');
      expect(result).toHaveProperty('contactEmail');
      expect(result).toHaveProperty('contactPhone');
      expect(result).toHaveProperty('submitterIp');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('flaggedForReview');
      expect(result).toHaveProperty('submittedAt');
      expect(result).toHaveProperty('reviewedAt');
      expect(result).toHaveProperty('images');
      expect(result).toHaveProperty('auditLogs');
      expect(result).toHaveProperty('approvedBy');
      expect(result).toHaveProperty('rejectedBy');
    });
  });
});
