# Environment Configuration Guide

This project uses environment variables for configuration. This guide will help you set up your environment correctly.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string

3. (Optional) Configure other variables as needed

## Required Variables

- **DATABASE_URL**: PostgreSQL database connection string
  - Format: `postgresql://username:password@host:port/database?schema=public`
  - Example: `postgresql://user@localhost:5432/myapp?schema=public`

## Optional Variables (with defaults)

All optional variables have sensible defaults. You only need to set them if you want different values.

### Authentication
- **SESSION_EXPIRY_DAYS**: Session expiration in days (default: `7`)
- **OTP_EXPIRY_MINUTES**: OTP code expiration in minutes (default: `5`)

### Rate Limiting
- **RATE_LIMIT_ATTEMPTS**: Max failed login attempts before blocking (default: `5`)
- **RATE_LIMIT_WINDOW_MINUTES**: Time window for rate limiting in minutes (default: `15`)

### SMS Configuration
- **SMS_PROVIDER**: SMS provider to use - `twilio` or `mock` (default: `mock`)

When using `SMS_PROVIDER=twilio`, you must also set:
- **TWILIO_ACCOUNT_SID**: Your Twilio account SID
- **TWILIO_AUTH_TOKEN**: Your Twilio auth token
- **TWILIO_PHONE_NUMBER**: Your Twilio phone number in E.164 format (e.g., `+15551234567`)

## Configuration Validation

The application automatically validates configuration on startup. If any required variables are missing or invalid, you'll see a clear error message explaining what needs to be fixed.

### Example Error Messages

```
✗ Configuration validation failed:
  Missing required environment variable: DATABASE_URL

Please check your .env file and ensure all required variables are set.
See docs/ENVIRONMENT_CONFIGURATION.md for details.
```

## Development vs Production

### Development Setup
For local development, use the mock SMS provider:
```env
SMS_PROVIDER=mock
```

OTP codes will be logged to the console instead of being sent via SMS.

### Production Setup
For production, configure Twilio:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## More Information

For detailed documentation about all environment variables, see [docs/ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md)

## Troubleshooting

### "Missing required environment variable: DATABASE_URL"
Make sure you have a `.env` file with `DATABASE_URL` set.

### "Invalid value for SESSION_EXPIRY_DAYS: must be a positive integer"
Ensure numeric values are positive integers (no decimals, no negative numbers).

### "Invalid TWILIO_PHONE_NUMBER: must be in E.164 format"
Phone numbers must start with `+` followed by country code and number (e.g., `+15551234567`).

### SMS not working in development
If you're using `SMS_PROVIDER=mock`, OTP codes are logged to the console, not sent via SMS. Check your terminal output for the OTP code.
