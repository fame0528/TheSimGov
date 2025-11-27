/**
 * @file jest.setup.js
 * @description Jest setup file for testing environment configuration
 * @created 2025-11-13
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
