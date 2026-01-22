'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PartnershipRequestForm } from './PartnershipRequestForm';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  images: string[];
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === businessIdea.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? businessIdea.images.length - 1 : prev - 1
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
      {businessIdea.images.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg bg-muted">
              <Image
                src={businessIdea.images[currentImageIndex]}
                alt={`${businessIdea.title} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={currentImageIndex === 0}
                loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
              />
              
              {/* Navigation Arrows */}
              {businessIdea.images.length > 1 && (
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
                    {currentImageIndex + 1} / {businessIdea.images.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {businessIdea.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {businessIdea.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all bg-muted ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      loading="lazy"
                    />
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
