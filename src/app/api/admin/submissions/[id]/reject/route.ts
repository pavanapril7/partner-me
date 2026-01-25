import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { rejectSubmission } from '@/lib/submission-service';
import { z } from 'zod';

/**
 * PATCH /api/admin/submissions/[id]/reject
 * 
 * Reject a pending submission
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.4
 * 
 * Request Body (optional):
 * {
 *   reason?: string;
 * }
 * 
 * Response:
 * - 200: Success with updated submission
 * - 400: Validation error
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Submission not found
 * - 409: Submission already processed
 * - 500: Server error
 */

// Validation schema for optional rejection reason
const rejectSubmissionSchema = z.object({
  reason: z.string().max(1000, 'Rejection reason must be at most 1000 characters').optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const adminUser = authResult.user!;

    // Parse and validate request body
    let reason: string | undefined;
    try {
      const body = await request.json();
      
      // Validate if body has content
      if (Object.keys(body).length > 0) {
        const validated = rejectSubmissionSchema.parse(body);
        reason = validated.reason;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              fields: error.issues.reduce((acc: Record<string, string>, err) => {
                const field = err.path.join('.');
                acc[field] = err.message;
                return acc;
              }, {}),
            },
          },
          { status: 400 }
        );
      }
      // If JSON parsing fails, continue without reason
      reason = undefined;
    }

    // Reject the submission
    const submission = await rejectSubmission(
      id,
      adminUser.id,
      reason
    );

    return NextResponse.json({
      success: true,
      data: {
        submission,
      },
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);

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

      if (error.message.includes('Cannot reject submission with status')) {
        // Extract the current status from the error message
        const statusMatch = error.message.match(/status (\w+)/);
        const currentStatus = statusMatch ? statusMatch[1] : 'unknown';

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SUBMISSION_ALREADY_PROCESSED',
              message: 'This submission has already been approved or rejected',
              currentStatus,
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
