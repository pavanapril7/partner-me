import { SMSService } from './types';

/**
 * Twilio SMS Provider
 * Implements SMS delivery using Twilio API
 */
export class TwilioSMSProvider implements SMSService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor(accountSid: string, authToken: string, phoneNumber: string) {
    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Twilio credentials are required');
    }
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
  }

  async sendOTP(mobileNumber: string, code: string): Promise<void> {
    try {
      // Create the Twilio API URL
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      // Create the message body
      const message = `Your verification code is: ${code}. This code will expire in 5 minutes.`;

      // Prepare the request body
      const body = new URLSearchParams({
        To: mobileNumber,
        From: this.phoneNumber,
        Body: message,
      });

      // Make the API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${this.accountSid}:${this.authToken}`).toString(
              'base64'
            ),
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio API error: ${error}`);
      }

      // Successfully sent
      console.log(`OTP sent to ${mobileNumber} via Twilio`);
    } catch (error) {
      console.error('Failed to send OTP via Twilio:', error);
      throw new Error('Failed to send OTP. Please try again later.');
    }
  }
}
