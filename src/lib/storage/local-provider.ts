import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageProvider, LocalStorageConfig } from './types';

/**
 * Local filesystem storage provider
 * Stores files in the local filesystem (e.g., ./public/uploads)
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(config: LocalStorageConfig) {
    this.baseDir = config.baseDir;
  }

  /**
   * Upload a file to local storage
   */
  async upload(
    file: Buffer,
    filePath: string,
    _mimeType: string
  ): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const directory = path.dirname(fullPath);

    // Create directory structure if it doesn't exist
    await fs.mkdir(directory, { recursive: true });

    // Write file to disk
    await fs.writeFile(fullPath, file);

    return filePath;
  }

  /**
   * Delete a file from local storage
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // If file doesn't exist, consider it already deleted
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get URL for accessing a file
   * For local storage, returns a relative URL path
   */
  getUrl(filePath: string): string {
    // Convert filesystem path to URL path
    // Assuming baseDir is './public/uploads', we want '/uploads/...'
    const relativePath = filePath.replace(/\\/g, '/');
    
    // Extract the path after 'public/'
    if (this.baseDir.includes('public')) {
      return `/${relativePath}`;
    }
    
    // Fallback: return the path as-is
    return `/${relativePath}`;
  }

  /**
   * Check if a file exists in local storage
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
