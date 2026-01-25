# Anonymous Upload Fix

## Issue

The `/api/upload` endpoint was requiring authentication for all uploads, which prevented anonymous users from uploading images when submitting business ideas through the `/submit` page.

**Error**: `{"success": false,"error": {"message": "Authentication required","code": "AUTH_REQUIRED"}}`

## Root Cause

The upload endpoint was calling `requireAdmin()` for all requests, regardless of whether the upload was for an anonymous submission or an admin-managed business idea.

## Solution

Modified `/api/upload` route to support **dual-mode authentication**:

### Anonymous Uploads (No businessIdeaId)
- **No authentication required**
- Images uploaded to temporary storage (`/temp/`)
- Rate limited by IP address
- Used for anonymous business idea submissions

### Admin Uploads (With businessIdeaId)
- **Authentication required**
- Images associated with specific business idea
- Rate limited by user ID
- Used for admin-managed business ideas

## Implementation Details

### Code Changes

**File**: `src/app/api/upload/route.ts`

```typescript
// Determine if this is an authenticated or anonymous upload
let userId: string | null = null;
let isAnonymous = false;

// Try to authenticate - if businessIdeaId is provided, require admin auth
if (businessIdeaId) {
  const authResult = await requireAdmin(request);
  if (authResult.error) {
    return authResult.error;
  }
  userId = authResult.user.id;
} else {
  // Anonymous upload to temp storage
  isAnonymous = true;
}

// Check rate limit based on upload type
if (isAnonymous) {
  // For anonymous uploads, use IP-based rate limiting
  const ip = extractIpAddress(request);
  rateLimitCheck = checkUploadRateLimit(ip);
} else {
  // For authenticated uploads, use user ID
  rateLimitCheck = checkUploadRateLimit(userId!);
}
```

### Storage Paths

- **Anonymous uploads**: `temp/{imageId}/`
- **Admin uploads**: `business-ideas/{businessIdeaId}/{imageId}/`

### Rate Limiting

Both upload types are rate-limited but tracked separately:
- Anonymous: By IP address
- Admin: By user ID

## Testing

### Test Anonymous Upload

```bash
# No authentication needed
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "img_xyz123",
    "url": "/api/images/img_xyz123?variant=full",
    "thumbnail": "/api/images/img_xyz123?variant=thumbnail"
  }
}
```

### Test Admin Upload

```bash
# Authentication required when businessIdeaId is provided
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.jpg" \
  -F "businessIdeaId=<id>"
```

## Impact

### What Works Now ✅
- Anonymous users can upload images for submissions
- Anonymous submission form works end-to-end
- Admin uploads still require authentication
- Rate limiting works for both modes

### What's Protected 🔒
- Only admins can associate images with business ideas
- Anonymous uploads go to isolated temp storage
- Rate limiting prevents abuse from both sources

## Related Files

- `src/app/api/upload/route.ts` - Upload endpoint
- `src/components/business-ideas/AnonymousSubmissionForm.tsx` - Uses anonymous upload
- `docs/UPLOAD_AUTHENTICATION.md` - Updated documentation
- `docs/ANONYMOUS_SUBMISSION_SYSTEM.md` - System overview

## Verification

Run the test suite to verify:
```bash
npm test -- __tests__/api-upload.test.ts
```

All tests should pass ✅
