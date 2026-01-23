/**
 * Storage provider interface for handling file uploads and retrieval
 * Supports both local filesystem and cloud storage (S3-compatible)
 */
export interface StorageProvider {
  /**
   * Upload a file to storage
   * @param file - File buffer to upload
   * @param path - Storage path (relative to storage root)
   * @param mimeType - MIME type of the file
   * @returns Promise resolving to the storage path
   */
  upload(file: Buffer, path: string, mimeType: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param path - Storage path of the file to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(path: string): Promise<void>;

  /**
   * Get the URL for accessing a file
   * @param path - Storage path of the file
   * @returns URL string for accessing the file
   */
  getUrl(path: string): string;

  /**
   * Check if a file exists in storage
   * @param path - Storage path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;
}

/**
 * Configuration for local storage provider
 */
export interface LocalStorageConfig {
  baseDir: string; // Base directory for uploads (e.g., './public/uploads')
}

/**
 * Configuration for S3 storage provider
 */
export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // Optional, for S3-compatible services
}
