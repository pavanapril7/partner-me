/**
 * Tests for OTP request API route
 * Requirements: 3.1, 3.2, 3.3, 10.2
 * 
 * These tests verify the API route behavior by testing the underlying
 * authentication service, validation schemas, and rate limiting that the route uses.
 */

import { otpRequestSchema } from '@/schemas/auth.schema';
import { requestOTP, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { generateAndStoreOTP } from '@/lib/otp';
import { getSMSService } from '@/lib/sms';

// Mock the modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    oTP: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/sms', () => ({
  getSMSService: jest.fn(() => ({
    sendOTP: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('OTP Request API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid E.164 format mobile number', () => {
      const result = otpRequestSchema.safeParse({
        mobileNumber: '+1234567890',
      });

      expect(result.success).toBe(true);
    });

    it('should accept mobile numbers with different country codes', () => {
      const validNumbers = [
        '+12345678901',
        '+441234567890',
        '+919876543210',
        '+8612345678901',
      ];

      validNumbers.forEach((number) => {
        const result = otpRequestSchema.safeParse({
          mobileNumber: number,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject mobile number without country code', () => {
      const result = otpRequestSchema.safeParse({
        mobileNumber: '1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject invalid mobile number format', () => {
      const invalidNumbers = [
        'invalid',
        '+0123456789', // Can't start with 0 after +
        '+abc123456',
        '123-456-7890',
        '+1 234 567 890',
      ];

      invalidNumbers.forEach((number) => {
        const result = otpRequestSchema.safeParse({
          mobileNumber: number,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject missing mobile number', () => {
      const result = otpRequestSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should check rate limit for mobile number', async () => {
      // Mock no failed attempts (not rate limited)
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(0);

      const isRateLimited = await checkRateLimit('+1234567890');

      expect(isRateLimited).toBe(false);
      expect(prisma.loginAttempt.count).toHaveBeenCalled();
    });

    it('should return true when rate limit exceeded', async () => {
      // Mock 5 failed attempts (rate limited)
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(5);

      const isRateLimited = await checkRateLimit('+1234567890');

      expect(isRateLimited).toBe(true);
    });

    it('should record failed login attempt', async () => {
      (prisma.loginAttempt.create as jest.Mock).mockResolvedValue({
        id: 'attempt-123',
        identifier: '+1234567890',
        success: false,
        attemptAt: new Date(),
      });

      await recordLoginAttempt('+1234567890', false);

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          identifier: '+1234567890',
          success: false,
          userId: undefined,
          attemptAt: expect.any(Date),
        },
      });
    });
  });

  describe('OTP Request Service', () => {
    it('should generate and send OTP for valid user', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSendOTP = jest.fn().mockResolvedValue(undefined);
      (getSMSService as jest.Mock).mockReturnValue({
        sendOTP: mockSendOTP,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.oTP.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.oTP.create as jest.Mock).mockResolvedValue({
        id: 'otp-123',
        userId: 'user-123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      });

      await requestOTP('+1234567890');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { mobileNumber: '+1234567890' },
      });
      expect(prisma.oTP.create).toHaveBeenCalled();
      
      // Verify SMS was sent
      expect(mockSendOTP).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(requestOTP('+9999999999')).rejects.toThrow(AuthError);
      await expect(requestOTP('+9999999999')).rejects.toThrow('Authentication failed');
    });

    it('should invalidate previous OTPs when requesting new one', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.oTP.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.oTP.create as jest.Mock).mockResolvedValue({
        id: 'otp-123',
        userId: 'user-123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      });

      await requestOTP('+1234567890');

      // Verify previous OTPs were invalidated
      expect(prisma.oTP.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isUsed: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        data: {
          isUsed: true,
        },
      });
    });

    it('should use generic error message for security', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      try {
        await requestOTP('+9999999999');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        if (error instanceof AuthError) {
          // Should not reveal whether user exists
          expect(error.message).toBe('Authentication failed');
          expect(error.message).not.toContain('not found');
          expect(error.message).not.toContain('does not exist');
          expect(error.code).toBe('AUTH_FAILED');
          expect(error.statusCode).toBe(401);
        }
      }
    });
  });
});
