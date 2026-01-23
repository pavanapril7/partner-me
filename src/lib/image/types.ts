/**
 * Image processing and validation types
 */

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  metadata?: ImageMetadata;
}

export interface ImageVariantConfig {
  width: number;
  height: number;
  quality: number;
  fit: 'cover' | 'contain' | 'inside';
}

export interface ProcessedImageVariant {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ProcessedImage {
  thumbnail: ProcessedImageVariant;
  medium: ProcessedImageVariant;
  full: ProcessedImageVariant;
  originalMetadata: ImageMetadata;
}

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// File signature (magic bytes) for image types
export const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
};

/**
 * Additional validation for WebP files
 * WebP files start with RIFF and contain WEBP at offset 8
 */
export const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

// Validation constraints
export const VALIDATION_CONSTRAINTS = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10), // 5MB default
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
} as const;

// Image variant configurations
export const VARIANT_CONFIGS = {
  thumbnail: {
    width: 300,
    height: 300,
    quality: parseInt(process.env.IMAGE_QUALITY_THUMBNAIL || '80', 10),
    fit: 'cover' as const,
  },
  medium: {
    width: 800,
    height: 800,
    quality: parseInt(process.env.IMAGE_QUALITY_MEDIUM || '85', 10),
    fit: 'contain' as const,
  },
  full: {
    width: 1920,
    height: 1920,
    quality: parseInt(process.env.IMAGE_QUALITY_FULL || '90', 10),
    fit: 'inside' as const,
  },
} as const;
