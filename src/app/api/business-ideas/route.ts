import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { requireAdmin } from '@/lib/admin-auth';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const businessIdeas = await prisma.businessIdea.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: businessIdeas,
    });
  } catch (error) {
    console.error('Error fetching business ideas:', error);
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = businessIdeaSchema.parse(body);

    // Create business idea in database
    const businessIdea = await prisma.businessIdea.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        images: validatedData.images,
        budgetMin: validatedData.budgetMin,
        budgetMax: validatedData.budgetMax,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: businessIdea,
      },
      { status: 201 }
    );
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

    console.error('Error creating business idea:', error);
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
