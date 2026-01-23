/**
 * Tests for upload rate limiting
 * Requirements: 1.3
 */

import {
  checkUploadRateLimit,
  recordUploadAttempt,
  getUploadStats,
  resetUploadAttempts,
} from '@/lib/upload-rate-limit';

describe('Upload Rate Limiting', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Reset attempts before each test
    resetUploadAttempts(testUserId);
  });

  afterEach(() => {
    // Clean up after each test
    resetUploadAttempts(testUserId);
  });

  describe('checkUploadRateLimit', () => {
    it('should allow uploads when no attempts have been made', () => {
      const result = checkUploadRateLimit(testUserId);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.retryAfter).toBeUndefined();
    });

    it('should allow uploads within per-minute limit', () => {
      // Record 5 attempts (below the default limit of 10)
      for (let i = 0; i < 5; i++) {
        recordUploadAttempt(testUserId);
      }

      const result = checkUploadRateLimit(testUserId);
      expect(result.allowed).toBe(true);
    });

    it('should block uploads when per-minute limit is exceeded', () => {
      // Record 10 attempts (at the default limit)
      for (let i = 0; i < 10; i++) {
        recordUploadAttempt(testUserId);
      }

      const result = checkUploadRateLimit(testUserId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('per minute');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should allow uploads within per-hour limit', () => {
      // Record 9 attempts (below the per-minute limit of 10)
      // This tests that we're within the per-hour limit (50)
      for (let i = 0; i < 9; i++) {
        recordUploadAttempt(testUserId);
      }

      const result = checkUploadRateLimit(testUserId);
      expect(result.allowed).toBe(true);
    });

    it('should provide retry-after time when rate limited', () => {
      // Exceed per-minute limit
      for (let i = 0; i < 10; i++) {
        recordUploadAttempt(testUserId);
      }

      const result = checkUploadRateLimit(testUserId);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60); // Should be within 1 minute
    });
  });

  describe('recordUploadAttempt', () => {
    it('should record upload attempts', () => {
      recordUploadAttempt(testUserId);
      
      const stats = getUploadStats(testUserId);
      expect(stats.uploadsLastMinute).toBe(1);
      expect(stats.uploadsLastHour).toBe(1);
    });

    it('should track multiple attempts', () => {
      recordUploadAttempt(testUserId);
      recordUploadAttempt(testUserId);
      recordUploadAttempt(testUserId);
      
      const stats = getUploadStats(testUserId);
      expect(stats.uploadsLastMinute).toBe(3);
      expect(stats.uploadsLastHour).toBe(3);
    });
  });

  describe('getUploadStats', () => {
    it('should return zero stats for new user', () => {
      const stats = getUploadStats(testUserId);
      
      expect(stats.uploadsLastMinute).toBe(0);
      expect(stats.uploadsLastHour).toBe(0);
      expect(stats.remainingMinute).toBeGreaterThan(0);
      expect(stats.remainingHour).toBeGreaterThan(0);
    });

    it('should calculate remaining uploads correctly', () => {
      // Record 3 attempts
      for (let i = 0; i < 3; i++) {
        recordUploadAttempt(testUserId);
      }
      
      const stats = getUploadStats(testUserId);
      expect(stats.uploadsLastMinute).toBe(3);
      expect(stats.uploadsLastHour).toBe(3);
      expect(stats.remainingMinute).toBeGreaterThan(0);
      expect(stats.remainingHour).toBeGreaterThan(0);
    });

    it('should show zero remaining when limit is reached', () => {
      // Exceed per-minute limit
      for (let i = 0; i < 10; i++) {
        recordUploadAttempt(testUserId);
      }
      
      const stats = getUploadStats(testUserId);
      expect(stats.remainingMinute).toBe(0);
    });
  });

  describe('resetUploadAttempts', () => {
    it('should clear all attempts for a user', () => {
      // Record some attempts
      for (let i = 0; i < 5; i++) {
        recordUploadAttempt(testUserId);
      }
      
      // Verify attempts were recorded
      let stats = getUploadStats(testUserId);
      expect(stats.uploadsLastMinute).toBe(5);
      
      // Reset attempts
      resetUploadAttempts(testUserId);
      
      // Verify attempts were cleared
      stats = getUploadStats(testUserId);
      expect(stats.uploadsLastMinute).toBe(0);
      expect(stats.uploadsLastHour).toBe(0);
    });
  });

  describe('Multiple users', () => {
    it('should track attempts separately for different users', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // Record attempts for user 1
      for (let i = 0; i < 3; i++) {
        recordUploadAttempt(user1);
      }
      
      // Record attempts for user 2
      for (let i = 0; i < 5; i++) {
        recordUploadAttempt(user2);
      }
      
      // Verify separate tracking
      const stats1 = getUploadStats(user1);
      const stats2 = getUploadStats(user2);
      
      expect(stats1.uploadsLastMinute).toBe(3);
      expect(stats2.uploadsLastMinute).toBe(5);
      
      // Clean up
      resetUploadAttempts(user1);
      resetUploadAttempts(user2);
    });
  });
});
