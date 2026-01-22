/**
 * Tests for partnership requests API routes
 * Requirements: 3.5, 4.5, 11.1, 11.3, 11.4, 11.5, 12.2, 12.4
 * 
 * These tests verify the API route behavior by testing validation
 * schemas and basic functionality.
 */

import { 
  partnershipRequestSchema, 
  partnershipStatusUpdateSchema,
  partnershipRoleSchema,
  partnershipStatusSchema 
} from '@/schemas/business-idea.schema';

describe('Partnership Requests API', () => {
  describe('Partnership Request Schema Validation', () => {
    it('should accept valid partnership request', () => {
      const result = partnershipRequestSchema.safeParse({
        businessIdeaId: 'test-id-123',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        role: 'HELPER',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = partnershipRequestSchema.safeParse({
        businessIdeaId: 'test-id-123',
        name: '',
        phoneNumber: '+1234567890',
        role: 'HELPER',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should reject invalid phone number format', () => {
      const result = partnershipRequestSchema.safeParse({
        businessIdeaId: 'test-id-123',
        name: 'John Doe',
        phoneNumber: 'invalid',
        role: 'HELPER',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('phoneNumber');
      }
    });

    it('should reject invalid role', () => {
      const result = partnershipRequestSchema.safeParse({
        businessIdeaId: 'test-id-123',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        role: 'INVALID_ROLE',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role');
      }
    });

    it('should accept various phone number formats', () => {
      const validFormats = [
        '+1234567890',
        '123-456-7890',
        '+1 234 567 8900',
        '(123) 456-7890',
        '+1 (123) 456-7890',
        '1234567890',
      ];

      validFormats.forEach(phoneNumber => {
        const result = partnershipRequestSchema.safeParse({
          businessIdeaId: 'test-id-123',
          name: 'John Doe',
          phoneNumber,
          role: 'OUTLET',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Partnership Status Update Schema Validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED'];

      validStatuses.forEach(status => {
        const result = partnershipStatusUpdateSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status value', () => {
      const result = partnershipStatusUpdateSchema.safeParse({
        status: 'INVALID_STATUS',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });
  });

  describe('Partnership Role Schema Validation', () => {
    it('should accept HELPER role', () => {
      const result = partnershipRoleSchema.safeParse('HELPER');
      expect(result.success).toBe(true);
    });

    it('should accept OUTLET role', () => {
      const result = partnershipRoleSchema.safeParse('OUTLET');
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = partnershipRoleSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('Partnership Status Schema Validation', () => {
    it('should accept all valid status values', () => {
      const validStatuses = ['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED'];

      validStatuses.forEach(status => {
        const result = partnershipStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = partnershipStatusSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });
});
