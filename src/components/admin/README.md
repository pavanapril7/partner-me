# Image Upload Components

This directory contains three new components for handling image uploads in the admin interface:

## Components

### 1. ImageUploadInput

A drag-and-drop file upload component with client-side validation.

**Features:**
- Drag-and-drop zone for file selection
- Multiple file selection support
- Client-side validation (file type, size)
- Visual feedback during drag operations
- Error messages for validation failures

**Usage:**
```tsx
import { ImageUploadInput } from '@/components/admin';

function MyForm() {
  const handleFilesSelected = (files: File[]) => {
    // Handle selected files
    console.log('Files selected:', files);
  };

  return (
    <ImageUploadInput
      onFilesSelected={handleFilesSelected}
      maxFiles={10}
      disabled={false}
    />
  );
}
```

**Props:**
- `onFilesSelected: (files: File[]) => void` - Callback when valid files are selected
- `maxFiles?: number` - Maximum number of files allowed (default: 10)
- `disabled?: boolean` - Disable the input (default: false)
- `accept?: string` - Accepted MIME types (default: image types)

---

### 2. ImageUploadProgress

Displays upload progress for multiple files with status indicators.

**Features:**
- Progress bar for each uploading file
- File name and size display
- Success indicator on completion
- Error message display on failure
- Retry button for failed uploads
- Cancel button for in-progress uploads

**Usage:**
```tsx
import { ImageUploadProgress, UploadProgress } from '@/components/admin';

function MyForm() {
  const [uploads, setUploads] = useState<UploadProgress[]>([
    {
      id: '1',
      fileName: 'image.jpg',
      fileSize: 1024000,
      status: 'uploading',
      progress: 50,
    },
  ]);

  const handleRetry = (id: string) => {
    // Retry failed upload
  };

  const handleCancel = (id: string) => {
    // Cancel upload
  };

  return (
    <ImageUploadProgress
      uploads={uploads}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}
```

**Props:**
- `uploads: UploadProgress[]` - Array of upload progress objects
- `onRetry?: (id: string) => void` - Callback to retry failed upload
- `onCancel?: (id: string) => void` - Callback to cancel upload

**UploadProgress Type:**
```typescript
interface UploadProgress {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}
```

---

### 3. ImagePreviewList

Displays uploaded images as thumbnails with drag-and-drop reordering.

**Features:**
- Grid layout of image thumbnails
- Drag-and-drop reordering
- Delete button for each image
- Primary image indicator (first in list)
- Hover effects and tooltips
- Read-only mode support

**Usage:**
```tsx
import { ImagePreviewList, UploadedImage } from '@/components/admin';

function MyForm() {
  const [images, setImages] = useState<UploadedImage[]>([
    {
      id: '1',
      url: '/api/images/1',
      thumbnailUrl: '/api/images/1?variant=thumbnail',
      filename: 'image1.jpg',
      order: 0,
    },
    {
      id: '2',
      url: '/api/images/2',
      thumbnailUrl: '/api/images/2?variant=thumbnail',
      filename: 'image2.jpg',
      order: 1,
    },
  ]);

  const handleReorder = (imageIds: string[]) => {
    // Update image order
    const reordered = imageIds.map((id, index) => {
      const img = images.find(i => i.id === id)!;
      return { ...img, order: index };
    });
    setImages(reordered);
  };

  const handleDelete = (imageId: string) => {
    // Delete image
    setImages(images.filter(img => img.id !== imageId));
  };

  return (
    <ImagePreviewList
      images={images}
      onReorder={handleReorder}
      onDelete={handleDelete}
      readOnly={false}
    />
  );
}
```

**Props:**
- `images: UploadedImage[]` - Array of uploaded images
- `onReorder: (imageIds: string[]) => void` - Callback when images are reordered
- `onDelete: (imageId: string) => void` - Callback when image is deleted
- `readOnly?: boolean` - Disable editing (default: false)

**UploadedImage Type:**
```typescript
interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  order: number;
}
```

---

## Complete Example

Here's a complete example integrating all three components:

```tsx
'use client';

import { useState } from 'react';
import {
  ImageUploadInput,
  ImageUploadProgress,
  ImagePreviewList,
  UploadProgress,
  UploadedImage,
} from '@/components/admin';

export function ImageUploadForm() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload each file
    for (const upload of newUploads) {
      try {
        const file = files.find((f) => f.name === upload.fileName)!;
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();

        // Update upload status
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: 'success', progress: 100 }
              : u
          )
        );

        // Add to images list
        setImages((prev) => [
          ...prev,
          {
            id: data.data.id,
            url: data.data.url,
            thumbnailUrl: data.data.thumbnail,
            filename: data.data.filename,
            order: prev.length,
          },
        ]);
      } catch (error) {
        // Update upload status to error
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: 'error',
                  error: 'Upload failed. Please try again.',
                }
              : u
          )
        );
      }
    }
  };

  const handleRetry = (id: string) => {
    // Implement retry logic
  };

  const handleReorder = (imageIds: string[]) => {
    const reordered = imageIds.map((id, index) => {
      const img = images.find((i) => i.id === id)!;
      return { ...img, order: index };
    });
    setImages(reordered);
  };

  const handleDelete = async (imageId: string) => {
    try {
      await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
      setImages(images.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <ImageUploadInput onFilesSelected={handleFilesSelected} />
      
      {uploads.length > 0 && (
        <ImageUploadProgress uploads={uploads} onRetry={handleRetry} />
      )}
      
      {images.length > 0 && (
        <ImagePreviewList
          images={images}
          onReorder={handleReorder}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

## Validation

The components use the following validation constraints from `@/lib/image/types`:

- **Supported file types:** JPEG, PNG, WebP, GIF
- **Maximum file size:** 5MB (configurable via `MAX_IMAGE_SIZE` env var)
- **Minimum dimensions:** 200x200 pixels
- **Maximum dimensions:** 4096x4096 pixels

## Styling

All components use Tailwind CSS classes and follow the shadcn/ui design system. They are fully responsive and support dark mode.
