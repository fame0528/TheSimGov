/**
 * @file jest.config.js
 * @description Jest configuration for unit and integration testing
 * @created 2025-11-13
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // MongoDB connection utilities (dual locations)
    '^@/lib/db/mongoose$': '<rootDir>/src/lib/db/mongoose.ts',
    '^@/lib/db/mongodb$': '<rootDir>/lib/db/mongodb.ts',
    // Root lib constants (specific file that exists at root)
    '^@/lib/constants/funding$': '<rootDir>/lib/constants/funding',
    // General path mappings (src/lib for most things)
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/stores/(.*)$': '<rootDir>/stores/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    // Fallback for @/ paths
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    // Transform ES modules from MongoDB and related packages
    // Allows Jest to properly parse ES module syntax in node_modules
    // Pattern: Transform everything EXCEPT these packages (negative lookahead)
     'node_modules/(?!(bson|mongodb|@mongodb-js)/)',
  ],
  // Support transforming ESM .mjs modules like `bson` which may be required by mongodb
  // `.mjs` files are always treated as ESM by Node/Jest and should not
  // be listed here (Jest will validate and reject '.mjs' if present).
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// Optional global setup/teardown for in-memory MongoDB
const globalConfig = {
  ...customJestConfig,
  globalSetup: '<rootDir>/test/utils/jest-global-setup.ts',
  globalTeardown: '<rootDir>/test/utils/jest-global-teardown.ts',
};

module.exports = createJestConfig(globalConfig);
