import { z } from 'zod';

/**
 * Anonymous Business Idea Submission validation schemas
 * Validates anonymous submissions, admin actions, and filtering
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Submission status enum
 * Requirement: 1.3, 4.1, 5.1
 */
export const submissionStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
  message: 'Status must be PENDING, APPROVED, or REJECTED',
});

export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

/**
 * Submission action enum for audit logging
 * Requirement: 6.4, 10.4
 */
export const submissionActionSchema = z.enum([
  'CREATED',
  'EDITED',
  'APPROVED',
  'REJECTED',
  'FLAGGED',
  'UNFLAGGED',
], {
  message: 'Action must be CREATED, EDITED, APPROVED, REJECTED, FLAGGED, or UNFLAGGED',
});

export type SubmissionAction = z.infer<typeof submissionActionSchema>;

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Phone number validation regex
 * Requirement: 1.5
 * Accepts various formats:
 * - E.164 format: +1234567890
 * - With dashes: +1-234-567-8900, 123-456-7890
 * - With spaces: +1 234 567 8900, 123 456 7890
 * - With parentheses: (123) 456-7890, +1 (123) 456-7890
 * - Plain digits: 1234567890 (10-15 digits minimum)
 * Minimum 10 digits required (excluding formatting characters)
 */
const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4,}$/;

// ============================================================================
// Anonymous Submission Schemas
// ============================================================================

/**
 * Schema for anonymous business idea submission
 * Requirements: 1.2, 1.5, 2.2
 * - Title: required, 1-200 characters
 * - Description: required, 10-5000 characters
 * - Budget: budgetMin must be <= budgetMax, both non-negative
 * - Contact: at least one contact method (email or phone) required
 * - Images: 1-10 image IDs required
 */
export const anonymousSubmissionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters'),
    budgetMin: z
      .number()
      .nonnegative('Minimum budget must be non-negative'),
    budgetMax: z
      .number()
      .nonnegative('Maximum budget must be non-negative'),
    contactEmail: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    imageIds: z
      .array(z.string().min(1, 'Image ID cannot be empty'))
      .min(1, 'At least one image is required')
      .max(10, 'Maximum 10 images allowed'),
  })
  .refine((data) => data.budgetMin <= data.budgetMax, {
    message: 'Minimum budget cannot exceed maximum budget',
    path: ['budgetMin'],
  })
  .refine(
    (data) => {
      // At least one contact method required
      const hasEmail = data.contactEmail && data.contactEmail.length > 0;
      const hasPhone = data.contactPhone && data.contactPhone.length > 0;
      return hasEmail || hasPhone;
    },
    {
      message: 'At least one contact method (email or phone) is required',
      path: ['contactEmail'],
    }
  );

export type AnonymousSubmission = z.infer<typeof anonymousSubmissionSchema>;

/**
 * Schema for admin editing pending submissions
 * Requirements: 6.1, 6.2
 * All fields optional for partial updates
 */
export const submissionUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters')
      .optional(),
    budgetMin: z
      .number()
      .nonnegative('Minimum budget must be non-negative')
      .optional(),
    budgetMax: z
      .number()
      .nonnegative('Maximum budget must be non-negative')
      .optional(),
    contactEmail: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Only validate budget relationship if both are provided
      if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMin <= data.budgetMax;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['budgetMin'],
    }
  );

export type SubmissionUpdate = z.infer<typeof submissionUpdateSchema>;

/**
 * Schema for admin approval with optional overrides
 * Requirement: 4.1
 */
export const submissionApprovalSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters')
      .optional(),
    budgetMin: z
      .number()
      .nonnegative('Minimum budget must be non-negative')
      .optional(),
    budgetMax: z
      .number()
      .nonnegative('Maximum budget must be non-negative')
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate budget relationship if both are provided
      if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMin <= data.budgetMax;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['budgetMin'],
    }
  );

export type SubmissionApproval = z.infer<typeof submissionApprovalSchema>;

/**
 * Schema for admin rejection with optional feedback
 * Requirements: 5.1, 5.3
 */
export const submissionRejectionSchema = z.object({
  reason: z
    .string()
    .max(1000, 'Rejection reason must be at most 1000 characters')
    .optional(),
});

export type SubmissionRejection = z.infer<typeof submissionRejectionSchema>;

// ============================================================================
// Query and Filter Schemas
// ============================================================================

/**
 * Schema for filtering pending submissions
 * Requirements: 9.1, 9.2, 9.3
 */
export const submissionFilterSchema = z.object({
  page: z
    .number()
    .int()
    .positive('Page must be a positive integer')
    .default(1)
    .optional(),
  limit: z
    .number()
    .int()
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
    .optional(),
  search: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
    .optional(),
  dateFrom: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  dateTo: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  hasContact: z
    .boolean()
    .optional(),
  flagged: z
    .boolean()
    .optional(),
});

export type SubmissionFilter = z.infer<typeof submissionFilterSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Type for submission data returned to clients
 * Includes all submission fields plus related data
 */
export interface SubmissionData {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  contactEmail: string | null;
  contactPhone: string | null;
  submitterIp: string;
  status: SubmissionStatus;
  rejectionReason: string | null;
  flaggedForReview: boolean;
  flagReason: string | null;
  approvedById: string | null;
  rejectedById: string | null;
  businessIdeaId: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images?: SubmissionImageData[];
  auditLogs?: AuditLogData[];
}

/**
 * Type for submission image data
 */
export interface SubmissionImageData {
  id: string;
  imageId: string;
  order: number;
  image: {
    id: string;
    filename: string;
    storagePath: string;
    mimeType: string;
    width: number;
    height: number;
  };
}

/**
 * Type for audit log data
 */
export interface AuditLogData {
  id: string;
  action: SubmissionAction;
  performedBy: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
  user?: {
    id: string;
    username: string | null;
    name: string | null;
  };
}

/**
 * Type for submission statistics
 * Requirement: 8.1, 8.2, 8.3, 8.4
 */
export interface SubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  approvedLast30Days: number;
  rejectedLast30Days: number;
  averageReviewTimeHours: number;
  flaggedCount: number;
}

/**
 * Type for paginated submission list response
 * Requirement: 3.1, 9.4
 */
export interface PaginatedSubmissions {
  submissions: SubmissionData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Type for submission creation response
 * Requirement: 2.1, 2.4
 */
export interface SubmissionCreationResponse {
  id: string;
  message: string;
  estimatedReviewTime: string;
}
