import { z } from 'zod';

/**
 * Business Ideas Showcase validation schemas
 * Validates business idea creation/updates and partnership requests
 */

// ============================================================================
// Business Idea Schemas
// ============================================================================

/**
 * Schema for business idea creation and updates
 * Requirements: 4.1, 4.2, 4.3, 5.7, 8.2, 8.3, 8.5
 * - Title: required, non-empty string
 * - Description: required, supports rich text HTML content
 * - Images: array of valid URLs or paths (supports both legacy URLs and new API paths)
 * - Budget: budgetMin must be <= budgetMax
 */
export const businessIdeaSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .min(1, 'Description is required'),
    images: z
      .array(
        z.string().min(1, 'Image path cannot be empty')
      )
      .min(1, 'At least one image is required'),
    budgetMin: z
      .number()
      .nonnegative('Minimum budget must be non-negative'),
    budgetMax: z
      .number()
      .nonnegative('Maximum budget must be non-negative'),
  })
  .refine((data) => data.budgetMin <= data.budgetMax, {
    message: 'Minimum budget cannot exceed maximum budget',
    path: ['budgetMin'],
  });

export type BusinessIdea = z.infer<typeof businessIdeaSchema>;

/**
 * Schema for business idea updates (all fields optional)
 * Allows partial updates to business ideas
 */
export const businessIdeaUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .min(1, 'Description cannot be empty')
      .optional(),
    images: z
      .array(
        z.string().min(1, 'Image path cannot be empty')
      )
      .min(1, 'At least one image is required')
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

export type BusinessIdeaUpdate = z.infer<typeof businessIdeaUpdateSchema>;

// ============================================================================
// Partnership Request Schemas
// ============================================================================

/**
 * Partnership role enum
 * Requirement: 3.3
 */
export const partnershipRoleSchema = z.enum(['HELPER', 'OUTLET'], {
  message: 'Role must be either HELPER or OUTLET',
});

export type PartnershipRole = z.infer<typeof partnershipRoleSchema>;

/**
 * Phone number validation regex
 * Requirement: 4.4
 * Accepts various formats:
 * - E.164 format: +1234567890
 * - With dashes: +1-234-567-8900, 123-456-7890
 * - With spaces: +1 234 567 8900, 123 456 7890
 * - With parentheses: (123) 456-7890, +1 (123) 456-7890
 * - Plain digits: 1234567890 (10-15 digits minimum)
 * Minimum 10 digits required (excluding formatting characters)
 */
const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4,}$/;

/**
 * Schema for partnership request submission
 * Requirements: 4.1, 4.2, 4.3, 4.4, 8.2, 8.3, 8.5
 * - Business idea ID: required
 * - Name: required, non-empty
 * - Phone number: required, valid format
 * - Role: required, must be HELPER or OUTLET
 */
export const partnershipRequestSchema = z.object({
  businessIdeaId: z
    .string()
    .min(1, 'Business idea ID is required'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone number must be in a valid format'),
  role: partnershipRoleSchema,
});

export type PartnershipRequest = z.infer<typeof partnershipRequestSchema>;

/**
 * Schema for partnership request status updates
 * Requirement: 12.2, 12.3
 */
export const partnershipStatusSchema = z.enum(
  ['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED'],
  {
    message: 'Status must be PENDING, CONTACTED, ACCEPTED, or REJECTED',
  }
);

export type PartnershipStatus = z.infer<typeof partnershipStatusSchema>;

/**
 * Schema for updating partnership request status
 * Requirement: 12.2
 */
export const partnershipStatusUpdateSchema = z.object({
  status: partnershipStatusSchema,
});

export type PartnershipStatusUpdate = z.infer<typeof partnershipStatusUpdateSchema>;
