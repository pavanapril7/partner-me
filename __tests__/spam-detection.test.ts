/**
 * Unit tests for spam detection service
 */

import { detectSpamPatterns } from '../src/lib/spam-detection';

describe('Spam Detection Service', () => {
  describe('detectSpamPatterns', () => {
    it('should not flag clean submissions', () => {
      const result = detectSpamPatterns({
        title: 'Mobile App for Local Businesses',
        description: 'A mobile application that helps local businesses manage their inventory and customer relationships. The app will include features for tracking sales, managing stock, and sending notifications to customers.',
        contactEmail: 'john.doe@example.com',
        contactPhone: '+1-555-123-4567',
      });

      expect(result.isSpam).toBe(false);
      expect(result.shouldFlag).toBe(false);
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.reasons).toHaveLength(0);
    });

    it('should detect excessive capitalization', () => {
      const result = detectSpamPatterns({
        title: 'AMAZING OPPORTUNITY!!!',
        description: 'THIS IS THE BEST BUSINESS IDEA EVER! YOU WILL MAKE SO MUCH MONEY!',
        contactEmail: 'test@example.com',
      });

      expect(result.reasons).toContain('Excessive capitalization detected');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect repeated characters', () => {
      const result = detectSpamPatterns({
        title: 'Great Ideaaaaa!!!!!',
        description: 'This is an amazing business opportunity with huge profits!!!!!',
        contactEmail: 'test@example.com',
      });

      expect(result.reasons).toContain('Repeated characters detected');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect spam keywords', () => {
      const result = detectSpamPatterns({
        title: 'Make Money Fast - Guaranteed!',
        description: 'Work from home and earn extra cash with no experience required. Risk free opportunity to double your income!',
        contactEmail: 'test@example.com',
      });

      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining('spam keywords')
        ])
      );
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect suspicious URLs', () => {
      const result = detectSpamPatterns({
        title: 'Check this out',
        description: 'Visit bit.ly/abc123 and tinyurl.com/xyz and goo.gl/test for more info',
        contactEmail: 'test@example.com',
      });

      expect(result.reasons).toContain('Multiple suspicious URLs detected (3)');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect invalid contact patterns - fake email', () => {
      const result = detectSpamPatterns({
        title: 'Business Idea',
        description: 'A legitimate description',
        contactEmail: 'test@test.com',
      });

      expect(result.reasons).toContain('Invalid contact information patterns detected');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect invalid contact patterns - repeated digits phone', () => {
      const result = detectSpamPatterns({
        title: 'Business Idea',
        description: 'A legitimate description',
        contactPhone: '1111111111',
      });

      expect(result.reasons).toContain('Invalid contact information patterns detected');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect invalid contact patterns - sequential digits phone', () => {
      const result = detectSpamPatterns({
        title: 'Business Idea',
        description: 'A legitimate description',
        contactPhone: '1234567890',
      });

      expect(result.reasons).toContain('Invalid contact information patterns detected');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should flag submissions with high confidence score', () => {
      const result = detectSpamPatterns({
        title: 'MAKE MONEY FAST!!!',
        description: 'GUARANTEED INCOME! Work from home with no experience. Click here: bit.ly/test tinyurl.com/abc goo.gl/xyz!!!!!',
        contactEmail: 'fake@fake.com',
        contactPhone: '1111111111',
      });

      expect(result.isSpam).toBe(true);
      expect(result.shouldFlag).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should return confidence score between 0 and 1', () => {
      const result = detectSpamPatterns({
        title: 'Test',
        description: 'Test description',
        contactEmail: 'test@example.com',
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle missing optional fields', () => {
      const result = detectSpamPatterns({
        title: 'Business Idea',
        description: 'A legitimate business idea description',
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty strings', () => {
      const result = detectSpamPatterns({
        title: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBe(0);
      expect(result.reasons).toHaveLength(0);
    });
  });
});
