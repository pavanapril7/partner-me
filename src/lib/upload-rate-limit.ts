/**
 * Rate limiting for image uploads
 * Prevents abuse and resource exhaustion
 * Requirements: 1.3
 */

interface UploadAttempt {
  timestamp: number;
  userId: string;
}

// In-memory store for upload attempts (in production, use Redis or similar)
const uploadAttempts = new Map<string, UploadAttempt[]>();

/**
 * Rate limiting configuration for uploads
 */
const UPLOAD_RATE_LIMIT = {
  MAX_UPLOADS_PER_HOUR: parseInt(process.env.MAX_UPLOADS_PER_HOUR || '50', 10),
  MAX_UPLOADS_PER_MINUTE: parseInt(process.env.MAX_UPLOADS_PER_MINUTE || '10', 10),
  WINDOW_HOUR_MS: 60 * 60 * 1000, // 1 hour
  WINDOW_MINUTE_MS: 60 * 1000, // 1 minute
};

/**
 * Clean up old upload attempts from memory
 * Removes attempts older than 1 hour
 */
function cleanupOldAttempts(userId: string): void {
  const attempts = uploadAttempts.get(userId) || [];
  const now = Date.now();
  const cutoff = now - UPLOAD_RATE_LIMIT.WINDOW_HOUR_MS;
  
  const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
  
  if (recentAttempts.length === 0) {
    uploadAttempts.delete(userId);
  } else {
    uploadAttempts.set(userId, recentAttempts);
  }
}

/**
 * Check if a user is rate limited for uploads
 * 
 * Implements two rate limits:
 * - Maximum uploads per minute (burst protection)
 * - Maximum uploads per hour (sustained usage protection)
 * 
 * @param userId - The user ID to check
 * @returns Object with rate limit status and details
 * 
 * Requirements: 1.3
 */
export function checkUploadRateLimit(userId: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  // Clean up old attempts first
  cleanupOldAttempts(userId);
  
  const attempts = uploadAttempts.get(userId) || [];
  const now = Date.now();
  
  // Check per-minute limit
  const minuteAgo = now - UPLOAD_RATE_LIMIT.WINDOW_MINUTE_MS;
  const attemptsLastMinute = attempts.filter(
    attempt => attempt.timestamp > minuteAgo
  ).length;
  
  if (attemptsLastMinute >= UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_MINUTE) {
    const oldestInWindow = attempts
      .filter(attempt => attempt.timestamp > minuteAgo)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    const retryAfter = Math.ceil(
      (oldestInWindow.timestamp + UPLOAD_RATE_LIMIT.WINDOW_MINUTE_MS - now) / 1000
    );
    
    return {
      allowed: false,
      reason: `Upload rate limit exceeded. Maximum ${UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_MINUTE} uploads per minute.`,
      retryAfter,
    };
  }
  
  // Check per-hour limit
  const hourAgo = now - UPLOAD_RATE_LIMIT.WINDOW_HOUR_MS;
  const attemptsLastHour = attempts.filter(
    attempt => attempt.timestamp > hourAgo
  ).length;
  
  if (attemptsLastHour >= UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_HOUR) {
    const oldestInWindow = attempts
      .filter(attempt => attempt.timestamp > hourAgo)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    const retryAfter = Math.ceil(
      (oldestInWindow.timestamp + UPLOAD_RATE_LIMIT.WINDOW_HOUR_MS - now) / 1000
    );
    
    return {
      allowed: false,
      reason: `Upload rate limit exceeded. Maximum ${UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_HOUR} uploads per hour.`,
      retryAfter,
    };
  }
  
  return { allowed: true };
}

/**
 * Record an upload attempt for rate limiting
 * 
 * @param userId - The user ID making the upload
 * 
 * Requirements: 1.3
 */
export function recordUploadAttempt(userId: string): void {
  const attempts = uploadAttempts.get(userId) || [];
  
  attempts.push({
    timestamp: Date.now(),
    userId,
  });
  
  uploadAttempts.set(userId, attempts);
  
  // Clean up old attempts
  cleanupOldAttempts(userId);
}

/**
 * Get current upload statistics for a user
 * 
 * @param userId - The user ID to check
 * @returns Upload statistics
 */
export function getUploadStats(userId: string): {
  uploadsLastMinute: number;
  uploadsLastHour: number;
  remainingMinute: number;
  remainingHour: number;
} {
  cleanupOldAttempts(userId);
  
  const attempts = uploadAttempts.get(userId) || [];
  const now = Date.now();
  
  const minuteAgo = now - UPLOAD_RATE_LIMIT.WINDOW_MINUTE_MS;
  const hourAgo = now - UPLOAD_RATE_LIMIT.WINDOW_HOUR_MS;
  
  const uploadsLastMinute = attempts.filter(
    attempt => attempt.timestamp > minuteAgo
  ).length;
  
  const uploadsLastHour = attempts.filter(
    attempt => attempt.timestamp > hourAgo
  ).length;
  
  return {
    uploadsLastMinute,
    uploadsLastHour,
    remainingMinute: Math.max(
      0,
      UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_MINUTE - uploadsLastMinute
    ),
    remainingHour: Math.max(
      0,
      UPLOAD_RATE_LIMIT.MAX_UPLOADS_PER_HOUR - uploadsLastHour
    ),
  };
}

/**
 * Reset upload attempts for a user (for testing or admin purposes)
 * 
 * @param userId - The user ID to reset
 */
export function resetUploadAttempts(userId: string): void {
  uploadAttempts.delete(userId);
}
