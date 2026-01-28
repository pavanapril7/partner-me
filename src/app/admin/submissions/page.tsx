'use client';

import { useEffect } from 'react';
import { AdminModerationQueue } from '@/components/admin/AdminModerationQueue';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminSubmissionsPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Moderation Queue | Admin';
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <ErrorBoundary>
        <div className="container mx-auto py-8 px-4">
          <AdminModerationQueue />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
