'use client';

import React, { useState } from 'react';
import { LoginForm, RegistrationForm } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Authentication Demo Page
 * Requirements: 6.4, 7.1
 * 
 * This page demonstrates the authentication system with real API integration.
 * Shows login/registration forms and authenticated user information.
 */
export default function AuthDemoPage() {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated, login, logout } = useAuth();

  // Handle credential login
  const handleCredentialLogin = async (username: string, password: string) => {
    setMessage('');
    setError('');
    
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
        await login(data.session.token);
        setMessage(`Successfully logged in as ${username}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  // Handle OTP request
  const handleOTPRequest = async (mobileNumber: string) => {
    setMessage('');
    setError('');
    
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

      setMessage(`OTP sent to ${mobileNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      throw err;
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (mobileNumber: string, code: string) => {
    setMessage('');
    setError('');
    
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
        await login(data.session.token);
        setMessage(`Successfully logged in with mobile: ${mobileNumber}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
      throw err;
    }
  };

  // Handle credential registration
  const handleCredentialRegister = async (username: string, password: string) => {
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/auth/register/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      setMessage(`Successfully registered ${username}. You can now log in.`);
      setView('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  // Handle mobile registration
  const handleMobileRegister = async (mobileNumber: string) => {
    setMessage('');
    setError('');
    
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

      setMessage(`Successfully registered ${mobileNumber}. You can now log in with OTP.`);
      setView('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setMessage('');
    setError('');
    
    try {
      await logout();
      setMessage('Successfully logged out');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Authentication Demo</h1>
        <p className="text-muted-foreground">
          Test the dual authentication system
        </p>
      </div>

      {isAuthenticated && user ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>You are logged in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">User Information:</p>
              <div className="bg-slate-50 p-3 rounded-md space-y-1 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                {user.username && <p><strong>Username:</strong> {user.username}</p>}
                {user.mobileNumber && <p><strong>Mobile:</strong> {user.mobileNumber}</p>}
                {user.email && <p><strong>Email:</strong> {user.email}</p>}
                {user.name && <p><strong>Name:</strong> {user.name}</p>}
              </div>
            </div>
            
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <Button
              variant={view === 'login' ? 'default' : 'outline'}
              onClick={() => setView('login')}
            >
              Login
            </Button>
            <Button
              variant={view === 'register' ? 'default' : 'outline'}
              onClick={() => setView('register')}
            >
              Register
            </Button>
          </div>

          {view === 'login' ? (
            <LoginForm
              onCredentialLogin={handleCredentialLogin}
              onOTPRequest={handleOTPRequest}
              onOTPVerify={handleOTPVerify}
            />
          ) : (
            <RegistrationForm
              onCredentialRegister={handleCredentialRegister}
              onMobileRegister={handleMobileRegister}
            />
          )}
        </>
      )}

      {message && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md w-full">
          <p className="text-sm text-center text-green-800">{message}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md w-full">
          <p className="text-sm text-center text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">
          <strong>Note:</strong> This page uses real API endpoints.
        </p>
        <p>
          Register a new account or log in with existing credentials to test the authentication system.
        </p>
      </div>
    </div>
  );
}
