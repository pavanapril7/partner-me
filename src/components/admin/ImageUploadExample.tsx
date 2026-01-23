'use client';

/**
 * Example component demonstrating the integration of all three image upload components.
 * This is for reference only and shows how to use ImageUploadInput, ImageUploadProgress,
 * and ImagePreviewList together in a form.
 */

import { useState } from 'react';
import { ImageUploadInput } from './ImageUploadInput';
import { ImageUploadProgress, UploadProgress } from './ImageUploadProgress';
import { ImagePreviewList, UploadedImage } from './ImagePreviewList';
import { uploadFile, deleteImage } from '@/lib/api-client';

export function ImageUploadExample() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload each file
    for (const upload of newUploads) {
      try {
        const file = files.find((f) => f.name === upload.fileName)!;

        // Simulate progress
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, progress: 30 } : u
          )
        );

        const result = await uploadFile(file);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        const data = result.data;

        // Update upload status to success
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: 'success' as const, progress: 100 }
              : u
          )
        );

        // Add to images list
        setImages((prev) => [
          ...prev,
          {
            id: data.id,
            url: data.url,
            thumbnailUrl: data.thumbnail,
            filename: data.filename,
            order: prev.length,
          },
        ]);

        // Remove from uploads after a delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== upload.id));
        }, 2000);
      } catch (error) {
        // Update upload status to error
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: 'error' as const,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Upload failed. Please try again.',
                }
              : u
          )
        );
      }
    }
  };

  const handleRetry = async (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (!upload) return;

    // Reset status and retry
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: 'uploading' as const, progress: 0, error: undefined }
          : u
      )
    );

    // Note: In a real implementation, you would need to store the original File object
    // to retry the upload. This is just a placeholder.
    console.log('Retry upload:', id);
  };

  const handleCancel = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleReorder = async (imageIds: string[]) => {
    // Update local state
    const reordered = imageIds.map((id, index) => {
      const img = images.find((i) => i.id === id)!;
      return { ...img, order: index };
    });
    setImages(reordered);

    // In a real implementation, you would also update the server
    // For example, if this is part of a business idea form:
    // await fetch(`/api/business-ideas/${businessIdeaId}/images/reorder`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ imageIds }),
    // });
  };

  const handleDelete = async (imageId: string) => {
    try {
      const result = await deleteImage(imageId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Delete failed');
      }

      setImages(images.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Images</h3>
        <ImageUploadInput onFilesSelected={handleFilesSelected} maxFiles={10} />
      </div>

      {uploads.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Progress</h3>
          <ImageUploadProgress
            uploads={uploads}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        </div>
      )}

      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Uploaded Images</h3>
          <ImagePreviewList
            images={images}
            onReorder={handleReorder}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
