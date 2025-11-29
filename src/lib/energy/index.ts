/**
 * @fileoverview Energy Domain Utilities Export Index
 * @module lib/energy
 * 
 * OVERVIEW:
 * Central export point for all energy domain calculation utilities.
 * Provides clean import paths for auth, errors, and domain-specific
 * calculation modules (wind, power, grid, transmission, storage).
 * 
 * USAGE:
 * import { verifyOwnership, createError, calculatePowerCurve } from '@/lib/energy';
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1 - Batch 2 DRY Utilities
 */

// Authentication & Authorization
export * from './auth';

// Error Handling
export * from './errors';

// Domain Calculators
export * from './wind';
export * from './power';
export * from './grid';
export * from './transmission';
export * from './storage';
