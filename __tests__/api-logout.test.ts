/**
 * Tests for logout API route
 * Requirements: 7.1, 7.2
 * 
 * These tests verify the API route behavior by testing the underlying
 * session management service and validation schemas that the route uses.
 */

import { logoutSchema } from '@/schemas/auth.schema';
import { invalidateSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      delete: jest.fn(),
    },
  },
}));

describe('Logout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should accept valid session token', () => {
      const result = logoutSchema.safeParse({
        token: 'valid-session-token-abc123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing token', () => {
      const result = logoutSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('token');
      }
    });

    it('should reject empty token', () => {
      const result = logoutSchema.safeParse({
        token: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('token');
        expect(result.error.issues[0].message).toContain('Session token is required');
      }
    });
  });

  describe('Session Invalidation Service', () => {
    it('should successfully invalidate existing session (Requirement 7.1)', async () => {
      // Mock successful session deletion
      (prisma.session.delete as jest.Mock).mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await invalidateSession('valid-token');

      expect(result).toBe(true);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });

    it('should return false when session does not exist (Requirement 7.2)', async () => {
      // Mock session not found error
      (prisma.session.delete as jest.Mock).mockRejectedValue(
        new Error('Record not found')
      );

      const result = await invalidateSession('non-existent-token');

      expect(result).toBe(false);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'non-existent-token' },
      });
    });

    it('should return false when session already deleted', async () => {
      // Mock session already deleted
      (prisma.session.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete does not exist')
      );

      const result = await invalidateSession('already-deleted-token');

      expect(result).toBe(false);
    });

    it('should handle multiple logout attempts gracefully', async () => {
      // First logout succeeds
      (prisma.session.delete as jest.Mock).mockResolvedValueOnce({
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const firstResult = await invalidateSession('valid-token');
      expect(firstResult).toBe(true);

      // Second logout fails (session already deleted)
      (prisma.session.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Record not found')
      );

      const secondResult = await invalidateSession('valid-token');
      expect(secondResult).toBe(false);
    });
  });
});
