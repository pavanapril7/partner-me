/**
 * Image validation utilities
 * Validates file type, size, and dimensions according to requirements 4.1-4.5
 */

import sharp from 'sharp';
import {
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  FILE_SIGNATURES,
  WEBP_SIGNATURE,
  VALIDATION_CONSTRAINTS,
  ImageValidationResult,
  ImageMetadata,
  SupportedMimeType,
  SupportedExtension,
} from './types';

/**
 * Validates file type by checking MIME type
 * Requirements: 4.2
 */
export function isValidMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
}

/**
 * Validates file extension
 * Requirements: 4.2
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext
    ? SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)
    : false;
}

/**
 * Validates file signature (magic bytes) to prevent file type spoofing
 * Requirements: 4.1, 4.3
 */
export function validateFileSignature(
  buffer: Buffer,
  mimeType: string
): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) {
    return false;
  }

  // Check if buffer matches any of the signatures for this MIME type
  const matchesSignature = signatures.some((signature) => {
    if (buffer.length < signature.length) {
      return false;
    }

    return signature.every((byte, index) => buffer[index] === byte);
  });

  if (!matchesSignature) {
    return false;
  }

  // Additional validation for WebP files
  // WebP files must have "WEBP" at offset 8 after the RIFF header
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) {
      return false;
    }

    // Check for "WEBP" signature at offset 8
    const hasWebPMarker = WEBP_SIGNATURE.every(
      (byte, index) => buffer[8 + index] === byte
    );

    if (!hasWebPMarker) {
      return false;
    }
  }

  return true;
}

/**
 * Validates file size
 * Requirements: 4.4, 4.5
 */
export function validateFileSize(size: number): {
  valid: boolean;
  error?: string;
} {
  if (size > VALIDATION_CONSTRAINTS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${VALIDATION_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Validates image dimensions
 * Requirements: 4.1
 */
export function validateDimensions(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (
    width < VALIDATION_CONSTRAINTS.MIN_WIDTH ||
    height < VALIDATION_CONSTRAINTS.MIN_HEIGHT
  ) {
    return {
      valid: false,
      error: `Image dimensions must be at least ${VALIDATION_CONSTRAINTS.MIN_WIDTH}x${VALIDATION_CONSTRAINTS.MIN_HEIGHT} pixels`,
    };
  }

  if (
    width > VALIDATION_CONSTRAINTS.MAX_WIDTH ||
    height > VALIDATION_CONSTRAINTS.MAX_HEIGHT
  ) {
    return {
      valid: false,
      error: `Image dimensions must not exceed ${VALIDATION_CONSTRAINTS.MAX_WIDTH}x${VALIDATION_CONSTRAINTS.MAX_HEIGHT} pixels`,
    };
  }

  return { valid: true };
}

/**
 * Extracts image metadata using sharp
 * Requirements: 4.1
 */
export async function extractImageMetadata(
  buffer: Buffer
): Promise<ImageMetadata> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unable to extract image metadata');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
  };
}

/**
 * Comprehensive image validation
 * Validates file type (MIME type and magic bytes), size, and dimensions
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export async function validateImage(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ImageValidationResult> {
  // Validate MIME type
  if (!isValidMimeType(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
    };
  }

  // Validate file extension
  if (!isValidExtension(filename)) {
    return {
      valid: false,
      error: `Unsupported file extension. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    };
  }

  // Validate file signature (magic bytes)
  if (!validateFileSignature(buffer, mimeType)) {
    return {
      valid: false,
      error: 'File signature does not match declared MIME type',
    };
  }

  // Validate file size
  const sizeValidation = validateFileSize(buffer.length);
  if (!sizeValidation.valid) {
    return {
      valid: false,
      error: sizeValidation.error,
    };
  }

  // Extract and validate image metadata
  try {
    const metadata = await extractImageMetadata(buffer);

    // Validate dimensions
    const dimensionValidation = validateDimensions(
      metadata.width,
      metadata.height
    );
    if (!dimensionValidation.valid) {
      return {
        valid: false,
        error: dimensionValidation.error,
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? `Invalid image file: ${error.message}`
          : 'Invalid image file',
    };
  }
}
