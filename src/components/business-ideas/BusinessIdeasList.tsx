'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface ImageVariant {
  id: string;
  variant: 'THUMBNAIL' | 'MEDIUM' | 'FULL';
  storagePath: string;
  width: number;
  height: number;
  size: number;
}

interface UploadedImage {
  id: string;
  filename: string;
  order: number;
  variants: ImageVariant[];
}

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
  uploadedImages?: UploadedImage[];
  budgetMin: number;
  budgetMax: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BusinessIdeasListProps {
  businessIdeas: BusinessIdea[];
}

function BusinessIdeaCard({ idea, index }: { idea: BusinessIdea; index: number }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get the primary image (first in order)
  const primaryImage = idea.uploadedImages?.[0];
  const thumbnailVariant = primaryImage?.variants.find(v => v.variant === 'THUMBNAIL');
  
  // Fallback to old images array if no uploaded images
  const imageUrl = thumbnailVariant && primaryImage
    ? `/api/images/${primaryImage.id}?variant=thumbnail`
    : idea.images?.[0];

  const hasImage = (primaryImage || idea.images?.[0]) && !imageError;

  // Truncate description to a reasonable length
  const truncatedDescription = idea.description?.length > 120 
    ? idea.description.substring(0, 120) + '...' 
    : idea.description;

  return (
    <Link key={idea.id} href={`/business-ideas/${idea.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 hover:border-primary/20">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {/* Loading spinner */}
            {imageLoading && hasImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                <svg
                  className="animate-spin h-8 w-8 text-muted-foreground/50"
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
              </div>
            )}
            
            {hasImage ? (
              <Image
                src={imageUrl}
                alt={idea.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={index < 3 ? 'eager' : 'lazy'}
                priority={index < 3}
                quality={75}
                unoptimized // Use unoptimized for our API-served images
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=="
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => setImageLoading(false)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-muted-foreground/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {idea.title}
            </CardTitle>
            {truncatedDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {truncatedDescription}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                ₹{idea.budgetMin.toLocaleString()} - ₹{idea.budgetMax.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all duration-200">
              <span className="text-sm font-medium">View</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function BusinessIdeasList({ businessIdeas }: BusinessIdeasListProps) {
  if (businessIdeas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">No business ideas yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Be the first to share your innovative business idea with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {businessIdeas.map((idea, index) => (
        <BusinessIdeaCard key={idea.id} idea={idea} index={index} />
      ))}
    </div>
  );
}
