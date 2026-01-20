/**
 * Tests for Authentication Context
 * Task 20: Integrate authentication with Next.js app
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

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

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <p>Authenticated: {user.username || user.mobileNumber}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <p>Not authenticated</p>
      <button onClick={() => login('test-token')}>Login</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should start with unauthenticated state when no token in storage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('should validate stored token on mount', async () => {
    localStorageMock.setItem('auth_session_token', 'stored-token');

    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'stored-token',
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
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Authenticated: testuser')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer stored-token',
        }),
      })
    );
  });

  it('should handle login successfully', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'new-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'newuser',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session: mockSession }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Should be authenticated now
    await waitFor(() => {
      expect(screen.getByText('Authenticated: newuser')).toBeInTheDocument();
    });

    // Token should be stored
    expect(localStorageMock.getItem('auth_session_token')).toBe('new-token');
  });

  it('should handle logout successfully', async () => {
    localStorageMock.setItem('auth_session_token', 'stored-token');

    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'stored-token',
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

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, session: mockSession }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByText('Authenticated: testuser')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    // Should be logged out
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    // Token should be removed
    expect(localStorageMock.getItem('auth_session_token')).toBeNull();

    // Logout API should have been called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer stored-token',
        }),
      })
    );
  });

  it('should clear invalid token from storage', async () => {
    localStorageMock.setItem('auth_session_token', 'invalid-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });

    // Invalid token should be removed
    expect(localStorageMock.getItem('auth_session_token')).toBeNull();
  });
});
