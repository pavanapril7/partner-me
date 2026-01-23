'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for image upload components
 * Provides user-friendly error messages for common image upload failures
 */
export class ImageUploadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Image upload error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    // Map technical errors to user-friendly messages
    if (message.includes('file type') || message.includes('mime')) {
      return 'The selected file type is not supported. Please upload JPEG, PNG, WebP, or GIF images.';
    }
    if (message.includes('file size') || message.includes('too large')) {
      return 'The selected file is too large. Please upload images smaller than 5MB.';
    }
    if (message.includes('dimension') || message.includes('resolution')) {
      return 'The image dimensions are not supported. Please upload images between 200x200 and 4096x4096 pixels.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error occurred. Please check your connection and try again.';
    }
    if (message.includes('storage') || message.includes('upload')) {
      return 'Failed to upload the image. Please try again.';
    }

    return 'An unexpected error occurred while processing your image. Please try again.';
  }

  render() {
    if (this.state.hasError) {
      const userMessage = this.state.error
        ? this.getUserFriendlyMessage(this.state.error)
        : 'An unexpected error occurred';

      return (
        <div className="border-2 border-destructive/50 rounded-lg p-6 bg-destructive/5">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-destructive mb-1">
                  Image Upload Error
                </h3>
                <p className="text-sm text-muted-foreground">{userMessage}</p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical details (development only)
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto text-xs">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={this.handleReset}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
