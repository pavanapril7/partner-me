import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { approveSubmission } from '@/lib/submission-service';
import { z } from 'zod';

/**
 * PATCH /api/admin/submissions/[id]/approve
 * 
 * Approve a pending submission and create a public business idea
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 6.4
 * 
 * Request Body (optional):
 * {
 *   title?: string;
 *   description?: string;
 *   budgetMin?: number;
 *   budgetMax?: number;
 * }
 * 
 * Response:
 * - 200: Success with created business idea and updated submission
 * - 400: Validation error
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: Submission not found
 * - 409: Submission already processed
 * - 500: Server error
 */

// Validation schema for optional overrides
const approveSubmissionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
}).refine(
  (data) => {
    // If both budgets are provided, min must not exceed max
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'Minimum budget cannot exceed maximum budget',
    path: ['budgetMin'],
  }
);

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
    let overrides: z.infer<typeof approveSubmissionSchema> | undefined;
    try {
      const body = await request.json();
      
      // Only validate if body has content
      if (Object.keys(body).length > 0) {
        overrides = approveSubmissionSchema.parse(body);
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
      // If JSON parsing fails, continue without overrides
      overrides = undefined;
    }

    // Approve the submission
    const result = await approveSubmission(
      id,
      adminUser.id,
      overrides
    );

    return NextResponse.json({
      success: true,
      data: {
        businessIdea: result.businessIdea,
        submission: result.submission,
      },
    });
  } catch (error) {
    console.error('Error approving submission:', error);

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

      if (error.message.includes('Cannot approve submission with status')) {
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
