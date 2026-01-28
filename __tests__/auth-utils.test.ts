/**
 * Unit tests for authentication utility functions
 * Requirements: 4.2, 4.3, 4.4, 8.2
 */

import {
  getRedirectUrl,
  createLoginUrl,
  storeIntendedDestination,
  getIntendedDestination,
  clearIntendedDestination,
  requiresAdmin,
  isAdmin,
  getSessionToken,
  storeSessionToken,
  clearSessionToken,
  getRememberMe,
  storeRememberMe,
  clearRememberMe,
  clearAllAuthData,
} from '@/lib/auth-utils';

describe('Auth Utils - Redirect URL Handling', () => {
  describe('getRedirectUrl', () => {
    it('should extract redirect URL from search params', () => {
      const params = new URLSearchParams('?redirect=/protected/page');
      const result = getRedirectUrl(params);
      expect(result).toBe('/protected/page');
    });

    it('should return null when no redirect param exists', () => {
      const params = new URLSearchParams('?other=value');
      const result = getRedirectUrl(params);
      expect(result).toBeNull();
    });

    it('should reject non-relative URLs', () => {
      const params = new URLSearchParams('?redirect=https://evil.com');
      const result = getRedirectUrl(params);
      expect(result).toBeNull();
    });

    it('should reject protocol-relative URLs', () => {
      const params = new URLSearchParams('?redirect=//evil.com');
      const result = getRedirectUrl(params);
      expect(result).toBeNull();
    });

    it('should accept valid relative paths', () => {
      const params = new URLSearchParams('?redirect=/admin/dashboard');
      const result = getRedirectUrl(params);
      expect(result).toBe('/admin/dashboard');
    });
  });

  describe('createLoginUrl', () => {
    it('should create login URL without redirect', () => {
      const result = createLoginUrl();
      expect(result).toBe('/login');
    });

    it('should create login URL with redirect parameter', () => {
      const result = createLoginUrl('/protected/page');
      expect(result).toBe('/login?redirect=%2Fprotected%2Fpage');
    });

    it('should reject invalid redirect paths', () => {
      const result = createLoginUrl('https://evil.com');
      expect(result).toBe('/login');
    });

    it('should reject protocol-relative URLs', () => {
      const result = createLoginUrl('//evil.com');
      expect(result).toBe('/login');
    });
  });
});

describe('Auth Utils - Intended Destination Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storeIntendedDestination', () => {
    it('should store valid path in localStorage', () => {
      storeIntendedDestination('/protected/page');
      expect(localStorage.getItem('auth_intended_destination')).toBe('/protected/page');
    });

    it('should not store login page as destination', () => {
      storeIntendedDestination('/login');
      expect(localStorage.getItem('auth_intended_destination')).toBeNull();
    });

    it('should not store register page as destination', () => {
      storeIntendedDestination('/register');
      expect(localStorage.getItem('auth_intended_destination')).toBeNull();
    });

    it('should not store invalid paths', () => {
      storeIntendedDestination('//evil.com');
      expect(localStorage.getItem('auth_intended_destination')).toBeNull();
    });
  });

  describe('getIntendedDestination', () => {
    it('should retrieve and clear stored destination', () => {
      localStorage.setItem('auth_intended_destination', '/protected/page');
      
      const result = getIntendedDestination();
      expect(result).toBe('/protected/page');
      
      // Should be cleared after retrieval
      expect(localStorage.getItem('auth_intended_destination')).toBeNull();
    });

    it('should return null when no destination stored', () => {
      const result = getIntendedDestination();
      expect(result).toBeNull();
    });

    it('should validate stored path before returning', () => {
      localStorage.setItem('auth_intended_destination', '//evil.com');
      
      const result = getIntendedDestination();
      expect(result).toBeNull();
    });
  });

  describe('clearIntendedDestination', () => {
    it('should clear stored destination', () => {
      localStorage.setItem('auth_intended_destination', '/protected/page');
      
      clearIntendedDestination();
      
      expect(localStorage.getItem('auth_intended_destination')).toBeNull();
    });
  });
});

describe('Auth Utils - Admin Route Checking', () => {
  describe('requiresAdmin', () => {
    it('should return true for /admin routes', () => {
      expect(requiresAdmin('/admin')).toBe(true);
      expect(requiresAdmin('/admin/')).toBe(true);
      expect(requiresAdmin('/admin/business-ideas')).toBe(true);
      expect(requiresAdmin('/admin/submissions')).toBe(true);
      expect(requiresAdmin('/admin/submissions/123')).toBe(true);
    });

    it('should return false for non-admin routes', () => {
      expect(requiresAdmin('/')).toBe(false);
      expect(requiresAdmin('/login')).toBe(false);
      expect(requiresAdmin('/business-ideas')).toBe(false);
      expect(requiresAdmin('/protected')).toBe(false);
    });

    it('should return false for empty pathname', () => {
      expect(requiresAdmin('')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const user = { isAdmin: true };
      expect(isAdmin(user)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const user = { isAdmin: false };
      expect(isAdmin(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('should return false for user without isAdmin property', () => {
      const user = {};
      expect(isAdmin(user)).toBe(false);
    });
  });
});

describe('Auth Utils - Session Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Session Token', () => {
    it('should store and retrieve session token', () => {
      const token = 'test-token-123';
      storeSessionToken(token);
      
      expect(getSessionToken()).toBe(token);
    });

    it('should return null when no token stored', () => {
      expect(getSessionToken()).toBeNull();
    });

    it('should clear session token', () => {
      storeSessionToken('test-token');
      clearSessionToken();
      
      expect(getSessionToken()).toBeNull();
    });
  });

  describe('Remember Me', () => {
    it('should store and retrieve remember me preference', () => {
      storeRememberMe(true);
      expect(getRememberMe()).toBe(true);
      
      storeRememberMe(false);
      expect(getRememberMe()).toBe(false);
    });

    it('should return false when no preference stored', () => {
      expect(getRememberMe()).toBe(false);
    });

    it('should clear remember me preference', () => {
      storeRememberMe(true);
      clearRememberMe();
      
      expect(getRememberMe()).toBe(false);
    });
  });

  describe('clearAllAuthData', () => {
    it('should clear all authentication data', () => {
      // Set up all auth data
      storeSessionToken('test-token');
      storeRememberMe(true);
      storeIntendedDestination('/protected/page');
      
      // Clear all
      clearAllAuthData();
      
      // Verify all cleared
      expect(getSessionToken()).toBeNull();
      expect(getRememberMe()).toBe(false);
      expect(getIntendedDestination()).toBeNull();
    });
  });
});
