/**
 * API Client Utilities
 * Provides helper functions for making authenticated API requests
 */

const SESSION_TOKEN_KEY = 'auth_session_token';

/**
 * Get the authentication token from localStorage or sessionStorage
 * Checks localStorage first (remember me), then sessionStorage (current session)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  // Check localStorage first (remember me enabled)
  const localToken = localStorage.getItem(SESSION_TOKEN_KEY);
  if (localToken) {
    return localToken;
  }
  // Fall back to sessionStorage (remember me disabled)
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Make an authenticated fetch request
 * Automatically includes the Authorization header if a token is available
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  return fetch(url, mergedOptions);
}

/**
 * Upload a file with authentication
 */
export async function uploadFile(
  file: File,
  businessIdeaId?: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    url: string;
    thumbnail: string;
    medium: string;
    filename: string;
    size: number;
    width: number;
    height: number;
  };
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (businessIdeaId) {
    formData.append('businessIdeaId', businessIdeaId);
  }

  const response = await authenticatedFetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Delete an image with authentication
 */
export async function deleteImage(imageId: string): Promise<{
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}> {
  const response = await authenticatedFetch(`/api/images/${imageId}`, {
    method: 'DELETE',
  });

  return response.json();
}

/**
 * Reorder images with authentication
 */
export async function reorderImages(
  businessIdeaId: string,
  imageIds: string[]
): Promise<{
  success: boolean;
  data?: {
    images: Array<{
      id: string;
      order: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  const response = await authenticatedFetch(
    `/api/business-ideas/${businessIdeaId}/images/reorder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds }),
    }
  );

  return response.json();
}
