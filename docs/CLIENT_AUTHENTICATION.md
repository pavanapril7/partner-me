# Client-Side Authentication Implementation

## Overview

This document explains how authentication is implemented on the client side for image upload and management operations.

## Authentication Flow

1. **User logs in** → Session token is stored in localStorage
2. **User uploads/deletes images** → Token is automatically included in requests
3. **Server validates token** → Returns 401 if invalid/missing, 403 if not admin

## API Client Utility

We've created a centralized API client utility (`src/lib/api-client.ts`) that handles authentication automatically.

### Key Functions

#### `getAuthToken()`
Retrieves the session token from localStorage.

```typescript
const token = getAuthToken();
// Returns: "session_token_here" or null
```

#### `getAuthHeaders()`
Returns authentication headers for API requests.

```typescript
const headers = getAuthHeaders();
// Returns: { Authorization: "Bearer session_token_here" } or {}
```

#### `authenticatedFetch(url, options)`
Makes a fetch request with automatic authentication.

```typescript
const response = await authenticatedFetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

#### `uploadFile(file, businessIdeaId?)`
Uploads a file with authentication.

```typescript
const result = await uploadFile(file, businessIdeaId);

if (result.success) {
  console.log('Uploaded:', result.data);
} else {
  console.error('Error:', result.error);
}
```

#### `deleteImage(imageId)`
Deletes an image with authentication.

```typescript
const result = await deleteImage(imageId);

if (result.success) {
  console.log('Deleted successfully');
} else {
  console.error('Error:', result.error);
}
```

#### `reorderImages(businessIdeaId, imageIds)`
Reorders images with authentication.

```typescript
const result = await reorderImages(businessIdeaId, imageIds);

if (result.success) {
  console.log('Reordered:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Component Integration

### AdminBusinessIdeaForm

The main form component uses the API client for all image operations:

```typescript
import { uploadFile, deleteImage } from '@/lib/api-client';

// Upload
const result = await uploadFile(file, businessIdea?.id);

// Delete
const result = await deleteImage(imageId);
```

### ImageUploadExample

The example component demonstrates proper usage:

```typescript
import { uploadFile, deleteImage } from '@/lib/api-client';

// Upload
const result = await uploadFile(file);

// Delete
const result = await deleteImage(imageId);
```

## Error Handling

The API client returns structured responses that make error handling easy:

### Success Response
```typescript
{
  success: true,
  data: {
    id: "img_123",
    url: "/api/images/img_123",
    thumbnail: "/api/images/img_123?variant=thumbnail",
    // ... other fields
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: "AUTH_REQUIRED",
    message: "Authentication required",
    retryAfter?: 60 // For rate limit errors
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED` - No authentication token provided
- `INVALID_SESSION` - Token is invalid or expired
- `FORBIDDEN` - User is not an admin
- `RATE_LIMIT_EXCEEDED` - Too many uploads
- `INVALID_FILE` - File validation failed
- `BUSINESS_IDEA_NOT_FOUND` - Business idea doesn't exist
- `NOT_FOUND` - Image not found
- `PROCESSING_ERROR` - Image processing failed
- `STORAGE_ERROR` - Storage operation failed

## Testing Authentication

### In Browser Console

```javascript
// Check if user is authenticated
const token = localStorage.getItem('auth_session_token');
console.log('Token:', token);

// Test upload (will fail if not authenticated)
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(r => r.json())
.then(console.log);
```

### Expected Behaviors

**When authenticated as admin:**
- ✅ Uploads succeed
- ✅ Deletes succeed
- ✅ Reorders succeed

**When not authenticated:**
- ❌ 401 - Authentication required

**When authenticated as non-admin:**
- ❌ 403 - Admin access required

**When rate limited:**
- ❌ 429 - Rate limit exceeded (with Retry-After header)

## Troubleshooting

### "Authentication required" error

**Cause**: No token in localStorage or token not being sent

**Solution**:
1. Check if user is logged in
2. Verify token exists: `localStorage.getItem('auth_session_token')`
3. Check browser network tab for Authorization header

### "Invalid or expired session" error

**Cause**: Token has expired or is invalid

**Solution**:
1. Log out and log back in
2. Check session expiry settings
3. Verify token format

### "Admin access required" error

**Cause**: User is authenticated but not an admin

**Solution**:
1. Verify user has `isAdmin = true` in database
2. Use admin account for uploads

### Authorization header not appearing in network tab

**Cause**: API client not being used or token not in localStorage

**Solution**:
1. Ensure components import from `@/lib/api-client`
2. Verify token is stored after login
3. Check that `getAuthToken()` returns a value

## Best Practices

### DO ✅

- Use the API client utilities for all authenticated requests
- Handle both success and error cases
- Show user-friendly error messages
- Log errors for debugging
- Check authentication state before showing upload UI

### DON'T ❌

- Don't make direct fetch calls without authentication
- Don't hardcode tokens
- Don't expose tokens in URLs or logs
- Don't ignore error responses
- Don't assume authentication will always work

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Token Transmission**: Always use HTTPS in production
3. **Token Expiration**: Tokens expire after configured period (default: 7 days)
4. **Rate Limiting**: Uploads are rate limited per user
5. **Admin Only**: Only admin users can upload/delete images

## Migration Guide

If you have existing code making direct fetch calls, migrate to the API client:

### Before
```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

### After
```typescript
import { uploadFile } from '@/lib/api-client';

const result = await uploadFile(file, businessIdeaId);
```

### Benefits
- ✅ Automatic authentication
- ✅ Consistent error handling
- ✅ Type-safe responses
- ✅ Easier to maintain
- ✅ Better error messages

## Related Documentation

- [Security Features](./SECURITY_FEATURES.md) - Complete security documentation
- [Upload Authentication](./UPLOAD_AUTHENTICATION.md) - Server-side authentication
- [Image Upload API](./IMAGE_UPLOAD_API.md) - API documentation
