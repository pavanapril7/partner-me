import { z } from 'zod';

/**
 * Authentication validation schemas for the dual authentication system
 * Supports both mobile OTP and username/password authentication
 */

// ============================================================================
// Registration Schemas
// ============================================================================

/**
 * Schema for username/password registration
 * Requirements: 2.1, 2.2
 * - Username: 3-30 characters, alphanumeric with underscores only
 * - Password: minimum 8 characters
 */
export const usernamePasswordRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
});

export type UsernamePasswordRegistration = z.infer<typeof usernamePasswordRegistrationSchema>;

/**
 * Schema for mobile number registration
 * Requirement: 1.1
 * - Mobile number must be in E.164 format (+[country code][number])
 * - E.164 format: +[1-9][1-14 digits]
 */
export const mobileRegistrationSchema = z.object({
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g., +1234567890)'),
});

export type MobileRegistration = z.infer<typeof mobileRegistrationSchema>;

// ============================================================================
// Login Schemas
// ============================================================================

/**
 * Schema for username/password login
 * Requirement: 5.2
 * - Username and password are required
 * - No format validation on login (only on registration)
 */
export const usernamePasswordLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type UsernamePasswordLogin = z.infer<typeof usernamePasswordLoginSchema>;

/**
 * Schema for OTP request
 * Requirement: 3.1
 * - Mobile number must be in E.164 format
 */
export const otpRequestSchema = z.object({
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g., +1234567890)'),
});

export type OTPRequest = z.infer<typeof otpRequestSchema>;

/**
 * Schema for OTP verification
 * Requirements: 3.1, 4.1
 * - Mobile number must be in E.164 format
 * - OTP code must be exactly 6 numeric digits
 */
export const otpVerifySchema = z.object({
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g., +1234567890)'),
  code: z
    .string()
    .length(6, 'OTP code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP code must contain only numbers'),
});

export type OTPVerify = z.infer<typeof otpVerifySchema>;

// ============================================================================
// Session Schemas
// ============================================================================

/**
 * Schema for session token validation
 * Requirement: 6.4
 * - Session token is required for authenticated requests
 */
export const sessionTokenSchema = z.object({
  token: z.string().min(1, 'Session token is required'),
});

export type SessionToken = z.infer<typeof sessionTokenSchema>;

/**
 * Schema for logout request
 * Requirement: 7.1
 * - Session token is required to logout
 */
export const logoutSchema = z.object({
  token: z.string().min(1, 'Session token is required'),
});

export type Logout = z.infer<typeof logoutSchema>;
