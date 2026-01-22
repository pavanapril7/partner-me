import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';

/**
 * GET /api/auth/session
 * Validate a session token and return user information
 * 
 * Requirements: 6.4, 6.5
 * - Validates the session token from Authorization header or query parameter
 * - Returns user information for valid, non-expired sessions
 * - Returns error for invalid or expired sessions
 * 
 * Request:
 * - Authorization header: "Bearer <token>"
 * - OR query parameter: ?token=<token>
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "session": {
 *     "id": "string",
 *     "userId": "string",
 *     "token": "string",
 *     "expiresAt": "ISO date string",
 *     "createdAt": "ISO date string",
 *     "user": {
 *       "id": "string",
 *       "username": "string | null",
 *       "mobileNumber": "string | null",
 *       "email": "string | null",
 *       "name": "string | null",
 *       "isAdmin": "boolean",
 *       "createdAt": "ISO date string",
 *       "updatedAt": "ISO date string"
 *     }
 *   }
 * }
 * 
 * Error responses:
 * - 400: Missing token
 * - 401: Invalid or expired session
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header or query parameter
    let token: string | null = null;
    
    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fall back to query parameter
    if (!token) {
      token = request.nextUrl.searchParams.get('token');
    }
    
    // Validate token is provided
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Session token is required',
          },
        },
        { status: 400 }
      );
    }
    
    // Validate the session (Requirements 6.4, 6.5)
    const session = await validateSession(token);
    
    if (!session) {
      // Session is invalid or expired
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'Session is invalid or expired',
          },
        },
        { status: 401 }
      );
    }
    
    // Return session with user information
    return NextResponse.json(
      {
        success: true,
        session: {
          id: session.id,
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
          user: {
            id: session.user.id,
            username: session.user.username,
            mobileNumber: session.user.mobileNumber,
            email: session.user.email,
            name: session.user.name,
            isAdmin: session.user.isAdmin,
            createdAt: session.user.createdAt.toISOString(),
            updatedAt: session.user.updatedAt.toISOString(),
          },
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    // Handle unexpected errors
    console.error('Session validation error:', error);
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
