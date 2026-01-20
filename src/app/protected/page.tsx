'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Protected Page Example
 * Requirements: 6.4
 * 
 * This page demonstrates the ProtectedRoute component.
 * Only authenticated users can access this page.
 */
function ProtectedContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Protected Page</CardTitle>
          <CardDescription>
            This page is only accessible to authenticated users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Information:</p>
            <div className="bg-slate-50 p-4 rounded-md space-y-2 text-sm">
              <p><strong>User ID:</strong> {user?.id}</p>
              {user?.username && <p><strong>Username:</strong> {user.username}</p>}
              {user?.mobileNumber && <p><strong>Mobile Number:</strong> {user.mobileNumber}</p>}
              {user?.email && <p><strong>Email:</strong> {user.email}</p>}
              {user?.name && <p><strong>Name:</strong> {user.name}</p>}
              <p><strong>Account Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              This is a protected route. If you weren't logged in, you would have been 
              automatically redirected to the login page.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              The ProtectedRoute component checks your authentication status and manages 
              redirects automatically.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/auth-demo">
              <Button variant="outline">
                Back to Auth Demo
              </Button>
            </Link>
            <Button 
              onClick={logout}
              variant="destructive"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <ProtectedContent />
    </ProtectedRoute>
  );
}
