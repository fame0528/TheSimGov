/**
 * @fileoverview Enumeration Type Definitions
 * @module lib/types/enums
 * 
 * OVERVIEW:
 * Enumerated types for domain models.
 * Industry types, loan types, contract types, status values.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

/**
 * Industry types for companies
 */
export enum IndustryType {
  TECH = 'TECH',
  Technology = 'Technology',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  ENERGY = 'ENERGY',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
}

/**
 * Loan types
 */
export enum LoanType {
  BUSINESS_LOAN = 'BUSINESS_LOAN',
  LINE_OF_CREDIT = 'LINE_OF_CREDIT',
  EQUIPMENT_FINANCING = 'EQUIPMENT_FINANCING',
  VENTURE_CAPITAL = 'VENTURE_CAPITAL',
}

/**
 * Contract types
 */
export enum ContractType {
  CONSULTING = 'CONSULTING',
  DEVELOPMENT = 'DEVELOPMENT',
  MANUFACTURING = 'MANUFACTURING',
  SERVICES = 'SERVICES',
  RESEARCH = 'RESEARCH',
}

/**
 * Contract status values
 */
export enum ContractStatus {
  AVAILABLE = 'AVAILABLE',
  BIDDING = 'BIDDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Loan status values
 */
export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAID_OFF = 'PAID_OFF',
  DEFAULTED = 'DEFAULTED',
}

/**
 * Investment types
 */
export enum InvestmentType {
  STOCKS = 'STOCKS',
  BONDS = 'BONDS',
  REAL_ESTATE = 'REAL_ESTATE',
  INDEX_FUNDS = 'INDEX_FUNDS',
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: Enum ensures only valid values used
 * 2. **String Enums**: Easier debugging and serialization
 * 3. **Consistency**: Single source of truth for status values
 * 4. **Extensibility**: Easy to add new types/statuses
 * 5. **IDE Support**: Autocomplete for all valid values
 * 
 * PREVENTS:
 * - Magic strings for status values
 * - Typos in status comparisons
 * - Invalid state transitions
 */
