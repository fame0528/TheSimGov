/**
 * @file src/lib/utils/employeeRetention.ts
 * @description Employee retention mechanics and turnover risk calculations
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Comprehensive employee retention system calculating satisfaction, loyalty decay,
 * turnover risk, and counter-offer effectiveness. Factors include salary competitiveness,
 * morale, workload, growth opportunities, company reputation, and market conditions.
 * All calculations use deterministic formulas for predictable AI behavior.
 * 
 * CORE CONCEPTS:
 * - **Satisfaction**: Overall job happiness (0-100), affects productivity and retention
 * - **Loyalty**: Resistance to leaving (0-100), decays without positive events
 * - **Retention Risk**: Probability of quitting (0-100), inverse of satisfaction+loyalty
 * - **Turnover Threshold**: When risk exceeds threshold, employee may quit
 * - **Counter-Offer**: Company's retention attempt, effectiveness based on offer quality
 * 
 * CALCULATION FACTORS:
 * Salary Competitiveness (30% weight):
 * - Compare employee salary to market rate for role/experience
 * - Under market = dissatisfaction, over market = satisfaction boost
 * - Market rates adjust by industry, location, company size
 * 
 * Morale & Treatment (25% weight):
 * - Current morale level (affected by events, bonuses, promotions)
 * - Workload balance (overwork decreases morale)
 * - Work-life balance considerations
 * - Management quality perception
 * 
 * Growth Opportunities (20% weight):
 * - Training investment and skill development
 * - Promotion potential and career path
 * - Skill utilization (using employee's best skills)
 * - Learning rate vs challenge level match
 * 
 * Company Performance (15% weight):
 * - Company reputation and industry standing
 * - Financial stability (profitability, growth)
 * - Company culture and values alignment
 * - Job security perception
 * 
 * External Factors (10% weight):
 * - Market demand for employee's skills
 * - Industry growth trends
 * - Competitor activity (poaching attempts)
 * - Economic conditions
 * 
 * RETENTION STRATEGIES:
 * 1. **Salary Adjustment**: Raise to match/exceed market rate
 * 2. **Bonus Offer**: One-time retention bonus
 * 3. **Promotion**: Title change with responsibility increase
 * 4. **Equity Grant**: Stock options to align long-term interests
 * 5. **Training Investment**: Skill development opportunities
 * 6. **Workload Reduction**: Better work-life balance
 * 7. **Culture Improvement**: Events, recognition, team building
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculateSatisfaction,
 *   calculateRetentionRisk,
 *   evaluateCounterOffer,
 *   applyLoyaltyDecay,
 *   getMarketSalary
 * } from '@/lib/utils/employeeRetention';
 * 
 * // Calculate employee satisfaction
 * const satisfaction = calculateSatisfaction({
 *   currentSalary: 100000,
 *   marketSalary: 110000,
 *   morale: 70,
 *   trainingInvestment: 5000,
 *   yearsWithCompany: 2,
 *   promotionsReceived: 1,
 *   companyReputation: 75,
 *   workload: 80 // High workload
 * });
 * 
 * // Calculate turnover risk
 * const risk = calculateRetentionRisk({
 *   satisfaction: 60,
 *   loyalty: 55,
 *   externalOffers: 2,
 *   marketDemand: 85,
 *   lastRaise: new Date('2024-01-01')
 * });
 * 
 * // Evaluate counter-offer effectiveness
 * const counterOffer = evaluateCounterOffer({
 *   currentSalary: 100000,
 *   offerSalary: 120000,
 *   currentBonus: 10,
 *   offerBonus: 15,
 *   currentEquity: 0.5,
 *   offerEquity: 1.0,
 *   employeeRetentionRisk: 75,
 *   employeeLoyalty: 50
 * });
 * 
 * console.log(`Counter-offer acceptance: ${counterOffer.acceptanceProbability}%`);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - All calculations return 0-100 scale for consistency
 * - Higher satisfaction/loyalty = lower retention risk
 * - Market salary varies by role, experience, industry, location
 * - Loyalty decays 1-5 points per month without positive events
 * - Counter-offers have diminishing returns (multiple = less effective)
 * - Training investment shows long-term commitment, boosts loyalty
 * - Promotions significantly boost satisfaction and loyalty
 * - Workload over 90 severely impacts morale and satisfaction
 * - Company reputation affects baseline satisfaction
 * - External offers increase retention risk significantly
 */

import { clamp, mean, round } from './math';

/**
 * Employee role market rates (annual salary in USD)
 * Base rates for mid-level experience (5 years)
 */
export const MARKET_RATES: Record<string, number> = {
  MLEngineer: 150000,
  DataScientist: 130000,
  SoftwareEngineer: 120000,
  ProductManager: 140000,
  SalesManager: 110000,
  SalesRepresentative: 75000,
  MarketingManager: 100000,
  MarketingSpecialist: 70000,
  FinanceManager: 120000,
  Accountant: 65000,
  HRManager: 90000,
  Recruiter: 60000,
  OperationsManager: 105000,
  OperationsSpecialist: 65000,
  CustomerSuccess: 60000,
  Designer: 85000,
  Analyst: 75000,
  Consultant: 95000,
  Manager: 100000,
  Executive: 200000,
};

/**
 * Industry salary multipliers
 * Adjust base rates by industry competitiveness
 */
export const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  Technology: 1.3,
  Finance: 1.2,
  Healthcare: 1.1,
  Education: 0.9,
  Retail: 0.85,
  Manufacturing: 0.95,
  'Real Estate': 1.0,
  Energy: 1.15,
  Media: 1.05,
  Consulting: 1.25,
  Government: 0.8,
  Nonprofit: 0.75,
};

/**
 * Experience level salary multipliers
 * Adjust base rates by years of experience
 */
export const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  'Entry (0-2 years)': 0.7,
  'Junior (2-5 years)': 0.9,
  'Mid (5-10 years)': 1.0, // Base rate
  'Senior (10-15 years)': 1.3,
  'Lead (15-20 years)': 1.6,
  'Principal (20+ years)': 2.0,
};

/**
 * Satisfaction calculation parameters
 */
export interface SatisfactionParams {
  currentSalary: number;
  marketSalary: number;
  morale: number; // 0-100
  trainingInvestment: number; // Total $ spent on training
  yearsWithCompany: number;
  promotionsReceived: number;
  companyReputation: number; // 0-100
  workload: number; // 0-100 (higher = more work)
  skillUtilization?: number; // 0-100 (how well skills are used)
  lastRaiseMonthsAgo?: number; // Months since last raise
}

/**
 * Retention risk calculation parameters
 */
export interface RetentionRiskParams {
  satisfaction: number; // 0-100
  loyalty: number; // 0-100
  externalOffers?: number; // Count of recent external offers
  marketDemand?: number; // 0-100 (demand for employee's skills)
  lastRaise?: Date; // Date of last salary increase
  counterOfferCount?: number; // Times company made counter-offers
}

/**
 * Counter-offer evaluation parameters
 */
export interface CounterOfferParams {
  currentSalary: number;
  offerSalary: number;
  currentBonus: number; // Percentage (0-100)
  offerBonus: number;
  currentEquity: number; // Percentage (0-10)
  offerEquity: number;
  employeeRetentionRisk: number; // 0-100
  employeeLoyalty: number; // 0-100
  counterOfferCount?: number; // Previous counter-offers made
  promotionIncluded?: boolean; // Counter-offer includes promotion
  trainingIncluded?: boolean; // Counter-offer includes training
}

/**
 * Counter-offer evaluation result
 */
export interface CounterOfferResult {
  acceptanceProbability: number; // 0-100
  compensationImprovement: number; // Percentage increase
  recommendedSalary: number;
  recommendedBonus: number;
  recommendedEquity: number;
  effectiveness: 'Low' | 'Medium' | 'High' | 'Very High';
  reasoning: string;
}

/**
 * Loyalty decay parameters
 */
export interface LoyaltyDecayParams {
  currentLoyalty: number; // 0-100
  monthsSincePositiveEvent: number; // Months since raise/promotion/bonus
  satisfactionLevel: number; // 0-100
  competitorActivity?: number; // 0-100 (poaching pressure)
}

/**
 * Calculate market salary for role with adjustments
 * 
 * @param {string} role - Employee role
 * @param {number} yearsExperience - Years of professional experience (0-50)
 * @param {string} industry - Company industry
 * @returns {number} Market salary in USD
 * 
 * @example
 * ```typescript
 * const marketRate = getMarketSalary('SoftwareEngineer', 7, 'Technology');
 * // Returns: ~156,000 (120k base * 1.3 industry * 1.0 mid-level)
 * ```
 */
export function getMarketSalary(
  role: string,
  yearsExperience: number,
  industry: string
): number {
  const baseRate = MARKET_RATES[role] || 70000; // Default to $70k
  const industryMultiplier = INDUSTRY_MULTIPLIERS[industry] || 1.0;
  
  // Determine experience level
  let experienceMultiplier = 1.0;
  if (yearsExperience < 2) {
    experienceMultiplier = 0.7;
  } else if (yearsExperience < 5) {
    experienceMultiplier = 0.9;
  } else if (yearsExperience < 10) {
    experienceMultiplier = 1.0;
  } else if (yearsExperience < 15) {
    experienceMultiplier = 1.3;
  } else if (yearsExperience < 20) {
    experienceMultiplier = 1.6;
  } else {
    experienceMultiplier = 2.0;
  }
  
  return Math.round(baseRate * industryMultiplier * experienceMultiplier);
}

/**
 * Calculate employee satisfaction score
 * 
 * Factors:
 * - Salary competitiveness (30%)
 * - Morale and treatment (25%)
 * - Growth opportunities (20%)
 * - Company performance (15%)
 * - Work-life balance (10%)
 * 
 * @param {SatisfactionParams} params - Satisfaction calculation parameters
 * @returns {number} Satisfaction score (0-100)
 * 
 * @example
 * ```typescript
 * const satisfaction = calculateSatisfaction({
 *   currentSalary: 100000,
 *   marketSalary: 110000,
 *   morale: 70,
 *   trainingInvestment: 5000,
 *   yearsWithCompany: 2,
 *   promotionsReceived: 1,
 *   companyReputation: 75,
 *   workload: 80,
 *   skillUtilization: 85
 * });
 * // Returns: ~68 (mixed factors, slightly below market salary)
 * ```
 */
export function calculateSatisfaction(params: SatisfactionParams): number {
  const {
    currentSalary,
    marketSalary,
    morale,
    trainingInvestment,
    yearsWithCompany,
    promotionsReceived,
    companyReputation,
    workload,
    skillUtilization = 70,
    lastRaiseMonthsAgo = 12,
  } = params;
  
  // 1. Salary Competitiveness (30% weight)
  const salaryRatio = currentSalary / marketSalary;
  let salaryScore = 0;
  if (salaryRatio >= 1.2) {
    salaryScore = 100; // 20%+ above market
  } else if (salaryRatio >= 1.1) {
    salaryScore = 90; // 10-20% above market
  } else if (salaryRatio >= 1.0) {
    salaryScore = 80; // At market rate
  } else if (salaryRatio >= 0.95) {
    salaryScore = 70; // Slightly below market
  } else if (salaryRatio >= 0.9) {
    salaryScore = 50; // 10% below market
  } else if (salaryRatio >= 0.85) {
    salaryScore = 30; // 15% below market
  } else {
    salaryScore = 10; // Significantly underpaid
  }
  
  // Penalty for no recent raise
  if (lastRaiseMonthsAgo > 24) {
    salaryScore *= 0.8; // -20% if no raise in 2+ years
  } else if (lastRaiseMonthsAgo > 18) {
    salaryScore *= 0.9; // -10% if no raise in 1.5+ years
  }
  
  // 2. Morale and Treatment (25% weight)
  const moraleScore = morale;
  
  // 3. Growth Opportunities (20% weight)
  const trainingScore = Math.min(100, (trainingInvestment / 10000) * 100); // $10k = 100 score
  const promotionScore = Math.min(100, promotionsReceived * 30); // Each promotion = +30
  const tenureBonus = Math.min(20, yearsWithCompany * 5); // +5 per year, max +20
  const growthScore = mean([trainingScore, promotionScore]) + tenureBonus;
  
  // 4. Company Performance (15% weight)
  const companyScore = companyReputation;
  
  // 5. Work-Life Balance (10% weight)
  let balanceScore = 100 - workload; // Inverse of workload
  if (workload > 90) {
    balanceScore = 10; // Severe overwork
  } else if (workload > 80) {
    balanceScore = 30; // High workload
  } else if (workload < 40) {
    balanceScore = 70; // Underutilized (can be boring)
  }
  
  // Skill utilization bonus (using employee's best skills = satisfaction)
  const skillBonus = (skillUtilization - 50) * 0.2; // -10 to +10
  balanceScore = clamp(balanceScore + skillBonus, 0, 100);
  
  // Weighted average
  const weightedScore =
    salaryScore * 0.3 +
    moraleScore * 0.25 +
    clamp(growthScore, 0, 100) * 0.2 +
    companyScore * 0.15 +
    balanceScore * 0.1;
  
  return round(clamp(weightedScore, 0, 100), 1);
}

/**
 * Calculate employee retention risk
 * 
 * Higher risk = more likely to quit
 * Risk factors: Low satisfaction, low loyalty, external offers, market demand
 * 
 * @param {RetentionRiskParams} params - Retention risk parameters
 * @returns {number} Retention risk score (0-100)
 * 
 * @example
 * ```typescript
 * const risk = calculateRetentionRisk({
 *   satisfaction: 60,
 *   loyalty: 55,
 *   externalOffers: 2,
 *   marketDemand: 85,
 *   lastRaise: new Date('2023-06-01'),
 *   counterOfferCount: 1
 * });
 * // Returns: ~72 (high risk due to external offers and market demand)
 * ```
 */
export function calculateRetentionRisk(params: RetentionRiskParams): number {
  const {
    satisfaction,
    loyalty,
    externalOffers = 0,
    marketDemand = 50,
    lastRaise,
    counterOfferCount = 0,
  } = params;
  
  // Base risk (inverse of satisfaction and loyalty)
  const satisfactionRisk = (100 - satisfaction) * 0.5;
  const loyaltyRisk = (100 - loyalty) * 0.3;
  
  // External pressure
  const offerPressure = Math.min(30, externalOffers * 10); // +10 per offer, max +30
  const marketPressure = (marketDemand - 50) * 0.3; // High demand = higher risk
  
  // Time since last raise
  let raisePenalty = 0;
  if (lastRaise) {
    const monthsSinceRaise = Math.floor(
      (Date.now() - lastRaise.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsSinceRaise > 24) {
      raisePenalty = 15; // No raise in 2+ years
    } else if (monthsSinceRaise > 18) {
      raisePenalty = 10; // No raise in 1.5+ years
    } else if (monthsSinceRaise > 12) {
      raisePenalty = 5; // No raise in 1+ year
    }
  }
  
  // Counter-offer fatigue (diminishing returns)
  const counterOfferPenalty = Math.min(20, counterOfferCount * 8); // Each counter-offer adds skepticism
  
  const totalRisk =
    satisfactionRisk +
    loyaltyRisk +
    offerPressure +
    Math.max(0, marketPressure) +
    raisePenalty +
    counterOfferPenalty;
  
  return round(clamp(totalRisk, 0, 100), 1);
}

/**
 * Evaluate counter-offer effectiveness
 * 
 * Determines probability employee accepts company's counter-offer
 * vs external offer. Considers compensation gap, loyalty, and offer quality.
 * 
 * @param {CounterOfferParams} params - Counter-offer parameters
 * @returns {CounterOfferResult} Counter-offer evaluation with recommendations
 * 
 * @example
 * ```typescript
 * const counterOffer = evaluateCounterOffer({
 *   currentSalary: 100000,
 *   offerSalary: 130000,
 *   currentBonus: 10,
 *   offerBonus: 15,
 *   currentEquity: 0.5,
 *   offerEquity: 1.0,
 *   employeeRetentionRisk: 75,
 *   employeeLoyalty: 50,
 *   counterOfferCount: 0,
 *   promotionIncluded: true
 * });
 * // Returns: { acceptanceProbability: 68, effectiveness: 'High', ... }
 * ```
 */
export function evaluateCounterOffer(params: CounterOfferParams): CounterOfferResult {
  const {
    currentSalary,
    offerSalary,
    currentBonus,
    offerBonus,
    currentEquity,
    offerEquity,
    employeeRetentionRisk,
    employeeLoyalty,
    counterOfferCount = 0,
    promotionIncluded = false,
    trainingIncluded = false,
  } = params;
  
  // Calculate compensation gaps
  const salaryGap = offerSalary - currentSalary;
  const salaryGapPercent = (salaryGap / currentSalary) * 100;
  
  // Total comp calculations not currently used - may be useful for future analytics
  
  // Recommend matching or exceeding external offer
  const recommendedSalary = Math.round(offerSalary * 1.05); // 5% above offer
  const recommendedBonus = Math.max(offerBonus, currentBonus + 5); // Match or +5%
  const recommendedEquity = Math.max(offerEquity, currentEquity + 0.5); // Match or +0.5%
  
  const compensationImprovement = ((recommendedSalary - currentSalary) / currentSalary) * 100;
  
  // Base acceptance probability
  let acceptanceProbability = 50; // Start at 50/50
  
  // Loyalty factor (higher loyalty = more likely to stay)
  acceptanceProbability += (employeeLoyalty - 50) * 0.5; // ±25% max
  
  // Counter-offer quality (how competitive vs external offer)
  if (recommendedSalary > offerSalary) {
    acceptanceProbability += 20; // Beat external salary
  } else if (recommendedSalary >= offerSalary * 0.98) {
    acceptanceProbability += 10; // Match external salary
  } else {
    acceptanceProbability -= 15; // Below external salary
  }
  
  // Bonus and equity comparison
  if (recommendedBonus >= offerBonus) {
    acceptanceProbability += 5;
  } else {
    acceptanceProbability -= 5;
  }
  
  if (recommendedEquity >= offerEquity) {
    acceptanceProbability += 5;
  } else {
    acceptanceProbability -= 5;
  }
  
  // Non-monetary factors
  if (promotionIncluded) {
    acceptanceProbability += 15; // Promotion adds significant value
  }
  
  if (trainingIncluded) {
    acceptanceProbability += 8; // Training shows investment
  }
  
  // Counter-offer fatigue (diminishing returns)
  acceptanceProbability -= counterOfferCount * 12; // -12% per previous counter-offer
  
  // Retention risk factor (high risk = harder to retain)
  const riskPenalty = (employeeRetentionRisk - 50) * 0.3; // ±15% max
  acceptanceProbability -= riskPenalty;
  
  // Clamp to 0-100
  acceptanceProbability = clamp(acceptanceProbability, 0, 100);
  
  // Determine effectiveness rating
  let effectiveness: CounterOfferResult['effectiveness'];
  if (acceptanceProbability >= 80) {
    effectiveness = 'Very High';
  } else if (acceptanceProbability >= 65) {
    effectiveness = 'High';
  } else if (acceptanceProbability >= 45) {
    effectiveness = 'Medium';
  } else {
    effectiveness = 'Low';
  }
  
  // Generate reasoning
  let reasoning = '';
  if (salaryGapPercent > 20) {
    reasoning += 'Large salary gap makes retention difficult. ';
  }
  if (counterOfferCount > 0) {
    reasoning += 'Previous counter-offers reduce credibility. ';
  }
  if (employeeLoyalty > 70) {
    reasoning += 'High loyalty improves retention chances. ';
  }
  if (employeeRetentionRisk > 75) {
    reasoning += 'High retention risk indicates deep dissatisfaction. ';
  }
  if (promotionIncluded) {
    reasoning += 'Promotion significantly improves offer attractiveness. ';
  }
  
  if (!reasoning) {
    reasoning = 'Competitive counter-offer with reasonable acceptance probability.';
  }
  
  return {
    acceptanceProbability: round(acceptanceProbability, 1),
    compensationImprovement: round(compensationImprovement, 1),
    recommendedSalary,
    recommendedBonus: round(recommendedBonus, 1),
    recommendedEquity: round(recommendedEquity, 2),
    effectiveness,
    reasoning: reasoning.trim(),
  };
}

/**
 * Apply loyalty decay over time
 * 
 * Loyalty naturally decreases without positive reinforcement
 * (raises, promotions, bonuses, recognition). Decay rate increases
 * with low satisfaction and competitor activity.
 * 
 * @param {LoyaltyDecayParams} params - Loyalty decay parameters
 * @returns {number} New loyalty score (0-100)
 * 
 * @example
 * ```typescript
 * const newLoyalty = applyLoyaltyDecay({
 *   currentLoyalty: 75,
 *   monthsSincePositiveEvent: 6,
 *   satisfactionLevel: 60,
 *   competitorActivity: 70
 * });
 * // Returns: ~68 (decay due to time and competitor activity)
 * ```
 */
export function applyLoyaltyDecay(params: LoyaltyDecayParams): number {
  const {
    currentLoyalty,
    monthsSincePositiveEvent,
    satisfactionLevel,
    competitorActivity = 50,
  } = params;
  
  // Base decay: 1-5 points per month depending on satisfaction
  let monthlyDecay = 2; // Base 2 points per month
  
  if (satisfactionLevel < 40) {
    monthlyDecay = 5; // High decay when very dissatisfied
  } else if (satisfactionLevel < 60) {
    monthlyDecay = 3; // Moderate decay when somewhat dissatisfied
  } else if (satisfactionLevel >= 80) {
    monthlyDecay = 1; // Low decay when satisfied
  }
  
  // Competitor activity increases decay
  if (competitorActivity > 80) {
    monthlyDecay += 2; // Heavy poaching pressure
  } else if (competitorActivity > 60) {
    monthlyDecay += 1; // Moderate poaching pressure
  }
  
  // Apply decay
  const totalDecay = monthlyDecay * monthsSincePositiveEvent;
  const newLoyalty = currentLoyalty - totalDecay;
  
  return round(clamp(newLoyalty, 0, 100), 1);
}

/**
 * Calculate optimal retention budget
 * 
 * Determines how much company should invest to retain employee
 * based on replacement cost, employee value, and retention probability.
 * 
 * @param {Object} params - Budget calculation parameters
 * @returns {Object} Recommended retention budget breakdown
 * 
 * @example
 * ```typescript
 * const budget = calculateRetentionBudget({
 *   employeeSalary: 120000,
 *   employeeRole: 'SoftwareEngineer',
 *   revenueGenerated: 500000,
 *   retentionRisk: 80,
 *   yearsWithCompany: 3
 * });
 * // Returns: { maxBudget: 48000, salaryIncrease: 18000, bonus: 15000, ... }
 * ```
 */
export function calculateRetentionBudget(params: {
  employeeSalary: number;
  employeeRole: string;
  revenueGenerated: number;
  retentionRisk: number;
  yearsWithCompany: number;
}): {
  maxBudget: number;
  salaryIncrease: number;
  retentionBonus: number;
  trainingBudget: number;
  totalFirstYear: number;
  reasoning: string;
} {
  const { employeeSalary, retentionRisk, yearsWithCompany } =
    params;
  // revenueGenerated removed - not currently used
  
  // Calculate replacement cost (typically 1.5-2x annual salary)
  const replacementCost = employeeSalary * 1.8;
  
  // Employee value calculation (revenue contribution) not currently used
  // but may be useful for future ROI analytics
  
  // Max budget = lesser of replacement cost or 40% annual salary
  const maxBudget = Math.min(replacementCost, employeeSalary * 0.4);
  
  // Allocate budget based on retention risk
  let salaryIncrease = 0;
  let retentionBonus = 0;
  let trainingBudget = 0;
  
  if (retentionRisk > 80) {
    // High risk: Aggressive retention
    salaryIncrease = employeeSalary * 0.15; // 15% raise
    retentionBonus = employeeSalary * 0.2; // 20% bonus
    trainingBudget = 5000;
  } else if (retentionRisk > 60) {
    // Moderate risk: Competitive retention
    salaryIncrease = employeeSalary * 0.1; // 10% raise
    retentionBonus = employeeSalary * 0.15; // 15% bonus
    trainingBudget = 3000;
  } else if (retentionRisk > 40) {
    // Low risk: Preventive retention
    salaryIncrease = employeeSalary * 0.05; // 5% raise
    retentionBonus = employeeSalary * 0.1; // 10% bonus
    trainingBudget = 2000;
  } else {
    // Very low risk: Minimal investment
    salaryIncrease = employeeSalary * 0.03; // 3% raise
    retentionBonus = 0;
    trainingBudget = 1000;
  }
  
  const totalFirstYear = salaryIncrease + retentionBonus + trainingBudget;
  
  let reasoning = '';
  if (totalFirstYear <= maxBudget) {
    reasoning = `Retention investment (${Math.round(
      totalFirstYear
    )}) is cost-effective compared to replacement (${Math.round(replacementCost)}).`;
  } else {
    reasoning = `Retention investment exceeds budget. Consider alternative strategies or accept turnover risk.`;
  }
  
  if (yearsWithCompany > 5) {
    reasoning += ' Long tenure justifies higher investment.';
  }
  
  return {
    maxBudget: Math.round(maxBudget),
    salaryIncrease: Math.round(salaryIncrease),
    retentionBonus: Math.round(retentionBonus),
    trainingBudget: Math.round(trainingBudget),
    totalFirstYear: Math.round(totalFirstYear),
    reasoning,
  };
}

/**
 * Simulate employee quit decision
 * 
 * Determines if employee quits based on retention risk and random chance.
 * Used for AI-driven turnover events in game simulation.
 * 
 * @param {number} retentionRisk - Current retention risk (0-100)
 * @param {number} monthlyTurnoverRate - Base monthly turnover rate (0-10, typically 1-3)
 * @returns {boolean} True if employee quits
 * 
 * @example
 * ```typescript
 * const quits = simulateQuitDecision(75, 2);
 * // Returns: true/false based on risk calculation
 * ```
 */
export function simulateQuitDecision(
  retentionRisk: number,
  monthlyTurnoverRate: number = 2
): boolean {
  // Base quit probability from monthly turnover rate
  const baseQuitChance = monthlyTurnoverRate / 100; // 2% = 0.02
  
  // Adjust by retention risk (0-100 scale)
  const riskMultiplier = 1 + (retentionRisk / 100) * 4; // 1x to 5x multiplier
  
  const quitProbability = baseQuitChance * riskMultiplier;
  
  // Random roll
  const roll = Math.random();
  
  return roll < quitProbability;
}

/**
 * Get retention status description
 * 
 * Converts retention risk score to human-readable status
 * 
 * @param {number} retentionRisk - Retention risk score (0-100)
 * @returns {Object} Status description and color
 * 
 * @example
 * ```typescript
 * const status = getRetentionStatus(75);
 * // Returns: { level: 'High Risk', color: 'red', description: '...' }
 * ```
 */
export function getRetentionStatus(retentionRisk: number): {
  level: string;
  color: string;
  description: string;
  action: string;
} {
  if (retentionRisk >= 80) {
    return {
      level: 'Critical Risk',
      color: 'red',
      description: 'Employee is very likely to quit soon',
      action: 'Immediate counter-offer required',
    };
  } else if (retentionRisk >= 60) {
    return {
      level: 'High Risk',
      color: 'orange',
      description: 'Employee is actively considering leaving',
      action: 'Proactive retention measures recommended',
    };
  } else if (retentionRisk >= 40) {
    return {
      level: 'Moderate Risk',
      color: 'yellow',
      description: 'Employee may leave if conditions worsen',
      action: 'Monitor satisfaction and consider improvements',
    };
  } else if (retentionRisk >= 20) {
    return {
      level: 'Low Risk',
      color: 'green',
      description: 'Employee is generally satisfied',
      action: 'Maintain current engagement strategies',
    };
  } else {
    return {
      level: 'Very Low Risk',
      color: 'blue',
      description: 'Employee is highly satisfied and loyal',
      action: 'Continue positive practices',
    };
  }
}
