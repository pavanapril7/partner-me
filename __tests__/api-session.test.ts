/**
 * Tests for session validation API route
 * Requirements: 6.4, 6.5
 * 
 * These tests verify the API route behavior by testing the underlying
 * session validation service that the route uses.
 */

import { validateSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Session Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Validation Service', () => {
    it('should return session with user information for valid token (Requirements 6.4, 6.5)', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-456',
        token: 'valid-session-token',
        expiresAt: new Date('2026-01-27T12:00:00Z'),
        createdAt: new Date('2026-01-20T12:00:00Z'),
        user: {
          id: 'user-456',
          username: 'johndoe',
          mobileNumber: '+1234567890',
          email: 'john@example.com',
          name: 'John Doe',
          createdAt: new Date('2026-01-15T10:00:00Z'),
          updatedAt: new Date('2026-01-20T10:00:00Z'),
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession('valid-session-token');

      expect(result).toEqual(mockSession);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-session-token' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              mobileNumber: true,
              email: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent session (Requirement 6.4)', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await validateSession('non-existent-token');

      expect(result).toBeNull();
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'non-existent-token' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              mobileNumber: true,
              email: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    it('should return null and delete expired session (Requirement 6.4)', async () => {
      const expiredSession = {
        id: 'session-expired',
        userId: 'user-123',
        token: 'expired-token',
        expiresAt: new Date('2026-01-10T12:00:00Z'), // Past date
        createdAt: new Date('2026-01-03T12:00:00Z'),
        user: {
          id: 'user-123',
          username: 'testuser',
          mobileNumber: null,
          email: null,
          name: null,
          createdAt: new Date('2026-01-03T10:00:00Z'),
          updatedAt: new Date('2026-01-03T10:00:00Z'),
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(expiredSession);
      (prisma.session.delete as jest.Mock).mockResolvedValue(expiredSession);

      const result = await validateSession('expired-token');

      expect(result).toBeNull();
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-expired' },
      });
    });

    it('should include all user fields in response (Requirement 6.5)', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        token: 'test-token',
        expiresAt: new Date('2026-01-27'),
        createdAt: new Date('2026-01-20'),
        user: {
          id: 'user-1',
          username: 'testuser',
          mobileNumber: '+1234567890',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date('2026-01-20'),
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession('test-token');

      // Verify all user fields are present
      expect(result?.user).toBeDefined();
      expect(result?.user.id).toBe('user-1');
      expect(result?.user.username).toBe('testuser');
      expect(result?.user.mobileNumber).toBe('+1234567890');
      expect(result?.user.email).toBe('test@example.com');
      expect(result?.user.name).toBe('Test User');
      expect(result?.user.createdAt).toBeDefined();
      expect(result?.user.updatedAt).toBeDefined();
    });

    it('should handle sessions for users with only username', async () => {
      const mockSession = {
        id: 'session-2',
        userId: 'user-2',
        token: 'username-token',
        expiresAt: new Date('2026-01-27'),
        createdAt: new Date('2026-01-20'),
        user: {
          id: 'user-2',
          username: 'credentialuser',
          mobileNumber: null,
          email: null,
          name: null,
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date('2026-01-20'),
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession('username-token');

      expect(result).toEqual(mockSession);
      expect(result?.user.username).toBe('credentialuser');
      expect(result?.user.mobileNumber).toBeNull();
    });

    it('should handle sessions for users with only mobile number', async () => {
      const mockSession = {
        id: 'session-3',
        userId: 'user-3',
        token: 'mobile-token',
        expiresAt: new Date('2026-01-27'),
        createdAt: new Date('2026-01-20'),
        user: {
          id: 'user-3',
          username: null,
          mobileNumber: '+9876543210',
          email: null,
          name: null,
          createdAt: new Date('2026-01-20'),
          updatedAt: new Date('2026-01-20'),
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await validateSession('mobile-token');

      expect(result).toEqual(mockSession);
      expect(result?.user.username).toBeNull();
      expect(result?.user.mobileNumber).toBe('+9876543210');
    });
  });
});
