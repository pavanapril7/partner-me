# Design Document: Business Idea Image Upload

## Overview

The Business Idea Image Upload feature enables administrators to upload images directly from their computers when creating or editing business ideas, replacing the current URL-based approach. The system handles file uploads, validates and optimizes images, stores them securely, and serves them efficiently to users. The design supports both local filesystem storage (for development) and cloud storage (for production), with a clean abstraction layer for easy switching between storage backends.

## Architecture

The feature follows a layered architecture with clear separation of concerns:

1. **Presentation Layer**: React components for file upload UI
   - File upload input with drag-and-drop support
   - Image preview thumbnails with reordering
   - Upload progress indicators
   - Image management (add, remove, reorder)

2. **API Layer**: Next.js API routes for upload handling
   - POST /api/upload - Handle file uploads
   - GET /api/images/[id] - Serve images
   - DELETE /api/images/[id] - Delete images

3. **Storage Layer**: Abstracted storage interface
   - Local filesystem storage implementation
   - Cloud storage (S3-compatible) implementation
   - Storage factory for selecting backend

4. **Processing Layer**: Image optimization and validation
   - File type validation
   - File size validation
   - Image optimization and resizing
   - Multiple size generation (thumbnail, medium, full)

5. **Data Layer**: Prisma models for image metadata
   - Image model with references to business ideas
   - Cascade deletion support

## Components and Interfaces

### Data Models

#### Image
```typescript
interface Image {
  id: string // Unique, unpredictable identifier (cuid)
  businessIdeaId: string
  filename: string // Original filename
  storagePath: string // Path in storage system
  mimeType: string // e.g., 'image/jpeg'
  size: number // File size in bytes
  width: number // Original width in pixels
  height: number // Original height in pixels
  order: number // Display order (0-based)
  createdAt: Date
  updatedAt: Date
}
```

#### ImageVariant
```typescript
interface ImageVariant {
  id: string
  imageId: string
  variant: 'thumbnail' | 'medium' | 'full'
  storagePath: string
  width: number
  height: number
  size: number
}
```

### Storage Interface

```typescript
interface StorageProvider {
  // Upload a file and return storage path
  upload(file: Buffer, path: string, mimeType: string): Promise<string>
  
  // Delete a file
  delete(path: string): Promise<void>
  
  // Get a file URL (for cloud storage) or path (for local)
  getUrl(path: string): string
  
  // Check if a file exists
  exists(path: string): Promise<boolean>
}
```

### API Interfaces

#### POST /api/upload
Request (multipart/form-data):
```typescript
{
  file: File // Image file
  businessIdeaId?: string // Optional, for associating with existing business idea
}
```

Response:
```typescript
{
  success: boolean
  data: {
    id: string
    url: string // URL to access the image
    thumbnail: string // URL to thumbnail
    medium: string // URL to medium size
    filename: string
    size: number
    width: number
    height: number
  }
}
```

#### GET /api/images/[id]
Query Parameters:
```typescript
{
  variant?: 'thumbnail' | 'medium' | 'full' // Default: 'full'
}
```

Response: Image file with appropriate headers

#### DELETE /api/images/[id]
Response:
```typescript
{
  success: boolean
}
```

#### PATCH /api/business-ideas/[id]/images/reorder
Request:
```typescript
{
  imageIds: string[] // Array of image IDs in desired order
}
```

Response:
```typescript
{
  success: boolean
}
```

### React Components

#### ImageUploadInput
- File input with drag-and-drop zone
- Multiple file selection support
- File type and size validation
- Upload progress display
- Props: `onUpload`, `maxFiles`, `maxSize`, `accept`

#### ImagePreviewList
- Display uploaded images as thumbnails
- Drag-and-drop reordering
- Delete button for each image
- Primary image indicator (first in list)
- Props: `images`, `onReorder`, `onDelete`, `onSetPrimary`

#### ImageUploadProgress
- Individual progress bar for each uploading file
- Success/error indicators
- Retry button for failed uploads
- Props: `uploads`, `onRetry`, `onCancel`

#### UpdatedAdminBusinessIdeaForm
- Integrate ImageUploadInput component
- Replace URL input with file upload
- Manage uploaded images state
- Handle image reordering and deletion
- Submit image IDs with business idea data

## Data Models

### Prisma Schema Updates

```prisma
model Image {
  id             String   @id @default(cuid())
  businessIdeaId String?
  filename       String
  storagePath    String   @unique
  mimeType       String
  size           Int
  width          Int
  height         Int
  order          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  businessIdea   BusinessIdea? @relation(fields: [businessIdeaId], references: [id], onDelete: Cascade)
  variants       ImageVariant[]
  
  @@index([businessIdeaId, order])
  @@map("images")
}

model ImageVariant {
  id          String   @id @default(cuid())
  imageId     String
  variant     ImageVariantType
  storagePath String   @unique
  width       Int
  height      Int
  size        Int
  createdAt   DateTime @default(now())
  
  image       Image @relation(fields: [imageId], references: [id], onDelete: Cascade)
  
  @@unique([imageId, variant])
  @@map("image_variants")
}

enum ImageVariantType {
  THUMBNAIL
  MEDIUM
  FULL
}

// Update BusinessIdea model
model BusinessIdea {
  // ... existing fields ...
  images      Image[]
  // Remove: images String[] (old URL array)
}
```

## Image Processing

### Validation Rules

1. **File Type Validation**
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
   - Validate both MIME type and file signature (magic bytes)

2. **File Size Validation**
   - Maximum file size: 5MB (5,242,880 bytes)
   - Check before processing to avoid memory issues

3. **Image Dimension Validation**
   - Minimum dimensions: 200x200 pixels
   - Maximum dimensions: 4096x4096 pixels

### Image Optimization

Use **sharp** library for image processing:

1. **Thumbnail Generation**
   - Size: 300x300 pixels (cover, maintaining aspect ratio)
   - Quality: 80%
   - Format: WebP (with JPEG fallback)

2. **Medium Size Generation**
   - Size: 800x800 pixels (contain, maintaining aspect ratio)
   - Quality: 85%
   - Format: WebP (with JPEG fallback)

3. **Full Size Optimization**
   - Max dimensions: 1920x1920 pixels
   - Quality: 90%
   - Format: Original or WebP
   - Strip metadata (EXIF) for privacy and size reduction

### Storage Organization

```
uploads/
  business-ideas/
    {businessIdeaId}/
      {imageId}/
        full.{ext}
        medium.webp
        thumbnail.webp
```

For images not yet associated with a business idea (during creation):
```
uploads/
  temp/
    {imageId}/
      full.{ext}
      medium.webp
      thumbnail.webp
```

When business idea is created, move from temp to business-ideas directory.

## Storage Implementations

### Local Filesystem Storage

```typescript
class LocalStorageProvider implements StorageProvider {
  private baseDir: string // e.g., './public/uploads'
  
  async upload(file: Buffer, path: string, mimeType: string): Promise<string> {
    // Write file to baseDir + path
    // Return relative path
  }
  
  async delete(path: string): Promise<void> {
    // Delete file from baseDir + path
  }
  
  getUrl(path: string): string {
    // Return /uploads/... URL
  }
  
  async exists(path: string): Promise<boolean> {
    // Check if file exists
  }
}
```

### Cloud Storage (S3-Compatible)

```typescript
class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client
  private bucket: string
  
  async upload(file: Buffer, path: string, mimeType: string): Promise<string> {
    // Upload to S3 bucket
    // Return S3 key
  }
  
  async delete(path: string): Promise<void> {
    // Delete from S3
  }
  
  getUrl(path: string): string {
    // Return CloudFront or S3 URL
  }
  
  async exists(path: string): Promise<boolean> {
    // Check if object exists in S3
  }
}
```

### Storage Factory

```typescript
function createStorageProvider(): StorageProvider {
  const storageType = process.env.STORAGE_TYPE || 'local'
  
  if (storageType === 's3') {
    return new S3StorageProvider({
      bucket: process.env.S3_BUCKET!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    })
  }
  
  return new LocalStorageProvider({
    baseDir: process.env.UPLOAD_DIR || './public/uploads'
  })
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid image files are accepted
*For any* file with a valid image MIME type (JPEG, PNG, WebP, GIF) and size under 5MB, the upload system should accept and process it successfully.
**Validates: Requirements 4.2, 4.5**

### Property 2: Invalid file types are rejected
*For any* file that is not an image or has an unsupported format, the upload system should reject it with an appropriate error message.
**Validates: Requirements 4.3**

### Property 3: Oversized files are rejected
*For any* file exceeding 5MB, the upload system should reject it with an appropriate error message.
**Validates: Requirements 4.4, 4.5**

### Property 4: All image variants are generated
*For any* successfully uploaded image, the system should generate and store thumbnail, medium, and full-size variants.
**Validates: Requirements 5.3, 5.4**

### Property 5: Image order is preserved
*For any* set of images with assigned order values, retrieving them should return them in the same order.
**Validates: Requirements 6.3**

### Property 6: Reordering updates persist
*For any* reordering operation on a set of images, the new order should be saved and retrievable.
**Validates: Requirements 6.2, 6.3**

### Property 7: Primary image is first in order
*For any* business idea with multiple images, the image with order value 0 should be used as the primary image.
**Validates: Requirements 6.4**

### Property 8: Unique filenames prevent collisions
*For any* two uploaded images, even with the same original filename, the system should generate unique storage paths.
**Validates: Requirements 7.2**

### Property 9: Image metadata is stored completely
*For any* uploaded image, the system should store all required metadata: filename, size, dimensions, MIME type, and upload timestamp.
**Validates: Requirements 7.4**

### Property 10: Cascade deletion removes all image files
*For any* business idea deletion, all associated image files (including all variants) should be deleted from storage.
**Validates: Requirements 7.5**

### Property 11: Appropriate image variant is served
*For any* image request with a specified variant (thumbnail, medium, full), the system should serve the correct variant.
**Validates: Requirements 5.5, 8.1, 8.2**

### Property 12: Cache headers are set correctly
*For any* image served, the response should include appropriate cache-control headers.
**Validates: Requirements 8.3**

### Property 13: Missing images return 404
*For any* request for a non-existent image ID, the system should return a 404 response.
**Validates: Requirements 12.5**

### Property 14: Placeholder displays on load failure
*For any* image that fails to load in the UI, a placeholder image should be displayed.
**Validates: Requirements 8.4**

### Property 15: Upload progress is tracked
*For any* image upload in progress, the system should report progress percentage.
**Validates: Requirements 9.1, 9.2**

### Property 16: Upload completion is indicated
*For any* completed image upload, the system should display a success indicator.
**Validates: Requirements 9.3**

### Property 17: Upload failures are reported
*For any* failed image upload, the system should display an error message with the failure reason.
**Validates: Requirements 9.4**

### Property 18: Storage backend is configurable
*For any* valid storage configuration (local or S3), the system should use the configured backend for all storage operations.
**Validates: Requirements 10.1, 10.4, 10.5, 10.6**

### Property 19: Image deletion removes from storage
*For any* image deletion operation, the image file and all its variants should be removed from storage.
**Validates: Requirements 11.3**

### Property 20: Image IDs are unpredictable
*For any* two uploaded images, their IDs should not reveal a predictable pattern or sequence.
**Validates: Requirements 12.1, 12.3**

### Property 21: Image URLs use unique identifiers
*For any* served image, the URL should contain the unique image ID rather than sequential or predictable values.
**Validates: Requirements 12.2**

### Property 22: Image existence is verified before serving
*For any* image request, the system should verify the image exists before attempting to serve it.
**Validates: Requirements 12.4**

## Error Handling

### Upload Errors

1. **Invalid File Type** (400)
   - When file is not an image or unsupported format
   - Return: `{ code: 'INVALID_FILE_TYPE', message: 'Only JPEG, PNG, WebP, and GIF images are supported' }`

2. **File Too Large** (413)
   - When file exceeds 5MB limit
   - Return: `{ code: 'FILE_TOO_LARGE', message: 'Image must be smaller than 5MB' }`

3. **Invalid Dimensions** (400)
   - When image dimensions are outside acceptable range
   - Return: `{ code: 'INVALID_DIMENSIONS', message: 'Image dimensions must be between 200x200 and 4096x4096 pixels' }`

4. **Processing Error** (500)
   - When image processing fails
   - Return: `{ code: 'PROCESSING_ERROR', message: 'Failed to process image' }`

5. **Storage Error** (500)
   - When storage operation fails
   - Return: `{ code: 'STORAGE_ERROR', message: 'Failed to store image' }`

### Retrieval Errors

1. **Image Not Found** (404)
   - When requested image ID doesn't exist
   - Return: `{ code: 'NOT_FOUND', message: 'Image not found' }`

2. **Variant Not Found** (404)
   - When requested variant doesn't exist
   - Return: `{ code: 'VARIANT_NOT_FOUND', message: 'Image variant not found' }`

### Client-Side Error Handling

- Display inline error messages for upload failures
- Show toast notifications for successful uploads
- Implement retry mechanism for failed uploads
- Display placeholder images when loading fails
- Validate files client-side before upload (early feedback)

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

1. **Storage Provider Tests**
   - Test local storage upload, delete, exists operations
   - Test S3 storage upload, delete, exists operations
   - Test storage factory selects correct provider

2. **Image Processing Tests**
   - Test file type validation with valid and invalid files
   - Test file size validation
   - Test image optimization and variant generation
   - Test metadata extraction

3. **API Route Tests**
   - Test successful upload with valid image
   - Test upload rejection with invalid file
   - Test image retrieval with different variants
   - Test image deletion
   - Test reordering endpoint

4. **Component Tests**
   - Test ImageUploadInput accepts files
   - Test ImagePreviewList displays and reorders images
   - Test upload progress display
   - Test error message display

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library. Each test will run a minimum of 100 iterations.

1. **Property 1: Valid image files are accepted**
   - Generate random valid image files (within size/type constraints)
   - Verify all are accepted and processed
   - Tag: **Feature: business-idea-image-upload, Property 1: Valid image files are accepted**

2. **Property 2: Invalid file types are rejected**
   - Generate random non-image files
   - Verify all are rejected with appropriate errors
   - Tag: **Feature: business-idea-image-upload, Property 2: Invalid file types are rejected**

3. **Property 3: Oversized files are rejected**
   - Generate files exceeding 5MB limit
   - Verify all are rejected with appropriate errors
   - Tag: **Feature: business-idea-image-upload, Property 3: Oversized files are rejected**

4. **Property 4: All image variants are generated**
   - Generate random valid images
   - Verify thumbnail, medium, and full variants are created
   - Tag: **Feature: business-idea-image-upload, Property 4: All image variants are generated**

5. **Property 5: Image order is preserved**
   - Generate random sets of images with order values
   - Verify retrieval maintains order
   - Tag: **Feature: business-idea-image-upload, Property 5: Image order is preserved**

6. **Property 6: Reordering updates persist**
   - Generate random image sets and reorder operations
   - Verify new order is saved and retrievable
   - Tag: **Feature: business-idea-image-upload, Property 6: Reordering updates persist**

7. **Property 7: Primary image is first in order**
   - Generate random business ideas with multiple images
   - Verify image with order 0 is used as primary
   - Tag: **Feature: business-idea-image-upload, Property 7: Primary image is first in order**

8. **Property 8: Unique filenames prevent collisions**
   - Upload multiple images with same original filename
   - Verify all have unique storage paths
   - Tag: **Feature: business-idea-image-upload, Property 8: Unique filenames prevent collisions**

9. **Property 9: Image metadata is stored completely**
   - Generate random images
   - Verify all metadata fields are stored
   - Tag: **Feature: business-idea-image-upload, Property 9: Image metadata is stored completely**

10. **Property 10: Cascade deletion removes all image files**
    - Create business ideas with images
    - Delete business ideas and verify all image files are removed
    - Tag: **Feature: business-idea-image-upload, Property 10: Cascade deletion removes all image files**

11. **Property 11: Appropriate image variant is served**
    - Request images with different variant parameters
    - Verify correct variant is served each time
    - Tag: **Feature: business-idea-image-upload, Property 11: Appropriate image variant is served**

12. **Property 12: Cache headers are set correctly**
    - Request random images
    - Verify all responses include cache-control headers
    - Tag: **Feature: business-idea-image-upload, Property 12: Cache headers are set correctly**

13. **Property 13: Missing images return 404**
    - Request non-existent image IDs
    - Verify all return 404 responses
    - Tag: **Feature: business-idea-image-upload, Property 13: Missing images return 404**

14. **Property 15: Upload progress is tracked**
    - Upload random images
    - Verify progress is reported during upload
    - Tag: **Feature: business-idea-image-upload, Property 15: Upload progress is tracked**

15. **Property 17: Upload failures are reported**
    - Simulate upload failures
    - Verify error messages are displayed
    - Tag: **Feature: business-idea-image-upload, Property 17: Upload failures are reported**

16. **Property 18: Storage backend is configurable**
    - Test with different storage configurations
    - Verify correct backend is used
    - Tag: **Feature: business-idea-image-upload, Property 18: Storage backend is configurable**

17. **Property 19: Image deletion removes from storage**
    - Delete random images
    - Verify files are removed from storage
    - Tag: **Feature: business-idea-image-upload, Property 19: Image deletion removes from storage**

18. **Property 20: Image IDs are unpredictable**
    - Generate multiple images
    - Verify IDs don't follow predictable pattern
    - Tag: **Feature: business-idea-image-upload, Property 20: Image IDs are unpredictable**

19. **Property 21: Image URLs use unique identifiers**
    - Generate random images
    - Verify URLs contain unique IDs
    - Tag: **Feature: business-idea-image-upload, Property 21: Image URLs use unique identifiers**

20. **Property 22: Image existence is verified before serving**
    - Request images (existing and non-existing)
    - Verify existence check occurs before serving
    - Tag: **Feature: business-idea-image-upload, Property 22: Image existence is verified before serving**

### Integration Testing

- Test complete upload flow from UI to storage
- Test image serving with actual HTTP requests
- Test cascade deletion with database and storage
- Test storage provider switching

## Implementation Notes

### Required Dependencies

Add the following packages:

```json
{
  "dependencies": {
    "sharp": "^0.33.0", // Image processing
    "@aws-sdk/client-s3": "^3.0.0", // S3 storage (optional)
    "multer": "^1.4.5-lts.1" // File upload handling
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

### Environment Variables

```env
# Storage configuration
STORAGE_TYPE=local # or 's3'
UPLOAD_DIR=./public/uploads # for local storage

# S3 configuration (if using S3)
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com # optional, for S3-compatible services

# Image processing
MAX_IMAGE_SIZE=5242880 # 5MB in bytes
IMAGE_QUALITY_THUMBNAIL=80
IMAGE_QUALITY_MEDIUM=85
IMAGE_QUALITY_FULL=90
```

### Next.js Configuration Updates

Update `next.config.ts` to handle uploaded images:

```typescript
const nextConfig: NextConfig = {
  images: {
    domains: ['www.theshopindia.com', 'content.jdmagicbox.com'],
    // Add local uploads path
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // for S3
      },
    ],
  },
  // Increase body size limit for uploads
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
}
```

### File Upload Handling

Use Next.js API routes with custom body parser:

```typescript
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for multipart/form-data
  },
}
```

Use `multer` or `formidable` for parsing multipart form data in API routes.

### Security Considerations

1. **File Type Validation**
   - Validate MIME type from headers
   - Validate file signature (magic bytes) to prevent spoofing
   - Use allowlist approach (only accept known safe types)

2. **File Size Limits**
   - Enforce at multiple levels: client, API route, storage
   - Prevent DoS attacks with large uploads

3. **Filename Sanitization**
   - Never use original filename directly in storage path
   - Generate unique, unpredictable IDs (cuid)
   - Prevent path traversal attacks

4. **Access Control**
   - Protect upload endpoint with admin authentication
   - Public read access for serving images
   - Verify business idea ownership before associating images

5. **Rate Limiting**
   - Limit number of uploads per user/session
   - Prevent abuse and resource exhaustion

### Performance Considerations

1. **Async Processing**
   - Process image variants asynchronously
   - Return response immediately after upload
   - Generate variants in background

2. **Caching**
   - Set long cache headers for images (immutable)
   - Use CDN for serving images in production
   - Implement browser caching

3. **Lazy Loading**
   - Use Next.js Image component with lazy loading
   - Load thumbnails first, full images on demand

4. **Cleanup**
   - Implement periodic cleanup of orphaned images
   - Remove temp images after business idea creation
   - Delete old images when business ideas are deleted

### Migration Strategy

1. **Database Migration**
   - Add Image and ImageVariant models
   - Keep existing `images` array field temporarily
   - Add migration script to convert URL-based images

2. **Backward Compatibility**
   - Support both URL-based and uploaded images during transition
   - Display component checks for image type (URL vs uploaded)
   - Gradually migrate existing business ideas

3. **Data Migration Script**
   - Download images from existing URLs
   - Upload to new storage system
   - Create Image records
   - Update BusinessIdea references

### UI/UX Considerations

1. **Drag-and-Drop**
   - Implement drag-and-drop zone for file selection
   - Visual feedback during drag-over
   - Support both click and drag-and-drop

2. **Progress Indication**
   - Show progress bar for each uploading file
   - Display file name and size
   - Show success/error state after completion

3. **Image Preview**
   - Display thumbnails immediately after selection
   - Show image dimensions and file size
   - Allow removal before upload

4. **Reordering**
   - Drag-and-drop to reorder images
   - Visual indicator for primary image
   - Save order automatically or on form submit

5. **Error Handling**
   - Clear error messages for validation failures
   - Retry button for failed uploads
   - Prevent form submission if uploads are in progress

6. **Mobile Support**
   - Support mobile file selection
   - Responsive image preview grid
   - Touch-friendly reordering

