# Anonymous Business Idea Submission System

## Overview

The Anonymous Business Idea Submission System allows non-authenticated users to submit business ideas to the platform. This feature democratizes the platform by enabling anyone to contribute ideas while maintaining quality through a comprehensive moderation workflow.

## Key Features

- **Public Submission Form**: Anonymous users can submit ideas without creating an account
- **Admin Moderation Queue**: Dedicated interface for reviewing pending submissions
- **Approval/Rejection Workflow**: Admins can approve ideas to publish them or reject with feedback
- **Rate Limiting**: IP-based limits prevent spam (3 submissions per 24 hours, 2 per hour)
- **Spam Detection**: Automatic flagging of suspicious submissions
- **Audit Trail**: Complete history of all submission actions
- **Image Support**: Submissions can include up to 10 images
- **Contact Information**: Optional email/phone for follow-up
- **Statistics Dashboard**: Real-time metrics on submission volume and review times

## System Architecture

### Three-Stage Lifecycle

1. **Submission**: Anonymous users submit ideas through a public form at `/submit`
2. **Moderation**: Admins review submissions in a dedicated queue at `/admin/submissions`
3. **Publication**: Approved submissions become public business ideas visible to all users

### Data Separation

- Pending submissions are stored in a separate `anonymous_submissions` table
- Only approved submissions are migrated to the `business_ideas` table
- This ensures pending/rejected submissions never appear in public queries

### Security Measures

- **Rate Limiting**: IP-based submission limits prevent abuse
- **Spam Detection**: Automatic pattern matching flags suspicious content
- **Input Validation**: All fields validated on client and server
- **Admin Authentication**: All moderation endpoints require admin role
- **Audit Logging**: All actions tracked for accountability

## User Workflows

### Anonymous User Workflow

1. Navigate to `/submit` page
2. Fill out submission form:
   - Title (required, max 200 characters)
   - Description (required, 10-5000 characters)
   - Budget range (required, min ≤ max)
   - Contact email or phone (at least one required)
   - Images (1-10 images required)
3. Submit form
4. Receive confirmation with estimated review time
5. Wait for admin review (no account needed)

### Admin Moderation Workflow

1. Navigate to `/admin/submissions` to view moderation queue
2. Review pending submissions:
   - View list with preview information
   - Filter by date range, keyword, contact status, or flagged status
   - Click submission to view full details
3. For each submission, choose action:
   - **Approve**: Creates public business idea, transfers images
   - **Reject**: Marks as rejected, optionally provide feedback
   - **Edit**: Modify title, description, or budget before approval
4. View statistics dashboard at `/admin/submissions` for metrics

## Database Schema

### AnonymousSubmission Model

Primary table for storing pending submissions.

**Fields**:
- `id`: Unique identifier (CUID)
- `title`: Business idea title (string, max 200 chars)
- `description`: Detailed description (text, 10-5000 chars)
- `budgetMin`: Minimum budget estimate (float)
- `budgetMax`: Maximum budget estimate (float)
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

**Indexes**:
- `(status, submittedAt)`: For efficient moderation queue queries
- `(submitterIp, submittedAt)`: For rate limiting checks

### AnonymousSubmissionImage Model

Links images to submissions with ordering.

**Fields**:
- `id`: Unique identifier (CUID)
- `submissionId`: Reference to AnonymousSubmission
- `imageId`: Reference to Image
- `order`: Display order (integer)
- `createdAt`: Record creation timestamp

**Relationships**:
- Belongs to `AnonymousSubmission` (cascade delete)
- Belongs to `Image` (cascade delete)

**Indexes**:
- `(submissionId, order)`: For efficient ordered image retrieval

### SubmissionAuditLog Model

Tracks all actions performed on submissions.

**Fields**:
- `id`: Unique identifier (CUID)
- `submissionId`: Reference to AnonymousSubmission
- `action`: CREATED | EDITED | APPROVED | REJECTED | FLAGGED | UNFLAGGED
- `performedBy`: User ID (null for system actions)
- `details`: JSON field for additional context
- `createdAt`: Action timestamp

**Relationships**:
- Belongs to `AnonymousSubmission` (cascade delete)
- Belongs to `User` (optional)

**Indexes**:
- `(submissionId, createdAt)`: For efficient audit log retrieval

## API Endpoints

### Public Endpoints

#### POST /api/submissions/anonymous

Create a new anonymous submission.

**Authentication**: None (public endpoint)

**Rate Limiting**: 3 per IP per 24 hours, 2 per IP per hour

**Request Body**:
```json
{
  "title": "Mobile App Development",
  "description": "A mobile app for tracking fitness goals...",
  "budgetMin": 1000,
  "budgetMax": 5000,
  "contactEmail": "user@example.com",
  "contactPhone": "+1-234-567-8900",
  "imageIds": ["img_abc123", "img_def456"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "sub_xyz789",
    "message": "Your submission has been received and is pending review",
    "estimatedReviewTime": "1-3 business days"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (see validation section)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Admin Endpoints

All admin endpoints require authentication with admin role.

#### GET /api/admin/submissions/pending

List pending submissions with filtering and pagination.

See [Admin Submissions API Documentation](../src/app/api/admin/submissions/README.md) for details.

#### GET /api/admin/submissions/[id]

Get a single submission by ID with complete details.

See [Admin Submissions API Documentation](../src/app/api/admin/submissions/README.md) for details.

#### PATCH /api/admin/submissions/[id]

Edit a pending submission.

**Authentication**: Admin required

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "budgetMin": 2000,
  "budgetMax": 8000,
  "contactEmail": "newemail@example.com",
  "contactPhone": "+1-987-654-3210"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "sub_abc123",
      "title": "Updated Title",
      "description": "Updated description",
      "budgetMin": 2000,
      "budgetMax": 8000,
      "contactEmail": "newemail@example.com",
      "contactPhone": "+1-987-654-3210",
      "submittedAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T10:00:00.000Z",
      ...
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid update data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Submission not found
- `409 Conflict`: Submission not in PENDING status
- `500 Internal Server Error`: Database or server error

#### PATCH /api/admin/submissions/[id]/approve

Approve a pending submission and create a public business idea.

See [Admin Submissions API Documentation](../src/app/api/admin/submissions/README.md) for details.

#### PATCH /api/admin/submissions/[id]/reject

Reject a pending submission with optional feedback.

See [Admin Submissions API Documentation](../src/app/api/admin/submissions/README.md) for details.

#### GET /api/admin/submissions/stats

Get submission statistics.

**Authentication**: Admin required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "pending": 15,
    "approved": 42,
    "rejected": 8,
    "approvedLast30Days": 12,
    "rejectedLast30Days": 3,
    "averageReviewTimeHours": 18.5,
    "flaggedCount": 2
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

## Validation Rules

### Title

- **Required**: Yes
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 200 characters
- **Error Messages**:
  - Empty: "Title is required"
  - Too long: "Title must be at most 200 characters"

### Description

- **Required**: Yes
- **Type**: String
- **Min Length**: 10 characters
- **Max Length**: 5000 characters
- **Error Messages**:
  - Too short: "Description must be at least 10 characters"
  - Too long: "Description must be at most 5000 characters"

### Budget Range

- **Required**: Yes (both min and max)
- **Type**: Number (float)
- **Min Value**: 0
- **Constraint**: budgetMin ≤ budgetMax
- **Error Messages**:
  - Negative: "Minimum/Maximum budget must be non-negative"
  - Invalid range: "Minimum budget cannot exceed maximum budget"

### Contact Information

- **Required**: At least one (email or phone)
- **Email Format**: Valid email address (RFC 5322)
- **Phone Format**: International format with country code
- **Error Messages**:
  - Invalid email: "Invalid email format"
  - Invalid phone: "Invalid phone number format"
  - Both missing: "At least one contact method (email or phone) is required"

### Images

- **Required**: Yes
- **Min Count**: 1 image
- **Max Count**: 10 images
- **Type**: Array of image IDs (uploaded via `/api/upload`)
- **Error Messages**:
  - No images: "At least one image is required"
  - Too many: "Maximum 10 images allowed"

## Rate Limiting Configuration

### Submission Rate Limits

**Per IP Address**:
- **24-hour window**: Maximum 3 submissions
- **1-hour window**: Maximum 2 submissions

**Implementation**:
- Rate limits tracked in-memory with periodic cleanup
- IP address extracted from request headers (X-Forwarded-For, X-Real-IP, or socket)
- IPv6 addresses supported

**Error Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the submission limit. Please try again later.",
    "retryAfter": 3600
  }
}
```

**Headers**:
- `Retry-After`: Seconds until rate limit resets

### Configuration

Rate limits are configured in `src/lib/submission-rate-limit.ts`:

```typescript
const SUBMISSION_RATE_LIMIT = {
  MAX_PER_IP_PER_DAY: 3,
  MAX_PER_IP_PER_HOUR: 2,
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000,
  WINDOW_HOUR_MS: 60 * 60 * 1000,
};
```

To adjust limits, modify these constants and restart the server.

### Cleanup

Old rate limit records are automatically cleaned up:
- Records older than 24 hours are removed
- Cleanup runs on each rate limit check
- No manual maintenance required

## Spam Detection Patterns

### Automatic Flagging

Submissions are automatically flagged for review if they contain suspicious patterns. Flagged submissions appear in the moderation queue with a warning indicator.

### Detection Patterns

#### 1. Excessive Capitalization

- **Pattern**: More than 50% of characters are uppercase
- **Example**: "AMAZING BUSINESS OPPORTUNITY!!!"
- **Reason**: Common spam tactic to grab attention

#### 2. Repeated Characters

- **Pattern**: Same character repeated 5+ times consecutively
- **Example**: "Greaaaaat idea!!!!"
- **Reason**: Indicates low-quality or spam content

#### 3. Repeated Words

- **Pattern**: Same word repeated 3+ times consecutively
- **Example**: "Buy now now now!"
- **Reason**: Common spam pattern

#### 4. Spam Keywords

- **Keywords**: "click here", "buy now", "limited time", "act now", "free money", "guaranteed", "no risk", "100% free"
- **Matching**: Case-insensitive
- **Reason**: Common spam phrases

#### 5. Suspicious URLs

- **Pattern**: URLs with suspicious TLDs (.tk, .ml, .ga, .cf, .gq)
- **Pattern**: Shortened URLs (bit.ly, tinyurl.com, etc.)
- **Reason**: Often used in spam to hide destination

#### 6. Invalid Contact Patterns

- **Pattern**: Email addresses with suspicious domains
- **Pattern**: Phone numbers with invalid formats
- **Reason**: Fake contact information

### Spam Check Result

```typescript
interface SpamCheckResult {
  isSpam: boolean;           // Overall spam determination
  confidence: number;        // 0-1 confidence score
  reasons: string[];         // List of triggered patterns
  shouldFlag: boolean;       // Whether to flag for review
}
```

### Configuration

Spam detection is configured in `src/lib/spam-detection.ts`. To adjust sensitivity:

1. Modify pattern thresholds (e.g., capitalization percentage)
2. Add/remove spam keywords
3. Adjust confidence score calculation
4. Update flagging threshold

### Manual Flagging

Admins can also manually flag/unflag submissions:
- Flagging creates an audit log entry
- Flagged submissions appear with indicator in queue
- Flag reason can be added for context

## Admin User Guide

### Accessing the Moderation Interface

1. Log in with an admin account
2. Navigate to **Admin** → **Submissions** in the header
3. You'll see the moderation dashboard with statistics

### Reviewing Submissions

#### Moderation Queue

The queue shows all pending submissions with:
- Title and description preview
- Submission date and time
- Contact information (email/phone)
- Flagged indicator (if applicable)
- Number of images

#### Filtering Submissions

Use filters to find specific submissions:

**Date Range**:
- Click "From" and "To" date pickers
- Select date range to filter submissions
- Useful for reviewing submissions from specific time periods

**Keyword Search**:
- Enter search term in search box
- Searches in both title and description
- Case-insensitive matching

**Contact Status**:
- Filter by "Has Contact Info" or "No Contact Info"
- Useful for prioritizing submissions with follow-up information

**Flagged Status**:
- Filter by "Flagged Only" to see suspicious submissions
- Review these carefully for spam or quality issues

#### Pagination

- Default: 20 submissions per page
- Use page controls at bottom to navigate
- Total count shown at top

### Viewing Submission Details

1. Click on any submission in the queue
2. View complete information:
   - Full title and description
   - Budget range
   - Contact information
   - All images with full-size preview
   - Submission timestamp
   - Flagged status and reason (if applicable)
   - Audit log history

### Approving Submissions

1. Review submission details carefully
2. Optionally edit title, description, or budget
3. Click **Approve** button
4. Confirm approval in dialog
5. Submission is published as public business idea
6. Images are transferred to business idea
7. Submission removed from queue

**What Happens**:
- New business idea created in public catalog
- All images transferred with same order
- Submission status changed to APPROVED
- Audit log entry created
- Submitter cannot see approval (no account)

### Rejecting Submissions

1. Review submission details
2. Click **Reject** button
3. Optionally provide rejection reason
4. Confirm rejection in dialog
5. Submission marked as rejected
6. Submission removed from queue

**What Happens**:
- Submission status changed to REJECTED
- Optional rejection reason stored
- Submission retained for audit purposes
- Audit log entry created
- Submitter cannot see rejection (no account)

**When to Reject**:
- Low quality or incomplete ideas
- Spam or inappropriate content
- Duplicate submissions
- Ideas outside platform scope
- Insufficient detail or clarity

### Editing Submissions

1. View submission details
2. Click **Edit** button
3. Modify title, description, budget, or contact info
4. Click **Save Changes**
5. Changes applied immediately
6. Audit log entry created

**Use Cases**:
- Fix typos or formatting issues
- Clarify vague descriptions
- Adjust budget ranges
- Update contact information
- Improve title for better discoverability

**Note**: Original submission timestamp preserved

### Understanding Statistics

The dashboard shows key metrics:

**Pending**: Current number of submissions awaiting review
**Approved (30 days)**: Submissions approved in last 30 days
**Rejected (30 days)**: Submissions rejected in last 30 days
**Average Review Time**: Mean time from submission to review
**Flagged**: Current number of flagged submissions

Use these metrics to:
- Monitor submission volume
- Track review efficiency
- Identify backlog issues
- Spot spam trends

### Best Practices

1. **Review Regularly**: Check queue daily to maintain fast review times
2. **Be Thorough**: Review all images and details before deciding
3. **Provide Feedback**: Add rejection reasons to help improve quality
4. **Edit When Possible**: Fix minor issues rather than rejecting
5. **Watch for Spam**: Pay attention to flagged submissions
6. **Use Filters**: Leverage filters to prioritize review order
7. **Check Audit Logs**: Review history for context on edited submissions

### Troubleshooting

**Can't see submissions**:
- Verify you have admin role
- Check authentication token is valid
- Refresh page to reload data

**Images not loading**:
- Check image storage is configured
- Verify image IDs are valid
- Check browser console for errors

**Approval fails**:
- Verify submission is still PENDING
- Check for database connection issues
- Review server logs for errors

**Statistics incorrect**:
- Statistics calculated in real-time
- Refresh page to update
- Check date ranges for 30-day metrics

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- anonymous-submission
npm test -- submission-service
npm test -- spam-detection
npm test -- submission-rate-limit

# Run with coverage
npm test -- --coverage
```

### Test Categories

1. **Unit Tests**: Test individual functions and components
2. **Property-Based Tests**: Test correctness properties across many inputs
3. **Integration Tests**: Test end-to-end workflows
4. **API Tests**: Test all endpoints with various scenarios
5. **UI Tests**: Test React components and user interactions

### Property-Based Testing

The system uses property-based testing to verify correctness properties. Each property test runs 100 iterations with randomly generated data.

**Example**:
```typescript
// Property 1: Valid submission creates pending record
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
```

See [Design Document](../.kiro/specs/anonymous-business-idea-submission/design.md) for complete list of correctness properties.

## Troubleshooting

### Common Issues

#### Rate Limit Errors

**Symptom**: Users receive 429 error when submitting

**Causes**:
- User exceeded 3 submissions in 24 hours
- User exceeded 2 submissions in 1 hour
- Multiple users behind same IP (NAT)

**Solutions**:
- Wait for rate limit to reset (shown in `retryAfter`)
- Adjust rate limits in configuration if needed
- Consider IP whitelisting for trusted sources

#### Spam False Positives

**Symptom**: Legitimate submissions flagged as spam

**Causes**:
- Overly aggressive spam detection patterns
- Legitimate content matches spam keywords
- Unusual writing style triggers patterns

**Solutions**:
- Review flagged submissions manually
- Adjust spam detection sensitivity
- Add exceptions for specific patterns
- Manually unflag false positives

#### Image Upload Failures

**Symptom**: Submissions fail due to image errors

**Causes**:
- Image upload endpoint issues
- Storage provider errors
- Invalid image formats
- File size limits exceeded

**Solutions**:
- Check image upload endpoint status
- Verify storage provider configuration
- Review image validation rules
- Check server logs for details

#### Approval/Rejection Failures

**Symptom**: Admin actions fail with errors

**Causes**:
- Submission already processed
- Database connection issues
- Transaction conflicts
- Invalid admin authentication

**Solutions**:
- Verify submission status is PENDING
- Check database connection
- Retry operation
- Verify admin authentication token

### Debugging

**Enable Debug Logging**:
```typescript
// In submission-service.ts
console.log('Creating submission:', submission);
console.log('Rate limit check:', rateLimitResult);
console.log('Spam check:', spamResult);
```

**Check Database**:
```sql
-- View pending submissions
SELECT * FROM anonymous_submissions WHERE status = 'PENDING';

-- View audit logs
SELECT * FROM submission_audit_logs ORDER BY createdAt DESC LIMIT 10;

-- Check rate limit data
SELECT submitterIp, COUNT(*) as count
FROM anonymous_submissions
WHERE submittedAt > NOW() - INTERVAL '24 hours'
GROUP BY submitterIp
HAVING COUNT(*) >= 3;
```

**Monitor API Requests**:
- Check browser network tab for request/response details
- Review server logs for error messages
- Use API testing tools (Postman, curl) to isolate issues

## Security Considerations

### Input Sanitization

All user inputs are sanitized before storage and display:
- HTML entities escaped
- SQL injection prevented via Prisma ORM
- XSS attacks mitigated via React's built-in escaping

### Rate Limiting

IP-based rate limiting prevents abuse:
- Limits enforced at API level
- Tracked in-memory for performance
- Automatic cleanup of old records

### Authentication

Admin endpoints protected by authentication:
- JWT tokens required
- Admin role verified
- Session management via secure cookies

### Audit Trail

All actions logged for accountability:
- Who performed action
- When action occurred
- What changed
- Additional context in JSON field

### Data Privacy

Contact information handled securely:
- Stored encrypted at rest (database level)
- Only accessible to admins
- Not exposed in public APIs
- Retained per data retention policy

## Performance Considerations

### Database Indexes

Optimized queries via strategic indexes:
- `(status, submittedAt)`: Fast moderation queue queries
- `(submitterIp, submittedAt)`: Fast rate limit checks
- `(submissionId, order)`: Fast image retrieval
- `(submissionId, createdAt)`: Fast audit log retrieval

### Pagination

Large result sets handled via pagination:
- Default 20 items per page
- Maximum 100 items per page
- Cursor-based pagination for efficiency

### Caching

Consider caching for high-traffic scenarios:
- Statistics dashboard (cache for 5 minutes)
- Public business ideas list (cache for 1 minute)
- Image variants (CDN caching)

### Rate Limit Storage

In-memory storage for rate limits:
- Fast lookups (O(1))
- Automatic cleanup
- Consider Redis for multi-server deployments

## Future Enhancements

### Potential Features

1. **Email Notifications**: Notify submitters when reviewed
2. **Submission Templates**: Pre-filled forms for common idea types
3. **Bulk Actions**: Approve/reject multiple submissions at once
4. **Advanced Spam Detection**: Machine learning-based detection
5. **Submission Analytics**: Track submission sources and trends
6. **Public Submission Status**: Allow submitters to check status via token
7. **Collaborative Review**: Multiple admins can comment on submissions
8. **Automated Approval**: Auto-approve submissions meeting criteria
9. **Submission Categories**: Categorize ideas for better organization
10. **Export Functionality**: Export submissions to CSV/Excel

### Scalability Improvements

1. **Redis for Rate Limiting**: Distributed rate limiting across servers
2. **Queue System**: Background processing for approvals
3. **Database Sharding**: Partition submissions by date
4. **CDN Integration**: Serve images via CDN
5. **Elasticsearch**: Full-text search for submissions
6. **Microservices**: Separate submission service from main app

## Support

For issues or questions:
- Check this documentation first
- Review server logs for error details
- Check database for data consistency
- Contact development team with details

## Related Documentation

- [Admin Submissions API](../src/app/api/admin/submissions/README.md)
- [Rate Limiting Configuration](./RATE_LIMITING.md)
- [Spam Detection Patterns](./SPAM_DETECTION.md)
- [Image Upload System](./IMAGE_UPLOAD_API.md)
- [Requirements Document](../.kiro/specs/anonymous-business-idea-submission/requirements.md)
- [Design Document](../.kiro/specs/anonymous-business-idea-submission/design.md)
