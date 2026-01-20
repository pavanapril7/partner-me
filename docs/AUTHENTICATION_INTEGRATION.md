# Authentication Integration Guide

This document describes the authentication integration for the Next.js application, implementing task 20 of the dual authentication system.

## Overview

The authentication system has been fully integrated into the Next.js application with the following features:

- **Authentication Context**: Centralized state management for authentication
- **Session Persistence**: Automatic session storage and restoration using localStorage
- **Protected Routes**: Component wrapper for restricting access to authenticated users
- **Logout Functionality**: Complete logout flow with server-side session invalidation
- **Real API Integration**: All components connected to actual authentication endpoints

## Requirements Implemented

- **Requirement 6.4**: Session validation and user information retrieval
- **Requirement 7.1**: Logout and session invalidation

## Components

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

The authentication context provides global access to authentication state and methods.

**Features:**
- Session state management
- Automatic session validation on mount
- localStorage persistence
- Login/logout methods
- Loading states

**Usage:**
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {user?.username}!</div>;
}
```

### 2. AuthProvider (`src/contexts/AuthContext.tsx`)

Wraps the application to provide authentication context to all components.

**Integration in `src/app/layout.tsx`:**
```tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
```

### 3. ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)

Component wrapper that restricts access to authenticated users only.

**Features:**
- Automatic redirect to login page for unauthenticated users
- Customizable redirect path
- Loading state handling
- Custom loading component support

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/auth';

export default function ProtectedPage() {
  return (
    <ProtectedRoute redirectTo="/auth-demo">
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

## Pages

### 1. Authentication Demo (`/auth-demo`)

Updated to use real API integration instead of mock handlers.

**Features:**
- Login with credentials or OTP
- Registration with credentials or mobile
- Display authenticated user information
- Logout functionality
- Error handling and user feedback

**API Integration:**
- `POST /api/auth/login/credentials`
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/register/credentials`
- `POST /api/auth/register/mobile`
- `POST /api/auth/logout`

### 2. Protected Page Example (`/protected`)

Demonstrates the ProtectedRoute component in action.

**Features:**
- Only accessible to authenticated users
- Displays user information
- Automatic redirect to login if not authenticated
- Logout functionality

### 3. Home Page (`/`)

Updated with links to authentication and protected pages.

## Session Management

### Storage

Sessions are persisted in `localStorage` with the key `auth_session_token`.

**Flow:**
1. User logs in → Token stored in localStorage
2. Page loads → Token retrieved and validated with API
3. Valid session → User authenticated
4. Invalid/expired session → Token removed, user redirected

### Validation

Session validation happens:
- On application mount
- When calling `refreshSession()`
- Automatically checks expiration

### Security Considerations

**Current Implementation:**
- Tokens stored in localStorage (client-side)
- Session validation on every page load
- Server-side session invalidation on logout

**Production Recommendations:**
- Use httpOnly cookies instead of localStorage
- Implement refresh token mechanism
- Add CSRF protection
- Use secure, sameSite cookie attributes
- Implement session timeout warnings

## API Integration

### Session Validation

**Endpoint:** `GET /api/auth/session`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-id",
    "userId": "user-id",
    "token": "session-token",
    "expiresAt": "2024-01-20T12:00:00Z",
    "createdAt": "2024-01-19T12:00:00Z",
    "user": {
      "id": "user-id",
      "username": "testuser",
      "mobileNumber": null,
      "email": null,
      "name": null,
      "createdAt": "2024-01-19T12:00:00Z",
      "updatedAt": "2024-01-19T12:00:00Z"
    }
  }
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Usage Examples

### Basic Authentication Flow

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, user, logout } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success && data.session?.token) {
        await login(data.session.token);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.username}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected Route with Custom Loading

```tsx
import { ProtectedRoute } from '@/components/auth';

function CustomLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner" />
        <p>Checking authentication...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute 
      redirectTo="/login"
      loadingComponent={<CustomLoading />}
    >
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}
```

### Conditional Rendering Based on Auth State

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav>
      <div>My App</div>
      {isAuthenticated ? (
        <div>
          <span>Hello, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <a href="/auth-demo">Login</a>
      )}
    </nav>
  );
}
```

## Testing

### Unit Tests

Tests are provided for:
- AuthContext functionality (`__tests__/auth-context.test.tsx`)
- ProtectedRoute component (`__tests__/protected-route.test.tsx`)

**Run tests:**
```bash
npm test
```

### Manual Testing

1. **Registration Flow:**
   - Visit `/auth-demo`
   - Click "Register" tab
   - Register with credentials or mobile
   - Verify success message

2. **Login Flow:**
   - Visit `/auth-demo`
   - Login with credentials or OTP
   - Verify user information displayed
   - Check localStorage for session token

3. **Protected Route:**
   - Visit `/protected` without logging in
   - Verify redirect to `/auth-demo`
   - Login and visit `/protected` again
   - Verify content is displayed

4. **Logout Flow:**
   - Login to the application
   - Click logout button
   - Verify redirect and localStorage cleared
   - Try to access `/protected` again
   - Verify redirect to login

5. **Session Persistence:**
   - Login to the application
   - Refresh the page
   - Verify still authenticated
   - Close and reopen browser
   - Verify still authenticated (until expiration)

## File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx          # Authentication context and provider
│   └── README.md                # Context documentation
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx   # Protected route wrapper
│       ├── LoginForm.tsx        # Login form (updated)
│       ├── RegistrationForm.tsx # Registration form
│       ├── OTPInput.tsx         # OTP input component
│       └── index.ts             # Exports
├── app/
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── auth-demo/
│   │   └── page.tsx             # Auth demo page (updated)
│   ├── protected/
│   │   └── page.tsx             # Protected page example
│   └── page.tsx                 # Home page (updated)
└── lib/
    └── session.ts               # Session utilities

__tests__/
├── auth-context.test.tsx        # AuthContext tests
└── protected-route.test.tsx     # ProtectedRoute tests

docs/
└── AUTHENTICATION_INTEGRATION.md # This file
```

## Environment Variables

No additional environment variables are required for the authentication integration. The system uses the existing authentication API endpoints.

## Future Enhancements

1. **Refresh Tokens**: Implement automatic token refresh
2. **Remember Me**: Add persistent login option
3. **Session Timeout**: Add inactivity timeout warnings
4. **Multiple Sessions**: Support viewing/revoking active sessions
5. **httpOnly Cookies**: Move from localStorage to secure cookies
6. **SSR Support**: Add server-side authentication checks
7. **Middleware**: Implement Next.js middleware for route protection
8. **Activity Tracking**: Log user activity for security auditing

## Troubleshooting

### Session Not Persisting

**Issue:** User is logged out on page refresh

**Solutions:**
- Check browser localStorage is enabled
- Verify session token is being stored
- Check session expiration time
- Verify API endpoint is returning valid session

### Redirect Loop

**Issue:** ProtectedRoute causes infinite redirects

**Solutions:**
- Ensure redirect path is not also protected
- Check authentication state is updating correctly
- Verify API session validation is working

### Token Not Cleared on Logout

**Issue:** User can still access protected routes after logout

**Solutions:**
- Verify logout API is being called
- Check localStorage.removeItem is executing
- Ensure session state is being cleared
- Check for multiple AuthProvider instances

## Support

For issues or questions about the authentication integration:
1. Check this documentation
2. Review the context README at `src/contexts/README.md`
3. Check the API documentation at `src/app/api/auth/README.md`
4. Review the design document at `.kiro/specs/dual-authentication/design.md`
