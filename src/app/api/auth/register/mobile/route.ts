import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { mobileRegistrationSchema } from '@/schemas/auth.schema';
import { registerWithMobile, AuthError, DuplicateError } from '@/lib/auth';

/**
 * POST /api/auth/register/mobile
 * Register a new user with mobile number for OTP-based authentication
 * 
 * Requirements: 1.1, 1.2, 1.3
 * - Validates mobile number format (E.164 format)
 * - Stores mobile number in database
 * - Handles duplicate mobile number errors
 * 
 * Request body:
 * {
 *   "mobileNumber": "string" // E.164 format (e.g., +1234567890)
 * }
 * 
 * Success response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "string",
 *     "mobileNumber": "string",
 *     "createdAt": "string"
 *   },
 *   "message": "User registered successfully"
 * }
 * 
 * Error responses:
 * - 400: Validation error with field-level details
 * - 409: Duplicate mobile number
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirement 1.1)
    const validatedData = mobileRegistrationSchema.parse(body);
    
    // Register user with authentication service (Requirements 1.2, 1.3)
    const user = await registerWithMobile(validatedData.mobileNumber);
    
    // Return success response with user data (excluding sensitive fields)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          createdAt: user.createdAt.toISOString(),
        },
        message: 'User registered successfully',
      },
      { status: 201 }
    );
    
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
    
    // Handle duplicate mobile number error (Requirement 1.3)
    if (error instanceof DuplicateError) {
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
    
    // Handle other authentication errors
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
    console.error('Registration error:', error);
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
