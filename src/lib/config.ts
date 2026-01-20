/**
 * Configuration validation and management
 * 
 * This module validates required environment variables on startup
 * and provides typed access to configuration values.
 */

export interface AuthConfig {
  database: {
    url: string;
  };
  session: {
    expiryDays: number;
  };
  otp: {
    expiryMinutes: number;
  };
  rateLimit: {
    attempts: number;
    windowMinutes: number;
  };
  sms: {
    provider: 'twilio' | 'mock';
    twilio?: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };
}

/**
 * Validation error for missing or invalid configuration
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validates that a required environment variable is present
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigValidationError(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Parses an integer from an environment variable with validation
 */
function parseIntEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new ConfigValidationError(
      `Invalid value for ${name}: must be a positive integer, got "${value}"`
    );
  }
  
  return parsed;
}

/**
 * Validates and loads the authentication configuration
 * 
 * This function should be called on application startup to ensure
 * all required configuration is present and valid.
 * 
 * @throws {ConfigValidationError} If required configuration is missing or invalid
 * @returns The validated configuration object
 */
export function validateConfig(): AuthConfig {
  // Validate database configuration
  const databaseUrl = requireEnv('DATABASE_URL');

  // Parse and validate numeric configuration
  const sessionExpiryDays = parseIntEnv('SESSION_EXPIRY_DAYS', 7);
  const otpExpiryMinutes = parseIntEnv('OTP_EXPIRY_MINUTES', 5);
  const rateLimitAttempts = parseIntEnv('RATE_LIMIT_ATTEMPTS', 5);
  const rateLimitWindowMinutes = parseIntEnv('RATE_LIMIT_WINDOW_MINUTES', 15);

  // Validate SMS configuration
  const smsProvider = getEnv('SMS_PROVIDER', 'mock') as 'twilio' | 'mock';
  
  if (smsProvider !== 'twilio' && smsProvider !== 'mock') {
    throw new ConfigValidationError(
      `Invalid SMS_PROVIDER: must be 'twilio' or 'mock', got "${smsProvider}"`
    );
  }

  const config: AuthConfig = {
    database: {
      url: databaseUrl,
    },
    session: {
      expiryDays: sessionExpiryDays,
    },
    otp: {
      expiryMinutes: otpExpiryMinutes,
    },
    rateLimit: {
      attempts: rateLimitAttempts,
      windowMinutes: rateLimitWindowMinutes,
    },
    sms: {
      provider: smsProvider,
    },
  };

  // Validate Twilio configuration if using Twilio provider
  if (smsProvider === 'twilio') {
    const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
    const authToken = requireEnv('TWILIO_AUTH_TOKEN');
    const phoneNumber = requireEnv('TWILIO_PHONE_NUMBER');

    // Validate phone number format (E.164)
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      throw new ConfigValidationError(
        `Invalid TWILIO_PHONE_NUMBER: must be in E.164 format (e.g., +1234567890), got "${phoneNumber}"`
      );
    }

    config.sms.twilio = {
      accountSid,
      authToken,
      phoneNumber,
    };
  }

  return config;
}

/**
 * Gets the current configuration
 * 
 * Note: This does not validate the configuration. Call validateConfig()
 * on startup to ensure configuration is valid.
 */
export function getConfig(): AuthConfig {
  return {
    database: {
      url: process.env.DATABASE_URL || '',
    },
    session: {
      expiryDays: parseIntEnv('SESSION_EXPIRY_DAYS', 7),
    },
    otp: {
      expiryMinutes: parseIntEnv('OTP_EXPIRY_MINUTES', 5),
    },
    rateLimit: {
      attempts: parseIntEnv('RATE_LIMIT_ATTEMPTS', 5),
      windowMinutes: parseIntEnv('RATE_LIMIT_WINDOW_MINUTES', 15),
    },
    sms: {
      provider: (process.env.SMS_PROVIDER || 'mock') as 'twilio' | 'mock',
      twilio: process.env.SMS_PROVIDER === 'twilio' ? {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      } : undefined,
    },
  };
}
