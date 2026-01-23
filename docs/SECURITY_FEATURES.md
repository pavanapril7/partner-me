# Security Features

This document describes the security features implemented in the image upload system.

## Overview

The image upload system implements multiple layers of security to protect against common attacks and abuse:

1. **Rate Limiting** - Prevents resource exhaustion and abuse
2. **File Signature Validation** - Prevents file type spoofing
3. **Access Control** - Ensures only authorized users can upload and manage images

## 1. Rate Limiting

### Purpose
Prevents abuse and resource exhaustion by limiting the number of uploads per user within specific time windows.

### Implementation
- **Per-Minute Limit**: Maximum 10 uploads per minute (configurable via `MAX_UPLOADS_PER_MINUTE`)
- **Per-Hour Limit**: Maximum 50 uploads per hour (configurable via `MAX_UPLOADS_PER_HOUR`)

### Configuration
```env
# Upload Rate Limiting Configuration
MAX_UPLOADS_PER_HOUR=50
MAX_UPLOADS_PER_MINUTE=10
```

### Behavior
- When a user exceeds the rate limit, they receive a `429 Too Many Requests` response
- The response includes a `Retry-After` header indicating when they can try again
- Rate limits are tracked per user ID
- Old attempts are automatically cleaned up after the time window expires

### Response Format
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Upload rate limit exceeded. Maximum 10 uploads per minute.",
    "retryAfter": 45
  }
}
```

### API
```typescript
// Check if user is rate limited
const rateLimitCheck = checkUploadRateLimit(userId);
if (!rateLimitCheck.allowed) {
  // User is rate limited
  console.log(rateLimitCheck.reason);
  console.log(`Retry after ${rateLimitCheck.retryAfter} seconds`);
}

// Record an upload attempt
recordUploadAttempt(userId);

// Get upload statistics
const stats = getUploadStats(userId);
console.log(`Uploads last minute: ${stats.uploadsLastMinute}`);
console.log(`Uploads last hour: ${stats.uploadsLastHour}`);
console.log(`Remaining this minute: ${stats.remainingMinute}`);
console.log(`Remaining this hour: ${stats.remainingHour}`);
```

## 2. File Signature Validation

### Purpose
Prevents file type spoofing by validating the actual file content (magic bytes) in addition to the MIME type and file extension.

### Implementation
The system validates files at multiple levels:

1. **MIME Type Validation**: Checks the `Content-Type` header
2. **File Extension Validation**: Checks the file extension
3. **File Signature Validation**: Checks the magic bytes at the start of the file

### Supported File Types
- **JPEG**: `image/jpeg` (`.jpg`, `.jpeg`)
  - Signature: `FF D8 FF`
- **PNG**: `image/png` (`.png`)
  - Signature: `89 50 4E 47 0D 0A 1A 0A`
- **WebP**: `image/webp` (`.webp`)
  - Signature: `52 49 46 46` (RIFF) + `57 45 42 50` (WEBP) at offset 8
- **GIF**: `image/gif` (`.gif`)
  - Signature: `47 49 46 38 37 61` (GIF87a) or `47 49 46 38 39 61` (GIF89a)

### Enhanced WebP Validation
WebP files require additional validation because they use the RIFF container format:
- Must start with `RIFF` (bytes 0-3)
- Must contain `WEBP` at offset 8 (bytes 8-11)

This prevents other RIFF-based formats (like WAV or AVI) from being accepted as WebP images.

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "File signature does not match declared MIME type"
  }
}
```

### API
```typescript
// Validate file signature
const isValid = validateFileSignature(buffer, mimeType);

// Comprehensive validation (includes signature check)
const result = await validateImage(buffer, mimeType, filename);
if (!result.valid) {
  console.error(result.error);
}
```

## 3. Access Control

### Purpose
Ensures only authorized users (admins) can upload, manage, and delete images.

### Implementation

#### Admin Authentication
All image management endpoints require admin authentication:
- Upload endpoint: `POST /api/upload`
- Delete endpoint: `DELETE /api/images/[id]`
- Reorder endpoint: `PATCH /api/business-ideas/[id]/images/reorder`
- Business idea management: `POST`, `PUT`, `DELETE /api/business-ideas`

#### Authentication Flow
1. Client sends request with `Authorization: Bearer <token>` header
2. Server validates the session token
3. Server verifies the user has admin role (`isAdmin = true`)
4. If authentication fails, returns `401 Unauthorized`
5. If user is not admin, returns `403 Forbidden`

#### Business Idea Ownership Verification
When associating images with a business idea:
1. Server verifies the business idea exists
2. Server checks if the authenticated user has permission to modify it
3. Returns `404 Not Found` if business idea doesn't exist

### Error Responses

**Missing Authentication**:
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "AUTH_REQUIRED"
  }
}
```

**Invalid Session**:
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired session",
    "code": "INVALID_SESSION"
  }
}
```

**Insufficient Permissions**:
```json
{
  "success": false,
  "error": {
    "message": "Admin access required",
    "code": "FORBIDDEN"
  }
}
```

**Business Idea Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_IDEA_NOT_FOUND",
    "message": "Business idea not found"
  }
}
```

### API
```typescript
// Protect an API route with admin authentication
const authResult = await requireAdmin(request);
if (authResult.error) {
  return authResult.error;
}

// Access authenticated user
const user = authResult.user;
console.log(`Admin user: ${user.username} (${user.id})`);
```

## Additional Security Measures

### File Size Limits
- Maximum file size: 5MB (configurable via `MAX_IMAGE_SIZE`)
- Enforced at multiple levels: client, API route, and validation layer

### Dimension Validation
- Minimum dimensions: 200x200 pixels
- Maximum dimensions: 4096x4096 pixels
- Prevents extremely large images that could cause memory issues

### Metadata Stripping
- EXIF metadata is stripped from uploaded images
- Protects user privacy (removes GPS coordinates, camera info, etc.)
- Reduces file size

### Secure File Storage
- Files are stored with unique, unpredictable IDs (not sequential)
- Original filenames are sanitized and stored separately
- Storage paths prevent directory traversal attacks

### Content-Type Headers
- All served images include correct `Content-Type` headers
- Prevents MIME type confusion attacks

### Cache Headers
- Images are served with long cache headers (1 year)
- Includes `immutable` directive since images are identified by unique IDs
- Reduces server load and improves performance

## Best Practices

### For Developers

1. **Always validate on the server**: Never trust client-side validation alone
2. **Use the provided utilities**: Don't implement custom validation logic
3. **Check authentication**: Always use `requireAdmin()` for protected routes
4. **Handle errors gracefully**: Provide clear error messages without exposing sensitive information
5. **Log security events**: Log failed authentication attempts and rate limit violations

### For Administrators

1. **Monitor rate limits**: Watch for patterns of abuse
2. **Review upload logs**: Check for suspicious activity
3. **Keep limits reasonable**: Adjust rate limits based on legitimate usage patterns
4. **Rotate credentials**: Regularly rotate API keys and tokens
5. **Use HTTPS**: Always use HTTPS in production to protect authentication tokens

### For Production Deployment

1. **Use environment variables**: Never hardcode security settings
2. **Enable rate limiting**: Ensure rate limiting is properly configured
3. **Use Redis for rate limiting**: Replace in-memory storage with Redis in production
4. **Monitor storage usage**: Set up alerts for unusual storage growth
5. **Regular security audits**: Periodically review and update security measures

## Testing

### Rate Limiting Tests
```bash
npm test -- __tests__/upload-rate-limit.test.ts
```

### File Validation Tests
```bash
npm test -- __tests__/image-validation.test.ts
```

### Upload API Tests
```bash
npm test -- __tests__/api-upload.test.ts
```

## Troubleshooting

### Rate Limit Issues

**Problem**: Legitimate users are being rate limited
**Solution**: Increase the rate limits in environment variables

**Problem**: Rate limits not working
**Solution**: Verify environment variables are set correctly and the rate limit module is imported

### File Validation Issues

**Problem**: Valid images are being rejected
**Solution**: Check that the file signature matches the MIME type. Some image editors may modify file headers.

**Problem**: Invalid files are being accepted
**Solution**: Verify that file signature validation is enabled and working correctly

### Authentication Issues

**Problem**: Admin users can't upload images
**Solution**: Verify the user has `isAdmin = true` in the database and the session token is valid

**Problem**: Authentication headers not being sent
**Solution**: Ensure the client is sending the `Authorization: Bearer <token>` header

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [File Signatures (Magic Bytes)](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
