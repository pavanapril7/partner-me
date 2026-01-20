import { generateOTP, storeOTP, validateOTP, invalidateOTP, generateAndStoreOTP } from '../src/lib/otp';
import { prisma } from '../src/lib/prisma';

describe('OTP Service', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        mobileNumber: '+1234567890',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.oTP.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up OTPs after each test
    await prisma.oTP.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit numeric code', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateOTP());
      }
      // With 100 attempts, we should get at least some different codes
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('storeOTP', () => {
    it('should store OTP with correct expiration time', async () => {
      const code = '123456';
      const beforeStore = new Date();
      
      const otp = await storeOTP(testUserId, code, 5);
      
      const afterStore = new Date();
      const expectedExpiry = new Date(beforeStore);
      expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 5);

      expect(otp.code).toBe(code);
      expect(otp.userId).toBe(testUserId);
      expect(otp.isUsed).toBe(false);
      expect(otp.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
      expect(otp.expiresAt.getTime()).toBeLessThanOrEqual(new Date(afterStore.getTime() + 5 * 60 * 1000 + 1000).getTime());
    });

    it('should invalidate previous unexpired OTPs when storing new one', async () => {
      // Store first OTP
      const otp1 = await storeOTP(testUserId, '111111', 5);
      expect(otp1.isUsed).toBe(false);

      // Store second OTP
      const otp2 = await storeOTP(testUserId, '222222', 5);
      expect(otp2.isUsed).toBe(false);

      // Check that first OTP is now marked as used
      const updatedOtp1 = await prisma.oTP.findUnique({
        where: { id: otp1.id },
      });
      expect(updatedOtp1?.isUsed).toBe(true);
    });
  });

  describe('validateOTP', () => {
    it('should validate correct unexpired OTP', async () => {
      const code = '123456';
      await storeOTP(testUserId, code, 5);

      const result = await validateOTP(testUserId, code);
      expect(result.isValid).toBe(true);
      expect(result.otpId).toBeDefined();
    });

    it('should reject incorrect OTP code', async () => {
      await storeOTP(testUserId, '123456', 5);

      const result = await validateOTP(testUserId, '999999');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid OTP code');
    });

    it('should reject expired OTP', async () => {
      const code = '123456';
      // Create OTP with past expiration
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 1);
      
      await prisma.oTP.create({
        data: {
          userId: testUserId,
          code,
          expiresAt: expiredDate,
          isUsed: false,
        },
      });

      const result = await validateOTP(testUserId, code);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('OTP has expired');
    });

    it('should reject already used OTP', async () => {
      const code = '123456';
      const otp = await storeOTP(testUserId, code, 5);
      
      // Mark as used
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { isUsed: true },
      });

      const result = await validateOTP(testUserId, code);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid OTP code');
    });
  });

  describe('invalidateOTP', () => {
    it('should mark OTP as used', async () => {
      const code = '123456';
      const otp = await storeOTP(testUserId, code, 5);
      expect(otp.isUsed).toBe(false);

      await invalidateOTP(otp.id);

      const updatedOtp = await prisma.oTP.findUnique({
        where: { id: otp.id },
      });
      expect(updatedOtp?.isUsed).toBe(true);
    });
  });

  describe('generateAndStoreOTP', () => {
    it('should generate and store OTP in one call', async () => {
      const code = await generateAndStoreOTP(testUserId, 5);
      
      expect(code).toMatch(/^\d{6}$/);
      
      // Verify it was stored
      const result = await validateOTP(testUserId, code);
      expect(result.isValid).toBe(true);
    });
  });
});
