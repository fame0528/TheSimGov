/**
 * @file src/lib/utils/rd/innovationQueue.ts
 * @description R&D project progression and breakthrough probability system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Research and development project management system. Handles project progression through
 * phases (Concept → Research → Development → Testing → Commercialization), calculates
 * breakthrough probabilities, manages innovation score, and determines success outcomes.
 * 
 * USAGE:
 * ```typescript
 * import { advanceProjectProgress, calculateBreakthroughProbability, evaluateProjectSuccess } from '@/lib/utils/rd/innovationQueue';
 * 
 * // Advance project to next phase
 * const progress = advanceProjectProgress({
 *   currentPhase: 'Research',
 *   progress: 85,
 *   teamSkillLevel: 75,
 *   budget: 500000,
 *   spent: 120000,
 *   innovationScore: 80
 * });
 * // Returns: { newPhase: 'Development', progressGain: 15, breakthroughCheck: {...} }
 * 
 * // Calculate breakthrough probability
 * const breakthrough = calculateBreakthroughProbability({
 *   innovationScore: 85,
 *   teamSkillLevel: 80,
 *   technologyLevel: 9,
 *   budgetAdequacy: 0.75,
 *   researchProgress: 90
 * });
 * // Returns: { probability: 45, breakthroughType: 'Major', impact: {...} }
 * 
 * // Evaluate final success
 * const success = evaluateProjectSuccess({
 *   projectType: 'ProductInnovation',
 *   innovationScore: 90,
 *   progress: 100,
 *   budgetOverrun: 0.15,
 *   timeOverrun: 0.08,
 *   breakthroughAchieved: true
 * });
 * // Returns: { successLevel: 'ExceptionalSuccess', outcomes: {...}, impact: {...} }
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Project phases and progress ranges:
 *   - Concept (0-20%): Initial ideation and feasibility
 *   - Research (20-40%): Core research and validation
 *   - Development (40-70%): Prototype and build
 *   - Testing (70-95%): Quality assurance and validation
 *   - Commercialization (95-100%): Market preparation
 * - Progress advancement:
 *   - Base progress gain: 5-15% per month
 *   - Team skill multiplier: (teamSkill / 100) * base
 *   - Budget adequacy: Insufficient budget reduces progress 20-50%
 *   - Blockers: Active blockers reduce progress 30-60%
 * - Breakthrough probability factors:
 *   - Innovation score: Weight 35% (higher = more likely)
 *   - Team skill: Weight 30% (skilled teams execute better)
 *   - Technology level: Weight 20% (cutting-edge = higher risk/reward)
 *   - Budget adequacy: Weight 10% (proper funding enables success)
 *   - Research progress: Weight 5% (completed research increases odds)
 * - Breakthrough types and impact:
 *   - Minor (30% probability): +5 innovation, +5 competitive advantage
 *   - Major (15% probability): +15 innovation, +20 competitive advantage, +1 patent
 *   - Revolutionary (5% probability): +30 innovation, +50 competitive advantage, +3 patents, industry disruption
 * - Success levels:
 *   - Failed (20-30% if high risk): No outcomes, 80% budget loss
 *   - Partial Success (25-35%): 50% expected outcomes, commercialization unlikely
 *   - Success (35-45%): 100% expected outcomes, normal commercialization
 *   - Exceptional Success (5-15%): 150-200% outcomes, high commercialization, follow-up projects
 * - Success factors:
 *   - Budget overrun penalty: >25% overrun = -30% success probability
 *   - Time overrun penalty: >50% overrun = -20% success probability
 *   - Team skill bonus: 80+ skill = +15% success probability
 *   - Breakthrough bonus: Revolutionary breakthrough = +40% success probability
 *   - Innovation score: 90+ = +20% success probability
 * - Commercialization probability:
 *   - ProductInnovation: 70-90% if successful
 *   - TechnologyResearch: 30-50% (fundamental research, long-term value)
 *   - ProcessImprovement: 95%+ (internal use)
 *   - PatentDevelopment: 60-80% (licensing potential)
 *   - AI/ML: 65-85% (high commercial demand)
 */

import type {
  ProjectType,
  ProjectPhase,
  ProjectStatus,
  BreakthroughType,
  SuccessLevel,
} from '@/lib/db/models/ResearchProject';

/**
 * Project progress input
 */
export interface ProjectProgressInput {
  currentPhase: ProjectPhase;
  progress: number;
  teamSkillLevel: number;
  budget: number;
  spent: number;
  innovationScore: number;
  hasBlockers?: boolean;
}

/**
 * Project progress result
 */
export interface ProjectProgressResult {
  newPhase: ProjectPhase;
  newStatus: ProjectStatus;
  progressGain: number;
  newProgress: number;
  breakthroughCheck?: BreakthroughCheckResult;
  phaseComplete: boolean;
}

/**
 * Breakthrough probability input
 */
export interface BreakthroughProbabilityInput {
  innovationScore: number;
  teamSkillLevel: number;
  technologyLevel: number;
  budgetAdequacy: number;        // 0-1 (spent / budget)
  researchProgress: number;      // 0-100
}

/**
 * Breakthrough check result
 */
export interface BreakthroughCheckResult {
  occurred: boolean;
  breakthroughType: BreakthroughType;
  probability: number;
  impact: {
    innovationBonus: number;
    competitiveAdvantage: number;
    patentsGenerated: number;
    industryDisruption: number;
  };
}

/**
 * Project success evaluation input
 */
export interface ProjectSuccessInput {
  projectType: ProjectType;
  innovationScore: number;
  progress: number;
  budgetOverrun: number;         // 0-1 (actual vs planned)
  timeOverrun: number;           // 0-1 (actual vs estimated)
  breakthroughAchieved: boolean;
  breakthroughType?: BreakthroughType;
  teamSkillLevel?: number;
}

/**
 * Project success result
 */
export interface ProjectSuccessResult {
  successLevel: SuccessLevel;
  probability: number;
  outcomes: {
    productsCreated: number;
    processImprovements: number;
    patentsGranted: number;
    publicationCount: number;
  };
  impact: {
    revenueProjection: number;
    costSavings: number;
    competitiveAdvantage: number;
    marketImpact: number;
  };
  commercialized: boolean;
  commercializationProbability: number;
}

/**
 * Phase progression thresholds
 */
const PHASE_THRESHOLDS: Record<ProjectPhase, { min: number; max: number }> = {
  Concept: { min: 0, max: 20 },
  Research: { min: 20, max: 40 },
  Development: { min: 40, max: 70 },
  Testing: { min: 70, max: 95 },
  Commercialization: { min: 95, max: 100 },
};

/**
 * Advance research project progress
 * 
 * @param input - Project progress parameters
 * @returns Updated progress and phase information
 * 
 * @example
 * ```typescript
 * const progress = advanceProjectProgress({
 *   currentPhase: 'Development',
 *   progress: 65,
 *   teamSkillLevel: 85,
 *   budget: 1000000,
 *   spent: 450000,
 *   innovationScore: 75,
 *   hasBlockers: false
 * });
 * ```
 */
export function advanceProjectProgress(
  input: ProjectProgressInput
): ProjectProgressResult {
  const {
    currentPhase,
    progress,
    teamSkillLevel,
    budget,
    spent,
    innovationScore,
    hasBlockers = false,
  } = input;

  // Base progress gain (5-15% per month)
  let baseProgressGain = 10;

  // Team skill multiplier (0.5x to 1.5x)
  const skillMultiplier = 0.5 + (teamSkillLevel / 100);
  baseProgressGain *= skillMultiplier;

  // Budget adequacy check
  const budgetUtilization = spent / budget;
  if (budgetUtilization < 0.1) {
    baseProgressGain *= 0.5; // Underspending = slow progress
  } else if (budgetUtilization > 0.9) {
    baseProgressGain *= 0.7; // Near budget limit = resource constraints
  }

  // Blocker penalty
  if (hasBlockers) {
    baseProgressGain *= 0.5; // Blockers cut progress in half
  }

  // Phase-specific modifiers
  if (currentPhase === 'Research') {
    baseProgressGain *= 0.9; // Research is slower
  } else if (currentPhase === 'Testing') {
    baseProgressGain *= 0.8; // Testing is thorough
  } else if (currentPhase === 'Commercialization') {
    baseProgressGain *= 1.2; // Final push faster
  }

  // Calculate new progress
  const progressGain = Math.min(15, Math.max(2, baseProgressGain));
  let newProgress = Math.min(100, progress + progressGain);

  // Determine new phase
  let newPhase = currentPhase;
  let phaseComplete = false;

  if (newProgress >= PHASE_THRESHOLDS[currentPhase].max) {
    phaseComplete = true;
    // Advance to next phase
    if (currentPhase === 'Concept') newPhase = 'Research';
    else if (currentPhase === 'Research') newPhase = 'Development';
    else if (currentPhase === 'Development') newPhase = 'Testing';
    else if (currentPhase === 'Testing') newPhase = 'Commercialization';
  }

  // Determine status
  let newStatus: ProjectStatus = 'Research';
  if (newPhase === 'Concept') newStatus = 'Concept';
  else if (newPhase === 'Research') newStatus = 'Research';
  else if (newPhase === 'Development') newStatus = 'Development';
  else if (newPhase === 'Testing') newStatus = 'Testing';
  else if (newProgress >= 100) newStatus = 'Completed';

  // Check for breakthrough at phase transitions
  let breakthroughCheck: BreakthroughCheckResult | undefined;
  if (phaseComplete && currentPhase === 'Research') {
    // Breakthrough chance when completing research phase
    breakthroughCheck = checkForBreakthrough({
      innovationScore,
      teamSkillLevel,
      technologyLevel: 7, // Assume medium-high tech
      budgetAdequacy: budgetUtilization,
      researchProgress: newProgress,
    });
  }

  return {
    newPhase,
    newStatus,
    progressGain: Math.round(progressGain * 100) / 100,
    newProgress: Math.round(newProgress * 100) / 100,
    breakthroughCheck,
    phaseComplete,
  };
}

/**
 * Calculate breakthrough probability and check if it occurs
 * 
 * @param input - Breakthrough probability factors
 * @returns Breakthrough check result
 * 
 * @example
 * ```typescript
 * const breakthrough = checkForBreakthrough({
 *   innovationScore: 90,
 *   teamSkillLevel: 85,
 *   technologyLevel: 10,
 *   budgetAdequacy: 0.6,
 *   researchProgress: 95
 * });
 * ```
 */
export function checkForBreakthrough(
  input: BreakthroughProbabilityInput
): BreakthroughCheckResult {
  const {
    innovationScore,
    teamSkillLevel,
    technologyLevel,
    budgetAdequacy,
    researchProgress,
  } = input;

  // Calculate overall breakthrough probability (0-100)
  let probability = 0;
  probability += innovationScore * 0.35; // 35% weight
  probability += teamSkillLevel * 0.30; // 30% weight
  probability += (technologyLevel / 10) * 100 * 0.20; // 20% weight
  probability += budgetAdequacy * 100 * 0.10; // 10% weight
  probability += researchProgress * 0.05; // 5% weight

  probability = Math.max(0, Math.min(100, probability));

  // Roll for breakthrough
  const roll = Math.random() * 100;
  const occurred = roll < probability;

  // Determine breakthrough type if occurred
  let breakthroughType: BreakthroughType = 'None';
  let innovationBonus = 0;
  let competitiveAdvantage = 0;
  let patentsGenerated = 0;
  let industryDisruption = 0;

  if (occurred) {
    // Higher innovation = better breakthrough type
    const revolutionaryThreshold = 95;
    const majorThreshold = 80;

    if (innovationScore >= revolutionaryThreshold && Math.random() < 0.05) {
      // Revolutionary (5% chance if innovation 95+)
      breakthroughType = 'Revolutionary';
      innovationBonus = 30;
      competitiveAdvantage = 50;
      patentsGenerated = 3;
      industryDisruption = 80;
    } else if (innovationScore >= majorThreshold && Math.random() < 0.15) {
      // Major (15% chance if innovation 80+)
      breakthroughType = 'Major';
      innovationBonus = 15;
      competitiveAdvantage = 20;
      patentsGenerated = 1;
      industryDisruption = 30;
    } else {
      // Minor (default if breakthrough occurs)
      breakthroughType = 'Minor';
      innovationBonus = 5;
      competitiveAdvantage = 5;
      patentsGenerated = 0;
      industryDisruption = 5;
    }
  }

  return {
    occurred,
    breakthroughType,
    probability: Math.round(probability * 100) / 100,
    impact: {
      innovationBonus,
      competitiveAdvantage,
      patentsGenerated,
      industryDisruption,
    },
  };
}

/**
 * Evaluate final project success and outcomes
 * 
 * @param input - Project success evaluation factors
 * @returns Success level and outcomes
 * 
 * @example
 * ```typescript
 * const success = evaluateProjectSuccess({
 *   projectType: 'AI/ML',
 *   innovationScore: 88,
 *   progress: 100,
 *   budgetOverrun: 0.12,
 *   timeOverrun: 0.05,
 *   breakthroughAchieved: true,
 *   breakthroughType: 'Major',
 *   teamSkillLevel: 82
 * });
 * ```
 */
export function evaluateProjectSuccess(
  input: ProjectSuccessInput
): ProjectSuccessResult {
  const {
    projectType,
    innovationScore,
    progress,
    budgetOverrun,
    timeOverrun,
    breakthroughAchieved,
    breakthroughType = 'None',
    teamSkillLevel = 50,
  } = input;

  // Base success probability
  let successProbability = 50;

  // Innovation score impact
  successProbability += (innovationScore - 50) * 0.4; // ±20 points

  // Team skill impact
  successProbability += (teamSkillLevel - 50) * 0.3; // ±15 points

  // Budget overrun penalty
  if (budgetOverrun > 0.25) successProbability -= 30;
  else if (budgetOverrun > 0.10) successProbability -= 15;

  // Time overrun penalty
  if (timeOverrun > 0.50) successProbability -= 20;
  else if (timeOverrun > 0.25) successProbability -= 10;

  // Breakthrough bonus
  if (breakthroughType === 'Revolutionary') successProbability += 40;
  else if (breakthroughType === 'Major') successProbability += 20;
  else if (breakthroughType === 'Minor') successProbability += 10;

  // Progress penalty (incomplete projects)
  if (progress < 95) successProbability -= (95 - progress) * 2;

  successProbability = Math.max(0, Math.min(100, successProbability));

  // Determine success level
  let successLevel: SuccessLevel;
  const roll = Math.random() * 100;

  if (roll < successProbability * 0.1) {
    successLevel = 'ExceptionalSuccess'; // Top 10% of success range
  } else if (roll < successProbability * 0.5) {
    successLevel = 'Success'; // 50% of success range
  } else if (roll < successProbability) {
    successLevel = 'PartialSuccess'; // Remaining success range
  } else {
    successLevel = 'Failed';
  }

  // Calculate outcomes based on success level
  let productsCreated = 0;
  let processImprovements = 0;
  let patentsGranted = 0;
  let publicationCount = 0;

  const successMultiplier =
    successLevel === 'ExceptionalSuccess'
      ? 2.0
      : successLevel === 'Success'
      ? 1.0
      : successLevel === 'PartialSuccess'
      ? 0.5
      : 0.0;

  if (projectType === 'ProductInnovation') {
    productsCreated = Math.round(1 * successMultiplier);
    patentsGranted = breakthroughAchieved ? 1 : 0;
    publicationCount = Math.round(2 * successMultiplier);
  } else if (projectType === 'ProcessImprovement') {
    processImprovements = Math.round(3 * successMultiplier);
    publicationCount = Math.round(1 * successMultiplier);
  } else if (projectType === 'TechnologyResearch') {
    patentsGranted = Math.round(2 * successMultiplier);
    publicationCount = Math.round(5 * successMultiplier);
  } else if (projectType === 'PatentDevelopment') {
    patentsGranted = Math.round(4 * successMultiplier);
    publicationCount = Math.round(3 * successMultiplier);
  } else if (projectType === 'AI/ML') {
    productsCreated = Math.round(2 * successMultiplier);
    patentsGranted = Math.round(1 * successMultiplier);
    publicationCount = Math.round(4 * successMultiplier);
  }

  // Calculate impact
  const revenueProjection =
    productsCreated * 500000 * (innovationScore / 100) * successMultiplier;
  const costSavings =
    processImprovements * 200000 * successMultiplier;
  const competitiveAdvantage = breakthroughAchieved
    ? breakthroughType === 'Revolutionary'
      ? 50
      : breakthroughType === 'Major'
      ? 20
      : 5
    : 0;
  const marketImpact = Math.min(
    100,
    (innovationScore / 100) * 80 * successMultiplier
  );

  // Commercialization probability
  let commercializationProbability = 0;
  if (projectType === 'ProductInnovation') commercializationProbability = 80;
  else if (projectType === 'ProcessImprovement') commercializationProbability = 95;
  else if (projectType === 'TechnologyResearch') commercializationProbability = 40;
  else if (projectType === 'PatentDevelopment') commercializationProbability = 70;
  else if (projectType === 'AI/ML') commercializationProbability = 75;

  commercializationProbability *= successMultiplier;
  const commercialized = Math.random() * 100 < commercializationProbability;

  return {
    successLevel,
    probability: Math.round(successProbability * 100) / 100,
    outcomes: {
      productsCreated,
      processImprovements,
      patentsGranted,
      publicationCount,
    },
    impact: {
      revenueProjection: Math.round(revenueProjection),
      costSavings: Math.round(costSavings),
      competitiveAdvantage,
      marketImpact: Math.round(marketImpact),
    },
    commercialized,
    commercializationProbability: Math.round(commercializationProbability),
  };
}

/**
 * Calculate project efficiency score (0-100)
 * 
 * @param spent - Amount spent
 * @param budget - Total budget
 * @param progress - Progress percentage
 * @param duration - Months elapsed
 * @returns Efficiency score
 */
export function calculateProjectEfficiency(
  spent: number,
  budget: number,
  progress: number,
  duration: number
): number {
  // Budget efficiency (0-50 points)
  const budgetUtilization = spent / budget;
  const idealUtilization = progress / 100;
  const budgetEfficiency = Math.max(
    0,
    50 - Math.abs(budgetUtilization - idealUtilization) * 100
  );

  // Time efficiency (0-50 points)
  const expectedProgress = Math.min(100, duration * 5); // ~5% per month
  const timeEfficiency = Math.max(0, 50 - Math.abs(progress - expectedProgress) / 2);

  return Math.round(budgetEfficiency + timeEfficiency);
}
