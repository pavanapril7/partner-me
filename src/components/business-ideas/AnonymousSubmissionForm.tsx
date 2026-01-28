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
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 via-green-25 to-transparent border-2 border-green-200 rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-lg">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-4 shadow-xl">
              <svg
                className="h-16 w-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Submission Received!
            </h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Thank you for submitting your business idea. Your submission is now pending review by our team.
            </p>
            {estimatedReviewTime && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-primary">
                  Estimated review time: {estimatedReviewTime}
                </span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleReset}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Submit Another Idea
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Form Header */}
      <div className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-border">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Submit Your Business Idea
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Share your innovative business concept with us. All fields marked with * are required.
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
          <h3 className="text-xl font-semibold">Basic Information</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) {
                setErrors({ ...errors, title: '' });
              }
            }}
            placeholder="Enter a compelling title for your business idea"
            disabled={isSubmitting}
            className={`h-12 text-base transition-all duration-200 ${
              errors.title 
                ? 'border-destructive focus-visible:ring-destructive' 
                : 'focus-visible:ring-primary focus-visible:border-primary'
            }`}
          />
          {errors.title && (
            <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">
            Description <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) {
                setErrors({ ...errors, description: '' });
              }
            }}
            placeholder="Describe your business idea in detail. Include the problem it solves, target audience, and unique value proposition..."
            disabled={isSubmitting}
            rows={8}
            className={`flex w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all duration-200 ${
              errors.description
                ? 'border-destructive focus-visible:ring-destructive'
                : 'border-input focus-visible:ring-primary focus-visible:border-primary'
            }`}
          />
          {errors.description && (
            <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* Budget Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-secondary to-accent rounded-full"></div>
          <h3 className="text-xl font-semibold">Budget Range</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="budgetMin" className="text-base font-medium">
              Minimum Budget <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
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
                  if (errors.budgetMin) {
                    setErrors({ ...errors, budgetMin: '' });
                  }
                }}
                placeholder="0.00"
                disabled={isSubmitting}
                className={`h-12 pl-8 text-base transition-all duration-200 ${
                  errors.budgetMin
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-primary focus-visible:border-primary'
                }`}
              />
            </div>
            {errors.budgetMin && (
              <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.budgetMin}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetMax" className="text-base font-medium">
              Maximum Budget <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
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
                  if (errors.budgetMax) {
                    setErrors({ ...errors, budgetMax: '' });
                  }
                }}
                placeholder="0.00"
                disabled={isSubmitting}
                className={`h-12 pl-8 text-base transition-all duration-200 ${
                  errors.budgetMax
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-primary focus-visible:border-primary'
                }`}
              />
            </div>
            {errors.budgetMax && (
              <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.budgetMax}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-accent to-primary rounded-full"></div>
          <h3 className="text-xl font-semibold">Contact Information</h3>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <svg className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Provide at least one contact method so we can reach you about your submission.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-base font-medium">
              Email Address
            </Label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => {
                  setFormData({ ...formData, contactEmail: e.target.value });
                  if (errors.contactEmail) {
                    setErrors({ ...errors, contactEmail: '' });
                  }
                }}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                className={`h-12 pl-12 text-base transition-all duration-200 ${
                  errors.contactEmail
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-primary focus-visible:border-primary'
                }`}
              />
            </div>
            {errors.contactEmail && (
              <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.contactEmail}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-base font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => {
                  setFormData({ ...formData, contactPhone: e.target.value });
                  if (errors.contactPhone) {
                    setErrors({ ...errors, contactPhone: '' });
                  }
                }}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
                className={`h-12 pl-12 text-base transition-all duration-200 ${
                  errors.contactPhone
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-primary focus-visible:border-primary'
                }`}
              />
            </div>
            {errors.contactPhone && (
              <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.contactPhone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          <h3 className="text-xl font-semibold">
            Images <span className="text-destructive">*</span>
          </h3>
        </div>

        <div className="space-y-4">
          <ImageUploadErrorBoundary onReset={() => setUploadProgress([])}>
            <ImageUploadInput
              onFilesSelected={handleFilesSelected}
              maxFiles={10}
              disabled={isSubmitting || uploadProgress.some((u) => u.status === 'uploading')}
            />
          </ImageUploadErrorBoundary>
          
          {errors.imageIds && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.imageIds}
            </p>
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
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-6 sm:pt-8 border-t border-border">
        <Button
          type="submit"
          disabled={isSubmitting || uploadProgress.some((u) => u.status === 'uploading')}
          size="lg"
          className="w-full md:w-auto min-w-[200px] min-h-[48px] bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary-600 hover:via-secondary-600 hover:to-accent-600 shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold touch-manipulation"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Submit Business Idea
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
