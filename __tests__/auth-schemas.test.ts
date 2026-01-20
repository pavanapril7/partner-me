import {
  usernamePasswordRegistrationSchema,
  mobileRegistrationSchema,
  usernamePasswordLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  sessionTokenSchema,
  logoutSchema,
} from '../src/schemas/auth.schema';

describe('Authentication Schemas', () => {
  describe('usernamePasswordRegistrationSchema', () => {
    it('should accept valid username and password', () => {
      const validData = {
        username: 'john_doe123',
        password: 'securePassword123',
      };
      expect(() => usernamePasswordRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should reject username shorter than 3 characters', () => {
      const invalidData = {
        username: 'ab',
        password: 'securePassword123',
      };
      expect(() => usernamePasswordRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should reject username with special characters', () => {
      const invalidData = {
        username: 'john-doe',
        password: 'securePassword123',
      };
      expect(() => usernamePasswordRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        username: 'john_doe',
        password: 'short',
      };
      expect(() => usernamePasswordRegistrationSchema.parse(invalidData)).toThrow();
    });
  });

  describe('mobileRegistrationSchema', () => {
    it('should accept valid E.164 mobile number', () => {
      const validData = {
        mobileNumber: '+12345678901',
      };
      expect(() => mobileRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should reject mobile number without plus sign', () => {
      const invalidData = {
        mobileNumber: '12345678901',
      };
      expect(() => mobileRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should reject mobile number starting with zero', () => {
      const invalidData = {
        mobileNumber: '+01234567890',
      };
      expect(() => mobileRegistrationSchema.parse(invalidData)).toThrow();
    });
  });

  describe('usernamePasswordLoginSchema', () => {
    it('should accept valid username and password', () => {
      const validData = {
        username: 'john_doe',
        password: 'anyPassword',
      };
      expect(() => usernamePasswordLoginSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty username', () => {
      const invalidData = {
        username: '',
        password: 'anyPassword',
      };
      expect(() => usernamePasswordLoginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('otpRequestSchema', () => {
    it('should accept valid E.164 mobile number', () => {
      const validData = {
        mobileNumber: '+12345678901',
      };
      expect(() => otpRequestSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid mobile number format', () => {
      const invalidData = {
        mobileNumber: '1234567890',
      };
      expect(() => otpRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe('otpVerifySchema', () => {
    it('should accept valid mobile number and 6-digit OTP', () => {
      const validData = {
        mobileNumber: '+12345678901',
        code: '123456',
      };
      expect(() => otpVerifySchema.parse(validData)).not.toThrow();
    });

    it('should reject OTP with less than 6 digits', () => {
      const invalidData = {
        mobileNumber: '+12345678901',
        code: '12345',
      };
      expect(() => otpVerifySchema.parse(invalidData)).toThrow();
    });

    it('should reject OTP with non-numeric characters', () => {
      const invalidData = {
        mobileNumber: '+12345678901',
        code: '12345a',
      };
      expect(() => otpVerifySchema.parse(invalidData)).toThrow();
    });
  });

  describe('sessionTokenSchema', () => {
    it('should accept valid session token', () => {
      const validData = {
        token: 'valid-session-token-123',
      };
      expect(() => sessionTokenSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
      };
      expect(() => sessionTokenSchema.parse(invalidData)).toThrow();
    });
  });

  describe('logoutSchema', () => {
    it('should accept valid session token', () => {
      const validData = {
        token: 'valid-session-token-123',
      };
      expect(() => logoutSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
      };
      expect(() => logoutSchema.parse(invalidData)).toThrow();
    });
  });
});
