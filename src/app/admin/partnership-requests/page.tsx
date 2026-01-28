'use client';

import { AdminPartnershipRequestsManager } from '@/components/admin/AdminPartnershipRequestsManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminPartnershipRequestsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <ErrorBoundary>
        <div className="container mx-auto py-8 px-4">
          <AdminPartnershipRequestsManager />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
