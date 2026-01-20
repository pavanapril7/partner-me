# Design Document: Dual Authentication System

## Overview

This design document outlines the implementation of a dual authentication system for a Next.js application that supports both mobile OTP (One-Time Password) and username/password authentication. The system leverages the existing tech stack including Next.js 16, Prisma ORM with PostgreSQL, Zod for validation, and integrates with an SMS provider for OTP delivery.

The authentication system is designed with security as a priority, implementing password hashing, session management, rate limiting, and proper error handling. Users can choose their preferred authentication method during registration and login.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Client/UI     │
│  (React/Next)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  /api/auth/*    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Service   │
│   (Business     │
│     Logic)      │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Prisma  │ │   SMS    │
│   ORM   │ │ Provider │
└────┬────┘ └──────────┘
     │
     ▼
┌─────────────────┐
│   PostgreSQL    │
└─────────────────┘
```

### Layer Responsibilities

1. **API Routes Layer**: Next.js API routes handle HTTP requests, input validation, and response formatting
2. **Service Layer**: Contains business logic for authentication operations
3. **Data Access Layer**: Prisma ORM manages database operations
4. **External Services**: SMS provider for OTP delivery

## Components and Interfaces

### 1. Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  username      String?   @unique
  passwordHash  String?
  mobileNumber  String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  otps          OTP[]
  loginAttempts LoginAttempt[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

model OTP {
  id           String   @id @default(cuid())
  userId       String
  code         String
  expiresAt    DateTime
  isUsed       Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, isUsed])
}

model LoginAttempt {
  id         String   @id @default(cuid())
  identifier String   // username or mobile number
  success    Boolean
  attemptAt  DateTime @default(now())
  userId     String?
  
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([identifier, attemptAt])
}
```

### 2. Validation Schemas (Zod)

```typescript
// Registration schemas
const usernamePasswordRegistrationSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
});

const mobileRegistrationSchema = z.object({
  mobileNumber: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
});

// Login schemas
const usernamePasswordLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const otpRequestSchema = z.object({
  mobileNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
});

const otpVerifySchema = z.object({
  mobileNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  code: z.string().length(6).regex(/^\d{6}$/),
});
```

### 3. Authentication Service

```typescript
interface AuthService {
  // Registration
  registerWithCredentials(username: string, password: string): Promise<User>;
  registerWithMobile(mobileNumber: string): Promise<User>;
  
  // OTP Authentication
  requestOTP(mobileNumber: string): Promise<void>;
  verifyOTP(mobileNumber: string, code: string): Promise<Session>;
  
  // Credential Authentication
  loginWithCredentials(username: string, password: string): Promise<Session>;
  
  // Session Management
  validateSession(token: string): Promise<Session | null>;
  logout(token: string): Promise<void>;
  
  // Rate Limiting
  checkRateLimit(identifier: string): Promise<boolean>;
  recordLoginAttempt(identifier: string, success: boolean, userId?: string): Promise<void>;
}
```

### 4. SMS Service Interface

```typescript
interface SMSService {
  sendOTP(mobileNumber: string, code: string): Promise<void>;
}
```

### 5. API Endpoints

- `POST /api/auth/register/credentials` - Register with username/password
- `POST /api/auth/register/mobile` - Register with mobile number
- `POST /api/auth/login/credentials` - Login with username/password
- `POST /api/auth/otp/request` - Request OTP for mobile number
- `POST /api/auth/otp/verify` - Verify OTP code
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/session` - Validate current session

## Data Models

### User Model
- Supports both authentication methods (username/password OR mobile)
- At least one authentication method must be configured
- Can have both methods configured for flexibility

### Session Model
- Token-based session management
- Configurable expiration (default: 7 days)
- Tied to user account

### OTP Model
- 6-digit numeric code
- 5-minute expiration
- Single-use only
- Invalidated after successful verification or when new OTP is requested

### LoginAttempt Model
- Tracks all authentication attempts
- Used for rate limiting
- Stores identifier (username or mobile) for tracking

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, the following properties have been identified through reflection to eliminate redundancy:

**Property 1: Mobile number validation**
*For any* string input, the mobile number validation should accept only strings in valid E.164 format and reject all others
**Validates: Requirements 1.1**

**Property 2: Mobile registration persistence**
*For any* valid mobile number, after successful registration, querying the database should return a user account with that mobile number
**Validates: Requirements 1.2, 1.4**

**Property 3: Mobile number uniqueness**
*For any* mobile number already registered in the system, attempting to register with the same mobile number should fail with a uniqueness error
**Validates: Requirements 1.3**

**Property 4: Username validation**
*For any* string input, username validation should accept only alphanumeric strings with underscores between 3-30 characters and reject all others
**Validates: Requirements 2.1**

**Property 5: Password validation**
*For any* string input, password validation should accept only strings of at least 8 characters and reject shorter strings
**Validates: Requirements 2.2, 2.5**

**Property 6: Password hashing**
*For any* password submitted during registration, the stored value in the database should be a valid bcrypt hash and not equal to the plain text password
**Validates: Requirements 2.3, 8.1, 8.2**

**Property 7: Username uniqueness**
*For any* username already registered in the system, attempting to register with the same username should fail with a uniqueness error
**Validates: Requirements 2.4**

**Property 8: OTP format**
*For any* OTP generation request, the generated code should be exactly 6 numeric digits
**Validates: Requirements 3.1**

**Property 9: OTP persistence with expiration**
*For any* generated OTP, querying the database should return an OTP record with an expiration timestamp set to 5 minutes after creation
**Validates: Requirements 3.2, 3.4**

**Property 10: OTP SMS delivery**
*For any* OTP generation, the SMS service should be invoked with the correct mobile number and generated code
**Validates: Requirements 3.3**

**Property 11: OTP invalidation on new request**
*For any* user with an existing unexpired OTP, requesting a new OTP should mark all previous OTPs for that mobile number as used/invalid
**Validates: Requirements 3.5**

**Property 12: OTP verification**
*For any* valid unexpired OTP, submitting the correct code should succeed, and submitting an incorrect code should fail
**Validates: Requirements 4.1, 4.4**

**Property 13: Session creation on OTP success**
*For any* successful OTP verification, a session should be created and stored in the database with a valid token
**Validates: Requirements 4.2**

**Property 14: OTP single-use**
*For any* OTP that has been successfully verified, attempting to verify it again should fail
**Validates: Requirements 4.5**

**Property 15: Password verification**
*For any* user with stored credentials, submitting the correct password should succeed and submitting an incorrect password should fail
**Validates: Requirements 5.2, 5.4**

**Property 16: Session creation on credential success**
*For any* successful credential-based login, a session should be created and stored in the database with a valid token
**Validates: Requirements 5.3**

**Property 17: Session token generation**
*For any* successful authentication (OTP or credentials), a unique session token should be generated and returned
**Validates: Requirements 6.1, 6.2**

**Property 18: Session validation**
*For any* valid session token, validation should succeed and return the associated user information; for invalid tokens, validation should fail
**Validates: Requirements 6.4, 6.5**

**Property 19: Logout invalidation**
*For any* valid session, after logout, the session token should no longer validate successfully
**Validates: Requirements 7.1, 7.2, 7.3**

**Property 20: Validation error details**
*For any* validation failure, the error response should contain specific field-level error information
**Validates: Requirements 9.2**

**Property 21: Login error ambiguity**
*For any* failed credential login, the error message should not reveal whether the username exists or the password is incorrect
**Validates: Requirements 9.3**

**Property 22: Rate limit error response**
*For any* authentication attempt when rate limit is exceeded, the response should indicate rate limiting is active
**Validates: Requirements 9.4**

**Property 23: Failed attempt tracking**
*For any* failed authentication attempt, the system should record the attempt with the identifier and timestamp
**Validates: Requirements 10.1**

**Property 24: Rate limiting enforcement**
*For any* identifier with 5 or more failed attempts within 15 minutes, subsequent authentication attempts should be blocked with a rate limit error
**Validates: Requirements 10.2, 10.3**

**Property 25: Rate limit expiration**
*For any* rate-limited identifier, after 15 minutes from the first failed attempt, authentication attempts should be allowed again
**Validates: Requirements 10.4**

## Error Handling

### Error Types

1. **Validation Errors** (400 Bad Request)
   - Invalid input format
   - Missing required fields
   - Field-specific validation failures

2. **Authentication Errors** (401 Unauthorized)
   - Invalid credentials
   - Expired OTP
   - Invalid session token
   - Generic "authentication failed" message (no user enumeration)

3. **Rate Limit Errors** (429 Too Many Requests)
   - Too many failed login attempts
   - Includes retry-after information

4. **Conflict Errors** (409 Conflict)
   - Duplicate username
   - Duplicate mobile number

5. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - SMS service failures
   - Unexpected errors

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>; // Field-level validation errors
    retryAfter?: number; // For rate limiting
  };
}
```

### Security Considerations

- Never reveal whether a username or mobile number exists
- Use generic "authentication failed" messages
- Log detailed errors server-side for debugging
- Return user-friendly messages to clients

## Testing Strategy

### Unit Testing

The system will use Jest as the testing framework (already configured in the project). Unit tests will cover:

1. **Validation Logic**
   - Test specific examples of valid and invalid inputs
   - Test boundary cases (minimum/maximum lengths)
   - Test format validation (E.164, username patterns)

2. **Service Layer Functions**
   - Test individual authentication service methods
   - Test error handling paths
   - Test integration with Prisma and SMS service

3. **API Route Handlers**
   - Test request/response handling
   - Test error response formatting
   - Test middleware integration

### Property-Based Testing

The system will use **fast-check** (already installed in package.json) for property-based testing. Each correctness property will be implemented as a property-based test:

- **Configuration**: Each property test will run a minimum of 100 iterations
- **Tagging**: Each test will include a comment with the format: `**Feature: dual-authentication, Property {number}: {property_text}**`
- **Coverage**: All 25 correctness properties listed above will be implemented as property-based tests
- **Generators**: Custom generators will be created for:
  - Valid/invalid mobile numbers
  - Valid/invalid usernames
  - Valid/invalid passwords
  - OTP codes
  - Session tokens

### Integration Testing

Integration tests will verify:
- End-to-end authentication flows
- Database transaction handling
- SMS service integration (with mocking)
- Rate limiting across multiple requests

### Test Organization

```
__tests__/
  auth/
    unit/
      validation.test.ts
      auth-service.test.ts
      password-hashing.test.ts
    properties/
      registration-properties.test.ts
      otp-properties.test.ts
      credential-properties.test.ts
      session-properties.test.ts
      rate-limit-properties.test.ts
    integration/
      auth-flow.test.ts
```

## Security Considerations

### Password Security
- Use bcrypt with appropriate cost factor (default: 10)
- Never log or expose passwords
- Enforce minimum password requirements

### OTP Security
- 6-digit codes provide 1,000,000 combinations
- 5-minute expiration limits brute force window
- Single-use prevents replay attacks
- Invalidate old OTPs on new request

### Session Security
- Use cryptographically secure random tokens
- Store sessions server-side
- Implement session expiration (7 days default)
- Support session revocation

### Rate Limiting
- Track attempts by identifier (username or mobile)
- 5 attempts per 15-minute window
- Prevents brute force attacks
- Applies to both authentication methods

### Data Protection
- Hash passwords with bcrypt
- Use parameterized queries (Prisma handles this)
- Validate all inputs with Zod
- Sanitize error messages to prevent enumeration

## Implementation Notes

### SMS Provider Integration

The system will use a pluggable SMS service interface. Initial implementation can use:
- **Twilio** (recommended for production)
- **AWS SNS** (if using AWS infrastructure)
- **Mock service** (for development/testing)

Configuration via environment variables:
```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx
```

### Session Token Generation

Use Node.js crypto module for secure random token generation:
```typescript
import { randomBytes } from 'crypto';

function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
```

### Database Indexes

Critical indexes for performance:
- `Session.token` - Fast session lookup
- `Session.userId` - User's active sessions
- `OTP.userId, OTP.isUsed` - Active OTP lookup
- `LoginAttempt.identifier, LoginAttempt.attemptAt` - Rate limiting queries

### Environment Variables

Required configuration:
```
DATABASE_URL=postgresql://...
SESSION_EXPIRY_DAYS=7
OTP_EXPIRY_MINUTES=5
RATE_LIMIT_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx
```

## Future Enhancements

1. **Multi-factor Authentication**: Require both password and OTP
2. **Social Login**: OAuth integration (Google, Facebook, etc.)
3. **Biometric Authentication**: WebAuthn support
4. **Password Reset**: OTP-based password recovery
5. **Session Management UI**: View and revoke active sessions
6. **Audit Logging**: Comprehensive authentication event logging
7. **Account Linking**: Link mobile and username methods to same account
