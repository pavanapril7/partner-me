# Image Processing and Validation

This module provides utilities for validating and processing images for the Business Idea Image Upload feature.

## Features

### Validation
- **File Type Validation**: Validates MIME type and file extension
- **Magic Bytes Validation**: Checks file signature to prevent type spoofing
- **File Size Validation**: Enforces 5MB maximum file size
- **Dimension Validation**: Ensures images are within acceptable size ranges (200x200 to 4096x4096)

### Processing
- **Image Optimization**: Reduces file size while maintaining quality
- **Variant Generation**: Creates thumbnail, medium, and full-size variants
- **Metadata Stripping**: Removes EXIF data for privacy and size reduction
- **Format Conversion**: Converts images to WebP for better compression

## Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

## Usage

### Validating an Image

```typescript
import { validateImage } from '@/lib/image';

const result = await validateImage(buffer, mimeType, filename);

if (result.valid) {
  console.log('Image is valid:', result.metadata);
} else {
  console.error('Validation failed:', result.error);
}
```

### Processing an Image

```typescript
import { processImage } from '@/lib/image';

const processed = await processImage(buffer);

// Access variants
const thumbnail = processed.thumbnail; // 300x300, 80% quality
const medium = processed.medium;       // 800x800, 85% quality
const full = processed.full;           // 1920x1920, 90% quality
```

### Individual Variant Generation

```typescript
import { generateThumbnail, generateMedium, generateFull } from '@/lib/image';

const thumbnail = await generateThumbnail(buffer);
const medium = await generateMedium(buffer);
const full = await generateFull(buffer);
```

## Configuration

Image processing settings can be configured via environment variables:

```env
MAX_IMAGE_SIZE=5242880              # 5MB in bytes
IMAGE_QUALITY_THUMBNAIL=80          # 0-100
IMAGE_QUALITY_MEDIUM=85             # 0-100
IMAGE_QUALITY_FULL=90               # 0-100
```

## Variant Specifications

### Thumbnail
- Size: 300x300 pixels
- Fit: Cover (crops to fill dimensions)
- Quality: 80%
- Format: WebP

### Medium
- Size: 800x800 pixels
- Fit: Contain (fits within dimensions, maintains aspect ratio)
- Quality: 85%
- Format: WebP

### Full
- Size: 1920x1920 pixels (max)
- Fit: Inside (scales down if larger, maintains aspect ratio)
- Quality: 90%
- Format: WebP

## Error Handling

All validation and processing functions return detailed error messages:

- `Unsupported file type`
- `File size exceeds maximum limit`
- `Image dimensions must be at least 200x200 pixels`
- `Image dimensions must not exceed 4096x4096 pixels`
- `File signature does not match declared MIME type`
- `Invalid image file`

## Requirements Coverage

This module implements the following requirements:

- **4.1**: File type validation (MIME type and magic bytes)
- **4.2**: Accept valid image formats
- **4.3**: Reject invalid file types
- **4.4**: File size validation (5MB limit)
- **4.5**: Reject oversized files
- **5.1**: Image optimization for web delivery
- **5.3**: Generate multiple image sizes
- **5.4**: Strip EXIF metadata
