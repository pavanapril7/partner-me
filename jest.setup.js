// Load environment variables FIRST
require('dotenv').config();

// Use a separate test database to avoid polluting production data
// This MUST happen before any Prisma Client is imported
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    '/partner-me?',
    '/partner-me-test?'
  );
  console.log('✅ Tests will use database: partner-me-test');
}

// Now load testing library
require('@testing-library/jest-dom');

// Polyfill for TextEncoder/TextDecoder required by Prisma
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for Request/Response required by Next.js server components
const { Request, Response, Headers } = require('node-fetch');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

// Add Response.json() static method if it doesn't exist
if (!Response.json) {
  Response.json = function(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    });
  };
}

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
