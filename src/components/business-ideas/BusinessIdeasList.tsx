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

  return (
    <Link key={idea.id} href={`/business-ideas/${idea.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="p-0">
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-muted">
            {/* Loading spinner */}
            {imageLoading && hasImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <svg
                  className="animate-spin h-8 w-8 text-muted-foreground"
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
                className="object-cover"
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
              <Image
                src="/placeholder-image.svg"
                alt="No image available"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={75}
                unoptimized
                onLoad={() => setImageLoading(false)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="text-xl">{idea.title}</CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}

export function BusinessIdeasList({ businessIdeas }: BusinessIdeasListProps) {
  if (businessIdeas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No business ideas available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businessIdeas.map((idea, index) => (
        <BusinessIdeaCard key={idea.id} idea={idea} index={index} />
      ))}
    </div>
  );
}
