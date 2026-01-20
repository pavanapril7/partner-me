# Implementation Plan

- [x] 1. Set up database schema and migrations
  - Create Prisma schema models for User, Session, OTP, and LoginAttempt
  - Add necessary indexes for performance
  - Generate and run database migration
  - _Requirements: 1.2, 2.3, 3.2, 6.2, 10.1_

- [x] 2. Implement validation schemas with Zod
  - Create validation schemas for registration (username/password and mobile)
  - Create validation schemas for login (credentials and OTP)
  - Create validation schema for session operations
  - _Requirements: 1.1, 2.1, 2.2, 3.1_

- [ ]* 2.1 Write property test for mobile number validation
  - **Property 1: Mobile number validation**
  - **Validates: Requirements 1.1**

- [ ]* 2.2 Write property test for username validation
  - **Property 4: Username validation**
  - **Validates: Requirements 2.1**

- [ ]* 2.3 Write property test for password validation
  - **Property 5: Password validation**
  - **Validates: Requirements 2.2, 2.5**

- [ ]* 2.4 Write property test for validation error details
  - **Property 20: Validation error details**
  - **Validates: Requirements 9.2**

- [x] 3. Implement password hashing utilities
  - Create password hashing function using bcrypt
  - Create password comparison function
  - Configure bcrypt cost factor
  - _Requirements: 2.3, 8.1, 8.2_

- [ ]* 3.1 Write property test for password hashing
  - **Property 6: Password hashing**
  - **Validates: Requirements 2.3, 8.1, 8.2**

- [x] 4. Implement OTP generation and management
  - Create OTP generation function (6-digit numeric)
  - Create OTP storage function with expiration
  - Create OTP validation function
  - Implement OTP invalidation logic
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.1_

- [ ]* 4.1 Write property test for OTP format
  - **Property 8: OTP format**
  - **Validates: Requirements 3.1**

- [ ]* 4.2 Write property test for OTP persistence with expiration
  - **Property 9: OTP persistence with expiration**
  - **Validates: Requirements 3.2, 3.4**

- [ ]* 4.3 Write property test for OTP invalidation on new request
  - **Property 11: OTP invalidation on new request**
  - **Validates: Requirements 3.5**

- [ ]* 4.4 Write property test for OTP verification
  - **Property 12: OTP verification**
  - **Validates: Requirements 4.1, 4.4**

- [ ]* 4.5 Write property test for OTP single-use
  - **Property 14: OTP single-use**
  - **Validates: Requirements 4.5**

- [x] 5. Implement SMS service integration
  - Create SMS service interface
  - Implement Twilio SMS provider
  - Implement mock SMS provider for testing
  - Add environment variable configuration
  - _Requirements: 3.3_

- [ ]* 5.1 Write property test for OTP SMS delivery
  - **Property 10: OTP SMS delivery**
  - **Validates: Requirements 3.3**

- [x] 6. Implement session management
  - Create session token generation function
  - Create session creation function
  - Create session validation function
  - Create session invalidation (logout) function
  - _Requirements: 6.1, 6.2, 6.4, 7.1_

- [ ]* 6.1 Write property test for session token generation
  - **Property 17: Session token generation**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 6.2 Write property test for session validation
  - **Property 18: Session validation**
  - **Validates: Requirements 6.4, 6.5**

- [ ]* 6.3 Write property test for logout invalidation
  - **Property 19: Logout invalidation**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 7. Implement rate limiting service
  - Create function to record login attempts
  - Create function to check rate limit status
  - Implement 15-minute sliding window logic
  - _Requirements: 10.1, 10.2, 10.4_

- [ ]* 7.1 Write property test for failed attempt tracking
  - **Property 23: Failed attempt tracking**
  - **Validates: Requirements 10.1**

- [ ]* 7.2 Write property test for rate limiting enforcement
  - **Property 24: Rate limiting enforcement**
  - **Validates: Requirements 10.2, 10.3**

- [ ]* 7.3 Write property test for rate limit expiration
  - **Property 25: Rate limit expiration**
  - **Validates: Requirements 10.4**

- [ ]* 7.4 Write property test for rate limit error response
  - **Property 22: Rate limit error response**
  - **Validates: Requirements 9.4**

- [x] 8. Implement authentication service - registration
  - Create registerWithCredentials function
  - Create registerWithMobile function
  - Integrate validation, password hashing, and database operations
  - Handle duplicate username/mobile errors
  - _Requirements: 1.2, 1.3, 2.3, 2.4_

- [ ]* 8.1 Write property test for mobile registration persistence
  - **Property 2: Mobile registration persistence**
  - **Validates: Requirements 1.2, 1.4**

- [ ]* 8.2 Write property test for mobile number uniqueness
  - **Property 3: Mobile number uniqueness**
  - **Validates: Requirements 1.3**

- [ ]* 8.3 Write property test for username uniqueness
  - **Property 7: Username uniqueness**
  - **Validates: Requirements 2.4**

- [x] 9. Implement authentication service - OTP login
  - Create requestOTP function
  - Create verifyOTP function
  - Integrate OTP generation, SMS sending, and session creation
  - Handle expired and invalid OTP errors
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.5_

- [ ]* 9.1 Write property test for session creation on OTP success
  - **Property 13: Session creation on OTP success**
  - **Validates: Requirements 4.2**

- [x] 10. Implement authentication service - credential login
  - Create loginWithCredentials function
  - Integrate password verification and session creation
  - Implement secure error messages (no user enumeration)
  - _Requirements: 5.2, 5.3, 9.3_

- [ ]* 10.1 Write property test for password verification
  - **Property 15: Password verification**
  - **Validates: Requirements 5.2, 5.4**

- [ ]* 10.2 Write property test for session creation on credential success
  - **Property 16: Session creation on credential success**
  - **Validates: Requirements 5.3**

- [ ]* 10.3 Write property test for login error ambiguity
  - **Property 21: Login error ambiguity**
  - **Validates: Requirements 9.3**

- [x] 11. Create API route for credential registration
  - Implement POST /api/auth/register/credentials
  - Add input validation with Zod
  - Add error handling and response formatting
  - Integrate with authentication service
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 12. Create API route for mobile registration
  - Implement POST /api/auth/register/mobile
  - Add input validation with Zod
  - Add error handling and response formatting
  - Integrate with authentication service
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 13. Create API route for OTP request
  - Implement POST /api/auth/otp/request
  - Add input validation with Zod
  - Add rate limiting check
  - Integrate with authentication service
  - _Requirements: 3.1, 3.2, 3.3, 10.2_

- [x] 14. Create API route for OTP verification
  - Implement POST /api/auth/otp/verify
  - Add input validation with Zod
  - Add rate limiting check
  - Integrate with authentication service
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 10.2_

- [x] 15. Create API route for credential login
  - Implement POST /api/auth/login/credentials
  - Add input validation with Zod
  - Add rate limiting check
  - Integrate with authentication service
  - _Requirements: 5.2, 5.3, 9.3, 10.2_

- [x] 16. Create API route for logout
  - Implement POST /api/auth/logout
  - Add session token validation
  - Integrate with authentication service
  - _Requirements: 7.1, 7.2_

- [x] 17. Create API route for session validation
  - Implement GET /api/auth/session
  - Add session token validation
  - Return user information for valid sessions
  - _Requirements: 6.4, 6.5_

- [ ]* 18. Write integration tests for authentication flows
  - Test complete registration flow (both methods)
  - Test complete login flow (both methods)
  - Test session management flow
  - Test rate limiting across multiple requests
  - _Requirements: All_

- [x] 19. Create authentication UI components
  - Create login form component with tab switching (credentials/OTP)
  - Create registration form component with method selection
  - Create OTP input component
  - Add form validation and error display
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.2_

- [x] 20. Integrate authentication with Next.js app
  - Create authentication context/provider
  - Add session persistence (cookies or localStorage)
  - Create protected route wrapper
  - Add logout functionality to UI
  - _Requirements: 6.4, 7.1_

- [x] 21. Add environment configuration
  - Document required environment variables
  - Add .env.example with all auth variables
  - Add configuration validation on startup
  - _Requirements: All_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
