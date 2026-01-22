# Implementation Plan: Business Ideas Showcase

- [x] 1. Set up database models and migrations
  - Create Prisma schema for BusinessIdea and PartnershipRequest models
  - Add PartnershipRole and PartnershipStatus enums
  - Generate and run database migration
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 12.3_

- [ ]* 1.1 Write property test for business idea model
  - **Property 6: Business idea IDs are unique**
  - **Property 7: Business ideas contain all required fields**
  - **Property 8: Budget minimum does not exceed maximum**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

- [ ]* 1.2 Write property test for partnership request model
  - **Property 9: Partnership request IDs are unique**
  - **Property 10: Partnership requests contain all required fields**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 2. Create validation schemas
  - Create Zod schema for business idea creation/update
  - Create Zod schema for partnership request submission
  - Add phone number validation with regex or libphonenumber-js
  - Ensure budgetMin <= budgetMax validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.7, 8.2, 8.3, 8.5_

- [ ]* 2.1 Write property test for phone number validation
  - **Property 4: Phone number validation accepts only valid formats**
  - **Validates: Requirements 4.4**

- [ ]* 2.2 Write unit tests for validation schemas
  - Test business idea schema with valid and invalid inputs
  - Test partnership request schema with valid and invalid inputs
  - Test edge cases for empty fields
  - _Requirements: 4.1, 4.2, 4.3, 8.2, 8.3, 8.5_

- [x] 3. Implement business ideas API routes
- [x] 3.1 Create GET /api/business-ideas route
  - Fetch all business ideas from database
  - Return formatted response
  - _Requirements: 1.1, 1.4_

- [x] 3.2 Create GET /api/business-ideas/[id] route
  - Fetch single business idea by ID
  - Handle not found case
  - _Requirements: 2.1, 2.2_

- [x] 3.3 Create POST /api/business-ideas route
  - Validate input with Zod schema
  - Create new business idea in database
  - Protect with admin authentication
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 3.4 Write property test for business idea creation
  - **Property 12: Multiple images can be added**
  - **Property 13: Valid business ideas are saved successfully**
  - **Validates: Requirements 8.4, 8.6**

- [x] 3.5 Create PUT /api/business-ideas/[id] route
  - Validate input with Zod schema
  - Update existing business idea
  - Protect with admin authentication
  - _Requirements: 9.3, 9.4_

- [ ]* 3.6 Write property test for business idea updates
  - **Property 15: All fields are editable**
  - **Property 16: Edits persist to database**
  - **Validates: Requirements 9.3, 9.4**

- [x] 3.7 Create DELETE /api/business-ideas/[id] route
  - Delete business idea from database
  - Cascade delete partnership requests
  - Protect with admin authentication
  - _Requirements: 10.3, 10.4_

- [ ]* 3.8 Write property test for business idea deletion
  - **Property 17: Deletion removes business idea**
  - **Property 18: Cascade deletion of partnership requests**
  - **Validates: Requirements 10.3, 10.4**

- [ ]* 3.9 Write unit tests for business ideas API routes
  - Test successful responses
  - Test error handling (not found, validation errors)
  - Test authentication protection
  - _Requirements: 1.1, 2.1, 8.6, 9.4, 10.3_

- [x] 4. Implement partnership requests API routes
- [x] 4.1 Create POST /api/partnership-requests route
  - Validate input with Zod schema
  - Create new partnership request with PENDING status
  - Return success response
  - _Requirements: 3.5, 4.5_

- [ ]* 4.2 Write property test for partnership request creation
  - **Property 3: Valid partnership requests are stored completely**
  - **Property 5: Valid submissions are accepted**
  - **Validates: Requirements 3.5, 4.5**

- [x] 4.3 Create GET /api/partnership-requests route
  - Fetch partnership requests with optional filters
  - Support filtering by businessIdeaId, role, and status
  - Sort by createdAt descending
  - Protect with admin authentication
  - _Requirements: 11.1, 11.3, 11.4, 11.5, 12.4_

- [ ]* 4.4 Write property tests for partnership request filtering
  - **Property 20: Business idea filter works correctly**
  - **Property 21: Role filter works correctly**
  - **Property 22: Partnership requests sorted by date descending**
  - **Property 26: Status filter works correctly**
  - **Validates: Requirements 11.3, 11.4, 11.5, 12.4**

- [x] 4.5 Create PATCH /api/partnership-requests/[id] route
  - Update partnership request status
  - Validate status value
  - Protect with admin authentication
  - _Requirements: 12.2_

- [ ]* 4.6 Write property tests for status management
  - **Property 24: Status updates persist to database**
  - **Property 25: All status values are supported**
  - **Validates: Requirements 12.2, 12.3**

- [ ]* 4.7 Write unit tests for partnership requests API routes
  - Test successful creation and retrieval
  - Test filtering functionality
  - Test status updates
  - Test authentication protection
  - _Requirements: 3.5, 11.1, 12.2_

- [x] 5. Create public-facing business ideas pages
- [x] 5.1 Create BusinessIdeasList component
  - Display grid/list of business ideas
  - Show title and primary image for each
  - Link to detail page
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 5.2 Write property test for list display
  - **Property 1: List items contain required display fields**
  - **Validates: Requirements 1.3**

- [x] 5.3 Create /business-ideas page
  - Fetch business ideas from API
  - Render BusinessIdeasList component
  - Add loading states
  - _Requirements: 1.1, 1.4_

- [ ]* 5.4 Write unit test for business ideas list page
  - Test page renders with mock data
  - Test loading states
  - Test navigation to detail page
  - _Requirements: 1.1, 2.1_

- [x] 6. Create business idea detail page
- [x] 6.1 Create BusinessIdeaDetail component
  - Display title, description, all images, budget range
  - Implement image gallery/carousel
  - Include "Partner Me" button
  - _Requirements: 2.2, 2.3, 2.4, 3.1_

- [ ]* 6.2 Write property test for detail page display
  - **Property 2: Detail page contains all required information**
  - **Validates: Requirements 2.2, 2.3**

- [x] 6.3 Create /business-ideas/[id] page
  - Fetch business idea by ID from API
  - Render BusinessIdeaDetail component
  - Handle not found case
  - _Requirements: 2.1, 2.2_

- [ ]* 6.4 Write unit test for business idea detail page
  - Test page renders with mock data
  - Test "Partner Me" button presence
  - Test 404 handling
  - _Requirements: 2.1, 3.1_

- [x] 7. Create partnership request form
- [x] 7.1 Create PartnershipRequestForm component
  - Modal/dialog component
  - Role selection (Helper/Outlet)
  - Name and phone number inputs
  - Form validation
  - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 7.2 Integrate form with BusinessIdeaDetail
  - Open form on "Partner Me" button click
  - Pass business idea ID to form
  - Handle form submission
  - Show success/error messages
  - _Requirements: 3.2, 3.5, 4.5_

- [ ]* 7.3 Write unit tests for partnership request form
  - Test form renders with all fields
  - Test validation errors display
  - Test successful submission
  - Test role selection
  - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.5_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create admin business ideas management
- [x] 9.1 Create AdminBusinessIdeasManager component
  - Table layout showing all business ideas
  - Edit and delete buttons for each
  - Link to create new business idea
  - _Requirements: 9.1, 10.1_

- [x] 9.2 Create RichTextEditor component
  - Integrate Tiptap or React Quill
  - Toolbar with formatting options (bold, italic, underline, lists, headings)
  - Output HTML content
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 9.3 Write property test for rich text formatting
  - **Property 11: Rich text formatting round-trip preservation**
  - **Validates: Requirements 7.5, 7.6**

- [x] 9.4 Create AdminBusinessIdeaForm component
  - Form for creating/editing business ideas
  - Integrate RichTextEditor for description
  - Image URL management (add/remove)
  - Budget range inputs
  - Validation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.3_

- [ ]* 9.5 Write property test for edit form pre-fill
  - **Property 14: Edit form pre-fills with current data**
  - **Validates: Requirements 9.2**

- [x] 9.6 Create /admin/business-ideas page
  - Render AdminBusinessIdeasManager
  - Protect with admin authentication
  - Handle create/edit/delete actions
  - Show confirmation dialogs for delete
  - _Requirements: 8.1, 9.1, 10.1, 10.2_

- [ ]* 9.7 Write unit tests for admin business ideas management
  - Test table renders with mock data
  - Test create form opens and submits
  - Test edit form pre-fills and updates
  - Test delete confirmation and execution
  - _Requirements: 8.1, 9.1, 9.2, 10.1, 10.2_

- [x] 10. Create admin partnership requests management
- [x] 10.1 Create PartnershipRequestStatusSelector component
  - Dropdown for status selection
  - Show current status
  - Update status on change
  - _Requirements: 12.1, 12.2_

- [x] 10.2 Create AdminPartnershipRequestsManager component
  - Table layout showing all partnership requests
  - Display business idea title, name, phone, role, status, date
  - Filters for business idea, role, and status
  - Integrate PartnershipRequestStatusSelector
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.1_

- [ ]* 10.3 Write property test for partnership request display
  - **Property 19: Partnership requests display all required information**
  - **Property 23: Partnership request status is visible**
  - **Validates: Requirements 11.2, 12.1**

- [x] 10.4 Create /admin/partnership-requests page
  - Render AdminPartnershipRequestsManager
  - Protect with admin authentication
  - Fetch and display partnership requests
  - Handle filtering and status updates
  - _Requirements: 11.1, 11.5, 12.2, 12.4_

- [ ]* 10.5 Write unit tests for admin partnership requests management
  - Test table renders with mock data
  - Test filters work correctly
  - Test status updates
  - Test sorting by date
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.4_

- [x] 11. Add authentication and authorization
- [x] 11.1 Add admin role to User model or create Admin model
  - Update Prisma schema
  - Run migration
  - _Requirements: 8.1, 9.1, 10.1, 11.1_

- [x] 11.2 Create admin authentication middleware
  - Check if user is authenticated
  - Check if user has admin role
  - Protect admin API routes
  - _Requirements: 8.1, 9.1, 10.1, 11.1_

- [x] 11.3 Protect admin pages with authentication
  - Add authentication checks to admin pages
  - Redirect non-admin users
  - _Requirements: 8.1, 9.1, 10.1, 11.1_

- [ ]* 11.4 Write unit tests for admin authentication
  - Test middleware blocks non-admin users
  - Test admin users can access protected routes
  - Test unauthenticated users are redirected
  - _Requirements: 8.1, 9.1, 10.1, 11.1_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Polish and refinements
- [x] 13.1 Add loading states and skeleton loaders
  - Implement loading states for all data fetching
  - Add skeleton loaders for better UX
  - _Requirements: 1.1, 2.1, 11.1_

- [x] 13.2 Add error handling and user feedback
  - Toast notifications for success/error
  - Error boundaries for component errors
  - User-friendly error messages
  - _Requirements: 3.5, 4.5, 8.6, 9.4, 10.3, 12.2_

- [x] 13.3 Implement image lazy loading
  - Add lazy loading for images in list and detail views
  - Optimize performance for large image sets
  - _Requirements: 1.3, 2.2_

- [ ]* 13.4 Write integration tests
  - Test complete user flow from listing to partnership submission
  - Test complete admin flow for creating and managing business ideas
  - Test complete admin flow for managing partnership requests
  - _Requirements: 1.1, 2.1, 3.5, 8.6, 9.4, 10.3, 11.1, 12.2_
