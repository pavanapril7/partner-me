# Anonymous Submission Troubleshooting Guide

## Common Issues and Solutions

### 1. Upload Authentication Error ✅ FIXED

**Error**: `{"success": false,"error": {"message": "Authentication required","code": "AUTH_REQUIRED"}}`

**Solution**: The upload endpoint now supports anonymous uploads. No authentication is needed when uploading without a `businessIdeaId`.

**Documentation**: See `docs/ANONYMOUS_UPLOAD_FIX.md`

---

### 2. Prisma Client Missing Models ⚠️ NEEDS RESTART

**Error**: 
```
TypeError: Cannot read properties of undefined (reading 'create')
at tx.anonymousSubmission.create
```

**Root Cause**: The Prisma Client needs to be regenerated and the dev server needs to be restarted.

**Solution**:

```bash
# Step 1: Regenerate Prisma Client
npx prisma generate

# Step 2: Restart your dev server
# Stop current server (Ctrl+C), then:
npm run dev
```

**Why This Happens**: 
- The database schema was updated with new models
- Migrations were applied successfully
- But the running dev server is using the old Prisma Client
- The client needs to be regenerated to include the new models

**Documentation**: See `docs/PRISMA_CLIENT_REGENERATION.md`

---

### 3. Database Migration Not Applied

**Error**: Database errors about missing tables

**Check Migration Status**:
```bash
npx prisma migrate status
```

**Apply Migrations**:
```bash
npx prisma migrate deploy
```

---

### 4. Rate Limiting Issues

**Error**: `{"error": {"code": "RATE_LIMIT_EXCEEDED"}}`

**Cause**: Too many submissions from the same IP address

**Limits**:
- 2 submissions per hour per IP
- 3 submissions per 24 hours per IP

**Solution**: Wait for the retry-after period or test from a different IP

---

### 5. Image Upload Fails

**Possible Causes**:
- File too large (max 10MB)
- Invalid file type (only JPEG, PNG, GIF, WebP)
- Invalid dimensions (min 100x100, max 4000x4000)

**Check**:
```bash
# Verify storage directory exists
ls -la public/uploads/temp/
```

---

## Complete Setup Checklist

Before testing anonymous submissions, ensure:

- ✅ Database is running
- ✅ Migrations are applied: `npx prisma migrate status`
- ✅ Prisma Client is generated: `npx prisma generate`
- ✅ Dev server is running: `npm run dev`
- ✅ Upload directory exists: `public/uploads/temp/`

## Testing the Complete Flow

### 1. Test Image Upload (Anonymous)

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

Expected: Success with image ID

### 2. Test Anonymous Submission

```bash
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Idea",
    "description": "This is a test description with enough characters",
    "budgetMin": 1000,
    "budgetMax": 5000,
    "contactEmail": "test@example.com",
    "imageIds": ["img_xyz123"]
  }'
```

Expected: Success with submission ID

### 3. Verify in Database

```bash
npx prisma studio
```

Check the `AnonymousSubmission` table for your submission.

## Quick Fix for Most Issues

```bash
# Complete reset (development only!)
npx prisma generate
rm -rf .next
npm run dev
```

This will:
1. Regenerate Prisma Client with latest schema
2. Clear Next.js cache
3. Restart dev server with fresh state

## Getting Help

If issues persist:

1. Check the error logs in terminal
2. Verify database connection: `npx prisma db pull`
3. Check Prisma schema: `cat prisma/schema.prisma | grep AnonymousSubmission`
4. Verify migrations: `ls prisma/migrations/`

## Related Documentation

- `docs/ANONYMOUS_UPLOAD_FIX.md` - Upload authentication fix
- `docs/PRISMA_CLIENT_REGENERATION.md` - Prisma client issues
- `docs/ANONYMOUS_SUBMISSION_SYSTEM.md` - System overview
- `docs/RATE_LIMITING.md` - Rate limiting details
