import { hashPassword, comparePassword } from '../src/lib/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // bcrypt includes a salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should hash passwords of different lengths', async () => {
      const shortPassword = 'short123';
      const longPassword = 'thisIsAVeryLongPasswordWithManyCharacters123!@#';
      
      const shortHash = await hashPassword(shortPassword);
      const longHash = await hashPassword(longPassword);
      
      expect(shortHash).toBeDefined();
      expect(longHash).toBeDefined();
      expect(shortHash).not.toBe(longHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });

    it('should handle case-sensitive comparison', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const isMatchLower = await comparePassword('testpassword123', hash);
      expect(isMatchLower).toBe(false);
    });

    it('should work with special characters', async () => {
      const password = 'P@ssw0rd!#$%';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });
  });
});
