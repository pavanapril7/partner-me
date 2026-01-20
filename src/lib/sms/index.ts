import { SMSService, SMSConfig } from './types';
import { TwilioSMSProvider } from './twilio-provider';
import { MockSMSProvider } from './mock-provider';

/**
 * Create an SMS service instance based on configuration
 */
export function createSMSService(config: SMSConfig): SMSService {
  switch (config.provider) {
    case 'twilio':
      if (!config.twilio) {
        throw new Error('Twilio configuration is required when provider is "twilio"');
      }
      return new TwilioSMSProvider(
        config.twilio.accountSid,
        config.twilio.authToken,
        config.twilio.phoneNumber
      );
    
    case 'mock':
      return new MockSMSProvider();
    
    default:
      throw new Error(`Unknown SMS provider: ${config.provider}`);
  }
}

/**
 * Create SMS service from environment variables
 */
export function createSMSServiceFromEnv(): SMSService {
  const provider = (process.env.SMS_PROVIDER || 'mock') as 'twilio' | 'mock';

  const config: SMSConfig = {
    provider,
  };

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error(
        'Twilio configuration missing. Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER'
      );
    }

    config.twilio = {
      accountSid,
      authToken,
      phoneNumber,
    };
  }

  return createSMSService(config);
}

// Singleton instance for the application
let smsServiceInstance: SMSService | null = null;

/**
 * Get the SMS service singleton instance
 */
export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    smsServiceInstance = createSMSServiceFromEnv();
  }
  return smsServiceInstance;
}

/**
 * Reset the SMS service singleton (useful for testing)
 */
export function resetSMSService(): void {
  smsServiceInstance = null;
}

// Export types and providers
export type { SMSService, SMSConfig };
export { TwilioSMSProvider } from './twilio-provider';
export { MockSMSProvider } from './mock-provider';
