'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { SUPPORTED_MIME_TYPES, VALIDATION_CONSTRAINTS, SupportedMimeType } from '@/lib/image/types';

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  imageId?: string;
  url?: string;
}

interface ImageUploadInputProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  accept?: string;
}

export function ImageUploadInput({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  accept = SUPPORTED_MIME_TYPES.join(','),
}: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Check file type
      if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are supported.`);
        continue;
      }

      // Check file size
      if (file.size > VALIDATION_CONSTRAINTS.MAX_FILE_SIZE) {
        const maxSizeMB = (VALIDATION_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
        errors.push(`${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      // Check max files
      if (valid.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed.`);
        break;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setValidationError(errors.join(' '));
      setTimeout(() => setValidationError(null), 5000);
    }

    if (valid.length > 0) {
      setValidationError(null);
      onFilesSelected(valid);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </div>
          
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF (max {(VALIDATION_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB)
          </p>
        </div>
      </div>

      {validationError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {validationError}
        </div>
      )}
    </div>
  );
}
