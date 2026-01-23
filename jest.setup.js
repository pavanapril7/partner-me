require('@testing-library/jest-dom');
require('dotenv').config();

// Polyfill for TextEncoder/TextDecoder required by Prisma
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for Request/Response required by Next.js server components
const { Request, Response, Headers } = require('node-fetch');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
