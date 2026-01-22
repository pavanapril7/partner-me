import { NextRequest } from 'next/server';
import { validateSession } from './session';

/**
 * Admin authentication utilities
 * Provides middleware for protecting admin routes and API endpoints
 */

export interface AuthenticatedUser {
  id: string;
  username: string | null;
  mobileNumber: string | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
}

/**
 * Authenticate an admin user from request
 * 
 * Requirements: 8.1, 9.1, 10.1, 11.1
 * - Checks if user is authenticated via session token
 * - Verifies user has admin role (isAdmin = true)
 * 
 * @param request - The Next.js request object
 * @returns The authenticated admin user if valid, null otherwise
 */
export async function authenticateAdmin(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Validate the session
  const session = await validateSession(token);
  
  if (!session) {
    return null;
  }

  // Check if user has admin role
  if (!session.user.isAdmin) {
    return null;
  }
  
  return {
    id: session.user.id,
    username: session.user.username,
    mobileNumber: session.user.mobileNumber,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin,
  };
}

/**
 * Verify admin authentication and return result
 * 
 * Requirements: 8.1, 9.1, 10.1, 11.1
 * - Validates admin authentication
 * - Returns structured response with success status
 * 
 * @param request - The Next.js request object
 * @returns Object with success status and optional error message
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }> {
  const user = await authenticateAdmin(request);
  
  if (!user) {
    return {
      success: false,
      error: 'Admin authentication required',
    };
  }
  
  return {
    success: true,
    user,
  };
}

/**
 * Middleware helper to protect admin API routes
 * 
 * Requirements: 8.1, 9.1, 10.1, 11.1
 * - Validates admin authentication
 * - Returns 401 response if not authenticated
 * - Returns 403 response if authenticated but not admin
 * 
 * Usage in API routes:
 * ```
 * const authResult = await requireAdmin(request);
 * if (authResult.error) {
 *   return authResult.error;
 * }
 * const user = authResult.user;
 * ```
 * 
 * @param request - The Next.js request object
 * @returns Object with user or error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<
  | { user: AuthenticatedUser; error?: never }
  | { user?: never; error: Response }
> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: Response.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const session = await validateSession(token);
  
  if (!session) {
    return {
      error: Response.json(
        {
          success: false,
          error: {
            message: 'Invalid or expired session',
            code: 'INVALID_SESSION',
          },
        },
        { status: 401 }
      ),
    };
  }

  if (!session.user.isAdmin) {
    return {
      error: Response.json(
        {
          success: false,
          error: {
            message: 'Admin access required',
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      ),
    };
  }
  
  return {
    user: {
      id: session.user.id,
      username: session.user.username,
      mobileNumber: session.user.mobileNumber,
      email: session.user.email,
      name: session.user.name,
      isAdmin: session.user.isAdmin,
    },
  };
}
