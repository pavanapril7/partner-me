import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { partnershipRequestSchema, partnershipRoleSchema, partnershipStatusSchema } from '@/schemas/business-idea.schema';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * POST /api/partnership-requests
 * Create a new partnership request
 * Requirements: 3.5, 4.5
 * 
 * Public endpoint - no authentication required
 * Validates input and creates partnership request with PENDING status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = partnershipRequestSchema.safeParse(body);
    
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

    const { businessIdeaId, name, phoneNumber, role } = validationResult.data;

    // Verify business idea exists
    const businessIdea = await prisma.businessIdea.findUnique({
      where: { id: businessIdeaId },
    });

    if (!businessIdea) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Business idea not found',
          },
        },
        { status: 404 }
      );
    }

    // Create partnership request with PENDING status
    const partnershipRequest = await prisma.partnershipRequest.create({
      data: {
        businessIdeaId,
        name,
        phoneNumber,
        role,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: partnershipRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating partnership request:', error);
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
 * GET /api/partnership-requests
 * Fetch partnership requests with optional filters
 * Requirements: 11.1, 11.3, 11.4, 11.5, 12.4
 * 
 * Admin-only endpoint
 * Supports filtering by businessIdeaId, role, and status
 * Returns requests sorted by createdAt descending
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const businessIdeaId = searchParams.get('businessIdeaId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Build filter object
    const where: Record<string, string> = {};

    if (businessIdeaId) {
      where.businessIdeaId = businessIdeaId;
    }

    if (role) {
      // Validate role
      const roleValidation = partnershipRoleSchema.safeParse(role);
      if (!roleValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid role value',
            },
          },
          { status: 400 }
        );
      }
      where.role = role;
    }

    if (status) {
      // Validate status
      const statusValidation = partnershipStatusSchema.safeParse(status);
      if (!statusValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid status value',
            },
          },
          { status: 400 }
        );
      }
      where.status = status;
    }

    // Fetch partnership requests with filters and sorting
    const partnershipRequests = await prisma.partnershipRequest.findMany({
      where,
      include: {
        businessIdea: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: partnershipRequests,
    });
  } catch (error) {
    console.error('Error fetching partnership requests:', error);
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
