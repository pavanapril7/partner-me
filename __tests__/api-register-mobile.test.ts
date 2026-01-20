/**
 * Tests for mobile registration API route
 * Requirements: 1.1, 1.2, 1.3
 * 
 * These tests verify the API route behavior by testing the underlying
 * authentication service and validation schemas that the route uses.
 */

import { mobileRegistrationSchema } from '@/schemas/auth.schema';
import { registerWithMobile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Mobile Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid E.164 mobile number', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: '+12025551234',
      });

      expect(result.success).toBe(true);
    });

    it('should accept various valid E.164 formats', () => {
      const validNumbers = [
        '+12025551234',    // US number
        '+442071234567',   // UK number
        '+81312345678',    // Japan number
        '+61212345678',    // Australia number
        '+919876543210',   // India number
      ];

      for (const mobileNumber of validNumbers) {
        const result = mobileRegistrationSchema.safeParse({ mobileNumber });
        expect(result.success).toBe(true);
      }
    });

    it('should reject mobile number without plus sign', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: '12025551234',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
        expect(result.error.issues[0].message).toContain('E.164');
      }
    });

    it('should reject mobile number starting with zero', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: '+0123456789',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject mobile number that is too short', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: '+1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject mobile number that is too long', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: '+1234567890123456', // 16 digits (max is 15)
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject non-numeric mobile number', () => {
      const result = mobileRegistrationSchema.safeParse({
        mobileNumber: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject missing mobile number', () => {
      const result = mobileRegistrationSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Registration Service', () => {
    it('should register a new user with valid mobile number', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+12025551234',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const user = await registerWithMobile('+12025551234');

      expect(user).toBeDefined();
      expect(user.mobileNumber).toBe('+12025551234');
      expect(prisma.user.create).toHaveBeenCalled();
      
      // Verify the correct data was passed
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.mobileNumber).toBe('+12025551234');
    });

    it('should throw error for duplicate mobile number', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['mobileNumber'] },
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        registerWithMobile('+12025551234')
      ).rejects.toThrow('Mobile number already exists');
    });

    it('should store mobile number in E.164 format', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+442071234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const user = await registerWithMobile('+442071234567');

      expect(user.mobileNumber).toBe('+442071234567');
      
      // Verify the mobile number starts with + and contains only digits after
      expect(user.mobileNumber).toMatch(/^\+[1-9]\d{1,14}$/);
    });
  });
});
