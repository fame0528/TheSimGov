"use strict";
/**
 * Assess Alignment Tax
 *
 * Calculates speed penalty (time overhead) for safety measures.
 * Determines if alignment investment is cost-effective based on risk reduction.
 *
 * @module utils/ai/agi/assessAlignmentTax
 * @category AI Industry - AGI Utilities
 *
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 *
 * @example
 * ```typescript
 * const tax = assessAlignmentTax({
 *   alignmentLevel: 70,
 *   baselineSpeed: 3,
 *   catastrophicRiskReduction: 0.25
 * });
 *
 * console.log(tax.taxedSpeed); // 4.6 months
 * console.log(tax.taxPercentage); // 53%
 * console.log(tax.worthIt); // true
 * console.log(tax.reasoning);
 * // "Alignment tax of 53% (1.6 additional months) is justified..."
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessAlignmentTax = assessAlignmentTax;
/**
 * Calculate alignment tax (speed penalty for safety measures)
 *
 * Formula:
 * - Base speed: 3 months per milestone (no alignment overhead)
 * - Tax: +0.08 months per alignment point above 50
 * - Taxed speed = Base + (align - 50) × 0.08
 *
 * Examples:
 * - 50 align: 3.0mo (0% tax)
 * - 60 align: 3.8mo (27% tax)
 * - 70 align: 4.6mo (53% tax)
 * - 80 align: 5.4mo (80% tax)
 * - 90 align: 6.2mo (107% tax)
 * - 100 align: 7.0mo (133% tax)
 *
 * Worth-it analysis:
 * Tax is justified if:
 * 1. Cost-benefit ratio > 1.5 (safety value exceeds time cost)
 * 2. Alignment level >= 70 (strong safety foundation)
 * 3. Catastrophic risk reduction >= 20% (significant danger mitigation)
 *
 * Safety benefits scale with alignment:
 * - 50-60 align: Basic safety (testing, monitoring)
 * - 60-70 align: Moderate safety (interpretability, control mechanisms)
 * - 70-80 align: Strong safety (value alignment, robustness)
 * - 80-90 align: Very strong safety (comprehensive constraints)
 * - 90-100 align: Maximum safety (multilayered safeguards)
 *
 * @param input - Alignment level, baseline speed, risk reduction
 * @returns Tax analysis with time overhead, percentage, worth-it determination, reasoning
 */
function assessAlignmentTax(input) {
    const { alignmentLevel, baselineSpeed, catastrophicRiskReduction } = input;
    // Calculate tax
    const alignmentAboveThreshold = Math.max(0, alignmentLevel - 50);
    const monthsAdded = alignmentAboveThreshold * 0.08;
    const taxedSpeed = baselineSpeed + monthsAdded;
    const taxPercentage = baselineSpeed > 0 ? (monthsAdded / baselineSpeed) * 100 : 0;
    // Determine safety benefits based on alignment level
    const safetyBenefits = [];
    if (alignmentLevel >= 50) {
        safetyBenefits.push('Basic safety testing and monitoring infrastructure', 'Standard error handling and containment protocols');
    }
    if (alignmentLevel >= 60) {
        safetyBenefits.push('Enhanced interpretability (explainable AI decisions)', 'Control mechanisms (pause, rollback, shutdown capabilities)', 'Reduced public backlash and regulatory scrutiny');
    }
    if (alignmentLevel >= 70) {
        safetyBenefits.push('Value alignment systems (human value preservation)', 'Robustness testing (edge case handling, adversarial resistance)', 'Competitive advantage (attract alignment-focused talent and investors)', 'Lower insurance premiums and legal liability');
    }
    if (alignmentLevel >= 80) {
        safetyBenefits.push('Comprehensive ethical constraints (moral reasoning)', 'Multi-layered safety protocols (defense in depth)', 'Industry leadership reputation (responsible AI pioneer)', 'Government partnerships and R&D grants');
    }
    if (alignmentLevel >= 90) {
        safetyBenefits.push('State-of-the-art safety guarantees (formal verification)', 'Maximum public trust and regulatory approval', 'Long-term competitive moat (safety as differentiator)', 'Reduced existential risk (societal benefit)');
    }
    // Calculate cost-benefit ratio
    // Risk reduction value: Assume $1B potential loss from catastrophic event
    const riskReductionValue = catastrophicRiskReduction * 1000000000;
    // Time cost: Assume $10M/month burn rate
    const timeCost = monthsAdded * 10000000;
    const costBenefitRatio = timeCost > 0 ? riskReductionValue / timeCost : 0;
    // Determine if tax is worth it
    const worthIt = costBenefitRatio > 1.5 ||
        alignmentLevel >= 70 ||
        catastrophicRiskReduction >= 0.2;
    // Generate reasoning
    let reasoning;
    if (alignmentLevel < 50) {
        reasoning = `No alignment tax at current level (${alignmentLevel}). Baseline speed maintained (${baselineSpeed} months). However, alignment below 50 poses significant safety risk. Recommend investing in Value Alignment and Interpretability milestones to establish safety foundation.`;
    }
    else if (worthIt) {
        reasoning = `Alignment tax of ${taxPercentage.toFixed(0)}% (${monthsAdded.toFixed(1)} additional months) is JUSTIFIED. Cost-benefit ratio of ${costBenefitRatio.toFixed(1)}:1 indicates safety value (${(catastrophicRiskReduction * 100).toFixed(0)}% risk reduction = $${(riskReductionValue / 1e9).toFixed(1)}B) far exceeds time cost ($${(timeCost / 1e6).toFixed(0)}M). Alignment level ${alignmentLevel} provides ${safetyBenefits.length} critical safety benefits. Recommended to maintain or increase alignment investment.`;
    }
    else {
        reasoning = `Alignment tax of ${taxPercentage.toFixed(0)}% (${monthsAdded.toFixed(1)} additional months) may NOT be cost-effective at current level. Cost-benefit ratio of ${costBenefitRatio.toFixed(1)}:1 is below recommended threshold (1.5:1). Risk reduction (${(catastrophicRiskReduction * 100).toFixed(0)}%) is modest. Consider whether speed to market justifies reduced safety measures. Alternative: Maintain current alignment (${alignmentLevel}) without further investment, or pivot to CapabilityFirst strategy if competitive pressure is high.`;
    }
    return {
        baseSpeed: baselineSpeed,
        taxedSpeed: parseFloat(taxedSpeed.toFixed(1)),
        taxPercentage: parseFloat(taxPercentage.toFixed(0)),
        monthsAdded: parseFloat(monthsAdded.toFixed(1)),
        alignmentLevel,
        worthIt,
        reasoning,
        safetyBenefits,
    };
}
//# sourceMappingURL=assessAlignmentTax.js.map