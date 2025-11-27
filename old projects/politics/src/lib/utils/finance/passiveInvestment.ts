/**
 * @file src/lib/utils/finance/passiveInvestment.ts
 * @description Passive investment returns calculator for idle cash
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Investment calculator for companies with excess cash reserves. Supports 5 investment types
 * (Savings Account, Money Market, Bonds, Index Funds, Real Estate) with varying risk/return profiles.
 * Calculates monthly returns, compound interest, and portfolio diversification benefits.
 * 
 * USAGE:
 * ```typescript
 * import { calculateInvestmentReturns, optimizePortfolio } from '@/lib/utils/finance/passiveInvestment';
 * 
 * // Calculate returns for single investment
 * const returns = calculateInvestmentReturns({
 *   principal: 500000,
 *   investmentType: 'IndexFunds',
 *   duration: 12, // months
 *   riskTolerance: 'Moderate'
 * });
 * // Returns: { monthlyReturn: 3500, totalReturn: 42000, endingValue: 542000 }
 * 
 * // Optimize portfolio allocation
 * const portfolio = optimizePortfolio({
 *   totalCash: 1000000,
 *   riskTolerance: 'Moderate',
 *   timeHorizon: 24 // months
 * });
 * // Returns: { allocations: [{type: 'Bonds', amount: 400000, ...}], expectedReturn: 65000 }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Investment types and expected annual returns (2025 rates):
 *   - Savings Account: 2-3% (very low risk, high liquidity)
 *   - Money Market: 4-5% (low risk, high liquidity)
 *   - Bonds: 5-7% (low-medium risk, medium liquidity)
 *   - Index Funds: 8-12% (medium-high risk, medium liquidity)
 *   - Real Estate: 10-15% (high risk, low liquidity)
 * - Returns are annual averages; monthly returns calculated as: annual / 12
 * - Actual returns vary based on market conditions (±2-5% volatility)
 * - Risk tolerance affects allocation strategy:
 *   - Conservative: 60% Savings/MM, 30% Bonds, 10% Index
 *   - Moderate: 30% Savings/MM, 40% Bonds, 25% Index, 5% Real Estate
 *   - Aggressive: 10% Savings/MM, 20% Bonds, 50% Index, 20% Real Estate
 * - Time horizon affects liquidity preference:
 *   - Short (<12 months): Favor high liquidity (Savings, MM, Bonds)
 *   - Medium (12-36 months): Balanced (Bonds, Index Funds)
 *   - Long (36+ months): Growth focus (Index Funds, Real Estate)
 * - Compound interest calculated monthly
 * - Minimum investment amounts:
 *   - Savings: $1,000
 *   - Money Market: $10,000
 *   - Bonds: $25,000
 *   - Index Funds: $10,000
 *   - Real Estate: $100,000
 * - Withdrawal penalties for early liquidation:
 *   - Savings/MM: None
 *   - Bonds: 1-3% penalty if sold before maturity
 *   - Index Funds: Market price risk (could lose value)
 *   - Real Estate: 5-10% transaction costs
 */

/**
 * Investment types
 */
export type InvestmentType =
  | 'Savings'        // High-yield savings account
  | 'MoneyMarket'    // Money market account
  | 'Bonds'          // Corporate/government bonds
  | 'IndexFunds'     // Stock market index funds
  | 'RealEstate';    // Real estate investment trusts (REITs)

/**
 * Risk tolerance levels
 */
export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';

/**
 * Investment input
 */
export interface InvestmentInput {
  principal: number;
  investmentType: InvestmentType;
  duration: number;          // Months
  riskTolerance?: RiskTolerance;
}

/**
 * Investment returns result
 */
export interface InvestmentReturns {
  monthlyReturn: number;
  totalReturn: number;
  endingValue: number;
  annualRate: number;
  volatility: number;        // Expected price fluctuation (%)
  liquidity: 'High' | 'Medium' | 'Low';
}

/**
 * Portfolio allocation
 */
export interface PortfolioAllocation {
  type: InvestmentType;
  amount: number;
  percentage: number;
  expectedReturn: number;
  annualRate: number;
}

/**
 * Portfolio optimization input
 */
export interface PortfolioOptimizationInput {
  totalCash: number;
  riskTolerance: RiskTolerance;
  timeHorizon: number;       // Months
  minLiquidity?: number;     // Minimum amount kept in liquid assets
}

/**
 * Portfolio optimization result
 */
export interface OptimizedPortfolio {
  allocations: PortfolioAllocation[];
  expectedReturn: number;
  totalRisk: number;
  avgAnnualRate: number;
}

/**
 * Investment type characteristics
 */
interface InvestmentCharacteristics {
  annualRate: number;        // Expected annual return %
  volatility: number;        // Price volatility %
  liquidity: 'High' | 'Medium' | 'Low';
  minInvestment: number;
}

/**
 * Investment characteristics by type
 */
const INVESTMENT_CHARACTERISTICS: Record<InvestmentType, InvestmentCharacteristics> = {
  Savings: {
    annualRate: 2.5,
    volatility: 0,
    liquidity: 'High',
    minInvestment: 1000,
  },
  MoneyMarket: {
    annualRate: 4.5,
    volatility: 0.5,
    liquidity: 'High',
    minInvestment: 10000,
  },
  Bonds: {
    annualRate: 6.0,
    volatility: 3.0,
    liquidity: 'Medium',
    minInvestment: 25000,
  },
  IndexFunds: {
    annualRate: 10.0,
    volatility: 15.0,
    liquidity: 'Medium',
    minInvestment: 10000,
  },
  RealEstate: {
    annualRate: 12.5,
    volatility: 10.0,
    liquidity: 'Low',
    minInvestment: 100000,
  },
};

/**
 * Calculate investment returns over time
 * 
 * @param input - Investment parameters
 * @returns Investment returns projection
 * 
 * @example
 * ```typescript
 * const returns = calculateInvestmentReturns({
 *   principal: 250000,
 *   investmentType: 'Bonds',
 *   duration: 24,
 *   riskTolerance: 'Conservative'
 * });
 * // Returns: { monthlyReturn: 1250, totalReturn: 30000, endingValue: 280000, ... }
 * ```
 */
export function calculateInvestmentReturns(input: InvestmentInput): InvestmentReturns {
  const { principal, investmentType, duration, riskTolerance = 'Moderate' } = input;

  const characteristics = INVESTMENT_CHARACTERISTICS[investmentType];
  let annualRate = characteristics.annualRate;

  // Adjust rate based on risk tolerance
  if (riskTolerance === 'Conservative') {
    annualRate *= 0.9; // 10% reduction for safety
  } else if (riskTolerance === 'Aggressive') {
    annualRate *= 1.1; // 10% boost for higher risk
  }

  // Monthly rate
  const monthlyRate = annualRate / 100 / 12;

  // Compound interest calculation
  const endingValue = principal * Math.pow(1 + monthlyRate, duration);
  const totalReturn = endingValue - principal;
  const monthlyReturn = totalReturn / duration;

  return {
    monthlyReturn: Math.round(monthlyReturn * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    endingValue: Math.round(endingValue * 100) / 100,
    annualRate: Math.round(annualRate * 100) / 100,
    volatility: characteristics.volatility,
    liquidity: characteristics.liquidity,
  };
}

/**
 * Optimize portfolio allocation based on risk tolerance and time horizon
 * 
 * @param input - Portfolio optimization parameters
 * @returns Optimized portfolio allocation
 * 
 * @example
 * ```typescript
 * const portfolio = optimizePortfolio({
 *   totalCash: 2000000,
 *   riskTolerance: 'Aggressive',
 *   timeHorizon: 36,
 *   minLiquidity: 200000
 * });
 * ```
 */
export function optimizePortfolio(input: PortfolioOptimizationInput): OptimizedPortfolio {
  const { totalCash, riskTolerance, timeHorizon, minLiquidity = 0 } = input;

  // Define allocation percentages by risk tolerance
  let allocationPercentages: Record<InvestmentType, number>;

  if (riskTolerance === 'Conservative') {
    allocationPercentages = {
      Savings: 0.40,
      MoneyMarket: 0.30,
      Bonds: 0.25,
      IndexFunds: 0.05,
      RealEstate: 0.00,
    };
  } else if (riskTolerance === 'Moderate') {
    allocationPercentages = {
      Savings: 0.15,
      MoneyMarket: 0.20,
      Bonds: 0.35,
      IndexFunds: 0.25,
      RealEstate: 0.05,
    };
  } else {
    // Aggressive
    allocationPercentages = {
      Savings: 0.05,
      MoneyMarket: 0.10,
      Bonds: 0.15,
      IndexFunds: 0.50,
      RealEstate: 0.20,
    };
  }

  // Adjust for time horizon
  if (timeHorizon < 12) {
    // Short-term: Increase liquidity
    allocationPercentages.Savings += 0.15;
    allocationPercentages.MoneyMarket += 0.10;
    allocationPercentages.IndexFunds -= 0.15;
    allocationPercentages.RealEstate -= 0.10;
  } else if (timeHorizon > 36) {
    // Long-term: Increase growth assets
    allocationPercentages.Savings -= 0.10;
    allocationPercentages.MoneyMarket -= 0.05;
    allocationPercentages.IndexFunds += 0.10;
    allocationPercentages.RealEstate += 0.05;
  }

  // Ensure minimum liquidity requirement
  const liquidAssets =
    totalCash * (allocationPercentages.Savings + allocationPercentages.MoneyMarket);
  if (liquidAssets < minLiquidity) {
    const shortfall = minLiquidity - liquidAssets;
    const liquidityBoost = shortfall / totalCash;
    allocationPercentages.Savings += liquidityBoost / 2;
    allocationPercentages.MoneyMarket += liquidityBoost / 2;
    allocationPercentages.IndexFunds -= liquidityBoost * 0.6;
    allocationPercentages.RealEstate -= liquidityBoost * 0.4;
  }

  // Normalize percentages to sum to 1.0
  const total = Object.values(allocationPercentages).reduce((sum, pct) => sum + pct, 0);
  Object.keys(allocationPercentages).forEach((key) => {
    allocationPercentages[key as InvestmentType] /= total;
  });

  // Create allocations
  const allocations: PortfolioAllocation[] = [];
  let expectedReturn = 0;
  let totalRisk = 0;

  for (const [type, percentage] of Object.entries(allocationPercentages) as [InvestmentType, number][]) {
    if (percentage <= 0) continue;

    const amount = Math.round(totalCash * percentage);
    const characteristics = INVESTMENT_CHARACTERISTICS[type];
    const annualReturn = (amount * characteristics.annualRate) / 100;

    allocations.push({
      type,
      amount,
      percentage: Math.round(percentage * 100 * 100) / 100,
      expectedReturn: Math.round(annualReturn * 100) / 100,
      annualRate: characteristics.annualRate,
    });

    expectedReturn += annualReturn;
    totalRisk += percentage * characteristics.volatility;
  }

  // Calculate weighted average annual rate
  const avgAnnualRate =
    allocations.reduce((sum, a) => sum + a.annualRate * (a.percentage / 100), 0);

  return {
    allocations,
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    totalRisk: Math.round(totalRisk * 100) / 100,
    avgAnnualRate: Math.round(avgAnnualRate * 100) / 100,
  };
}

/**
 * Calculate returns for entire portfolio over time
 * 
 * @param portfolio - Portfolio allocation
 * @param months - Number of months to project
 * @returns Total portfolio value after time period
 */
export function calculatePortfolioReturns(
  portfolio: OptimizedPortfolio,
  months: number
): number {
  let totalValue = 0;

  for (const allocation of portfolio.allocations) {
    const returns = calculateInvestmentReturns({
      principal: allocation.amount,
      investmentType: allocation.type,
      duration: months,
    });
    totalValue += returns.endingValue;
  }

  return Math.round(totalValue * 100) / 100;
}

/**
 * Get recommended minimum liquidity based on monthly expenses
 * 
 * @param monthlyExpenses - Company monthly expenses
 * @returns Recommended minimum liquid reserves (3-6 months expenses)
 */
export function getRecommendedLiquidity(monthlyExpenses: number): number {
  return monthlyExpenses * 4; // 4 months as middle ground
}
