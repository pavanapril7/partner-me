import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createSMSService,
  MockSMSProvider,
  TwilioSMSProvider,
  getSMSService,
  resetSMSService,
} from '../src/lib/sms';

describe('SMS Service', () => {
  describe('MockSMSProvider', () => {
    let mockProvider: MockSMSProvider;

    beforeEach(() => {
      mockProvider = new MockSMSProvider();
    });

    it('should send OTP and store message', async () => {
      const mobileNumber = '+1234567890';
      const code = '123456';

      await mockProvider.sendOTP(mobileNumber, code);

      const lastMessage = mockProvider.getLastMessage();
      expect(lastMessage).toBeDefined();
      expect(lastMessage?.mobileNumber).toBe(mobileNumber);
      expect(lastMessage?.code).toBe(code);
    });

    it('should track multiple messages', async () => {
      await mockProvider.sendOTP('+1111111111', '111111');
      await mockProvider.sendOTP('+2222222222', '222222');

      const messages = mockProvider.getSentMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].code).toBe('111111');
      expect(messages[1].code).toBe('222222');
    });

    it('should verify if OTP was sent', async () => {
      const mobileNumber = '+1234567890';
      const code = '123456';

      await mockProvider.sendOTP(mobileNumber, code);

      expect(mockProvider.wasOTPSent(mobileNumber, code)).toBe(true);
      expect(mockProvider.wasOTPSent(mobileNumber, '999999')).toBe(false);
      expect(mockProvider.wasOTPSent('+9999999999', code)).toBe(false);
    });

    it('should clear messages', async () => {
      await mockProvider.sendOTP('+1234567890', '123456');
      expect(mockProvider.getSentMessages()).toHaveLength(1);

      mockProvider.clearMessages();
      expect(mockProvider.getSentMessages()).toHaveLength(0);
    });
  });

  describe('TwilioSMSProvider', () => {
    it('should throw error if credentials are missing', () => {
      expect(() => new TwilioSMSProvider('', '', '')).toThrow(
        'Twilio credentials are required'
      );
    });

    it('should create provider with valid credentials', () => {
      const provider = new TwilioSMSProvider(
        'test_sid',
        'test_token',
        '+1234567890'
      );
      expect(provider).toBeDefined();
    });
  });

  describe('createSMSService', () => {
    it('should create mock provider', () => {
      const service = createSMSService({ provider: 'mock' });
      expect(service).toBeInstanceOf(MockSMSProvider);
    });

    it('should create Twilio provider with config', () => {
      const service = createSMSService({
        provider: 'twilio',
        twilio: {
          accountSid: 'test_sid',
          authToken: 'test_token',
          phoneNumber: '+1234567890',
        },
      });
      expect(service).toBeInstanceOf(TwilioSMSProvider);
    });

    it('should throw error for Twilio without config', () => {
      expect(() => createSMSService({ provider: 'twilio' })).toThrow(
        'Twilio configuration is required'
      );
    });
  });

  describe('getSMSService singleton', () => {
    beforeEach(() => {
      resetSMSService();
    });

    it('should return the same instance', () => {
      const service1 = getSMSService();
      const service2 = getSMSService();
      expect(service1).toBe(service2);
    });

    it('should create new instance after reset', () => {
      const service1 = getSMSService();
      resetSMSService();
      const service2 = getSMSService();
      expect(service1).not.toBe(service2);
    });
  });
});
