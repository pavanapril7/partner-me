import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { requireAdmin } from '@/lib/admin-auth';
import { ZodError } from 'zod';

/**
 * GET /api/business-ideas
 * 
 * Returns all public business ideas, including:
 * - Business ideas created directly by admins
 * - Anonymous submissions that have been approved by admins
 * 
 * Note: Pending and rejected anonymous submissions are stored in a separate
 * AnonymousSubmission table and are NOT included in this query. Only approved
 * anonymous submissions create BusinessIdea records and appear in this list.
 * 
 * Requirements: 1.4, 10.3 - Ensures anonymous submissions are isolated from
 * public queries until approved.
 */
export async function GET() {
  try {
    // Query all business ideas from the BusinessIdea table
    // This naturally excludes pending/rejected anonymous submissions since
    // they only exist in the AnonymousSubmission table until approved
    const businessIdeas = await prisma.businessIdea.findMany({
      include: {
        uploadedImages: {
          orderBy: {
            order: 'asc',
          },
          include: {
            variants: true,
          },
        },
      },
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
    console.log('Creating business idea with data:', body);
    
    const validatedData = businessIdeaSchema.parse(body);

    // Extract imageIds if provided (for uploaded images)
    const imageIds = body.imageIds || [];
    console.log('Image IDs to associate:', imageIds);

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

    // Associate uploaded images with the business idea
    if (imageIds.length > 0) {
      console.log(`Associating ${imageIds.length} images with business idea ${businessIdea.id}`);
      
      await prisma.image.updateMany({
        where: {
          id: {
            in: imageIds,
          },
        },
        data: {
          businessIdeaId: businessIdea.id,
        },
      });
      
      console.log('Images associated successfully');
    }

    // Fetch the complete business idea with uploaded images
    const completeBusinessIdea = await prisma.businessIdea.findUnique({
      where: { id: businessIdea.id },
      include: {
        uploadedImages: {
          orderBy: {
            order: 'asc',
          },
          include: {
            variants: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: completeBusinessIdea,
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
