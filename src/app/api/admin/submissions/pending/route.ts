import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getPendingSubmissions } from '@/lib/submission-service';

/**
 * GET /api/admin/submissions/pending
 * 
 * List pending submissions with filtering and pagination
 * 
 * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in title and description)
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * - hasContact: boolean (filter by contact information presence)
 * - flagged: boolean (filter by flagged status)
 * 
 * Response:
 * - 200: Success with submissions and pagination metadata
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!, 10)
      : undefined;
    
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;
    
    const search = searchParams.get('search') || undefined;
    
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;
    
    const hasContact = searchParams.get('hasContact')
      ? searchParams.get('hasContact') === 'true'
      : undefined;
    
    const flagged = searchParams.get('flagged')
      ? searchParams.get('flagged') === 'true'
      : undefined;

    // Validate date parameters
    if (dateFrom && isNaN(dateFrom.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateFrom parameter',
          },
        },
        { status: 400 }
      );
    }

    if (dateTo && isNaN(dateTo.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateTo parameter',
          },
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page must be a positive integer',
          },
        },
        { status: 400 }
      );
    }

    if (limit !== undefined && (limit < 1 || limit > 100 || !Number.isInteger(limit))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be an integer between 1 and 100',
          },
        },
        { status: 400 }
      );
    }

    // Get pending submissions with filters
    const result = await getPendingSubmissions({
      page,
      limit,
      search,
      dateFrom,
      dateTo,
      hasContact,
      flagged,
    });

    return NextResponse.json({
      success: true,
      data: {
        submissions: result.data,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
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
