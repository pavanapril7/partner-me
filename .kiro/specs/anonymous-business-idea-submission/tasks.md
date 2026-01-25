# Implementation Plan

- [x] 1. Database schema and migrations
  - Create Prisma schema for AnonymousSubmission, AnonymousSubmissionImage, and SubmissionAuditLog models
  - Add relationships to existing User, BusinessIdea, and Image models
  - Generate and apply database migration
  - _Requirements: 10.1, 10.4_

- [x] 2. Validation schemas and types
  - Create anonymousSubmissionSchema in schemas directory
  - Create submission status and action enums
  - Create TypeScript types for submission data
  - _Requirements: 1.2, 2.2_

- [x] 3. Rate limiting service for submissions
  - Create submission-rate-limit.ts service
  - Implement IP-based rate limiting (3 per 24 hours, 2 per hour)
  - Implement checkSubmissionRateLimit function
  - Implement recordSubmissionAttempt function
  - Implement cleanup for old attempts
  - _Requirements: 7.1, 7.2_

- [ ]* 3.1 Write property test for rate limiting
  - **Property 19: Rate limiting enforces IP-based limits**
  - **Validates: Requirements 7.1**

- [x] 4. Spam detection service
  - Create spam-detection.ts service
  - Implement detectSpamPatterns function
  - Add detection for excessive capitalization, repeated characters, spam keywords
  - Add detection for suspicious URLs and invalid contact patterns
  - Return confidence score and flagging recommendation
  - _Requirements: 7.3_

- [ ]* 4.1 Write property test for spam detection
  - **Property 20: Spam detection flags suspicious submissions**
  - **Validates: Requirements 7.3**

- [x] 5. Submission service layer
  - Create submission-service.ts with business logic functions
  - Implement createAnonymousSubmission function
  - Implement getPendingSubmissions with filtering and pagination
  - Implement getSubmissionById function
  - Implement approveSubmission function (creates BusinessIdea and migrates images)
  - Implement rejectSubmission function
  - Implement updateSubmission function
  - Implement getSubmissionStats function
  - Implement audit logging for all actions
  - _Requirements: 1.2, 1.4, 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4_

- [ ]* 5.1 Write property test for submission creation
  - **Property 1: Valid submission creates pending record**
  - **Validates: Requirements 1.2**

- [ ]* 5.2 Write property test for submission isolation
  - **Property 2: Pending submissions are isolated from public queries**
  - **Validates: Requirements 1.4**

- [ ]* 5.3 Write property test for contact information persistence
  - **Property 3: Contact information is persisted**
  - **Validates: Requirements 1.5**

- [ ]* 5.4 Write property test for approval flow
  - **Property 8: Approval creates public business idea**
  - **Validates: Requirements 4.1**

- [ ]* 5.5 Write property test for approval queue removal
  - **Property 9: Approval removes from moderation queue**
  - **Validates: Requirements 4.2**

- [ ]* 5.6 Write property test for image preservation
  - **Property 10: Approval preserves image associations**
  - **Validates: Requirements 4.3**

- [ ]* 5.7 Write property test for approval timestamp
  - **Property 11: Approval timestamp matches creation time**
  - **Validates: Requirements 4.4**

- [ ]* 5.8 Write property test for rejection status
  - **Property 12: Rejection marks status as REJECTED**
  - **Validates: Requirements 5.1**

- [ ]* 5.9 Write property test for rejection queue removal
  - **Property 13: Rejection removes from active queue**
  - **Validates: Requirements 5.2**

- [ ]* 5.10 Write property test for rejection feedback
  - **Property 14: Rejection feedback is persisted**
  - **Validates: Requirements 5.3**

- [ ]* 5.11 Write property test for rejection retention
  - **Property 15: Rejected submissions are retained**
  - **Validates: Requirements 5.4**

- [ ]* 5.12 Write property test for edit persistence
  - **Property 16: Edits update submission data**
  - **Validates: Requirements 6.1**

- [ ]* 5.13 Write property test for edit timestamp preservation
  - **Property 17: Edits preserve original timestamp**
  - **Validates: Requirements 6.3**

- [ ]* 5.14 Write property test for edit audit logging
  - **Property 18: Edits create audit log entries**
  - **Validates: Requirements 6.4**

- [ ]* 5.15 Write property test for statistics accuracy
  - **Property 21: Stats return accurate pending count**
  - **Property 22: Stats return accurate 30-day approved count**
  - **Property 23: Stats return accurate 30-day rejected count**
  - **Property 24: Stats calculate average review time correctly**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ]* 5.16 Write property test for audit trail
  - **Property 29: Status changes create audit log entries**
  - **Validates: Requirements 10.4**

- [x] 6. Anonymous submission API endpoint
  - Create POST /api/submissions/anonymous route
  - Extract IP address from request
  - Check rate limiting
  - Validate submission data
  - Run spam detection
  - Create submission record with images
  - Return confirmation with estimated review time
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3_

- [ ]* 6.1 Write property test for validation errors
  - **Property 4: Invalid submissions return field-specific errors**
  - **Validates: Requirements 2.2**

- [x] 7. Admin pending submissions list API endpoint
  - Create GET /api/admin/submissions/pending route
  - Require admin authentication
  - Implement filtering by date range, search keyword, contact status, flagged status
  - Implement pagination
  - Return submissions with required fields
  - Return pagination metadata and total count
  - _Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4_

- [ ]* 7.1 Write property test for pending queue ordering
  - **Property 5: Pending queue returns all pending submissions ordered by date**
  - **Validates: Requirements 3.1**

- [ ]* 7.2 Write property test for pending queue fields
  - **Property 6: Pending submission list includes required fields**
  - **Validates: Requirements 3.2**

- [ ]* 7.3 Write property test for date range filtering
  - **Property 25: Date range filter returns correct submissions**
  - **Validates: Requirements 9.1**

- [ ]* 7.4 Write property test for keyword search
  - **Property 26: Keyword search matches title and description**
  - **Validates: Requirements 9.2**

- [ ]* 7.5 Write property test for contact filtering
  - **Property 27: Contact filter returns correct submissions**
  - **Validates: Requirements 9.3**

- [ ]* 7.6 Write property test for filtered count
  - **Property 28: Filtered count matches filtered results**
  - **Validates: Requirements 9.4**

- [x] 8. Admin submission detail API endpoint
  - Create GET /api/admin/submissions/[id] route
  - Require admin authentication
  - Fetch submission with all images and audit logs
  - Return complete submission data
  - Handle not found errors
  - _Requirements: 3.3_

- [ ]* 8.1 Write property test for submission detail completeness
  - **Property 7: Single submission fetch includes complete data**
  - **Validates: Requirements 3.3**

- [x] 9. Admin approve submission API endpoint
  - Create PATCH /api/admin/submissions/[id]/approve route
  - Require admin authentication
  - Validate submission is in PENDING status
  - Create BusinessIdea with submission data
  - Transfer image associations to BusinessIdea
  - Update submission status to APPROVED
  - Set reviewedAt timestamp
  - Create audit log entry
  - Return created BusinessIdea and updated submission
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.4_

- [x] 10. Admin reject submission API endpoint
  - Create PATCH /api/admin/submissions/[id]/reject route
  - Require admin authentication
  - Validate submission is in PENDING status
  - Update submission status to REJECTED
  - Store optional rejection reason
  - Set reviewedAt timestamp
  - Create audit log entry
  - Return updated submission
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.4_

- [x] 11. Admin edit submission API endpoint
  - Create PATCH /api/admin/submissions/[id] route
  - Require admin authentication
  - Validate submission is in PENDING status
  - Update allowed fields (title, description, budget, contact)
  - Preserve submittedAt timestamp
  - Create audit log entry with edit details
  - Return updated submission
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12. Admin submission statistics API endpoint
  - Create GET /api/admin/submissions/stats route
  - Require admin authentication
  - Calculate pending count
  - Calculate approved count (last 30 days)
  - Calculate rejected count (last 30 days)
  - Calculate average review time
  - Calculate flagged count
  - Return statistics object
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Anonymous submission form component
  - Create AnonymousSubmissionForm.tsx component
  - Implement form with title, description, budget, contact fields
  - Integrate with existing ImageUploadInput for image uploads
  - Implement client-side validation with real-time feedback
  - Handle submission with loading state
  - Display success confirmation with review timeframe
  - Display error messages for validation and rate limiting
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [x] 14. Admin moderation queue component
  - Create AdminModerationQueue.tsx component
  - Display list of pending submissions with preview
  - Implement date range filter
  - Implement keyword search
  - Implement contact status filter
  - Implement flagged filter
  - Implement pagination controls
  - Display submission count
  - Handle empty state
  - Link to submission detail view
  - _Requirements: 3.1, 3.2, 3.4, 9.1, 9.2, 9.3, 9.4_

- [x] 15. Admin submission detail component
  - Create AdminSubmissionDetail.tsx component
  - Display complete submission information
  - Display all images with preview
  - Display contact information
  - Display submission and review timestamps
  - Display flagged status and reason
  - Implement approve button with confirmation
  - Implement reject button with optional feedback input
  - Implement edit mode for submission fields
  - Display audit log history
  - Handle loading and error states
  - _Requirements: 3.3, 4.1, 5.1, 5.3, 6.1_

- [x] 16. Admin moderation dashboard component
  - Create AdminModerationDashboard.tsx component
  - Display statistics cards (pending, approved, rejected, flagged)
  - Display average review time metric
  - Display 30-day trends
  - Link to moderation queue
  - Auto-refresh statistics periodically
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 17. Public submission page
  - Create /submit page for anonymous users
  - Render AnonymousSubmissionForm component
  - Add page metadata and SEO
  - Add informational text about submission process
  - Style page consistently with existing design
  - _Requirements: 1.1_

- [x] 18. Admin moderation pages
  - Create /admin/submissions page for moderation queue
  - Create /admin/submissions/[id] page for submission detail
  - Add navigation links in admin header
  - Protect routes with admin authentication
  - Add page metadata
  - _Requirements: 3.1, 3.3_

- [x] 19. Update existing business ideas query
  - Ensure GET /api/business-ideas excludes anonymous submissions
  - Add explicit filter for only approved public business ideas
  - Verify existing components work correctly
  - _Requirements: 1.4, 10.3_

- [x] 20. IP address extraction utility
  - Create utility function to extract IP from Next.js request
  - Handle X-Forwarded-For header for proxies
  - Handle X-Real-IP header
  - Fallback to socket remote address
  - Handle IPv6 addresses
  - _Requirements: 7.1_

- [x] 21. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 22. Integration tests for submission flow
  - Write end-to-end test for anonymous submission → approval → public business idea
  - Write end-to-end test for anonymous submission → rejection
  - Write test for rate limiting enforcement
  - Write test for image association transfer
  - Write test for audit trail completeness
  - _Requirements: All_

- [ ]* 23. API tests for all endpoints
  - Write tests for POST /api/submissions/anonymous
  - Write tests for GET /api/admin/submissions/pending
  - Write tests for GET /api/admin/submissions/[id]
  - Write tests for PATCH /api/admin/submissions/[id]/approve
  - Write tests for PATCH /api/admin/submissions/[id]/reject
  - Write tests for PATCH /api/admin/submissions/[id]
  - Write tests for GET /api/admin/submissions/stats
  - Test authentication and authorization
  - Test error handling
  - _Requirements: All_

- [ ]* 24. UI component tests
  - Write tests for AnonymousSubmissionForm
  - Write tests for AdminModerationQueue
  - Write tests for AdminSubmissionDetail
  - Write tests for AdminModerationDashboard
  - Test user interactions and error states
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.3, 8.1_

- [x] 25. Documentation
  - Add API documentation for new endpoints
  - Add README for submission system
  - Document rate limiting configuration
  - Document spam detection patterns
  - Add admin user guide for moderation
  - _Requirements: All_

- [x] 26. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all property tests pass (100 iterations each)
  - Verify all integration tests pass
  - Verify all API tests pass
  - Verify all UI tests pass
  - Ensure all tests pass, ask the user if questions arise
