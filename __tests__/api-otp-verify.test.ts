/**
 * Tests for OTP verification API route
 * Requirements: 4.1, 4.2, 4.4, 4.5, 10.2
 * 
 * These tests verify the API route behavior by testing the underlying
 * authentication service, validation schemas, and rate limiting that the route uses.
 */

import { otpVerifySchema } from '@/schemas/auth.schema';
import { verifyOTP, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

// Mock the modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    oTP: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('OTP Verification API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid mobile number and OTP code', () => {
      const result = otpVerifySchema.safeParse({
        mobileNumber: '+1234567890',
        code: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing mobile number', () => {
      const result = otpVerifySchema.safeParse({
        code: '123456',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject invalid mobile number format', () => {
      const result = otpVerifySchema.safeParse({
        mobileNumber: '1234567890', // Missing + prefix
        code: '123456',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mobileNumber');
      }
    });

    it('should reject missing OTP code', () => {
      const result = otpVerifySchema.safeParse({
        mobileNumber: '+1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('code');
      }
    });

    it('should reject OTP code with wrong length', () => {
      const invalidCodes = ['12345', '1234567', '123', ''];

      invalidCodes.forEach((code) => {
        const result = otpVerifySchema.safeParse({
          mobileNumber: '+1234567890',
          code,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject non-numeric OTP code', () => {
      const result = otpVerifySchema.safeParse({
        mobileNumber: '+1234567890',
        code: 'abc123', // Contains letters
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('code');
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

    it('should record successful login attempt with userId', async () => {
      (prisma.loginAttempt.create as jest.Mock).mockResolvedValue({
        id: 'attempt-123',
        identifier: '+1234567890',
        success: true,
        userId: 'user-123',
        attemptAt: new Date(),
      });

      await recordLoginAttempt('+1234567890', true, 'user-123');

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          identifier: '+1234567890',
          success: true,
          userId: 'user-123',
          attemptAt: expect.any(Date),
        },
      });
    });
  });

  describe('OTP Verification Service', () => {
    it('should successfully verify valid OTP and create session', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOTP = {
        id: 'otp-123',
        userId: 'user-123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        isUsed: false,
        createdAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.oTP.findFirst as jest.Mock).mockResolvedValue(mockOTP);
      (prisma.oTP.update as jest.Mock).mockResolvedValue({ ...mockOTP, isUsed: true });
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const session = await verifyOTP('+1234567890', '123456');

      expect(session).toBeDefined();
      expect(session.token).toBe('session-token-abc123');
      expect(session.userId).toBe('user-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { mobileNumber: '+1234567890' },
      });
      expect(prisma.oTP.findFirst).toHaveBeenCalled();
      expect(prisma.oTP.update).toHaveBeenCalled();
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should reject invalid OTP code', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      // Mock findFirst to return null (no matching OTP found)
      (prisma.oTP.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(verifyOTP('+1234567890', '999999')).rejects.toThrow(AuthError);
      await expect(verifyOTP('+1234567890', '999999')).rejects.toThrow('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOTP = {
        id: 'otp-123',
        userId: 'user-123',
        code: '123456',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        isUsed: false,
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.oTP.findFirst as jest.Mock).mockResolvedValue(mockOTP);

      await expect(verifyOTP('+1234567890', '123456')).rejects.toThrow(AuthError);
      
      try {
        await verifyOTP('+1234567890', '123456');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        if (error instanceof AuthError) {
          expect(error.code).toBe('OTP_EXPIRED');
        }
      }
    });

    it('should reject OTP for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(verifyOTP('+9999999999', '123456')).rejects.toThrow(AuthError);
      await expect(verifyOTP('+9999999999', '123456')).rejects.toThrow('Authentication failed');
    });

    it('should invalidate OTP after successful verification', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOTP = {
        id: 'otp-123',
        userId: 'user-123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.oTP.findFirst as jest.Mock).mockResolvedValue(mockOTP);
      (prisma.oTP.update as jest.Mock).mockResolvedValue({ ...mockOTP, isUsed: true });
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      await verifyOTP('+1234567890', '123456');

      // Verify OTP was invalidated
      expect(prisma.oTP.update).toHaveBeenCalledWith({
        where: { id: 'otp-123' },
        data: { isUsed: true },
      });
    });

    it('should use generic error message for security', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      try {
        await verifyOTP('+9999999999', '123456');
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
