"use strict";
/**
 * Evaluate Alignment Tradeoff
 *
 * Compares SafetyFirst, Balanced, and CapabilityFirst strategic paths.
 * Provides recommendation based on current alignment level and budget constraints.
 *
 * @module utils/ai/agi/evaluateAlignmentTradeoff
 * @category AI Industry - AGI Utilities
 *
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 *
 * @example
 * ```typescript
 * const tradeoff = evaluateAlignmentTradeoff({
 *   currentAlignment: 55,
 *   currentCapability: 40,
 *   availableBudget: 2000000000
 * });
 *
 * console.log(tradeoff.recommendation); // 'Balanced'
 * console.log(tradeoff.reasoning);
 * // "Current alignment (55) is moderate. Balanced path offers best risk/reward..."
 *
 * console.log(tradeoff.safetyFirstPath.timeline); // 48
 * console.log(tradeoff.balancedPath.catastrophicRisk); // 0.15
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAlignmentTradeoff = evaluateAlignmentTradeoff;
const agi_1 = require("@/lib/types/models/ai/agi");
/**
 * Evaluate alignment tradeoff across three strategic paths
 *
 * Compares:
 * - SafetyFirst: 48mo, 85 final align, 5% risk, $800M cost
 * - Balanced: 36mo, 70 final align, 15% risk, $1.2B cost
 * - CapabilityFirst: 24mo, 40 final align, 35% risk, $1.8B cost (requires align >= 60)
 *
 * Recommendation logic:
 * 1. If current alignment < 40: FORCE SafetyFirst (critical risk)
 * 2. If current alignment >= 70 AND budget >= $1.8B: Allow CapabilityFirst
 * 3. If budget < $1B: Recommend SafetyFirst (affordable safety)
 * 4. Otherwise: Recommend Balanced (optimal middle ground)
 *
 * Cost-benefit analysis:
 * - SafetyFirst: $16.7M/month, 5% risk, high public approval
 * - Balanced: $33.3M/month, 15% risk, market competitive
 * - CapabilityFirst: $75M/month, 35% risk, first-mover advantage
 *
 * @param input - Current alignment, capability, and budget
 * @returns Three-path comparison with recommendation and reasoning
 */
function evaluateAlignmentTradeoff(input) {
    const { currentAlignment, currentCapability, availableBudget } = input;
    // Define SafetyFirst path characteristics
    const safetyFirstPath = {
        timeline: 48, // months
        finalAlignment: Math.min(100, currentAlignment + 85),
        catastrophicRisk: 0.05, // 5%
        estimatedCost: 800000000, // $800M
        pros: [
            'Minimal catastrophic risk (5%)',
            'High public approval and regulatory compliance',
            'Attracts alignment-focused talent and partnerships',
            'Long-term reputation as responsible AI leader',
            'Lower insurance premiums and legal liability',
        ],
        cons: [
            'Longest timeline (48 months) - competitors may reach AGI first',
            'Highest research investment (75k RP)',
            'Opportunity cost: delayed market entry',
            'May miss first-mover economic advantages',
        ],
    };
    // Define Balanced path characteristics
    const balancedPath = {
        timeline: 36, // months
        finalAlignment: Math.min(100, currentAlignment + 70),
        catastrophicRisk: 0.15, // 15%
        estimatedCost: 1200000000, // $1.2B
        pros: [
            'Competitive timeline (3 years)',
            'Moderate catastrophic risk (15%)',
            'Balanced reputation (safety + innovation)',
            'Attracts diverse talent pool',
            'Flexibility to pivot between safety and speed',
        ],
        cons: [
            'Higher cost than SafetyFirst ($1.2B vs $800M)',
            'Not first-mover (CapabilityFirst reaches AGI 12mo earlier)',
            'Moderate risk requires continuous monitoring',
            'May face regulatory scrutiny mid-development',
        ],
    };
    // Define CapabilityFirst path characteristics
    const capabilityFirstPath = {
        timeline: 24, // months
        finalAlignment: Math.min(100, currentAlignment + 40),
        catastrophicRisk: 0.35, // 35%
        estimatedCost: 1800000000, // $1.8B
        requiresMinimumAlignment: 60,
        pros: [
            'Fastest timeline (24 months) - likely first to AGI',
            'First-mover advantage: market dominance, talent attraction',
            'Highest economic value creation potential',
            'Competitive moat: 12-month lead over Balanced path',
            'Maximum shareholder value short-term',
        ],
        cons: [
            'Highest catastrophic risk (35%) - existential threat',
            'Requires current alignment >= 60 (blocked if lower)',
            'Public backlash and regulatory intervention likely',
            'Talent attrition (alignment-focused researchers leave)',
            'Highest cost ($1.8B) and burn rate ($75M/month)',
            'Reputational damage if safety incident occurs',
        ],
    };
    // Determine recommendation based on current state
    let recommendation;
    let reasoning;
    if (currentAlignment < 40) {
        // FORCE SafetyFirst: Critical risk zone
        recommendation = agi_1.AlignmentStance.SAFETY_FIRST;
        reasoning = `CRITICAL: Current alignment (${currentAlignment}) is dangerously low. CapabilityFirst and Balanced paths pose unacceptable catastrophic risk (>30%). SafetyFirst path REQUIRED to establish safety foundation before advancing capabilities. Recommend achieving Value Alignment and Interpretability milestones immediately to raise alignment above 60 before reconsidering strategy.`;
    }
    else if (currentAlignment >= 70 && availableBudget >= 1800000000) {
        // Allow CapabilityFirst: High alignment + sufficient budget
        recommendation = agi_1.AlignmentStance.CAPABILITY_FIRST;
        reasoning = `Current alignment (${currentAlignment}) is high and budget ($${(availableBudget / 1e9).toFixed(1)}B) sufficient for CapabilityFirst path. While catastrophic risk (35%) is significant, strong alignment foundation mitigates worst outcomes. First-mover advantage (12-month lead, market dominance) justifies risk for aggressive growth strategy. Recommend continuous monitoring and emergency shutdown protocols.`;
    }
    else if (availableBudget < 1000000000) {
        // Recommend SafetyFirst: Budget constraint
        recommendation = agi_1.AlignmentStance.SAFETY_FIRST;
        reasoning = `Available budget ($${(availableBudget / 1e9).toFixed(1)}B) favors SafetyFirst path ($800M vs $1.2B Balanced, $1.8B CapabilityFirst). While timeline is longer (48mo), cost efficiency and minimal risk (5%) make this optimal for budget-conscious development. SafetyFirst also positions company as responsible AI leader, attracting alignment-focused investors and talent.`;
    }
    else {
        // Recommend Balanced: Default optimal middle ground
        recommendation = agi_1.AlignmentStance.BALANCED;
        reasoning = `Current alignment (${currentAlignment}) is moderate. Balanced path offers optimal risk/reward tradeoff: competitive timeline (36mo), manageable catastrophic risk (15%), and budget ($${(availableBudget / 1e9).toFixed(1)}B) sufficient for $1.2B cost. Provides flexibility to pivot toward safety or speed based on competitive landscape. Recommended for companies prioritizing sustainable growth over extreme risk or extreme caution.`;
    }
    return {
        safetyFirstPath,
        balancedPath,
        capabilityFirstPath,
        recommendation,
        reasoning,
    };
}
//# sourceMappingURL=evaluateAlignmentTradeoff.js.map