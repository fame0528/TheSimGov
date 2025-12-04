/**
 * @fileoverview Banking Components Barrel Export
 * @module components/banking
 * 
 * OVERVIEW:
 * Barrel export file for all banking-related components.
 * Provides clean import paths for the banking domain.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

// Main Dashboard
export { BankingDashboard, default as BankingDashboardDefault } from './BankingDashboard';

// Individual Components
export { default as LoanApplicationForm } from './LoanApplicationForm';
export { default as PaymentInterface } from './PaymentInterface';
export { default as InvestmentDashboard } from './InvestmentDashboard';
export { default as BankSelector } from './BankSelector';
export { default as CreditScoreMonitor } from './CreditScoreMonitor';
export { default as PlayerBankCreator } from './PlayerBankCreator';

/**
 * USAGE:
 * 
 * ```tsx
 * // Import dashboard
 * import { BankingDashboard } from '@/components/banking';
 * 
 * // Import individual components
 * import { LoanApplicationForm, CreditScoreMonitor } from '@/components/banking';
 * ```
 */
