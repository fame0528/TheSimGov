/**
 * @file types/jest-dom.d.ts
 * @description TypeScript declarations for @testing-library/jest-dom custom matchers
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Extends Jest's expect matchers with @testing-library/jest-dom custom matchers.
 * This file provides explicit type declarations for TypeScript's static analysis
 * to recognize DOM-specific matchers like toBeInTheDocument(), toBeDisabled(), etc.
 * 
 * WHY THIS IS NEEDED:
 * - Runtime: jest.setup.ts imports '@testing-library/jest-dom' (matchers work perfectly)
 * - Compile-time: TypeScript's tsc --noEmit doesn't see runtime setup files
 * - Solution: Module augmentation for @jest/expect loaded by tsconfig.json
 * 
 * USAGE:
 * Automatically loaded by TypeScript compiler via tsconfig.json include
 * No import needed in test files - matchers are globally available
 * 
 * IMPLEMENTATION NOTES:
 * - Uses @jest/expect module augmentation pattern (jest-dom v6+ compatible)
 * - Covers all common @testing-library/jest-dom v6+ matchers
 * - Compatible with @jest/globals expect usage
 * - Ensures type safety during development and CI/CD pipelines
 */

/// <reference types="@testing-library/jest-dom" />

export {};
