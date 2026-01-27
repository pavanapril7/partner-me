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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      {/* Header with Title and Partner Button */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 animate-fade-in">
        <div className="flex-1 space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {businessIdea.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Discover this exciting business opportunity
          </p>
        </div>
        <Button 
          onClick={handlePartnerClick}
          size="lg"
          className="w-full md:w-auto md:ml-4 md:mt-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 font-semibold min-h-[48px]"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Partner Me
        </Button>
      </div>

      {/* Image Gallery/Carousel */}
      {hasImages && (
        <Card className="mb-8 sm:mb-10 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-delay border-border/50">
          <CardContent className="p-0">
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
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
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg touch-manipulation"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg touch-manipulation"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 bg-black/60 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {displayImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all duration-300 bg-muted touch-manipulation ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary/50 shadow-lg scale-105'
                        : 'border-transparent hover:border-primary/30 hover:shadow-md'
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
      <Card className="mb-8 sm:mb-10 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-delay border-border/50 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-primary font-bold text-xl sm:text-2xl">
                ₹
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Investment Range</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-8">
            <div className="flex-1 w-full">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">Minimum Investment</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {formatCurrency(businessIdea.budgetMin)}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center">
              <svg
                className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">Maximum Investment</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {formatCurrency(businessIdea.budgetMax)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-delay-2 border-border/50">
        <CardContent className="p-6 sm:p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-lg bg-accent/10">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">About This Opportunity</h2>
          </div>
          <div 
            className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-li:marker:text-primary"
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
