# Environment Configuration

This document describes all environment variables used by the dual authentication system.

## Required Environment Variables

### Database Configuration

#### `DATABASE_URL` (Required)
PostgreSQL database connection string.

**Format:** `postgresql://username:password@host:port/database?schema=public`

**Example:** `postgresql://user@localhost:5432/myapp?schema=public`

## Optional Environment Variables

All optional variables have sensible defaults. You only need to set them if you want to override the defaults.

### Authentication Configuration

#### `SESSION_EXPIRY_DAYS` (Optional)
Number of days before a session expires.

**Default:** `7`

**Example:** `SESSION_EXPIRY_DAYS=14`

#### `OTP_EXPIRY_MINUTES` (Optional)
Number of minutes before an OTP code expires.

**Default:** `5`

**Example:** `OTP_EXPIRY_MINUTES=10`

### Rate Limiting Configuration

#### `RATE_LIMIT_ATTEMPTS` (Optional)
Maximum number of failed login attempts before rate limiting is triggered.

**Default:** `5`

**Example:** `RATE_LIMIT_ATTEMPTS=3`

#### `RATE_LIMIT_WINDOW_MINUTES` (Optional)
Time window in minutes for counting failed login attempts.

**Default:** `15`

**Example:** `RATE_LIMIT_WINDOW_MINUTES=30`

### SMS Configuration

#### `SMS_PROVIDER` (Optional)
SMS provider to use for sending OTP codes.

**Options:** `twilio` or `mock`

**Default:** `mock`

**Example:** `SMS_PROVIDER=twilio`

**Note:** When set to `mock`, OTP codes are logged to the console instead of being sent via SMS. This is useful for development and testing.

#### Twilio Configuration (Required when `SMS_PROVIDER=twilio`)

##### `TWILIO_ACCOUNT_SID` (Required for Twilio)
Your Twilio account SID.

**Where to find:** [Twilio Console](https://console.twilio.com/)

**Example:** `TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

##### `TWILIO_AUTH_TOKEN` (Required for Twilio)
Your Twilio auth token.

**Where to find:** [Twilio Console](https://console.twilio.com/)

**Example:** `TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

##### `TWILIO_PHONE_NUMBER` (Required for Twilio)
Your Twilio phone number in E.164 format.

**Format:** `+[country code][number]` (e.g., `+1234567890`)

**Where to find:** [Twilio Console - Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)

**Example:** `TWILIO_PHONE_NUMBER=+15551234567`

## Configuration Validation

The application validates all configuration on startup. If required variables are missing or invalid, the application will throw a `ConfigValidationError` with details about what needs to be fixed.

### Validation Rules

1. **DATABASE_URL**: Must be present
2. **Numeric values**: Must be positive integers if provided
3. **SMS_PROVIDER**: Must be either `twilio` or `mock`
4. **Twilio configuration**: All three Twilio variables must be present when `SMS_PROVIDER=twilio`
5. **TWILIO_PHONE_NUMBER**: Must be in valid E.164 format

## Setup Instructions

### Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `DATABASE_URL` with your local PostgreSQL connection string

3. (Optional) Configure other variables as needed

4. For development, you can use the mock SMS provider (default):
   ```
   SMS_PROVIDER=mock
   ```

### Production Setup

1. Set all required environment variables in your hosting platform

2. Configure Twilio for SMS delivery:
   ```
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. Adjust rate limiting and expiry settings based on your security requirements

4. Ensure `DATABASE_URL` points to your production database

## Programmatic Access

You can validate and access configuration in your code:

```typescript
import { validateConfig, getConfig } from '@/lib/config';

// Validate configuration on startup (throws if invalid)
try {
  const config = validateConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

// Get configuration values
const config = getConfig();
console.log(`Session expiry: ${config.session.expiryDays} days`);
console.log(`OTP expiry: ${config.otp.expiryMinutes} minutes`);
```

## Troubleshooting

### "Missing required environment variable: DATABASE_URL"
Make sure you have a `.env` file with `DATABASE_URL` set.

### "Invalid value for SESSION_EXPIRY_DAYS: must be a positive integer"
Ensure numeric configuration values are positive integers (no decimals, no negative numbers).

### "Invalid TWILIO_PHONE_NUMBER: must be in E.164 format"
Phone numbers must start with `+` followed by country code and number (e.g., `+15551234567`).

### "Missing required environment variable: TWILIO_ACCOUNT_SID"
When using `SMS_PROVIDER=twilio`, all three Twilio variables must be set. Either set them or switch to `SMS_PROVIDER=mock` for development.
