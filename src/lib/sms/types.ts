/**
 * SMS Service Interface
 * Defines the contract for sending SMS messages (OTP codes)
 */
export interface SMSService {
  /**
   * Send an OTP code to a mobile number
   * @param mobileNumber - Mobile number in E.164 format
   * @param code - 6-digit OTP code
   * @throws Error if SMS delivery fails
   */
  sendOTP(mobileNumber: string, code: string): Promise<void>;
}

/**
 * SMS Provider Configuration
 */
export interface SMSConfig {
  provider: 'twilio' | 'mock';
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
}
