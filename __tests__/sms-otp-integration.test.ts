import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockSMSProvider } from '../src/lib/sms';
import { generateOTP } from '../src/lib/otp';

describe('SMS and OTP Integration', () => {
  let smsProvider: MockSMSProvider;

  beforeEach(() => {
    smsProvider = new MockSMSProvider();
    smsProvider.clearMessages();
  });

  it('should generate OTP and send via SMS', async () => {
    const mobileNumber = '+1234567890';
    
    // Generate OTP
    const code = generateOTP();
    
    // Verify OTP format
    expect(code).toMatch(/^\d{6}$/);
    expect(code.length).toBe(6);
    
    // Send via SMS
    await smsProvider.sendOTP(mobileNumber, code);
    
    // Verify SMS was sent
    expect(smsProvider.wasOTPSent(mobileNumber, code)).toBe(true);
    
    const lastMessage = smsProvider.getLastMessage();
    expect(lastMessage?.mobileNumber).toBe(mobileNumber);
    expect(lastMessage?.code).toBe(code);
  });

  it('should handle multiple OTP requests', async () => {
    const mobileNumber = '+1234567890';
    
    // Generate and send first OTP
    const code1 = generateOTP();
    await smsProvider.sendOTP(mobileNumber, code1);
    
    // Generate and send second OTP
    const code2 = generateOTP();
    await smsProvider.sendOTP(mobileNumber, code2);
    
    // Both should be tracked
    const messages = smsProvider.getSentMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].code).toBe(code1);
    expect(messages[1].code).toBe(code2);
  });

  it('should generate unique OTP codes', () => {
    const codes = new Set<string>();
    
    // Generate 100 OTPs
    for (let i = 0; i < 100; i++) {
      const code = generateOTP();
      codes.add(code);
      expect(code).toMatch(/^\d{6}$/);
    }
    
    // Most should be unique (allowing for some collisions in 1M space)
    expect(codes.size).toBeGreaterThan(90);
  });
});
