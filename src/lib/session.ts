import { randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Session management utilities for the dual authentication system
 * Implements requirements: 6.1, 6.2, 6.4, 7.1
 */

const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);

/**
 * Generate a cryptographically secure session token
 * Requirements: 6.1, 6.2
 * 
 * @returns A unique base64url-encoded session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a new session for a user
 * Requirements: 6.1, 6.2
 * 
 * @param userId - The ID of the user to create a session for
 * @returns The created session with token and expiration
 */
export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          mobileNumber: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return session;
}

/**
 * Validate a session token and return the session if valid
 * Requirements: 6.4
 * 
 * @param token - The session token to validate
 * @returns The session with user information if valid, null otherwise
 */
export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          mobileNumber: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // Check if session exists and is not expired
  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Session expired, delete it
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return session;
}

/**
 * Invalidate a session (logout)
 * Requirements: 7.1
 * 
 * @param token - The session token to invalidate
 * @returns True if session was invalidated, false if session didn't exist
 */
export async function invalidateSession(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { token },
    });
    return true;
  } catch {
    // Session doesn't exist or already deleted
    return false;
  }
}

/**
 * Invalidate all sessions for a user
 * Useful for security operations like password changes
 * 
 * @param userId - The ID of the user whose sessions to invalidate
 * @returns The number of sessions invalidated
 */
export async function invalidateAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });
  return result.count;
}

/**
 * Clean up expired sessions from the database
 * Should be run periodically as a maintenance task
 * 
 * @returns The number of expired sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}
