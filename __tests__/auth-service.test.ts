import { 
  registerWithCredentials, 
  registerWithMobile, 
  requestOTP,
  verifyOTP,
  loginWithCredentials,
  DuplicateError, 
  AuthError 
} from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { hashPassword, comparePassword } from '../src/lib/password';
import { generateAndStoreOTP, validateOTP, invalidateOTP } from '../src/lib/otp';
import { getSMSService } from '../src/lib/sms';
import { createSession } from '../src/lib/session';

// Mock the dependencies
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../src/lib/otp', () => ({
  generateAndStoreOTP: jest.fn(),
  validateOTP: jest.fn(),
  invalidateOTP: jest.fn(),
}));

jest.mock('../src/lib/sms', () => ({
  getSMSService: jest.fn(),
}));

jest.mock('../src/lib/session', () => ({
  createSession: jest.fn(),
}));

describe('Authentication Service - Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWithCredentials', () => {
    it('should successfully register a user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed_password',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await registerWithCredentials('testuser', 'password123');

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          passwordHash: 'hashed_password',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw DuplicateError when username already exists', async () => {
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['username'] },
      });

      await expect(
        registerWithCredentials('existinguser', 'password123')
      ).rejects.toThrow(DuplicateError);

      await expect(
        registerWithCredentials('existinguser', 'password123')
      ).rejects.toThrow('Username already exists');
    });

    it('should throw AuthError for unexpected database errors', async () => {
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(
        registerWithCredentials('testuser', 'password123')
      ).rejects.toThrow(AuthError);

      await expect(
        registerWithCredentials('testuser', 'password123')
      ).rejects.toThrow('Failed to register user');
    });
  });

  describe('registerWithMobile', () => {
    it('should successfully register a user with valid mobile number', async () => {
      const mockUser = {
        id: 'user-456',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await registerWithMobile('+1234567890');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          mobileNumber: '+1234567890',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw DuplicateError when mobile number already exists', async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['mobileNumber'] },
      });

      await expect(
        registerWithMobile('+1234567890')
      ).rejects.toThrow(DuplicateError);

      await expect(
        registerWithMobile('+1234567890')
      ).rejects.toThrow('Mobile number already exists');
    });

    it('should throw AuthError for unexpected database errors', async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(
        registerWithMobile('+1234567890')
      ).rejects.toThrow(AuthError);

      await expect(
        registerWithMobile('+1234567890')
      ).rejects.toThrow('Failed to register user');
    });
  });
});


describe('Authentication Service - OTP Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOTP', () => {
    it('should successfully request OTP for valid mobile number', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSMSService = {
        sendOTP: jest.fn().mockResolvedValue(undefined),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateAndStoreOTP as jest.Mock).mockResolvedValue('123456');
      (getSMSService as jest.Mock).mockReturnValue(mockSMSService);

      await requestOTP('+1234567890');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { mobileNumber: '+1234567890' },
      });
      expect(generateAndStoreOTP).toHaveBeenCalledWith('user-123', 5);
      expect(mockSMSService.sendOTP).toHaveBeenCalledWith('+1234567890', '123456');
    });

    it('should throw AuthError when mobile number not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(requestOTP('+9999999999')).rejects.toThrow(AuthError);
      await expect(requestOTP('+9999999999')).rejects.toThrow('Authentication failed');
    });

    it('should throw AuthError when SMS sending fails', async () => {
      const mockUser = {
        id: 'user-123',
        mobileNumber: '+1234567890',
      };

      const mockSMSService = {
        sendOTP: jest.fn().mockRejectedValue(new Error('SMS service unavailable')),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateAndStoreOTP as jest.Mock).mockResolvedValue('123456');
      (getSMSService as jest.Mock).mockReturnValue(mockSMSService);

      await expect(requestOTP('+1234567890')).rejects.toThrow(AuthError);
      await expect(requestOTP('+1234567890')).rejects.toThrow('Failed to send OTP');
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify OTP and create session', async () => {
      const mockUser = {
        id: 'user-123',
        username: null,
        passwordHash: null,
        mobileNumber: '+1234567890',
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token-abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (validateOTP as jest.Mock).mockResolvedValue({ 
        isValid: true, 
        otpId: 'otp-123' 
      });
      (invalidateOTP as jest.Mock).mockResolvedValue(undefined);
      (createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await verifyOTP('+1234567890', '123456');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { mobileNumber: '+1234567890' },
      });
      expect(validateOTP).toHaveBeenCalledWith('user-123', '123456');
      expect(invalidateOTP).toHaveBeenCalledWith('otp-123');
      expect(createSession).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockSession);
    });

    it('should throw AuthError when mobile number not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(verifyOTP('+9999999999', '123456')).rejects.toThrow(AuthError);
      await expect(verifyOTP('+9999999999', '123456')).rejects.toThrow('Authentication failed');
    });

    it('should throw AuthError when OTP is invalid', async () => {
      const mockUser = {
        id: 'user-123',
        mobileNumber: '+1234567890',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (validateOTP as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: 'Invalid OTP code' 
      });

      await expect(verifyOTP('+1234567890', '999999')).rejects.toThrow(AuthError);
      await expect(verifyOTP('+1234567890', '999999')).rejects.toThrow('Invalid OTP code');
    });

    it('should throw AuthError with OTP_EXPIRED code when OTP is expired', async () => {
      const mockUser = {
        id: 'user-123',
        mobileNumber: '+1234567890',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (validateOTP as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: 'OTP has expired' 
      });

      await expect(verifyOTP('+1234567890', '123456')).rejects.toThrow(AuthError);
      
      try {
        await verifyOTP('+1234567890', '123456');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).code).toBe('OTP_EXPIRED');
      }
    });

    it('should not call invalidateOTP when validation fails', async () => {
      const mockUser = {
        id: 'user-123',
        mobileNumber: '+1234567890',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (validateOTP as jest.Mock).mockResolvedValue({ 
        isValid: false, 
        error: 'Invalid OTP code' 
      });

      await expect(verifyOTP('+1234567890', '999999')).rejects.toThrow(AuthError);
      expect(invalidateOTP).not.toHaveBeenCalled();
      expect(createSession).not.toHaveBeenCalled();
    });
  });
});

describe('Authentication Service - Credential Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginWithCredentials', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed_password',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token-abc',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await loginWithCredentials('testuser', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(createSession).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockSession);
    });

    it('should throw AuthError when username does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        loginWithCredentials('nonexistent', 'password123')
      ).rejects.toThrow(AuthError);

      await expect(
        loginWithCredentials('nonexistent', 'password123')
      ).rejects.toThrow('Authentication failed');

      // Verify the error code is AUTH_FAILED
      try {
        await loginWithCredentials('nonexistent', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).code).toBe('AUTH_FAILED');
        expect((error as AuthError).statusCode).toBe(401);
      }
    });

    it('should throw AuthError when user has no password hash', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: null, // User registered with mobile only
        mobileNumber: '+1234567890',
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        loginWithCredentials('testuser', 'password123')
      ).rejects.toThrow(AuthError);

      await expect(
        loginWithCredentials('testuser', 'password123')
      ).rejects.toThrow('Authentication failed');
    });

    it('should throw AuthError with generic message when password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed_password',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        loginWithCredentials('testuser', 'wrongpassword')
      ).rejects.toThrow(AuthError);

      await expect(
        loginWithCredentials('testuser', 'wrongpassword')
      ).rejects.toThrow('Authentication failed');

      // Verify the error code is AUTH_FAILED (same as username not found)
      try {
        await loginWithCredentials('testuser', 'wrongpassword');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).code).toBe('AUTH_FAILED');
        expect((error as AuthError).statusCode).toBe(401);
      }
    });

    it('should not reveal whether username exists or password is wrong', async () => {
      // Test that both scenarios return the same error message
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      let error1;
      try {
        await loginWithCredentials('nonexistent', 'password123');
      } catch (error) {
        error1 = error;
      }

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashed_password',
        mobileNumber: null,
        email: null,
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      let error2;
      try {
        await loginWithCredentials('testuser', 'wrongpassword');
      } catch (error) {
        error2 = error;
      }

      // Both errors should have the same message and code
      expect((error1 as AuthError).message).toBe((error2 as AuthError).message);
      expect((error1 as AuthError).code).toBe((error2 as AuthError).code);
      expect((error1 as AuthError).statusCode).toBe((error2 as AuthError).statusCode);
    });
  });
});
