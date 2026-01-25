import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { ZodError } from 'zod';
import { createStorageProvider } from '@/lib/storage';

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
    console.log('Updating business idea with data:', body);
    
    const validatedData = businessIdeaSchema.parse(body);

    // Extract imageIds if provided (for uploaded images)
    const imageIds = body.imageIds || [];
    console.log('Image IDs to associate:', imageIds);

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

    // Update image associations if imageIds provided
    if (imageIds.length > 0) {
      console.log(`Updating image associations for business idea ${id}`);
      
      // First, disassociate all current images (set businessIdeaId to null)
      await prisma.image.updateMany({
        where: {
          businessIdeaId: id,
        },
        data: {
          businessIdeaId: null,
        },
      });
      
      // Then associate the new set of images with their order
      // We need to update each image individually to set the correct order
      for (let i = 0; i < imageIds.length; i++) {
        await prisma.image.update({
          where: {
            id: imageIds[i],
          },
          data: {
            businessIdeaId: id,
            order: i,
          },
        });
      }
      
      console.log('Image associations and order updated successfully');
    }

    // Fetch the complete business idea with uploaded images
    const completeBusinessIdea = await prisma.businessIdea.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      data: completeBusinessIdea,
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

    // Check if business idea exists and fetch all associated images
    const existingIdea = await prisma.businessIdea.findUnique({
      where: { id },
      include: {
        uploadedImages: {
          include: {
            variants: true,
          },
        },
      },
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

    // Delete all associated images from storage before database deletion
    if (existingIdea.uploadedImages.length > 0) {
      const storageProvider = createStorageProvider();

      for (const image of existingIdea.uploadedImages) {
        try {
          // Delete the main image file
          await storageProvider.delete(image.storagePath);

          // Delete all variants
          for (const variant of image.variants) {
            await storageProvider.delete(variant.storagePath);
          }
        } catch (storageError) {
          // Log error but continue with deletion
          // We don't want storage errors to prevent database cleanup
          console.error(
            `Error deleting image ${image.id} from storage:`,
            storageError
          );
        }
      }
    }

    // Delete business idea (cascade delete will handle database records for images and partnership requests)
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
