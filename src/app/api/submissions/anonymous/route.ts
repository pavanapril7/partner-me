import { NextRequest, NextResponse } from 'next/server';
import { anonymousSubmissionSchema } from '@/schemas/anonymous-submission.schema';
import { createAnonymousSubmission } from '@/lib/submission-service';
import {
  checkSubmissionRateLimit,
  recordSubmissionAttempt,
} from '@/lib/submission-rate-limit';
import { extractIpAddress } from '@/lib/ip-extraction';
import { ZodError } from 'zod';

/**
 * POST /api/submissions/anonymous
 * Create a new anonymous business idea submission
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3
 * 
 * This endpoint allows non-authenticated users to submit business ideas.
 * Submissions are rate-limited by IP address and checked for spam patterns.
 * All submissions start with PENDING status and require admin approval.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract IP address from request
    const ip = extractIpAddress(request);

    if (!ip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'IP_EXTRACTION_FAILED',
            message: 'Unable to determine IP address',
          },
        },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitCheck = checkSubmissionRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitCheck.reason,
            retryAfter: rateLimitCheck.retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '3600',
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = anonymousSubmissionSchema.parse(body);

    // Create submission (includes spam detection)
    const submission = await createAnonymousSubmission({
      title: validatedData.title,
      description: validatedData.description,
      budgetMin: validatedData.budgetMin,
      budgetMax: validatedData.budgetMax,
      contactEmail: validatedData.contactEmail || undefined,
      contactPhone: validatedData.contactPhone || undefined,
      submitterIp: ip,
      imageIds: validatedData.imageIds,
    });

    // Record submission attempt for rate limiting
    recordSubmissionAttempt(ip);

    // Calculate estimated review time
    const estimatedReviewTime = calculateEstimatedReviewTime();

    // Return success response with confirmation
    return NextResponse.json(
      {
        success: true,
        data: {
          id: submission!.id,
          message: 'Your business idea has been submitted successfully and is pending review.',
          estimatedReviewTime,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      // Extract field-specific errors
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (field) {
          fieldErrors[field] = issue.message;
        }
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

    // Log unexpected errors
    console.error('Error creating anonymous submission:', error);

    // Return generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your submission',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate estimated review time
 * 
 * Returns a human-readable estimate of when the submission will be reviewed.
 * In a production system, this could be based on current queue size and
 * historical review times.
 * 
 * Requirements: 2.4
 * 
 * @returns Estimated review time string
 */
function calculateEstimatedReviewTime(): string {
  // For now, return a static estimate
  // In production, this could query the database for pending count
  // and calculate based on average review time
  return '1-3 business days';
}
