import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateImage } from '@/lib/image/validation';
import { processImage } from '@/lib/image/processing';
import { createStorageProvider } from '@/lib/storage';
import { requireAdmin } from '@/lib/admin-auth';
import {
  checkUploadRateLimit,
  recordUploadAttempt,
} from '@/lib/upload-rate-limit';

/**
 * POST /api/upload
 * Handle image file uploads
 * Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 7.1, 7.2, 7.4
 * 
 * Supports both authenticated admin uploads and anonymous uploads:
 * - Admin uploads: Can associate with businessIdeaId, rate limited per user
 * - Anonymous uploads: Always go to temp storage, rate limited per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data first to check businessIdeaId
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const businessIdeaId = formData.get('businessIdeaId') as string | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        },
        { status: 400 }
      );
    }

    // Determine if this is an authenticated or anonymous upload
    let userId: string | null = null;
    let isAnonymous = false;

    // Try to authenticate - if businessIdeaId is provided, require admin auth
    if (businessIdeaId) {
      const authResult = await requireAdmin(request);
      if (authResult.error) {
        return authResult.error;
      }
      userId = authResult.user.id;
    } else {
      // Anonymous upload to temp storage
      isAnonymous = true;
    }

    // Check rate limit
    let rateLimitCheck;
    if (isAnonymous) {
      // For anonymous uploads, use IP-based rate limiting
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      rateLimitCheck = checkUploadRateLimit(ip);
    } else {
      // For authenticated uploads, use user ID
      rateLimitCheck = checkUploadRateLimit(userId!);
    }

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
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Verify business idea ownership if businessIdeaId is provided
    if (businessIdeaId) {
      const businessIdea = await prisma.businessIdea.findUnique({
        where: { id: businessIdeaId },
        select: { id: true },
      });

      if (!businessIdea) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BUSINESS_IDEA_NOT_FOUND',
              message: 'Business idea not found',
            },
          },
          { status: 404 }
        );
      }

      // Note: In this system, all admins can manage all business ideas
      // If you need per-user ownership, add a userId field to BusinessIdea
      // and check: businessIdea.userId === user.id
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image
    const validationResult = await validateImage(
      buffer,
      file.type,
      file.name
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: validationResult.error || 'Invalid image file',
          },
        },
        { status: 400 }
      );
    }

    // Record upload attempt for rate limiting
    if (isAnonymous) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      recordUploadAttempt(ip);
    } else {
      recordUploadAttempt(userId!);
    }

    // Process image and generate variants
    const processedImage = await processImage(buffer);

    // Generate unique image ID
    const imageId = generateImageId();

    // Determine storage path based on whether businessIdeaId is provided
    const basePath = businessIdeaId
      ? `business-ideas/${businessIdeaId}/${imageId}`
      : `temp/${imageId}`;

    // Initialize storage provider
    const storage = createStorageProvider();

    // Upload all variants to storage
    const [fullPath, mediumPath, thumbnailPath] = await Promise.all([
      storage.upload(
        processedImage.full.buffer,
        `${basePath}/full.webp`,
        'image/webp'
      ),
      storage.upload(
        processedImage.medium.buffer,
        `${basePath}/medium.webp`,
        'image/webp'
      ),
      storage.upload(
        processedImage.thumbnail.buffer,
        `${basePath}/thumbnail.webp`,
        'image/webp'
      ),
    ]);

    // Create Image record in database
    const image = await prisma.image.create({
      data: {
        id: imageId,
        businessIdeaId: businessIdeaId || undefined,
        filename: file.name,
        storagePath: fullPath,
        mimeType: file.type,
        size: buffer.length,
        width: processedImage.originalMetadata.width,
        height: processedImage.originalMetadata.height,
        order: 0, // Will be updated when associated with business idea
        variants: {
          create: [
            {
              variant: 'FULL',
              storagePath: fullPath,
              width: processedImage.full.width,
              height: processedImage.full.height,
              size: processedImage.full.size,
            },
            {
              variant: 'MEDIUM',
              storagePath: mediumPath,
              width: processedImage.medium.width,
              height: processedImage.medium.height,
              size: processedImage.medium.size,
            },
            {
              variant: 'THUMBNAIL',
              storagePath: thumbnailPath,
              width: processedImage.thumbnail.width,
              height: processedImage.thumbnail.height,
              size: processedImage.thumbnail.size,
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });

    // Generate API URLs for each variant
    // Use API routes instead of direct storage URLs for consistent access
    const fullUrl = `/api/images/${image.id}?variant=full`;
    const mediumUrl = `/api/images/${image.id}?variant=medium`;
    const thumbnailUrl = `/api/images/${image.id}?variant=thumbnail`;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: image.id,
          url: fullUrl,
          thumbnail: thumbnailUrl,
          medium: mediumUrl,
          filename: image.filename,
          size: image.size,
          width: image.width,
          height: image.height,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('process')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROCESSING_ERROR',
              message: 'Failed to process image',
            },
          },
          { status: 500 }
        );
      }

      if (error.message.includes('storage') || error.message.includes('upload')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'STORAGE_ERROR',
              message: 'Failed to store image',
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your request',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique, unpredictable image ID
 * Uses timestamp + random string for uniqueness
 * Requirements: 7.2, 12.1, 12.3
 */
function generateImageId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `img_${timestamp}_${randomStr}`;
}
