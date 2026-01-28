'use client';

import { useEffect } from 'react';
import { AdminSubmissionDetail } from '@/components/admin/AdminSubmissionDetail';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useParams } from 'next/navigation';

export default function AdminSubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;

  // Set page title
  useEffect(() => {
    document.title = 'Submission Detail | Admin';
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <ErrorBoundary>
        <div className="container mx-auto py-8 px-4">
          <AdminSubmissionDetail submissionId={submissionId} />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
