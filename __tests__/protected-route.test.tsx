/**
 * Tests for ProtectedRoute Component
 * Task 20: Integrate authentication with Next.js app
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should show loading state while checking authentication', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth-demo');
    });

    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when specified', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(
      <AuthProvider>
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('should render protected content when authenticated', async () => {
    localStorageMock.setItem('auth_session_token', 'valid-token');

    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'testuser',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, session: mockSession }),
    });

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render custom loading component when provided', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <AuthProvider>
        <ProtectedRoute loadingComponent={<div>Custom Loading</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
  });
});
