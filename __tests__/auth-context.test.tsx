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

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
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
      <button onClick={() => login('test-token', true)}>Login with Remember Me</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
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
      token: 'test-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'newuser',
        mobileNumber: null,
        email: null,
        name: null,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Mock will return success for any token validation
    (global.fetch as jest.Mock).mockResolvedValue({
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

    // Click login button (without remember me)
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Should be authenticated now
    await waitFor(() => {
      expect(screen.getByText('Authenticated: newuser')).toBeInTheDocument();
    });

    // Token should be stored in sessionStorage (not localStorage)
    expect(sessionStorageMock.getItem('auth_session_token')).toBe('test-token');
    expect(localStorageMock.getItem('auth_session_token')).toBeNull();
  });

  it('should handle login with remember me', async () => {
    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'test-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'remembereduser',
        mobileNumber: null,
        email: null,
        name: null,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Mock will return success for any token validation
    (global.fetch as jest.Mock).mockResolvedValue({
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

    // Click login with remember me button
    const rememberMeButton = screen.getByText('Login with Remember Me');
    await act(async () => {
      rememberMeButton.click();
    });

    // Should be authenticated now
    await waitFor(() => {
      expect(screen.getByText('Authenticated: remembereduser')).toBeInTheDocument();
    });

    // Token should be stored in localStorage (not sessionStorage)
    expect(localStorageMock.getItem('auth_session_token')).toBe('test-token');
    expect(localStorageMock.getItem('auth_remember_me')).toBe('true');
    expect(sessionStorageMock.getItem('auth_session_token')).toBeNull();
  });

  it('should handle logout successfully', async () => {
    localStorageMock.setItem('auth_session_token', 'stored-token');
    localStorageMock.setItem('auth_remember_me', 'true');
    localStorageMock.setItem('auth_intended_destination', '/protected/page');

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
        isAdmin: false,
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

    // Token should be removed from both storages
    expect(localStorageMock.getItem('auth_session_token')).toBeNull();
    expect(localStorageMock.getItem('auth_remember_me')).toBeNull();
    expect(sessionStorageMock.getItem('auth_session_token')).toBeNull();
    // Intended destination should also be cleared (Requirements 4.5)
    expect(localStorageMock.getItem('auth_intended_destination')).toBeNull();

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
    localStorageMock.setItem('auth_remember_me', 'true');

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

    // Invalid token should be removed from both storages
    expect(localStorageMock.getItem('auth_session_token')).toBeNull();
    expect(localStorageMock.getItem('auth_remember_me')).toBeNull();
    expect(sessionStorageMock.getItem('auth_session_token')).toBeNull();
  });

  it('should load session from sessionStorage when not remembered', async () => {
    sessionStorageMock.setItem('auth_session_token', 'session-token');

    const mockSession = {
      id: 'session-1',
      userId: 'user-1',
      token: 'session-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-1',
        username: 'sessionuser',
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
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Authenticated: sessionuser')).toBeInTheDocument();
    });

    // Should validate with the session token
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
        }),
      })
    );
  });
});
