import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { otpVerifySchema } from '@/schemas/auth.schema';
import { verifyOTP, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';

/**
 * POST /api/auth/otp/verify
 * Verify an OTP code and create an authenticated session
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 10.2
 * - Validates mobile number format (E.164 format)
 * - Validates OTP code format (6-digit numeric)
 * - Checks rate limiting (5 attempts per 15 minutes)
 * - Verifies the OTP code matches the stored OTP
 * - Checks that the OTP has not expired
 * - Creates an authenticated session on successful verification
 * - Invalidates the OTP after successful verification (single-use)
 * 
 * Request body:
 * {
 *   "mobileNumber": "string", // E.164 format (e.g., +1234567890)
 *   "code": "string"          // 6-digit numeric code
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "session": {
 *     "id": "string",
 *     "token": "string",
 *     "userId": "string",
 *     "expiresAt": "string"
 *   }
 * }
 * 
 * Error responses:
 * - 400: Validation error with field-level details
 * - 401: Authentication failed (invalid/expired OTP, user not found)
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirements 4.1)
    const validatedData = otpVerifySchema.parse(body);
    
    // Check rate limiting (Requirement 10.2)
    const isRateLimited = await checkRateLimit(validatedData.mobileNumber);
    
    if (isRateLimited) {
      // Record the blocked attempt
      await recordLoginAttempt(validatedData.mobileNumber, false);
      
      // Return rate limit error (Requirement 9.4)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many attempts. Please try again later.',
            retryAfter: 900, // 15 minutes in seconds
          },
        },
        { status: 429 }
      );
    }
    
    // Verify OTP and create session (Requirements 4.1, 4.2, 4.4, 4.5)
    try {
      const session = await verifyOTP(validatedData.mobileNumber, validatedData.code);
      
      // Record successful login attempt
      await recordLoginAttempt(validatedData.mobileNumber, true, session.userId);
      
      // Return success response with session
      return NextResponse.json(
        {
          success: true,
          session: {
            id: session.id,
            token: session.token,
            userId: session.userId,
            expiresAt: session.expiresAt.toISOString(),
          },
        },
        { status: 200 }
      );
    } catch (error) {
      // Record failed attempt for rate limiting
      await recordLoginAttempt(validatedData.mobileNumber, false);
      
      // Re-throw to be handled by outer catch block
      throw error;
    }
    
  } catch (error) {
    // Handle Zod validation errors (Requirement 9.2)
    if (error instanceof ZodError) {
      // Format validation errors with field-level details
      const details: Record<string, string[]> = {};
      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!details[field]) {
          details[field] = [];
        }
        details[field].push(issue.message);
      });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          },
        },
        { status: 400 }
      );
    }
    
    // Handle authentication errors (invalid OTP, expired OTP, user not found)
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }
    
    // Handle unexpected errors
    console.error('OTP verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
