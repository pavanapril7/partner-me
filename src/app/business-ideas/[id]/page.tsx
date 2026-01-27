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
        
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-12 md:h-14 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-14 w-48" />
          </div>

          {/* Image gallery skeleton */}
          <Card className="mb-10 overflow-hidden shadow-xl border-border/50">
            <CardContent className="p-0">
              <Skeleton className="w-full h-[400px] md:h-[600px]" />
              <div className="flex gap-3 p-6">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Budget skeleton */}
          <Card className="mb-10 overflow-hidden shadow-lg border-border/50">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="h-8 w-48" />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description skeleton */}
          <Card className="overflow-hidden shadow-lg border-border/50">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="h-8 w-64" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
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
          <Card className="overflow-hidden shadow-lg border-border/50">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-error/10 to-error/5 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-3">
                {error || 'Business Idea Not Found'}
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                The business idea you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/business-ideas')}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Business Ideas
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
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Business Ideas
        </button>
        
        <BusinessIdeaDetail businessIdea={businessIdea} />
      </div>
    </ErrorBoundary>
  );
}
