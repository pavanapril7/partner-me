# Submission System Services

This document describes the service layer functions for the anonymous business idea submission system.

## Overview

The submission system consists of several service modules that handle different aspects of the submission workflow:

- **submission-service.ts**: Core business logic for submissions
- **submission-rate-limit.ts**: IP-based rate limiting
- **spam-detection.ts**: Automatic spam pattern detection
- **ip-extraction.ts**: IP address extraction from requests

## Service Modules

### submission-service.ts

Core service for managing anonymous submissions.

#### Functions

##### createAnonymousSubmission

Creates a new anonymous submission with images and audit logging.

```typescript
async function createAnonymousSubmission(data: {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  contactEmail?: string;
  contactPhone?: string;
  imageIds: string[];
  submitterIp: string;
  flaggedForReview?: boolean;
  flagReason?: string;
}): Promise<AnonymousSubmission>
```

**Parameters**:
- `data`: Submission data including title, description, budget, contact info, and image IDs
- `data.submitterIp`: IP address for rate limiting tracking
- `data.flaggedForReview`: Optional flag for spam detection
- `data.flagReason`: Optional reason for flagging

**Returns**: Created submission with associated images

**Behavior**:
- Creates submission record with PENDING status
- Associates images with submission in specified order
- Creates audit log entry with CREATED action
- Runs in database transaction for atomicity

**Example**:
```typescript
const submission = await createAnonymousSubmission({
  title: 'Mobile App Development',
  description: 'A mobile app for tracking fitness goals.',
  budgetMin: 1000,
  budgetMax: 5000,
  contactEmail: 'john@example.com',
  imageIds: ['img_abc123', 'img_def456'],
  submitterIp: '192.168.1.1',
  flaggedForReview: false,
});
```

##### getPendingSubmissions

Retrieves pending submissions with filtering and pagination.

```typescript
async function getPendingSubmissions(options: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasContact?: boolean;
  flagged?: boolean;
}): Promise<{
  submissions: AnonymousSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>
```

**Parameters**:
- `options.page`: Page number (default: 1)
- `options.limit`: Items per page (default: 20, max: 100)
- `options.search`: Keyword to search in title and description
- `options.dateFrom`: Filter submissions from this date
- `options.dateTo`: Filter submissions until this date
- `options.hasContact`: Filter by contact information presence
- `options.flagged`: Filter by flagged status

**Returns**: Submissions array and pagination metadata

**Behavior**:
- Filters by status = PENDING
- Orders by submittedAt ascending (FIFO)
- Includes associated images
- Case-insensitive search
- Efficient pagination with total count

**Example**:
```typescript
const result = await getPendingSubmissions({
  page: 1,
  limit: 20,
  search: 'mobile',
  flagged: true,
});

console.log(`Found ${result.pagination.total} submissions`);
console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
```

##### getSubmissionById

Retrieves a single submission by ID with complete details.

```typescript
async function getSubmissionById(
  id: string
): Promise<AnonymousSubmission | null>
```

**Parameters**:
- `id`: Submission ID

**Returns**: Submission with images, audit logs, and user relationships, or null if not found

**Behavior**:
- Includes all associated images with variants
- Includes all audit log entries ordered by date
- Includes approvedBy and rejectedBy user information
- Returns null if submission doesn't exist

**Example**:
```typescript
const submission = await getSubmissionById('sub_abc123');

if (submission) {
  console.log('Title:', submission.title);
  console.log('Images:', submission.images.length);
  console.log('Audit logs:', submission.auditLogs.length);
}
```

##### approveSubmission

Approves a pending submission and creates a public business idea.

```typescript
async function approveSubmission(
  submissionId: string,
  adminUserId: string,
  overrides?: {
    title?: string;
    description?: string;
    budgetMin?: number;
    budgetMax?: number;
  }
): Promise<{
  businessIdea: BusinessIdea;
  submission: AnonymousSubmission;
}>
```

**Parameters**:
- `submissionId`: ID of submission to approve
- `adminUserId`: ID of admin performing approval
- `overrides`: Optional data to override submission fields

**Returns**: Created business idea and updated submission

**Behavior**:
- Verifies submission is in PENDING status
- Creates BusinessIdea with submission data (or overrides)
- Transfers image associations to business idea
- Updates submission status to APPROVED
- Sets reviewedAt timestamp
- Links submission to business idea
- Creates audit log entry with APPROVED action
- Runs in database transaction for atomicity

**Throws**:
- Error if submission not found
- Error if submission not in PENDING status

**Example**:
```typescript
const result = await approveSubmission(
  'sub_abc123',
  'admin_xyz789',
  {
    title: 'Updated Title', // Optional override
  }
);

console.log('Business idea created:', result.businessIdea.id);
console.log('Submission approved:', result.submission.status);
```

##### rejectSubmission

Rejects a pending submission with optional feedback.

```typescript
async function rejectSubmission(
  submissionId: string,
  adminUserId: string,
  reason?: string
): Promise<AnonymousSubmission>
```

**Parameters**:
- `submissionId`: ID of submission to reject
- `adminUserId`: ID of admin performing rejection
- `reason`: Optional rejection feedback (max 1000 characters)

**Returns**: Updated submission

**Behavior**:
- Verifies submission is in PENDING status
- Updates submission status to REJECTED
- Stores optional rejection reason
- Sets reviewedAt timestamp
- Creates audit log entry with REJECTED action
- Retains submission record (does not delete)
- Runs in database transaction for atomicity

**Throws**:
- Error if submission not found
- Error if submission not in PENDING status

**Example**:
```typescript
const submission = await rejectSubmission(
  'sub_abc123',
  'admin_xyz789',
  'Does not meet quality standards'
);

console.log('Submission rejected:', submission.status);
console.log('Rejection reason:', submission.rejectionReason);
```

##### updateSubmission

Updates a pending submission's editable fields.

```typescript
async function updateSubmission(
  submissionId: string,
  adminUserId: string,
  updates: {
    title?: string;
    description?: string;
    budgetMin?: number;
    budgetMax?: number;
    contactEmail?: string;
    contactPhone?: string;
  }
): Promise<AnonymousSubmission>
```

**Parameters**:
- `submissionId`: ID of submission to update
- `adminUserId`: ID of admin performing update
- `updates`: Fields to update (all optional)

**Returns**: Updated submission

**Behavior**:
- Verifies submission is in PENDING status
- Updates specified fields only
- Preserves original submittedAt timestamp
- Creates audit log entry with EDITED action and details
- Runs in database transaction for atomicity

**Throws**:
- Error if submission not found
- Error if submission not in PENDING status

**Example**:
```typescript
const submission = await updateSubmission(
  'sub_abc123',
  'admin_xyz789',
  {
    title: 'Updated Title',
    description: 'Updated description with more details',
    budgetMin: 2000,
  }
);

console.log('Submission updated:', submission.updatedAt);
```

##### getSubmissionStats

Calculates submission statistics for the admin dashboard.

```typescript
async function getSubmissionStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  approvedLast30Days: number;
  rejectedLast30Days: number;
  averageReviewTimeHours: number;
  flaggedCount: number;
}>
```

**Returns**: Statistics object with counts and metrics

**Behavior**:
- Counts pending submissions (status = PENDING)
- Counts all approved submissions
- Counts all rejected submissions
- Counts approved in last 30 days (reviewedAt within window)
- Counts rejected in last 30 days (reviewedAt within window)
- Calculates average review time (reviewedAt - submittedAt)
- Counts flagged submissions (flaggedForReview = true)
- All calculations in single database query for efficiency

**Example**:
```typescript
const stats = await getSubmissionStats();

console.log('Pending:', stats.pending);
console.log('Approved (30 days):', stats.approvedLast30Days);
console.log('Average review time:', stats.averageReviewTimeHours, 'hours');
console.log('Flagged:', stats.flaggedCount);
```

### submission-rate-limit.ts

Service for IP-based rate limiting of submissions.

#### Functions

##### checkSubmissionRateLimit

Checks if an IP address has exceeded submission rate limits.

```typescript
function checkSubmissionRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}
```

**Parameters**:
- `ip`: IP address to check

**Returns**: Object indicating if submission is allowed

**Behavior**:
- Cleans up old attempts (>24 hours)
- Checks 1-hour limit (2 submissions)
- Checks 24-hour limit (3 submissions)
- Calculates retryAfter in seconds if limit exceeded
- Returns reason for denial if not allowed

**Example**:
```typescript
const check = checkSubmissionRateLimit('192.168.1.1');

if (!check.allowed) {
  console.log('Rate limit exceeded:', check.reason);
  console.log('Retry after:', check.retryAfter, 'seconds');
}
```

##### recordSubmissionAttempt

Records a successful submission attempt for rate limiting.

```typescript
function recordSubmissionAttempt(ip: string): void
```

**Parameters**:
- `ip`: IP address to record

**Behavior**:
- Adds attempt to in-memory tracking
- Stores timestamp and IP
- Used after successful submission creation

**Example**:
```typescript
// After successful submission
recordSubmissionAttempt('192.168.1.1');
```

##### clearSubmissionAttempts

Clears all rate limit data (for testing).

```typescript
function clearSubmissionAttempts(): void
```

**Behavior**:
- Removes all tracked attempts
- Used in test setup/teardown

**Example**:
```typescript
beforeEach(() => {
  clearSubmissionAttempts();
});
```

#### Configuration

```typescript
const SUBMISSION_RATE_LIMIT = {
  MAX_PER_IP_PER_DAY: 3,
  MAX_PER_IP_PER_HOUR: 2,
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000,
  WINDOW_HOUR_MS: 60 * 60 * 1000,
};
```

### spam-detection.ts

Service for detecting spam patterns in submissions.

#### Functions

##### detectSpamPatterns

Analyzes submission content for spam indicators.

```typescript
function detectSpamPatterns(submission: {
  title: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}): {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  shouldFlag: boolean;
}
```

**Parameters**:
- `submission`: Submission data to analyze

**Returns**: Spam check result with confidence score

**Behavior**:
- Checks multiple spam patterns
- Calculates confidence score (0-1)
- Provides reasons for flagging
- Determines if submission should be flagged

**Patterns Checked**:
1. Excessive capitalization (>50% uppercase) - +0.3
2. Repeated characters (5+ consecutive) - +0.2
3. Repeated words (3+ consecutive) - +0.3
4. Spam keywords - +0.4 per keyword (max +0.8)
5. Suspicious URLs - +0.5
6. Invalid contact patterns - +0.3

**Thresholds**:
- `isSpam`: confidence > 0.7
- `shouldFlag`: confidence > 0.5

**Example**:
```typescript
const result = detectSpamPatterns({
  title: 'AMAZING OPPORTUNITY',
  description: 'Click here to buy now and make money fast!',
  contactEmail: 'test@tempmail.com',
});

console.log('Is spam:', result.isSpam);
console.log('Confidence:', result.confidence);
console.log('Reasons:', result.reasons);
console.log('Should flag:', result.shouldFlag);
```

### ip-extraction.ts

Service for extracting IP addresses from Next.js requests.

#### Functions

##### extractIpAddress

Extracts the client IP address from a Next.js request.

```typescript
function extractIpAddress(request: NextRequest): string
```

**Parameters**:
- `request`: Next.js request object

**Returns**: IP address as string

**Behavior**:
- Checks X-Forwarded-For header (takes first IP)
- Checks X-Real-IP header
- Falls back to socket remote address
- Handles IPv6 addresses
- Returns '0.0.0.0' if unable to extract

**Example**:
```typescript
export async function POST(request: NextRequest) {
  const ip = extractIpAddress(request);
  console.log('Client IP:', ip);
  
  // Use for rate limiting
  const rateLimitCheck = checkSubmissionRateLimit(ip);
}
```

## Usage Examples

### Complete Submission Flow

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractIpAddress } from '@/lib/ip-extraction';
import { checkSubmissionRateLimit, recordSubmissionAttempt } from '@/lib/submission-rate-limit';
import { detectSpamPatterns } from '@/lib/spam-detection';
import { createAnonymousSubmission } from '@/lib/submission-service';
import { anonymousSubmissionSchema } from '@/schemas/anonymous-submission.schema';

export async function POST(request: NextRequest) {
  // Extract IP address
  const ip = extractIpAddress(request);
  
  // Check rate limit
  const rateLimitCheck = checkSubmissionRateLimit(ip);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.reason,
          retryAfter: rateLimitCheck.retryAfter,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitCheck.retryAfter),
        },
      }
    );
  }
  
  // Parse and validate request body
  const body = await request.json();
  const validationResult = anonymousSubmissionSchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: validationResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }
  
  const validatedData = validationResult.data;
  
  // Check for spam
  const spamCheck = detectSpamPatterns({
    title: validatedData.title,
    description: validatedData.description,
    contactEmail: validatedData.contactEmail,
    contactPhone: validatedData.contactPhone,
  });
  
  // Create submission
  const submission = await createAnonymousSubmission({
    ...validatedData,
    submitterIp: ip,
    flaggedForReview: spamCheck.shouldFlag,
    flagReason: spamCheck.shouldFlag ? spamCheck.reasons.join('; ') : undefined,
  });
  
  // Record attempt for rate limiting
  recordSubmissionAttempt(ip);
  
  return NextResponse.json(
    {
      success: true,
      data: {
        id: submission.id,
        message: 'Your submission has been received and is pending review',
        estimatedReviewTime: '1-3 business days',
      },
    },
    { status: 201 }
  );
}
```

### Admin Approval Flow

```typescript
import { requireAdmin } from '@/lib/admin-auth';
import { approveSubmission } from '@/lib/submission-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin authentication
  const admin = await requireAdmin(request);
  
  // Parse optional overrides
  const body = await request.json();
  
  try {
    // Approve submission
    const result = await approveSubmission(
      params.id,
      admin.id,
      body // Optional overrides
    );
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUBMISSION_NOT_FOUND',
            message: 'Submission not found',
          },
        },
        { status: 404 }
      );
    }
    
    if (error.message.includes('not PENDING')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUBMISSION_ALREADY_PROCESSED',
            message: 'This submission has already been processed',
          },
        },
        { status: 409 }
      );
    }
    
    throw error;
  }
}
```

## Error Handling

### Service Errors

All service functions throw errors for exceptional conditions:

```typescript
try {
  const submission = await approveSubmission(id, adminId);
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle not found
  } else if (error.message.includes('not PENDING')) {
    // Handle already processed
  } else {
    // Handle other errors
  }
}
```

### Rate Limit Errors

Rate limit checks return structured results:

```typescript
const check = checkSubmissionRateLimit(ip);

if (!check.allowed) {
  // check.reason: Human-readable reason
  // check.retryAfter: Seconds until reset
}
```

### Spam Detection

Spam detection never throws errors, always returns result:

```typescript
const result = detectSpamPatterns(submission);

// result.isSpam: High confidence spam
// result.shouldFlag: Moderate confidence, flag for review
// result.confidence: 0-1 score
// result.reasons: Array of triggered patterns
```

## Testing

### Unit Tests

Each service module has comprehensive unit tests:

- `__tests__/submission-service.test.ts`
- `__tests__/submission-rate-limit.test.ts`
- `__tests__/spam-detection.test.ts`
- `__tests__/ip-extraction.test.ts`

### Integration Tests

Integration tests cover complete workflows:

- `__tests__/api-submissions-anonymous.test.ts`
- `__tests__/api-admin-submissions-*.test.ts`

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- submission-service.test.ts

# Run with coverage
npm test -- --coverage
```

## Performance Considerations

### Database Queries

- Use indexes for efficient queries
- Batch operations in transactions
- Include related data in single query
- Paginate large result sets

### Rate Limiting

- In-memory storage for fast lookups
- Automatic cleanup of old records
- Consider Redis for multi-server deployments

### Spam Detection

- Pattern matching is fast (regex-based)
- No external API calls
- Runs synchronously in request handler

## Security Considerations

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented via Prisma ORM
- XSS attacks mitigated via React escaping

### Rate Limiting

- IP-based limits prevent abuse
- Configurable thresholds
- Automatic cleanup

### Spam Detection

- Multiple detection patterns
- Adjustable sensitivity
- Flag for review, don't auto-reject

### Audit Logging

- All actions logged
- Includes user ID and timestamp
- Additional context in JSON field

## Related Documentation

- [Anonymous Submission System](../../docs/ANONYMOUS_SUBMISSION_SYSTEM.md)
- [Rate Limiting Configuration](../../docs/RATE_LIMITING.md)
- [Spam Detection Patterns](../../docs/SPAM_DETECTION.md)
- [Admin Submissions API](../app/api/admin/submissions/README.md)
- [Public Submissions API](../app/api/submissions/README.md)
