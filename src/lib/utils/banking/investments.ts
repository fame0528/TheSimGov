/**
 * @file src/lib/utils/banking/investments.ts
 * @description Investment calculation utilities for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Investment portfolio management utilities supporting various investment types,
 * return calculations, risk assessment, and portfolio optimization.
 *
 * FEATURES:
 * - Multiple investment types (stocks, bonds, real estate, index funds)
 * - Return calculations (simple, compound, dividend yields)
 * - Risk assessment and diversification analysis
 * - Portfolio rebalancing recommendations
 * - Tax-advantaged investment options
 *
 * USAGE:
 * import { calculateInvestmentReturn, optimizePortfolio } from '@/lib/utils/banking/investments';
 * const returns = calculateInvestmentReturn(amount, rate, years);
 * const recommendations = optimizePortfolio(currentHoldings, riskTolerance);
 */

import { InvestmentType } from '@/lib/types/enums';

/**
 * Investment type configurations
 */
export const INVESTMENT_TYPES = {
  STOCKS: {
    name: 'Stocks',
    expectedReturn: 0.08, // 8% annual return
    volatility: 0.15, // 15% standard deviation
    riskLevel: 'High',
    description: 'Individual company stocks with potential for high returns',
  },
  BONDS: {
    name: 'Bonds',
    expectedReturn: 0.03, // 3% annual return
    volatility: 0.05, // 5% standard deviation
    riskLevel: 'Low',
    description: 'Government and corporate bonds with steady income',
  },
  REAL_ESTATE: {
    name: 'Real Estate',
    expectedReturn: 0.06, // 6% annual return
    volatility: 0.10, // 10% standard deviation
    riskLevel: 'Medium',
    description: 'Commercial and residential real estate investments',
  },
  INDEX_FUNDS: {
    name: 'Index Funds',
    expectedReturn: 0.07, // 7% annual return
    volatility: 0.12, // 12% standard deviation
    riskLevel: 'Medium',
    description: 'Diversified funds tracking market indices',
  },
} as const;

/**
 * Calculate simple investment return
 * @param principal - Initial investment amount
 * @param annualRate - Annual return rate (as decimal)
 * @param years - Investment period in years
 * @returns Final amount
 */
export function calculateSimpleReturn(
  principal: number,
  annualRate: number,
  years: number
): number {
  return principal * (1 + annualRate * years);
}

/**
 * Calculate compound investment return
 * @param principal - Initial investment amount
 * @param annualRate - Annual return rate (as decimal)
 * @param years - Investment period in years
 * @param compoundingFrequency - Compounding frequency per year (default: 12 for monthly)
 * @returns Final amount
 */
export function calculateCompoundReturn(
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number = 12
): number {
  const ratePerPeriod = annualRate / compoundingFrequency;
  const totalPeriods = years * compoundingFrequency;

  return principal * Math.pow(1 + ratePerPeriod, totalPeriods);
}

/**
 * Calculate dividend yield
 * @param annualDividend - Annual dividend per share
 * @param sharePrice - Current share price
 * @returns Dividend yield as decimal
 */
export function calculateDividendYield(annualDividend: number, sharePrice: number): number {
  if (sharePrice === 0) return 0;
  return annualDividend / sharePrice;
}

/**
 * Calculate total return including dividends
 * @param principal - Initial investment
 * @param capitalAppreciation - Capital appreciation amount
 * @param totalDividends - Total dividends received
 * @returns Total return amount
 */
export function calculateTotalReturn(
  principal: number,
  capitalAppreciation: number,
  totalDividends: number
): number {
  return principal + capitalAppreciation + totalDividends;
}

/**
 * Calculate return on investment (ROI)
 * @param finalValue - Final investment value
 * @param initialInvestment - Initial investment amount
 * @returns ROI as decimal
 */
export function calculateROI(finalValue: number, initialInvestment: number): number {
  if (initialInvestment === 0) return 0;
  return (finalValue - initialInvestment) / initialInvestment;
}

/**
 * Calculate annualized return
 * @param finalValue - Final investment value
 * @param initialInvestment - Initial investment amount
 * @param years - Holding period in years
 * @returns Annualized return as decimal
 */
export function calculateAnnualizedReturn(
  finalValue: number,
  initialInvestment: number,
  years: number
): number {
  if (initialInvestment === 0 || years === 0) return 0;

  const totalReturn = (finalValue / initialInvestment) - 1;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Generate investment recommendations based on risk tolerance
 * @param riskTolerance - Risk tolerance (1-10, 10 being highest risk tolerance)
 * @param investmentAmount - Amount to invest
 * @returns Recommended portfolio allocation
 */
export function generateInvestmentRecommendations(
  riskTolerance: number,
  investmentAmount: number
): Array<{
  type: InvestmentType;
  allocation: number; // Percentage (0-1)
  amount: number;
  expectedReturn: number;
  risk: string;
}> {
  const recommendations = [];

  if (riskTolerance >= 8) {
    // High risk tolerance - aggressive portfolio
    recommendations.push({
      type: InvestmentType.STOCKS,
      allocation: 0.6,
      amount: investmentAmount * 0.6,
      expectedReturn: INVESTMENT_TYPES.STOCKS.expectedReturn,
      risk: INVESTMENT_TYPES.STOCKS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.INDEX_FUNDS,
      allocation: 0.25,
      amount: investmentAmount * 0.25,
      expectedReturn: INVESTMENT_TYPES.INDEX_FUNDS.expectedReturn,
      risk: INVESTMENT_TYPES.INDEX_FUNDS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.REAL_ESTATE,
      allocation: 0.15,
      amount: investmentAmount * 0.15,
      expectedReturn: INVESTMENT_TYPES.REAL_ESTATE.expectedReturn,
      risk: INVESTMENT_TYPES.REAL_ESTATE.riskLevel,
    });
  } else if (riskTolerance >= 5) {
    // Medium risk tolerance - balanced portfolio
    recommendations.push({
      type: InvestmentType.INDEX_FUNDS,
      allocation: 0.4,
      amount: investmentAmount * 0.4,
      expectedReturn: INVESTMENT_TYPES.INDEX_FUNDS.expectedReturn,
      risk: INVESTMENT_TYPES.INDEX_FUNDS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.REAL_ESTATE,
      allocation: 0.3,
      amount: investmentAmount * 0.3,
      expectedReturn: INVESTMENT_TYPES.REAL_ESTATE.expectedReturn,
      risk: INVESTMENT_TYPES.REAL_ESTATE.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.BONDS,
      allocation: 0.2,
      amount: investmentAmount * 0.2,
      expectedReturn: INVESTMENT_TYPES.BONDS.expectedReturn,
      risk: INVESTMENT_TYPES.BONDS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.STOCKS,
      allocation: 0.1,
      amount: investmentAmount * 0.1,
      expectedReturn: INVESTMENT_TYPES.STOCKS.expectedReturn,
      risk: INVESTMENT_TYPES.STOCKS.riskLevel,
    });
  } else {
    // Low risk tolerance - conservative portfolio
    recommendations.push({
      type: InvestmentType.BONDS,
      allocation: 0.6,
      amount: investmentAmount * 0.6,
      expectedReturn: INVESTMENT_TYPES.BONDS.expectedReturn,
      risk: INVESTMENT_TYPES.BONDS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.INDEX_FUNDS,
      allocation: 0.25,
      amount: investmentAmount * 0.25,
      expectedReturn: INVESTMENT_TYPES.INDEX_FUNDS.expectedReturn,
      risk: INVESTMENT_TYPES.INDEX_FUNDS.riskLevel,
    });
    recommendations.push({
      type: InvestmentType.REAL_ESTATE,
      allocation: 0.15,
      amount: investmentAmount * 0.15,
      expectedReturn: INVESTMENT_TYPES.REAL_ESTATE.expectedReturn,
      risk: INVESTMENT_TYPES.REAL_ESTATE.riskLevel,
    });
  }

  return recommendations;
}

/**
 * Calculate portfolio diversification score
 * @param holdings - Array of investment holdings
 * @returns Diversification score (0-1, higher is better)
 */
export function calculateDiversificationScore(holdings: Array<{
  type: InvestmentType;
  amount: number;
}>): number {
  if (holdings.length === 0) return 0;

  const totalValue = holdings.reduce((sum, holding) => sum + holding.amount, 0);
  if (totalValue === 0) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI) for concentration
  const concentrations = holdings.map(holding => Math.pow(holding.amount / totalValue, 2));
  const hhi = concentrations.reduce((sum, concentration) => sum + concentration, 0);

  // Convert HHI to diversification score (0-1 scale, inverted)
  // HHI ranges from 1/n to 1 (where n is number of holdings)
  // Perfect diversification (equal weights) = 1/n
  // Complete concentration = 1
  const maxHHI = 1;
  const minHHI = 1 / holdings.length;

  return 1 - ((hhi - minHHI) / (maxHHI - minHHI));
}

/**
 * Get investment type configuration
 * @param investmentType - Investment type key
 * @returns Investment type configuration
 */
export function getInvestmentTypeConfig(investmentType: InvestmentType) {
  return INVESTMENT_TYPES[investmentType];
}

/**
 * Calculate Sharpe ratio for risk-adjusted returns
 * @param expectedReturn - Expected portfolio return
 * @param riskFreeRate - Risk-free rate (e.g., treasury bond rate)
 * @param volatility - Portfolio volatility (standard deviation)
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(
  expectedReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (expectedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown from investment history
 * @param values - Array of investment values over time
 * @returns Maximum drawdown percentage
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = values[0];

  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
    } else {
      const drawdown = (peak - values[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}

/**
 * Generate quarterly dividend payment schedule
 * @param investmentAmount - Amount invested
 * @param dividendYield - Annual dividend yield (as decimal)
 * @param quarters - Number of quarters to project
 * @returns Array of dividend payments
 */
export function generateDividendSchedule(
  investmentAmount: number,
  dividendYield: number,
  quarters: number = 12
): Array<{
  quarter: number;
  dividendAmount: number;
  cumulativeDividends: number;
}> {
  const quarterlyDividend = (investmentAmount * dividendYield) / 4;
  const schedule = [];
  let cumulative = 0;

  for (let quarter = 1; quarter <= quarters; quarter++) {
    cumulative += quarterlyDividend;
    schedule.push({
      quarter,
      dividendAmount: quarterlyDividend,
      cumulativeDividends: cumulative,
    });
  }

  return schedule;
}