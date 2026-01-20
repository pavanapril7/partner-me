'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Protected Route Component
 * Requirements: 6.4
 * 
 * Wraps components that require authentication.
 * Redirects to login page if user is not authenticated.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth-demo',
  loadingComponent 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
