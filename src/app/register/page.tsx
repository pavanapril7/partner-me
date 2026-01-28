'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RegistrationForm } from '@/components/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectUrl } from '@/lib/auth-utils';
import { FormSuccess } from '@/components/ui/form-success';
import { FormError } from '@/components/ui/form-error';

/**
 * Register Page
 * Requirements: 1.2, 1.3, 1.5, 3.1, 3.2, 3.3
 * 
 * Features:
 * - Centered card layout with branding
 * - Automatic redirect for authenticated users
 * - Integration with RegistrationForm and API handlers
 * - Link to login page
 * - Success message and redirect to login after registration
 */
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Get redirect destination from URL params (to pass to login after registration)
  const redirectTo = getRedirectUrl(searchParams);

  /**
   * Redirect authenticated users away from register page
   * Requirements: 1.3
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is already authenticated, redirect them
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  /**
   * Handle credential registration
   * Requirements: 3.1, 3.3
   */
  const handleCredentialRegister = async (
    username: string,
    password: string,
    email?: string
  ) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/register/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      if (data.success) {
        // Show success message
        setSuccessMessage('Account created successfully! Redirecting to login...');
        
        // Redirect to login page after short delay
        handlePostRegistrationRedirect();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Handle mobile registration
   * Requirements: 3.2, 3.3
   */
  const handleMobileRegister = async (mobileNumber: string) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/register/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      if (data.success) {
        // Show success message
        setSuccessMessage('Account created successfully! Redirecting to login...');
        
        // Redirect to login page after short delay
        handlePostRegistrationRedirect();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Handle post-registration redirect
   * Requirements: 3.3
   * 
   * Redirects to login page, preserving redirect parameter if present
   */
  const handlePostRegistrationRedirect = () => {
    // Small delay to show success message
    setTimeout(() => {
      // Redirect to login, preserving the redirect parameter if it exists
      if (redirectTo) {
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        router.push('/login');
      }
    }, 1500);
  };

  /**
   * Handle successful registration callback
   * Requirements: 3.3
   */
  const handleRegistrationSuccess = () => {
    // This is called by RegistrationForm after successful registration
    // The actual redirect is handled by handlePostRegistrationRedirect
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render register form if already authenticated (will redirect via useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      {/* Header - Responsive text sizing */}
      <div className="mb-6 sm:mb-8 text-center px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Create Account</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Join us today and start sharing your ideas
        </p>
      </div>

      {/* Registration Form - Full width on mobile, constrained on larger screens */}
      <div className="w-full max-w-md">
        <RegistrationForm
          onCredentialRegister={handleCredentialRegister}
          onMobileRegister={handleMobileRegister}
          onSuccess={handleRegistrationSuccess}
          showTerms={false}
        />
      </div>

      {/* Success Message - Responsive padding and text */}
      {successMessage && (
        <div className="mt-4 max-w-md w-full">
          <FormSuccess>{successMessage}</FormSuccess>
        </div>
      )}

      {/* Error Message - Responsive padding and text */}
      {error && (
        <div className="mt-4 max-w-md w-full">
          <FormError>{error}</FormError>
        </div>
      )}

      {/* Link to Login - Responsive text and touch target */}
      <div className="mt-6 text-center text-sm sm:text-base px-4">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
            className="font-medium text-primary hover:underline inline-block min-h-[44px] flex items-center"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Additional Info - Responsive text */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground max-w-md px-4">
        <p>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
