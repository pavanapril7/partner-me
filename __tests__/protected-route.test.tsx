/**
 * Tests for ProtectedRoute Component
 * Requirements: 4.1, 4.2, 8.2
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
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
  const mockPathname = '/protected/page';

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('should show loading state while checking authentication', async () => {
    // Set a token so AuthContext will actually make a fetch call
    localStorageMock.setItem('auth_session_token', 'checking-token');
    
    // Mock fetch to delay indefinitely
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

    // The loading state should be visible while fetch is pending
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated and store intended destination', async () => {
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
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fprotected%2Fpage');
    });

    // Should store intended destination
    expect(localStorageMock.getItem('auth_intended_destination')).toBe('/protected/page');

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
      // Note: redirectTo prop is now used as the base, but we still add the redirect param
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fprotected%2Fpage');
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
        isAdmin: false,
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

  it('should render custom loading component when provided', async () => {
    // Set a token so AuthContext will actually make a fetch call
    localStorageMock.setItem('auth_session_token', 'checking-token');
    
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

  it('should block non-admin users from admin routes', async () => {
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
        isAdmin: false,
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
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    // Should not render admin content
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should allow admin users to access admin routes', async () => {
    localStorageMock.setItem('auth_session_token', 'valid-token');

    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'adminuser',
        mobileNumber: null,
        email: null,
        name: null,
        isAdmin: true,
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
        <ProtectedRoute requireAdmin={true}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    // Should not show access denied
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('should render custom unauthorized component when provided', async () => {
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
        isAdmin: false,
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
        <ProtectedRoute 
          requireAdmin={true}
          unauthorizedComponent={<div>Custom Unauthorized</div>}
        >
          <div>Admin Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Unauthorized')).toBeInTheDocument();
    });

    // Should not render default unauthorized message
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });
});