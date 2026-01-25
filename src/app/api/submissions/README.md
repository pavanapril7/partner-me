# Anonymous Submissions API

This directory contains the public API endpoint for anonymous business idea submissions.

## Endpoint

### POST /api/submissions/anonymous

Create a new anonymous business idea submission.

**Authentication**: None (public endpoint)

**Rate Limiting**: 
- 3 submissions per IP address per 24 hours
- 2 submissions per IP address per 1 hour

**Request Body**:
```json
{
  "title": "Mobile App Development",
  "description": "A mobile app for tracking fitness goals and nutrition. Users can log workouts, meals, and track progress over time. The app will include social features for sharing achievements and competing with friends.",
  "budgetMin": 1000,
  "budgetMax": 5000,
  "contactEmail": "john.doe@example.com",
  "contactPhone": "+1-555-123-4567",
  "imageIds": ["img_abc123", "img_def456", "img_ghi789"]
}
```

**Field Descriptions**:

- `title` (string, required): Business idea title
  - Min length: 1 character
  - Max length: 200 characters
  
- `description` (string, required): Detailed description of the business idea
  - Min length: 10 characters
  - Max length: 5000 characters
  
- `budgetMin` (number, required): Minimum budget estimate in dollars
  - Must be non-negative
  - Must be less than or equal to budgetMax
  
- `budgetMax` (number, required): Maximum budget estimate in dollars
  - Must be non-negative
  - Must be greater than or equal to budgetMin
  
- `contactEmail` (string, optional): Email address for follow-up
  - Must be valid email format
  - At least one of contactEmail or contactPhone is required
  
- `contactPhone` (string, optional): Phone number for follow-up
  - Must be valid international format with country code
  - At least one of contactEmail or contactPhone is required
  
- `imageIds` (array of strings, required): IDs of uploaded images
  - Min count: 1 image
  - Max count: 10 images
  - Images must be uploaded via `/api/upload` endpoint first

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

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "title": "Title is required",
      "budgetMin": "Minimum budget cannot exceed maximum budget",
      "contactEmail": "At least one contact method (email or phone) is required"
    }
  }
}
```

**Common validation errors**:
- `title`: "Title is required", "Title must be at most 200 characters"
- `description`: "Description must be at least 10 characters", "Description must be at most 5000 characters"
- `budgetMin`: "Minimum budget must be non-negative", "Minimum budget cannot exceed maximum budget"
- `budgetMax`: "Maximum budget must be non-negative"
- `contactEmail`: "Invalid email format", "At least one contact method (email or phone) is required"
- `contactPhone`: "Invalid phone number format"
- `imageIds`: "At least one image is required", "Maximum 10 images allowed"

#### 429 Too Many Requests - Rate Limit Exceeded

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

**Response Headers**:
```
Retry-After: 3600
```

**Rate limit scenarios**:
- More than 3 submissions in 24 hours: "Too many submissions in the last 24 hours"
- More than 2 submissions in 1 hour: "Too many submissions in the last hour"

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "An error occurred while processing your request",
    "trackingId": "err_abc123"
  }
}
```

## Example Requests

### Using cURL

**Basic submission**:
```bash
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mobile App Development",
    "description": "A mobile app for tracking fitness goals and nutrition.",
    "budgetMin": 1000,
    "budgetMax": 5000,
    "contactEmail": "john.doe@example.com",
    "imageIds": ["img_abc123"]
  }'
```

**With phone contact**:
```bash
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform",
    "description": "An online marketplace for handmade crafts and artisan goods.",
    "budgetMin": 5000,
    "budgetMax": 15000,
    "contactPhone": "+1-555-987-6543",
    "imageIds": ["img_abc123", "img_def456"]
  }'
```

**With both email and phone**:
```bash
curl -X POST http://localhost:3000/api/submissions/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI-Powered Analytics",
    "description": "A business intelligence platform using machine learning for predictive analytics.",
    "budgetMin": 10000,
    "budgetMax": 25000,
    "contactEmail": "jane.smith@example.com",
    "contactPhone": "+1-555-111-2222",
    "imageIds": ["img_abc123", "img_def456", "img_ghi789"]
  }'
```

### Using JavaScript Fetch

```javascript
async function submitBusinessIdea(data) {
  try {
    const response = await fetch('/api/submissions/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const hours = Math.ceil(parseInt(retryAfter) / 3600);
        alert(`Rate limit exceeded. Please try again in ${hours} hour(s).`);
      } else if (response.status === 400) {
        // Handle validation errors
        console.error('Validation errors:', result.error.fields);
      } else {
        console.error('Submission failed:', result.error.message);
      }
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Example usage
const submissionData = {
  title: 'Mobile App Development',
  description: 'A mobile app for tracking fitness goals and nutrition.',
  budgetMin: 1000,
  budgetMax: 5000,
  contactEmail: 'john.doe@example.com',
  imageIds: ['img_abc123'],
};

const result = await submitBusinessIdea(submissionData);
if (result) {
  console.log('Submission successful:', result.id);
  console.log('Message:', result.message);
  console.log('Estimated review time:', result.estimatedReviewTime);
}
```

### Using Axios

```javascript
import axios from 'axios';

async function submitBusinessIdea(data) {
  try {
    const response = await axios.post('/api/submissions/anonymous', data);
    
    console.log('Submission successful:', response.data.data.id);
    console.log('Message:', response.data.data.message);
    console.log('Estimated review time:', response.data.data.estimatedReviewTime);
    
    return response.data.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const hours = Math.ceil(parseInt(retryAfter) / 3600);
        console.error(`Rate limit exceeded. Please try again in ${hours} hour(s).`);
      } else if (error.response.status === 400) {
        console.error('Validation errors:', error.response.data.error.fields);
      } else {
        console.error('Submission failed:', error.response.data.error.message);
      }
    } else {
      console.error('Network error:', error.message);
    }
    return null;
  }
}
```

## Image Upload Workflow

Before submitting a business idea, images must be uploaded separately:

1. **Upload images** via `/api/upload` endpoint
2. **Receive image IDs** from upload response
3. **Include image IDs** in submission request

**Example workflow**:

```javascript
// Step 1: Upload images
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result.data.id; // Image ID
}

// Step 2: Upload all images
const imageFiles = [file1, file2, file3];
const imageIds = await Promise.all(
  imageFiles.map(file => uploadImage(file))
);

// Step 3: Submit business idea with image IDs
const submissionData = {
  title: 'Mobile App Development',
  description: 'A mobile app for tracking fitness goals.',
  budgetMin: 1000,
  budgetMax: 5000,
  contactEmail: 'john.doe@example.com',
  imageIds: imageIds, // Use uploaded image IDs
};

const result = await submitBusinessIdea(submissionData);
```

See [Image Upload API Documentation](../../../docs/IMAGE_UPLOAD_API.md) for details.

## Spam Detection

Submissions are automatically checked for spam patterns. If suspicious content is detected, the submission is flagged for additional admin review but not rejected.

**Spam indicators**:
- Excessive capitalization (>50% uppercase)
- Repeated characters (5+ consecutive)
- Repeated words (3+ consecutive)
- Spam keywords ("click here", "buy now", etc.)
- Suspicious URLs (shortened links, free TLDs)
- Invalid contact information (disposable emails, fake phone numbers)

**What happens when flagged**:
- Submission is still created with PENDING status
- `flaggedForReview` field set to true
- Admin sees warning indicator in moderation queue
- Admin reviews and decides to approve or reject

See [Spam Detection Documentation](../../../docs/SPAM_DETECTION.md) for details.

## Rate Limiting

Rate limits prevent spam and abuse while allowing legitimate users to submit multiple ideas.

**Limits**:
- **24-hour window**: Maximum 3 submissions per IP address
- **1-hour window**: Maximum 2 submissions per IP address

**How it works**:
- IP address extracted from request headers (X-Forwarded-For, X-Real-IP, or socket)
- Submission attempts tracked in-memory
- Old attempts (>24 hours) automatically cleaned up
- Rate limit checked before creating submission

**Handling rate limits**:
- Check `Retry-After` header for seconds until reset
- Display user-friendly message with time remaining
- Consider implementing exponential backoff for retries

See [Rate Limiting Documentation](../../../docs/RATE_LIMITING.md) for details.

## Validation Rules

### Title

- **Required**: Yes
- **Type**: String
- **Min Length**: 1 character
- **Max Length**: 200 characters
- **Examples**:
  - ✅ "Mobile App Development"
  - ✅ "E-commerce Platform for Artisan Goods"
  - ❌ "" (empty)
  - ❌ "A".repeat(201) (too long)

### Description

- **Required**: Yes
- **Type**: String
- **Min Length**: 10 characters
- **Max Length**: 5000 characters
- **Examples**:
  - ✅ "A mobile app for tracking fitness goals and nutrition."
  - ✅ "An online marketplace..." (detailed description)
  - ❌ "Short" (too short)
  - ❌ "A".repeat(5001) (too long)

### Budget Range

- **Required**: Yes (both min and max)
- **Type**: Number (float)
- **Min Value**: 0
- **Constraint**: budgetMin ≤ budgetMax
- **Examples**:
  - ✅ budgetMin: 1000, budgetMax: 5000
  - ✅ budgetMin: 0, budgetMax: 1000
  - ✅ budgetMin: 5000, budgetMax: 5000 (equal is valid)
  - ❌ budgetMin: -100 (negative)
  - ❌ budgetMin: 5000, budgetMax: 1000 (min > max)

### Contact Email

- **Required**: At least one of email or phone
- **Type**: String
- **Format**: Valid email address (RFC 5322)
- **Examples**:
  - ✅ "john.doe@example.com"
  - ✅ "jane+business@company.co.uk"
  - ❌ "invalid-email" (invalid format)
  - ❌ "user@" (incomplete)

### Contact Phone

- **Required**: At least one of email or phone
- **Type**: String
- **Format**: International format with country code
- **Examples**:
  - ✅ "+1-555-123-4567"
  - ✅ "+44 20 7123 4567"
  - ✅ "+1 (555) 123-4567"
  - ❌ "555-1234" (missing country code)
  - ❌ "123" (invalid format)

### Image IDs

- **Required**: Yes
- **Type**: Array of strings
- **Min Count**: 1 image
- **Max Count**: 10 images
- **Format**: Valid image IDs from `/api/upload`
- **Examples**:
  - ✅ ["img_abc123"]
  - ✅ ["img_abc123", "img_def456", "img_ghi789"]
  - ❌ [] (empty array)
  - ❌ ["img_1", "img_2", ..., "img_11"] (too many)

## Requirements Validation

This endpoint validates the following requirements from the specification:

- **1.1**: Displays submission form without requiring authentication
- **1.2**: Creates pending submission record with valid data
- **1.3**: Stores submission with PENDING status
- **1.5**: Stores contact information securely for admin follow-up
- **2.1**: Displays confirmation message after successful submission
- **2.2**: Displays specific error messages for invalid fields
- **2.3**: Displays message when rate-limited
- **2.4**: Provides estimated review timeframe
- **7.1**: Restricts submissions to 3 per IP per 24 hours
- **7.2**: Rejects submissions exceeding rate limit with clear error
- **7.3**: Flags submissions with suspicious patterns for review

## Implementation Details

### Service Layer

Uses `createAnonymousSubmission` function from `@/lib/submission-service`:

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
}): Promise<AnonymousSubmission>
```

### IP Address Extraction

Uses `extractIpAddress` function from `@/lib/ip-extraction`:

```typescript
function extractIpAddress(request: NextRequest): string
```

Extracts IP from headers in order:
1. X-Forwarded-For (first IP)
2. X-Real-IP
3. Socket remote address

### Rate Limiting

Uses `checkSubmissionRateLimit` and `recordSubmissionAttempt` from `@/lib/submission-rate-limit`:

```typescript
function checkSubmissionRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

function recordSubmissionAttempt(ip: string): void
```

### Spam Detection

Uses `detectSpamPatterns` from `@/lib/spam-detection`:

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

### Validation

Uses `anonymousSubmissionSchema` from `@/schemas/anonymous-submission.schema`:

```typescript
const anonymousSubmissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  imageIds: z.array(z.string()).min(1).max(10),
}).refine(/* budget and contact validations */);
```

## Testing

### Unit Tests

See `__tests__/api-submissions-anonymous.test.ts` for comprehensive test coverage:

- Valid submission creates pending record
- Validation errors returned for invalid data
- Rate limiting enforced correctly
- Spam detection flags suspicious submissions
- IP address extraction works correctly
- Image associations created correctly

### Integration Tests

Test complete submission workflow:

1. Upload images via `/api/upload`
2. Submit business idea with image IDs
3. Verify submission created with PENDING status
4. Verify images associated with submission
5. Verify submission not visible in public queries
6. Admin approves submission
7. Verify business idea created and visible publicly

### Manual Testing

Use the submission form at `/submit` or test with cURL/Postman.

## Security Considerations

### Input Sanitization

- All inputs validated with Zod schemas
- HTML entities escaped before storage
- SQL injection prevented via Prisma ORM
- XSS attacks mitigated via React's built-in escaping

### Rate Limiting

- IP-based limits prevent spam
- Tracked in-memory for performance
- Automatic cleanup of old records

### Spam Detection

- Automatic flagging of suspicious content
- Multiple detection patterns
- Adjustable sensitivity

### Data Privacy

- Contact information stored securely
- Only accessible to admins
- Not exposed in public APIs

## Related Documentation

- [Anonymous Submission System](../../../docs/ANONYMOUS_SUBMISSION_SYSTEM.md)
- [Admin Submissions API](../admin/submissions/README.md)
- [Rate Limiting Configuration](../../../docs/RATE_LIMITING.md)
- [Spam Detection Patterns](../../../docs/SPAM_DETECTION.md)
- [Image Upload API](../../../docs/IMAGE_UPLOAD_API.md)
- [Requirements Document](../../../.kiro/specs/anonymous-business-idea-submission/requirements.md)
- [Design Document](../../../.kiro/specs/anonymous-business-idea-submission/design.md)
