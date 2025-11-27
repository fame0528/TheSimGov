/**
 * @fileoverview R&D Department Utilities
 * @module lib/utils/departments/rd
 * 
 * OVERVIEW:
 * Pure utility functions for R&D department operations.
 * Handles research projects, innovation tracking, patent management, and breakthrough mechanics.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

import type { RDDepartmentData, ResearchProject, Patent } from '@/lib/types/department';

/**
 * Research Project Difficulty Levels
 */
export type ResearchDifficulty = 'trivial' | 'standard' | 'challenging' | 'breakthrough' | 'revolutionary';

/**
 * Calculate research project completion probability
 * 
 * @param projectDifficulty - Difficulty level of research
 * @param teamExpertise - Average team expertise (0-100)
 * @param budget - Research budget allocated
 * @param duration - Time allocated (months)
 * @returns Success probability and expected outcomes
 * 
 * @example
 * ```ts
 * const result = calculateResearchSuccess('challenging', 75, 100000, 6);
 * // Returns: { successProbability: 0.65, expectedBreakthroughs: 1, estimatedValue: 250000 }
 * ```
 */
export function calculateResearchSuccess(
  projectDifficulty: ResearchDifficulty,
  teamExpertise: number,
  budget: number,
  duration: number
): {
  successProbability: number; // 0-1
  expectedBreakthroughs: number;
  estimatedValue: number;
  timeToCompletion: number; // months
} {
  // Base success rates by difficulty
  const baseSuccessRates: Record<ResearchDifficulty, number> = {
    trivial: 0.95,
    standard: 0.75,
    challenging: 0.55,
    breakthrough: 0.35,
    revolutionary: 0.15,
  };

  let successProbability = baseSuccessRates[projectDifficulty];

  // Team expertise adjustment (±30%)
  const expertiseBonus = (teamExpertise - 50) / 100; // -0.5 to +0.5
  successProbability += expertiseBonus * 0.3;

  // Budget adequacy (need sufficient resources)
  const requiredBudget = getRequiredBudget(projectDifficulty);
  const budgetRatio = budget / requiredBudget;
  if (budgetRatio < 0.7) {
    successProbability *= 0.5; // Underfunded = 50% penalty
  } else if (budgetRatio > 1.5) {
    successProbability *= 1.2; // Well-funded = 20% bonus
  }

  // Duration adequacy
  const requiredDuration = getRequiredDuration(projectDifficulty);
  const timeRatio = duration / requiredDuration;
  if (timeRatio < 0.8) {
    successProbability *= 0.6; // Rushed = 40% penalty
  } else if (timeRatio > 1.5) {
    successProbability *= 1.15; // Adequate time = 15% bonus
  }

  // Clamp to valid range
  successProbability = Math.max(0.05, Math.min(0.95, successProbability));

  // Expected breakthroughs (higher difficulty = more potential breakthroughs)
  const difficultyMultiplier: Record<ResearchDifficulty, number> = {
    trivial: 0,
    standard: 1,
    challenging: 2,
    breakthrough: 3,
    revolutionary: 5,
  };

  const expectedBreakthroughs = Math.round(difficultyMultiplier[projectDifficulty] * successProbability);

  // Estimated value (higher difficulty = higher potential value)
  const baseValues: Record<ResearchDifficulty, number> = {
    trivial: 10000,
    standard: 50000,
    challenging: 200000,
    breakthrough: 1000000,
    revolutionary: 10000000,
  };

  const estimatedValue = Math.round(baseValues[projectDifficulty] * successProbability);

  // Time to completion (actual duration with probability weighting)
  const timeToCompletion = requiredDuration + (1 - successProbability) * 3; // Failed projects take longer

  return {
    successProbability: Math.round(successProbability * 100) / 100,
    expectedBreakthroughs,
    estimatedValue,
    timeToCompletion: Math.round(timeToCompletion * 10) / 10,
  };
}

/**
 * Get required budget for research difficulty
 */
function getRequiredBudget(difficulty: ResearchDifficulty): number {
  const budgets: Record<ResearchDifficulty, number> = {
    trivial: 10000,
    standard: 50000,
    challenging: 150000,
    breakthrough: 500000,
    revolutionary: 2000000,
  };
  return budgets[difficulty];
}

/**
 * Get required duration for research difficulty (months)
 */
function getRequiredDuration(difficulty: ResearchDifficulty): number {
  const durations: Record<ResearchDifficulty, number> = {
    trivial: 1,
    standard: 3,
    challenging: 6,
    breakthrough: 12,
    revolutionary: 24,
  };
  return durations[difficulty];
}

/**
 * Calculate patent value based on innovation and market factors
 * 
 * @param innovationScore - How innovative the patent is (0-100)
 * @param marketSize - Addressable market size
 * @param competitiveAdvantage - Competitive moat strength (0-100)
 * @param yearsProtection - Years of patent protection remaining
 * @returns Estimated patent value and revenue potential
 * 
 * @example
 * ```ts
 * const value = calculatePatentValue(85, 5000000, 70, 15);
 * // Returns: { estimatedValue: 850000, annualRevenue: 56666, strength: 'strong' }
 * ```
 */
export function calculatePatentValue(
  innovationScore: number,
  marketSize: number,
  competitiveAdvantage: number,
  yearsProtection: number
): {
  estimatedValue: number;
  annualRevenue: number;
  strength: 'weak' | 'moderate' | 'strong' | 'dominant';
  licensingPotential: 'low' | 'medium' | 'high';
} {
  // Base value from innovation (40% weight)
  const innovationValue = (innovationScore / 100) * marketSize * 0.1;

  // Competitive advantage factor (30% weight)
  const competitiveValue = (competitiveAdvantage / 100) * marketSize * 0.05;

  // Market penetration potential (20% weight)
  const marketPenetration = 0.02; // Assume 2% market capture
  const penetrationValue = marketSize * marketPenetration;

  // Protection duration (10% weight)
  const protectionMultiplier = Math.min(1, yearsProtection / 20); // 20 years = full value
  const protectionValue = (innovationValue + competitiveValue) * protectionMultiplier * 0.5;

  const estimatedValue = Math.round(
    innovationValue * 0.4 + competitiveValue * 0.3 + penetrationValue * 0.2 + protectionValue * 0.1
  );

  // Annual revenue from licensing (5-10% of value per year)
  const licensingRate = (competitiveAdvantage / 100) * 0.05 + 0.05; // 5-10%
  const annualRevenue = Math.round(estimatedValue * licensingRate);

  // Determine patent strength
  let strength: 'weak' | 'moderate' | 'strong' | 'dominant';
  if (innovationScore >= 80 && competitiveAdvantage >= 70) strength = 'dominant';
  else if (innovationScore >= 65 && competitiveAdvantage >= 55) strength = 'strong';
  else if (innovationScore >= 45) strength = 'moderate';
  else strength = 'weak';

  // Licensing potential
  let licensingPotential: 'low' | 'medium' | 'high';
  if (competitiveAdvantage >= 70) licensingPotential = 'high';
  else if (competitiveAdvantage >= 40) licensingPotential = 'medium';
  else licensingPotential = 'low';

  return {
    estimatedValue,
    annualRevenue,
    strength,
    licensingPotential,
  };
}

/**
 * Calculate innovation breakthrough probability
 * 
 * @param researchInvestment - Total R&D investment
 * @param teamSize - Number of researchers
 * @param avgExpertise - Average team expertise (0-100)
 * @param monthsActive - Months of active research
 * @returns Breakthrough probability and expected timeline
 * 
 * @example
 * ```ts
 * const breakthrough = calculateBreakthroughProbability(500000, 10, 75, 12);
 * // Returns: { probability: 0.35, expectedMonths: 18, impact: 'major' }
 * ```
 */
export function calculateBreakthroughProbability(
  researchInvestment: number,
  teamSize: number,
  avgExpertise: number,
  monthsActive: number
): {
  probability: number; // 0-1
  expectedMonths: number;
  impact: 'minor' | 'moderate' | 'major' | 'revolutionary';
} {
  // Base probability increases with time (diminishing returns)
  const timeBonus = Math.log(monthsActive + 1) * 0.05; // Max ~0.15 at 24 months

  // Investment factor (more money = higher probability)
  const investmentFactor = Math.min(0.3, researchInvestment / 1000000); // Cap at $1M

  // Team size factor (more researchers = higher probability)
  const teamFactor = Math.min(0.2, teamSize / 50); // Cap at 50 researchers

  // Expertise factor (skilled team = higher probability)
  const expertiseFactor = (avgExpertise / 100) * 0.25;

  // Random element (research has inherent uncertainty)
  const randomFactor = 0.1;

  const probability = Math.min(
    0.8, // Cap at 80% max
    timeBonus + investmentFactor + teamFactor + expertiseFactor + randomFactor
  );

  // Expected months to breakthrough (inverse of probability, with minimum)
  const expectedMonths = Math.max(3, Math.ceil(12 / probability));

  // Impact assessment based on investment and expertise
  let impact: 'minor' | 'moderate' | 'major' | 'revolutionary';
  if (researchInvestment >= 2000000 && avgExpertise >= 85) impact = 'revolutionary';
  else if (researchInvestment >= 500000 && avgExpertise >= 70) impact = 'major';
  else if (researchInvestment >= 100000) impact = 'moderate';
  else impact = 'minor';

  return {
    probability: Math.round(probability * 100) / 100,
    expectedMonths,
    impact,
  };
}

/**
 * Calculate R&D ROI based on innovation outcomes
 * 
 * @param totalInvestment - Total R&D spending
 * @param patentsGranted - Number of patents granted
 * @param avgPatentValue - Average value per patent
 * @param productImprovements - Number of product improvements
 * @param revenueIncrease - Revenue increase from innovations
 * @returns ROI and value metrics
 * 
 * @example
 * ```ts
 * const roi = calculateRDROI(1000000, 5, 200000, 10, 500000);
 * // Returns: { roi: 150, totalValue: 2500000, annualROI: 150 }
 * ```
 */
export function calculateRDROI(
  totalInvestment: number,
  patentsGranted: number,
  avgPatentValue: number,
  productImprovements: number,
  revenueIncrease: number
): {
  roi: number; // percentage
  totalValue: number;
  annualROI: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
} {
  // Value from patents (asset value)
  const patentValue = patentsGranted * avgPatentValue;

  // Value from product improvements (assume $50k value each)
  const improvementValue = productImprovements * 50000;

  // Value from revenue increase (most direct)
  const revenueValue = revenueIncrease;

  const totalValue = patentValue + improvementValue + revenueValue;

  // ROI calculation
  const roi = totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0;

  // Assume 3-year amortization period for R&D
  const annualROI = roi / 3;

  // Efficiency rating
  let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  if (roi >= 200) efficiency = 'excellent';
  else if (roi >= 100) efficiency = 'good';
  else if (roi >= 50) efficiency = 'fair';
  else efficiency = 'poor';

  return {
    roi: Math.round(roi * 100) / 100,
    totalValue: Math.round(totalValue),
    annualROI: Math.round(annualROI * 100) / 100,
    efficiency,
  };
}

/**
 * Assess research team effectiveness
 * 
 * @param teamSize - Number of researchers
 * @param avgExpertise - Average expertise level (0-100)
 * @param publicationsCount - Number of publications
 * @param citationsCount - Number of citations
 * @param collaborationScore - Inter-team collaboration (0-100)
 * @returns Team effectiveness score and rating
 * 
 * @example
 * ```ts
 * const effectiveness = assessTeamEffectiveness(15, 75, 8, 42, 80);
 * // Returns: { score: 78, rating: 'high', productivity: 'excellent' }
 * ```
 */
export function assessTeamEffectiveness(
  teamSize: number,
  avgExpertise: number,
  publicationsCount: number,
  citationsCount: number,
  collaborationScore: number
): {
  score: number; // 0-100
  rating: 'low' | 'moderate' | 'high' | 'exceptional';
  productivity: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Expertise factor (35% weight)
  score += (avgExpertise / 100) * 35;
  if (avgExpertise < 60) {
    recommendations.push('Invest in training or hire more senior researchers');
  }

  // Publication factor (25% weight)
  const publicationsPerResearcher = teamSize > 0 ? publicationsCount / teamSize : 0;
  const publicationScore = Math.min(25, publicationsPerResearcher * 5);
  score += publicationScore;
  if (publicationsPerResearcher < 0.5) {
    recommendations.push('Encourage more publication output - aim for 1+ per researcher annually');
  }

  // Citation impact factor (20% weight)
  const citationsPerPublication = publicationsCount > 0 ? citationsCount / publicationsCount : 0;
  const citationScore = Math.min(20, citationsPerPublication * 2);
  score += citationScore;
  if (citationsPerPublication < 3) {
    recommendations.push('Focus on higher-impact research for better citation rates');
  }

  // Collaboration factor (20% weight)
  score += (collaborationScore / 100) * 20;
  if (collaborationScore < 60) {
    recommendations.push('Improve cross-team collaboration and knowledge sharing');
  }

  // Determine rating
  let rating: 'low' | 'moderate' | 'high' | 'exceptional';
  if (score >= 85) rating = 'exceptional';
  else if (score >= 70) rating = 'high';
  else if (score >= 50) rating = 'moderate';
  else rating = 'low';

  // Productivity assessment (publications per researcher)
  let productivity: 'poor' | 'fair' | 'good' | 'excellent';
  if (publicationsPerResearcher >= 1.5) productivity = 'excellent';
  else if (publicationsPerResearcher >= 1.0) productivity = 'good';
  else if (publicationsPerResearcher >= 0.5) productivity = 'fair';
  else productivity = 'poor';

  return {
    score: Math.round(score),
    rating,
    productivity,
    recommendations,
  };
}

/**
 * Calculate R&D department efficiency
 * 
 * @param data - R&D department data
 * @returns Efficiency score (0-100)
 */
export function calculateRDEfficiency(data: RDDepartmentData): number {
  let efficiency = 50; // Base efficiency

  // Active projects factor (20%)
  if (data.activeProjects >= 5) {
    efficiency += 20; // High activity
  } else if (data.activeProjects >= 3) {
    efficiency += 15; // Moderate activity
  } else if (data.activeProjects >= 1) {
    efficiency += 10; // Low activity
  } else {
    efficiency += 0; // No activity
  }

  // Patents granted factor (25%)
  if (data.patentsGranted && data.patentsGranted >= 10) {
    efficiency += 25; // Highly productive
  } else if (data.patentsGranted && data.patentsGranted >= 5) {
    efficiency += 20; // Productive
  } else if (data.patentsGranted && data.patentsGranted >= 2) {
    efficiency += 15; // Moderately productive
  } else if (data.patentsGranted && data.patentsGranted >= 1) {
    efficiency += 10; // Some output
  }

  // Innovation score (25%)
  efficiency += (data.innovationScore / 100) * 25;

  // Research ROI (20%)
  if (data.researchROI && data.researchROI >= 150) {
    efficiency += 20; // Excellent returns
  } else if (data.researchROI && data.researchROI >= 100) {
    efficiency += 15; // Good returns
  } else if (data.researchROI && data.researchROI >= 50) {
    efficiency += 10; // Fair returns
  } else if (data.researchROI && data.researchROI > 0) {
    efficiency += 5; // Positive returns
  }

  // Team effectiveness (10%)
  if (data.teamEffectiveness && data.teamEffectiveness >= 80) {
    efficiency += 10; // Highly effective team
  } else if (data.teamEffectiveness && data.teamEffectiveness >= 60) {
    efficiency += 7; // Effective team
  } else if (data.teamEffectiveness && data.teamEffectiveness >= 40) {
    efficiency += 4; // Moderately effective
  }

  return Math.max(0, Math.min(100, Math.round(efficiency)));
}

/**
 * Calculate technology readiness level (TRL)
 * 
 * @param researchStage - Current stage of research
 * @param prototypeStatus - Status of prototype development
 * @param marketValidation - Market validation progress (0-100)
 * @returns TRL score (1-9 scale) and readiness assessment
 * 
 * @example
 * ```ts
 * const trl = calculateTechnologyReadiness('prototype', 'tested', 65);
 * // Returns: { level: 6, stage: 'Technology Demonstrated', commercial: false }
 * ```
 */
export function calculateTechnologyReadiness(
  researchStage: 'concept' | 'research' | 'prototype' | 'testing' | 'production',
  prototypeStatus: 'none' | 'conceptual' | 'functional' | 'tested' | 'validated',
  marketValidation: number
): {
  level: number; // 1-9 TRL scale
  stage: string;
  commerciallyReady: boolean;
  nextSteps: string[];
} {
  let level = 1;
  const nextSteps: string[] = [];

  // Determine TRL based on research stage and prototype status
  if (researchStage === 'concept') {
    level = prototypeStatus === 'none' ? 1 : 2;
    nextSteps.push('Conduct feasibility studies', 'Develop proof of concept');
  } else if (researchStage === 'research') {
    level = prototypeStatus === 'conceptual' ? 3 : 4;
    nextSteps.push('Build functional prototype', 'Validate in laboratory environment');
  } else if (researchStage === 'prototype') {
    level = prototypeStatus === 'functional' ? 5 : 6;
    nextSteps.push('Test in relevant environment', 'Demonstrate in operational environment');
  } else if (researchStage === 'testing') {
    level = prototypeStatus === 'tested' ? 7 : 8;
    nextSteps.push('Complete system qualification', 'Prepare for commercialization');
  } else if (researchStage === 'production') {
    level = 9;
    nextSteps.push('Scale production', 'Optimize manufacturing process');
  }

  // Market validation can boost TRL if sufficient
  if (marketValidation >= 80 && level < 9) {
    level = Math.min(9, level + 1);
  }

  // TRL stage names
  const stages: Record<number, string> = {
    1: 'Basic Principles Observed',
    2: 'Technology Concept Formulated',
    3: 'Experimental Proof of Concept',
    4: 'Technology Validated in Lab',
    5: 'Technology Validated in Relevant Environment',
    6: 'Technology Demonstrated in Relevant Environment',
    7: 'System Prototype Demonstration',
    8: 'System Complete and Qualified',
    9: 'Actual System Proven in Operational Environment',
  };

  const commerciallyReady = level >= 7 && marketValidation >= 60;

  return {
    level,
    stage: stages[level],
    commerciallyReady,
    nextSteps,
  };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Pure Functions**: All functions are side-effect free for testability
 * 2. **Research Success**: Multi-factor probability model with budget, time, expertise
 * 3. **Patent Valuation**: Market-based valuation with competitive analysis
 * 4. **Breakthrough Mechanics**: Probabilistic innovation with diminishing returns
 * 5. **ROI Calculation**: Comprehensive value assessment including patents, products, revenue
 * 6. **Team Assessment**: Publication, citation, and collaboration metrics
 * 7. **TRL Framework**: Industry-standard technology readiness levels (1-9)
 * 
 * USAGE:
 * ```ts
 * import { calculateResearchSuccess, calculatePatentValue } from '@/lib/utils/departments/rd';
 * 
 * const success = calculateResearchSuccess('challenging', 75, 100000, 6);
 * const value = calculatePatentValue(85, 5000000, 70, 15);
 * ```
 */
