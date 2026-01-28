'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectUrl, getIntendedDestination } from '@/lib/auth-utils';
import { FormSuccess } from '@/components/ui/form-success';
import { FormError } from '@/components/ui/form-error';

/**
 * Login Page
 * Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.3
 * 
 * Features:
 * - Centered card layout with branding
 * - Redirect parameter handling from URL
 * - Automatic redirect for authenticated users
 * - Integration with LoginForm and API handlers
 * - Link to registration page
 * - Post-login redirect to intended destination
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Get redirect destination from URL params
  const redirectTo = getRedirectUrl(searchParams);

  /**
   * Redirect authenticated users away from login page
   * Requirements: 1.3
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is already authenticated, redirect them
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  /**
   * Handle credential login
   * Requirements: 2.1, 2.4
   */
  const handleCredentialLogin = async (
    username: string,
    password: string,
    rememberMe: boolean
  ) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/login/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.success && data.session?.token) {
        // Login to AuthContext with remember me preference
        await login(data.session.token, rememberMe);
        
        setSuccessMessage('Login successful! Redirecting...');
        
        // Redirect after successful login
        handlePostLoginRedirect();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Handle OTP request
   * Requirements: 2.2
   */
  const handleOTPRequest = async (mobileNumber: string) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }

      // Show success message with masked number
      const maskedNumber = mobileNumber.replace(/(\d{2})\d+(\d{4})/, '$1****$2');
      setSuccessMessage(`OTP sent to ${maskedNumber}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Handle OTP verification
   * Requirements: 2.3, 2.4
   */
  const handleOTPVerify = async (
    mobileNumber: string,
    code: string,
    rememberMe: boolean
  ) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OTP verification failed');
      }

      if (data.success && data.session?.token) {
        // Login to AuthContext with remember me preference
        await login(data.session.token, rememberMe);
        
        setSuccessMessage('Login successful! Redirecting...');
        
        // Redirect after successful login
        handlePostLoginRedirect();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Handle post-login redirect
   * Requirements: 4.3
   * 
   * Priority:
   * 1. Redirect from URL parameter
   * 2. Intended destination from localStorage
   * 3. Home page (default)
   */
  const handlePostLoginRedirect = () => {
    // Small delay to show success message
    setTimeout(() => {
      // Check URL parameter first
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Check stored intended destination
      const intendedDestination = getIntendedDestination();
      if (intendedDestination) {
        router.push(intendedDestination);
        return;
      }

      // Default to home page
      router.push('/');
    }, 500);
  };

  /**
   * Handle successful login callback
   * Requirements: 4.3
   */
  const handleLoginSuccess = () => {
    // This is called by LoginForm after successful authentication
    // The actual redirect is handled by handlePostLoginRedirect
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

  // Don't render login form if already authenticated (will redirect via useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
      {/* Header - Responsive text sizing */}
      <div className="mb-6 sm:mb-8 text-center px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Welcome Back</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Form - Full width on mobile, constrained on larger screens */}
      <div className="w-full max-w-md">
        <LoginForm
          onCredentialLogin={handleCredentialLogin}
          onOTPRequest={handleOTPRequest}
          onOTPVerify={handleOTPVerify}
          onSuccess={handleLoginSuccess}
          showRememberMe={true}
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

      {/* Link to Registration - Responsive text and touch target */}
      <div className="mt-6 text-center text-sm sm:text-base px-4">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'}
            className="font-medium text-primary hover:underline inline-block min-h-[44px] flex items-center"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Additional Info - Responsive text */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground max-w-md px-4">
        <p>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
