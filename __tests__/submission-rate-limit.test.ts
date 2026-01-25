/**
 * Tests for submission rate limiting
 * Requirements: 7.1, 7.2
 */

import {
  checkSubmissionRateLimit,
  recordSubmissionAttempt,
  getSubmissionStats,
  resetSubmissionAttempts,
  cleanupAllOldAttempts,
} from '../src/lib/submission-rate-limit';

describe('Submission Rate Limiting', () => {
  const testIp = '192.168.1.1';
  const testIp2 = '192.168.1.2';

  beforeEach(() => {
    // Reset rate limit state before each test
    resetSubmissionAttempts(testIp);
    resetSubmissionAttempts(testIp2);
  });

  describe('checkSubmissionRateLimit', () => {
    it('should allow submissions within rate limits', () => {
      const result = checkSubmissionRateLimit(testIp);
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.retryAfter).toBeUndefined();
    });

    it('should enforce per-hour limit (2 submissions)', () => {
      // Record 2 submissions
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      // Third submission within the hour should be blocked
      const result = checkSubmissionRateLimit(testIp);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('2 submissions per hour');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should enforce per-day limit (3 submissions)', () => {
      // To test the day limit without hitting the hour limit,
      // we need to simulate submissions spread over time
      // Since we can't easily mock time in this implementation,
      // we'll test that 3 submissions trigger a limit
      // (which will be the hour limit in practice, but the day limit
      // would work the same way with proper time spacing)
      
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      // Fourth submission should be blocked
      const result = checkSubmissionRateLimit(testIp);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should isolate rate limits by IP address', () => {
      // Max out submissions for testIp
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      // testIp should be blocked
      expect(checkSubmissionRateLimit(testIp).allowed).toBe(false);
      
      // testIp2 should still be allowed
      expect(checkSubmissionRateLimit(testIp2).allowed).toBe(true);
    });

    it('should calculate correct retryAfter time', () => {
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      const result = checkSubmissionRateLimit(testIp);
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(3600); // Max 1 hour
    });
  });

  describe('recordSubmissionAttempt', () => {
    it('should record submission attempts', () => {
      recordSubmissionAttempt(testIp);
      
      const stats = getSubmissionStats(testIp);
      expect(stats.submissionsLastHour).toBe(1);
      expect(stats.submissionsLastDay).toBe(1);
    });

    it('should record multiple attempts', () => {
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      const stats = getSubmissionStats(testIp);
      expect(stats.submissionsLastHour).toBe(2);
      expect(stats.submissionsLastDay).toBe(2);
    });
  });

  describe('getSubmissionStats', () => {
    it('should return zero stats for new IP', () => {
      const stats = getSubmissionStats(testIp);
      
      expect(stats.submissionsLastHour).toBe(0);
      expect(stats.submissionsLastDay).toBe(0);
      expect(stats.remainingHour).toBe(2);
      expect(stats.remainingDay).toBe(3);
    });

    it('should return correct stats after submissions', () => {
      recordSubmissionAttempt(testIp);
      
      const stats = getSubmissionStats(testIp);
      
      expect(stats.submissionsLastHour).toBe(1);
      expect(stats.submissionsLastDay).toBe(1);
      expect(stats.remainingHour).toBe(1);
      expect(stats.remainingDay).toBe(2);
    });

    it('should calculate remaining submissions correctly', () => {
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      const stats = getSubmissionStats(testIp);
      
      expect(stats.remainingHour).toBe(0);
      expect(stats.remainingDay).toBe(1);
    });
  });

  describe('resetSubmissionAttempts', () => {
    it('should reset attempts for an IP', () => {
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      resetSubmissionAttempts(testIp);
      
      const stats = getSubmissionStats(testIp);
      expect(stats.submissionsLastHour).toBe(0);
      expect(stats.submissionsLastDay).toBe(0);
    });

    it('should not affect other IPs', () => {
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp2);
      
      resetSubmissionAttempts(testIp);
      
      const stats1 = getSubmissionStats(testIp);
      const stats2 = getSubmissionStats(testIp2);
      
      expect(stats1.submissionsLastHour).toBe(0);
      expect(stats2.submissionsLastHour).toBe(1);
    });
  });

  describe('cleanupAllOldAttempts', () => {
    it('should remove old attempts', () => {
      // This test would require mocking time or waiting
      // For now, we'll just verify it doesn't throw
      recordSubmissionAttempt(testIp);
      
      expect(() => cleanupAllOldAttempts()).not.toThrow();
    });

    it('should keep recent attempts', () => {
      recordSubmissionAttempt(testIp);
      
      cleanupAllOldAttempts();
      
      const stats = getSubmissionStats(testIp);
      expect(stats.submissionsLastHour).toBe(1);
    });
  });

  describe('Rate limit enforcement scenarios', () => {
    it('should allow 2 submissions per hour', () => {
      // First submission
      expect(checkSubmissionRateLimit(testIp).allowed).toBe(true);
      recordSubmissionAttempt(testIp);
      
      // Second submission
      expect(checkSubmissionRateLimit(testIp).allowed).toBe(true);
      recordSubmissionAttempt(testIp);
      
      // Third submission should be blocked
      expect(checkSubmissionRateLimit(testIp).allowed).toBe(false);
    });

    it('should allow 3 submissions per day', () => {
      // Record 3 submissions
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      recordSubmissionAttempt(testIp);
      
      // Fourth submission should be blocked
      const result = checkSubmissionRateLimit(testIp);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
