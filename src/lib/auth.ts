import { prisma } from './prisma';
import { hashPassword, comparePassword } from './password';
import { User } from '@prisma/client';
import { generateAndStoreOTP, validateOTP, invalidateOTP } from './otp';
import { getSMSService } from './sms';
import { createSession } from './session';

/**
 * Authentication Service
 * Handles user registration, login, and session management
 * for the dual authentication system (mobile OTP and username/password)
 */

// ============================================================================
// Error Types
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class DuplicateError extends AuthError {
  constructor(field: string) {
    super(
      `${field} already exists`,
      'DUPLICATE_ERROR',
      409
    );
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, public details?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// ============================================================================
// Registration Functions
// ============================================================================

/**
 * Register a new user with username and password credentials
 * 
 * Requirements: 1.2, 1.3, 2.3, 2.4
 * - Validates username format (handled by caller with Zod)
 * - Validates password requirements (handled by caller with Zod)
 * - Hashes password using bcrypt before storage
 * - Handles duplicate username errors
 * 
 * @param username - The username for the new account (3-30 chars, alphanumeric + underscore)
 * @param password - The password for the new account (minimum 8 characters)
 * @returns Promise<User> - The created user object
 * @throws DuplicateError if username already exists
 * @throws AuthError for other registration failures
 */
export async function registerWithCredentials(
  username: string,
  password: string
): Promise<User> {
  try {
    // Hash the password before storage (Requirement 2.3)
    const passwordHash = await hashPassword(password);

    // Create user with hashed password
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    return user;
  } catch (error) {
    // Handle duplicate username error (Requirement 2.4)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      // Unique constraint violation
      const meta = 'meta' in error ? error.meta : null;
      const target = (meta && typeof meta === 'object' && 'target' in meta ? meta.target as string[] : []) || [];
      if (target.includes('username')) {
        throw new DuplicateError('Username');
      }
    }

    // Re-throw if it's already an AuthError
    if (error instanceof AuthError) {
      throw error;
    }

    // Generic error for unexpected failures
    throw new AuthError(
      'Failed to register user',
      'REGISTRATION_FAILED',
      500
    );
  }
}

/**
 * Register a new user with mobile number for OTP-based authentication
 * 
 * Requirements: 1.2, 1.3
 * - Validates mobile number format (handled by caller with Zod)
 * - Stores mobile number in E.164 format
 * - Handles duplicate mobile number errors
 * 
 * @param mobileNumber - The mobile number in E.164 format (e.g., +1234567890)
 * @returns Promise<User> - The created user object
 * @throws DuplicateError if mobile number already exists
 * @throws AuthError for other registration failures
 */
export async function registerWithMobile(
  mobileNumber: string
): Promise<User> {
  try {
    // Create user with mobile number (Requirement 1.2)
    const user = await prisma.user.create({
      data: {
        mobileNumber,
      },
    });

    return user;
  } catch (error) {
    // Handle duplicate mobile number error (Requirement 1.3)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      // Unique constraint violation
      const meta = 'meta' in error ? error.meta : null;
      const target = (meta && typeof meta === 'object' && 'target' in meta ? meta.target as string[] : []) || [];
      if (target.includes('mobileNumber')) {
        throw new DuplicateError('Mobile number');
      }
    }

    // Re-throw if it's already an AuthError
    if (error instanceof AuthError) {
      throw error;
    }

    // Generic error for unexpected failures
    throw new AuthError(
      'Failed to register user',
      'REGISTRATION_FAILED',
      500
    );
  }
}

// ============================================================================
// OTP Authentication Functions
// ============================================================================

/**
 * Request an OTP for mobile number authentication
 * 
 * Requirements: 3.1, 3.2, 3.3
 * - Generates a random 6-digit numeric OTP code
 * - Stores the OTP with 5-minute expiration
 * - Sends the OTP to the user's mobile number via SMS
 * - Invalidates previous unexpired OTPs for the mobile number
 * 
 * @param mobileNumber - The mobile number in E.164 format to send OTP to
 * @returns Promise<void> - Resolves when OTP is generated and sent
 * @throws AuthError if user not found or SMS sending fails
 */
export async function requestOTP(mobileNumber: string): Promise<void> {
  // Find user by mobile number
  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });

  if (!user) {
    // Use generic error message to prevent user enumeration (Requirement 9.3)
    throw new AuthError(
      'Authentication failed',
      'AUTH_FAILED',
      401
    );
  }

  try {
    // Generate and store OTP (Requirements 3.1, 3.2, 3.4, 3.5)
    const code = await generateAndStoreOTP(user.id, 5);

    // Send OTP via SMS (Requirement 3.3)
    const smsService = getSMSService();
    await smsService.sendOTP(mobileNumber, code);
  } catch (error) {
    // Log error for debugging but return generic message
    console.error('Failed to send OTP:', error);
    throw new AuthError(
      'Failed to send OTP',
      'OTP_SEND_FAILED',
      500
    );
  }
}

/**
 * Verify an OTP code and create an authenticated session
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5
 * - Verifies the OTP code matches the stored OTP
 * - Checks that the OTP has not expired
 * - Creates an authenticated session on successful verification
 * - Invalidates the OTP after successful verification (single-use)
 * - Handles expired and invalid OTP errors
 * 
 * @param mobileNumber - The mobile number associated with the OTP
 * @param code - The 6-digit OTP code to verify
 * @returns Promise<Session> - The created session with user information
 * @throws AuthError if user not found, OTP invalid, or OTP expired
 */
export async function verifyOTP(mobileNumber: string, code: string) {
  // Find user by mobile number
  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });

  if (!user) {
    // Use generic error message to prevent user enumeration (Requirement 9.3)
    throw new AuthError(
      'Authentication failed',
      'AUTH_FAILED',
      401
    );
  }

  // Validate the OTP (Requirements 4.1, 4.4)
  const validation = await validateOTP(user.id, code);

  if (!validation.isValid) {
    // Return specific error for expired vs invalid OTP (Requirements 4.3, 4.4)
    const errorCode = validation.error?.includes('expired') 
      ? 'OTP_EXPIRED' 
      : 'OTP_INVALID';
    
    throw new AuthError(
      validation.error || 'Invalid OTP',
      errorCode,
      401
    );
  }

  // Invalidate the OTP to prevent reuse (Requirement 4.5)
  if (validation.otpId) {
    await invalidateOTP(validation.otpId);
  }

  // Create authenticated session (Requirement 4.2)
  const session = await createSession(user.id);

  return session;
}

// ============================================================================
// Credential Authentication Functions
// ============================================================================

/**
 * Login with username and password credentials
 * 
 * Requirements: 5.2, 5.3, 9.3
 * - Retrieves the stored password hash for the username
 * - Compares the submitted password against the stored hash
 * - Creates an authenticated session on successful verification
 * - Returns generic error messages to prevent user enumeration
 * 
 * @param username - The username to authenticate
 * @param password - The password to verify
 * @returns Promise<Session> - The created session with user information
 * @throws AuthError with generic message for any authentication failure
 */
export async function loginWithCredentials(username: string, password: string) {
  // Find user by username (Requirement 5.1)
  const user = await prisma.user.findUnique({
    where: { username },
  });

  // Use generic error message to prevent user enumeration (Requirement 9.3)
  // Don't reveal whether username exists or password is wrong
  if (!user || !user.passwordHash) {
    throw new AuthError(
      'Authentication failed',
      'AUTH_FAILED',
      401
    );
  }

  // Compare password with stored hash (Requirement 5.2)
  const isValid = await comparePassword(password, user.passwordHash);

  if (!isValid) {
    // Use same generic error message (Requirement 9.3)
    throw new AuthError(
      'Authentication failed',
      'AUTH_FAILED',
      401
    );
  }

  // Create authenticated session (Requirement 5.3)
  const session = await createSession(user.id);

  return session;
}
