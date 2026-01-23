'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadInput } from './ImageUploadInput';
import { ImagePreviewList, UploadedImage } from './ImagePreviewList';
import { ImageUploadProgress, UploadProgress } from './ImageUploadProgress';
import { ImageUploadErrorBoundary } from './ImageUploadErrorBoundary';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { uploadFile, deleteImage } from '@/lib/api-client';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
  budgetMin: number;
  budgetMax: number;
  uploadedImages?: Array<{
    id: string;
    filename: string;
    order: number;
    variants: Array<{
      variant: string;
      storagePath: string;
    }>;
  }>;
}

interface AdminBusinessIdeaFormProps {
  businessIdea?: BusinessIdea | null;
  onSubmit: (data: BusinessIdeaFormData) => Promise<void>;
  onCancel: () => void;
}

export interface BusinessIdeaFormData {
  title: string;
  description: string;
  images: string[];
  imageIds: string[];
  budgetMin: number;
  budgetMax: number;
}

export function AdminBusinessIdeaForm({
  businessIdea,
  onSubmit,
  onCancel,
}: AdminBusinessIdeaFormProps) {
  const [formData, setFormData] = useState<BusinessIdeaFormData>({
    title: '',
    description: '',
    images: [],
    imageIds: [],
    budgetMin: 0,
    budgetMax: 0,
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (businessIdea) {
      console.log('Loading business idea for edit:', businessIdea);
      
      setFormData({
        title: businessIdea.title,
        description: businessIdea.description,
        images: businessIdea.images,
        imageIds: [],
        budgetMin: businessIdea.budgetMin,
        budgetMax: businessIdea.budgetMax,
      });

      // Load existing uploaded images
      if (businessIdea.uploadedImages && businessIdea.uploadedImages.length > 0) {
        setIsLoadingImages(true);
        
        console.log('Loading uploaded images:', businessIdea.uploadedImages);
        
        const existingImages: UploadedImage[] = businessIdea.uploadedImages.map((img) => {
          const thumbnailVariant = img.variants.find((v) => v.variant === 'THUMBNAIL');
          
          const imageData = {
            id: img.id,
            url: `/api/images/${img.id}?variant=full`,
            thumbnailUrl: thumbnailVariant ? `/api/images/${img.id}?variant=thumbnail` : `/api/images/${img.id}?variant=thumbnail`,
            filename: img.filename,
            order: img.order,
          };
          
          console.log('Mapped image:', imageData);
          return imageData;
        });
        
        console.log('Setting uploaded images:', existingImages);
        setUploadedImages(existingImages);
        setFormData((prev) => ({
          ...prev,
          imageIds: existingImages.map((img) => img.id),
          images: existingImages.map((img) => img.url),
        }));
        setIsLoadingImages(false);
      } else {
        console.log('No uploaded images found, checking legacy images');
        // If no uploaded images but has legacy URL-based images, keep them
        if (businessIdea.images && businessIdea.images.length > 0) {
          console.log('Using legacy images:', businessIdea.images);
        }
      }
    }
  }, [businessIdea]);

  const validateForm = (): boolean => {
    try {
      // Build images array from uploaded images
      const images = uploadedImages.length > 0 
        ? uploadedImages.map((img) => img.url)
        : formData.images;

      // Validate with the schema
      const dataToValidate = {
        ...formData,
        images,
      };

      console.log('Validating data:', dataToValidate);
      console.log('Uploaded images:', uploadedImages);
      
      businessIdeaSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.issues);
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        
        // Show toast for validation errors
        toast.error('Validation failed', {
          description: Object.values(newErrors)[0] || 'Please check the form fields',
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there are uploads in progress
    const uploadsInProgress = uploadProgress.some((u) => u.status === 'uploading');
    if (uploadsInProgress) {
      toast.error('Please wait', {
        description: 'Image uploads are still in progress',
      });
      return;
    }

    // Check if there are any uploaded images
    // In edit mode, uploadedImages reflects the current state after deletions
    if (uploadedImages.length === 0) {
      toast.error('At least one image is required');
      setErrors({ images: 'At least one image is required' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit with image IDs if we have uploaded images, otherwise use URL array
      const submitData = {
        ...formData,
        images: uploadedImages.length > 0 
          ? uploadedImages.map((img) => img.url)
          : formData.images,
        imageIds: uploadedImages.map((img) => img.id),
      };
      
      console.log('Submitting data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map((file) => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadProgress((prev) => [...prev, ...newUploads]);

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = newUploads[i].id;

      try {
        // Upload using the API client utility
        const result = await uploadFile(file, businessIdea?.id);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Upload failed');
        }

        // Update progress to success
        setUploadProgress((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: 'success', progress: 100 }
              : upload
          )
        );

        // Add to uploaded images
        const newImage: UploadedImage = {
          id: result.data.id,
          url: result.data.url,
          thumbnailUrl: result.data.thumbnail,
          filename: result.data.filename,
          order: uploadedImages.length + i,
        };

        setUploadedImages((prev) => [...prev, newImage]);
        setFormData((prev) => ({
          ...prev,
          imageIds: [...prev.imageIds, result.data!.id],
        }));

        // Show success toast
        toast.success('Image uploaded successfully', {
          description: `${file.name} has been uploaded`,
        });

        // Remove from progress after a delay
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((upload) => upload.id !== uploadId));
        }, 2000);
      } catch (error) {
        console.error('Upload error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Update progress to error
        setUploadProgress((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? {
                  ...upload,
                  status: 'error',
                  error: errorMessage,
                }
              : upload
          )
        );

        // Show error toast
        toast.error('Upload failed', {
          description: errorMessage,
        });
      }
    }
  };

  const handleImageReorder = (imageIds: string[]) => {
    // Reorder images based on the new order
    const reordered = imageIds
      .map((id) => uploadedImages.find((img) => img.id === id))
      .filter((img): img is UploadedImage => img !== undefined)
      .map((img, index) => ({ ...img, order: index }));

    setUploadedImages(reordered);
    setFormData((prev) => ({
      ...prev,
      imageIds: imageIds,
    }));
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      // Remove from uploaded images
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      setFormData((prev) => ({
        ...prev,
        imageIds: prev.imageIds.filter((id) => id !== imageId),
      }));

      // If editing an existing business idea, delete the image from the server
      if (businessIdea?.id) {
        const result = await deleteImage(imageId);

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to delete image');
        }

        // Show success toast
        toast.success('Image deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      
      // Show error toast
      toast.error('Failed to delete image', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleRetryUpload = (uploadId: string) => {
    // Remove the failed upload from progress
    setUploadProgress((prev) => prev.filter((upload) => upload.id !== uploadId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Enter business idea title"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <RichTextEditor
          content={formData.description}
          onChange={(html) =>
            setFormData({ ...formData, description: html })
          }
          placeholder="Enter detailed description with formatting..."
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Images *</Label>
        <ImageUploadErrorBoundary onReset={() => setUploadProgress([])}>
          <ImageUploadInput
            onFilesSelected={handleFilesSelected}
            maxFiles={10}
            disabled={isSubmitting || uploadProgress.some((u) => u.status === 'uploading')}
          />
        </ImageUploadErrorBoundary>
        {errors.images && (
          <p className="text-sm text-destructive">{errors.images}</p>
        )}
        
        {/* Upload progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-4">
            <ImageUploadErrorBoundary>
              <ImageUploadProgress
                uploads={uploadProgress}
                onRetry={handleRetryUpload}
              />
            </ImageUploadErrorBoundary>
          </div>
        )}

        {/* Loading state for existing images */}
        {isLoadingImages && (
          <div className="mt-4 flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Loading images...</span>
            </div>
          </div>
        )}

        {/* Uploaded images preview */}
        {!isLoadingImages && uploadedImages.length > 0 && (
          <div className="mt-4">
            <ImageUploadErrorBoundary>
              <ImagePreviewList
                images={uploadedImages}
                onReorder={handleImageReorder}
                onDelete={handleImageDelete}
                readOnly={isSubmitting}
              />
            </ImageUploadErrorBoundary>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin">Minimum Budget *</Label>
          <Input
            id="budgetMin"
            type="number"
            min="0"
            step="0.01"
            value={formData.budgetMin}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetMin: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          {errors.budgetMin && (
            <p className="text-sm text-destructive">{errors.budgetMin}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetMax">Maximum Budget *</Label>
          <Input
            id="budgetMax"
            type="number"
            min="0"
            step="0.01"
            value={formData.budgetMax}
            onChange={(e) =>
              setFormData({
                ...formData,
                budgetMax: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          {errors.budgetMax && (
            <p className="text-sm text-destructive">{errors.budgetMax}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : businessIdea
            ? 'Update Business Idea'
            : 'Create Business Idea'}
        </Button>
      </div>
    </form>
  );
}
