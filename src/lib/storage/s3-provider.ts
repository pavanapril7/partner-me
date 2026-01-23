import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider, S3StorageConfig } from './types';

/**
 * S3-compatible cloud storage provider
 * Supports AWS S3 and S3-compatible services
 */
export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint?: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;

    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),
    });
  }

  /**
   * Upload a file to S3
   */
  async upload(file: Buffer, path: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    return path;
  }

  /**
   * Delete a file from S3
   */
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get URL for accessing a file in S3
   * Returns the public S3 URL or custom endpoint URL
   */
  getUrl(path: string): string {
    if (this.endpoint) {
      // Custom endpoint (e.g., CloudFront, MinIO)
      const baseUrl = this.endpoint.replace(/\/$/, '');
      return `${baseUrl}/${this.bucket}/${path}`;
    }

    // Standard S3 URL
    const region = this.s3Client.config.region;
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${path}`;
  }

  /**
   * Check if a file exists in S3
   */
  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      // If error is 404 (NotFound), file doesn't exist
      const httpStatusCode = (error as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      
      if (httpStatusCode === 404) {
        return false;
      }
      // For other errors, rethrow
      throw error;
    }
  }
}
