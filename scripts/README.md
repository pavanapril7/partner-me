# Utility Scripts

This directory contains utility scripts for maintaining the image upload system, including cleanup operations and data migration.

## Migration Scripts

### migrate-url-images.ts

Migrates existing business ideas from URL-based images to the new uploaded image system.

**What it does:**
- Finds business ideas with URL-based images (in the `images` String[] field)
- Downloads each image from its URL
- Validates file type, size, and dimensions
- Processes images and generates variants (thumbnail, medium, full)
- Uploads to the configured storage system
- Creates Image and ImageVariant database records
- Associates images with business ideas in correct order

**Usage:**
```bash
# Dry run (preview without making changes)
npx tsx scripts/migrate-url-images.ts --dry-run

# Actual migration
npx tsx scripts/migrate-url-images.ts
```

**When to run:**
- One-time migration when deploying the new image upload system
- After importing business ideas from external sources
- When transitioning from URL-based to uploaded images

**Requirements:** 7.1, 7.2, 7.4

**Error handling:**
- Continues processing even if individual images fail
- Logs detailed error messages for failed downloads
- Provides summary of successful and failed migrations
- Gracefully handles network errors, invalid images, and storage failures

## Image Cleanup Scripts

### cleanup-orphaned-images.ts

Identifies and deletes orphaned images that are not associated with any business idea and are older than 24 hours.

**What it does:**
- Finds images in the database where `businessIdeaId` is `null`
- Filters for images created more than 24 hours ago
- Deletes the image files and all variants from storage
- Removes the database records

**Usage:**
```bash
npm run cleanup:orphaned
# or
npx tsx scripts/cleanup-orphaned-images.ts
```

**When to run:**
- Periodically (e.g., daily via cron job)
- After bulk operations that may leave orphaned images
- When storage space needs to be reclaimed

### cleanup-temp-images.ts

Identifies and deletes temporary images from incomplete business idea creation that are older than 24 hours.

**What it does:**
- Scans the `temp/` directory in the upload storage
- Identifies directories older than 24 hours
- Deletes the entire directory and all its contents

**Usage:**
```bash
npm run cleanup:temp
# or
npx tsx scripts/cleanup-temp-images.ts
```

**When to run:**
- Periodically (e.g., daily via cron job)
- When users abandon business idea creation without completing it
- When storage space needs to be reclaimed

### cleanup-images.ts

Combined script that runs both orphaned and temp image cleanup operations.

**Usage:**
```bash
npm run cleanup:images
# or
npx tsx scripts/cleanup-images.ts
```

**When to run:**
- As a comprehensive cleanup operation
- In scheduled maintenance windows
- Before storage audits

## Scheduling Cleanup

For production environments, it's recommended to schedule these scripts to run automatically:

### Using cron (Linux/macOS)

Add to your crontab:
```bash
# Run cleanup daily at 2 AM
0 2 * * * cd /path/to/project && npm run cleanup:images >> /var/log/image-cleanup.log 2>&1
```

### Using systemd timer (Linux)

Create a systemd service and timer for automated cleanup.

### Using PM2 (Node.js process manager)

Use PM2's cron feature:
```bash
pm2 start scripts/cleanup-images.ts --cron "0 2 * * *"
```

### Using cloud schedulers

- **AWS**: Use CloudWatch Events or EventBridge
- **Google Cloud**: Use Cloud Scheduler
- **Azure**: Use Azure Functions with timer triggers

## Monitoring

The scripts provide detailed logging output:
- ✓ Success indicators for completed operations
- ✗ Error indicators for failed operations
- Summary statistics at the end

Exit codes:
- `0`: Success (no errors)
- `1`: Errors occurred during cleanup

## Safety Features

1. **24-hour grace period**: Only deletes images older than 24 hours to prevent accidental deletion of in-progress uploads
2. **Detailed logging**: All operations are logged for audit trails
3. **Error handling**: Continues processing even if individual deletions fail
4. **Database consistency**: Uses Prisma's cascade delete to maintain referential integrity

## Environment Variables

The scripts respect the following environment variables:

- `STORAGE_TYPE`: `local` or `s3` (determines storage backend)
- `UPLOAD_DIR`: Base directory for local storage (default: `./public/uploads`)
- `S3_BUCKET`, `S3_REGION`, etc.: S3 configuration (if using S3 storage)
- `DATABASE_URL`: PostgreSQL connection string

## Troubleshooting

### Script fails with "Cannot find module"

Ensure all dependencies are installed:
```bash
npm install
```

### Script fails with database connection error

Check your `DATABASE_URL` environment variable:
```bash
echo $DATABASE_URL
```

### Script reports errors deleting files

- Check file permissions
- Verify storage configuration
- Check if files were already deleted manually

### No images found to clean up

This is normal if:
- No orphaned or temp images exist
- All images are less than 24 hours old
- Cleanup was recently run
