# Authentication Context

This directory contains the authentication context and provider for the dual authentication system.

## Overview

The authentication context provides a centralized way to manage authentication state throughout the Next.js application. It handles:

- Session management with localStorage persistence
- Login/logout functionality
- User information access
- Authentication state tracking
- Automatic session validation

## Requirements

Implements requirements:
- **6.4**: Session validation and user information retrieval
- **7.1**: Logout and session invalidation

## Components

### AuthProvider

The `AuthProvider` component wraps your application and provides authentication context to all child components.

**Usage:**

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### useAuth Hook

The `useAuth` hook provides access to authentication state and methods.

**Usage:**

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.username || user?.mobileNumber}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## API

### AuthContextType

```typescript
interface AuthContextType {
  // State
  session: Session | null;           // Current session object
  user: User | null;                 // Current user information
  isAuthenticated: boolean;          // Whether user is authenticated
  isLoading: boolean;                // Loading state during validation
  
  // Methods
  login: (token: string) => Promise<void>;      // Login with session token
  logout: () => Promise<void>;                  // Logout and clear session
  refreshSession: () => Promise<void>;          // Refresh current session
}
```

### Session Object

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

### User Object

```typescript
interface User {
  id: string;
  username: string | null;
  mobileNumber: string | null;
  email: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Session Persistence

Sessions are persisted in `localStorage` using the key `auth_session_token`. This allows users to remain logged in across page refreshes and browser sessions.

### Storage Flow

1. **Login**: Session token is stored in localStorage
2. **Page Load**: Token is retrieved and validated with the API
3. **Logout**: Token is removed from localStorage and invalidated on server

### Security Considerations

- Tokens are validated with the server on every page load
- Expired sessions are automatically cleaned up
- Logout calls the server API to invalidate the session
- Tokens are stored in localStorage (consider httpOnly cookies for production)

## Integration with API Routes

The context integrates with the following API endpoints:

- `GET /api/auth/session` - Validate session token
- `POST /api/auth/logout` - Invalidate session

## Example: Complete Authentication Flow

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
      // Call your login API
      const response = await fetch('/api/auth/login/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success && data.session?.token) {
        // Login with the received token
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

## Protected Routes

Use the `ProtectedRoute` component to restrict access to authenticated users:

```tsx
import { ProtectedRoute } from '@/components/auth';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

See `src/components/auth/ProtectedRoute.tsx` for more details.

## Testing

The authentication context can be tested by mocking the fetch API and localStorage:

```typescript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = jest.fn();

// Test login
it('should login successfully', async () => {
  // Your test implementation
});
```

## Future Enhancements

- Add refresh token support
- Implement httpOnly cookie storage for better security
- Add session timeout warnings
- Support multiple concurrent sessions
- Add session activity tracking
