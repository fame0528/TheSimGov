/**
 * @fileoverview AI Utilities Barrel Exports
 * @module lib/utils/ai
 * 
 * OVERVIEW:
 * Clean barrel exports for all AI utility functions.
 * Provides single import point for AI calculations and validation.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

// Validation utilities
export {
  validateSizeParameterMapping,
  getParameterRangeForSize,
  validateProgressIncrement,
  validateResearchBudget,
  validateBudgetOverage,
  getComplexityMultiplier,
  validateResearcherCount,
} from './validation';

// Training cost calculations
export {
  calculateIncrementalCost,
  calculateTotalTrainingCost,
  calculateCostPerEpoch,
  estimateGPUHours,
  getCostBreakdown,
} from './trainingCosts';

// Research project calculations
export {
  calculatePerformanceGain,
  calculateCompletionPercentage,
  isProjectInProgress,
  isProjectCompleted,
  isProjectCancelled,
  calculateBudgetEfficiency,
  generateBreakthrough,
  generatePatent,
  generatePublication,
  calculateCancellationPenalty,
} from './researchProjects';

// Breakthrough discovery calculations
export {
  calculateBreakthroughProbability as calculateBreakthroughDiscoveryProbability,
  calculateNoveltyScore,
  isPatentable,
  generateBreakthroughDetails,
} from './breakthroughCalculations';

export type { BreakthroughArea } from './breakthroughCalculations';

// Patent filing and revenue calculations
export {
  calculatePatentFilingCost,
  calculateLicensingRevenue,
  calculatePatentValueFromCitations,
  estimatePatentGrantProbability,
  calculatePortfolioValue,
} from './patentCalculations';

export type { PatentJurisdiction, PatentStatus } from './patentCalculations';

// AGI Milestone Progression utilities
export { calculateMilestoneProgressionPath } from './agi/calculateMilestoneProgressionPath';
export { evaluateAlignmentTradeoff } from './agi/evaluateAlignmentTradeoff';
export { simulateCapabilityExplosion } from './agi/simulateCapabilityExplosion';
export { assessAlignmentTax } from './agi/assessAlignmentTax';
export { predictIndustryDisruption } from './agi/predictIndustryDisruption';
export { generateAlignmentChallenge } from './agi/generateAlignmentChallenge';

// AGI Milestone calculations
export {
  calculateAchievementProbability,
  evaluateAlignmentRisk,
  calculateImpactScore,
  checkPrerequisites,
  generateCapabilityGain,
  generateAlignmentChange,
  calculateImpactConsequences,
  MILESTONE_COMPLEXITY,
  BASE_ACHIEVEMENT_RATES,
} from './agi/agiMilestones';

/**
 * USAGE:
 * ```typescript
 * import {
 *   validateSizeParameterMapping,
 *   calculateIncrementalCost,
 *   calculatePerformanceGain,
 *   calculateBreakthroughDiscoveryProbability,
 *   isPatentable,
 *   calculatePatentFilingCost
 * } from '@/lib/utils/ai';
 * 
 * // Validate model size
 * if (!validateSizeParameterMapping('Small', params)) {
 *   throw new Error('Invalid size-parameter mapping');
 * }
 * 
 * // Calculate training cost
 * const cost = calculateIncrementalCost('Medium', params, datasetSize, 10);
 * 
 * // Calculate research gains
 * const gains = calculatePerformanceGain('Performance', 'High', skills, budget, spent, 100);
 * 
 * // Breakthrough discovery
 * const { probability } = calculateBreakthroughDiscoveryProbability('Alignment', 500000, 85);
 * 
 * // Patent filing
 * const { totalCost } = calculatePatentFilingCost('Architecture', true, ['EU', 'CN']);
 * ```
 */
