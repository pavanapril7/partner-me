import { prisma } from './prisma';
import { randomInt } from 'crypto';

/**
 * OTP configuration
 */
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

/**
 * Generate a random 6-digit numeric OTP code
 * Requirements: 3.1
 */
export function generateOTP(): string {
  // Generate a random number between 0 and 999999
  const code = randomInt(0, 1000000);
  // Pad with leading zeros to ensure 6 digits
  return code.toString().padStart(6, '0');
}

/**
 * Store an OTP for a user with expiration
 * Requirements: 3.2, 3.4, 3.5
 * 
 * @param userId - The user ID to associate the OTP with
 * @param code - The 6-digit OTP code
 * @param expiryMinutes - Number of minutes until expiration (default: from OTP_EXPIRY_MINUTES env var or 5)
 * @returns The created OTP record
 */
export async function storeOTP(
  userId: string,
  code: string,
  expiryMinutes: number = OTP_EXPIRY_MINUTES
) {
  // Invalidate all previous unexpired OTPs for this user (Requirement 3.5)
  await prisma.oTP.updateMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: {
        gt: new Date(), // Only invalidate unexpired OTPs
      },
    },
    data: {
      isUsed: true,
    },
  });

  // Create new OTP with expiration timestamp (Requirements 3.2, 3.4)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  const otp = await prisma.oTP.create({
    data: {
      userId,
      code,
      expiresAt,
      isUsed: false,
    },
  });

  return otp;
}

/**
 * Validate an OTP code for a user
 * Requirements: 4.1
 * 
 * @param userId - The user ID to validate the OTP for
 * @param code - The 6-digit OTP code to validate
 * @returns Object with isValid flag and optional error message
 */
export async function validateOTP(
  userId: string,
  code: string
): Promise<{ isValid: boolean; error?: string; otpId?: string }> {
  // Find the most recent unused OTP for this user with the given code
  const otp = await prisma.oTP.findFirst({
    where: {
      userId,
      code,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Check if OTP exists
  if (!otp) {
    return { isValid: false, error: 'Invalid OTP code' };
  }

  // Check if OTP has expired (Requirement 4.1)
  if (otp.expiresAt < new Date()) {
    return { isValid: false, error: 'OTP has expired' };
  }

  // OTP is valid
  return { isValid: true, otpId: otp.id };
}

/**
 * Invalidate an OTP after successful verification
 * Requirements: 4.5
 * 
 * @param otpId - The ID of the OTP to invalidate
 */
export async function invalidateOTP(otpId: string): Promise<void> {
  await prisma.oTP.update({
    where: {
      id: otpId,
    },
    data: {
      isUsed: true,
    },
  });
}

/**
 * Generate and store a new OTP for a user
 * Convenience function that combines generation and storage
 * 
 * @param userId - The user ID to generate the OTP for
 * @param expiryMinutes - Number of minutes until expiration (default: from OTP_EXPIRY_MINUTES env var or 5)
 * @returns The generated OTP code
 */
export async function generateAndStoreOTP(
  userId: string,
  expiryMinutes: number = OTP_EXPIRY_MINUTES
): Promise<string> {
  const code = generateOTP();
  await storeOTP(userId, code, expiryMinutes);
  return code;
}
