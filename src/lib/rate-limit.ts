import { prisma } from './prisma';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_ATTEMPTS = parseInt(process.env.RATE_LIMIT_ATTEMPTS || '5', 10);
const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10);

/**
 * Records a login attempt for rate limiting purposes
 * 
 * @param identifier - Username or mobile number used in the login attempt
 * @param success - Whether the login attempt was successful
 * @param userId - Optional user ID if the user exists
 * @returns Promise that resolves when the attempt is recorded
 * 
 * Requirements: 10.1
 */
export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  userId?: string
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      identifier,
      success,
      userId,
      attemptAt: new Date(),
    },
  });
}

/**
 * Checks if an identifier is currently rate limited
 * 
 * Implements a 15-minute sliding window that blocks authentication
 * after 5 failed attempts within the window.
 * 
 * @param identifier - Username or mobile number to check
 * @returns Promise that resolves to true if rate limited, false otherwise
 * 
 * Requirements: 10.2, 10.4
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  // Calculate the time window (15 minutes ago)
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  // Count failed attempts within the window
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      identifier,
      success: false,
      attemptAt: {
        gte: windowStart,
      },
    },
  });

  // Return true if rate limit is exceeded
  return failedAttempts >= RATE_LIMIT_ATTEMPTS;
}

/**
 * Gets the number of failed attempts for an identifier within the rate limit window
 * 
 * @param identifier - Username or mobile number to check
 * @returns Promise that resolves to the count of failed attempts
 */
export async function getFailedAttemptCount(identifier: string): Promise<number> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  return await prisma.loginAttempt.count({
    where: {
      identifier,
      success: false,
      attemptAt: {
        gte: windowStart,
      },
    },
  });
}

/**
 * Gets the time when the rate limit will expire for an identifier
 * 
 * @param identifier - Username or mobile number to check
 * @returns Promise that resolves to the expiration date or null if not rate limited
 */
export async function getRateLimitExpiration(identifier: string): Promise<Date | null> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  // Get the oldest failed attempt within the window
  const oldestAttempt = await prisma.loginAttempt.findFirst({
    where: {
      identifier,
      success: false,
      attemptAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      attemptAt: 'asc',
    },
  });

  if (!oldestAttempt) {
    return null;
  }

  // Calculate when the rate limit will expire (15 minutes after the oldest attempt)
  const expirationTime = new Date(oldestAttempt.attemptAt);
  expirationTime.setMinutes(expirationTime.getMinutes() + RATE_LIMIT_WINDOW_MINUTES);

  return expirationTime;
}
