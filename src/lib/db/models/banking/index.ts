/**
 * @file src/lib/db/models/banking/index.ts
 * @description Banking models barrel export
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Exports all banking-related Mongoose models for the player-as-lender gameplay.
 * These models power the banking industry where players run their own bank.
 *
 * MODELS:
 * - LoanApplicant: NPC customers applying for loans
 * - BankDeposit: Customer deposits into the bank
 * - BankSettings: Bank configuration and level progression
 * - BankLoan: Loans issued by the player's bank
 *
 * USAGE:
 * import { LoanApplicant, BankDeposit, BankSettings, BankLoan } from '@/lib/db/models/banking';
 */

// Models
export { default as LoanApplicant } from './LoanApplicant';
export { default as BankDeposit } from './BankDeposit';
export { default as BankSettings } from './BankSettings';
export { default as BankLoan } from './BankLoan';

// Types and interfaces
export type { ILoanApplicant, ILoanApplicantModel } from './LoanApplicant';
export type { IBankDeposit, IBankDepositModel, IDepositTransaction } from './BankDeposit';
export type { IBankSettings, IBankSettingsModel, BankLevelUnlock, DailyStats } from './BankSettings';
export type { IBankLoan, IBankLoanModel, IBankLoanPayment } from './BankLoan';

// Enums
export { 
  LoanPurpose, 
  ApplicantStatus, 
  EmploymentType, 
  RiskTier 
} from './LoanApplicant';
export { 
  AccountType, 
  DepositStatus, 
  CustomerType 
} from './BankDeposit';
export { 
  ApprovalPolicy,
  BANK_LEVELS,
  XP_PER_LEVEL,
} from './BankSettings';
export { 
  BankLoanStatus 
} from './BankLoan';
