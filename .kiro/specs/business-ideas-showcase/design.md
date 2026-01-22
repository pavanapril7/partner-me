# Design Document: Business Ideas Showcase

## Overview

The Business Ideas Showcase feature enables users to browse business opportunities and submit partnership requests. The system consists of a listing page showing all business ideas, a detail page for individual ideas, and a partnership request form with role selection. The feature integrates with the existing Next.js application and uses Prisma for data persistence.

## Architecture

The feature follows a standard Next.js App Router architecture with the following layers:

1. **Presentation Layer**: React components for UI rendering
   - Business ideas list page
   - Business idea detail page
   - Partnership request form modal/dialog
   - Rich text editor component for admin

2. **API Layer**: Next.js API routes for data operations
   - GET /api/business-ideas - Fetch all business ideas
   - GET /api/business-ideas/[id] - Fetch single business idea
   - POST /api/business-ideas - Create new business idea (admin)
   - POST /api/partnership-requests - Submit partnership request

3. **Data Layer**: Prisma models and database operations
   - BusinessIdea model
   - PartnershipRequest model

4. **Validation Layer**: Zod schemas for input validation
   - Business idea creation schema
   - Partnership request schema

## Components and Interfaces

### Data Models

#### BusinessIdea
```typescript
interface BusinessIdea {
  id: string
  title: string
  description: string // Rich text HTML content
  images: string[] // Array of image URLs
  budgetMin: number
  budgetMax: number
  createdAt: Date
  updatedAt: Date
}
```

#### PartnershipRequest
```typescript
interface PartnershipRequest {
  id: string
  businessIdeaId: string
  name: string
  phoneNumber: string
  role: 'HELPER' | 'OUTLET'
  status: 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED'
  createdAt: Date
}
```

### API Interfaces

#### GET /api/business-ideas
Response:
```typescript
{
  success: boolean
  data: BusinessIdea[]
}
```

#### GET /api/business-ideas/[id]
Response:
```typescript
{
  success: boolean
  data: BusinessIdea | null
}
```

#### POST /api/business-ideas
Request:
```typescript
{
  title: string
  description: string // Rich text HTML
  images: string[]
  budgetMin: number
  budgetMax: number
}
```

Response:
```typescript
{
  success: boolean
  data: BusinessIdea
}
```

#### PUT /api/business-ideas/[id]
Request:
```typescript
{
  title: string
  description: string // Rich text HTML
  images: string[]
  budgetMin: number
  budgetMax: number
}
```

Response:
```typescript
{
  success: boolean
  data: BusinessIdea
}
```

#### DELETE /api/business-ideas/[id]
Response:
```typescript
{
  success: boolean
}
```

#### GET /api/partnership-requests
Query Parameters:
```typescript
{
  businessIdeaId?: string
  role?: 'HELPER' | 'OUTLET'
  status?: 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED'
}
```

Response:
```typescript
{
  success: boolean
  data: PartnershipRequest[]
}
```

#### POST /api/partnership-requests
Request:
```typescript
{
  businessIdeaId: string
  name: string
  phoneNumber: string
  role: 'HELPER' | 'OUTLET'
}
```

Response:
```typescript
{
  success: boolean
  data: PartnershipRequest
}
```

#### PATCH /api/partnership-requests/[id]
Request:
```typescript
{
  status: 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED'
}
```

Response:
```typescript
{
  success: boolean
  data: PartnershipRequest
}
```

### React Components

#### BusinessIdeasList
- Displays grid/list of business ideas
- Shows title and primary image for each idea
- Links to detail page on click

#### BusinessIdeaDetail
- Displays full business idea information
- Shows all images in a gallery/carousel
- Includes "Partner Me" button
- Manages partnership request dialog state

#### PartnershipRequestForm
- Modal/dialog component
- Role selection (Helper/Outlet)
- Name and phone number inputs
- Form validation and submission

#### RichTextEditor
- Rich text editing interface for admin
- Toolbar with formatting options
- HTML content output

#### AdminBusinessIdeasManager
- Admin page component
- Lists all business ideas in table format
- Provides create, edit, delete actions
- Includes search and filtering

#### AdminBusinessIdeaForm
- Form component for creating/editing business ideas
- Integrates RichTextEditor for description
- Image URL management
- Budget range inputs
- Validation and submission

#### AdminPartnershipRequestsManager
- Admin page component
- Lists all partnership requests in table format
- Shows associated business idea, user details, role, status, date
- Provides filtering by business idea, role, and status
- Allows status updates

#### PartnershipRequestStatusSelector
- Dropdown/select component for status updates
- Shows current status
- Allows admin to change status

## Data Models

### Prisma Schema

```prisma
model BusinessIdea {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  images      String[]
  budgetMin   Float
  budgetMax   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  partnershipRequests PartnershipRequest[]
  
  @@map("business_ideas")
}

model PartnershipRequest {
  id             String            @id @default(cuid())
  businessIdeaId String
  name           String
  phoneNumber    String
  role           PartnershipRole
  status         PartnershipStatus @default(PENDING)
  createdAt      DateTime          @default(now())
  
  businessIdea   BusinessIdea @relation(fields: [businessIdeaId], references: [id], onDelete: Cascade)
  
  @@map("partnership_requests")
}

enum PartnershipRole {
  HELPER
  OUTLET
}

enum PartnershipStatus {
  PENDING
  CONTACTED
  ACCEPTED
  REJECTED
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: List items contain required display fields
*For any* business idea in the list view, the rendered output should contain both the title and at least one image.
**Validates: Requirements 1.3**

### Property 2: Detail page contains all required information
*For any* business idea detail page, the rendered output should contain the title, description, all images, and both minimum and maximum budget values.
**Validates: Requirements 2.2, 2.3**

### Property 3: Valid partnership requests are stored completely
*For any* valid partnership request submission, the stored record should contain the business idea ID, name, phone number, and selected role.
**Validates: Requirements 3.5**

### Property 4: Phone number validation accepts only valid formats
*For any* phone number input, the validation should accept only strings containing numeric characters with appropriate formatting and reject all other inputs.
**Validates: Requirements 4.4**

### Property 5: Valid submissions are accepted
*For any* partnership request with all valid fields (non-empty name, valid phone number, selected role), the system should accept the submission.
**Validates: Requirements 4.5**

### Property 6: Business idea IDs are unique
*For any* set of stored business ideas, all identifiers should be unique with no duplicates.
**Validates: Requirements 5.1**

### Property 7: Business ideas contain all required fields
*For any* stored business idea, it should contain a non-empty title, description, images array, budgetMin value, and budgetMax value.
**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 8: Budget minimum does not exceed maximum
*For any* business idea, the minimum budget value should be less than or equal to the maximum budget value.
**Validates: Requirements 5.7**

### Property 9: Partnership request IDs are unique
*For any* set of stored partnership requests, all identifiers should be unique with no duplicates.
**Validates: Requirements 6.1**

### Property 10: Partnership requests contain all required fields
*For any* stored partnership request, it should contain a businessIdeaId, name, phoneNumber, role, and createdAt timestamp.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 11: Rich text formatting round-trip preservation
*For any* formatted description content, saving it to the database and then retrieving and rendering it should preserve all formatting (bold, italic, underline, lists, headings).
**Validates: Requirements 7.5, 7.6**

### Property 12: Multiple images can be added
*For any* number of image URLs provided during business idea creation, the system should accept and store all of them.
**Validates: Requirements 8.4**

### Property 13: Valid business ideas are saved successfully
*For any* valid business idea (with title, description, images, and valid budget range), the system should save it to the database successfully.
**Validates: Requirements 8.6**

### Property 14: Edit form pre-fills with current data
*For any* business idea being edited, the edit form should be pre-populated with all current field values (title, description, images, budgetMin, budgetMax).
**Validates: Requirements 9.2**

### Property 15: All fields are editable
*For any* business idea, the edit operation should allow modification of title, description, images, and budget values.
**Validates: Requirements 9.3**

### Property 16: Edits persist to database
*For any* valid edit to a business idea, the updated values should be saved to the database and retrievable.
**Validates: Requirements 9.4**

### Property 17: Deletion removes business idea
*For any* business idea, confirming deletion should remove it from the database so it is no longer retrievable.
**Validates: Requirements 10.3**

### Property 18: Cascade deletion of partnership requests
*For any* business idea with associated partnership requests, deleting the business idea should also delete all its partnership requests.
**Validates: Requirements 10.4**

### Property 19: Partnership requests display all required information
*For any* partnership request in the admin view, the displayed information should include business idea title, user name, phone number, role, and submission date.
**Validates: Requirements 11.2**

### Property 20: Business idea filter works correctly
*For any* business idea filter applied to partnership requests, only requests associated with that specific business idea should be returned.
**Validates: Requirements 11.3**

### Property 21: Role filter works correctly
*For any* role filter applied to partnership requests, only requests with that specific role should be returned.
**Validates: Requirements 11.4**

### Property 22: Partnership requests sorted by date descending
*For any* set of partnership requests, they should be ordered by createdAt timestamp with newest first.
**Validates: Requirements 11.5**

### Property 23: Partnership request status is visible
*For any* partnership request, its current status should be displayed in the admin view.
**Validates: Requirements 12.1**

### Property 24: Status updates persist to database
*For any* partnership request status update, the new status should be saved to the database and retrievable.
**Validates: Requirements 12.2**

### Property 25: All status values are supported
*For any* of the four status values (PENDING, CONTACTED, ACCEPTED, REJECTED), the system should accept and store them correctly.
**Validates: Requirements 12.3**

### Property 26: Status filter works correctly
*For any* status filter applied to partnership requests, only requests with that specific status should be returned.
**Validates: Requirements 12.4**

## Error Handling

### API Error Responses

All API endpoints will return consistent error responses:

```typescript
{
  success: false
  error: {
    message: string
    code: string
  }
}
```

### Error Scenarios

1. **Business Idea Not Found** (404)
   - When requesting a non-existent business idea ID
   - Return: `{ code: 'NOT_FOUND', message: 'Business idea not found' }`

2. **Validation Errors** (400)
   - Invalid input data (missing fields, invalid formats)
   - Return: `{ code: 'VALIDATION_ERROR', message: 'Detailed validation message' }`

3. **Database Errors** (500)
   - Database connection failures
   - Query execution errors
   - Return: `{ code: 'DATABASE_ERROR', message: 'An error occurred while processing your request' }`

4. **Invalid Budget Range** (400)
   - When budgetMin > budgetMax
   - Return: `{ code: 'INVALID_BUDGET', message: 'Minimum budget cannot exceed maximum budget' }`

### Client-Side Error Handling

- Display user-friendly error messages in the UI
- Show validation errors inline with form fields
- Display toast notifications for submission errors
- Implement retry logic for network failures

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

1. **API Route Tests**
   - Test successful retrieval of business ideas
   - Test successful creation of partnership requests
   - Test error responses for invalid inputs
   - Test 404 responses for non-existent resources

2. **Component Tests**
   - Test BusinessIdeasList renders with mock data
   - Test BusinessIdeaDetail displays all information
   - Test PartnershipRequestForm validation and submission
   - Test RichTextEditor basic functionality

3. **Validation Schema Tests**
   - Test Zod schemas accept valid inputs
   - Test Zod schemas reject invalid inputs (empty fields, invalid phone formats)

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library (JavaScript/TypeScript PBT framework). Each test will run a minimum of 100 iterations.

1. **Property 1: List items contain required display fields**
   - Generate random business ideas
   - Verify rendered list items contain title and image
   - Tag: **Feature: business-ideas-showcase, Property 1: List items contain required display fields**

2. **Property 2: Detail page contains all required information**
   - Generate random business ideas
   - Verify rendered detail page contains all required fields
   - Tag: **Feature: business-ideas-showcase, Property 2: Detail page contains all required information**

3. **Property 3: Valid partnership requests are stored completely**
   - Generate random valid partnership requests
   - Verify all fields are stored correctly
   - Tag: **Feature: business-ideas-showcase, Property 3: Valid partnership requests are stored completely**

4. **Property 4: Phone number validation accepts only valid formats**
   - Generate random strings including valid and invalid phone numbers
   - Verify validation correctly accepts/rejects
   - Tag: **Feature: business-ideas-showcase, Property 4: Phone number validation accepts only valid formats**

5. **Property 5: Valid submissions are accepted**
   - Generate random valid partnership request data
   - Verify all valid submissions are accepted
   - Tag: **Feature: business-ideas-showcase, Property 5: Valid submissions are accepted**

6. **Property 6: Business idea IDs are unique**
   - Generate multiple business ideas
   - Verify all IDs are unique
   - Tag: **Feature: business-ideas-showcase, Property 6: Business idea IDs are unique**

7. **Property 7: Business ideas contain all required fields**
   - Generate random business ideas
   - Verify all required fields are present and non-empty
   - Tag: **Feature: business-ideas-showcase, Property 7: Business ideas contain all required fields**

8. **Property 8: Budget minimum does not exceed maximum**
   - Generate random business ideas
   - Verify budgetMin <= budgetMax for all instances
   - Tag: **Feature: business-ideas-showcase, Property 8: Budget minimum does not exceed maximum**

9. **Property 9: Partnership request IDs are unique**
   - Generate multiple partnership requests
   - Verify all IDs are unique
   - Tag: **Feature: business-ideas-showcase, Property 9: Partnership request IDs are unique**

10. **Property 10: Partnership requests contain all required fields**
    - Generate random partnership requests
    - Verify all required fields are present
    - Tag: **Feature: business-ideas-showcase, Property 10: Partnership requests contain all required fields**

11. **Property 11: Rich text formatting round-trip preservation**
    - Generate random formatted HTML content
    - Save and retrieve from database
    - Verify formatting is preserved
    - Tag: **Feature: business-ideas-showcase, Property 11: Rich text formatting round-trip preservation**

12. **Property 12: Multiple images can be added**
    - Generate random arrays of image URLs
    - Verify system accepts and stores all images
    - Tag: **Feature: business-ideas-showcase, Property 12: Multiple images can be added**

13. **Property 13: Valid business ideas are saved successfully**
    - Generate random valid business ideas
    - Verify all are saved successfully
    - Tag: **Feature: business-ideas-showcase, Property 13: Valid business ideas are saved successfully**

14. **Property 14: Edit form pre-fills with current data**
    - Generate random business ideas
    - Verify edit form contains all current values
    - Tag: **Feature: business-ideas-showcase, Property 14: Edit form pre-fills with current data**

15. **Property 15: All fields are editable**
    - Generate random business ideas and edits
    - Verify all fields can be modified
    - Tag: **Feature: business-ideas-showcase, Property 15: All fields are editable**

16. **Property 16: Edits persist to database**
    - Generate random business idea edits
    - Verify changes are saved and retrievable
    - Tag: **Feature: business-ideas-showcase, Property 16: Edits persist to database**

17. **Property 17: Deletion removes business idea**
    - Generate random business ideas
    - Delete and verify they're no longer retrievable
    - Tag: **Feature: business-ideas-showcase, Property 17: Deletion removes business idea**

18. **Property 18: Cascade deletion of partnership requests**
    - Generate business ideas with partnership requests
    - Delete business idea and verify requests are also deleted
    - Tag: **Feature: business-ideas-showcase, Property 18: Cascade deletion of partnership requests**

19. **Property 19: Partnership requests display all required information**
    - Generate random partnership requests
    - Verify admin view displays all required fields
    - Tag: **Feature: business-ideas-showcase, Property 19: Partnership requests display all required information**

20. **Property 20: Business idea filter works correctly**
    - Generate partnership requests for multiple business ideas
    - Apply filter and verify only matching requests returned
    - Tag: **Feature: business-ideas-showcase, Property 20: Business idea filter works correctly**

21. **Property 21: Role filter works correctly**
    - Generate partnership requests with different roles
    - Apply filter and verify only matching requests returned
    - Tag: **Feature: business-ideas-showcase, Property 21: Role filter works correctly**

22. **Property 22: Partnership requests sorted by date descending**
    - Generate partnership requests with different timestamps
    - Verify they're ordered newest first
    - Tag: **Feature: business-ideas-showcase, Property 22: Partnership requests sorted by date descending**

23. **Property 23: Partnership request status is visible**
    - Generate random partnership requests
    - Verify status is displayed in admin view
    - Tag: **Feature: business-ideas-showcase, Property 23: Partnership request status is visible**

24. **Property 24: Status updates persist to database**
    - Generate random status updates
    - Verify changes are saved and retrievable
    - Tag: **Feature: business-ideas-showcase, Property 24: Status updates persist to database**

25. **Property 25: All status values are supported**
    - Test all four status values
    - Verify system accepts and stores each correctly
    - Tag: **Feature: business-ideas-showcase, Property 25: All status values are supported**

26. **Property 26: Status filter works correctly**
    - Generate partnership requests with different statuses
    - Apply filter and verify only matching requests returned
    - Tag: **Feature: business-ideas-showcase, Property 26: Status filter works correctly**

### Integration Testing

- Test complete user flows from listing to partnership submission
- Test database operations with actual Prisma client
- Test API routes with actual database connections

## Implementation Notes

### Authentication and Authorization

Admin routes and API endpoints must be protected:
- Use existing authentication system from the dual-authentication feature
- Implement role-based access control (RBAC)
- Add `isAdmin` field to User model or create separate Admin model
- Protect admin routes with middleware
- Admin pages: `/admin/business-ideas`, `/admin/partnership-requests`

### Rich Text Editor

For the rich text editor, we will use **Tiptap** or **React Quill**:
- Provides toolbar with formatting options
- Outputs HTML content
- Integrates well with React
- Supports all required formatting features

### Image Handling

- Images will be stored as URLs (assuming external hosting or separate upload service)
- Multiple images stored as array in database
- Primary image is first in array
- Consider implementing image carousel/gallery component
- Admin form should allow adding/removing image URLs

### Phone Number Validation

Use a regex pattern or library like **libphonenumber-js** for robust phone validation:
- Support multiple formats (with/without country code, dashes, spaces)
- Normalize phone numbers before storage
- Display formatted phone numbers in UI

### Database Considerations

- Use Prisma's `cuid()` for unique IDs
- Implement cascade delete for partnership requests when business idea is deleted
- Consider adding indexes on frequently queried fields (businessIdeaId, status, role)
- Store rich text as TEXT type to support longer content
- Default status for new partnership requests is PENDING

### UI/UX Considerations

- Implement loading states for data fetching
- Add skeleton loaders for better perceived performance
- Use modal/dialog for partnership request form
- Implement image lazy loading for performance
- Add confirmation message after successful partnership submission
- Consider pagination or infinite scroll for large numbers of business ideas
- Admin tables should support sorting and filtering
- Confirmation dialogs for destructive actions (delete)
- Toast notifications for success/error feedback

### Admin Interface Design

- Use table layout for listing business ideas and partnership requests
- Implement inline editing or modal forms for updates
- Provide clear visual indicators for different partnership statuses
- Include search functionality for finding specific business ideas or requests
- Export functionality for partnership requests (CSV/Excel) could be valuable
