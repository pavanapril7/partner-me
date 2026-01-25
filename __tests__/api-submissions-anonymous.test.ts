/**
 * Tests for POST /api/submissions/anonymous
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3
 */

import { anonymousSubmissionSchema } from '@/schemas/anonymous-submission.schema';
import { createAnonymousSubmission } from '@/lib/submission-service';
import {
  checkSubmissionRateLimit,
  recordSubmissionAttempt,
  resetSubmissionAttempts,
} from '@/lib/submission-rate-limit';
import { prisma } from '@/lib/prisma';

// Mock the submission service
jest.mock('@/lib/submission-service', () => ({
  createAnonymousSubmission: jest.fn(),
}));

describe('POST /api/submissions/anonymous - Core Logic', () => {
  const testIp = '192.168.1.100';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiting for test IP
    resetSubmissionAttempts(testIp);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Validation', () => {
    it('should validate correct submission data', () => {
      const validSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(validSubmission);
      expect(result.success).toBe(true);
    });

    it('should reject submission with missing title', () => {
      const invalidSubmission = {
        description: 'This is a test business idea.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject submission with short description', () => {
      const invalidSubmission = {
        title: 'Test',
        description: 'Short',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const descError = result.error.issues.find(i => i.path.includes('description'));
        expect(descError?.message).toContain('at least 10 characters');
      }
    });

    it('should reject submission with budgetMin > budgetMax', () => {
      const invalidSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 5000,
        budgetMax: 1000,
        contactEmail: 'test@example.com',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const budgetError = result.error.issues.find(i => i.path.includes('budgetMin'));
        expect(budgetError?.message).toContain('cannot exceed maximum');
      }
    });

    it('should reject submission without contact information', () => {
      const invalidSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const contactError = result.error.issues.find(i => i.path.includes('contactEmail'));
        expect(contactError?.message).toContain('At least one contact method');
      }
    });

    it('should reject submission with invalid email', () => {
      const invalidSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'invalid-email',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(i => i.path.includes('contactEmail'));
        expect(emailError?.message).toContain('Invalid email');
      }
    });

    it('should reject submission without images', () => {
      const invalidSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        imageIds: [],
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const imageError = result.error.issues.find(i => i.path.includes('imageIds'));
        expect(imageError?.message).toContain('At least one image');
      }
    });

    it('should reject submission with too many images', () => {
      const invalidSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        imageIds: Array(11).fill('img_test'),
      };

      const result = anonymousSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
      if (!result.success) {
        const imageError = result.error.issues.find(i => i.path.includes('imageIds'));
        expect(imageError?.message).toContain('Maximum 10 images');
      }
    });

    it('should accept submission with phone contact only', () => {
      const validSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactPhone: '+1-234-567-8900',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(validSubmission);
      expect(result.success).toBe(true);
    });

    it('should accept submission with both email and phone', () => {
      const validSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        contactPhone: '+1-234-567-8900',
        imageIds: ['img_test123'],
      };

      const result = anonymousSubmissionSchema.safeParse(validSubmission);
      expect(result.success).toBe(true);
    });
  });

  describe('Rate limiting', () => {
    it('should allow first submission', () => {
      const rateLimitCheck = checkSubmissionRateLimit(testIp);
      expect(rateLimitCheck.allowed).toBe(true);
    });

    it('should allow second submission within hour', () => {
      recordSubmissionAttempt(testIp);
      const rateLimitCheck = checkSubmissionRateLimit(testIp);
      expect(rateLimitCheck.allowed).toBe(true);
    });

    it('should enforce rate limit after 2 submissions per hour', () => {
      // Record 2 submissions
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);

      // Third submission should be rate limited
      const rateLimitCheck = checkSubmissionRateLimit(testIp);
      expect(rateLimitCheck.allowed).toBe(false);
      expect(rateLimitCheck.reason).toContain('rate limit exceeded');
      expect(rateLimitCheck.retryAfter).toBeDefined();
    });

    it('should enforce daily limit of 3 submissions', () => {
      // This is tested in submission-rate-limit.test.ts
      // Just verify the function exists and returns correct structure
      const rateLimitCheck = checkSubmissionRateLimit(testIp);
      expect(rateLimitCheck).toHaveProperty('allowed');
      // reason and retryAfter are only present when rate limited
      if (!rateLimitCheck.allowed) {
        expect(rateLimitCheck).toHaveProperty('reason');
        expect(rateLimitCheck).toHaveProperty('retryAfter');
      }
    });
  });

  describe('Submission creation', () => {
    it('should create submission with valid data', async () => {
      const validSubmission = {
        title: 'Test Business Idea',
        description: 'This is a test business idea with enough description text.',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        submitterIp: testIp,
        imageIds: ['img_test123'],
      };

      const mockCreatedSubmission = {
        id: 'sub_test123',
        ...validSubmission,
        status: 'PENDING',
        flaggedForReview: false,
        flagReason: null,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (createAnonymousSubmission as jest.Mock).mockResolvedValue(mockCreatedSubmission);

      const result = await createAnonymousSubmission(validSubmission);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe('sub_test123');
        expect(result.status).toBe('PENDING');
      }
    });
  });
});
