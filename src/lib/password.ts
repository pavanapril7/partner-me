import bcrypt from 'bcrypt';

/**
 * The cost factor for bcrypt hashing.
 * Higher values increase security but also increase computation time.
 * Default: 10 (recommended for most applications)
 */
const BCRYPT_COST_FACTOR = 10;

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 * @throws Error if hashing fails
 * 
 * Requirements: 2.3, 8.1, 8.2
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    return hash;
  } catch {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compares a plain text password with a hashed password.
 * Uses constant-time comparison to prevent timing attacks.
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns A promise that resolves to true if passwords match, false otherwise
 * @throws Error if comparison fails
 * 
 * Requirements: 2.3, 8.1, 8.2, 8.3
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch {
    throw new Error('Failed to compare password');
  }
}
