# Authentication UI Components

This directory contains the UI components for the dual authentication system.

## Components

### OTPInput

A specialized input component for entering 6-digit OTP codes.

**Features:**
- Individual input boxes for each digit
- Auto-focus on next input after entering a digit
- Backspace navigation between inputs
- Paste support for full OTP codes
- Error state styling
- Numeric-only input validation

**Usage:**
```tsx
import { OTPInput } from '@/components/auth';

function MyComponent() {
  const [otpCode, setOtpCode] = useState('');
  
  return (
    <OTPInput
      value={otpCode}
      onChange={setOtpCode}
      error={hasError}
      disabled={isLoading}
    />
  );
}
```

### LoginForm

A complete login form with tab switching between credential and OTP authentication methods.

**Features:**
- Tab switching between credentials and OTP login
- Form validation using Zod schemas
- Error display for validation and API errors
- Two-step OTP flow (request → verify)
- Loading states
- Responsive design

**Usage:**
```tsx
import { LoginForm } from '@/components/auth';

function LoginPage() {
  const handleCredentialLogin = async (username: string, password: string) => {
    // Call your API
    const response = await fetch('/api/auth/login/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    // Handle response
  };

  const handleOTPRequest = async (mobileNumber: string) => {
    // Call your API
    await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber }),
    });
  };

  const handleOTPVerify = async (mobileNumber: string, code: string) => {
    // Call your API
    const response = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, code }),
    });
    // Handle response
  };

  return (
    <LoginForm
      onCredentialLogin={handleCredentialLogin}
      onOTPRequest={handleOTPRequest}
      onOTPVerify={handleOTPVerify}
    />
  );
}
```

### RegistrationForm

A complete registration form with tab switching between credential and mobile registration methods.

**Features:**
- Tab switching between credentials and mobile registration
- Form validation using Zod schemas
- Password confirmation validation
- Error display for validation and API errors
- Loading states
- Responsive design

**Usage:**
```tsx
import { RegistrationForm } from '@/components/auth';

function RegisterPage() {
  const handleCredentialRegister = async (username: string, password: string) => {
    // Call your API
    const response = await fetch('/api/auth/register/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    // Handle response
  };

  const handleMobileRegister = async (mobileNumber: string) => {
    // Call your API
    const response = await fetch('/api/auth/register/mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber }),
    });
    // Handle response
  };

  return (
    <RegistrationForm
      onCredentialRegister={handleCredentialRegister}
      onMobileRegister={handleMobileRegister}
    />
  );
}
```

## Demo

A demo page is available at `/auth-demo` that showcases all authentication components with mock handlers.

To view the demo:
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth-demo`

## Validation

All forms use Zod schemas from `@/schemas/auth.schema` for validation:
- Username: 3-30 characters, alphanumeric with underscores
- Password: Minimum 8 characters
- Mobile Number: E.164 format (e.g., +1234567890)
- OTP Code: Exactly 6 numeric digits

## Styling

Components use Tailwind CSS and shadcn/ui components for consistent styling:
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Tabs, TabsContent, TabsList, TabsTrigger
- Input, Label, Button

Error states are styled with the `destructive` variant from the theme.

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:
- **Requirement 1.1**: Mobile number validation (E.164 format)
- **Requirement 2.1**: Username validation
- **Requirement 2.2**: Password validation
- **Requirement 3.1**: OTP code format (6 digits)
- **Requirement 4.1**: OTP verification UI
- **Requirement 5.2**: Credential login UI
