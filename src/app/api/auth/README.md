# Authentication API Routes

This directory contains the API routes for the dual authentication system.

## Endpoints

### POST /api/auth/register/credentials

Register a new user with username and password credentials.

**Requirements:** 2.1, 2.2, 2.3, 2.4

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "password": "string (min 8 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "createdAt": "ISO 8601 timestamp"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "username": ["error message"],
      "password": ["error message"]
    }
  }
}
```

- **409 Conflict** - Duplicate username
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ERROR",
    "message": "Username already exists"
  }
}
```

- **500 Internal Server Error** - Server error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/register/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepass123"
  }'
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storage
- **Input Validation**: Zod schemas validate all inputs before processing
- **Error Handling**: Generic error messages prevent user enumeration
- **Field-level Validation**: Detailed validation errors for better UX

## Testing

Run tests for the credential registration API:

```bash
npm test -- __tests__/api-register-credentials.test.ts
```


### POST /api/auth/register/mobile

Register a new user with mobile number for OTP-based authentication.

**Requirements:** 1.1, 1.2, 1.3

**Request Body:**
```json
{
  "mobileNumber": "string (E.164 format, e.g., +1234567890)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "mobileNumber": "string",
    "createdAt": "ISO 8601 timestamp"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **409 Conflict** - Duplicate mobile number
- **500 Internal Server Error** - Server error

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/register/mobile \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "+1234567890"
  }'
```

### POST /api/auth/otp/request

Request an OTP code for mobile number authentication.

**Requirements:** 3.1, 3.2, 3.3, 10.2

**Request Body:**
```json
{
  "mobileNumber": "string (E.164 format, e.g., +1234567890)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "mobileNumber": ["error message"]
    }
  }
}
```

- **401 Unauthorized** - User not found (generic message for security)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed"
  }
}
```

- **429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many attempts. Please try again later.",
    "retryAfter": 900
  }
}
```

- **500 Internal Server Error** - OTP generation or SMS sending failed

**Features:**
- Generates a random 6-digit numeric OTP code
- Stores the OTP with 5-minute expiration
- Sends the OTP to the user's mobile number via SMS
- Invalidates previous unexpired OTPs for the mobile number
- Rate limiting: 5 attempts per 15 minutes

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "+1234567890"
  }'
```

### POST /api/auth/otp/verify

Verify an OTP code and create an authenticated session.

**Requirements:** 4.1, 4.2, 4.4, 4.5, 10.2

**Request Body:**
```json
{
  "mobileNumber": "string (E.164 format, e.g., +1234567890)",
  "code": "string (6-digit numeric code)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "string",
    "token": "string",
    "userId": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "mobileNumber": ["error message"],
      "code": ["error message"]
    }
  }
}
```

- **401 Unauthorized** - Invalid or expired OTP
```json
{
  "success": false,
  "error": {
    "code": "OTP_INVALID",
    "message": "Invalid OTP"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "OTP_EXPIRED",
    "message": "OTP has expired"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed"
  }
}
```

- **429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many attempts. Please try again later.",
    "retryAfter": 900
  }
}
```

- **500 Internal Server Error** - Server error

**Features:**
- Validates mobile number format (E.164 format)
- Validates OTP code format (6-digit numeric)
- Checks rate limiting (5 attempts per 15 minutes)
- Verifies the OTP code matches the stored OTP
- Checks that the OTP has not expired
- Creates an authenticated session on successful verification
- Invalidates the OTP after successful verification (single-use)
- Records login attempts for rate limiting

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "+1234567890",
    "code": "123456"
  }'
```

## Rate Limiting

All authentication endpoints implement rate limiting to prevent brute force attacks:

- **Limit:** 5 failed attempts per 15 minutes
- **Scope:** Per identifier (username or mobile number)
- **Window:** 15-minute sliding window
- **Response:** 429 Too Many Requests with `retryAfter` field

## Testing

Run tests for the OTP verification API:

```bash
npm test -- __tests__/api-otp-verify.test.ts
```

### POST /api/auth/login/credentials

Login with username and password credentials.

**Requirements:** 5.2, 5.3, 9.3, 10.2

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "string",
    "token": "string",
    "userId": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **401 Unauthorized** - Authentication failed (generic message for security)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

**Features:**
- Validates username and password are provided
- Checks rate limiting (5 attempts per 15 minutes)
- Retrieves the stored password hash for the username
- Compares the submitted password against the stored hash
- Creates an authenticated session on successful verification
- Returns generic error messages to prevent user enumeration

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/login/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepass123"
  }'
```

### POST /api/auth/logout

Logout and invalidate the current session.

**Requirements:** 7.1, 7.2

**Request Body:**
```json
{
  "token": "string (session token)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Validation error (missing or invalid token format)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "token": ["Session token is required"]
    }
  }
}
```

- **404 Not Found** - Session not found (already logged out or invalid token)
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found or already logged out"
  }
}
```

- **500 Internal Server Error** - Server error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Features:**
- Validates session token is provided
- Invalidates the session token
- Removes the session from storage
- Handles multiple logout attempts gracefully

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "token": "session-token-abc123"
  }'
```

## Testing

Run tests for the logout API:

```bash
npm test -- __tests__/api-logout.test.ts
```

### GET /api/auth/session

Validate a session token and return user information.

**Requirements:** 6.4, 6.5

**Request:**
- **Authorization header:** `Bearer <token>`
- **OR query parameter:** `?token=<token>`

**Success Response (200):**
```json
{
  "success": true,
  "session": {
    "id": "string",
    "userId": "string",
    "token": "string",
    "expiresAt": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "user": {
      "id": "string",
      "username": "string | null",
      "mobileNumber": "string | null",
      "email": "string | null",
      "name": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing token
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_REQUIRED",
    "message": "Session token is required"
  }
}
```

- **401 Unauthorized** - Invalid or expired session
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SESSION",
    "message": "Session is invalid or expired"
  }
}
```

- **500 Internal Server Error** - Server error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Features:**
- Accepts token via Authorization header (Bearer token) or query parameter
- Validates the session token
- Returns user information for valid, non-expired sessions
- Automatically cleans up expired sessions
- Returns error for invalid or expired sessions

**Example Usage:**

Using Authorization header:
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer session-token-abc123"
```

Using query parameter:
```bash
curl -X GET "http://localhost:3000/api/auth/session?token=session-token-abc123"
```

## Testing

Run tests for the session validation API:

```bash
npm test -- __tests__/api-session.test.ts
```
