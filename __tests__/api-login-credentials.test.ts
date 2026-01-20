/**
 * Tests for credential login API route
 * Requirements: 5.2, 5.3, 9.3, 10.2
 * 
 * These tests verify the API route behavior by testing the underlying
 * authentication service, validation schemas, and rate limiting that the route uses.
 */

import { usernamePasswordLoginSchema } from '@/schemas/auth.schema';
import { loginWithCredentials, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

// Mock the modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe('Credential Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid username and password', () => {
      const result = usernamePasswordLoginSchema.safeParse({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing username', () => {
      const result = usernamePasswordLoginSchema.safeParse({
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('username');
      }
    });

    it('should reject empty username', () => {
      const result = usernamePasswordLoginSchema.safeParse({
        username: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('username');
      }
    });

    it('should reject missing password', () => {
      const result = usernamePasswordLoginSchema.safeParse({
        username: 'testuser',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject empty password', () => {
      const result = usernamePasswordLoginSchema.safeParse({
        username: 'testuser',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should check rate limit for username', async () => {
      // Mock no failed attempts (not rate limited)
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(0);

      const isRateLimited = await checkRateLimit('testuser');

      expect(isRateLimited).toBe(false);
      expect(prisma.loginAttempt.count).toHaveBeenCalled();
    });

    it('should return true when rate limit exceeded', async () => {
      // Mock 5 failed attempts (rate limited)
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(5);

      const isRateLimited = await checkRateLimit('testuser');

      expect(isRateLimited).toBe(true);
    });

    it('should record failed login attempt', async () => {
      (prisma.loginAttempt.create as jest.Mock).mockResolvedValue({
        id: 'attempt-123',
        identifier: 'testuser',
        success: false,
        attemptAt: new Date(),
      });

      await recordLoginAttempt('testuser', false);

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          identifier: 'testuser',
          success: false,
          userId: undefined,
          attemptAt: expect.any(Date),
        },
      });
    });

    it('should record successful login attempt with userId', async () => {
      (prisma.loginAttempt.create as jest.Mock).mockResolvedValue({
        id: 'attempt-123',
        identifier: 'testuser',
        success: true,
        userId: 'user-123',
        attemptAt: new Date(),
      });

      await recordLoginAttempt('testuser', true, 'user-123');

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          identifier: 'testuser',
          success: true,
          userId: 'user-123',
          attemptAt: expect.any(Date),
        },
      });
    });
  });

  describe('Credential Login Service', () => {
    it('should successfully login with valid credentials and create session', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed-password',
        mobileNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token-abc123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const { comparePassword } = require('@/lib/password');
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const session = await loginWithCredentials('testuser', 'password123');

      expect(session).toBeDefined();
      expect(session.token).toBe('session-token-abc123');
      expect(session.userId).toBe('user-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(prisma.session.create).toHaveBeenCalled();
    });

    it('should reject invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed-password',
        mobileNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const { comparePassword } = require('@/lib/password');
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginWithCredentials('testuser', 'wrongpassword')).rejects.toThrow(AuthError);
      await expect(loginWithCredentials('testuser', 'wrongpassword')).rejects.toThrow('Authentication failed');
    });

    it('should reject non-existent username', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginWithCredentials('nonexistent', 'password123')).rejects.toThrow(AuthError);
      await expect(loginWithCredentials('nonexistent', 'password123')).rejects.toThrow('Authentication failed');
    });

    it('should reject user without password hash', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: null, // User registered with mobile only
        mobileNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(loginWithCredentials('testuser', 'password123')).rejects.toThrow(AuthError);
      await expect(loginWithCredentials('testuser', 'password123')).rejects.toThrow('Authentication failed');
    });

    it('should use generic error message for security (Requirement 9.3)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      try {
        await loginWithCredentials('nonexistent', 'password123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        if (error instanceof AuthError) {
          // Should not reveal whether user exists
          expect(error.message).toBe('Authentication failed');
          expect(error.message).not.toContain('not found');
          expect(error.message).not.toContain('does not exist');
          expect(error.message).not.toContain('username');
          expect(error.message).not.toContain('password');
          expect(error.code).toBe('AUTH_FAILED');
          expect(error.statusCode).toBe(401);
        }
      }
    });

    it('should use same error message for wrong password as non-existent user (Requirement 9.3)', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed-password',
        mobileNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const { comparePassword } = require('@/lib/password');
      (comparePassword as jest.Mock).mockResolvedValue(false);

      let wrongPasswordError: AuthError | null = null;
      try {
        await loginWithCredentials('testuser', 'wrongpassword');
      } catch (error) {
        if (error instanceof AuthError) {
          wrongPasswordError = error;
        }
      }

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      let nonExistentUserError: AuthError | null = null;
      try {
        await loginWithCredentials('nonexistent', 'password123');
      } catch (error) {
        if (error instanceof AuthError) {
          nonExistentUserError = error;
        }
      }

      // Both errors should be identical to prevent user enumeration
      expect(wrongPasswordError).toBeDefined();
      expect(nonExistentUserError).toBeDefined();
      expect(wrongPasswordError?.message).toBe(nonExistentUserError?.message);
      expect(wrongPasswordError?.code).toBe(nonExistentUserError?.code);
      expect(wrongPasswordError?.statusCode).toBe(nonExistentUserError?.statusCode);
    });
  });
});
