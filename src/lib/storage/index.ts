import { StorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { S3StorageProvider } from './s3-provider';

/**
 * Create a storage provider based on environment configuration
 * @returns StorageProvider instance (LocalStorageProvider or S3StorageProvider)
 */
export function createStorageProvider(): StorageProvider {
  const storageType = process.env.STORAGE_TYPE || 'local';

  if (storageType === 's3') {
    // Validate required S3 environment variables
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 storage requires S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables'
      );
    }

    return new S3StorageProvider({
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      endpoint: process.env.S3_ENDPOINT,
    });
  }

  // Default to local storage
  const uploadDir = process.env.UPLOAD_DIR || './public/uploads';

  return new LocalStorageProvider({
    baseDir: uploadDir,
  });
}

// Export types and providers for testing and direct usage
export { LocalStorageProvider, S3StorageProvider };
export type { StorageProvider } from './types';
export * from './types';
