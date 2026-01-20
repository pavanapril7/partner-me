import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { usernamePasswordRegistrationSchema } from '@/schemas/auth.schema';
import { registerWithCredentials, AuthError, DuplicateError } from '@/lib/auth';

/**
 * POST /api/auth/register/credentials
 * Register a new user with username and password
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * - Validates username format (3-30 chars, alphanumeric + underscore)
 * - Validates password requirements (minimum 8 characters)
 * - Hashes password using bcrypt before storage
 * - Handles duplicate username errors
 * 
 * Request body:
 * {
 *   "username": "string",
 *   "password": "string"
 * }
 * 
 * Success response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "string",
 *     "username": "string",
 *     "createdAt": "string"
 *   },
 *   "message": "User registered successfully"
 * }
 * 
 * Error responses:
 * - 400: Validation error with field-level details
 * - 409: Duplicate username
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirements 2.1, 2.2)
    const validatedData = usernamePasswordRegistrationSchema.parse(body);
    
    // Register user with authentication service (Requirements 2.3, 2.4)
    const user = await registerWithCredentials(
      validatedData.username,
      validatedData.password
    );
    
    // Return success response with user data (excluding sensitive fields)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          username: user.username,
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
    
    // Handle duplicate username error (Requirement 2.4)
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
