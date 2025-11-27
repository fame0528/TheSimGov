/**
 * @file src/lib/utils/employeePoaching.ts
 * @description Employee poaching mechanics and competitive recruitment system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Competitive employee recruitment system where companies can attempt to poach
 * employees from competitors. Success depends on offer quality, employee satisfaction,
 * poach resistance, company reputation, and timing. Includes anti-poaching mechanics
 * (non-compete clauses, counter-offers, loyalty bonuses).
 * 
 * CORE CONCEPTS:
 * - **Poaching Attempt**: Company makes offer to competitor's employee
 * - **Poach Success Rate**: Probability employee accepts poaching offer
 * - **Poach Resistance**: Employee's resistance to leaving (loyalty + satisfaction)
 * - **Non-Compete Clause**: Contract restriction preventing immediate hiring
 * - **Counter-Offer**: Current employer's retention attempt
 * - **Poaching Cost**: Premium salary + signing bonus + recruitment fees
 * 
 * POACHING MECHANICS:
 * Success Factors (100 point scale):
 * - Offer Quality (40%): How much better is the offer vs current compensation
 * - Employee Dissatisfaction (30%): Current satisfaction level (inverse)
 * - Company Attractiveness (20%): Poaching company's reputation vs current
 * - Timing (10%): Recent negative events, long time since raise
 * 
 * Offer Quality Calculation:
 * - Salary increase: 10-30% above current (higher = better)
 * - Bonus improvement: Better bonus structure
 * - Equity grant: Stock options incentive
 * - Signing bonus: One-time payment (typically 10-20% annual salary)
 * - Role advancement: Promotion/better title
 * - Training opportunities: Skill development commitment
 * 
 * Anti-Poaching Defenses:
 * 1. **Non-Compete Clauses**: Legal restriction (duration, enforceability)
 * 2. **Counter-Offers**: Current employer matches/exceeds poaching offer
 * 3. **Loyalty Programs**: Retention bonuses, vesting schedules
 * 4. **Culture Strength**: High morale and strong team bonds
 * 5. **Golden Handcuffs**: Equity/bonuses that vest over time
 * 
 * USAGE:
 * ```typescript
 * import {
 *   calculatePoachingSuccess,
 *   generatePoachingOffer,
 *   evaluatePoachingAttempt,
 *   checkNonCompete,
 *   calculatePoachingCost
 * } from '@/lib/utils/employeePoaching';
 * 
 * // Attempt to poach employee
 * const attempt = evaluatePoachingAttempt({
 *   targetEmployee: employee,
 *   poachingCompany: myCompany,
 *   currentCompany: theirCompany,
 *   offerSalary: 150000,
 *   offerBonus: 20,
 *   offerEquity: 1.5,
 *   signingBonus: 25000,
 *   promotionIncluded: true
 * });
 * 
 * console.log(`Poaching success rate: ${attempt.successProbability}%`);
 * console.log(`Estimated cost: $${attempt.totalCost}`);
 * 
 * // Check non-compete enforceability
 * const canHire = checkNonCompete(employee, myCompany);
 * if (!canHire.allowed) {
 *   console.log(`Blocked: ${canHire.reason}`);
 * }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Poaching requires 15-30% salary premium to succeed
 * - High satisfaction employees are very difficult to poach (>80 satisfaction)
 * - Non-compete clauses last 6-24 months depending on role/industry
 * - Counter-offers reduce poaching success by 30-50%
 * - Multiple poaching attempts on same employee increase resistance
 * - Poaching failures damage company reputation
 * - Successful poaches may trigger retaliation (competitor poaches back)
 * - Poached employees have lower initial loyalty (trust issues)
 * - Industry-specific poaching ethics (some industries more aggressive)
 * - Poaching costs 1.5-2x employee's annual salary (premium + fees + integration)
 */

import { clamp, round } from './math';
// Satisfaction calculation utilities
// import { calculateSatisfaction, type SatisfactionParams } from './employeeRetention';

/**
 * Poaching attempt parameters
 */
export interface PoachingAttemptParams {
  // Target employee details
  employeeCurrentSalary: number;
  employeeCurrentBonus: number;
  employeeCurrentEquity: number;
  employeeSatisfaction: number; // 0-100
  employeeLoyalty: number; // 0-100
  employeeRole: string;
  employeeYearsWithCompany: number;
  
  // Current company details
  currentCompanyReputation: number; // 0-100
  currentCompanyRevenue: number;
  
  // Poaching company details
  poachingCompanyReputation: number; // 0-100
  poachingCompanyRevenue: number;
  
  // Poaching offer
  offerSalary: number;
  offerBonus: number;
  offerEquity: number;
  signingBonus?: number;
  promotionIncluded?: boolean;
  trainingIncluded?: boolean;
  
  // Context
  nonCompeteActive?: boolean;
  previousPoachAttempts?: number;
  recentNegativeEvents?: number; // Layoffs, pay cuts, etc.
}

/**
 * Poaching attempt result
 */
export interface PoachingAttemptResult {
  successProbability: number; // 0-100
  totalCost: number;
  salaryPremiumPercent: number;
  offerQualityScore: number;
  employeeResistance: number;
  companyAttractivenessGap: number;
  recommendation: 'Highly Likely' | 'Likely' | 'Uncertain' | 'Unlikely' | 'Very Unlikely';
  reasoning: string;
  risks: string[];
  counterOfferProbability: number;
}

/**
 * Non-compete check result
 */
export interface NonCompeteCheckResult {
  allowed: boolean;
  reason?: string;
  expiryDate?: Date;
  buyoutCost?: number; // Cost to legally buyout the clause
  enforceability: number; // 0-100 (how enforceable the clause is)
}

/**
 * Poaching offer generation parameters
 */
export interface PoachingOfferParams {
  targetSalary: number;
  targetRole: string;
  industry: string;
  aggressiveness: 'Conservative' | 'Competitive' | 'Aggressive' | 'Very Aggressive';
}

/**
 * Generate competitive poaching offer
 * 
 * Creates a poaching offer based on target salary and aggressiveness level.
 * More aggressive = higher premium but also higher cost and risk.
 * 
 * @param {PoachingOfferParams} params - Offer generation parameters
 * @returns {Object} Recommended poaching offer details
 * 
 * @example
 * ```typescript
 * const offer = generatePoachingOffer({
 *   targetSalary: 120000,
 *   targetRole: 'SoftwareEngineer',
 *   industry: 'Technology',
 *   aggressiveness: 'Aggressive'
 * });
 * // Returns: { salary: 156000, bonus: 18, equity: 1.2, signingBonus: 30000, ... }
 * ```
 */
export function generatePoachingOffer(params: PoachingOfferParams): {
  salary: number;
  bonus: number;
  equity: number;
  signingBonus: number;
  totalFirstYear: number;
  premiumPercent: number;
} {
  const { targetSalary, targetRole, industry, aggressiveness } = params;
  
  // Salary premium based on aggressiveness
  let salaryMultiplier = 1.15; // Conservative: 15% increase
  let bonusIncrease = 5;
  let equityGrant = 0.5;
  let signingBonusMultiplier = 0.1;
  
  if (aggressiveness === 'Competitive') {
    salaryMultiplier = 1.20; // 20% increase
    bonusIncrease = 8;
    equityGrant = 0.8;
    signingBonusMultiplier = 0.15;
  } else if (aggressiveness === 'Aggressive') {
    salaryMultiplier = 1.30; // 30% increase
    bonusIncrease = 12;
    equityGrant = 1.2;
    signingBonusMultiplier = 0.20;
  } else if (aggressiveness === 'Very Aggressive') {
    salaryMultiplier = 1.40; // 40% increase
    bonusIncrease = 15;
    equityGrant = 1.5;
    signingBonusMultiplier = 0.25;
  }
  
  // Industry adjustments (competitive industries require higher offers)
  if (industry === 'Technology' || industry === 'Finance') {
    salaryMultiplier += 0.05;
    equityGrant += 0.3;
  }
  
  // Role adjustments (executives require higher premiums)
  if (targetRole === 'Executive' || targetRole === 'Manager') {
    salaryMultiplier += 0.05;
    bonusIncrease += 5;
  }
  
  const offerSalary = Math.round(targetSalary * salaryMultiplier);
  const offerBonus = bonusIncrease; // Percentage points
  const offerEquity = round(equityGrant, 2);
  const signingBonus = Math.round(targetSalary * signingBonusMultiplier);
  
  const totalFirstYear = offerSalary + signingBonus;
  const premiumPercent = ((offerSalary - targetSalary) / targetSalary) * 100;
  
  return {
    salary: offerSalary,
    bonus: offerBonus,
    equity: offerEquity,
    signingBonus,
    totalFirstYear,
    premiumPercent: round(premiumPercent, 1),
  };
}

/**
 * Calculate poaching success probability
 * 
 * Determines likelihood of successful poaching attempt based on
 * offer quality, employee satisfaction, and company attractiveness.
 * 
 * @param {PoachingAttemptParams} params - Poaching attempt parameters
 * @returns {number} Success probability (0-100)
 * 
 * @example
 * ```typescript
 * const successRate = calculatePoachingSuccess({
 *   employeeCurrentSalary: 100000,
 *   employeeSatisfaction: 55,
 *   offerSalary: 130000,
 *   poachingCompanyReputation: 85,
 *   // ... other params
 * });
 * // Returns: ~72 (good chance of success)
 * ```
 */
export function calculatePoachingSuccess(params: PoachingAttemptParams): number {
  const {
    employeeCurrentSalary,
    employeeCurrentBonus,
    employeeCurrentEquity,
    employeeSatisfaction,
    employeeLoyalty,
    employeeYearsWithCompany,
    currentCompanyReputation,
    poachingCompanyReputation,
    offerSalary,
    offerBonus,
    offerEquity,
    signingBonus = 0,
    promotionIncluded = false,
    trainingIncluded = false,
    nonCompeteActive = false,
    previousPoachAttempts = 0,
    recentNegativeEvents = 0,
  } = params;
  
  // 1. Offer Quality Score (40% weight)
  const salaryIncrease = ((offerSalary - employeeCurrentSalary) / employeeCurrentSalary) * 100;
  let offerQualityScore = 0;
  
  if (salaryIncrease >= 40) {
    offerQualityScore = 100; // 40%+ increase = excellent
  } else if (salaryIncrease >= 30) {
    offerQualityScore = 90;
  } else if (salaryIncrease >= 20) {
    offerQualityScore = 75;
  } else if (salaryIncrease >= 15) {
    offerQualityScore = 60;
  } else if (salaryIncrease >= 10) {
    offerQualityScore = 40; // Minimal increase
  } else {
    offerQualityScore = 10; // Insufficient increase
  }
  
  // Bonus and equity improvements
  const bonusImprovement = offerBonus - employeeCurrentBonus;
  const equityImprovement = offerEquity - employeeCurrentEquity;
  
  if (bonusImprovement >= 10) offerQualityScore += 10;
  else if (bonusImprovement >= 5) offerQualityScore += 5;
  
  if (equityImprovement >= 1.0) offerQualityScore += 10;
  else if (equityImprovement >= 0.5) offerQualityScore += 5;
  
  // Signing bonus boost
  const signingBonusPercent = (signingBonus / employeeCurrentSalary) * 100;
  if (signingBonusPercent >= 20) offerQualityScore += 15;
  else if (signingBonusPercent >= 10) offerQualityScore += 8;
  
  // Non-monetary factors
  if (promotionIncluded) offerQualityScore += 10;
  if (trainingIncluded) offerQualityScore += 5;
  
  offerQualityScore = clamp(offerQualityScore, 0, 100);
  
  // 2. Employee Dissatisfaction (30% weight)
  const dissatisfactionScore = 100 - employeeSatisfaction;
  
  // 3. Company Attractiveness Gap (20% weight)
  const reputationGap = poachingCompanyReputation - currentCompanyReputation;
  let attractivenessScore = 50; // Neutral baseline
  
  if (reputationGap >= 30) {
    attractivenessScore = 100; // Much better company
  } else if (reputationGap >= 20) {
    attractivenessScore = 85;
  } else if (reputationGap >= 10) {
    attractivenessScore = 70;
  } else if (reputationGap >= 0) {
    attractivenessScore = 55; // Slightly better or equal
  } else if (reputationGap >= -10) {
    attractivenessScore = 40; // Slightly worse
  } else {
    attractivenessScore = 20; // Worse company
  }
  
  // 4. Timing Factors (10% weight)
  let timingScore = 50; // Neutral baseline
  
  // Recent negative events boost poaching success
  timingScore += recentNegativeEvents * 15; // +15 per negative event
  
  // Long tenure creates resistance
  if (employeeYearsWithCompany > 10) {
    timingScore -= 20;
  } else if (employeeYearsWithCompany > 5) {
    timingScore -= 10;
  } else if (employeeYearsWithCompany < 1) {
    timingScore += 10; // New employees easier to poach
  }
  
  timingScore = clamp(timingScore, 0, 100);
  
  // Calculate weighted success probability
  let successProbability =
    offerQualityScore * 0.4 +
    dissatisfactionScore * 0.3 +
    attractivenessScore * 0.2 +
    timingScore * 0.1;
  
  // Apply resistance factors
  
  // Loyalty resistance (high loyalty = harder to poach)
  const loyaltyPenalty = (employeeLoyalty / 100) * 25; // Up to -25%
  successProbability -= loyaltyPenalty;
  
  // Non-compete clause (legal barrier)
  if (nonCompeteActive) {
    successProbability *= 0.3; // -70% (very difficult to poach)
  }
  
  // Previous failed attempts create skepticism
  successProbability -= previousPoachAttempts * 10; // -10% per previous attempt
  
  return round(clamp(successProbability, 0, 100), 1);
}

/**
 * Evaluate complete poaching attempt
 * 
 * Comprehensive analysis of poaching attempt including success probability,
 * costs, risks, and recommendations.
 * 
 * @param {PoachingAttemptParams} params - Poaching attempt parameters
 * @returns {PoachingAttemptResult} Complete evaluation with recommendations
 * 
 * @example
 * ```typescript
 * const evaluation = evaluatePoachingAttempt({
 *   employeeCurrentSalary: 100000,
 *   employeeSatisfaction: 60,
 *   offerSalary: 130000,
 *   signingBonus: 20000,
 *   // ... all params
 * });
 * // Returns: { successProbability: 68, totalCost: 170000, ... }
 * ```
 */
export function evaluatePoachingAttempt(
  params: PoachingAttemptParams
): PoachingAttemptResult {
  const {
    employeeCurrentSalary,
    employeeSatisfaction,
    employeeLoyalty,
    offerSalary,
    signingBonus = 0,
    currentCompanyReputation,
    poachingCompanyReputation,
  } = params;
  
  // Calculate success probability
  const successProbability = calculatePoachingSuccess(params);
  
  // Calculate total cost
  const recruitmentFees = offerSalary * 0.15; // 15% recruitment fees
  const integrationCost = offerSalary * 0.1; // 10% onboarding/training
  const totalCost = offerSalary + signingBonus + recruitmentFees + integrationCost;
  
  // Calculate metrics
  const salaryPremiumPercent = ((offerSalary - employeeCurrentSalary) / employeeCurrentSalary) * 100;
  const offerQualityScore = (salaryPremiumPercent / 30) * 100; // 30% = 100 score
  const employeeResistance = (employeeSatisfaction + employeeLoyalty) / 2;
  const companyAttractivenessGap = poachingCompanyReputation - currentCompanyReputation;
  
  // Determine recommendation
  let recommendation: PoachingAttemptResult['recommendation'];
  if (successProbability >= 80) {
    recommendation = 'Highly Likely';
  } else if (successProbability >= 65) {
    recommendation = 'Likely';
  } else if (successProbability >= 45) {
    recommendation = 'Uncertain';
  } else if (successProbability >= 25) {
    recommendation = 'Unlikely';
  } else {
    recommendation = 'Very Unlikely';
  }
  
  // Identify risks
  const risks: string[] = [];
  
  if (employeeLoyalty > 75) {
    risks.push('High employee loyalty may resist poaching');
  }
  
  if (employeeSatisfaction > 80) {
    risks.push('Employee is highly satisfied with current role');
  }
  
  if (params.nonCompeteActive) {
    risks.push('Active non-compete clause creates legal barriers');
  }
  
  if (salaryPremiumPercent < 15) {
    risks.push('Salary increase may be insufficient to motivate switch');
  }
  
  if (companyAttractivenessGap < 0) {
    risks.push('Poaching company has lower reputation than current employer');
  }
  
  if (params.previousPoachAttempts && params.previousPoachAttempts > 0) {
    risks.push('Previous failed attempts reduce credibility');
  }
  
  // Counter-offer probability (current employer may try to retain)
  let counterOfferProbability = 30; // Base 30%
  
  if (employeeSatisfaction > 70) {
    counterOfferProbability += 25; // High satisfaction = likely counter-offer
  }
  
  if (employeeLoyalty > 70) {
    counterOfferProbability += 20;
  }
  
  if (params.employeeYearsWithCompany > 5) {
    counterOfferProbability += 15; // Long tenure = valuable employee
  }
  
  counterOfferProbability = clamp(counterOfferProbability, 0, 100);
  
  // Generate reasoning
  let reasoning = '';
  
  if (successProbability >= 70) {
    reasoning = `Strong poaching offer (${salaryPremiumPercent.toFixed(1)}% increase) with favorable conditions. `;
  } else if (successProbability >= 50) {
    reasoning = `Moderate poaching potential. Success depends on timing and employee's current mindset. `;
  } else {
    reasoning = `Low poaching probability due to employee resistance and/or weak offer. `;
  }
  
  if (counterOfferProbability > 60) {
    reasoning += `High risk of counter-offer (${counterOfferProbability}%). `;
  }
  
  if (risks.length > 0) {
    reasoning += `Key risks: ${risks.slice(0, 2).join(', ')}.`;
  }
  
  return {
    successProbability: round(successProbability, 1),
    totalCost: Math.round(totalCost),
    salaryPremiumPercent: round(salaryPremiumPercent, 1),
    offerQualityScore: round(clamp(offerQualityScore, 0, 100), 1),
    employeeResistance: round(employeeResistance, 1),
    companyAttractivenessGap: round(companyAttractivenessGap, 1),
    recommendation,
    reasoning: reasoning.trim(),
    risks,
    counterOfferProbability: round(counterOfferProbability, 1),
  };
}

/**
 * Check non-compete clause enforceability
 * 
 * Determines if employee can be legally hired given non-compete status.
 * Evaluates clause duration, scope, enforceability, and buyout options.
 * 
 * @param {Object} params - Non-compete check parameters
 * @returns {NonCompeteCheckResult} Enforceability assessment
 * 
 * @example
 * ```typescript
 * const check = checkNonCompete({
 *   hasNonCompete: true,
 *   signedDate: new Date('2023-06-01'),
 *   durationMonths: 12,
 *   industry: 'Technology',
 *   role: 'SoftwareEngineer',
 *   state: 'California'
 * });
 * // Returns: { allowed: false, reason: '...', buyoutCost: 50000 }
 * ```
 */
export function checkNonCompete(params: {
  hasNonCompete: boolean;
  signedDate?: Date;
  durationMonths?: number;
  industry?: string;
  role?: string;
  state?: string;
  currentSalary?: number;
}): NonCompeteCheckResult {
  const {
    hasNonCompete,
    signedDate,
    durationMonths = 12,
    industry,
    role,
    state,
    currentSalary = 100000,
  } = params;
  
  // No non-compete = always allowed
  if (!hasNonCompete || !signedDate) {
    return {
      allowed: true,
      enforceability: 0,
    };
  }
  
  // Calculate expiry date
  const expiryDate = new Date(signedDate);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
  
  // Check if expired
  const now = new Date();
  if (now >= expiryDate) {
    return {
      allowed: true,
      expiryDate,
      enforceability: 0,
    };
  }
  
  // Determine enforceability (varies by state/industry)
  let enforceability = 70; // Base enforceability
  
  // State-specific rules (some states ban non-competes)
  if (state === 'California') {
    enforceability = 10; // Generally unenforceable
  } else if (state === 'Colorado' || state === 'Oklahoma') {
    enforceability = 20; // Limited enforceability
  } else if (state === 'Massachusetts' || state === 'Oregon') {
    enforceability = 50; // Moderate (recent reforms)
  }
  
  // Industry-specific (tech often less enforceable)
  if (industry === 'Technology') {
    enforceability -= 15;
  } else if (industry === 'Finance') {
    enforceability += 10; // More enforceable in finance
  }
  
  // Role-specific (executives more enforceable)
  if (role === 'Executive' || role === 'SalesManager') {
    enforceability += 15;
  } else if (role === 'SoftwareEngineer' || role === 'Designer') {
    enforceability -= 10; // Less enforceable for IC roles
  }
  
  // Duration (longer = less enforceable)
  if (durationMonths > 24) {
    enforceability -= 20; // 2+ years often unreasonable
  } else if (durationMonths > 12) {
    enforceability -= 10;
  }
  
  enforceability = clamp(enforceability, 0, 100);
  
  // Calculate buyout cost (if company wants to negotiate)
  const monthsRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const buyoutCost = Math.round(currentSalary * 0.5 * (monthsRemaining / 12)); // ~50% annual salary prorated
  
  // Determine if allowed
  const allowed = enforceability < 30; // Low enforceability = can hire
  
  let reason = '';
  if (!allowed) {
    reason = `Non-compete clause active until ${expiryDate.toLocaleDateString()}. `;
    reason += `Enforceability: ${enforceability}%. `;
    reason += `Buyout option available for $${buyoutCost.toLocaleString()}.`;
  }
  
  return {
    allowed,
    reason: reason || undefined,
    expiryDate,
    buyoutCost: allowed ? undefined : buyoutCost,
    enforceability: round(enforceability, 1),
  };
}

/**
 * Calculate total poaching cost
 * 
 * Comprehensive cost calculation including salary, bonuses, fees, and risks.
 * 
 * @param {Object} params - Cost calculation parameters
 * @returns {Object} Detailed cost breakdown
 * 
 * @example
 * ```typescript
 * const cost = calculatePoachingCost({
 *   offerSalary: 150000,
 *   signingBonus: 30000,
 *   recruitmentFees: true,
 *   successProbability: 70
 * });
 * // Returns: { totalCost: 225000, expectedCost: 157500, breakdown: {...} }
 * ```
 */
export function calculatePoachingCost(params: {
  offerSalary: number;
  signingBonus?: number;
  equityValue?: number;
  recruitmentFees?: boolean;
  integrationCost?: boolean;
  successProbability: number;
}): {
  totalCost: number;
  expectedCost: number;
  breakdown: {
    salary: number;
    signingBonus: number;
    equity: number;
    recruitment: number;
    integration: number;
    risk: number;
  };
} {
  const {
    offerSalary,
    signingBonus = 0,
    equityValue = 0,
    recruitmentFees = true,
    integrationCost = true,
    successProbability,
  } = params;
  
  const recruitment = recruitmentFees ? offerSalary * 0.15 : 0;
  const integration = integrationCost ? offerSalary * 0.1 : 0;
  
  // Risk cost (if attempt fails, still pay some fees)
  const failureProbability = 100 - successProbability;
  const riskCost = (recruitment * 0.5) * (failureProbability / 100); // Partial fees if failed
  
  const totalCost = offerSalary + signingBonus + equityValue + recruitment + integration;
  const expectedCost = totalCost * (successProbability / 100) + riskCost;
  
  return {
    totalCost: Math.round(totalCost),
    expectedCost: Math.round(expectedCost),
    breakdown: {
      salary: offerSalary,
      signingBonus,
      equity: equityValue,
      recruitment: Math.round(recruitment),
      integration: Math.round(integration),
      risk: Math.round(riskCost),
    },
  };
}

/**
 * Simulate poaching attempt outcome
 * 
 * Random outcome based on success probability.
 * Used for AI-driven poaching events.
 * 
 * @param {number} successProbability - Success probability (0-100)
 * @returns {Object} Attempt outcome
 * 
 * @example
 * ```typescript
 * const outcome = simulatePoachingAttempt(72);
 * // Returns: { success: true, counterOffer: false }
 * ```
 */
export function simulatePoachingAttempt(
  successProbability: number,
  counterOfferProbability: number = 40
): {
  success: boolean;
  counterOffered: boolean;
  outcome: 'Accepted' | 'Rejected' | 'Counter-Offered';
} {
  const roll = Math.random() * 100;
  
  if (roll < successProbability) {
    // Success - employee accepts
    return {
      success: true,
      counterOffered: false,
      outcome: 'Accepted',
    };
  }
  
  // Failed - check if counter-offer attempted
  const counterRoll = Math.random() * 100;
  const counterOffered = counterRoll < counterOfferProbability;
  
  return {
    success: false,
    counterOffered,
    outcome: counterOffered ? 'Counter-Offered' : 'Rejected',
  };
}

/**
 * Get poaching difficulty description
 * 
 * Converts success probability to human-readable difficulty
 * 
 * @param {number} successProbability - Success probability (0-100)
 * @returns {Object} Difficulty description
 * 
 * @example
 * ```typescript
 * const difficulty = getPoachingDifficulty(35);
 * // Returns: { level: 'Hard', color: 'orange', description: '...' }
 * ```
 */
export function getPoachingDifficulty(successProbability: number): {
  level: string;
  color: string;
  description: string;
} {
  if (successProbability >= 80) {
    return {
      level: 'Very Easy',
      color: 'green',
      description: 'Employee is very likely to accept offer',
    };
  } else if (successProbability >= 65) {
    return {
      level: 'Easy',
      color: 'lightgreen',
      description: 'Good chance of successful poaching',
    };
  } else if (successProbability >= 45) {
    return {
      level: 'Moderate',
      color: 'yellow',
      description: 'Uncertain outcome, depends on timing and counter-offers',
    };
  } else if (successProbability >= 25) {
    return {
      level: 'Hard',
      color: 'orange',
      description: 'Low probability, employee is resistant or well-compensated',
    };
  } else {
    return {
      level: 'Very Hard',
      color: 'red',
      description: 'Very unlikely to succeed, not recommended',
    };
  }
}
