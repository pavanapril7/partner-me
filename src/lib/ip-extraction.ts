import { NextRequest } from 'next/server';

/**
 * IP Extraction Utility
 * 
 * Provides utilities for extracting client IP addresses from Next.js requests.
 * Handles various proxy configurations and IPv6 addresses.
 * 
 * Requirements: 7.1
 */

/**
 * Extract IP address from Next.js request
 * 
 * Handles various proxy headers and fallbacks:
 * 1. X-Forwarded-For (most common proxy header, used by Vercel, Cloudflare, etc.)
 * 2. X-Real-IP (alternative proxy header, used by Nginx)
 * 3. Fallback to localhost in development
 * 
 * The function prioritizes X-Forwarded-For as it's the most common header
 * used by proxies and load balancers. When multiple IPs are present in
 * X-Forwarded-For, the first IP represents the original client.
 * 
 * IPv6 addresses are normalized to IPv4 when possible (e.g., IPv4-mapped IPv6).
 * 
 * @param request - Next.js request object
 * @returns IP address or null if unable to extract
 * 
 * @example
 * ```typescript
 * const ip = extractIpAddress(request);
 * if (!ip) {
 *   return NextResponse.json({ error: 'Unable to determine IP' }, { status: 400 });
 * }
 * ```
 */
export function extractIpAddress(request: NextRequest): string | null {
  // Check X-Forwarded-For header (used by most proxies/load balancers)
  // Format: "client, proxy1, proxy2"
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
    // The first IP is the original client IP
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) {
      return normalizeIpAddress(ips[0]);
    }
  }

  // Check X-Real-IP header (alternative proxy header)
  // Used by Nginx and some other reverse proxies
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return normalizeIpAddress(realIp);
  }

  // Fallback: In development or when no proxy headers are present,
  // we can't reliably get the IP address from Next.js request object
  // in the Edge Runtime. Return localhost for development.
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  // Unable to determine IP address
  // This should rarely happen in production with proper proxy configuration
  return null;
}

/**
 * Normalize IP address
 * 
 * Handles IPv6 addresses and removes port numbers.
 * Converts IPv4-mapped IPv6 addresses to IPv4 format.
 * 
 * IPv6 formats handled:
 * - IPv6 loopback: ::1 → 127.0.0.1
 * - IPv4-mapped IPv6: ::ffff:192.168.1.1 → 192.168.1.1
 * - IPv4-mapped loopback: ::ffff:127.0.0.1 → 127.0.0.1
 * 
 * @param ip - Raw IP address (may include port or IPv6 format)
 * @returns Normalized IP address
 * 
 * @example
 * ```typescript
 * normalizeIpAddress('::ffff:192.168.1.1') // Returns '192.168.1.1'
 * normalizeIpAddress('::1') // Returns '127.0.0.1'
 * normalizeIpAddress('192.168.1.1:8080') // Returns '192.168.1.1'
 * ```
 */
export function normalizeIpAddress(ip: string): string {
  // Remove leading/trailing whitespace
  ip = ip.trim();

  // Handle IPv6 loopback (::1)
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // Handle IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
  if (ip.toLowerCase().startsWith('::ffff:')) {
    const ipv4 = ip.substring(7);
    // Check if it's the loopback address
    if (ipv4.startsWith('127.0.0.1')) {
      return '127.0.0.1';
    }
    return ipv4;
  }

  // Remove port number if present (for IPv4 addresses like 192.168.1.1:8080)
  // Be careful with IPv6 addresses which use colons for address segments
  // Only remove port if it looks like IPv4:port format
  if (ip.includes(':') && !ip.includes('::') && ip.split(':').length === 2) {
    const parts = ip.split(':');
    // Check if the second part is a number (port)
    if (/^\d+$/.test(parts[1])) {
      return parts[0];
    }
  }

  // Return as-is for pure IPv6 addresses or already normalized IPv4
  return ip;
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 * 
 * @param ip - String to validate
 * @returns true if valid IP address, false otherwise
 * 
 * @example
 * ```typescript
 * isValidIpAddress('192.168.1.1') // Returns true
 * isValidIpAddress('2001:0db8:85a3::8a2e:0370:7334') // Returns true
 * isValidIpAddress('invalid') // Returns false
 * ```
 */
export function isValidIpAddress(ip: string): boolean {
  // IPv4 regex pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 regex pattern (simplified - matches most common formats)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Pattern.test(ip)) {
    // Validate IPv4 octets are in range 0-255
    const octets = ip.split('.');
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  if (ipv6Pattern.test(ip)) {
    return true;
  }

  // Check for IPv4-mapped IPv6
  if (ip.toLowerCase().startsWith('::ffff:')) {
    const ipv4Part = ip.substring(7);
    return isValidIpAddress(ipv4Part);
  }

  // Check for IPv6 loopback
  if (ip === '::1') {
    return true;
  }

  return false;
}
