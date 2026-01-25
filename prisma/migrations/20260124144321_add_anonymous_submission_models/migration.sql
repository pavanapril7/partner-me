-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubmissionAction" AS ENUM ('CREATED', 'EDITED', 'APPROVED', 'REJECTED', 'FLAGGED', 'UNFLAGGED');

-- CreateTable
CREATE TABLE "anonymous_submissions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION NOT NULL,
    "budgetMax" DOUBLE PRECISION NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "submitterIp" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "approvedById" TEXT,
    "rejectedById" TEXT,
    "businessIdeaId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_submission_images" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_submission_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_audit_logs" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "action" "SubmissionAction" NOT NULL,
    "performedBy" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_submissions_businessIdeaId_key" ON "anonymous_submissions"("businessIdeaId");

-- CreateIndex
CREATE INDEX "anonymous_submissions_status_submittedAt_idx" ON "anonymous_submissions"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "anonymous_submissions_submitterIp_submittedAt_idx" ON "anonymous_submissions"("submitterIp", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_submission_images_imageId_key" ON "anonymous_submission_images"("imageId");

-- CreateIndex
CREATE INDEX "anonymous_submission_images_submissionId_order_idx" ON "anonymous_submission_images"("submissionId", "order");

-- CreateIndex
CREATE INDEX "submission_audit_logs_submissionId_createdAt_idx" ON "submission_audit_logs"("submissionId", "createdAt");

-- AddForeignKey
ALTER TABLE "anonymous_submissions" ADD CONSTRAINT "anonymous_submissions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_submissions" ADD CONSTRAINT "anonymous_submissions_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_submissions" ADD CONSTRAINT "anonymous_submissions_businessIdeaId_fkey" FOREIGN KEY ("businessIdeaId") REFERENCES "business_ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_submission_images" ADD CONSTRAINT "anonymous_submission_images_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "anonymous_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_submission_images" ADD CONSTRAINT "anonymous_submission_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_audit_logs" ADD CONSTRAINT "submission_audit_logs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "anonymous_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_audit_logs" ADD CONSTRAINT "submission_audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
