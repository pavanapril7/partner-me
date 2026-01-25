import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSubmissionById, updateSubmission } from '@/lib/submission-service';
import { submissionUpdateSchema } from '@/schemas/anonymous-submission.schema';

/**
 * GET /api/admin/submissions/[id]
 * 
 * Get a single submission by ID with complete details
 * 
 * Requirements: 3.3
 * 
 * Response:
 * - 200: Success with complete submission data
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Submission not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;

    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Get submission by ID
    const submission = await getSubmissionById(id);

    // Handle not found
    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUBMISSION_NOT_FOUND',
            message: 'Submission not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        submission,
      },
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
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

/**
 * PATCH /api/admin/submissions/[id]
 * 
 * Edit a pending submission
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * Request Body:
 * - title?: string (1-200 characters)
 * - description?: string (10-5000 characters)
 * - budgetMin?: number (non-negative)
 * - budgetMax?: number (non-negative)
 * - contactEmail?: string (valid email format)
 * - contactPhone?: string (valid phone format)
 * 
 * Response:
 * - 200: Success with updated submission data
 * - 400: Validation error
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Submission not found
 * - 409: Conflict (submission not in PENDING status)
 * - 500: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;

    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = submissionUpdateSchema.safeParse(body);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path.join('.');
        fieldErrors[field] = err.message;
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Update the submission
    const updatedSubmission = await updateSubmission(
      id,
      authResult.user.id,
      validation.data
    );

    return NextResponse.json({
      success: true,
      data: {
        submission: updatedSubmission,
      },
    });
  } catch (error) {
    console.error('Error updating submission:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'Submission not found') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SUBMISSION_NOT_FOUND',
              message: 'Submission not found',
            },
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Only PENDING submissions can be edited')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SUBMISSION_ALREADY_PROCESSED',
              message: error.message,
            },
          },
          { status: 409 }
        );
      }
    }

    // Generic error
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
