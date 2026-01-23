# Storage Module

This module provides an abstraction layer for file storage operations, supporting both local filesystem storage and cloud storage (S3-compatible services).

## Usage

### Basic Usage

```typescript
import { createStorageProvider } from '@/lib/storage';

// Create storage provider based on environment configuration
const storage = createStorageProvider();

// Upload a file
const filePath = await storage.upload(
  fileBuffer,
  'business-ideas/123/image.jpg',
  'image/jpeg'
);

// Get URL for accessing the file
const url = storage.getUrl(filePath);

// Check if file exists
const exists = await storage.exists(filePath);

// Delete a file
await storage.delete(filePath);
```

### Direct Provider Usage

```typescript
import { LocalStorageProvider, S3StorageProvider } from '@/lib/storage';

// Use local storage directly
const localStorage = new LocalStorageProvider({
  baseDir: './public/uploads',
});

// Use S3 storage directly
const s3Storage = new S3StorageProvider({
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
  endpoint: 'https://s3.amazonaws.com', // optional
});
```

## Configuration

### Environment Variables

#### Local Storage (default)

```env
STORAGE_TYPE=local
UPLOAD_DIR=./public/uploads
```

#### S3 Storage

```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com  # optional, for S3-compatible services
```

## Storage Providers

### LocalStorageProvider

Stores files in the local filesystem. Suitable for development and small deployments.

**Features:**
- Automatic directory creation
- Graceful handling of missing files
- URL generation for local files

### S3StorageProvider

Stores files in AWS S3 or S3-compatible services (MinIO, DigitalOcean Spaces, etc.).

**Features:**
- Full S3 API support
- Custom endpoint support for S3-compatible services
- Proper error handling for 404s

## Interface

All storage providers implement the `StorageProvider` interface:

```typescript
interface StorageProvider {
  upload(file: Buffer, path: string, mimeType: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
  exists(path: string): Promise<boolean>;
}
```

## File Organization

Recommended file organization structure:

```
uploads/
  business-ideas/
    {businessIdeaId}/
      {imageId}/
        full.jpg
        medium.webp
        thumbnail.webp
  temp/
    {imageId}/
      full.jpg
      medium.webp
      thumbnail.webp
```

## Error Handling

- **LocalStorageProvider**: Throws filesystem errors (ENOENT, EACCES, etc.)
- **S3StorageProvider**: Throws AWS SDK errors

Both providers handle missing files gracefully in the `delete()` method.
