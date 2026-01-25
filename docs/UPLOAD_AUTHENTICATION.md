# Upload Endpoint Authentication

## Overview

The upload endpoint (`POST /api/upload`) supports both **authenticated admin uploads** and **anonymous uploads** for different use cases:

- **Admin uploads**: Require authentication, can associate images with business ideas
- **Anonymous uploads**: No authentication required, images go to temporary storage for anonymous submissions

## Authentication Behavior

### Anonymous Uploads (No businessIdeaId)

When uploading without a `businessIdeaId`, the endpoint allows anonymous uploads:

```typescript
// Anonymous upload - no authentication required
const formData = new FormData();
formData.append('file', file);
// No businessIdeaId = anonymous upload to temp storage

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

**Use case**: Anonymous business idea submissions via `/submit` page

### Admin Uploads (With businessIdeaId)

When uploading with a `businessIdeaId`, admin authentication is required:

```typescript
// Admin upload - authentication required
const formData = new FormData();
formData.append('file', file);
formData.append('businessIdeaId', 'business-idea-id');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
  },
  body: formData,
});
```

**Use case**: Admin managing business ideas via admin panel

## Client-Side Implementation

The client-side code automatically includes the authentication token from localStorage when making authenticated upload requests. This is handled by the `api-client` utility module.

### Using the API Client

```typescript
import { uploadFile, deleteImage, reorderImages } from '@/lib/api-client';

// Admin upload with authentication (automatic)
const result = await uploadFile(file, businessIdeaId);

// Anonymous upload (no authentication needed)
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

// Delete an image (authentication is automatic)
const result = await deleteImage(imageId);

// Reorder images (authentication is automatic)
const result = await reorderImages(businessIdeaId, imageIds);
```

The API client automatically:
- ✅ Retrieves the session token from localStorage for admin operations
- ✅ Includes the Authorization header in authenticated requests
- ✅ Handles authentication errors gracefully
- ✅ Allows anonymous uploads when no businessIdeaId is provided

## Rate Limiting

Both anonymous and authenticated uploads are rate-limited:

- **Anonymous uploads**: Rate limited by IP address
- **Admin uploads**: Rate limited by user ID

## 401 Response for Admin Uploads

If you see a 401 response when uploading with a `businessIdeaId`:

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "AUTH_REQUIRED"
  }
}
```

**This is correct behavior!** It means the security is working as intended for admin operations.

## How to Upload Images

### Anonymous Upload (No Authentication)

For anonymous submissions, simply upload without a businessIdeaId:

```bash
# Anonymous upload - no authentication needed
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "img_xyz123",
    "url": "/api/images/img_xyz123?variant=full",
    "thumbnail": "/api/images/img_xyz123?variant=thumbnail",
    "medium": "/api/images/img_xyz123?variant=medium"
  }
}
```

### Admin Upload (With Authentication)

To upload images associated with a business idea, you must authenticate as an admin:

#### Step 1: Login as Admin

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

#### Step 2: Upload Image with Token and businessIdeaId

```bash
# Upload image with authentication
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer your-session-token-here" \
  -F "file=@/path/to/image.jpg" \
  -F "businessIdeaId=business-idea-id"
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

This dual-mode authentication approach:
- ✅ Allows anonymous users to submit business ideas with images
- ✅ Prevents unauthorized association of images with existing business ideas
- ✅ Protects server resources from abuse through rate limiting
- ✅ Ensures only admins can manage business idea content directly
- ✅ Provides audit trail of who uploaded what (for admin uploads)
- ✅ Isolates anonymous uploads in temporary storage until approved

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
