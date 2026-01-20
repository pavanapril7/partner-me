import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logoutSchema } from '@/schemas/auth.schema';
import { invalidateSession } from '@/lib/session';

/**
 * POST /api/auth/logout
 * Logout and invalidate the current session
 * 
 * Requirements: 7.1, 7.2
 * - Validates session token is provided
 * - Invalidates the session token
 * - Removes the session from storage
 * 
 * Request body:
 * {
 *   "token": "string"
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 * 
 * Error responses:
 * - 400: Validation error (missing or invalid token format)
 * - 404: Session not found (already logged out or invalid token)
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body with Zod (Requirement 7.1)
    const validatedData = logoutSchema.parse(body);
    
    // Invalidate the session (Requirements 7.1, 7.2)
    const wasInvalidated = await invalidateSession(validatedData.token);
    
    if (!wasInvalidated) {
      // Session doesn't exist or was already invalidated
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or already logged out',
          },
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
    
  } catch (error) {
    // Handle Zod validation errors
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
    
    // Handle unexpected errors
    console.error('Logout error:', error);
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
