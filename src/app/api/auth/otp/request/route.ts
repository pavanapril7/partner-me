import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { otpRequestSchema } from '@/schemas/auth.schema';
import { requestOTP, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';

/**
 * POST /api/auth/otp/request
 * Request an OTP code for mobile number authentication
 * 
 * Requirements: 3.1, 3.2, 3.3, 10.2
 * - Validates mobile number format (E.164 format)
 * - Checks rate limiting (5 attempts per 15 minutes)
 * - Generates a random 6-digit numeric OTP code
 * - Stores the OTP with 5-minute expiration
 * - Sends the OTP to the user's mobile number via SMS
 * - Invalidates previous unexpired OTPs for the mobile number
 * 
 * Request body:
 * {
 *   "mobileNumber": "string" // E.164 format (e.g., +1234567890)
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "OTP sent successfully"
 * }
 * 
 * Error responses:
 * - 400: Validation error with field-level details
 * - 401: User not found (generic message for security)
 * - 429: Rate limit exceeded
 * - 500: Internal server error (OTP generation or SMS sending failed)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirement 3.1)
    const validatedData = otpRequestSchema.parse(body);
    
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
    
    // Request OTP from authentication service (Requirements 3.1, 3.2, 3.3)
    try {
      await requestOTP(validatedData.mobileNumber);
      
      // Record successful OTP request (not a login attempt, but we track it)
      // Note: We don't record this as a "success" since OTP hasn't been verified yet
      
      // Return success response
      // Note: We don't reveal whether the mobile number exists for security
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
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
    
    // Handle authentication errors (user not found, SMS sending failed, etc.)
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
    console.error('OTP request error:', error);
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
