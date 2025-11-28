"use strict";
/**
 * AGI Milestone Calculations Utility
 * @fileoverview Utility functions for AGI milestone achievement probability, risk assessment, and impact calculations
 * @module lib/utils/ai/agi/agiMilestones
 *
 * OVERVIEW:
 * Pure calculation functions for AGI milestone system.
 * Implements achievement probability, alignment risk evaluation, impact scoring,
 * and prerequisite validation logic extracted from AGIMilestone model.
 *
 * UTILITY-FIRST ARCHITECTURE:
 * - Zero dependencies on database models
 * - Pure functions with explicit inputs/outputs
 * - Easy to test and reuse across contexts
 * - Follows DRY principle with AGIMilestone schema
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_ACHIEVEMENT_RATES = exports.MILESTONE_COMPLEXITY = void 0;
exports.calculateAchievementProbability = calculateAchievementProbability;
exports.evaluateAlignmentRisk = evaluateAlignmentRisk;
exports.calculateImpactScore = calculateImpactScore;
exports.checkPrerequisites = checkPrerequisites;
exports.generateCapabilityGain = generateCapabilityGain;
exports.generateAlignmentChange = generateAlignmentChange;
exports.calculateImpactConsequences = calculateImpactConsequences;
const agi_1 = require("@/lib/types/models/ai/agi");
/**
 * Milestone complexity ratings (affects achievement difficulty)
 */
exports.MILESTONE_COMPLEXITY = {
    [agi_1.MilestoneType.ADVANCED_REASONING]: 3,
    [agi_1.MilestoneType.STRATEGIC_PLANNING]: 3,
    [agi_1.MilestoneType.TRANSFER_LEARNING]: 4,
    [agi_1.MilestoneType.CREATIVE_PROBLEM_SOLVING]: 4,
    [agi_1.MilestoneType.META_LEARNING]: 4,
    [agi_1.MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 5,
    [agi_1.MilestoneType.MULTI_AGENT_COORDINATION]: 5,
    [agi_1.MilestoneType.INTERPRETABILITY]: 5,
    [agi_1.MilestoneType.VALUE_ALIGNMENT]: 6,
    [agi_1.MilestoneType.SELF_IMPROVEMENT]: 7,
    [agi_1.MilestoneType.GENERAL_INTELLIGENCE]: 8,
    [agi_1.MilestoneType.SUPERINTELLIGENCE]: 10,
};
/**
 * Base achievement rates by milestone complexity
 */
exports.BASE_ACHIEVEMENT_RATES = {
    3: 0.25, // 25% base for complexity 3
    4: 0.20, // 20% base for complexity 4
    5: 0.15, // 15% base for complexity 5
    6: 0.10, // 10% base for complexity 6
    7: 0.08, // 8% base for complexity 7
    8: 0.05, // 5% base for AGI
    10: 0.02, // 2% base for Superintelligence
};
/**
 * Calculate achievement probability for milestone attempt
 *
 * Uses logarithmic scaling to prevent exponential advantage from high research budgets.
 * Balances research investment, capability level, and alignment penalty.
 *
 * Formula Components:
 * - Base Rate: 2-25% depending on milestone complexity
 * - Research Boost: log10(RP/1000 + 1) × 8% (max +25%)
 * - Capability Bonus: (avgCapability/100) × 20% (max +20%)
 * - Alignment Penalty: -(100 - avgAlignment)/200 (up to -50% for low alignment)
 * - Capped at 75% maximum to maintain strategic challenge
 *
 * @param milestoneType - The milestone being attempted
 * @param researchPointsInvested - RP spent so far
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @returns Achievement probability with detailed breakdown
 *
 * @example
 * // General Intelligence milestone, 5000 RP invested, 80 capability, 40 alignment
 * calculateAchievementProbability(
 *   MilestoneType.GENERAL_INTELLIGENCE,
 *   5000,
 *   { reasoningScore: 80, ... },
 *   { safetyMeasures: 40, ... }
 * )
 * // Returns: {
 * //   probability: 0.28,
 * //   breakdown: { base: 0.05, research: 0.14, capability: 0.16, alignment: -0.07 }
 * // }
 */
function calculateAchievementProbability(milestoneType, researchPointsInvested, currentCapability, currentAlignment) {
    // Base rate by milestone complexity
    const complexity = exports.MILESTONE_COMPLEXITY[milestoneType];
    const baseRate = exports.BASE_ACHIEVEMENT_RATES[complexity] || 0.05;
    // Research boost (logarithmic scaling prevents runaway advantage)
    const researchFactor = Math.log10(researchPointsInvested / 1000 + 1);
    const researchBoost = Math.min(0.25, researchFactor * 0.08);
    // Capability bonus (average of all capability metrics)
    const capabilityMetrics = Object.values(currentCapability);
    const avgCapability = capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
    const capabilityBonus = (avgCapability / 100) * 0.20;
    // Alignment penalty (low alignment reduces success chance)
    const alignmentMetrics = Object.values(currentAlignment);
    const avgAlignment = alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
    const alignmentPenalty = -((100 - avgAlignment) / 200); // Up to -50% for 0 alignment
    // Calculate total probability (cap at 75%)
    const PROBABILITY_CAP = 0.75;
    const rawProbability = baseRate + researchBoost + capabilityBonus + alignmentPenalty;
    const probability = Math.max(0, Math.min(PROBABILITY_CAP, rawProbability));
    return {
        probability: Math.round(probability * 10000) / 10000,
        breakdown: {
            baseRate: Math.round(baseRate * 10000) / 10000,
            researchBoost: Math.round(researchBoost * 10000) / 10000,
            capabilityBonus: Math.round(capabilityBonus * 10000) / 10000,
            alignmentPenalty: Math.round(alignmentPenalty * 10000) / 10000,
        },
        percentChance: Math.round(probability * 10000) / 100,
    };
}
/**
 * Evaluate alignment risk level
 *
 * Assesses catastrophic risk based on capability-alignment gap.
 * High capability with low alignment = critical risk.
 *
 * Risk Formula:
 * - Risk Score = (avgCapability - avgAlignment) weighted by milestone complexity
 * - Critical: Risk > 60 (requires immediate action)
 * - High: Risk 40-60 (concerning, safety measures needed)
 * - Medium: Risk 20-40 (monitor closely)
 * - Low: Risk < 20 (acceptable balance)
 *
 * @param milestoneType - The milestone being evaluated
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @returns Risk assessment with recommendations
 *
 * @example
 * // 85 capability, 30 alignment on Superintelligence milestone
 * evaluateAlignmentRisk(
 *   MilestoneType.SUPERINTELLIGENCE,
 *   { reasoningScore: 85, ... },
 *   { safetyMeasures: 30, ... }
 * )
 * // Returns: {
 * //   riskLevel: 'Critical',
 * //   riskScore: 82,
 * //   capabilityAlignmentGap: 55,
 * //   recommendations: ['URGENT: Halt capability research...']
 * // }
 */
function evaluateAlignmentRisk(milestoneType, currentCapability, currentAlignment) {
    // Calculate average capability and alignment
    const capabilityMetrics = Object.values(currentCapability);
    const alignmentMetrics = Object.values(currentAlignment);
    const avgCapability = capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
    const avgAlignment = alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
    // Capability-alignment gap (higher capability with low alignment = high risk)
    const gap = avgCapability - avgAlignment;
    // Complexity multiplier (Superintelligence more dangerous than Advanced Reasoning)
    const complexity = exports.MILESTONE_COMPLEXITY[milestoneType];
    const complexityMultiplier = complexity / 5; // 0.6x to 2.0x range
    // Risk score (0-100)
    const riskScore = Math.max(0, Math.min(100, gap * complexityMultiplier));
    // Determine risk level
    let riskLevel;
    if (riskScore > 60) {
        riskLevel = 'Critical';
    }
    else if (riskScore > 40) {
        riskLevel = 'High';
    }
    else if (riskScore > 20) {
        riskLevel = 'Medium';
    }
    else {
        riskLevel = 'Low';
    }
    // Generate recommendations
    const recommendations = [];
    if (riskLevel === 'Critical') {
        recommendations.push('URGENT: Halt capability research immediately and focus on alignment', `Critical gap detected: ${avgCapability.toFixed(1)} capability vs ${avgAlignment.toFixed(1)} alignment`, 'Implement emergency safety protocols and interpretability measures', 'Consider regulatory consultation before proceeding');
    }
    else if (riskLevel === 'High') {
        recommendations.push('WARNING: Capability significantly outpacing alignment', 'Increase investment in Value Alignment and Interpretability milestones', 'Implement additional control mechanisms and safety measures');
    }
    else if (riskLevel === 'Medium') {
        recommendations.push('Monitor capability-alignment balance closely', 'Maintain balanced research approach (SafetyFirst or Balanced stance)', 'Prepare alignment challenges for stakeholder review');
    }
    else {
        recommendations.push('Alignment levels acceptable for current capability', 'Continue balanced research approach', 'Monitor for capability explosion events');
    }
    return {
        riskLevel,
        riskScore: Math.round(riskScore * 100) / 100,
        capabilityAlignmentGap: Math.round(gap * 100) / 100,
        recommendations,
    };
}
/**
 * Calculate overall impact score
 *
 * Combines capability, alignment, disruption, and value metrics into unified score.
 * Used for milestone prioritization and strategic decision-making.
 *
 * Impact Score Formula:
 * - Capability: 30% weight (higher = more impact)
 * - Alignment: 20% weight (higher = positive impact)
 * - Disruption: 25% weight (can be positive or negative)
 * - Economic Value: 25% weight (normalized by $1B scale)
 *
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @param impactConsequences - Current impact consequences
 * @returns Total impact score (0-100) with breakdown
 *
 * @example
 * // High capability, moderate alignment, huge disruption, $500M value
 * calculateImpactScore(
 *   { reasoningScore: 85, ... },
 *   { safetyMeasures: 60, ... },
 *   { industryDisruptionLevel: 75, economicValueCreated: 500000000, ... }
 * )
 * // Returns: {
 * //   totalImpact: 72,
 * //   breakdown: { capability: 25, alignment: 12, disruption: 20, value: 15 }
 * // }
 */
function calculateImpactScore(currentCapability, currentAlignment, impactConsequences) {
    // Calculate average capability (0-100)
    const capabilityMetrics = Object.values(currentCapability);
    const avgCapability = capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
    // Calculate average alignment (0-100)
    const alignmentMetrics = Object.values(currentAlignment);
    const avgAlignment = alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
    // Weighted scores
    const capabilityScore = (avgCapability / 100) * 30; // 30% weight
    const alignmentScore = (avgAlignment / 100) * 20; // 20% weight
    const disruptionScore = (impactConsequences.industryDisruptionLevel / 100) * 25; // 25% weight
    // Economic value score (normalized by $1B scale, capped at 25 points)
    const valueScore = Math.min(25, (impactConsequences.economicValueCreated / 1000000000) * 25);
    const totalImpact = capabilityScore + alignmentScore + disruptionScore + valueScore;
    return {
        totalImpact: Math.round(totalImpact * 100) / 100,
        breakdown: {
            capability: Math.round(capabilityScore * 100) / 100,
            alignment: Math.round(alignmentScore * 100) / 100,
            disruption: Math.round(disruptionScore * 100) / 100,
            value: Math.round(valueScore * 100) / 100,
        },
    };
}
/**
 * Check if prerequisites are met for attempting milestone
 *
 * Validates:
 * - All prerequisite milestones achieved
 * - Minimum capability level met
 * - Minimum alignment level met
 * - Sufficient research points available
 * - Sufficient compute budget available
 *
 * @param researchRequirements - The research requirements for the milestone
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @param researchPointsInvested - RP spent so far
 * @param computeBudgetSpent - Compute budget spent so far
 * @param achievedPrerequisites - List of achieved milestone types (for DB validation)
 * @returns Detailed prerequisite check results
 *
 * @example
 * // Check if can attempt General Intelligence (needs Advanced Reasoning, etc.)
 * checkPrerequisites(
 *   researchRequirements,
 *   currentCapability,
 *   currentAlignment,
 *   15000,
 *   5000000,
 *   ['Advanced Reasoning', 'Strategic Planning']
 * )
 * // Returns: {
 * //   canAttempt: false,
 * //   missingPrerequisites: ['Natural Language Understanding'],
 * //   requirementsMet: { prerequisites: false, capability: true, ... }
 * // }
 */
function checkPrerequisites(researchRequirements, currentCapability, currentAlignment, researchPointsInvested, computeBudgetSpent, achievedPrerequisites = []) {
    // Prerequisite validation - check against provided achieved list
    const missingPrerequisites = [];
    // Check required prerequisites
    if (researchRequirements.prerequisiteMilestones.length > 0) {
        missingPrerequisites.push(...researchRequirements.prerequisiteMilestones.filter(prereq => !achievedPrerequisites.includes(prereq)));
    }
    // Calculate averages
    const capabilityMetrics = Object.values(currentCapability);
    const avgCapability = capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
    const alignmentMetrics = Object.values(currentAlignment);
    const avgAlignment = alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
    // Check requirements
    const requirementsMet = {
        prerequisites: missingPrerequisites.length === 0,
        capability: avgCapability >= researchRequirements.minimumCapabilityLevel,
        alignment: avgAlignment >= researchRequirements.minimumAlignmentLevel,
        researchPoints: researchPointsInvested >= researchRequirements.researchPointsCost,
        computeBudget: computeBudgetSpent >= researchRequirements.computeBudgetRequired,
    };
    const canAttempt = Object.values(requirementsMet).every(met => met === true);
    return {
        canAttempt,
        missingPrerequisites,
        requirementsMet,
    };
}
/**
 * Generate capability gains for milestone achievement
 *
 * @param milestoneType - The milestone achieved
 * @returns Capability metrics gains
 */
function generateCapabilityGain(milestoneType) {
    // Capability gains vary by milestone type
    const gains = {
        [agi_1.MilestoneType.ADVANCED_REASONING]: { reasoningScore: 25, learningEfficiency: 10 },
        [agi_1.MilestoneType.STRATEGIC_PLANNING]: { planningCapability: 30, reasoningScore: 10 },
        [agi_1.MilestoneType.TRANSFER_LEARNING]: { generalizationAbility: 35, learningEfficiency: 15 },
        [agi_1.MilestoneType.SELF_IMPROVEMENT]: { selfImprovementRate: 0.3, learningEfficiency: 20 },
        [agi_1.MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: { generalizationAbility: 20, creativityScore: 15 },
        [agi_1.MilestoneType.GENERAL_INTELLIGENCE]: {
            reasoningScore: 20,
            planningCapability: 20,
            generalizationAbility: 30,
            creativityScore: 25,
            learningEfficiency: 25,
        },
        [agi_1.MilestoneType.SUPERINTELLIGENCE]: {
            reasoningScore: 30,
            planningCapability: 30,
            selfImprovementRate: 0.5,
            generalizationAbility: 40,
            creativityScore: 35,
            learningEfficiency: 40,
        },
        [agi_1.MilestoneType.VALUE_ALIGNMENT]: { creativityScore: 5 },
        [agi_1.MilestoneType.INTERPRETABILITY]: { learningEfficiency: 5 },
        [agi_1.MilestoneType.MULTI_AGENT_COORDINATION]: { planningCapability: 15, generalizationAbility: 10 },
        [agi_1.MilestoneType.CREATIVE_PROBLEM_SOLVING]: { creativityScore: 30, reasoningScore: 15 },
        [agi_1.MilestoneType.META_LEARNING]: { learningEfficiency: 30, selfImprovementRate: 0.2 },
    };
    const milestoneGains = gains[milestoneType] || {};
    return {
        reasoningScore: milestoneGains.reasoningScore || 0,
        planningCapability: milestoneGains.planningCapability || 0,
        selfImprovementRate: milestoneGains.selfImprovementRate || 0,
        generalizationAbility: milestoneGains.generalizationAbility || 0,
        creativityScore: milestoneGains.creativityScore || 0,
        learningEfficiency: milestoneGains.learningEfficiency || 0,
    };
}
/**
 * Generate alignment changes for milestone achievement
 *
 * @param milestoneType - The milestone achieved
 * @returns Alignment metrics changes (can be negative)
 */
function generateAlignmentChange(milestoneType) {
    // Alignment-focused milestones improve safety, others may reduce it
    const changes = {
        [agi_1.MilestoneType.ADVANCED_REASONING]: { safetyMeasures: -5, interpretability: -5 },
        [agi_1.MilestoneType.STRATEGIC_PLANNING]: { safetyMeasures: -8, controlMechanisms: -5 },
        [agi_1.MilestoneType.TRANSFER_LEARNING]: { safetyMeasures: -5, valueAlignmentScore: -5 },
        [agi_1.MilestoneType.SELF_IMPROVEMENT]: { safetyMeasures: -15, controlMechanisms: -10, robustness: -10 },
        [agi_1.MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: { interpretability: -5 },
        [agi_1.MilestoneType.GENERAL_INTELLIGENCE]: {
            safetyMeasures: -20,
            controlMechanisms: -15,
            robustness: -15,
            interpretability: -10,
        },
        [agi_1.MilestoneType.SUPERINTELLIGENCE]: {
            safetyMeasures: -30,
            valueAlignmentScore: -25,
            controlMechanisms: -25,
            interpretability: -20,
            robustness: -20,
            ethicalConstraints: -15,
        },
        [agi_1.MilestoneType.VALUE_ALIGNMENT]: {
            valueAlignmentScore: 35,
            ethicalConstraints: 30,
            safetyMeasures: 20,
        },
        [agi_1.MilestoneType.INTERPRETABILITY]: {
            interpretability: 40,
            safetyMeasures: 15,
            controlMechanisms: 10,
        },
        [agi_1.MilestoneType.MULTI_AGENT_COORDINATION]: { safetyMeasures: -5, robustness: -5 },
        [agi_1.MilestoneType.CREATIVE_PROBLEM_SOLVING]: { interpretability: -10, ethicalConstraints: -5 },
        [agi_1.MilestoneType.META_LEARNING]: { safetyMeasures: -10, controlMechanisms: -8 },
    };
    const milestoneChanges = changes[milestoneType] || {};
    return {
        safetyMeasures: milestoneChanges.safetyMeasures || 0,
        valueAlignmentScore: milestoneChanges.valueAlignmentScore || 0,
        controlMechanisms: milestoneChanges.controlMechanisms || 0,
        interpretability: milestoneChanges.interpretability || 0,
        robustness: milestoneChanges.robustness || 0,
        ethicalConstraints: milestoneChanges.ethicalConstraints || 0,
    };
}
/**
 * Calculate impact consequences of achieving milestone
 *
 * @param milestoneType - The milestone achieved
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @returns Impact consequences
 */
function calculateImpactConsequences(milestoneType, currentCapability, currentAlignment) {
    const complexity = exports.MILESTONE_COMPLEXITY[milestoneType];
    // Impact scales with milestone complexity
    const baseDisruption = complexity * 8; // 24-80 range
    const baseRegulation = complexity * 7; // 21-70 range
    const baseAdvantage = complexity * 9; // 27-90 range
    const baseValue = complexity * 50000000; // $150M-$500M range
    // Capability-alignment gap affects public perception and risk
    const capMetrics = Object.values(currentCapability);
    const alignMetrics = Object.values(currentAlignment);
    const avgCap = capMetrics.reduce((s, v) => s + v, 0) / capMetrics.length;
    const avgAlign = alignMetrics.reduce((s, v) => s + v, 0) / alignMetrics.length;
    const gap = avgCap - avgAlign;
    // Public perception: positive if aligned, negative if high capability gap
    const publicPerception = Math.max(-50, Math.min(50, (avgAlign - 50) / 2 - gap / 4));
    // Catastrophic risk increases with gap and complexity
    const catastrophicRisk = Math.min(1, (gap / 100) * (complexity / 5));
    return {
        industryDisruptionLevel: Math.min(100, baseDisruption),
        regulatoryAttention: Math.min(100, baseRegulation),
        publicPerceptionChange: Math.round(publicPerception * 100) / 100,
        competitiveAdvantage: Math.min(100, baseAdvantage),
        catastrophicRiskProbability: Math.round(catastrophicRisk * 10000) / 10000,
        economicValueCreated: baseValue,
    };
}
//# sourceMappingURL=agiMilestones.js.map