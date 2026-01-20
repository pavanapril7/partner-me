import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { usernamePasswordLoginSchema } from '@/schemas/auth.schema';
import { loginWithCredentials, AuthError } from '@/lib/auth';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';

/**
 * POST /api/auth/login/credentials
 * Login with username and password credentials
 * 
 * Requirements: 5.2, 5.3, 9.3, 10.2
 * - Validates username and password are provided
 * - Checks rate limiting (5 attempts per 15 minutes)
 * - Retrieves the stored password hash for the username
 * - Compares the submitted password against the stored hash
 * - Creates an authenticated session on successful verification
 * - Returns generic error messages to prevent user enumeration
 * 
 * Request body:
 * {
 *   "username": "string",
 *   "password": "string"
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
 * - 401: Authentication failed (invalid credentials, user not found)
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirement 5.2)
    const validatedData = usernamePasswordLoginSchema.parse(body);
    
    // Check rate limiting (Requirement 10.2)
    const isRateLimited = await checkRateLimit(validatedData.username);
    
    if (isRateLimited) {
      // Record the blocked attempt
      await recordLoginAttempt(validatedData.username, false);
      
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
    
    // Login with credentials and create session (Requirements 5.2, 5.3)
    try {
      const session = await loginWithCredentials(validatedData.username, validatedData.password);
      
      // Record successful login attempt
      await recordLoginAttempt(validatedData.username, true, session.userId);
      
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
      await recordLoginAttempt(validatedData.username, false);
      
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
    
    // Handle authentication errors (invalid credentials, user not found)
    // Generic error message to prevent user enumeration (Requirement 9.3)
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
    console.error('Credential login error:', error);
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
