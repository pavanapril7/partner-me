'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessIdeaDetail } from '@/components/business-ideas/BusinessIdeaDetail';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BusinessIdeaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchBusinessIdea() {
      try {
        const response = await fetch(`/api/business-ideas/${id}`);
        
        if (response.status === 404) {
          setError('Business idea not found');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch business idea');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setBusinessIdea(result.data);
        } else {
          setError('Business idea not found');
        }
      } catch (err) {
        console.error('Error fetching business idea:', err);
        setError('An error occurred while loading the business idea');
        toast.error('Failed to load business idea', {
          description: 'Please try refreshing the page',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessIdea();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-32" />
          </div>

          {/* Image gallery skeleton */}
          <Card className="mb-8">
            <CardContent className="p-0">
              <Skeleton className="w-full h-[400px] md:h-[500px] rounded-lg" />
            </CardContent>
          </Card>

          {/* Budget skeleton */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="flex items-center gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-8 w-4" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-7 w-64 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !businessIdea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">
                {error || 'Business Idea Not Found'}
              </h1>
              <p className="text-muted-foreground mb-6">
                The business idea you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/business-ideas')}
                className="text-primary hover:underline"
              >
                ← Back to Business Ideas
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/business-ideas')}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center"
        >
          ← Back to Business Ideas
        </button>
        
        <BusinessIdeaDetail businessIdea={businessIdea} />
      </div>
    </ErrorBoundary>
  );
}
