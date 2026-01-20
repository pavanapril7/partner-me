/**
 * Application initialization
 * 
 * This module performs startup validation and initialization tasks.
 * Import this module early in your application to ensure configuration
 * is validated before the app starts.
 */

import { validateConfig, ConfigValidationError } from './config';

/**
 * Validates configuration on startup
 * 
 * This function is called automatically when this module is imported.
 * It will throw an error if configuration is invalid, preventing the
 * application from starting with invalid configuration.
 */
function initializeApp() {
  // Only validate in Node.js environment (server-side)
  // Skip validation in browser environment
  if (typeof window === 'undefined') {
    try {
      const config = validateConfig();
      console.log('✓ Configuration validated successfully');
      console.log(`  - Database: ${config.database.url.split('@')[1] || 'configured'}`);
      console.log(`  - SMS Provider: ${config.sms.provider}`);
      console.log(`  - Session Expiry: ${config.session.expiryDays} days`);
      console.log(`  - OTP Expiry: ${config.otp.expiryMinutes} minutes`);
      console.log(`  - Rate Limit: ${config.rateLimit.attempts} attempts per ${config.rateLimit.windowMinutes} minutes`);
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        console.error('✗ Configuration validation failed:');
        console.error(`  ${error.message}`);
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        console.error('See docs/ENVIRONMENT_CONFIGURATION.md for details.\n');
        
        // In production, we want to fail fast
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
}

// Run initialization when this module is imported
initializeApp();

export { initializeApp };
