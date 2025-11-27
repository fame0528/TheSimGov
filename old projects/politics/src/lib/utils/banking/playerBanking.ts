/**
 * @file src/lib/utils/banking/playerBanking.ts
 * @description Player-owned banking system (Level 3+ feature)
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Enables Level 3+ companies to obtain banking licenses and issue loans to other companies.
 * Implements Basel III capital adequacy ratio (CAR ≥8%), risk management, and lending operations.
 * Player banks earn interest income and face default risk from borrowers.
 * 
 * FEATURES:
 * - Banking license: $500k one-time cost (Level 3+ requirement)
 * - Initial capital requirement: Minimum $5M to start lending
 * - Basel III CAR: Must maintain ≥8% capital adequacy ratio
 * - Lending operations: Issue loans with custom rates and terms
 * - Risk management: Borrower credit scoring, default protection
 * - Interest income: Earn monthly interest on active loans
 * - Regulatory compliance: CAR monitoring, capital buffer requirements
 * 
 * USAGE:
 * ```typescript
 * import { canCreateBank, validateLending, calculateCAR } from '@/lib/utils/banking/playerBanking';
 * 
 * // Check bank creation eligibility
 * const eligible = canCreateBank(company);
 * 
 * // Validate loan issuance
 * const validation = validateLending(bank, borrower, loanAmount);
 * 
 * // Calculate capital adequacy ratio
 * const car = calculateCAR(bank);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Basel III CAR formula: (Tier 1 Capital) / (Risk-Weighted Assets) ≥ 8%
 * - Tier 1 Capital: Bank's equity (cash allocated to banking operations)
 * - Risk-Weighted Assets: Total loans outstanding × risk weights (0.5-1.5)
 * - Minimum capital buffer: 2.5% above 8% requirement (10.5% total recommended)
 * - License cost: $500,000 one-time fee
 * - Minimum lending capital: $5,000,000
 * - Default coverage: Player banks bear loss on defaulted loans
 * - Interest income: Earned monthly, credited to bank capital
 * - Regulatory penalties: <8% CAR = no new lending until compliant
 */

import type { ICompany } from '@/lib/db/models/Company';
import type { ILoan } from '@/lib/db/models/Loan';
import type { CreditScoreResult } from '@/lib/utils/finance/creditScore';

/**
 * Banking license cost ($500k)
 */
export const BANKING_LICENSE_COST = 500000;

/**
 * Minimum capital to start lending ($5M)
 */
export const MINIMUM_LENDING_CAPITAL = 5000000;

/**
 * Basel III minimum CAR (8%)
 */
export const MINIMUM_CAR = 0.08;

/**
 * Recommended CAR with buffer (10.5%)
 */
export const RECOMMENDED_CAR = 0.105;

/**
 * Risk weights by borrower credit score
 */
const RISK_WEIGHTS: Record<string, number> = {
  Exceptional: 0.5, // 800-850: Low risk
  VeryGood: 0.7,    // 740-799: Below-average risk
  Good: 1.0,        // 670-739: Standard risk
  Fair: 1.3,        // 580-669: Above-average risk
  Poor: 1.5,        // 300-579: High risk
};

/**
 * Bank creation eligibility result
 */
export interface BankEligibility {
  eligible: boolean;
  reason?: string;
  requirements?: {
    level: { required: number; current: number; met: boolean };
    licenseFee: { required: number; current: number; met: boolean };
    capital: { required: number; current: number; met: boolean };
  };
}

/**
 * Lending validation result
 */
export interface LendingValidation {
  canLend: boolean;
  reason?: string;
  riskAssessment?: {
    borrowerScore: number;
    borrowerRating: string;
    riskWeight: number;
    recommendedRate: number;
    maxLoanAmount: number;
    requiredCollateral: number;
  };
  carImpact?: {
    currentCAR: number;
    projectedCAR: number;
    meetsMinimum: boolean;
  };
}

/**
 * Capital adequacy ratio result
 */
export interface CARResult {
  car: number;
  tier1Capital: number;
  riskWeightedAssets: number;
  meetsMinimum: boolean;
  buffer: number;
  status: 'healthy' | 'adequate' | 'undercapitalized';
  recommendations: string[];
}

/**
 * Player bank statistics
 */
export interface BankStatistics {
  totalLoansIssued: number;
  totalLoanValue: number;
  activeLoans: number;
  activeLoanValue: number;
  totalInterestEarned: number;
  defaultedLoans: number;
  defaultLosses: number;
  netProfitLoss: number;
  averageInterestRate: number;
  portfolioRisk: number;
}

/**
 * Check if company can create player bank
 * 
 * @param company - Company document
 * @returns Eligibility result
 * 
 * @example
 * const eligible = canCreateBank(company);
 * // Returns: { eligible: true, requirements: { ... } }
 */
export function canCreateBank(company: ICompany): BankEligibility {
  // Level 3+ requirement
  if (company.level < 3) {
    return {
      eligible: false,
      reason: 'Banking license requires Level 3 or higher',
      requirements: {
        level: { required: 3, current: company.level, met: false },
        licenseFee: { required: BANKING_LICENSE_COST, current: company.cash, met: false },
        capital: { required: MINIMUM_LENDING_CAPITAL, current: 0, met: false },
      },
    };
  }

  // Already has banking license
  if (company.playerBank?.licensed) {
    return {
      eligible: false,
      reason: 'Company already has a banking license',
    };
  }

  // Check funds for license fee + minimum capital
  const totalRequired = BANKING_LICENSE_COST + MINIMUM_LENDING_CAPITAL;

  if (company.cash < totalRequired) {
    return {
      eligible: false,
      reason: `Insufficient funds (need $${totalRequired.toLocaleString()}: $${BANKING_LICENSE_COST.toLocaleString()} license + $${MINIMUM_LENDING_CAPITAL.toLocaleString()} capital)`,
      requirements: {
        level: { required: 3, current: company.level, met: true },
        licenseFee: { required: BANKING_LICENSE_COST, current: company.cash, met: false },
        capital: { required: MINIMUM_LENDING_CAPITAL, current: 0, met: false },
      },
    };
  }

  return {
    eligible: true,
    requirements: {
      level: { required: 3, current: company.level, met: true },
      licenseFee: { required: BANKING_LICENSE_COST, current: company.cash, met: true },
      capital: { required: MINIMUM_LENDING_CAPITAL, current: company.cash - BANKING_LICENSE_COST, met: true },
    },
  };
}

/**
 * Calculate capital adequacy ratio (CAR)
 * 
 * @param bank - Player bank company
 * @param activeLoans - Array of active loans issued by bank
 * @returns CAR result
 * 
 * @example
 * const car = calculateCAR(bank, loans);
 * // Returns: { car: 0.12, tier1Capital: 6000000, riskWeightedAssets: 50000000, ... }
 */
export function calculateCAR(bank: ICompany, activeLoans: ILoan[] = []): CARResult {
  const tier1Capital = bank.playerBank?.capital || 0;

  // Calculate risk-weighted assets
  let riskWeightedAssets = 0;

  for (const loan of activeLoans) {
    // Determine risk weight based on loan status and collateral
    let riskWeight = 1.0; // Default standard risk

    if (loan.status === 'Defaulted') {
      riskWeight = 1.5; // High risk for defaulted loans
    } else if (loan.collateralType === 'RealEstate') {
      riskWeight = 0.7; // Lower risk with real estate collateral
    } else if (loan.collateralType === 'Equipment') {
      riskWeight = 0.9; // Moderate risk with equipment collateral
    } else if (loan.collateralType === 'None') {
      riskWeight = 1.3; // Higher risk unsecured
    }

    riskWeightedAssets += loan.balance * riskWeight;
  }

  // Avoid division by zero
  const car = riskWeightedAssets > 0 ? tier1Capital / riskWeightedAssets : 1.0;

  const meetsMinimum = car >= MINIMUM_CAR;
  const buffer = car - MINIMUM_CAR;

  let status: 'healthy' | 'adequate' | 'undercapitalized';
  if (car >= RECOMMENDED_CAR) {
    status = 'healthy';
  } else if (car >= MINIMUM_CAR) {
    status = 'adequate';
  } else {
    status = 'undercapitalized';
  }

  const recommendations: string[] = [];

  if (status === 'undercapitalized') {
    recommendations.push('URGENT: Increase capital or reduce lending to meet 8% CAR minimum');
    recommendations.push('Cannot issue new loans until CAR ≥8%');
  } else if (status === 'adequate') {
    recommendations.push('CAR meets minimum but is close to regulatory limit');
    recommendations.push('Consider raising capital to build buffer above 10.5%');
  } else {
    recommendations.push('CAR is healthy with adequate capital buffer');
  }

  return {
    car,
    tier1Capital,
    riskWeightedAssets,
    meetsMinimum,
    buffer,
    status,
    recommendations,
  };
}

/**
 * Validate player bank lending operation
 * 
 * @param bank - Player bank company
 * @param borrower - Borrower company
 * @param loanAmount - Requested loan amount
 * @param borrowerCredit - Borrower credit score result
 * @param activeLoans - Bank's current active loans
 * @returns Lending validation result
 * 
 * @example
 * const validation = validateLending(bank, borrower, 500000, creditResult, loans);
 */
export function validateLending(
  bank: ICompany,
  borrower: ICompany,
  loanAmount: number,
  borrowerCredit: CreditScoreResult,
  activeLoans: ILoan[] = []
): LendingValidation {
  // Bank must have license
  if (!bank.playerBank?.licensed) {
    return {
      canLend: false,
      reason: 'Bank does not have a banking license',
    };
  }

  // Check if same company (can't lend to self)
  if (String(bank._id) === String(borrower._id)) {
    return {
      canLend: false,
      reason: 'Cannot lend to own company',
    };
  }

  // Check if bank has sufficient capital
  const bankCapital = bank.playerBank?.capital || 0;

  if (loanAmount > bankCapital) {
    return {
      canLend: false,
      reason: `Insufficient bank capital (have $${bankCapital.toLocaleString()}, need $${loanAmount.toLocaleString()})`,
    };
  }

  // Calculate projected CAR after loan
  const projectedLoans = [...activeLoans];
  const mockLoan: Partial<ILoan> = {
    balance: loanAmount,
    status: 'Active',
    collateralType: 'None', // Assume worst case for validation
  };
  projectedLoans.push(mockLoan as ILoan);

  const currentCAR = calculateCAR(bank, activeLoans);
  const projectedCAR = calculateCAR(bank, projectedLoans);

  if (projectedCAR.car < MINIMUM_CAR) {
    return {
      canLend: false,
      reason: `Lending would violate CAR requirement (projected CAR: ${(projectedCAR.car * 100).toFixed(2)}%, minimum: 8%)`,
      carImpact: {
        currentCAR: currentCAR.car,
        projectedCAR: projectedCAR.car,
        meetsMinimum: false,
      },
    };
  }

  // Risk assessment
  const riskWeight = RISK_WEIGHTS[borrowerCredit.rating] || 1.0;
  const recommendedRate = 8.0 + (riskWeight - 0.5) * 2; // Base 8% + risk premium
  const maxLoanAmount = Math.floor(bankCapital * 0.2); // Max 20% of capital per loan
  const requiredCollateral = borrowerCredit.score < 670 ? loanAmount * 1.3 : 0;

  return {
    canLend: true,
    riskAssessment: {
      borrowerScore: borrowerCredit.score,
      borrowerRating: borrowerCredit.rating,
      riskWeight,
      recommendedRate,
      maxLoanAmount,
      requiredCollateral,
    },
    carImpact: {
      currentCAR: currentCAR.car,
      projectedCAR: projectedCAR.car,
      meetsMinimum: true,
    },
  };
}

/**
 * Calculate recommended loan rate
 * 
 * @param borrowerCredit - Borrower credit score
 * @param loanAmount - Loan amount
 * @param termMonths - Loan term in months
 * @returns Recommended interest rate
 */
export function calculateRecommendedRate(
  borrowerCredit: CreditScoreResult,
  loanAmount: number,
  termMonths: number
): number {
  const baseRate = 6.0; // Player bank base rate

  // Credit risk adjustment
  const riskWeight = RISK_WEIGHTS[borrowerCredit.rating] || 1.0;
  const creditAdjustment = (riskWeight - 0.5) * 3;

  // Term adjustment (longer = higher rate)
  let termAdjustment = 0;
  if (termMonths > 120) termAdjustment = 1.0;
  else if (termMonths > 60) termAdjustment = 0.5;

  // Amount adjustment (larger loans = slight discount)
  let amountAdjustment = 0;
  if (loanAmount >= 1000000) amountAdjustment = -0.25;
  else if (loanAmount >= 500000) amountAdjustment = -0.15;

  const finalRate = baseRate + creditAdjustment + termAdjustment + amountAdjustment;

  return Math.max(4.0, Math.min(20.0, finalRate)); // Clamp 4-20%
}

/**
 * Calculate bank statistics
 * 
 * @param bank - Player bank company
 * @param allLoans - All loans issued by bank
 * @returns Bank statistics
 */
export function calculateBankStatistics(
  _bank: ICompany,
  allLoans: ILoan[]
): BankStatistics {
  const activeLoans = allLoans.filter((l) => l.status === 'Active');
  const defaultedLoans = allLoans.filter((l) => l.status === 'Defaulted');

  const totalLoanValue = allLoans.reduce((sum, l) => sum + l.principal, 0);
  const activeLoanValue = activeLoans.reduce((sum, l) => sum + l.balance, 0);

  const totalInterestEarned = allLoans.reduce((sum, l) => sum + l.totalInterestPaid, 0);
  const defaultLosses = defaultedLoans.reduce((sum, l) => sum + l.balance, 0);

  const netProfitLoss = totalInterestEarned - defaultLosses;

  const avgRate =
    activeLoans.length > 0
      ? activeLoans.reduce((sum, l) => sum + l.interestRate, 0) / activeLoans.length
      : 0;

  const portfolioRisk =
    activeLoanValue > 0 ? (defaultLosses / (defaultLosses + activeLoanValue)) * 100 : 0;

  return {
    totalLoansIssued: allLoans.length,
    totalLoanValue,
    activeLoans: activeLoans.length,
    activeLoanValue,
    totalInterestEarned,
    defaultedLoans: defaultedLoans.length,
    defaultLosses,
    netProfitLoss,
    averageInterestRate: avgRate,
    portfolioRisk,
  };
}

/**
 * Format CAR for display
 * 
 * @param car - CAR value (decimal)
 * @returns Formatted CAR string
 */
export function formatCAR(car: number): string {
  return `${(car * 100).toFixed(2)}%`;
}

/**
 * Get CAR status color
 * 
 * @param car - CAR value (decimal)
 * @returns Color name for UI
 */
export function getCARStatusColor(car: number): 'green' | 'yellow' | 'red' {
  if (car >= RECOMMENDED_CAR) return 'green';
  if (car >= MINIMUM_CAR) return 'yellow';
  return 'red';
}
