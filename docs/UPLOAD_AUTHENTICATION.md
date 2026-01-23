# Upload Endpoint Authentication

## Expected Behavior

The upload endpoint (`POST /api/upload`) requires admin authentication. This is a security feature implemented in Task 22.3.

## Client-Side Implementation

The client-side code automatically includes the authentication token from localStorage when making upload requests. This is handled by the `api-client` utility module.

### Using the API Client

```typescript
import { uploadFile, deleteImage, reorderImages } from '@/lib/api-client';

// Upload a file (authentication is automatic)
const result = await uploadFile(file, businessIdeaId);

// Delete an image (authentication is automatic)
const result = await deleteImage(imageId);

// Reorder images (authentication is automatic)
const result = await reorderImages(businessIdeaId, imageIds);
```

The API client automatically:
- ✅ Retrieves the session token from localStorage
- ✅ Includes the Authorization header in all requests
- ✅ Handles authentication errors gracefully

## 401 Response Means Authentication is Working

If you see a 401 response when testing the upload endpoint:

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "AUTH_REQUIRED"
  }
}
```

**This is correct behavior!** It means the security is working as intended.

## How to Upload Images

To successfully upload images, you must:

1. **Authenticate as an admin user** first
2. **Include the session token** in the request

### Step 1: Login as Admin

```bash
# Login with admin credentials
curl -X POST http://localhost:3000/api/auth/login/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Response will include a token:
```json
{
  "success": true,
  "data": {
    "token": "your-session-token-here",
    "user": { ... }
  }
}
```

### Step 2: Upload Image with Token

```bash
# Upload image with authentication
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer your-session-token-here" \
  -F "file=@/path/to/image.jpg"
```

## Creating an Admin User

If you don't have an admin user yet, create one using the script:

```bash
npm run create-admin
```

Or manually in the database:

```sql
UPDATE users 
SET "isAdmin" = true 
WHERE username = 'your-username';
```

## Testing with Admin Authentication

When writing tests or using the API, always include the Authorization header:

```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
  },
  body: formData,
});
```

## Security Benefits

This authentication requirement:
- ✅ Prevents unauthorized users from uploading images
- ✅ Protects server resources from abuse
- ✅ Ensures only admins can manage business idea content
- ✅ Provides audit trail of who uploaded what

## Troubleshooting

### 401 - Authentication Required
**Cause**: No Authorization header provided
**Solution**: Include `Authorization: Bearer <token>` header

### 401 - Invalid or Expired Session
**Cause**: Token is invalid or has expired
**Solution**: Login again to get a new token

### 403 - Admin Access Required
**Cause**: User is authenticated but not an admin
**Solution**: Ensure the user has `isAdmin = true` in the database

### 429 - Rate Limit Exceeded
**Cause**: Too many uploads in a short time
**Solution**: Wait for the retry-after period and try again

## Related Documentation

- [Security Features](./SECURITY_FEATURES.md) - Complete security documentation
- [Image Upload API](./IMAGE_UPLOAD_API.md) - API documentation
- [Authentication Integration](./AUTHENTICATION_INTEGRATION.md) - Authentication system details
