import {
  generateSessionToken,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
} from '../src/lib/session';
import { prisma } from '../src/lib/prisma';

describe('Session Management', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        username: 'sessiontestuser',
        passwordHash: 'hashedpassword',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.session.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up sessions after each test
    await prisma.session.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a token', () => {
      const token = generateSessionToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate base64url-encoded tokens', () => {
      const token = generateSessionToken();
      // base64url uses A-Z, a-z, 0-9, -, _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('createSession', () => {
    it('should create a session for a user', async () => {
      const session = await createSession(testUserId);

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe(testUserId);
    });

    it('should set expiration date in the future', async () => {
      const session = await createSession(testUserId);
      const now = new Date();
      expect(session.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should include user information', async () => {
      const session = await createSession(testUserId);
      expect(session.user.username).toBe('sessiontestuser');
      expect(session.user.id).toBe(testUserId);
    });

    it('should create sessions with unique tokens', async () => {
      const session1 = await createSession(testUserId);
      const session2 = await createSession(testUserId);
      expect(session1.token).not.toBe(session2.token);
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      const createdSession = await createSession(testUserId);
      const validatedSession = await validateSession(createdSession.token);

      expect(validatedSession).toBeDefined();
      expect(validatedSession?.id).toBe(createdSession.id);
      expect(validatedSession?.userId).toBe(testUserId);
      expect(validatedSession?.user).toBeDefined();
    });

    it('should return null for non-existent token', async () => {
      const result = await validateSession('nonexistenttoken');
      expect(result).toBeNull();
    });

    it('should return null and delete expired session', async () => {
      // Create a session with past expiration
      const token = generateSessionToken();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      await prisma.session.create({
        data: {
          userId: testUserId,
          token,
          expiresAt: expiredDate,
        },
      });

      const result = await validateSession(token);
      expect(result).toBeNull();

      // Verify session was deleted
      const deletedSession = await prisma.session.findUnique({
        where: { token },
      });
      expect(deletedSession).toBeNull();
    });

    it('should return session with user information', async () => {
      const createdSession = await createSession(testUserId);
      const validatedSession = await validateSession(createdSession.token);

      expect(validatedSession?.user.username).toBe('sessiontestuser');
      expect(validatedSession?.user.id).toBe(testUserId);
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate an existing session', async () => {
      const session = await createSession(testUserId);
      const result = await invalidateSession(session.token);

      expect(result).toBe(true);

      // Verify session is deleted
      const deletedSession = await prisma.session.findUnique({
        where: { token: session.token },
      });
      expect(deletedSession).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const result = await invalidateSession('nonexistenttoken');
      expect(result).toBe(false);
    });

    it('should prevent validation after invalidation', async () => {
      const session = await createSession(testUserId);
      await invalidateSession(session.token);

      const validatedSession = await validateSession(session.token);
      expect(validatedSession).toBeNull();
    });
  });

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all sessions for a user', async () => {
      // Create multiple sessions
      const session1 = await createSession(testUserId);
      const session2 = await createSession(testUserId);
      const session3 = await createSession(testUserId);

      const count = await invalidateAllUserSessions(testUserId);
      expect(count).toBe(3);

      // Verify all sessions are deleted
      const remainingSessions = await prisma.session.findMany({
        where: { userId: testUserId },
      });
      expect(remainingSessions).toHaveLength(0);
    });

    it('should return 0 when user has no sessions', async () => {
      const count = await invalidateAllUserSessions(testUserId);
      expect(count).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      // Create an expired session
      const expiredToken = generateSessionToken();
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      await prisma.session.create({
        data: {
          userId: testUserId,
          token: expiredToken,
          expiresAt: expiredDate,
        },
      });

      // Create a valid session
      await createSession(testUserId);

      const count = await cleanupExpiredSessions();
      expect(count).toBeGreaterThanOrEqual(1);

      // Verify expired session is deleted
      const expiredSession = await prisma.session.findUnique({
        where: { token: expiredToken },
      });
      expect(expiredSession).toBeNull();
    });

    it('should not delete valid sessions', async () => {
      const validSession = await createSession(testUserId);

      await cleanupExpiredSessions();

      // Verify valid session still exists
      const session = await prisma.session.findUnique({
        where: { token: validSession.token },
      });
      expect(session).toBeDefined();
    });
  });
});
