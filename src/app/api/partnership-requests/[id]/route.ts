import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { partnershipStatusUpdateSchema } from '@/schemas/business-idea.schema';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * PATCH /api/partnership-requests/[id]
 * Update partnership request status
 * Requirements: 12.2
 * 
 * Admin-only endpoint
 * Validates status value and updates the partnership request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = partnershipStatusUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.issues[0].message,
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;
    const { id } = await params;

    // Check if partnership request exists
    const existingRequest = await prisma.partnershipRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partnership request not found',
          },
        },
        { status: 404 }
      );
    }

    // Update partnership request status
    const updatedRequest = await prisma.partnershipRequest.update({
      where: { id },
      data: { status },
      include: {
        businessIdea: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating partnership request:', error);
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
