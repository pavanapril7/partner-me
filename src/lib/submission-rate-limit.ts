/**
 * Rate limiting for anonymous business idea submissions
 * Prevents spam and abuse by limiting submissions per IP address
 * Requirements: 7.1, 7.2
 */

interface SubmissionAttempt {
  timestamp: number;
  ip: string;
}

// In-memory store for submission attempts (in production, use Redis or similar)
const submissionAttempts = new Map<string, SubmissionAttempt[]>();

/**
 * Rate limiting configuration for anonymous submissions
 */
const SUBMISSION_RATE_LIMIT = {
  MAX_PER_IP_PER_DAY: 3,
  MAX_PER_IP_PER_HOUR: 2,
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000, // 24 hours
  WINDOW_HOUR_MS: 60 * 60 * 1000, // 1 hour
};

/**
 * Clean up old submission attempts from memory
 * Removes attempts older than 24 hours
 * 
 * @param ip - The IP address to clean up
 */
function cleanupOldAttempts(ip: string): void {
  const attempts = submissionAttempts.get(ip) || [];
  const now = Date.now();
  const cutoff = now - SUBMISSION_RATE_LIMIT.WINDOW_DAY_MS;
  
  const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
  
  if (recentAttempts.length === 0) {
    submissionAttempts.delete(ip);
  } else {
    submissionAttempts.set(ip, recentAttempts);
  }
}

/**
 * Check if an IP address is rate limited for submissions
 * 
 * Implements two rate limits:
 * - Maximum 2 submissions per hour (burst protection)
 * - Maximum 3 submissions per 24 hours (daily limit)
 * 
 * @param ip - The IP address to check
 * @returns Object with rate limit status and details
 * 
 * Requirements: 7.1, 7.2
 */
export function checkSubmissionRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  // Clean up old attempts first
  cleanupOldAttempts(ip);
  
  const attempts = submissionAttempts.get(ip) || [];
  const now = Date.now();
  
  // Check per-hour limit (more restrictive, check first)
  const hourAgo = now - SUBMISSION_RATE_LIMIT.WINDOW_HOUR_MS;
  const attemptsLastHour = attempts.filter(
    attempt => attempt.timestamp > hourAgo
  ).length;
  
  if (attemptsLastHour >= SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_HOUR) {
    const oldestInWindow = attempts
      .filter(attempt => attempt.timestamp > hourAgo)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    const retryAfter = Math.ceil(
      (oldestInWindow.timestamp + SUBMISSION_RATE_LIMIT.WINDOW_HOUR_MS - now) / 1000
    );
    
    return {
      allowed: false,
      reason: `Submission rate limit exceeded. Maximum ${SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_HOUR} submissions per hour.`,
      retryAfter,
    };
  }
  
  // Check per-day limit
  const dayAgo = now - SUBMISSION_RATE_LIMIT.WINDOW_DAY_MS;
  const attemptsLastDay = attempts.filter(
    attempt => attempt.timestamp > dayAgo
  ).length;
  
  if (attemptsLastDay >= SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_DAY) {
    const oldestInWindow = attempts
      .filter(attempt => attempt.timestamp > dayAgo)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    const retryAfter = Math.ceil(
      (oldestInWindow.timestamp + SUBMISSION_RATE_LIMIT.WINDOW_DAY_MS - now) / 1000
    );
    
    return {
      allowed: false,
      reason: `Submission rate limit exceeded. Maximum ${SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_DAY} submissions per 24 hours.`,
      retryAfter,
    };
  }
  
  return { allowed: true };
}

/**
 * Record a submission attempt for rate limiting
 * 
 * @param ip - The IP address making the submission
 * 
 * Requirements: 7.1, 7.2
 */
export function recordSubmissionAttempt(ip: string): void {
  const attempts = submissionAttempts.get(ip) || [];
  
  attempts.push({
    timestamp: Date.now(),
    ip,
  });
  
  submissionAttempts.set(ip, attempts);
  
  // Clean up old attempts
  cleanupOldAttempts(ip);
}

/**
 * Get current submission statistics for an IP address
 * 
 * @param ip - The IP address to check
 * @returns Submission statistics
 */
export function getSubmissionStats(ip: string): {
  submissionsLastHour: number;
  submissionsLastDay: number;
  remainingHour: number;
  remainingDay: number;
} {
  cleanupOldAttempts(ip);
  
  const attempts = submissionAttempts.get(ip) || [];
  const now = Date.now();
  
  const hourAgo = now - SUBMISSION_RATE_LIMIT.WINDOW_HOUR_MS;
  const dayAgo = now - SUBMISSION_RATE_LIMIT.WINDOW_DAY_MS;
  
  const submissionsLastHour = attempts.filter(
    attempt => attempt.timestamp > hourAgo
  ).length;
  
  const submissionsLastDay = attempts.filter(
    attempt => attempt.timestamp > dayAgo
  ).length;
  
  return {
    submissionsLastHour,
    submissionsLastDay,
    remainingHour: Math.max(
      0,
      SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_HOUR - submissionsLastHour
    ),
    remainingDay: Math.max(
      0,
      SUBMISSION_RATE_LIMIT.MAX_PER_IP_PER_DAY - submissionsLastDay
    ),
  };
}

/**
 * Reset submission attempts for an IP address (for testing or admin purposes)
 * 
 * @param ip - The IP address to reset
 */
export function resetSubmissionAttempts(ip: string): void {
  submissionAttempts.delete(ip);
}

/**
 * Clean up all old attempts across all IP addresses
 * Should be called periodically to prevent memory leaks
 */
export function cleanupAllOldAttempts(): void {
  const now = Date.now();
  const cutoff = now - SUBMISSION_RATE_LIMIT.WINDOW_DAY_MS;
  
  for (const [ip, attempts] of submissionAttempts.entries()) {
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
    
    if (recentAttempts.length === 0) {
      submissionAttempts.delete(ip);
    } else {
      submissionAttempts.set(ip, recentAttempts);
    }
  }
}
