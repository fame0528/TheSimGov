"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_ACHIEVEMENT_RATES = exports.MILESTONE_COMPLEXITY = exports.calculateImpactConsequences = exports.generateAlignmentChange = exports.generateCapabilityGain = exports.checkPrerequisites = exports.calculateImpactScore = exports.evaluateAlignmentRisk = exports.calculateAchievementProbability = exports.generateAlignmentChallenge = exports.predictIndustryDisruption = exports.assessAlignmentTax = exports.simulateCapabilityExplosion = exports.evaluateAlignmentTradeoff = exports.calculateMilestoneProgressionPath = exports.calculatePortfolioValue = exports.estimatePatentGrantProbability = exports.calculatePatentValueFromCitations = exports.calculateLicensingRevenue = exports.calculatePatentFilingCost = exports.generateBreakthroughDetails = exports.isPatentable = exports.calculateNoveltyScore = exports.calculateBreakthroughDiscoveryProbability = exports.calculateCancellationPenalty = exports.generatePublication = exports.generatePatent = exports.generateBreakthrough = exports.calculateBudgetEfficiency = exports.isProjectCancelled = exports.isProjectCompleted = exports.isProjectInProgress = exports.calculateCompletionPercentage = exports.calculatePerformanceGain = exports.getCostBreakdown = exports.estimateGPUHours = exports.calculateCostPerEpoch = exports.calculateTotalTrainingCost = exports.calculateIncrementalCost = exports.validateResearcherCount = exports.getComplexityMultiplier = exports.validateBudgetOverage = exports.validateResearchBudget = exports.validateProgressIncrement = exports.getParameterRangeForSize = exports.validateSizeParameterMapping = void 0;
// Validation utilities
var validation_1 = require("./validation");
Object.defineProperty(exports, "validateSizeParameterMapping", { enumerable: true, get: function () { return validation_1.validateSizeParameterMapping; } });
Object.defineProperty(exports, "getParameterRangeForSize", { enumerable: true, get: function () { return validation_1.getParameterRangeForSize; } });
Object.defineProperty(exports, "validateProgressIncrement", { enumerable: true, get: function () { return validation_1.validateProgressIncrement; } });
Object.defineProperty(exports, "validateResearchBudget", { enumerable: true, get: function () { return validation_1.validateResearchBudget; } });
Object.defineProperty(exports, "validateBudgetOverage", { enumerable: true, get: function () { return validation_1.validateBudgetOverage; } });
Object.defineProperty(exports, "getComplexityMultiplier", { enumerable: true, get: function () { return validation_1.getComplexityMultiplier; } });
Object.defineProperty(exports, "validateResearcherCount", { enumerable: true, get: function () { return validation_1.validateResearcherCount; } });
// Training cost calculations
var trainingCosts_1 = require("./trainingCosts");
Object.defineProperty(exports, "calculateIncrementalCost", { enumerable: true, get: function () { return trainingCosts_1.calculateIncrementalCost; } });
Object.defineProperty(exports, "calculateTotalTrainingCost", { enumerable: true, get: function () { return trainingCosts_1.calculateTotalTrainingCost; } });
Object.defineProperty(exports, "calculateCostPerEpoch", { enumerable: true, get: function () { return trainingCosts_1.calculateCostPerEpoch; } });
Object.defineProperty(exports, "estimateGPUHours", { enumerable: true, get: function () { return trainingCosts_1.estimateGPUHours; } });
Object.defineProperty(exports, "getCostBreakdown", { enumerable: true, get: function () { return trainingCosts_1.getCostBreakdown; } });
// Research project calculations
var researchProjects_1 = require("./researchProjects");
Object.defineProperty(exports, "calculatePerformanceGain", { enumerable: true, get: function () { return researchProjects_1.calculatePerformanceGain; } });
Object.defineProperty(exports, "calculateCompletionPercentage", { enumerable: true, get: function () { return researchProjects_1.calculateCompletionPercentage; } });
Object.defineProperty(exports, "isProjectInProgress", { enumerable: true, get: function () { return researchProjects_1.isProjectInProgress; } });
Object.defineProperty(exports, "isProjectCompleted", { enumerable: true, get: function () { return researchProjects_1.isProjectCompleted; } });
Object.defineProperty(exports, "isProjectCancelled", { enumerable: true, get: function () { return researchProjects_1.isProjectCancelled; } });
Object.defineProperty(exports, "calculateBudgetEfficiency", { enumerable: true, get: function () { return researchProjects_1.calculateBudgetEfficiency; } });
Object.defineProperty(exports, "generateBreakthrough", { enumerable: true, get: function () { return researchProjects_1.generateBreakthrough; } });
Object.defineProperty(exports, "generatePatent", { enumerable: true, get: function () { return researchProjects_1.generatePatent; } });
Object.defineProperty(exports, "generatePublication", { enumerable: true, get: function () { return researchProjects_1.generatePublication; } });
Object.defineProperty(exports, "calculateCancellationPenalty", { enumerable: true, get: function () { return researchProjects_1.calculateCancellationPenalty; } });
// Breakthrough discovery calculations
var breakthroughCalculations_1 = require("./breakthroughCalculations");
Object.defineProperty(exports, "calculateBreakthroughDiscoveryProbability", { enumerable: true, get: function () { return breakthroughCalculations_1.calculateBreakthroughProbability; } });
Object.defineProperty(exports, "calculateNoveltyScore", { enumerable: true, get: function () { return breakthroughCalculations_1.calculateNoveltyScore; } });
Object.defineProperty(exports, "isPatentable", { enumerable: true, get: function () { return breakthroughCalculations_1.isPatentable; } });
Object.defineProperty(exports, "generateBreakthroughDetails", { enumerable: true, get: function () { return breakthroughCalculations_1.generateBreakthroughDetails; } });
// Patent filing and revenue calculations
var patentCalculations_1 = require("./patentCalculations");
Object.defineProperty(exports, "calculatePatentFilingCost", { enumerable: true, get: function () { return patentCalculations_1.calculatePatentFilingCost; } });
Object.defineProperty(exports, "calculateLicensingRevenue", { enumerable: true, get: function () { return patentCalculations_1.calculateLicensingRevenue; } });
Object.defineProperty(exports, "calculatePatentValueFromCitations", { enumerable: true, get: function () { return patentCalculations_1.calculatePatentValueFromCitations; } });
Object.defineProperty(exports, "estimatePatentGrantProbability", { enumerable: true, get: function () { return patentCalculations_1.estimatePatentGrantProbability; } });
Object.defineProperty(exports, "calculatePortfolioValue", { enumerable: true, get: function () { return patentCalculations_1.calculatePortfolioValue; } });
// AGI Milestone Progression utilities
var calculateMilestoneProgressionPath_1 = require("./agi/calculateMilestoneProgressionPath");
Object.defineProperty(exports, "calculateMilestoneProgressionPath", { enumerable: true, get: function () { return calculateMilestoneProgressionPath_1.calculateMilestoneProgressionPath; } });
var evaluateAlignmentTradeoff_1 = require("./agi/evaluateAlignmentTradeoff");
Object.defineProperty(exports, "evaluateAlignmentTradeoff", { enumerable: true, get: function () { return evaluateAlignmentTradeoff_1.evaluateAlignmentTradeoff; } });
var simulateCapabilityExplosion_1 = require("./agi/simulateCapabilityExplosion");
Object.defineProperty(exports, "simulateCapabilityExplosion", { enumerable: true, get: function () { return simulateCapabilityExplosion_1.simulateCapabilityExplosion; } });
var assessAlignmentTax_1 = require("./agi/assessAlignmentTax");
Object.defineProperty(exports, "assessAlignmentTax", { enumerable: true, get: function () { return assessAlignmentTax_1.assessAlignmentTax; } });
var predictIndustryDisruption_1 = require("./agi/predictIndustryDisruption");
Object.defineProperty(exports, "predictIndustryDisruption", { enumerable: true, get: function () { return predictIndustryDisruption_1.predictIndustryDisruption; } });
var generateAlignmentChallenge_1 = require("./agi/generateAlignmentChallenge");
Object.defineProperty(exports, "generateAlignmentChallenge", { enumerable: true, get: function () { return generateAlignmentChallenge_1.generateAlignmentChallenge; } });
// AGI Milestone calculations
var agiMilestones_1 = require("./agi/agiMilestones");
Object.defineProperty(exports, "calculateAchievementProbability", { enumerable: true, get: function () { return agiMilestones_1.calculateAchievementProbability; } });
Object.defineProperty(exports, "evaluateAlignmentRisk", { enumerable: true, get: function () { return agiMilestones_1.evaluateAlignmentRisk; } });
Object.defineProperty(exports, "calculateImpactScore", { enumerable: true, get: function () { return agiMilestones_1.calculateImpactScore; } });
Object.defineProperty(exports, "checkPrerequisites", { enumerable: true, get: function () { return agiMilestones_1.checkPrerequisites; } });
Object.defineProperty(exports, "generateCapabilityGain", { enumerable: true, get: function () { return agiMilestones_1.generateCapabilityGain; } });
Object.defineProperty(exports, "generateAlignmentChange", { enumerable: true, get: function () { return agiMilestones_1.generateAlignmentChange; } });
Object.defineProperty(exports, "calculateImpactConsequences", { enumerable: true, get: function () { return agiMilestones_1.calculateImpactConsequences; } });
Object.defineProperty(exports, "MILESTONE_COMPLEXITY", { enumerable: true, get: function () { return agiMilestones_1.MILESTONE_COMPLEXITY; } });
Object.defineProperty(exports, "BASE_ACHIEVEMENT_RATES", { enumerable: true, get: function () { return agiMilestones_1.BASE_ACHIEVEMENT_RATES; } });
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
//# sourceMappingURL=index.js.map