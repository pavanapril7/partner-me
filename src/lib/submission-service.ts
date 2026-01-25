/**
 * Submission Service Layer
 * 
 * Business logic for anonymous business idea submissions
 * Handles creation, moderation, approval, rejection, and statistics
 * 
 * Requirements: 1.2, 1.4, 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4
 */

import { prisma } from './prisma';
import { detectSpamPatterns } from './spam-detection';
import { SubmissionStatus, SubmissionAction, Prisma } from '@prisma/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CreateSubmissionInput {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  contactEmail?: string;
  contactPhone?: string;
  submitterIp: string;
  imageIds: string[];
}

export interface UpdateSubmissionInput {
  title?: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface GetPendingSubmissionsInput {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasContact?: boolean;
  flagged?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  approvedLast30Days: number;
  rejectedLast30Days: number;
  averageReviewTimeHours: number;
  flaggedCount: number;
}

// ============================================================================
// Create Anonymous Submission
// ============================================================================

/**
 * Create a new anonymous submission
 * 
 * Requirements: 1.2, 1.4
 * 
 * @param input - Submission data
 * @returns Created submission with images
 */
export async function createAnonymousSubmission(input: CreateSubmissionInput) {
  // Run spam detection
  const spamCheck = detectSpamPatterns({
    title: input.title,
    description: input.description,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
  });

  // Create submission with images in a transaction
  const submission = await prisma.$transaction(async (tx) => {
    // Create the submission
    const newSubmission = await tx.anonymousSubmission.create({
      data: {
        title: input.title,
        description: input.description,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        submitterIp: input.submitterIp,
        status: SubmissionStatus.PENDING,
        flaggedForReview: spamCheck.shouldFlag,
        flagReason: spamCheck.shouldFlag
          ? `Spam detection (confidence: ${(spamCheck.confidence * 100).toFixed(0)}%): ${spamCheck.reasons.join(', ')}`
          : null,
      },
    });

    // Associate images with the submission
    if (input.imageIds.length > 0) {
      await tx.anonymousSubmissionImage.createMany({
        data: input.imageIds.map((imageId, index) => ({
          submissionId: newSubmission.id,
          imageId,
          order: index,
        })),
      });
    }

    // Create audit log
    await tx.submissionAuditLog.create({
      data: {
        submissionId: newSubmission.id,
        action: SubmissionAction.CREATED,
        performedBy: null, // System action
        details: {
          spamCheck: {
            flagged: spamCheck.shouldFlag,
            confidence: spamCheck.confidence,
            reasons: spamCheck.reasons,
          },
        },
      },
    });

    return newSubmission;
  });

  // Fetch the complete submission with images
  return await prisma.anonymousSubmission.findUnique({
    where: { id: submission.id },
    include: {
      images: {
        include: {
          image: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
}

// ============================================================================
// Get Pending Submissions
// ============================================================================

/**
 * Get pending submissions with filtering and pagination
 * 
 * Requirements: 3.1, 3.2
 * 
 * @param input - Filter and pagination parameters
 * @returns Paginated list of pending submissions
 */
export async function getPendingSubmissions(
  input: GetPendingSubmissionsInput = {}
): Promise<PaginationResult<Prisma.AnonymousSubmissionGetPayload<{
  include: {
    images: {
      include: {
        image: true;
      };
    };
  };
}>>> {
  const page = input.page || 1;
  const limit = input.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.AnonymousSubmissionWhereInput = {
    status: SubmissionStatus.PENDING,
  };

  // Build AND conditions array for combining multiple filters
  const andConditions: Prisma.AnonymousSubmissionWhereInput[] = [];

  // Apply filters
  if (input.search) {
    andConditions.push({
      OR: [
        { title: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
      ],
    });
  }

  if (input.dateFrom || input.dateTo) {
    const submittedAtFilter: Prisma.DateTimeFilter = {};
    if (input.dateFrom) {
      submittedAtFilter.gte = input.dateFrom;
    }
    if (input.dateTo) {
      submittedAtFilter.lte = input.dateTo;
    }
    andConditions.push({ submittedAt: submittedAtFilter });
  }

  if (input.hasContact !== undefined) {
    if (input.hasContact) {
      andConditions.push({
        OR: [
          { contactEmail: { not: null } },
          { contactPhone: { not: null } },
        ],
      });
    } else {
      andConditions.push({
        contactEmail: null,
        contactPhone: null,
      });
    }
  }

  if (input.flagged !== undefined) {
    andConditions.push({ flaggedForReview: input.flagged });
  }

  // Combine all conditions
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Get total count
  const total = await prisma.anonymousSubmission.count({ where });

  // Get submissions
  const submissions = await prisma.anonymousSubmission.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      submittedAt: 'asc', // Oldest first (FIFO)
    },
    include: {
      images: {
        include: {
          image: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  return {
    data: submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// Get Submission by ID
// ============================================================================

/**
 * Get a single submission by ID with complete details
 * 
 * Requirements: 3.3
 * 
 * @param id - Submission ID
 * @returns Submission with images and audit logs, or null if not found
 */
export async function getSubmissionById(id: string) {
  return await prisma.anonymousSubmission.findUnique({
    where: { id },
    include: {
      images: {
        include: {
          image: {
            include: {
              variants: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      auditLogs: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      approvedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      rejectedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

// ============================================================================
// Approve Submission
// ============================================================================

/**
 * Approve a pending submission and create a public business idea
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param submissionId - The submission ID to approve
 * @param approvedById - The admin user ID approving the submission
 * @param overrides - Optional overrides for submission data
 * @returns The created business idea and updated submission
 */
export async function approveSubmission(
  submissionId: string,
  approvedById: string,
  overrides?: {
    title?: string;
    description?: string;
    budgetMin?: number;
    budgetMax?: number;
  }
) {
  // Get the submission
  const submission = await prisma.anonymousSubmission.findUnique({
    where: { id: submissionId },
    include: {
      images: {
        include: {
          image: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== SubmissionStatus.PENDING) {
    throw new Error(
      `Cannot approve submission with status ${submission.status}. Only PENDING submissions can be approved.`
    );
  }

  // Create business idea and update submission in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();

    // Create the business idea
    const businessIdea = await tx.businessIdea.create({
      data: {
        title: overrides?.title || submission.title,
        description: overrides?.description || submission.description,
        budgetMin: overrides?.budgetMin ?? submission.budgetMin,
        budgetMax: overrides?.budgetMax ?? submission.budgetMax,
        images: [], // Legacy field, kept empty
        createdAt: now, // Set to approval time per requirement 4.4
      },
    });

    // Transfer image associations to the business idea
    const imageIds = submission.images.map((img) => img.imageId);
    if (imageIds.length > 0) {
      await tx.image.updateMany({
        where: {
          id: { in: imageIds },
        },
        data: {
          businessIdeaId: businessIdea.id,
        },
      });
    }

    // Update submission status
    const updatedSubmission = await tx.anonymousSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.APPROVED,
        approvedById,
        businessIdeaId: businessIdea.id,
        reviewedAt: now,
      },
      include: {
        images: {
          include: {
            image: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Create audit log
    await tx.submissionAuditLog.create({
      data: {
        submissionId,
        action: SubmissionAction.APPROVED,
        performedBy: approvedById,
        details: {
          businessIdeaId: businessIdea.id,
          overrides: overrides || null,
        },
      },
    });

    return { businessIdea, submission: updatedSubmission };
  });

  return result;
}

// ============================================================================
// Reject Submission
// ============================================================================

/**
 * Reject a pending submission
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * @param submissionId - The submission ID to reject
 * @param rejectedById - The admin user ID rejecting the submission
 * @param reason - Optional rejection reason/feedback
 * @returns The updated submission
 */
export async function rejectSubmission(
  submissionId: string,
  rejectedById: string,
  reason?: string
) {
  // Get the submission
  const submission = await prisma.anonymousSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== SubmissionStatus.PENDING) {
    throw new Error(
      `Cannot reject submission with status ${submission.status}. Only PENDING submissions can be rejected.`
    );
  }

  // Update submission and create audit log in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();

    // Update submission status
    const updatedSubmission = await tx.anonymousSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        rejectedById,
        rejectionReason: reason || null,
        reviewedAt: now,
      },
      include: {
        images: {
          include: {
            image: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Create audit log
    await tx.submissionAuditLog.create({
      data: {
        submissionId,
        action: SubmissionAction.REJECTED,
        performedBy: rejectedById,
        details: {
          reason: reason || null,
        },
      },
    });

    return updatedSubmission;
  });

  return result;
}

// ============================================================================
// Update Submission
// ============================================================================

/**
 * Update a pending submission
 * 
 * Requirements: 6.1, 6.3, 6.4
 * 
 * @param submissionId - The submission ID to update
 * @param updatedById - The admin user ID updating the submission
 * @param updates - Fields to update
 * @returns The updated submission
 */
export async function updateSubmission(
  submissionId: string,
  updatedById: string,
  updates: UpdateSubmissionInput
) {
  // Get the submission
  const submission = await prisma.anonymousSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== SubmissionStatus.PENDING) {
    throw new Error(
      `Cannot edit submission with status ${submission.status}. Only PENDING submissions can be edited.`
    );
  }

  // Update submission and create audit log in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Build update data (only include provided fields)
    const updateData: Prisma.AnonymousSubmissionUpdateInput = {};
    const changedFields: Record<string, { from: string | number | null; to: string | number | null }> = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title;
      changedFields.title = { from: submission.title, to: updates.title };
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
      changedFields.description = {
        from: submission.description,
        to: updates.description,
      };
    }
    if (updates.budgetMin !== undefined) {
      updateData.budgetMin = updates.budgetMin;
      changedFields.budgetMin = {
        from: submission.budgetMin,
        to: updates.budgetMin,
      };
    }
    if (updates.budgetMax !== undefined) {
      updateData.budgetMax = updates.budgetMax;
      changedFields.budgetMax = {
        from: submission.budgetMax,
        to: updates.budgetMax,
      };
    }
    if (updates.contactEmail !== undefined) {
      updateData.contactEmail = updates.contactEmail || null;
      changedFields.contactEmail = {
        from: submission.contactEmail,
        to: updates.contactEmail || null,
      };
    }
    if (updates.contactPhone !== undefined) {
      updateData.contactPhone = updates.contactPhone || null;
      changedFields.contactPhone = {
        from: submission.contactPhone,
        to: updates.contactPhone || null,
      };
    }

    // Update submission (preserves submittedAt automatically)
    const updatedSubmission = await tx.anonymousSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        images: {
          include: {
            image: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Create audit log
    await tx.submissionAuditLog.create({
      data: {
        submissionId,
        action: SubmissionAction.EDITED,
        performedBy: updatedById,
        details: {
          changes: changedFields,
        },
      },
    });

    return updatedSubmission;
  });

  return result;
}

// ============================================================================
// Get Submission Statistics
// ============================================================================

/**
 * Get submission statistics for the admin dashboard
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * @returns Statistics object
 */
export async function getSubmissionStats(): Promise<SubmissionStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for efficiency
  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    approvedLast30DaysCount,
    rejectedLast30DaysCount,
    flaggedCount,
    reviewedSubmissions,
  ] = await Promise.all([
    // Pending count
    prisma.anonymousSubmission.count({
      where: { status: SubmissionStatus.PENDING },
    }),

    // Total approved count
    prisma.anonymousSubmission.count({
      where: { status: SubmissionStatus.APPROVED },
    }),

    // Total rejected count
    prisma.anonymousSubmission.count({
      where: { status: SubmissionStatus.REJECTED },
    }),

    // Approved in last 30 days
    prisma.anonymousSubmission.count({
      where: {
        status: SubmissionStatus.APPROVED,
        reviewedAt: { gte: thirtyDaysAgo },
      },
    }),

    // Rejected in last 30 days
    prisma.anonymousSubmission.count({
      where: {
        status: SubmissionStatus.REJECTED,
        reviewedAt: { gte: thirtyDaysAgo },
      },
    }),

    // Flagged count (pending only)
    prisma.anonymousSubmission.count({
      where: {
        status: SubmissionStatus.PENDING,
        flaggedForReview: true,
      },
    }),

    // Get all reviewed submissions for average calculation
    prisma.anonymousSubmission.findMany({
      where: {
        reviewedAt: { not: null },
      },
      select: {
        submittedAt: true,
        reviewedAt: true,
      },
    }),
  ]);

  // Calculate average review time
  let averageReviewTimeHours = 0;
  if (reviewedSubmissions.length > 0) {
    const totalReviewTimeMs = reviewedSubmissions.reduce((sum, submission) => {
      if (submission.reviewedAt) {
        const reviewTime =
          submission.reviewedAt.getTime() - submission.submittedAt.getTime();
        return sum + reviewTime;
      }
      return sum;
    }, 0);

    const averageReviewTimeMs = totalReviewTimeMs / reviewedSubmissions.length;
    averageReviewTimeHours = averageReviewTimeMs / (1000 * 60 * 60); // Convert to hours
  }

  return {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    approvedLast30Days: approvedLast30DaysCount,
    rejectedLast30Days: rejectedLast30DaysCount,
    averageReviewTimeHours: Math.round(averageReviewTimeHours * 100) / 100, // Round to 2 decimals
    flaggedCount,
  };
}
