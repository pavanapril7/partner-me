import { NextRequest } from 'next/server';
import {
  extractIpAddress,
  normalizeIpAddress,
  isValidIpAddress,
} from '@/lib/ip-extraction';

describe('IP Extraction Utility', () => {
  describe('extractIpAddress', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract first IP from X-Forwarded-For with multiple IPs', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should extract IP from X-Real-IP header when X-Forwarded-For is not present', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.200',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('192.168.1.200');
    });

    it('should prioritize X-Forwarded-For over X-Real-IP', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '192.168.1.200',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should return localhost in development when no headers present', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Use Object.defineProperty to temporarily override NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });

      const request = new NextRequest('http://localhost:3000');

      const ip = extractIpAddress(request);
      expect(ip).toBe('127.0.0.1');

      // Restore original value
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });

    it('should return null in production when no headers present', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Use Object.defineProperty to temporarily override NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });

      const request = new NextRequest('http://localhost:3000');

      const ip = extractIpAddress(request);
      expect(ip).toBeNull();

      // Restore original value
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });

    it('should handle IPv6 addresses in X-Forwarded-For', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3::8a2e:0370:7334',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });

    it('should normalize IPv4-mapped IPv6 addresses', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '::ffff:192.168.1.100',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should normalize IPv6 loopback to IPv4 loopback', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '::1',
        },
      });

      const ip = extractIpAddress(request);
      expect(ip).toBe('127.0.0.1');
    });
  });

  describe('normalizeIpAddress', () => {
    it('should return IPv4 address as-is', () => {
      expect(normalizeIpAddress('192.168.1.100')).toBe('192.168.1.100');
    });

    it('should convert IPv6 loopback to IPv4 loopback', () => {
      expect(normalizeIpAddress('::1')).toBe('127.0.0.1');
    });

    it('should convert IPv4-mapped IPv6 to IPv4', () => {
      expect(normalizeIpAddress('::ffff:192.168.1.100')).toBe('192.168.1.100');
    });

    it('should handle IPv4-mapped IPv6 loopback', () => {
      expect(normalizeIpAddress('::ffff:127.0.0.1')).toBe('127.0.0.1');
    });

    it('should handle case-insensitive IPv4-mapped IPv6', () => {
      expect(normalizeIpAddress('::FFFF:192.168.1.100')).toBe('192.168.1.100');
    });

    it('should remove port from IPv4 address', () => {
      expect(normalizeIpAddress('192.168.1.100:8080')).toBe('192.168.1.100');
    });

    it('should not remove colons from pure IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3::8a2e:0370:7334';
      expect(normalizeIpAddress(ipv6)).toBe(ipv6);
    });

    it('should trim whitespace', () => {
      expect(normalizeIpAddress('  192.168.1.100  ')).toBe('192.168.1.100');
    });

    it('should handle empty string', () => {
      expect(normalizeIpAddress('')).toBe('');
    });
  });

  describe('isValidIpAddress', () => {
    describe('IPv4 validation', () => {
      it('should validate correct IPv4 addresses', () => {
        expect(isValidIpAddress('192.168.1.1')).toBe(true);
        expect(isValidIpAddress('10.0.0.1')).toBe(true);
        expect(isValidIpAddress('172.16.0.1')).toBe(true);
        expect(isValidIpAddress('127.0.0.1')).toBe(true);
        expect(isValidIpAddress('0.0.0.0')).toBe(true);
        expect(isValidIpAddress('255.255.255.255')).toBe(true);
      });

      it('should reject invalid IPv4 addresses', () => {
        expect(isValidIpAddress('256.1.1.1')).toBe(false);
        expect(isValidIpAddress('192.168.1')).toBe(false);
        expect(isValidIpAddress('192.168.1.1.1')).toBe(false);
        expect(isValidIpAddress('192.168.-1.1')).toBe(false);
        expect(isValidIpAddress('192.168.1.256')).toBe(false);
      });
    });

    describe('IPv6 validation', () => {
      it('should validate correct IPv6 addresses', () => {
        expect(isValidIpAddress('2001:0db8:85a3::8a2e:0370:7334')).toBe(true);
        expect(isValidIpAddress('2001:db8:85a3::8a2e:370:7334')).toBe(true);
        expect(isValidIpAddress('::1')).toBe(true);
        expect(isValidIpAddress('::')).toBe(true);
        expect(isValidIpAddress('fe80::1')).toBe(true);
      });

      it('should validate IPv4-mapped IPv6 addresses', () => {
        expect(isValidIpAddress('::ffff:192.168.1.1')).toBe(true);
        expect(isValidIpAddress('::FFFF:192.168.1.1')).toBe(true);
      });

      it('should reject invalid IPv6 addresses', () => {
        expect(isValidIpAddress('gggg::1')).toBe(false);
        expect(isValidIpAddress('::ffff:256.1.1.1')).toBe(false);
      });
    });

    describe('Invalid formats', () => {
      it('should reject non-IP strings', () => {
        expect(isValidIpAddress('not-an-ip')).toBe(false);
        expect(isValidIpAddress('localhost')).toBe(false);
        expect(isValidIpAddress('')).toBe(false);
        expect(isValidIpAddress('192.168.1.1:8080')).toBe(false);
      });
    });
  });
});
