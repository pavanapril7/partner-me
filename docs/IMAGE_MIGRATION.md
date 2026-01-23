# Image Migration Guide

This guide explains how to migrate existing business ideas from URL-based images to the new uploaded image system.

## Overview

The migration script (`scripts/migrate-url-images.ts`) automates the process of:
1. Finding business ideas with URL-based images
2. Downloading images from their URLs
3. Validating and processing them
4. Uploading to your configured storage system
5. Creating database records
6. Associating images with business ideas

## Prerequisites

Before running the migration:

1. **Backup your database**
   ```bash
   pg_dump partner-me > backup.sql
   ```

2. **Configure storage**
   - Ensure `STORAGE_TYPE` is set in `.env` (either `local` or `s3`)
   - For local storage, ensure `UPLOAD_DIR` exists and is writable
   - For S3 storage, ensure all S3 credentials are configured

3. **Verify database connection**
   ```bash
   npm run db:push
   ```

## Running the Migration

### Step 1: Dry Run (Recommended)

First, run a dry run to preview what will be migrated without making any changes:

```bash
npm run migrate:images:dry-run
```

This will:
- Show which business ideas will be migrated
- Download and validate images
- Report any errors without making changes
- Provide a summary of what would be migrated

### Step 2: Review the Output

Check the dry run output for:
- Number of business ideas found
- Number of images to be migrated
- Any validation errors or download failures
- Storage space requirements

### Step 3: Run the Actual Migration

Once you're satisfied with the dry run results:

```bash
npm run migrate:images
```

This will perform the actual migration, including:
- Downloading all images
- Processing and generating variants
- Uploading to storage
- Creating database records

## What Gets Migrated

The script migrates business ideas that:
- Have a non-empty `images` array (URL-based images)
- Don't have any uploaded images yet (no records in the `Image` table)

For each image URL:
- Downloads the image file
- Validates file type, size, and dimensions
- Generates three variants: thumbnail (300x300), medium (800x800), full (1920x1920)
- Uploads all variants to storage
- Creates `Image` and `ImageVariant` database records
- Preserves the original order of images

## Error Handling

The script handles errors gracefully:

- **Download failures**: Logs error and continues with next image
- **Validation failures**: Skips invalid images and continues
- **Storage failures**: Logs error and continues
- **Database errors**: Logs error and continues

At the end, you'll see a summary showing:
- Total images processed
- Number of successful migrations
- Number of failures
- Detailed error messages

## After Migration

### Verify the Migration

1. **Check the database**
   ```sql
   SELECT bi.title, COUNT(i.id) as image_count
   FROM business_ideas bi
   LEFT JOIN images i ON i."businessIdeaId" = bi.id
   GROUP BY bi.id, bi.title;
   ```

2. **Check storage**
   - For local: Check `./public/uploads/business-ideas/`
   - For S3: Check your S3 bucket

3. **Test the application**
   - View business ideas in the admin panel
   - Verify images display correctly
   - Check that all variants load properly

### Cleanup (Optional)

After verifying the migration is successful, you can:

1. **Remove URL-based images from the schema** (in a future migration)
   - The `images String[]` field can be removed once all data is migrated
   - This requires a schema change and database migration

2. **Run cleanup scripts**
   ```bash
   npm run cleanup:images
   ```

## Troubleshooting

### "No business ideas found that need migration"

This means either:
- All business ideas already have uploaded images
- No business ideas have URL-based images
- The migration was already completed

### "Failed to download: [URL]"

Possible causes:
- URL is no longer accessible
- Network connectivity issues
- Server blocking requests

Solutions:
- Verify the URL is still valid
- Check your network connection
- Try running the script again (it will skip already-migrated images)

### "Validation failed: [error]"

The image doesn't meet requirements:
- File type not supported (must be JPEG, PNG, WebP, or GIF)
- File size exceeds 5MB
- Dimensions outside acceptable range (200x200 to 4096x4096)

Solutions:
- Manually download and fix the image
- Update the URL to a valid image
- Skip this image and continue

### "Storage error: [error]"

Storage operation failed:
- For local: Check directory permissions
- For S3: Verify credentials and bucket access

Solutions:
- Check storage configuration in `.env`
- Verify permissions
- Check available disk space (for local storage)

### Database connection errors

Solutions:
- Verify `DATABASE_URL` in `.env`
- Ensure database is running
- Check database credentials

## Performance Considerations

- **Network speed**: Download time depends on image sizes and network speed
- **Processing time**: Image processing is CPU-intensive
- **Storage space**: Each image generates 3 variants, requiring ~3x storage
- **Database load**: Creates multiple records per image

For large migrations:
- Run during off-peak hours
- Monitor disk space
- Consider running in batches (modify script to limit number of business ideas)

## Rollback

If you need to rollback the migration:

1. **Restore database backup**
   ```bash
   psql partner-me < backup.sql
   ```

2. **Delete uploaded files**
   ```bash
   # For local storage
   rm -rf ./public/uploads/business-ideas/*
   
   # For S3 storage
   # Use AWS CLI or console to delete objects
   ```

## Support

If you encounter issues:
1. Check the error messages in the script output
2. Review this troubleshooting guide
3. Check the logs for detailed error information
4. Verify your environment configuration

## Requirements

This migration script satisfies requirements:
- **7.1**: Stores images in designated storage location
- **7.2**: Generates unique filenames to prevent collisions
- **7.4**: Stores image metadata including original filename, size, and upload timestamp
