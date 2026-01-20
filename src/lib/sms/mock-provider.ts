import { SMSService } from './types';

/**
 * Mock SMS Provider
 * Used for testing and development - logs OTP codes instead of sending SMS
 */
export class MockSMSProvider implements SMSService {
  private sentMessages: Array<{ mobileNumber: string; code: string; timestamp: Date }> = [];

  async sendOTP(mobileNumber: string, code: string): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Store the message for testing verification
    this.sentMessages.push({
      mobileNumber,
      code,
      timestamp: new Date(),
    });

    // Log to console for development
    console.log(`[MOCK SMS] OTP sent to ${mobileNumber}: ${code}`);
  }

  /**
   * Get all sent messages (useful for testing)
   */
  getSentMessages() {
    return [...this.sentMessages];
  }

  /**
   * Get the last sent message (useful for testing)
   */
  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1] || null;
  }

  /**
   * Clear sent messages history (useful for testing)
   */
  clearMessages() {
    this.sentMessages = [];
  }

  /**
   * Check if a specific OTP was sent to a mobile number
   */
  wasOTPSent(mobileNumber: string, code: string): boolean {
    return this.sentMessages.some(
      (msg) => msg.mobileNumber === mobileNumber && msg.code === code
    );
  }
}
