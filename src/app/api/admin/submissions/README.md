# Admin Submissions API

This directory contains API endpoints for managing anonymous business idea submissions.

## Endpoints

### GET /api/admin/submissions/pending

List pending submissions with filtering and pagination.

**Authentication**: Admin required

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search keyword (searches in title and description)
- `dateFrom` (ISO date string, optional): Filter submissions from this date
- `dateTo` (ISO date string, optional): Filter submissions until this date
- `hasContact` (boolean, optional): Filter by contact information presence
- `flagged` (boolean, optional): Filter by flagged status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "sub_abc123",
        "title": "Mobile App Development",
        "description": "A mobile app for...",
        "budgetMin": 1000,
        "budgetMax": 5000,
        "contactEmail": "user@example.com",
        "contactPhone": "+1-234-567-8900",
        "submitterIp": "192.168.1.1",
        "status": "PENDING",
        "flaggedForReview": false,
        "flagReason": null,
        "submittedAt": "2024-01-01T00:00:00.000Z",
        "reviewedAt": null,
        "images": [
          {
            "id": "img_xyz789",
            "imageId": "img_xyz789",
            "order": 0,
            "image": {
              "id": "img_xyz789",
              "filename": "image.webp",
              "variants": [...]
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `500 Internal Server Error`: Database or server error

**Example Requests**:

```bash
# Get first page of pending submissions
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/submissions/pending

# Search for submissions containing "mobile"
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/admin/submissions/pending?search=mobile"

# Get flagged submissions
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/admin/submissions/pending?flagged=true"

# Get submissions with contact information from January 2024
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/admin/submissions/pending?hasContact=true&dateFrom=2024-01-01&dateTo=2024-01-31"

# Get page 2 with 10 items per page
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/admin/submissions/pending?page=2&limit=10"
```

---

### GET /api/admin/submissions/[id]

Get a single submission by ID with complete details.

**Authentication**: Admin required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "sub_abc123",
      "title": "Mobile App Development",
      "description": "A mobile app for...",
      "budgetMin": 1000,
      "budgetMax": 5000,
      "contactEmail": "user@example.com",
      "contactPhone": "+1-234-567-8900",
      "submitterIp": "192.168.1.1",
      "status": "PENDING",
      "flaggedForReview": false,
      "flagReason": null,
      "submittedAt": "2024-01-01T00:00:00.000Z",
      "reviewedAt": null,
      "images": [...],
      "auditLogs": [...],
      "approvedBy": null,
      "rejectedBy": null
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Submission not found
- `500 Internal Server Error`: Database or server error

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/submissions/sub_abc123
```

---

### PATCH /api/admin/submissions/[id]/approve

Approve a pending submission and create a public business idea.

**Authentication**: Admin required

**Request Body** (optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "budgetMin": 2000,
  "budgetMax": 8000
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "businessIdea": {
      "id": "idea_xyz789",
      "title": "Mobile App Development",
      "description": "A mobile app for...",
      "budgetMin": 1000,
      "budgetMax": 5000,
      "images": [],
      "createdAt": "2024-01-02T10:00:00.000Z",
      "updatedAt": "2024-01-02T10:00:00.000Z"
    },
    "submission": {
      "id": "sub_abc123",
      "status": "APPROVED",
      "approvedById": "admin_123",
      "businessIdeaId": "idea_xyz789",
      "reviewedAt": "2024-01-02T10:00:00.000Z",
      ...
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid override data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Submission not found
- `409 Conflict`: Submission already processed (not PENDING)
- `500 Internal Server Error`: Database or server error

**Example Requests**:

```bash
# Approve submission without overrides
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/admin/submissions/sub_abc123/approve

# Approve submission with overrides
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description with more details",
    "budgetMin": 2000,
    "budgetMax": 8000
  }' \
  http://localhost:3000/api/admin/submissions/sub_abc123/approve
```

---

### PATCH /api/admin/submissions/[id]

Edit a pending submission.

**Authentication**: Admin required

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description with more details",
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
      "description": "Updated description with more details",
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

**Example Requests**:

```bash
# Update title and description
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description with more details"
  }' \
  http://localhost:3000/api/admin/submissions/sub_abc123

# Update budget range
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetMin": 2000,
    "budgetMax": 8000
  }' \
  http://localhost:3000/api/admin/submissions/sub_abc123

# Update contact information
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "newemail@example.com",
    "contactPhone": "+1-987-654-3210"
  }' \
  http://localhost:3000/api/admin/submissions/sub_abc123
```

---

### GET /api/admin/submissions/stats

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

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/submissions/stats
```

---

### PATCH /api/admin/submissions/[id]/reject

Reject a pending submission with optional feedback.

**Authentication**: Admin required

**Request Body** (optional):
```json
{
  "reason": "Does not meet quality standards"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": "sub_abc123",
      "title": "Mobile App Development",
      "description": "A mobile app for...",
      "budgetMin": 1000,
      "budgetMax": 5000,
      "status": "REJECTED",
      "rejectedById": "admin_123",
      "rejectionReason": "Does not meet quality standards",
      "reviewedAt": "2024-01-02T10:00:00.000Z",
      ...
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid rejection reason (e.g., too long)
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Submission not found
- `409 Conflict`: Submission already processed (not PENDING)
- `500 Internal Server Error`: Database or server error

**Example Requests**:

```bash
# Reject submission without reason
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/admin/submissions/sub_abc123/reject

# Reject submission with reason
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Does not meet quality standards"
  }' \
  http://localhost:3000/api/admin/submissions/sub_abc123/reject
```

## Requirements Validation

### GET /api/admin/submissions/pending

This endpoint validates the following requirements:

- **3.1**: Returns all pending submissions ordered by submission date (oldest first)
- **3.2**: Includes title, description preview, submission date, and contact information
- **9.1**: Filters by date range when dateFrom/dateTo parameters are provided
- **9.2**: Searches by keyword in title and description
- **9.3**: Filters by contact status (hasContact parameter)
- **9.4**: Returns accurate count matching applied filters

### GET /api/admin/submissions/[id]

This endpoint validates the following requirements:

- **3.3**: Returns complete submission details including all images and audit logs

### PATCH /api/admin/submissions/[id]/approve

This endpoint validates the following requirements:

- **4.1**: Creates a public business idea with submission data
- **4.2**: Removes submission from moderation queue (status changes to APPROVED)
- **4.3**: Preserves all associated images and metadata
- **4.4**: Sets business idea creation timestamp to approval time
- **6.4**: Creates audit log entry for the approval action

### PATCH /api/admin/submissions/[id]

This endpoint validates the following requirements:

- **6.1**: Allows modification of title, description, budget, and contact fields
- **6.3**: Preserves the original submission timestamp (submittedAt)
- **6.4**: Creates audit log entry for the edit action

### PATCH /api/admin/submissions/[id]/reject

This endpoint validates the following requirements:

- **5.1**: Marks submission status as REJECTED
- **5.2**: Removes submission from active moderation queue (status changes to REJECTED)
- **5.3**: Stores optional rejection feedback with the submission
- **5.4**: Retains the submission record for audit purposes
- **6.4**: Creates audit log entry for the rejection action

### GET /api/admin/submissions/stats

This endpoint validates the following requirements:

- **8.1**: Returns count of pending submissions
- **8.2**: Returns count of approved submissions in the last 30 days
- **8.3**: Returns count of rejected submissions in the last 30 days
- **8.4**: Returns average review time for submissions

## Implementation Details

### GET /api/admin/submissions/pending

- Uses `getPendingSubmissions` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Validates query parameters before processing
- Returns submissions with associated images
- Implements FIFO ordering (oldest submissions first)
- Supports case-insensitive search
- Handles pagination with configurable page size

### GET /api/admin/submissions/[id]

- Uses `getSubmissionById` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Returns complete submission data including images with variants and audit logs
- Includes user information for approvedBy and rejectedBy relationships

### PATCH /api/admin/submissions/[id]/approve

- Uses `approveSubmission` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Validates optional override data using Zod schema
- Creates business idea in a transaction with submission status update
- Transfers image associations from submission to business idea
- Sets reviewedAt timestamp and creates audit log entry
- Returns both the created business idea and updated submission
- Handles conflict errors for already-processed submissions

### PATCH /api/admin/submissions/[id]

- Uses `updateSubmission` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Validates optional update data using Zod schema
- Updates allowed fields: title, description, budgetMin, budgetMax, contactEmail, contactPhone
- Preserves original submittedAt timestamp
- Creates audit log entry with edit details
- Returns the updated submission
- Handles conflict errors for non-PENDING submissions

### PATCH /api/admin/submissions/[id]/reject

- Uses `rejectSubmission` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Validates optional rejection reason using Zod schema (max 1000 characters)
- Updates submission status to REJECTED in a transaction
- Sets reviewedAt timestamp and creates audit log entry
- Stores optional rejection reason for future reference
- Retains submission record (does not delete)
- Returns the updated submission
- Handles conflict errors for already-processed submissions

### GET /api/admin/submissions/stats

- Uses `getSubmissionStats` service function from `@/lib/submission-service`
- Requires admin authentication via `requireAdmin` from `@/lib/admin-auth`
- Calculates real-time statistics from database
- Returns pending count, approved/rejected counts (30-day window), average review time, and flagged count
- All calculations performed in a single database query for efficiency
