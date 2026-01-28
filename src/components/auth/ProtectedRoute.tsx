'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { storeIntendedDestination, createLoginUrl, isAdmin } from '@/lib/auth-utils';

/**
 * Protected Route Component
 * Requirements: 4.1, 4.2, 8.2
 * 
 * Wraps components that require authentication.
 * Features:
 * - Redirects to login page if user is not authenticated
 * - Preserves intended destination for post-login redirect
 * - Supports admin-only routes with requireAdmin prop
 * - Custom loading and unauthorized components
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  requireAdmin = false,
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current path as intended destination
      if (pathname) {
        storeIntendedDestination(pathname);
      }
      
      // Redirect to login with the intended destination as a parameter
      const loginUrl = createLoginUrl(pathname || undefined);
      router.push(loginUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

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

  // Check admin requirement
  if (requireAdmin && !isAdmin(user)) {
    // User is authenticated but not an admin
    return unauthorizedComponent || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page. Admin privileges are required.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
