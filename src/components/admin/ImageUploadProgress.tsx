'use client';

import { Button } from '@/components/ui/button';

export interface UploadProgress {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ImageUploadProgressProps {
  uploads: UploadProgress[];
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ImageUploadProgress({
  uploads,
  onRetry,
  onCancel,
}: ImageUploadProgressProps) {
  if (uploads.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="border rounded-lg p-4 space-y-2 bg-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(upload.fileSize)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {upload.status === 'uploading' && (
                <span className="text-xs text-muted-foreground">
                  {upload.progress}%
                </span>
              )}

              {upload.status === 'success' && (
                <div className="flex items-center gap-1 text-green-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">Complete</span>
                </div>
              )}

              {upload.status === 'error' && onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(upload.id)}
                >
                  Retry
                </Button>
              )}

              {upload.status === 'uploading' && onCancel && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(upload.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {upload.status === 'uploading' && (
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}

          {/* Error message */}
          {upload.status === 'error' && upload.error && (
            <div className="flex items-start gap-2 text-destructive">
              <svg
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{upload.error}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
