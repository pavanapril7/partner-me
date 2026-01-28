# Design Document

## Overview

The production authentication UI system will provide a complete, user-friendly interface for authentication flows in the application. Building upon the existing authentication backend and components, this system will create dedicated pages for login and registration, integrate authentication status into the application header, implement protected route functionality with smart redirects, and provide a seamless user experience across all devices.

The system leverages the existing AuthContext for state management, the dual authentication backend (credentials and OTP), and the current UI component library (shadcn/ui) to maintain consistency with the application's design language.

## Architecture

### Component Hierarchy

```
App Layout
├── AuthProvider (existing)
│   └── Header (enhanced)
│       ├── Navigation Links
│       ├── Auth Status Display
│       └── Login/Logout Buttons
│
├── Public Routes
│   ├── /login (new)
│   │   └── LoginPage
│   │       └── LoginForm (existing, enhanced)
│   └── /register (new)
│       └── RegisterPage
│           └── RegistrationForm (existing, enhanced)
│
└── Protected Routes
    └── ProtectedRoute Wrapper (enhanced)
        └── Protected Page Content
```

### Data Flow

1. **Initial Load**: AuthProvider checks localStorage for session token and validates with API
2. **Login Flow**: User submits credentials → API validates → Token stored → Session established → Redirect
3. **Protected Route Access**: Route checks auth state → Redirects if unauthenticated → Stores intended destination
4. **Post-Login Redirect**: After successful login → Checks for intended destination → Redirects appropriately
5. **Logout Flow**: User clicks logout → API invalidates session → Token cleared → Redirect to home

## Components and Interfaces

### 1. Login Page (`/login`)

**Location**: `src/app/login/page.tsx`

**Purpose**: Dedicated page for user authentication with both credential and OTP methods.

**Features**:
- Centered card layout with branding
- Tab interface for credential vs OTP login
- Remember me checkbox for persistent sessions
- Link to registration page
- Automatic redirect if already authenticated
- Redirect to intended destination after login
- Loading states and error handling

**Props**: None (page component)

**State**:
- `redirectTo`: string | null - Intended destination after login
- Form states managed by LoginForm component

### 2. Register Page (`/register`)

**Location**: `src/app/register/page.tsx`

**Purpose**: Dedicated page for new user registration.

**Features**:
- Centered card layout with branding
- Tab interface for credential vs mobile registration
- Link to login page
- Automatic redirect if already authenticated
- Success message before redirecting to login
- Loading states and error handling

**Props**: None (page component)

**State**:
- Form states managed by RegistrationForm component

### 3. Enhanced LoginForm Component

**Location**: `src/components/auth/LoginForm.tsx` (enhanced)

**New Features**:
- Remember me checkbox
- Better error messages with retry suggestions
- Loading states for all async operations
- Success feedback before redirect
- Keyboard navigation support

**New Props**:
```typescript
interface LoginFormProps {
  onCredentialLogin?: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  onOTPRequest?: (mobileNumber: string) => Promise<void>;
  onOTPVerify?: (mobileNumber: string, code: string, rememberMe: boolean) => Promise<void>;
  onSuccess?: () => void; // Callback after successful login
  showRememberMe?: boolean; // Default: true
}
```

### 4. Enhanced RegistrationForm Component

**Location**: `src/components/auth/RegistrationForm.tsx` (enhanced)

**New Features**:
- Better success feedback
- Terms of service checkbox (optional)
- Email field for credential registration (optional)
- Better validation feedback

**New Props**:
```typescript
interface RegistrationFormProps {
  onCredentialRegister?: (username: string, password: string, email?: string) => Promise<void>;
  onMobileRegister?: (mobileNumber: string) => Promise<void>;
  onSuccess?: () => void; // Callback after successful registration
  showTerms?: boolean; // Default: false
}
```

### 5. Enhanced ProtectedRoute Component

**Location**: `src/components/auth/ProtectedRoute.tsx` (enhanced)

**New Features**:
- Stores intended destination in URL params
- Supports admin-only routes
- Custom loading component
- Custom unauthorized component

**Enhanced Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string; // Default: '/login'
  requireAdmin?: boolean; // Default: false
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}
```

### 6. Enhanced Header Component

**Location**: `src/components/Header.tsx` (enhanced)

**New Features**:
- Links to `/login` and `/register` instead of `/auth-demo`
- User dropdown menu (desktop) with profile link
- Better mobile menu with auth status
- Loading state while checking authentication

**Changes**:
- Replace `/auth-demo` link with `/login`
- Add `/register` link when not authenticated
- Show user menu dropdown when authenticated
- Add loading skeleton during auth check

### 7. Auth Utilities

**Location**: `src/lib/auth-utils.ts` (new)

**Purpose**: Utility functions for authentication-related operations.

**Functions**:
```typescript
// Get redirect URL from query params
export function getRedirectUrl(searchParams: URLSearchParams): string | null;

// Create login URL with redirect
export function createLoginUrl(redirectTo?: string): string;

// Store intended destination
export function storeIntendedDestination(path: string): void;

// Get and clear intended destination
export function getIntendedDestination(): string | null;

// Check if route requires admin
export function requiresAdmin(pathname: string): boolean;
```

## Data Models

### Session Storage

**LocalStorage Keys**:
- `auth_session_token`: JWT token for authentication
- `auth_remember_me`: Boolean flag for persistent sessions
- `auth_intended_destination`: Stored path for post-login redirect

**Session Token Structure** (existing):
```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  user: User;
}
```

### URL Parameters

**Login Page**:
- `?redirect=/path/to/destination` - Where to redirect after successful login
- `?error=session_expired` - Error message to display

**Register Page**:
- `?redirect=/path/to/destination` - Where to redirect after registration and login

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication redirect preservation

*For any* unauthenticated user attempting to access a protected route, storing the intended destination and then successfully authenticating should result in navigation to that originally intended destination.

**Validates: Requirements 4.2, 4.3**

### Property 2: Authenticated user login page redirect

*For any* authenticated user navigating to `/login` or `/register`, the system should immediately redirect them away from those pages to the home page.

**Validates: Requirements 1.3**

### Property 3: Session persistence with remember me

*For any* user who logs in with "remember me" enabled, closing and reopening the browser should preserve their authenticated session.

**Validates: Requirements 2.5**

### Property 4: Session token validation on load

*For any* stored session token, when the application loads, the token should be validated with the API and only accepted if the API confirms it is valid.

**Validates: Requirements 8.4**

### Property 5: Protected route authentication requirement

*For any* protected route, an unauthenticated user should be redirected to the login page and should not see the protected content.

**Validates: Requirements 4.1**

### Property 6: Logout session cleanup

*For any* authenticated user who logs out, the session token should be cleared from storage and the authentication state should be reset.

**Validates: Requirements 4.5**

### Property 7: Form validation before submission

*For any* authentication form submission with invalid data, the form should display validation errors and prevent API submission.

**Validates: Requirements 5.2**

### Property 8: Header authentication state display

*For any* authentication state change, the header should update to reflect the current state within one render cycle.

**Validates: Requirements 6.1, 6.2**

### Property 9: Mobile responsive layout

*For any* viewport width below 768 pixels, authentication pages should render in a mobile-optimized layout with stacked elements.

**Validates: Requirements 7.4**

### Property 10: Admin route protection

*For any* route requiring admin privileges, a non-admin authenticated user should be denied access and redirected appropriately.

**Validates: Requirements 8.2**

## Error Handling

### Authentication Errors

**Invalid Credentials**:
- Display: "Invalid username or password. Please try again."
- Action: Clear password field, keep username
- Retry: Allow immediate retry

**Invalid OTP**:
- Display: "Invalid or expired code. Please try again or request a new code."
- Action: Clear OTP input
- Retry: Allow 3 attempts before requiring new OTP request

**Network Errors**:
- Display: "Connection error. Please check your internet and try again."
- Action: Keep form data
- Retry: Show retry button

**Session Expired**:
- Display: "Your session has expired. Please log in again."
- Action: Redirect to login with error message
- Redirect: Preserve intended destination

### Validation Errors

**Client-Side Validation**:
- Display inline errors below each field
- Highlight invalid fields with red border
- Show specific validation message (e.g., "Username must be 3-30 characters")
- Prevent form submission until valid

**Server-Side Validation**:
- Display API error messages
- Handle duplicate username/mobile errors specifically
- Show general error for unexpected issues

### Loading States

**Form Submission**:
- Disable all form inputs
- Show loading spinner on submit button
- Change button text to "Logging in..." or "Registering..."
- Prevent multiple submissions

**Page Load**:
- Show loading skeleton for auth-dependent UI
- Display spinner for protected route checks
- Maintain layout to prevent content shift

## Testing Strategy

### Unit Tests

**Component Tests**:
- Login page renders correctly
- Register page renders correctly
- Forms handle user input
- Validation errors display properly
- Success messages appear
- Links navigate correctly

**Utility Tests**:
- Redirect URL parsing
- Intended destination storage/retrieval
- Admin route checking
- URL creation with parameters

### Property-Based Tests

**Property 1: Redirect preservation** (Requirements 4.2, 4.3)
- Generate random protected paths
- Simulate unauthenticated access
- Verify redirect to login with correct parameter
- Simulate successful login
- Verify navigation to original path

**Property 2: Authenticated redirect** (Requirements 1.3)
- Generate authenticated user states
- Navigate to `/login` and `/register`
- Verify immediate redirect to home

**Property 3: Remember me persistence** (Requirements 2.5)
- Generate random user credentials
- Login with remember me enabled
- Simulate browser close/reopen
- Verify session persists

**Property 4: Token validation** (Requirements 8.4)
- Generate valid and invalid tokens
- Store in localStorage
- Simulate app load
- Verify only valid tokens establish sessions

**Property 5: Protected route blocking** (Requirements 4.1)
- Generate random protected routes
- Simulate unauthenticated access
- Verify no protected content renders
- Verify redirect occurs

**Property 6: Logout cleanup** (Requirements 4.5)
- Generate authenticated sessions
- Perform logout
- Verify token cleared from storage
- Verify auth state reset

**Property 7: Form validation** (Requirements 5.2)
- Generate invalid form data
- Submit forms
- Verify validation errors appear
- Verify no API calls made

**Property 8: Header state sync** (Requirements 6.1, 6.2)
- Generate auth state changes
- Verify header updates within one render
- Check correct buttons/text displayed

**Property 9: Mobile layout** (Requirements 7.4)
- Generate viewport widths below 768px
- Render auth pages
- Verify mobile layout applied
- Verify elements stacked vertically

**Property 10: Admin protection** (Requirements 8.2)
- Generate non-admin authenticated users
- Access admin routes
- Verify access denied
- Verify appropriate redirect

### Integration Tests

**Complete Login Flow**:
1. Navigate to protected route while unauthenticated
2. Verify redirect to login with redirect parameter
3. Submit valid credentials
4. Verify successful authentication
5. Verify redirect to original protected route
6. Verify protected content displays

**Complete Registration Flow**:
1. Navigate to register page
2. Submit valid registration data
3. Verify success message
4. Verify redirect to login page
5. Login with new credentials
6. Verify successful authentication

**Session Persistence Flow**:
1. Login with remember me
2. Verify session established
3. Simulate page refresh
4. Verify session persists
5. Logout
6. Verify session cleared
7. Simulate page refresh
8. Verify no session

### Manual Testing Checklist

- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] OTP request sends code
- [ ] OTP verification works
- [ ] Registration creates new account
- [ ] Duplicate username/mobile shows error
- [ ] Protected routes redirect when unauthenticated
- [ ] Post-login redirect works
- [ ] Remember me persists session
- [ ] Logout clears session
- [ ] Header shows correct auth state
- [ ] Mobile layout works on small screens
- [ ] Keyboard navigation works
- [ ] Form validation prevents invalid submission
- [ ] Loading states display correctly

## Implementation Notes

### Styling

- Use existing shadcn/ui components for consistency
- Match current application theme and color scheme
- Ensure proper dark mode support
- Use responsive Tailwind classes
- Add smooth transitions for state changes

### Accessibility

- Proper ARIA labels on all form inputs
- Keyboard navigation support
- Focus management (auto-focus first input)
- Screen reader announcements for errors/success
- Sufficient color contrast
- Touch targets minimum 44x44px on mobile

### Performance

- Lazy load auth pages (already handled by Next.js)
- Minimize re-renders in AuthContext
- Debounce validation checks
- Optimize session validation calls
- Cache user data appropriately

### Security

- Never store passwords in state longer than necessary
- Clear sensitive form data after submission
- Use secure token storage (httpOnly cookies would be better, but localStorage is acceptable)
- Validate all inputs client and server side
- Implement rate limiting on auth endpoints (already exists)
- Use HTTPS in production
