/**
 * Tests for credential registration API route
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * These tests verify the API route behavior by testing the underlying
 * authentication service and validation schemas that the route uses.
 */

import { usernamePasswordRegistrationSchema } from '@/schemas/auth.schema';
import { registerWithCredentials } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Credential Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid username and password', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject username that is too short', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({
        username: 'ab',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('username');
      }
    });

    it('should reject username that is too long', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({
        username: 'a'.repeat(31),
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('username');
      }
    });

    it('should reject username with special characters', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({
        username: 'test@user!',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('username');
      }
    });

    it('should reject password that is too short', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({
        username: 'testuser',
        password: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject missing fields', () => {
      const result = usernamePasswordRegistrationSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Registration Service', () => {
    it('should register a new user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed-password',
        mobileNumber: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const user = await registerWithCredentials('testuser', 'password123');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(prisma.user.create).toHaveBeenCalled();
      
      // Verify password was hashed
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passwordHash).toBeDefined();
      expect(createCall.data.passwordHash).not.toBe('password123');
    });

    it('should throw error for duplicate username', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['username'] },
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        registerWithCredentials('existinguser', 'password123')
      ).rejects.toThrow('Username already exists');
    });

    it('should hash password before storage', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: '$2b$10$hashedpassword',
        mobileNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      await registerWithCredentials('testuser', 'password123');

      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      const storedHash = createCall.data.passwordHash;

      // Verify it's a bcrypt hash (starts with $2b$)
      expect(storedHash).toMatch(/^\$2[aby]\$/);
      
      // Verify the hash can be used to compare the original password
      const isValid = await comparePassword('password123', storedHash);
      expect(isValid).toBe(true);
    });
  });
});
