/**
 * Authentication Utility Functions
 * Requirements: 4.2, 4.3, 4.4, 8.2
 * 
 * Provides utility functions for:
 * - Redirect URL handling and parsing
 * - Intended destination storage and retrieval
 * - Admin route checking
 * - Login URL creation with redirect parameters
 */

// ============================================================================
// Constants
// ============================================================================

const INTENDED_DESTINATION_KEY = 'auth_intended_destination';
const SESSION_TOKEN_KEY = 'auth_session_token';
const REMEMBER_ME_KEY = 'auth_remember_me';

// Admin route patterns
const ADMIN_ROUTE_PATTERNS = [
  /^\/admin\//,           // Any route starting with /admin/
  /^\/admin$/,            // Exact /admin route
];

// ============================================================================
// Redirect URL Handling
// ============================================================================

/**
 * Get redirect URL from query parameters
 * Requirements: 4.2, 4.3
 * 
 * Extracts the redirect destination from URL search parameters.
 * Validates that the redirect URL is a relative path to prevent open redirects.
 * 
 * @param searchParams - URLSearchParams object from the current URL
 * @returns The redirect path if valid, null otherwise
 * 
 * @example
 * const params = new URLSearchParams('?redirect=/protected/page');
 * const redirect = getRedirectUrl(params); // Returns: '/protected/page'
 */
export function getRedirectUrl(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get('redirect');
  
  if (!redirect) {
    return null;
  }
  
  // Security: Only allow relative paths (must start with /)
  // This prevents open redirect vulnerabilities
  if (!redirect.startsWith('/')) {
    return null;
  }
  
  // Security: Prevent protocol-relative URLs (//example.com)
  if (redirect.startsWith('//')) {
    return null;
  }
  
  return redirect;
}

/**
 * Create login URL with redirect parameter
 * Requirements: 4.2, 4.3
 * 
 * Constructs a login URL with an optional redirect destination.
 * Used when redirecting unauthenticated users to preserve their intended destination.
 * 
 * @param redirectTo - Optional path to redirect to after login
 * @returns Login URL with redirect parameter if provided
 * 
 * @example
 * createLoginUrl('/protected/page'); // Returns: '/login?redirect=/protected/page'
 * createLoginUrl(); // Returns: '/login'
 */
export function createLoginUrl(redirectTo?: string): string {
  if (!redirectTo) {
    return '/login';
  }
  
  // Validate redirect path
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/login';
  }
  
  const params = new URLSearchParams({ redirect: redirectTo });
  return `/login?${params.toString()}`;
}

// ============================================================================
// Intended Destination Storage
// ============================================================================

/**
 * Store intended destination in localStorage
 * Requirements: 4.2, 4.3
 * 
 * Saves the path a user was trying to access before being redirected to login.
 * This allows redirecting them back after successful authentication.
 * 
 * @param path - The path to store as intended destination
 * 
 * @example
 * storeIntendedDestination('/admin/dashboard');
 */
export function storeIntendedDestination(path: string): void {
  // Only store if we're in the browser
  if (typeof window === 'undefined') {
    return;
  }
  
  // Validate path
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return;
  }
  
  // Don't store auth pages as intended destinations
  if (path === '/login' || path === '/register') {
    return;
  }
  
  try {
    localStorage.setItem(INTENDED_DESTINATION_KEY, path);
  } catch (error) {
    // Silently fail if localStorage is not available
    console.error('Failed to store intended destination:', error);
  }
}

/**
 * Get and clear intended destination from localStorage
 * Requirements: 4.3, 4.4
 * 
 * Retrieves the stored intended destination and removes it from storage.
 * This ensures the redirect only happens once after login.
 * 
 * @returns The stored path if it exists, null otherwise
 * 
 * @example
 * const destination = getIntendedDestination(); // Returns: '/admin/dashboard'
 * // Subsequent calls return null as it's been cleared
 */
export function getIntendedDestination(): string | null {
  // Only access localStorage in the browser
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const destination = localStorage.getItem(INTENDED_DESTINATION_KEY);
    
    if (destination) {
      // Clear it immediately to prevent reuse
      localStorage.removeItem(INTENDED_DESTINATION_KEY);
      
      // Validate before returning
      if (destination.startsWith('/') && !destination.startsWith('//')) {
        return destination;
      }
    }
    
    return null;
  } catch (error) {
    // Silently fail if localStorage is not available
    console.error('Failed to get intended destination:', error);
    return null;
  }
}

/**
 * Clear intended destination from localStorage
 * 
 * Removes the stored intended destination without returning it.
 * Useful for cleanup operations.
 */
export function clearIntendedDestination(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(INTENDED_DESTINATION_KEY);
  } catch (error) {
    console.error('Failed to clear intended destination:', error);
  }
}

// ============================================================================
// Admin Route Checking
// ============================================================================

/**
 * Check if a route requires admin privileges
 * Requirements: 8.2
 * 
 * Determines if a given pathname is an admin route that requires
 * admin privileges to access.
 * 
 * @param pathname - The pathname to check (e.g., '/admin/dashboard')
 * @returns true if the route requires admin privileges, false otherwise
 * 
 * @example
 * requiresAdmin('/admin/business-ideas'); // Returns: true
 * requiresAdmin('/business-ideas'); // Returns: false
 * requiresAdmin('/admin'); // Returns: true
 */
export function requiresAdmin(pathname: string): boolean {
  if (!pathname) {
    return false;
  }
  
  // Check against all admin route patterns
  return ADMIN_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Check if current user is admin
 * 
 * Helper function to check if the current user has admin privileges.
 * This checks the user object structure from the session.
 * 
 * @param user - User object from session (can be null)
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(user: { isAdmin?: boolean } | null | undefined): boolean {
  return user?.isAdmin === true;
}

// ============================================================================
// Session Storage Helpers
// ============================================================================

/**
 * Get session token from storage
 * 
 * Retrieves the stored session token from localStorage.
 * 
 * @returns The session token if it exists, null otherwise
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * Store session token
 * 
 * Saves the session token to localStorage.
 * 
 * @param token - The session token to store
 */
export function storeSessionToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store session token:', error);
  }
}

/**
 * Clear session token from storage
 * 
 * Removes the session token from localStorage.
 */
export function clearSessionToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear session token:', error);
  }
}

/**
 * Get remember me preference
 * 
 * Retrieves the remember me preference from localStorage.
 * 
 * @returns true if remember me is enabled, false otherwise
 */
export function getRememberMe(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const value = localStorage.getItem(REMEMBER_ME_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to get remember me preference:', error);
    return false;
  }
}

/**
 * Store remember me preference
 * 
 * Saves the remember me preference to localStorage.
 * 
 * @param rememberMe - Whether to remember the user
 */
export function storeRememberMe(rememberMe: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
  } catch (error) {
    console.error('Failed to store remember me preference:', error);
  }
}

/**
 * Clear remember me preference
 * 
 * Removes the remember me preference from localStorage.
 */
export function clearRememberMe(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Failed to clear remember me preference:', error);
  }
}

/**
 * Clear all authentication data from storage
 * Requirements: 4.5
 * 
 * Removes all authentication-related data from localStorage.
 * Used during logout to ensure complete cleanup.
 */
export function clearAllAuthData(): void {
  clearSessionToken();
  clearRememberMe();
  clearIntendedDestination();
}
