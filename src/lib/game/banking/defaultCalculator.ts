/**
 * @file src/lib/game/banking/defaultCalculator.ts
 * @description Default probability calculation for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Calculates the probability that a loan will default based on borrower profile.
 * Uses credit score, income, debt levels, and other risk factors.
 *
 * FEATURES:
 * - Base probability from credit score
 * - Adjustments for income, debt, employment
 * - Loan purpose risk factors
 * - Economic condition modifiers
 * - Monte Carlo simulation for portfolio risk
 *
 * GAMEPLAY:
 * - Helps players understand loan risk
 * - Used in random events to trigger defaults
 * - Powers risk-based pricing suggestions
 *
 * USAGE:
 * import { calculateDefaultProbability, shouldDefaultThisMonth } from '@/lib/game/banking/defaultCalculator';
 */

import { RiskTier, LoanPurpose, EmploymentType } from '@/lib/db/models/banking/LoanApplicant';

/**
 * Default probability calculation result
 */
export interface DefaultProbabilityResult {
  baseRate: number;           // Base rate from credit score
  adjustedRate: number;       // After all adjustments
  factors: DefaultFactor[];   // Breakdown of factors
  riskTier: RiskTier;         // Resulting risk tier
  recommendation: 'APPROVE' | 'REVIEW' | 'DENY';
}

/**
 * Individual risk factor
 */
export interface DefaultFactor {
  name: string;
  impact: number;             // Positive = increases risk, negative = decreases
  description: string;
}

/**
 * Borrower profile for calculation
 */
export interface BorrowerProfile {
  creditScore: number;
  annualIncome: number;
  monthlyDebt: number;
  employmentType: EmploymentType;
  yearsEmployed: number;
  bankruptcyHistory: boolean;
  latePaymentHistory: number;
  loanAmount: number;
  loanPurpose: LoanPurpose;
  hasCollateral: boolean;
  collateralValue?: number;
}

/**
 * Economic conditions affecting default rates
 */
export interface EconomicConditions {
  unemploymentRate: number;   // Current unemployment rate (e.g., 0.05 for 5%)
  interestRateEnvironment: 'LOW' | 'NORMAL' | 'HIGH';
  housingMarket: 'BOOM' | 'STABLE' | 'DECLINING';
  recession: boolean;
}

/**
 * Base default rates by credit score range
 */
const BASE_DEFAULT_RATES: Record<string, number> = {
  '800-850': 0.01,    // 1% - Excellent
  '750-799': 0.02,    // 2% - Very Good
  '700-749': 0.04,    // 4% - Good
  '650-699': 0.08,    // 8% - Fair
  '600-649': 0.15,    // 15% - Poor
  '550-599': 0.25,    // 25% - Very Poor
  '300-549': 0.40,    // 40% - Deep Subprime
};

/**
 * Get base default rate from credit score (simple version)
 * Use this for quick probability checks when full profile not available
 * @param creditScore - Borrower's credit score
 * @returns Base annual default probability
 */
export function getBaseDefaultRate(creditScore: number): number {
  if (creditScore >= 800) return BASE_DEFAULT_RATES['800-850'];
  if (creditScore >= 750) return BASE_DEFAULT_RATES['750-799'];
  if (creditScore >= 700) return BASE_DEFAULT_RATES['700-749'];
  if (creditScore >= 650) return BASE_DEFAULT_RATES['650-699'];
  if (creditScore >= 600) return BASE_DEFAULT_RATES['600-649'];
  if (creditScore >= 550) return BASE_DEFAULT_RATES['550-599'];
  return BASE_DEFAULT_RATES['300-549'];
}

/**
 * Determine risk tier from credit score
 */
export function determineRiskTier(creditScore: number): RiskTier {
  if (creditScore >= 750) return RiskTier.PRIME;
  if (creditScore >= 650) return RiskTier.NEAR_PRIME;
  if (creditScore >= 550) return RiskTier.SUBPRIME;
  return RiskTier.DEEP_SUBPRIME;
}

/**
 * Calculate full default probability with factor breakdown
 */
export function calculateDefaultProbability(
  profile: BorrowerProfile,
  economicConditions?: EconomicConditions
): DefaultProbabilityResult {
  const factors: DefaultFactor[] = [];
  let probability = getBaseDefaultRate(profile.creditScore);
  
  // Record base rate
  factors.push({
    name: 'Credit Score',
    impact: 0, // Base, no adjustment
    description: `Credit score of ${profile.creditScore}`,
  });
  
  // Debt-to-Income Ratio
  const monthlyIncome = profile.annualIncome / 12;
  const proposedPayment = profile.loanAmount / 36; // Rough estimate
  const totalDebtPayment = profile.monthlyDebt + proposedPayment;
  const dti = monthlyIncome > 0 ? totalDebtPayment / monthlyIncome : 1;
  
  if (dti > 0.50) {
    const impact = 0.15;
    probability += impact;
    factors.push({
      name: 'High DTI Ratio',
      impact,
      description: `DTI of ${(dti * 100).toFixed(1)}% is very high`,
    });
  } else if (dti > 0.43) {
    const impact = 0.08;
    probability += impact;
    factors.push({
      name: 'Elevated DTI Ratio',
      impact,
      description: `DTI of ${(dti * 100).toFixed(1)}% is above preferred`,
    });
  } else if (dti < 0.28) {
    const impact = -0.02;
    probability += impact;
    factors.push({
      name: 'Low DTI Ratio',
      impact,
      description: `DTI of ${(dti * 100).toFixed(1)}% is healthy`,
    });
  }
  
  // Employment stability
  if (profile.employmentType === EmploymentType.UNEMPLOYED) {
    const impact = 0.25;
    probability += impact;
    factors.push({
      name: 'Unemployment',
      impact,
      description: 'Currently unemployed',
    });
  } else if (profile.employmentType === EmploymentType.BUSINESS_OWNER && profile.yearsEmployed >= 2) {
    const impact = -0.03;
    probability += impact;
    factors.push({
      name: 'Established Business Owner',
      impact,
      description: 'Stable self-employment',
    });
  }
  
  if (profile.yearsEmployed < 1 && profile.employmentType !== EmploymentType.UNEMPLOYED) {
    const impact = 0.05;
    probability += impact;
    factors.push({
      name: 'Short Employment',
      impact,
      description: 'Less than 1 year at current job',
    });
  } else if (profile.yearsEmployed >= 5) {
    const impact = -0.02;
    probability += impact;
    factors.push({
      name: 'Long Employment',
      impact,
      description: `${profile.yearsEmployed} years at current job`,
    });
  }
  
  // Bankruptcy history
  if (profile.bankruptcyHistory) {
    const impact = 0.20;
    probability += impact;
    factors.push({
      name: 'Bankruptcy History',
      impact,
      description: 'Previous bankruptcy on record',
    });
  }
  
  // Late payment history
  if (profile.latePaymentHistory > 5) {
    const impact = 0.12;
    probability += impact;
    factors.push({
      name: 'Many Late Payments',
      impact,
      description: `${profile.latePaymentHistory} late payments in history`,
    });
  } else if (profile.latePaymentHistory > 2) {
    const impact = 0.05;
    probability += impact;
    factors.push({
      name: 'Some Late Payments',
      impact,
      description: `${profile.latePaymentHistory} late payments in history`,
    });
  } else if (profile.latePaymentHistory === 0) {
    const impact = -0.02;
    probability += impact;
    factors.push({
      name: 'Perfect Payment History',
      impact,
      description: 'No late payments on record',
    });
  }
  
  // Loan purpose risk
  const purposeRisks: Record<LoanPurpose, number> = {
    [LoanPurpose.HOME_MORTGAGE]: -0.03, // Secured, lower risk
    [LoanPurpose.AUTO_LOAN]: -0.02,     // Secured, lower risk
    [LoanPurpose.BUSINESS_EXPANSION]: 0.05,
    [LoanPurpose.STARTUP]: 0.10,        // High failure rate
    [LoanPurpose.DEBT_CONSOLIDATION]: 0.03,
    [LoanPurpose.MEDICAL_EMERGENCY]: 0.02,
    [LoanPurpose.EDUCATION]: -0.01,
    [LoanPurpose.PERSONAL_EXPENSE]: 0.04,
  };
  
  const purposeImpact = purposeRisks[profile.loanPurpose] || 0;
  if (purposeImpact !== 0) {
    probability += purposeImpact;
    factors.push({
      name: 'Loan Purpose',
      impact: purposeImpact,
      description: `${profile.loanPurpose.replace(/_/g, ' ').toLowerCase()}`,
    });
  }
  
  // Collateral
  if (profile.hasCollateral && profile.collateralValue) {
    const ltv = profile.loanAmount / profile.collateralValue;
    if (ltv <= 0.8) {
      const impact = -0.05;
      probability += impact;
      factors.push({
        name: 'Strong Collateral',
        impact,
        description: `LTV of ${(ltv * 100).toFixed(0)}%`,
      });
    } else if (ltv <= 1.0) {
      const impact = -0.02;
      probability += impact;
      factors.push({
        name: 'Adequate Collateral',
        impact,
        description: `LTV of ${(ltv * 100).toFixed(0)}%`,
      });
    }
  }
  
  // Loan size relative to income
  const loanToIncome = profile.loanAmount / profile.annualIncome;
  if (loanToIncome > 5) {
    const impact = 0.10;
    probability += impact;
    factors.push({
      name: 'High Loan-to-Income',
      impact,
      description: `Loan is ${loanToIncome.toFixed(1)}x annual income`,
    });
  } else if (loanToIncome > 3) {
    const impact = 0.05;
    probability += impact;
    factors.push({
      name: 'Elevated Loan-to-Income',
      impact,
      description: `Loan is ${loanToIncome.toFixed(1)}x annual income`,
    });
  }
  
  // Economic conditions (if provided)
  if (economicConditions) {
    if (economicConditions.recession) {
      const impact = 0.15;
      probability += impact;
      factors.push({
        name: 'Recession',
        impact,
        description: 'Economic recession in progress',
      });
    }
    
    if (economicConditions.unemploymentRate > 0.08) {
      const impact = 0.05;
      probability += impact;
      factors.push({
        name: 'High Unemployment',
        impact,
        description: `National unemployment at ${(economicConditions.unemploymentRate * 100).toFixed(1)}%`,
      });
    }
    
    if (economicConditions.interestRateEnvironment === 'HIGH') {
      const impact = 0.03;
      probability += impact;
      factors.push({
        name: 'High Interest Environment',
        impact,
        description: 'Rising rates increase default risk',
      });
    }
    
    if (profile.loanPurpose === LoanPurpose.HOME_MORTGAGE) {
      if (economicConditions.housingMarket === 'DECLINING') {
        const impact = 0.08;
        probability += impact;
        factors.push({
          name: 'Declining Housing Market',
          impact,
          description: 'Underwater mortgages more likely',
        });
      } else if (economicConditions.housingMarket === 'BOOM') {
        const impact = -0.02;
        probability += impact;
        factors.push({
          name: 'Strong Housing Market',
          impact,
          description: 'Property values supporting loans',
        });
      }
    }
  }
  
  // Cap probability between 0.01 and 0.95
  const adjustedRate = Math.max(0.01, Math.min(0.95, probability));
  
  // Determine recommendation
  let recommendation: 'APPROVE' | 'REVIEW' | 'DENY';
  if (adjustedRate <= 0.10) {
    recommendation = 'APPROVE';
  } else if (adjustedRate <= 0.25) {
    recommendation = 'REVIEW';
  } else {
    recommendation = 'DENY';
  }
  
  return {
    baseRate: getBaseDefaultRate(profile.creditScore),
    adjustedRate,
    factors,
    riskTier: determineRiskTier(profile.creditScore),
    recommendation,
  };
}

/**
 * Simulate whether a loan defaults in a given month
 * Uses adjusted probability with some randomness
 */
export function shouldDefaultThisMonth(
  monthlyDefaultProbability: number,
  monthsDelinquent: number = 0
): boolean {
  // Increase probability for delinquent loans
  let adjustedProb = monthlyDefaultProbability;
  if (monthsDelinquent >= 1) adjustedProb *= 1.5;
  if (monthsDelinquent >= 2) adjustedProb *= 2;
  if (monthsDelinquent >= 3) adjustedProb *= 3;
  
  return Math.random() < adjustedProb;
}

/**
 * Convert annual default probability to monthly
 */
export function annualToMonthlyDefaultRate(annualRate: number): number {
  // P(no default in year) = P(no default in month)^12
  // 1 - annualRate = (1 - monthlyRate)^12
  const monthlyRate = 1 - Math.pow(1 - annualRate, 1 / 12);
  return monthlyRate;
}

/**
 * Calculate expected loss for a loan
 */
export function calculateExpectedLoss(
  loanAmount: number,
  defaultProbability: number,
  lossGivenDefault: number = 0.60 // 60% typical for unsecured
): number {
  return loanAmount * defaultProbability * lossGivenDefault;
}

/**
 * Calculate risk-adjusted return for a loan
 */
export function calculateRiskAdjustedReturn(
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  defaultProbability: number,
  lossGivenDefault: number = 0.60
): {
  expectedInterest: number;
  expectedLoss: number;
  riskAdjustedReturn: number;
  breakEvenRate: number;
} {
  // Expected interest assuming no default
  const monthlyRate = interestRate / 12;
  let totalInterest = 0;
  let balance = loanAmount;
  
  for (let i = 0; i < termMonths; i++) {
    totalInterest += balance * monthlyRate;
    balance -= loanAmount / termMonths;
  }
  
  // Expected loss
  const expectedLoss = calculateExpectedLoss(loanAmount, defaultProbability, lossGivenDefault);
  
  // Risk-adjusted return
  const riskAdjustedReturn = totalInterest - expectedLoss;
  
  // Break-even rate (rate needed to cover expected losses)
  const breakEvenRate = (expectedLoss / loanAmount) / (termMonths / 12);
  
  return {
    expectedInterest: Math.round(totalInterest * 100) / 100,
    expectedLoss: Math.round(expectedLoss * 100) / 100,
    riskAdjustedReturn: Math.round(riskAdjustedReturn * 100) / 100,
    breakEvenRate: Math.round(breakEvenRate * 10000) / 10000,
  };
}

/**
 * Simulate portfolio default outcomes using Monte Carlo
 */
export function simulatePortfolioDefaults(
  loans: Array<{ amount: number; defaultProbability: number; lossGivenDefault?: number }>,
  simulations: number = 1000
): {
  meanLoss: number;
  standardDeviation: number;
  worstCase: number;     // 99th percentile
  bestCase: number;      // 1st percentile
  expectedLossRate: number;
} {
  const results: number[] = [];
  const totalPortfolio = loans.reduce((sum, l) => sum + l.amount, 0);
  
  for (let sim = 0; sim < simulations; sim++) {
    let totalLoss = 0;
    
    for (const loan of loans) {
      if (Math.random() < loan.defaultProbability) {
        const lgd = loan.lossGivenDefault ?? 0.60;
        totalLoss += loan.amount * lgd;
      }
    }
    
    results.push(totalLoss);
  }
  
  // Sort for percentile calculation
  results.sort((a, b) => a - b);
  
  // Calculate statistics
  const mean = results.reduce((sum, r) => sum + r, 0) / simulations;
  const variance = results.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / simulations;
  const stdDev = Math.sqrt(variance);
  
  const p1Index = Math.floor(simulations * 0.01);
  const p99Index = Math.floor(simulations * 0.99);
  
  return {
    meanLoss: Math.round(mean * 100) / 100,
    standardDeviation: Math.round(stdDev * 100) / 100,
    worstCase: Math.round(results[p99Index] * 100) / 100,
    bestCase: Math.round(results[p1Index] * 100) / 100,
    expectedLossRate: Math.round((mean / totalPortfolio) * 10000) / 100, // As percentage
  };
}

export default {
  calculateDefaultProbability,
  shouldDefaultThisMonth,
  annualToMonthlyDefaultRate,
  calculateExpectedLoss,
  calculateRiskAdjustedReturn,
  simulatePortfolioDefaults,
  determineRiskTier,
};
