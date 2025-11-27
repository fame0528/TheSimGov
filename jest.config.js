/**
 * Jest Configuration
 * 
 * @overview
 * Configures Jest for testing politics utilities with TypeScript support.
 * Includes coverage reporting and proper module resolution.
 * 
 * @created 2025-11-25
 * @updated 2025-11-25
 */

module.exports = {
  // Use jsdom environment for React component tests
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
  ],
  
  // Load environment variables before tests run
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript',
      ],
    }],
  },
  
  // Allow transforming specific ESM modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/politics/**/*.{ts,tsx}',
    '!src/politics/**/*.d.ts',
    '!src/politics/**/index.ts',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
};
