# SMS Service

This module provides SMS functionality for sending OTP codes to users' mobile phones.

## Features

- **Interface-based design**: Easy to swap providers
- **Twilio integration**: Production-ready SMS delivery
- **Mock provider**: Testing and development without sending real SMS
- **Environment-based configuration**: Configure via environment variables
- **Singleton pattern**: Single instance throughout the application

## Usage

### Basic Usage

```typescript
import { getSMSService } from '@/lib/sms';

// Get the configured SMS service
const smsService = getSMSService();

// Send an OTP
await smsService.sendOTP('+1234567890', '123456');
```

### Using Specific Providers

```typescript
import { MockSMSProvider, TwilioSMSProvider } from '@/lib/sms';

// Mock provider for testing
const mockProvider = new MockSMSProvider();
await mockProvider.sendOTP('+1234567890', '123456');

// Check if OTP was sent (testing)
const wasSent = mockProvider.wasOTPSent('+1234567890', '123456');

// Twilio provider for production
const twilioProvider = new TwilioSMSProvider(
  'account_sid',
  'auth_token',
  '+1234567890'
);
await twilioProvider.sendOTP('+9876543210', '654321');
```

### Custom Configuration

```typescript
import { createSMSService } from '@/lib/sms';

// Create with custom config
const smsService = createSMSService({
  provider: 'twilio',
  twilio: {
    accountSid: 'your_sid',
    authToken: 'your_token',
    phoneNumber: '+1234567890',
  },
});
```

## Environment Variables

Configure the SMS service using environment variables:

```bash
# Provider selection (default: mock)
SMS_PROVIDER="mock"  # or "twilio"

# Twilio configuration (required when SMS_PROVIDER=twilio)
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## Providers

### Mock Provider

Used for development and testing. Logs OTP codes to console instead of sending real SMS.

**Features:**
- No external dependencies
- Message history tracking
- Verification helpers for testing

**Use cases:**
- Local development
- Automated testing
- CI/CD pipelines

### Twilio Provider

Production-ready SMS delivery using Twilio API.

**Features:**
- Reliable SMS delivery
- Global coverage
- Delivery status tracking

**Setup:**
1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Configure environment variables

## Testing

The mock provider includes helpful methods for testing:

```typescript
const mockProvider = new MockSMSProvider();

// Send OTP
await mockProvider.sendOTP('+1234567890', '123456');

// Verify in tests
expect(mockProvider.wasOTPSent('+1234567890', '123456')).toBe(true);

// Get message history
const messages = mockProvider.getSentMessages();
const lastMessage = mockProvider.getLastMessage();

// Clear history between tests
mockProvider.clearMessages();
```

## Error Handling

All providers throw errors when SMS delivery fails:

```typescript
try {
  await smsService.sendOTP(mobileNumber, code);
} catch (error) {
  console.error('Failed to send OTP:', error);
  // Handle error (e.g., retry, notify user)
}
```

## Integration with OTP Service

The SMS service integrates with the OTP generation service:

```typescript
import { generateOTP } from '@/lib/otp';
import { getSMSService } from '@/lib/sms';

// Generate OTP
const code = generateOTP();

// Send via SMS
const smsService = getSMSService();
await smsService.sendOTP(mobileNumber, code);
```
