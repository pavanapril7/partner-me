import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStorageProvider } from '@/lib/storage';
import { requireAdmin } from '@/lib/admin-auth';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * GET /api/images/[id]
 * Serve an image by ID with optional variant
 * 
 * Query Parameters:
 * - variant: 'thumbnail' | 'medium' | 'full' (default: 'full')
 * 
 * Requirements: 5.5, 8.1, 8.2, 8.3, 8.5, 12.2, 12.4, 12.5
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const variant = searchParams.get('variant') || 'full';

    // Validate variant parameter
    if (!['thumbnail', 'medium', 'full'].includes(variant)) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'INVALID_VARIANT',
          message: 'Variant must be thumbnail, medium, or full' 
        },
        { status: 400 }
      );
    }

    // Verify image exists in database (Requirement 12.4, 12.5)
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        variants: {
          where: {
            variant: variant.toUpperCase() as 'THUMBNAIL' | 'MEDIUM' | 'FULL',
          },
        },
      },
    });

    // Return 404 for non-existent images (Requirement 12.5)
    if (!image) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'NOT_FOUND',
          message: 'Image not found' 
        },
        { status: 404 }
      );
    }

    // Get the appropriate variant (Requirement 5.5, 8.1, 8.2)
    const imageVariant = image.variants[0];
    
    if (!imageVariant) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'VARIANT_NOT_FOUND',
          message: 'Image variant not found' 
        },
        { status: 404 }
      );
    }

    // Retrieve file from storage
    const storage = createStorageProvider();
    const storagePath = imageVariant.storagePath;

    // Check if file exists in storage (Requirement 12.4)
    const fileExists = await storage.exists(storagePath);
    
    if (!fileExists) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'FILE_NOT_FOUND',
          message: 'Image file not found in storage' 
        },
        { status: 404 }
      );
    }

    // For local storage, read the file directly
    // For S3, we could redirect to the S3 URL or proxy the file
    const storageType = process.env.STORAGE_TYPE || 'local';
    
    if (storageType === 'local') {
      // Read file from local storage
      const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
      const fullPath = path.join(uploadDir, storagePath);
      const fileBuffer = await fs.readFile(fullPath);

      // Set cache headers for browser caching (Requirement 8.3)
      // Images are immutable (identified by unique ID), so we can cache aggressively
      const headers = new Headers();
      headers.set('Content-Type', image.mimeType); // Requirement 8.5
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      headers.set('Content-Length', fileBuffer.length.toString());
      headers.set('ETag', `"${id}-${variant}"`); // Add ETag for conditional requests
      headers.set('Vary', 'Accept-Encoding'); // Vary header for compression

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } else {
      // For S3 storage, redirect to the S3 URL
      const url = storage.getUrl(storagePath);
      
      // Set cache headers even for redirects
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', `"${id}-${variant}"`);
      
      return NextResponse.redirect(url, {
        status: 302,
        headers,
      });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        code: 'SERVER_ERROR',
        message: 'Failed to serve image' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[id]
 * Delete an image and all its variants
 * 
 * Requirements: 11.3
 * - Verify image exists
 * - Delete image and all variants from storage
 * - Delete Image and ImageVariant records from database
 * - Protect with admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Protect with admin authentication (Requirement 11.3)
    const authResult = await requireAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    // Verify image exists in database (Requirement 11.3)
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    // Return 404 for non-existent images
    if (!image) {
      return NextResponse.json(
        { 
          success: false, 
          code: 'NOT_FOUND',
          message: 'Image not found' 
        },
        { status: 404 }
      );
    }

    // Delete image and all variants from storage (Requirement 11.3)
    const storage = createStorageProvider();
    
    // Delete all variant files from storage
    const deletionPromises = image.variants.map(variant => 
      storage.delete(variant.storagePath).catch(error => {
        console.error(`Failed to delete variant ${variant.id} from storage:`, error);
        // Continue with other deletions even if one fails
      })
    );

    // Delete the original/full image file from storage
    deletionPromises.push(
      storage.delete(image.storagePath).catch(error => {
        console.error(`Failed to delete image ${image.id} from storage:`, error);
        // Continue with database deletion even if storage deletion fails
      })
    );

    // Wait for all storage deletions to complete
    await Promise.all(deletionPromises);

    // Delete Image and ImageVariant records from database (Requirement 11.3)
    // Prisma will cascade delete ImageVariant records automatically
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Image deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        code: 'SERVER_ERROR',
        message: 'Failed to delete image' 
      },
      { status: 500 }
    );
  }
}
