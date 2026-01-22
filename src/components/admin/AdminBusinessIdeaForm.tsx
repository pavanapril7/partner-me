'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { businessIdeaSchema } from '@/schemas/business-idea.schema';
import { z } from 'zod';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
  budgetMin: number;
  budgetMax: number;
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
    budgetMin: 0,
    budgetMax: 0,
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (businessIdea) {
      setFormData({
        title: businessIdea.title,
        description: businessIdea.description,
        images: businessIdea.images,
        budgetMin: businessIdea.budgetMin,
        budgetMax: businessIdea.budgetMax,
      });
    }
  }, [businessIdea]);

  const validateForm = (): boolean => {
    try {
      businessIdeaSchema.parse(formData);
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
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
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Enter image URL"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddImage();
              }
            }}
          />
          <Button type="button" onClick={handleAddImage} variant="outline">
            Add
          </Button>
        </div>
        {errors.images && (
          <p className="text-sm text-destructive">{errors.images}</p>
        )}
        {formData.images.length > 0 && (
          <div className="space-y-2 mt-4">
            {formData.images.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded"
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <span className="flex-1 text-sm truncate">{url}</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
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
