# Implementation Plan: Business Idea Image Upload

- [x] 1. Install required dependencies and configure environment
  - Install sharp for image processing
  - Install multer for file upload handling
  - Install @aws-sdk/client-s3 for cloud storage support
  - Add environment variables for storage configuration
  - Update Next.js config for larger body size limit
  - _Requirements: 10.6_

- [x] 2. Create database models and migrations
  - Create Prisma schema for Image model with metadata fields
  - Create Prisma schema for ImageVariant model
  - Add ImageVariantType enum (THUMBNAIL, MEDIUM, FULL)
  - Update BusinessIdea model to add Image relation
  - Generate and run database migration
  - _Requirements: 7.1, 7.2, 7.4, 5.4_

- [ ]* 2.1 Write property test for image metadata storage
  - **Property 9: Image metadata is stored completely**
  - **Validates: Requirements 7.4**

- [ ]* 2.2 Write property test for unique image IDs
  - **Property 8: Unique filenames prevent collisions**
  - **Property 20: Image IDs are unpredictable**
  - **Validates: Requirements 7.2, 12.1, 12.3**

- [x] 3. Implement storage abstraction layer
- [x] 3.1 Create StorageProvider interface
  - Define interface with upload, delete, getUrl, exists methods
  - _Requirements: 10.1_

- [x] 3.2 Implement LocalStorageProvider
  - Implement file system operations for local storage
  - Create directory structure for uploads
  - Handle file writing and deletion
  - Generate URLs for local files
  - _Requirements: 10.2, 10.4_

- [ ]* 3.3 Write property test for local storage operations
  - **Property 18: Storage backend is configurable**
  - **Validates: Requirements 10.1, 10.4, 10.6**

- [x] 3.4 Implement S3StorageProvider
  - Implement S3 client operations
  - Handle S3 upload and deletion
  - Generate S3 URLs
  - _Requirements: 10.3, 10.5_

- [ ]* 3.5 Write property test for S3 storage operations
  - **Property 18: Storage backend is configurable**
  - **Validates: Requirements 10.3, 10.5, 10.6**

- [x] 3.6 Create storage factory
  - Implement factory function to select storage provider based on env vars
  - _Requirements: 10.6_

- [ ]* 3.7 Write unit tests for storage abstraction
  - Test storage factory selects correct provider
  - Test local storage CRUD operations
  - Test S3 storage CRUD operations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4. Implement image processing and validation
- [x] 4.1 Create image validation utilities
  - Implement file type validation (MIME type and magic bytes)
  - Implement file size validation (5MB limit)
  - Implement dimension validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.2 Write property test for file type validation
  - **Property 1: Valid image files are accepted**
  - **Property 2: Invalid file types are rejected**
  - **Validates: Requirements 4.2, 4.3**

- [ ]* 4.3 Write property test for file size validation
  - **Property 3: Oversized files are rejected**
  - **Validates: Requirements 4.4, 4.5**

- [x] 4.4 Create image processing utilities with sharp
  - Implement thumbnail generation (300x300, 80% quality)
  - Implement medium size generation (800x800, 85% quality)
  - Implement full size optimization (1920x1920, 90% quality)
  - Strip EXIF metadata
  - _Requirements: 5.1, 5.3, 5.4_

- [ ]* 4.5 Write property test for image variant generation
  - **Property 4: All image variants are generated**
  - **Validates: Requirements 5.3, 5.4**

- [ ]* 4.6 Write unit tests for image processing
  - Test thumbnail generation with sample images
  - Test medium size generation
  - Test full size optimization
  - Test metadata stripping
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 5. Implement image upload API endpoint
- [x] 5.1 Create POST /api/upload route
  - Configure multer for multipart form data parsing
  - Validate uploaded file (type, size, dimensions)
  - Process image and generate variants
  - Store image and variants using storage provider
  - Create Image and ImageVariant records in database
  - Return image metadata and URLs
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 7.1, 7.2, 7.4_

- [ ]* 5.2 Write property test for upload acceptance
  - **Property 1: Valid image files are accepted**
  - **Validates: Requirements 1.3, 4.2**

- [ ]* 5.3 Write property test for upload rejection
  - **Property 2: Invalid file types are rejected**
  - **Property 3: Oversized files are rejected**
  - **Validates: Requirements 4.3, 4.4, 4.5**

- [ ]* 5.4 Write unit tests for upload endpoint
  - Test successful upload with valid image
  - Test rejection of invalid file types
  - Test rejection of oversized files
  - Test error handling for processing failures
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement image serving API endpoint
i,- [x] 6.1 Create GET /api/images/[id] route
  - Parse image ID and variant from request
  - Verify image exists in database
  - Retrieve appropriate variant from storage
  - Set cache headers for browser caching
  - Set content-type headers
  - Serve image file
  - Return 404 for non-existent images
  - _Requirements: 5.5, 8.1, 8.2, 8.3, 8.5, 12.2, 12.4, 12.5_

- [ ]* 6.2 Write property test for variant serving
  - **Property 11: Appropriate image variant is served**
  - **Validates: Requirements 5.5, 8.1, 8.2**

- [ ]* 6.3 Write property test for cache headers
  - **Property 12: Cache headers are set correctly**
  - **Validates: Requirements 8.3**

- [ ]* 6.4 Write property test for missing images
  - **Property 13: Missing images return 404**
  - **Property 22: Image existence is verified before serving**
  - **Validates: Requirements 12.4, 12.5**

- [ ]* 6.5 Write unit tests for image serving endpoint
  - Test serving different variants
  - Test cache headers
  - Test content-type headers
  - Test 404 for non-existent images
  - _Requirements: 5.5, 8.1, 8.2, 8.3, 8.5, 12.4, 12.5_

- [x] 7. Implement image deletion API endpoint
- [x] 7.1 Create DELETE /api/images/[id] route
  - Verify image exists
  - Delete image and all variants from storage
  - Delete Image and ImageVariant records from database
  - Protect with admin authentication
  - _Requirements: 11.3_

- [ ]* 7.2 Write property test for image deletion
  - **Property 19: Image deletion removes from storage**
  - **Validates: Requirements 11.3**

- [ ]* 7.3 Write unit tests for deletion endpoint
  - Test successful deletion
  - Test 404 for non-existent images
  - Test authentication protection
  - _Requirements: 11.3_

- [x] 8. Implement image reordering API endpoint
- [x] 8.1 Create PATCH /api/business-ideas/[id]/images/reorder route
  - Validate image IDs belong to business idea
  - Update order field for each image
  - Protect with admin authentication
  - _Requirements: 6.2, 6.3_

- [ ]* 8.2 Write property test for image reordering
  - **Property 5: Image order is preserved**
  - **Property 6: Reordering updates persist**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 8.3 Write unit tests for reordering endpoint
  - Test successful reordering
  - Test validation of image IDs
  - Test authentication protection
  - _Requirements: 6.2, 6.3_

- [x] 9. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create image upload UI components
- [x] 10.1 Create ImageUploadInput component
  - Implement file input with drag-and-drop zone
  - Support multiple file selection
  - Client-side validation (file type, size)
  - Trigger upload on file selection
  - Display upload progress
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 9.1, 9.2_

- [ ]* 10.2 Write property test for multiple file uploads
  - **Property 15: Upload progress is tracked**
  - **Validates: Requirements 3.2, 9.1, 9.2**

- [ ]* 10.3 Write unit tests for ImageUploadInput
  - Test file input renders
  - Test drag-and-drop zone
  - Test multiple file selection
  - Test client-side validation
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 10.2 Create ImageUploadProgress component
  - Display progress bar for each uploading file
  - Show file name and size
  - Display success indicator on completion
  - Display error message on failure
  - Provide retry button for failed uploads
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 10.3 Write property test for upload progress display
  - **Property 16: Upload completion is indicated**
  - **Property 17: Upload failures are reported**
  - **Validates: Requirements 9.3, 9.4**

- [ ]* 10.4 Write unit tests for ImageUploadProgress
  - Test progress display
  - Test success indicator
  - Test error message display
  - Test retry functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.5 Create ImagePreviewList component
  - Display uploaded images as thumbnails
  - Implement drag-and-drop reordering
  - Show delete button for each image
  - Indicate primary image (first in list)
  - Handle reorder and delete actions
  - _Requirements: 1.4, 6.1, 6.2, 6.4, 11.1, 11.2_

- [ ]* 10.6 Write property test for image display
  - **Property 7: Primary image is first in order**
  - **Validates: Requirements 6.4**

- [ ]* 10.7 Write unit tests for ImagePreviewList
  - Test thumbnail display
  - Test drag-and-drop reordering
  - Test delete button functionality
  - Test primary image indicator
  - _Requirements: 1.4, 6.1, 11.1_

- [x] 11. Update AdminBusinessIdeaForm component
- [x] 11.1 Replace image URL input with ImageUploadInput
  - Remove URL input fields
  - Integrate ImageUploadInput component
  - Integrate ImagePreviewList component
  - Manage uploaded images state
  - Handle image upload, reorder, and delete
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 11.1, 11.2_

- [ ]* 11.2 Write property test for form image management
  - **Property 21: Image URLs use unique identifiers**
  - **Validates: Requirements 1.5, 12.2**

- [x] 11.3 Update form submission to include image IDs
  - Send array of image IDs instead of URLs
  - Handle image association with business idea
  - _Requirements: 1.5, 2.4_

- [x] 11.4 Display existing images in edit mode
  - Load existing images when editing
  - Display as thumbnails in ImagePreviewList
  - Allow adding new images
  - Allow removing existing images
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 11.5 Write unit tests for updated form
  - Test form renders with upload components
  - Test image upload integration
  - Test image reordering
  - Test image deletion
  - Test form submission with image IDs
  - Test edit mode pre-population
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 12. Update business idea display components
- [x] 12.1 Update BusinessIdeasList component
  - Use uploaded image URLs instead of URL array
  - Display thumbnail variant for list view
  - Add placeholder image for load failures
  - _Requirements: 8.1, 8.4_

- [ ]* 12.2 Write property test for placeholder display
  - **Property 14: Placeholder displays on load failure**
  - **Validates: Requirements 8.4**

- [x] 12.2 Update BusinessIdeaDetail component
  - Use uploaded image URLs instead of URL array
  - Display medium or full variant for detail view
  - Update image gallery/carousel
  - Add placeholder image for load failures
  - _Requirements: 8.2, 8.4_

- [ ]* 12.3 Write unit tests for updated display components
  - Test list displays thumbnail images
  - Test detail displays larger images
  - Test placeholder on load failure
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 13. Implement cascade deletion
- [x] 13.1 Update business idea deletion to remove images
  - Hook into business idea delete operation
  - Delete all associated images from storage
  - Rely on Prisma cascade delete for database records
  - _Requirements: 7.5_

- [ ]* 13.2 Write property test for cascade deletion
  - **Property 10: Cascade deletion removes all image files**
  - **Validates: Requirements 7.5**

- [ ]* 13.3 Write unit tests for cascade deletion
  - Test business idea deletion removes images
  - Test image files are deleted from storage
  - Test database records are cascade deleted
  - _Requirements: 7.5_

- [x] 14. Add confirmation dialogs
- [x] 14.1 Add confirmation for image deletion
  - Show confirmation dialog before deleting image
  - Proceed with deletion on confirmation
  - _Requirements: 11.4_

- [x] 14.2 Add confirmation for business idea deletion
  - Update existing confirmation to mention image deletion
  - _Requirements: 7.5_

- [ ]* 14.3 Write unit tests for confirmation dialogs
  - Test confirmation appears on delete
  - Test deletion proceeds on confirmation
  - Test deletion cancels on dismiss
  - _Requirements: 11.4_

- [x] 15. Checkpoint - Ensure all UI tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement image cleanup utilities
- [x] 16.1 Create cleanup script for orphaned images
  - Identify images not associated with any business idea
  - Delete orphaned images older than 24 hours
  - Log cleanup operations
  - _Requirements: 7.1_

- [x] 16.2 Create cleanup script for temp images
  - Identify temp images from incomplete business idea creation
  - Delete temp images older than 24 hours
  - _Requirements: 7.1_

- [ ]* 16.3 Write unit tests for cleanup utilities
  - Test orphaned image identification
  - Test temp image cleanup
  - Test age-based filtering
  - _Requirements: 7.1_

- [x] 17. Add error handling and user feedback
- [x] 17.1 Add error boundaries for image components
  - Wrap image upload components in error boundaries
  - Display user-friendly error messages
  - _Requirements: 4.3, 4.4, 9.4_

- [x] 17.2 Add toast notifications for upload operations
  - Success notification on upload completion
  - Error notification on upload failure
  - Success notification on deletion
  - _Requirements: 9.3, 9.4_

- [x] 17.3 Add loading states
  - Show loading indicator during upload
  - Show loading indicator during image serving
  - _Requirements: 9.1_

- [ ]* 17.4 Write unit tests for error handling
  - Test error boundaries catch errors
  - Test toast notifications display
  - Test loading states
  - _Requirements: 4.3, 4.4, 9.1, 9.3, 9.4_

- [x] 18. Update API documentation
  - Document new upload endpoint
  - Document image serving endpoint
  - Document deletion endpoint
  - Document reordering endpoint
  - Include request/response examples
  - Document error codes
  - _Requirements: All_

- [x] 19. Create migration script for existing data
- [x] 19.1 Create script to migrate URL-based images
  - Download images from existing URLs
  - Upload to new storage system
  - Create Image records in database
  - Update BusinessIdea references
  - Handle migration errors gracefully
  - _Requirements: 7.1, 7.2, 7.4_

- [ ]* 19.2 Write unit tests for migration script
  - Test URL download
  - Test image upload
  - Test database record creation
  - Test error handling
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Performance optimization
- [x] 21.1 Implement lazy loading for images
  - Use Next.js Image component with lazy loading
  - Load thumbnails first, full images on demand
  - _Requirements: 8.1, 8.2_

- [x] 21.2 Add image caching strategy
  - Configure long cache headers for immutable images
  - Implement browser caching
  - _Requirements: 8.3_

- [ ]* 21.3 Write unit tests for performance optimizations
  - Test lazy loading configuration
  - Test cache headers
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 22. Security hardening
- [x] 22.1 Implement rate limiting for uploads
  - Limit number of uploads per user/session
  - Prevent abuse and resource exhaustion
  - _Requirements: 1.3_

- [x] 22.2 Add file signature validation
  - Validate file magic bytes in addition to MIME type
  - Prevent file type spoofing
  - _Requirements: 4.1_

- [x] 22.3 Implement access control for uploads
  - Verify admin authentication for upload endpoint
  - Verify business idea ownership before associating images
  - _Requirements: 1.1, 2.1_

- [ ]* 22.4 Write unit tests for security features
  - Test rate limiting
  - Test file signature validation
  - Test access control
  - _Requirements: 1.1, 1.3, 2.1, 4.1_
