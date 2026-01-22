'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Authentication Context
 * Requirements: 6.4, 7.1
 * 
 * Provides authentication state and methods throughout the application:
 * - Session management with persistence
 * - Login/logout functionality
 * - User information access
 * - Loading states
 */

interface User {
  id: string;
  username: string | null;
  mobileNumber: string | null;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  user: User;
}

interface AuthContextType {
  // State
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Methods
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'auth_session_token';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Validate session with the API
   * Requirements: 6.4
   */
  const validateSession = useCallback(async (token: string): Promise<Session | null> => {
    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.session) {
        return data.session;
      }

      return null;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }, []);

  /**
   * Load session from storage and validate
   * Requirements: 6.4
   */
  const loadSession = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        return;
      }

      // Try to get token from localStorage
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!token) {
        setSession(null);
        return;
      }

      // Validate the token with the API
      const validatedSession = await validateSession(token);
      
      if (validatedSession) {
        setSession(validatedSession);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [validateSession]);

  /**
   * Login with a session token
   * Requirements: 6.4
   */
  const login = useCallback(async (token: string) => {
    try {
      // Validate the token
      const validatedSession = await validateSession(token);
      
      if (!validatedSession) {
        throw new Error('Invalid session token');
      }

      // Store token in localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      
      // Update state
      setSession(validatedSession);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [validateSession]);

  /**
   * Logout and invalidate session
   * Requirements: 7.1
   */
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (token) {
        // Call logout API to invalidate session on server
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and storage
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setSession(null);
    }
  }, []);

  /**
   * Refresh the current session
   * Requirements: 6.4
   */
  const refreshSession = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
