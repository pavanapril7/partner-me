import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSubmissionStats } from '@/lib/submission-service';

/**
 * GET /api/admin/submissions/stats
 * 
 * Get submission statistics for the admin dashboard
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Response:
 * - 200: Success with statistics object
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Get submission statistics
    const stats = await getSubmissionStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching submission statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'An error occurred while processing your request',
        },
      },
      { status: 500 }
    );
  }
}
