'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PartnershipRequestForm } from './PartnershipRequestForm';

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

interface BusinessIdeaDetailProps {
  businessIdea: BusinessIdea;
}

export function BusinessIdeaDetail({ businessIdea }: BusinessIdeaDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

  const handlePartnerClick = () => {
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    toast.success('Partnership request submitted successfully!', {
      description: 'We will contact you soon to discuss the opportunity.',
    });
  };

  const handleFormError = (error: string) => {
    toast.error('Failed to submit partnership request', {
      description: error,
    });
  };

  // Use uploaded images if available, otherwise fall back to old images array
  const displayImages = businessIdea.uploadedImages && businessIdea.uploadedImages.length > 0
    ? businessIdea.uploadedImages.map(img => ({
        id: img.id,
        url: `/api/images/${img.id}?variant=medium`,
        fullUrl: `/api/images/${img.id}?variant=full`,
        thumbnailUrl: `/api/images/${img.id}?variant=thumbnail`,
        isUploaded: true,
      }))
    : businessIdea.images.map((url, idx) => ({
        id: `legacy-${idx}`,
        url,
        fullUrl: url,
        thumbnailUrl: url,
        isUploaded: false,
      }));

  const hasImages = displayImages.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Title and Partner Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-bold">{businessIdea.title}</h1>
        <Button 
          onClick={handlePartnerClick}
          size="lg"
          className="md:ml-4"
        >
          Partner Me
        </Button>
      </div>

      {/* Image Gallery/Carousel */}
      {hasImages && (
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg bg-muted">
              {/* Loading spinner */}
              {imageLoading[currentImageIndex] && !imageErrors[currentImageIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                  <svg
                    className="animate-spin h-12 w-12 text-muted-foreground"
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
              
              {imageErrors[currentImageIndex] ? (
                <Image
                  src="/placeholder-image.svg"
                  alt="Image not available"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  quality={75}
                  unoptimized
                />
              ) : (
                <Image
                  src={displayImages[currentImageIndex].url}
                  alt={`${businessIdea.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority={currentImageIndex === 0}
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                  quality={85}
                  unoptimized // Use unoptimized for our API-served images
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=="
                  onError={() => handleImageError(currentImageIndex)}
                  onLoad={() => handleImageLoad(currentImageIndex)}
                />
              )}
              
              {/* Navigation Arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {displayImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all bg-muted ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {imageErrors[index] ? (
                      <Image
                        src="/placeholder-image.svg"
                        alt="Thumbnail not available"
                        fill
                        className="object-cover"
                        sizes="80px"
                        quality={60}
                        unoptimized
                      />
                    ) : (
                      <Image
                        src={image.thumbnailUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        loading="lazy"
                        quality={60}
                        unoptimized // Use unoptimized for our API-served images
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Range */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Investment Range</h2>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Minimum</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(businessIdea.budgetMin)}
              </p>
            </div>
            <div className="text-2xl text-muted-foreground">-</div>
            <div>
              <p className="text-sm text-muted-foreground">Maximum</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(businessIdea.budgetMax)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">About This Opportunity</h2>
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: businessIdea.description }}
          />
        </CardContent>
      </Card>

      {/* Partnership Request Form */}
      <PartnershipRequestForm
        businessIdeaId={businessIdea.id}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />
    </div>
  );
}
