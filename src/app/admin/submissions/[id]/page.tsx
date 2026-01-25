'use client';

import { useEffect } from 'react';
import { AdminSubmissionDetail } from '@/components/admin/AdminSubmissionDetail';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function AdminSubmissionDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  // Set page title
  useEffect(() => {
    document.title = 'Submission Detail | Admin';
  }, []);

  // Protect the page - redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/auth-demo');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4">
        <AdminSubmissionDetail submissionId={submissionId} />
      </div>
    </ErrorBoundary>
  );
}
