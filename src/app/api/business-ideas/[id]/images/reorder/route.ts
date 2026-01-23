import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

/**
 * PATCH /api/business-ideas/[id]/images/reorder
 * 
 * Reorder images for a business idea
 * 
 * Requirements: 6.2, 6.3
 * - Validates image IDs belong to business idea
 * - Updates order field for each image
 * - Protected with admin authentication
 */

const reorderSchema = z.object({
  imageIds: z.array(z.string()).min(1, 'At least one image ID is required'),
});

export async function PATCH(
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
    const businessIdea = await prisma.businessIdea.findUnique({
      where: { id },
      include: {
        uploadedImages: true,
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reorderSchema.parse(body);
    const { imageIds } = validatedData;

    // Validate that all image IDs belong to this business idea
    const businessIdeaImageIds = new Set(
      businessIdea.uploadedImages.map((img) => img.id)
    );

    const invalidImageIds = imageIds.filter(
      (imageId) => !businessIdeaImageIds.has(imageId)
    );

    if (invalidImageIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMAGE_IDS',
            message: `The following image IDs do not belong to this business idea: ${invalidImageIds.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Update order field for each image
    // Use a transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      imageIds.map((imageId, index) =>
        prisma.image.update({
          where: { id: imageId },
          data: { order: index },
        })
      )
    );

    // Fetch updated images to return
    const updatedImages = await prisma.image.findMany({
      where: {
        businessIdeaId: id,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        images: updatedImages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

    console.error('Error reordering images:', error);
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
