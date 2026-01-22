import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { ZodError } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessIdea = await prisma.businessIdea.findUnique({
      where: {
        id,
      },
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

    return NextResponse.json({
      success: true,
      data: businessIdea,
    });
  } catch (error) {
    console.error('Error fetching business idea:', error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Check if business idea exists
    const existingIdea = await prisma.businessIdea.findUnique({
      where: { id },
    });

    if (!existingIdea) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = businessIdeaSchema.parse(body);

    // Update business idea in database
    const businessIdea = await prisma.businessIdea.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        images: validatedData.images,
        budgetMin: validatedData.budgetMin,
        budgetMax: validatedData.budgetMax,
      },
    });

    return NextResponse.json({
      success: true,
      data: businessIdea,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues[0]?.message || 'Validation failed',
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating business idea:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Check if business idea exists
    const existingIdea = await prisma.businessIdea.findUnique({
      where: { id },
    });

    if (!existingIdea) {
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

    // Delete business idea (cascade delete will handle partnership requests)
    await prisma.businessIdea.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting business idea:', error);
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
