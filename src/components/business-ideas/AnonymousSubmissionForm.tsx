'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadInput } from '@/components/admin/ImageUploadInput';
import { ImagePreviewList, UploadedImage } from '@/components/admin/ImagePreviewList';
import { ImageUploadProgress, UploadProgress } from '@/components/admin/ImageUploadProgress';
import { ImageUploadErrorBoundary } from '@/components/admin/ImageUploadErrorBoundary';
import { anonymousSubmissionSchema } from '@/schemas/anonymous-submission.schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/api-client';

interface AnonymousSubmissionFormData {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  contactEmail: string;
  contactPhone: string;
  imageIds: string[];
}

interface AnonymousSubmissionFormProps {
  onSuccess?: () => void;
}

export function AnonymousSubmissionForm({ onSuccess }: AnonymousSubmissionFormProps) {
  const [formData, setFormData] = useState<AnonymousSubmissionFormData>({
    title: '',
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    contactEmail: '',
    contactPhone: '',
    imageIds: [],
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [estimatedReviewTime, setEstimatedReviewTime] = useState<string>('');

  const validateForm = (): boolean => {
    try {
      // Validate with the schema
      anonymousSubmissionSchema.parse({
        ...formData,
        imageIds: uploadedImages.map((img) => img.id),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
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
    if (uploadedImages.length === 0) {
      toast.error('At least one image is required');
      setErrors({ imageIds: 'At least one image is required' });
      return;
    }

    if (!validateForm()) {
      toast.error('Validation failed', {
        description: 'Please check the form fields',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submissions/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageIds: uploadedImages.map((img) => img.id),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          toast.error('Rate limit exceeded', {
            description: result.error?.message || 'You have exceeded the submission limit. Please try again later.',
          });
          return;
        }

        // Handle validation errors
        if (response.status === 400 && result.error?.details) {
          const newErrors: Record<string, string> = {};
          result.error.details.forEach((err: { path: string[]; message: string }) => {
            const path = err.path.join('.');
            newErrors[path] = err.message;
          });
          setErrors(newErrors);
          toast.error('Validation failed', {
            description: 'Please check the form fields',
          });
          return;
        }

        throw new Error(result.error?.message || 'Submission failed');
      }

      // Show success state
      setShowSuccess(true);
      setEstimatedReviewTime(result.data.estimatedReviewTime);
      toast.success('Submission received!', {
        description: result.data.message,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Submission error:', error);
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
        // Upload without businessIdeaId (anonymous submission)
        const result = await uploadFile(file);

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
  };

  const handleImageDelete = async (imageId: string) => {
    // Remove from uploaded images
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
    toast.success('Image removed');
  };

  const handleRetryUpload = (uploadId: string) => {
    // Remove the failed upload from progress
    setUploadProgress((prev) => prev.filter((upload) => upload.id !== uploadId));
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      budgetMin: 0,
      budgetMax: 0,
      contactEmail: '',
      contactPhone: '',
      imageIds: [],
    });
    setUploadedImages([]);
    setUploadProgress([]);
    setErrors({});
    setShowSuccess(false);
    setEstimatedReviewTime('');
  };

  // Show success confirmation
  if (showSuccess) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Submission Received!</h3>
          <p className="text-muted-foreground">
            Thank you for submitting your business idea. Your submission is now pending review.
          </p>
          {estimatedReviewTime && (
            <p className="text-sm text-muted-foreground">
              Estimated review time: {estimatedReviewTime}
            </p>
          )}
        </div>

        <Button onClick={handleReset}>
          Submit Another Idea
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            // Clear error on change
            if (errors.title) {
              setErrors({ ...errors, title: '' });
            }
          }}
          placeholder="Enter your business idea title"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value });
            // Clear error on change
            if (errors.description) {
              setErrors({ ...errors, description: '' });
            }
          }}
          placeholder="Describe your business idea in detail..."
          disabled={isSubmitting}
          rows={6}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
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
            onChange={(e) => {
              setFormData({
                ...formData,
                budgetMin: parseFloat(e.target.value) || 0,
              });
              // Clear error on change
              if (errors.budgetMin) {
                setErrors({ ...errors, budgetMin: '' });
              }
            }}
            placeholder="0.00"
            disabled={isSubmitting}
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
            onChange={(e) => {
              setFormData({
                ...formData,
                budgetMax: parseFloat(e.target.value) || 0,
              });
              // Clear error on change
              if (errors.budgetMax) {
                setErrors({ ...errors, budgetMax: '' });
              }
            }}
            placeholder="0.00"
            disabled={isSubmitting}
          />
          {errors.budgetMax && (
            <p className="text-sm text-destructive">{errors.budgetMax}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Contact Information *</Label>
          <p className="text-sm text-muted-foreground">
            Provide at least one contact method so we can reach you about your submission.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => {
              setFormData({ ...formData, contactEmail: e.target.value });
              // Clear error on change
              if (errors.contactEmail) {
                setErrors({ ...errors, contactEmail: '' });
              }
            }}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
          />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input
            id="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => {
              setFormData({ ...formData, contactPhone: e.target.value });
              // Clear error on change
              if (errors.contactPhone) {
                setErrors({ ...errors, contactPhone: '' });
              }
            }}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.contactPhone && (
            <p className="text-sm text-destructive">{errors.contactPhone}</p>
          )}
        </div>
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
        {errors.imageIds && (
          <p className="text-sm text-destructive">{errors.imageIds}</p>
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

        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
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

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || uploadProgress.some((u) => u.status === 'uploading')}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Business Idea'}
        </Button>
      </div>
    </form>
  );
}
