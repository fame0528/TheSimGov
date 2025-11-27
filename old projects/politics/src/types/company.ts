/**
 * @file src/types/company.ts
 * @description TypeScript type definitions for company-related data structures
 * @created 2025-11-16
 *
 * OVERVIEW:
 * Centralized type definitions for company creation, funding, and operations.
 * Provides type safety for API payloads and component props.
 *
 * USAGE:
 * ```typescript
 * import type { FundingPayload, CompanyCreationPayload } from '@/types/company';
 *
 * const funding: FundingPayload = {
 *   type: 'Loan',
 *   amount: 50000,
 *   interestRate: 5,
 *   termMonths: 24,
 * };
 * ```
 */

/**
 * Funding type options
 */
export type FundingType = 'Loan' | 'Accelerator' | 'Angel';

/**
 * Technology path options for Technology industry
 */
export type TechPath = 'Software' | 'AI' | 'Hardware';

/**
 * Funding payload for company creation
 * Used in POST /api/companies request body
 */
export interface FundingPayload {
  /** Funding type selection */
  type: FundingType;
  
  /** Funding amount in USD */
  amount: number;
  
  /** Annual interest rate (for Loan type only) */
  interestRate?: number;
  
  /** Loan term in months (for Loan type only) */
  termMonths?: number;
}

/**
 * Company creation request payload
 * Extends base company data with optional funding for Technology industry
 */
export interface CompanyCreationPayload {
  /** Company name (3-50 characters) */
  name: string;
  
  /** Industry selection */
  industry: string;
  
  /** Optional mission statement (max 500 chars) */
  mission?: string;
  
  /** Technology path (required for Technology industry) */
  techPath?: TechPath;
  
  /** Funding details (required for Technology if shortfall exists) */
  funding?: FundingPayload;
}

/**
 * Credit score tier information
 */
export interface CreditTier {
  /** Minimum score for tier */
  min: number;
  
  /** Maximum score for tier */
  max: number;
  
  /** Maximum loan amount allowed in this tier */
  maxLoan: number;
  
  /** Tier name (Poor, Fair, Good, Very Good, Excellent) */
  name: string;
}

/**
 * Credit score response from API
 */
export interface CreditScoreResponse {
  /** User's current credit score (300-850) */
  score: number;
  
  /** Maximum loan amount allowed based on score */
  maxLoan: number;
  
  /** Credit tier name */
  tierName: string;
}

/**
 * Funding validation result
 */
export interface FundingValidationResult {
  /** Whether funding request is valid */
  valid: boolean;
  
  /** Error message if invalid */
  error?: string;
  
  /** Maximum allowed funding amount */
  allowedCap?: number;
}
