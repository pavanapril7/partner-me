/**
 * Tests for authentication configuration validation
 */

import { validateConfig, getConfig, ConfigValidationError } from '@/lib/config';

describe('Authentication Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    it('should validate successfully with all required variables', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'mock';

      expect(() => validateConfig()).not.toThrow();
      const config = validateConfig();
      
      expect(config.database.url).toBe('postgresql://user@localhost:5432/test');
      expect(config.sms.provider).toBe('mock');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Missing required environment variable: DATABASE_URL');
    });

    it('should use default values for optional variables', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      
      const config = validateConfig();
      
      expect(config.session.expiryDays).toBe(7);
      expect(config.otp.expiryMinutes).toBe(5);
      expect(config.rateLimit.attempts).toBe(5);
      expect(config.rateLimit.windowMinutes).toBe(15);
      expect(config.sms.provider).toBe('mock');
    });

    it('should parse custom numeric values correctly', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SESSION_EXPIRY_DAYS = '14';
      process.env.OTP_EXPIRY_MINUTES = '10';
      process.env.RATE_LIMIT_ATTEMPTS = '3';
      process.env.RATE_LIMIT_WINDOW_MINUTES = '30';
      
      const config = validateConfig();
      
      expect(config.session.expiryDays).toBe(14);
      expect(config.otp.expiryMinutes).toBe(10);
      expect(config.rateLimit.attempts).toBe(3);
      expect(config.rateLimit.windowMinutes).toBe(30);
    });

    it('should throw error for invalid numeric values', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SESSION_EXPIRY_DAYS = 'invalid';

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Invalid value for SESSION_EXPIRY_DAYS');
    });

    it('should throw error for negative numeric values', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.OTP_EXPIRY_MINUTES = '-5';

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Invalid value for OTP_EXPIRY_MINUTES');
    });

    it('should throw error for zero numeric values', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.RATE_LIMIT_ATTEMPTS = '0';

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Invalid value for RATE_LIMIT_ATTEMPTS');
    });

    it('should validate Twilio configuration when provider is twilio', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'ACtest123';
      process.env.TWILIO_AUTH_TOKEN = 'token123';
      process.env.TWILIO_PHONE_NUMBER = '+15551234567';

      const config = validateConfig();
      
      expect(config.sms.provider).toBe('twilio');
      expect(config.sms.twilio).toBeDefined();
      expect(config.sms.twilio?.accountSid).toBe('ACtest123');
      expect(config.sms.twilio?.authToken).toBe('token123');
      expect(config.sms.twilio?.phoneNumber).toBe('+15551234567');
    });

    it('should throw error when Twilio variables are missing', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'twilio';
      // Missing Twilio variables
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Missing required environment variable: TWILIO_ACCOUNT_SID');
    });

    it('should throw error for invalid Twilio phone number format', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'twilio';
      process.env.TWILIO_ACCOUNT_SID = 'ACtest123';
      process.env.TWILIO_AUTH_TOKEN = 'token123';
      process.env.TWILIO_PHONE_NUMBER = '5551234567'; // Missing + prefix

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Invalid TWILIO_PHONE_NUMBER: must be in E.164 format');
    });

    it('should throw error for invalid SMS provider', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'invalid';

      expect(() => validateConfig()).toThrow(ConfigValidationError);
      expect(() => validateConfig()).toThrow('Invalid SMS_PROVIDER');
    });

    it('should not require Twilio variables when using mock provider', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SMS_PROVIDER = 'mock';
      // No Twilio variables set

      expect(() => validateConfig()).not.toThrow();
      const config = validateConfig();
      expect(config.sms.provider).toBe('mock');
      expect(config.sms.twilio).toBeUndefined();
    });
  });

  describe('getConfig', () => {
    it('should return configuration without validation', () => {
      process.env.DATABASE_URL = 'postgresql://user@localhost:5432/test';
      process.env.SESSION_EXPIRY_DAYS = '14';

      const config = getConfig();
      
      expect(config.database.url).toBe('postgresql://user@localhost:5432/test');
      expect(config.session.expiryDays).toBe(14);
    });

    it('should return empty values when variables are missing', () => {
      delete process.env.DATABASE_URL;

      const config = getConfig();
      
      expect(config.database.url).toBe('');
    });

    it('should use defaults for missing optional variables', () => {
      const config = getConfig();
      
      expect(config.session.expiryDays).toBe(7);
      expect(config.otp.expiryMinutes).toBe(5);
      expect(config.rateLimit.attempts).toBe(5);
      expect(config.rateLimit.windowMinutes).toBe(15);
    });
  });

  describe('ConfigValidationError', () => {
    it('should be an instance of Error', () => {
      const error = new ConfigValidationError('test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigValidationError');
      expect(error.message).toBe('test message');
    });
  });
});
