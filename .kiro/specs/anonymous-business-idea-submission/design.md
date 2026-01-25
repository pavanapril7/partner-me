# Design Document

## Overview

This design implements a comprehensive anonymous business idea submission system that allows non-authenticated users to contribute ideas while maintaining platform quality through admin moderation. The system introduces a new submission workflow parallel to the existing admin-created business ideas, with clear separation of concerns and a dedicated moderation interface.

The design follows a three-stage lifecycle for anonymous submissions:
1. **Submission**: Anonymous users submit ideas through a public form
2. **Moderation**: Admins review submissions in a dedicated queue
3. **Publication**: Approved submissions become public business ideas

Key design principles:
- **Separation of concerns**: Pending submissions are stored separately from public business ideas
- **Security first**: Rate limiting, validation, and spam detection protect the platform
- **Admin efficiency**: Dedicated moderation interface with filtering and bulk actions
- **Audit trail**: Complete history of all submission actions for accountability
- **Scalability**: Design supports high submission volumes with efficient querying

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Anonymous Submission Form  │  Admin Moderation Interface       │
│  - Public facing            │  - Authenticated admins only      │
│  - No auth required         │  - Review queue                   │
│  - Image upload             │  - Approve/Reject/Edit actions    │
└──────────────┬──────────────┴────────────────┬──────────────────┘
               │                                │
               ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/submissions/anonymous                                 │
│  - Create anonymous submission                                   │
│  - Rate limiting by IP                                           │
│  - Spam detection                                                │
│                                                                  │
│  GET /api/admin/submissions/pending                              │
│  - List pending submissions (admin only)                         │
│  - Filtering and search                                          │
│                                                                  │
│  PATCH /api/admin/submissions/[id]/approve                       │
│  - Approve submission (admin only)                               │
│  - Migrate to public business ideas                              │
│                                                                  │
│  PATCH /api/admin/submissions/[id]/reject                        │
│  - Reject submission (admin only)                                │
│  - Optional feedback                                             │
│                                                                  │
│  PATCH /api/admin/submissions/[id]                               │
│  - Edit pending submission (admin only)                          │
│                                                                  │
│  GET /api/admin/submissions/stats                                │
│  - Submission statistics (admin only)                            │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  SubmissionService                                               │
│  - createAnonymousSubmission()                                   │
│  - getPendingSubmissions()                                       │
│  - approveSubmission()                                           │
│  - rejectSubmission()                                            │
│  - updateSubmission()                                            │
│  - getSubmissionStats()                                          │
│                                                                  │
│  RateLimitService                                                │
│  - checkSubmissionRateLimit()                                    │
│  - recordSubmissionAttempt()                                     │
│                                                                  │
│  SpamDetectionService                                            │
│  - detectSpamPatterns()                                          │
│  - flagSuspiciousSubmission()                                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  AnonymousSubmission (new table)                                 │
│  BusinessIdea (existing table)                                   │
│  Image (existing table)                                          │
│  SubmissionAuditLog (new table)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Anonymous Submission Flow:**
```
User → Submission Form → Rate Limit Check → Validation → 
Spam Detection → Create AnonymousSubmission → Store Images → 
Return Confirmation
```

**Admin Approval Flow:**
```
Admin → Moderation Queue → Select Submission → Review → 
Approve → Create BusinessIdea → Associate Images → 
Update AnonymousSubmission Status → Audit Log
```

**Admin Rejection Flow:**
```
Admin → Moderation Queue → Select Submission → Review → 
Reject (+ Optional Feedback) → Update AnonymousSubmission Status → 
Audit Log
```

## Components and Interfaces

### Database Models

#### AnonymousSubmission Model (New)

```prisma
model AnonymousSubmission {
  id              String                    @id @default(cuid())
  title           String
  description     String                    @db.Text
  budgetMin       Float
  budgetMax       Float
  contactEmail    String?
  contactPhone    String?
  submitterIp     String                    // For rate limiting
  status          SubmissionStatus          @default(PENDING)
  rejectionReason String?                   @db.Text
  flaggedForReview Boolean                  @default(false)
  flagReason      String?
  approvedById    String?
  rejectedById    String?
  businessIdeaId  String?                   @unique // Set when approved
  submittedAt     DateTime                  @default(now())
  reviewedAt      DateTime?
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt
  
  images          AnonymousSubmissionImage[]
  auditLogs       SubmissionAuditLog[]
  approvedBy      User?                     @relation("ApprovedSubmissions", fields: [approvedById], references: [id])
  rejectedBy      User?                     @relation("RejectedSubmissions", fields: [rejectedById], references: [id])
  businessIdea    BusinessIdea?             @relation(fields: [businessIdeaId], references: [id])
  
  @@index([status, submittedAt])
  @@index([submitterIp, submittedAt])
  @@map("anonymous_submissions")
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### AnonymousSubmissionImage Model (New)

```prisma
model AnonymousSubmissionImage {
  id           String               @id @default(cuid())
  submissionId String
  imageId      String               @unique
  order        Int                  @default(0)
  createdAt    DateTime             @default(now())
  
  submission   AnonymousSubmission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  image        Image                @relation(fields: [imageId], references: [id], onDelete: Cascade)
  
  @@index([submissionId, order])
  @@map("anonymous_submission_images")
}
```

#### SubmissionAuditLog Model (New)

```prisma
model SubmissionAuditLog {
  id           String               @id @default(cuid())
  submissionId String
  action       SubmissionAction
  performedBy  String?              // User ID (null for system actions)
  details      Json?                // Additional context
  createdAt    DateTime             @default(now())
  
  submission   AnonymousSubmission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  user         User?                @relation(fields: [performedBy], references: [id])
  
  @@index([submissionId, createdAt])
  @@map("submission_audit_logs")
}

enum SubmissionAction {
  CREATED
  EDITED
  APPROVED
  REJECTED
  FLAGGED
  UNFLAGGED
}
```

#### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  approvedSubmissions  AnonymousSubmission[] @relation("ApprovedSubmissions")
  rejectedSubmissions  AnonymousSubmission[] @relation("RejectedSubmissions")
  submissionAuditLogs  SubmissionAuditLog[]
}
```

#### BusinessIdea Model Updates

```prisma
model BusinessIdea {
  // ... existing fields ...
  
  anonymousSubmission AnonymousSubmission?
}
```

#### Image Model Updates

```prisma
model Image {
  // ... existing fields ...
  
  anonymousSubmissionImage AnonymousSubmissionImage?
}
```

### API Endpoints

#### POST /api/submissions/anonymous

Create a new anonymous submission.

**Authentication**: None (public endpoint)

**Request Body**:
```typescript
{
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  contactEmail?: string;
  contactPhone?: string;
  imageIds: string[]; // IDs of uploaded images
}
```

**Response** (201 Created):
```typescript
{
  success: true;
  data: {
    id: string;
    message: string;
    estimatedReviewTime: string;
  }
}
```

**Error Responses**:
- 400: Validation error
- 429: Rate limit exceeded
- 500: Server error

#### GET /api/admin/submissions/pending

List pending submissions with filtering and pagination.

**Authentication**: Admin required

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  hasContact?: boolean;
  flagged?: boolean;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    submissions: AnonymousSubmission[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }
}
```

#### PATCH /api/admin/submissions/[id]/approve

Approve a pending submission and create a public business idea.

**Authentication**: Admin required

**Request Body**:
```typescript
{
  // Optional: override submission data
  title?: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    businessIdea: BusinessIdea;
    submission: AnonymousSubmission;
  }
}
```

#### PATCH /api/admin/submissions/[id]/reject

Reject a pending submission.

**Authentication**: Admin required

**Request Body**:
```typescript
{
  reason?: string;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    submission: AnonymousSubmission;
  }
}
```

#### PATCH /api/admin/submissions/[id]

Edit a pending submission.

**Authentication**: Admin required

**Request Body**:
```typescript
{
  title?: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  contactEmail?: string;
  contactPhone?: string;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    submission: AnonymousSubmission;
  }
}
```

#### GET /api/admin/submissions/stats

Get submission statistics.

**Authentication**: Admin required

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    pending: number;
    approved: number;
    rejected: number;
    approvedLast30Days: number;
    rejectedLast30Days: number;
    averageReviewTimeHours: number;
    flaggedCount: number;
  }
}
```

### Validation Schemas

#### Anonymous Submission Schema

```typescript
export const anonymousSubmissionSchema = z.object({
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
    .array(z.string())
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
}).refine((data) => data.budgetMin <= data.budgetMax, {
  message: 'Minimum budget cannot exceed maximum budget',
  path: ['budgetMin'],
}).refine((data) => data.contactEmail || data.contactPhone, {
  message: 'At least one contact method (email or phone) is required',
  path: ['contactEmail'],
});
```

### Rate Limiting

#### Submission Rate Limiter

```typescript
// lib/submission-rate-limit.ts

interface SubmissionAttempt {
  timestamp: number;
  ip: string;
}

const SUBMISSION_RATE_LIMIT = {
  MAX_PER_IP_PER_DAY: 3,
  MAX_PER_IP_PER_HOUR: 2,
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000,
  WINDOW_HOUR_MS: 60 * 60 * 1000,
};

export function checkSubmissionRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

export function recordSubmissionAttempt(ip: string): void
```

### Spam Detection

#### Spam Detection Service

```typescript
// lib/spam-detection.ts

export interface SpamCheckResult {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  shouldFlag: boolean;
}

export function detectSpamPatterns(submission: {
  title: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}): SpamCheckResult

// Detection patterns:
// - Excessive capitalization
// - Repeated characters or words
// - Known spam keywords
// - Suspicious URLs
// - Invalid contact information patterns
```

## Data Models

### AnonymousSubmission

Represents a business idea submitted by a non-authenticated user.

**Fields**:
- `id`: Unique identifier
- `title`: Business idea title
- `description`: Detailed description (supports rich text)
- `budgetMin`: Minimum budget estimate
- `budgetMax`: Maximum budget estimate
- `contactEmail`: Optional email for follow-up
- `contactPhone`: Optional phone for follow-up
- `submitterIp`: IP address for rate limiting
- `status`: PENDING | APPROVED | REJECTED
- `rejectionReason`: Optional feedback when rejected
- `flaggedForReview`: Boolean flag for suspicious submissions
- `flagReason`: Reason for flagging
- `approvedById`: Admin who approved (if approved)
- `rejectedById`: Admin who rejected (if rejected)
- `businessIdeaId`: Reference to created BusinessIdea (if approved)
- `submittedAt`: Submission timestamp
- `reviewedAt`: Review timestamp
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

**Relationships**:
- Has many `AnonymousSubmissionImage`
- Has many `SubmissionAuditLog`
- Belongs to `User` (approvedBy)
- Belongs to `User` (rejectedBy)
- Belongs to `BusinessIdea` (optional, set when approved)

### AnonymousSubmissionImage

Links images to anonymous submissions with ordering.

**Fields**:
- `id`: Unique identifier
- `submissionId`: Reference to AnonymousSubmission
- `imageId`: Reference to Image
- `order`: Display order
- `createdAt`: Record creation timestamp

**Relationships**:
- Belongs to `AnonymousSubmission`
- Belongs to `Image`

### SubmissionAuditLog

Tracks all actions performed on submissions for accountability.

**Fields**:
- `id`: Unique identifier
- `submissionId`: Reference to AnonymousSubmission
- `action`: CREATED | EDITED | APPROVED | REJECTED | FLAGGED | UNFLAGGED
- `performedBy`: User ID (null for system actions)
- `details`: JSON field for additional context
- `createdAt`: Action timestamp

**Relationships**:
- Belongs to `AnonymousSubmission`
- Belongs to `User` (optional)



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN an anonymous user accesses the submission form THEN the System SHALL display all required fields without requiring authentication
Thoughts: This is a UI requirement about what should be displayed. We can test that the form renders with all required fields present without authentication.
Testable: yes - example

1.2 WHEN an anonymous user submits a business idea with valid data THEN the Submission System SHALL create a pending submission record
Thoughts: This is a rule that should apply to all valid submissions. We can generate random valid submission data and verify a record is created with PENDING status.
Testable: yes - property

1.3 WHEN an anonymous user submits a business idea THEN the Submission System SHALL store the submission with a PENDING status
Thoughts: This is redundant with 1.2 - both test that submissions are created with PENDING status.
Testable: redundant with 1.2

1.4 WHEN an anonymous submission is created THEN the Submission System SHALL NOT display it in the public business ideas list
Thoughts: This is a critical invariant - pending submissions should never appear in public queries. We can test this by creating submissions and verifying they don't appear in public lists.
Testable: yes - property

1.5 WHERE an anonymous user provides contact information THEN the Submission System SHALL store it securely for admin follow-up
Thoughts: This tests that contact information is persisted. We can generate submissions with various contact info and verify it's stored.
Testable: yes - property

2.1 WHEN an anonymous user successfully submits a business idea THEN the System SHALL display a confirmation message indicating the submission is pending review
Thoughts: This is a UI test for a specific scenario - successful submission.
Testable: yes - example

2.2 WHEN a submission fails validation THEN the System SHALL display specific error messages for each invalid field
Thoughts: This is about error handling across all invalid inputs. We can generate invalid submissions and verify appropriate errors are returned.
Testable: yes - property

2.3 WHEN a submission is rate-limited THEN the System SHALL display a message indicating the user has exceeded submission limits
Thoughts: This is testing a specific error case - rate limiting.
Testable: yes - example

2.4 WHEN a submission succeeds THEN the System SHALL provide an estimated review timeframe to the user
Thoughts: This is testing that the response includes review timeframe information.
Testable: yes - example

3.1 WHEN an admin accesses the moderation queue THEN the Admin Moderation Interface SHALL display all pending submissions ordered by submission date
Thoughts: This tests that the query returns all PENDING submissions in the correct order. We can create multiple submissions and verify ordering.
Testable: yes - property

3.2 WHEN displaying pending submissions THEN the Admin Moderation Interface SHALL show title, description preview, submission date, and contact information
Thoughts: This tests that the response includes all required fields. We can verify the structure of returned data.
Testable: yes - property

3.3 WHEN an admin selects a pending submission THEN the Admin Moderation Interface SHALL display the complete submission details including all images
Thoughts: This tests that fetching a single submission returns complete data including images.
Testable: yes - property

3.4 WHEN the moderation queue is empty THEN the Admin Moderation Interface SHALL display a message indicating no pending submissions
Thoughts: This is testing a specific edge case - empty queue.
Testable: yes - edge case

4.1 WHEN an admin approves a pending submission THEN the Submission System SHALL create a public business idea with the submission data
Thoughts: This is a critical property - approval should create a BusinessIdea. We can test this across all valid submissions.
Testable: yes - property

4.2 WHEN a submission is approved THEN the Submission System SHALL remove it from the moderation queue
Thoughts: This tests that approved submissions have status changed and don't appear in pending queries.
Testable: yes - property

4.3 WHEN a submission is approved THEN the Submission System SHALL preserve all associated images and metadata
Thoughts: This is an invariant - images should be transferred intact. We can verify image associations are preserved.
Testable: yes - property

4.4 WHEN a submission is approved THEN the Submission System SHALL set the creation timestamp to the approval time
Thoughts: This tests that the BusinessIdea createdAt matches the approval time, not the submission time.
Testable: yes - property

5.1 WHEN an admin rejects a pending submission THEN the Submission System SHALL mark it as REJECTED
Thoughts: This tests that rejection changes status to REJECTED.
Testable: yes - property

5.2 WHEN an admin rejects a submission THEN the Submission System SHALL remove it from the active moderation queue
Thoughts: This tests that rejected submissions don't appear in pending queries.
Testable: yes - property

5.3 WHERE an admin provides rejection feedback THEN the Submission System SHALL store the feedback with the rejected submission
Thoughts: This tests that optional rejection reason is persisted when provided.
Testable: yes - property

5.4 WHEN a submission is rejected THEN the Submission System SHALL retain the record for audit purposes
Thoughts: This tests that rejected submissions are not deleted, just status changed.
Testable: yes - property

6.1 WHEN an admin edits a pending submission THEN the Admin Moderation Interface SHALL allow modification of title, description, and budget fields
Thoughts: This tests that the update endpoint accepts and applies changes to these fields.
Testable: yes - property

6.2 WHEN an admin saves edits to a pending submission THEN the Submission System SHALL update the submission data
Thoughts: This is redundant with 6.1 - both test that edits are persisted.
Testable: redundant with 6.1

6.3 WHEN an admin edits a submission THEN the Submission System SHALL preserve the original submission timestamp
Thoughts: This is an invariant - submittedAt should not change when editing.
Testable: yes - property

6.4 WHEN an admin edits a submission THEN the Submission System SHALL log the modification for audit purposes
Thoughts: This tests that an audit log entry is created for edit actions.
Testable: yes - property

7.1 WHEN an anonymous user submits multiple ideas THEN the Rate Limiter SHALL restrict submissions to 3 per IP address per 24-hour period
Thoughts: This tests the rate limiting logic across multiple submissions from the same IP.
Testable: yes - property

7.2 WHEN a rate limit is exceeded THEN the Submission System SHALL reject the submission with a clear error message
Thoughts: This tests the error response when rate limited.
Testable: yes - example

7.3 WHEN detecting suspicious patterns THEN the Submission System SHALL flag submissions for additional admin review
Thoughts: This tests that spam detection sets the flagged field.
Testable: yes - property

7.4 WHEN a submission contains prohibited content patterns THEN the Submission System SHALL automatically flag it for review
Thoughts: This is redundant with 7.3 - both test flagging behavior.
Testable: redundant with 7.3

8.1 WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of pending submissions
Thoughts: This tests that the stats endpoint returns accurate pending count.
Testable: yes - property

8.2 WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of approved submissions in the last 30 days
Thoughts: This tests that the stats endpoint returns accurate approved count for the time window.
Testable: yes - property

8.3 WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of rejected submissions in the last 30 days
Thoughts: This tests that the stats endpoint returns accurate rejected count for the time window.
Testable: yes - property

8.4 WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the average review time for submissions
Thoughts: This tests that the stats endpoint calculates average time between submission and review.
Testable: yes - property

9.1 WHEN an admin applies a date range filter THEN the Admin Moderation Interface SHALL display only submissions within that range
Thoughts: This tests that date filtering works correctly across various date ranges.
Testable: yes - property

9.2 WHEN an admin searches by keyword THEN the Admin Moderation Interface SHALL display submissions matching the title or description
Thoughts: This tests that search functionality returns correct results.
Testable: yes - property

9.3 WHEN an admin filters by contact status THEN the Admin Moderation Interface SHALL display submissions with or without contact information
Thoughts: This tests that filtering by contact presence works correctly.
Testable: yes - property

9.4 WHEN filters are applied THEN the Admin Moderation Interface SHALL update the submission count accordingly
Thoughts: This tests that the total count reflects the filtered results.
Testable: yes - property

10.1 WHEN storing submissions THEN the Submission System SHALL use a separate database table for pending anonymous submissions
Thoughts: This is an architectural requirement, not a functional property we can test.
Testable: no

10.2 WHEN a submission is approved THEN the Submission System SHALL migrate data to the public business ideas table
Thoughts: This is the same as 4.1 - testing that approval creates a BusinessIdea.
Testable: redundant with 4.1

10.3 WHEN querying public business ideas THEN the System SHALL NOT include pending or rejected anonymous submissions
Thoughts: This is the same as 1.4 - testing isolation of pending submissions.
Testable: redundant with 1.4

10.4 WHEN auditing submissions THEN the System SHALL maintain a complete history of submission status changes
Thoughts: This tests that audit logs are created for all status changes.
Testable: yes - property

### Property Reflection

After reviewing all properties, the following redundancies were identified:

- **1.3 is redundant with 1.2**: Both test that submissions are created with PENDING status
- **6.2 is redundant with 6.1**: Both test that edits are persisted
- **7.4 is redundant with 7.3**: Both test flagging behavior
- **10.2 is redundant with 4.1**: Both test that approval creates a BusinessIdea
- **10.3 is redundant with 1.4**: Both test isolation of pending submissions

These redundant properties will be excluded from the Correctness Properties section below.

### Correctness Properties

Property 1: Valid submission creates pending record
*For any* valid anonymous submission data, submitting it should create a record with status PENDING
**Validates: Requirements 1.2**

Property 2: Pending submissions are isolated from public queries
*For any* pending anonymous submission, it should not appear in public business ideas queries
**Validates: Requirements 1.4**

Property 3: Contact information is persisted
*For any* anonymous submission with contact information, the contact data should be stored and retrievable
**Validates: Requirements 1.5**

Property 4: Invalid submissions return field-specific errors
*For any* invalid submission data, the validation should return specific error messages for each invalid field
**Validates: Requirements 2.2**

Property 5: Pending queue returns all pending submissions ordered by date
*For any* set of pending submissions, querying the moderation queue should return all of them ordered by submittedAt ascending
**Validates: Requirements 3.1**

Property 6: Pending submission list includes required fields
*For any* pending submission in the queue, the response should include title, description preview, submission date, and contact information
**Validates: Requirements 3.2**

Property 7: Single submission fetch includes complete data
*For any* pending submission, fetching it by ID should return complete details including all associated images
**Validates: Requirements 3.3**

Property 8: Approval creates public business idea
*For any* pending submission, approving it should create a BusinessIdea with the same title, description, budget, and images
**Validates: Requirements 4.1**

Property 9: Approval removes from moderation queue
*For any* pending submission, after approval its status should be APPROVED and it should not appear in pending queries
**Validates: Requirements 4.2**

Property 10: Approval preserves image associations
*For any* pending submission with images, approving it should transfer all image associations to the created BusinessIdea in the same order
**Validates: Requirements 4.3**

Property 11: Approval timestamp matches creation time
*For any* approved submission, the created BusinessIdea's createdAt should match the approval time (reviewedAt), not the original submittedAt
**Validates: Requirements 4.4**

Property 12: Rejection marks status as REJECTED
*For any* pending submission, rejecting it should change its status to REJECTED
**Validates: Requirements 5.1**

Property 13: Rejection removes from active queue
*For any* pending submission, after rejection it should not appear in pending queries
**Validates: Requirements 5.2**

Property 14: Rejection feedback is persisted
*For any* rejection with feedback, the rejectionReason should be stored and retrievable
**Validates: Requirements 5.3**

Property 15: Rejected submissions are retained
*For any* rejected submission, the record should remain in the database (not deleted)
**Validates: Requirements 5.4**

Property 16: Edits update submission data
*For any* pending submission and valid edit data, updating the submission should persist the changes to title, description, and budget fields
**Validates: Requirements 6.1**

Property 17: Edits preserve original timestamp
*For any* pending submission, editing it should not change the submittedAt timestamp
**Validates: Requirements 6.3**

Property 18: Edits create audit log entries
*For any* edit action on a pending submission, an audit log entry with action EDITED should be created
**Validates: Requirements 6.4**

Property 19: Rate limiting enforces IP-based limits
*For any* IP address, submitting more than 3 submissions in a 24-hour period should be rejected with a rate limit error
**Validates: Requirements 7.1**

Property 20: Spam detection flags suspicious submissions
*For any* submission containing spam patterns, the flaggedForReview field should be set to true
**Validates: Requirements 7.3**

Property 21: Stats return accurate pending count
*For any* set of submissions, the stats endpoint should return a pending count equal to the number of submissions with status PENDING
**Validates: Requirements 8.1**

Property 22: Stats return accurate 30-day approved count
*For any* set of submissions, the stats endpoint should return an approved count equal to the number of submissions with status APPROVED and reviewedAt within the last 30 days
**Validates: Requirements 8.2**

Property 23: Stats return accurate 30-day rejected count
*For any* set of submissions, the stats endpoint should return a rejected count equal to the number of submissions with status REJECTED and reviewedAt within the last 30 days
**Validates: Requirements 8.3**

Property 24: Stats calculate average review time correctly
*For any* set of reviewed submissions, the average review time should equal the mean of (reviewedAt - submittedAt) for all submissions with reviewedAt not null
**Validates: Requirements 8.4**

Property 25: Date range filter returns correct submissions
*For any* date range, filtering submissions should return only those with submittedAt within the range
**Validates: Requirements 9.1**

Property 26: Keyword search matches title and description
*For any* search keyword, the results should include all submissions where the keyword appears in title or description (case-insensitive)
**Validates: Requirements 9.2**

Property 27: Contact filter returns correct submissions
*For any* contact filter value, filtering should return submissions with contact information present (if true) or absent (if false)
**Validates: Requirements 9.3**

Property 28: Filtered count matches filtered results
*For any* applied filters, the returned count should equal the number of submissions matching those filters
**Validates: Requirements 9.4**

Property 29: Status changes create audit log entries
*For any* submission status change (PENDING → APPROVED or PENDING → REJECTED), an audit log entry should be created with the corresponding action
**Validates: Requirements 10.4**

## Error Handling

### Validation Errors

**Client-side validation**:
- Real-time field validation in the submission form
- Clear error messages displayed inline with fields
- Prevent submission until all validation passes

**Server-side validation**:
- All inputs validated using Zod schemas
- Return 400 Bad Request with detailed error messages
- Include field-level error information in response

**Example error response**:
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    fields: {
      title: 'Title is required',
      budgetMin: 'Minimum budget cannot exceed maximum budget'
    }
  }
}
```

### Rate Limiting Errors

**Response format**:
```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You have exceeded the submission limit. Please try again later.',
    retryAfter: 3600 // seconds until rate limit resets
  }
}
```

**HTTP Status**: 429 Too Many Requests

**Headers**: Include `Retry-After` header with seconds until reset

### Authentication Errors

**Admin endpoints only**:
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Valid token but user is not an admin

**Example response**:
```typescript
{
  success: false,
  error: {
    code: 'AUTH_REQUIRED',
    message: 'Admin authentication required'
  }
}
```

### Not Found Errors

**When submission doesn't exist**:
```typescript
{
  success: false,
  error: {
    code: 'SUBMISSION_NOT_FOUND',
    message: 'Submission not found'
  }
}
```

**HTTP Status**: 404 Not Found

### Conflict Errors

**When attempting to approve/reject already processed submission**:
```typescript
{
  success: false,
  error: {
    code: 'SUBMISSION_ALREADY_PROCESSED',
    message: 'This submission has already been approved or rejected',
    currentStatus: 'APPROVED'
  }
}
```

**HTTP Status**: 409 Conflict

### Database Errors

**Generic database errors**:
- Log detailed error information server-side
- Return generic error message to client
- Include error tracking ID for support

```typescript
{
  success: false,
  error: {
    code: 'DATABASE_ERROR',
    message: 'An error occurred while processing your request',
    trackingId: 'err_abc123'
  }
}
```

**HTTP Status**: 500 Internal Server Error

### Image Upload Errors

**Reuse existing image upload error handling**:
- Invalid file type
- File too large
- Processing errors
- Storage errors

**Integration**: Anonymous submissions use the same `/api/upload` endpoint with temporary storage, then associate images with submission

## Testing Strategy

### Unit Testing

**Components to test**:
1. **Validation schemas**: Test all validation rules with valid and invalid inputs
2. **Rate limiting logic**: Test rate limit calculations and cleanup
3. **Spam detection**: Test pattern matching and flagging logic
4. **Service functions**: Test business logic in isolation
5. **API route handlers**: Test request/response handling

**Example unit tests**:
- `anonymousSubmissionSchema` validates all fields correctly
- `checkSubmissionRateLimit` enforces IP-based limits
- `detectSpamPatterns` identifies spam content
- `approveSubmission` creates BusinessIdea with correct data

### Property-Based Testing

**Testing framework**: Use `fast-check` for TypeScript property-based testing

**Configuration**: Each property test should run a minimum of 100 iterations

**Property test implementation**:
- Each correctness property from the design document must be implemented as a property-based test
- Tests must be tagged with comments referencing the design document property
- Tag format: `**Feature: anonymous-business-idea-submission, Property {number}: {property_text}**`

**Example property tests**:

```typescript
// **Feature: anonymous-business-idea-submission, Property 1: Valid submission creates pending record**
test('valid submission creates pending record', async () => {
  await fc.assert(
    fc.asyncProperty(
      validSubmissionArbitrary(),
      async (submission) => {
        const result = await createAnonymousSubmission(submission);
        expect(result.status).toBe('PENDING');
      }
    ),
    { numRuns: 100 }
  );
});

// **Feature: anonymous-business-idea-submission, Property 2: Pending submissions are isolated from public queries**
test('pending submissions are isolated from public queries', async () => {
  await fc.assert(
    fc.asyncProperty(
      validSubmissionArbitrary(),
      async (submission) => {
        const created = await createAnonymousSubmission(submission);
        const publicIdeas = await getPublicBusinessIdeas();
        expect(publicIdeas).not.toContainEqual(
          expect.objectContaining({ id: created.id })
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generators (Arbitraries)**:
- `validSubmissionArbitrary()`: Generates valid submission data
- `invalidSubmissionArbitrary()`: Generates invalid submission data
- `spamContentArbitrary()`: Generates content with spam patterns
- `dateRangeArbitrary()`: Generates date ranges for filtering
- `searchKeywordArbitrary()`: Generates search keywords

### Integration Testing

**Test scenarios**:
1. **End-to-end submission flow**: Anonymous user submits → Admin approves → Business idea appears publicly
2. **End-to-end rejection flow**: Anonymous user submits → Admin rejects → Submission marked rejected
3. **Rate limiting integration**: Multiple submissions from same IP → Rate limit enforced
4. **Image association**: Upload images → Create submission → Approve → Images transferred correctly
5. **Audit trail**: Perform actions → Verify audit logs created

**Test database**: Use separate test database with migrations applied

**Cleanup**: Reset database state between tests

### API Testing

**Test all endpoints**:
- Valid requests return expected responses
- Invalid requests return appropriate errors
- Authentication/authorization enforced correctly
- Rate limiting works as expected
- Pagination works correctly

**Tools**: Use `supertest` for API testing in Node.js

### UI Testing

**Components to test**:
1. **Anonymous submission form**: Renders correctly, validates inputs, submits successfully
2. **Admin moderation queue**: Displays submissions, filtering works, pagination works
3. **Admin submission detail**: Shows complete data, approve/reject/edit actions work
4. **Admin statistics dashboard**: Displays correct counts and metrics

**Testing framework**: Use React Testing Library for component tests

**Focus areas**:
- User interactions (form submission, button clicks)
- Error message display
- Loading states
- Success confirmations

### Performance Testing

**Load testing scenarios**:
1. **High submission volume**: Simulate many concurrent anonymous submissions
2. **Large moderation queue**: Test performance with thousands of pending submissions
3. **Complex filtering**: Test query performance with multiple filters applied

**Metrics to track**:
- Response time for submission creation
- Response time for moderation queue queries
- Database query performance
- Rate limiter performance

**Tools**: Use `k6` or `artillery` for load testing

### Security Testing

**Test scenarios**:
1. **SQL injection**: Attempt SQL injection in all text inputs
2. **XSS attacks**: Attempt XSS in title and description fields
3. **Rate limit bypass**: Attempt to bypass rate limiting
4. **Authentication bypass**: Attempt to access admin endpoints without auth
5. **CSRF protection**: Verify CSRF tokens required for state-changing operations

**Sanitization**: Verify all user inputs are properly sanitized before storage and display

### Regression Testing

**Maintain test suite**:
- All tests must pass before merging changes
- Add tests for any bugs discovered
- Update tests when requirements change

**CI/CD integration**:
- Run all tests on every commit
- Block merges if tests fail
- Generate test coverage reports
