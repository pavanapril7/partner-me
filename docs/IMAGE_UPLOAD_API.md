# Image Upload API Documentation

This document provides comprehensive documentation for the Business Idea Image Upload API endpoints.

## Overview

The Image Upload API enables administrators to upload, manage, and serve images for business ideas. The system handles file validation, image optimization, multiple size variants generation, and supports both local filesystem and cloud storage (S3-compatible) backends.

## Table of Contents

- [Upload Endpoint](#upload-endpoint)
- [Image Serving Endpoint](#image-serving-endpoint)
- [Image Deletion Endpoint](#image-deletion-endpoint)
- [Image Reordering Endpoint](#image-reordering-endpoint)
- [Error Codes Reference](#error-codes-reference)
- [Testing](#testing)

---

## Upload Endpoint

### POST /api/upload

Upload one or more image files for a business idea.

**Requirements:** 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 7.1, 7.2, 7.4

**Authentication:** Admin authentication required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file to upload (JPEG, PNG, WebP, or GIF) |
| `businessIdeaId` | string | No | ID of business idea to associate image with (optional for temp uploads) |

**File Validation Rules:**

- **Allowed formats:** JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp), GIF (.gif)
- **Maximum file size:** 5MB (5,242,880 bytes)
- **Minimum dimensions:** 200x200 pixels
- **Maximum dimensions:** 4096x4096 pixels
- **MIME type validation:** Validates both MIME type and file signature (magic bytes)

**Image Processing:**

The system automatically generates three optimized variants:

1. **Thumbnail:** 300x300px, 80% quality, WebP format
2. **Medium:** 800x800px, 85% quality, WebP format
3. **Full:** 1920x1920px max, 90% quality, original or WebP format

All variants have EXIF metadata stripped for privacy and size reduction.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "url": "/api/images/clx1a2b3c4d5e6f7g8h9i0j1k",
    "thumbnail": "/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=thumbnail",
    "medium": "/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=medium",
    "filename": "product-photo.jpg",
    "size": 2458624,
    "width": 2048,
    "height": 1536,
    "mimeType": "image/jpeg",
    "createdAt": "2026-01-22T10:30:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Invalid File Type

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG, PNG, WebP, and GIF images are supported"
  }
}
```

#### 400 Bad Request - Invalid Dimensions

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DIMENSIONS",
    "message": "Image dimensions must be between 200x200 and 4096x4096 pixels"
  }
}
```

#### 400 Bad Request - No File Provided

```json
{
  "success": false,
  "error": {
    "code": "NO_FILE",
    "message": "No file provided"
  }
}
```

#### 413 Payload Too Large - File Too Large

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image must be smaller than 5MB"
  }
}
```

#### 500 Internal Server Error - Processing Error

```json
{
  "success": false,
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process image"
  }
}
```

#### 500 Internal Server Error - Storage Error

```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Failed to store image"
  }
}
```

**Example Usage:**

Using cURL:
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "file=@/path/to/image.jpg" \
  -F "businessIdeaId=clx1a2b3c4d5e6f7g8h9i0j1k"
```

Using JavaScript (FormData):
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('businessIdeaId', 'clx1a2b3c4d5e6f7g8h9i0j1k');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

**Storage Behavior:**

- **With businessIdeaId:** Images are stored in `uploads/business-ideas/{businessIdeaId}/{imageId}/`
- **Without businessIdeaId:** Images are stored in `uploads/temp/{imageId}/` for 24 hours
- Temp images are automatically cleaned up after 24 hours if not associated with a business idea

---

## Image Serving Endpoint

### GET /api/images/[id]

Retrieve and serve an uploaded image by its ID.

**Requirements:** 5.5, 8.1, 8.2, 8.3, 8.5, 12.2, 12.4, 12.5

**Authentication:** Public access (no authentication required)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique image identifier (cuid) |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `variant` | string | No | `full` | Image variant to serve: `thumbnail`, `medium`, or `full` |

**Success Response (200):**

Returns the image file with appropriate headers:

**Response Headers:**
```
Content-Type: image/jpeg | image/png | image/webp | image/gif
Cache-Control: public, max-age=31536000, immutable
ETag: "<unique-hash>"
Last-Modified: <timestamp>
```

**Error Responses:**

#### 404 Not Found - Image Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Image not found"
  }
}
```

#### 404 Not Found - Variant Not Found

```json
{
  "success": false,
  "error": {
    "code": "VARIANT_NOT_FOUND",
    "message": "Image variant not found"
  }
}
```

#### 500 Internal Server Error - Storage Error

```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Failed to retrieve image"
  }
}
```

**Example Usage:**

Serve full-size image:
```bash
curl -X GET http://localhost:3000/api/images/clx1a2b3c4d5e6f7g8h9i0j1k
```

Serve thumbnail:
```bash
curl -X GET "http://localhost:3000/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=thumbnail"
```

Serve medium size:
```bash
curl -X GET "http://localhost:3000/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=medium"
```

Using in HTML:
```html
<!-- Thumbnail -->
<img src="/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=thumbnail" 
     alt="Business idea thumbnail" />

<!-- Medium size -->
<img src="/api/images/clx1a2b3c4d5e6f7g8h9i0j1k?variant=medium" 
     alt="Business idea preview" />

<!-- Full size -->
<img src="/api/images/clx1a2b3c4d5e6f7g8h9i0j1k" 
     alt="Business idea full image" />
```

Using Next.js Image component:
```jsx
import Image from 'next/image';

<Image
  src={`/api/images/${imageId}?variant=medium`}
  alt="Business idea"
  width={800}
  height={800}
  loading="lazy"
/>
```

**Caching Strategy:**

- Images are served with long-term cache headers (1 year)
- Images are immutable (never modified after upload)
- Use CDN for production deployments to improve performance
- Browser caching reduces server load and improves user experience

---

## Image Deletion Endpoint

### DELETE /api/images/[id]

Delete an uploaded image and all its variants.

**Requirements:** 11.3

**Authentication:** Admin authentication required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique image identifier (cuid) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error Responses:**

#### 401 Unauthorized - Authentication Required

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin authentication required"
  }
}
```

#### 404 Not Found - Image Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Image not found"
  }
}
```

#### 500 Internal Server Error - Deletion Failed

```json
{
  "success": false,
  "error": {
    "code": "DELETION_ERROR",
    "message": "Failed to delete image"
  }
}
```

**Deletion Behavior:**

1. Verifies image exists in database
2. Deletes all image variants from storage (thumbnail, medium, full)
3. Deletes image record from database
4. Cascade deletes all ImageVariant records (handled by Prisma)
5. Updates order of remaining images if part of a business idea

**Example Usage:**

Using cURL:
```bash
curl -X DELETE http://localhost:3000/api/images/clx1a2b3c4d5e6f7g8h9i0j1k \
  -H "Authorization: Bearer <admin-token>"
```

Using JavaScript:
```javascript
const response = await fetch(`/api/images/${imageId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
if (result.success) {
  console.log('Image deleted successfully');
}
```

**Cascade Deletion:**

When a business idea is deleted, all associated images are automatically deleted:

1. Business idea deletion triggers cascade delete in database
2. Cleanup script removes orphaned image files from storage
3. All variants (thumbnail, medium, full) are removed

---

## Image Reordering Endpoint

### PATCH /api/business-ideas/[id]/images/reorder

Reorder images for a business idea.

**Requirements:** 6.2, 6.3

**Authentication:** Admin authentication required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Business idea ID |

**Request Body:**

```json
{
  "imageIds": ["image-id-1", "image-id-2", "image-id-3"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageIds` | string[] | Yes | Array of image IDs in desired display order |

**Validation Rules:**

- All image IDs must belong to the specified business idea
- Array must contain all images currently associated with the business idea
- No duplicate IDs allowed
- Order is 0-indexed (first image has order 0)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Images reordered successfully",
  "data": {
    "businessIdeaId": "clx1a2b3c4d5e6f7g8h9i0j1k",
    "images": [
      {
        "id": "image-id-1",
        "order": 0,
        "url": "/api/images/image-id-1"
      },
      {
        "id": "image-id-2",
        "order": 1,
        "url": "/api/images/image-id-2"
      },
      {
        "id": "image-id-3",
        "order": 2,
        "url": "/api/images/image-id-3"
      }
    ]
  }
}
```

**Error Responses:**

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid image IDs provided",
    "details": {
      "imageIds": ["All images must belong to this business idea"]
    }
  }
}
```

#### 400 Bad Request - Missing Images

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Image IDs array must contain all business idea images"
  }
}
```

#### 401 Unauthorized - Authentication Required

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin authentication required"
  }
}
```

#### 404 Not Found - Business Idea Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Business idea not found"
  }
}
```

#### 500 Internal Server Error - Update Failed

```json
{
  "success": false,
  "error": {
    "code": "UPDATE_ERROR",
    "message": "Failed to reorder images"
  }
}
```

**Example Usage:**

Using cURL:
```bash
curl -X PATCH http://localhost:3000/api/business-ideas/clx1a2b3c4d5e6f7g8h9i0j1k/images/reorder \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageIds": ["image-id-3", "image-id-1", "image-id-2"]
  }'
```

Using JavaScript:
```javascript
const response = await fetch(
  `/api/business-ideas/${businessIdeaId}/images/reorder`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageIds: ['image-id-3', 'image-id-1', 'image-id-2']
    })
  }
);

const result = await response.json();
```

**Primary Image:**

The first image in the ordered list (order = 0) is used as the primary image:
- Displayed in business idea listings
- Used as the default preview image
- Featured in search results and cards

---

## Error Codes Reference

### Upload Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `INVALID_FILE_TYPE` | 400 | File is not a supported image format | Upload JPEG, PNG, WebP, or GIF files only |
| `FILE_TOO_LARGE` | 413 | File exceeds 5MB size limit | Compress or resize image before upload |
| `INVALID_DIMENSIONS` | 400 | Image dimensions outside acceptable range | Use images between 200x200 and 4096x4096 pixels |
| `NO_FILE` | 400 | No file provided in request | Include file in multipart form data |
| `PROCESSING_ERROR` | 500 | Image processing failed | Try again or contact support |
| `STORAGE_ERROR` | 500 | Failed to store image | Check storage configuration or try again |

### Serving Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `NOT_FOUND` | 404 | Image ID does not exist | Verify image ID is correct |
| `VARIANT_NOT_FOUND` | 404 | Requested variant does not exist | Use valid variant: thumbnail, medium, or full |
| `STORAGE_ERROR` | 500 | Failed to retrieve image | Try again or contact support |

### Deletion Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `UNAUTHORIZED` | 401 | Admin authentication required | Provide valid admin authentication token |
| `NOT_FOUND` | 404 | Image does not exist | Verify image ID is correct |
| `DELETION_ERROR` | 500 | Failed to delete image | Try again or contact support |

### Reordering Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `VALIDATION_ERROR` | 400 | Invalid image IDs or missing images | Provide all image IDs for the business idea |
| `UNAUTHORIZED` | 401 | Admin authentication required | Provide valid admin authentication token |
| `NOT_FOUND` | 404 | Business idea does not exist | Verify business idea ID is correct |
| `UPDATE_ERROR` | 500 | Failed to update image order | Try again or contact support |

---

## Storage Configuration

The system supports two storage backends:

### Local Filesystem Storage

**Configuration:**
```env
STORAGE_TYPE=local
UPLOAD_DIR=./public/uploads
```

**Directory Structure:**
```
public/uploads/
├── business-ideas/
│   └── {businessIdeaId}/
│       └── {imageId}/
│           ├── full.jpg
│           ├── medium.webp
│           └── thumbnail.webp
└── temp/
    └── {imageId}/
        ├── full.jpg
        ├── medium.webp
        └── thumbnail.webp
```

**Use Cases:**
- Development environments
- Small deployments
- Self-hosted solutions

### Cloud Storage (S3-Compatible)

**Configuration:**
```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com  # Optional
```

**Use Cases:**
- Production deployments
- Scalable storage
- CDN integration
- Multi-region deployments

---

## Security Features

### File Validation

1. **MIME Type Validation:** Checks Content-Type header
2. **Magic Bytes Validation:** Verifies file signature to prevent spoofing
3. **Extension Validation:** Validates file extension matches content
4. **Size Validation:** Enforces 5MB maximum file size

### Access Control

1. **Upload Protection:** Admin authentication required
2. **Public Read Access:** Images are publicly accessible once uploaded
3. **Deletion Protection:** Admin authentication required
4. **Reordering Protection:** Admin authentication required

### Security Best Practices

1. **Unique IDs:** Uses cuid for unpredictable image identifiers
2. **No Sequential IDs:** Prevents enumeration attacks
3. **Metadata Stripping:** Removes EXIF data for privacy
4. **Filename Sanitization:** Never uses original filenames in storage paths
5. **Path Traversal Prevention:** Validates all file paths

---

## Performance Optimization

### Image Optimization

- **Format Conversion:** Converts to WebP for better compression
- **Quality Optimization:** Balances quality and file size
- **Dimension Optimization:** Generates appropriate sizes for different contexts
- **Metadata Removal:** Strips unnecessary EXIF data

### Caching Strategy

- **Long-term Caching:** 1-year cache headers for immutable images
- **Browser Caching:** Reduces server requests
- **CDN Integration:** Recommended for production deployments
- **ETag Support:** Enables conditional requests

### Lazy Loading

- Use Next.js Image component with lazy loading
- Load thumbnails first, full images on demand
- Implement progressive image loading

---

## Testing

### Run All Image Upload Tests

```bash
npm test -- __tests__/api-upload.test.ts
npm test -- __tests__/api-images-serve.test.ts
npm test -- __tests__/api-business-ideas-reorder.test.ts
npm test -- __tests__/image-validation.test.ts
npm test -- __tests__/image-processing.test.ts
npm test -- __tests__/image-upload-components.test.tsx
```

### Run Specific Test Suites

Upload endpoint tests:
```bash
npm test -- __tests__/api-upload.test.ts
```

Image serving tests:
```bash
npm test -- __tests__/api-images-serve.test.ts
```

Image reordering tests:
```bash
npm test -- __tests__/api-business-ideas-reorder.test.ts
```

Image validation tests:
```bash
npm test -- __tests__/image-validation.test.ts
```

Image processing tests:
```bash
npm test -- __tests__/image-processing.test.ts
```

Component tests:
```bash
npm test -- __tests__/image-upload-components.test.tsx
```

---

## Cleanup Utilities

### Orphaned Images Cleanup

Remove images not associated with any business idea (older than 24 hours):

```bash
npx tsx scripts/cleanup-orphaned-images.ts
```

### Temp Images Cleanup

Remove temporary images from incomplete uploads (older than 24 hours):

```bash
npx tsx scripts/cleanup-temp-images.ts
```

### General Cleanup

Run all cleanup operations:

```bash
npx tsx scripts/cleanup-images.ts
```

**Recommended Schedule:**
- Run cleanup scripts daily via cron job
- Monitor storage usage
- Review cleanup logs regularly

---

## Migration Guide

### Migrating from URL-Based Images

If you have existing business ideas with URL-based images, use the migration script:

```bash
npx tsx scripts/migrate-url-images.ts
```

**Migration Process:**

1. Downloads images from existing URLs
2. Uploads to new storage system
3. Generates optimized variants
4. Creates Image records in database
5. Updates BusinessIdea references
6. Handles errors gracefully

**Rollback:**

Keep the old `images` field temporarily for backward compatibility during migration.

---

## Support

For issues or questions:

1. Check error codes and resolutions in this documentation
2. Review test files for usage examples
3. Check storage configuration and environment variables
4. Review application logs for detailed error messages
5. Contact system administrator for production issues

---

## Related Documentation

- [Authentication API](../src/app/api/auth/README.md)
- [Environment Configuration](./ENVIRONMENT_CONFIGURATION.md)
- [Image Processing Library](../src/lib/image/README.md)
- [Storage Providers](../src/lib/storage/README.md)
- [Admin Components](../src/components/admin/README.md)
