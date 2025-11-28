"use strict";
/**
 * Predict Industry Disruption
 *
 * Forecasts market impact of AGI milestone achievement.
 * Models competitive dynamics, market share shift, and regulatory response.
 *
 * @module utils/ai/agi/predictIndustryDisruption
 * @category AI Industry - AGI Utilities
 *
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 *
 * @example
 * ```typescript
 * const disruption = predictIndustryDisruption({
 *   milestoneType: MilestoneType.GENERAL_INTELLIGENCE,
 *   alignmentLevel: 65,
 *   isFirstMover: true,
 *   competitorCount: 5
 * });
 *
 * console.log(disruption.disruptionLevel); // 'Major'
 * console.log(disruption.disruptionScore); // 78
 * console.log(disruption.marketShareShift); // 65%
 * console.log(disruption.affectedIndustries);
 * // ['Software', 'Healthcare', 'Finance', 'Manufacturing', ...]
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictIndustryDisruption = predictIndustryDisruption;
const agi_1 = require("@/lib/types/models/ai/agi");
/**
 * Milestone disruption intensity mapping (0-100 scale)
 *
 * Based on milestone complexity and market impact potential:
 * - Foundation milestones (15-30): Limited industry impact
 * - Intermediate milestones (35-60): Significant market changes
 * - Advanced milestones (70-95): Transformative disruption
 */
const MILESTONE_DISRUPTION = {
    [agi_1.MilestoneType.ADVANCED_REASONING]: 20,
    [agi_1.MilestoneType.STRATEGIC_PLANNING]: 28,
    [agi_1.MilestoneType.TRANSFER_LEARNING]: 35,
    [agi_1.MilestoneType.CREATIVE_PROBLEM_SOLVING]: 32,
    [agi_1.MilestoneType.META_LEARNING]: 42,
    [agi_1.MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 48,
    [agi_1.MilestoneType.MULTI_AGENT_COORDINATION]: 55,
    [agi_1.MilestoneType.SELF_IMPROVEMENT]: 70,
    [agi_1.MilestoneType.GENERAL_INTELLIGENCE]: 88,
    [agi_1.MilestoneType.SUPERINTELLIGENCE]: 95,
    [agi_1.MilestoneType.VALUE_ALIGNMENT]: 15,
    [agi_1.MilestoneType.INTERPRETABILITY]: 18,
};
/**
 * Predict industry disruption from AGI milestone achievement
 *
 * Disruption calculation:
 * 1. Base disruption intensity (15-95 by milestone type)
 * 2. First-mover bonus: +30% if first company to achieve
 * 3. Alignment factor: High alignment = positive perception, faster adoption
 * 4. Competition factor: More competitors = diluted impact
 *
 * Disruption levels:
 * - Minor (<25): Niche applications, limited market adoption
 * - Moderate (25-50): Industry-wide changes, 20-40% market shift
 * - Major (50-75): Market transformation, 40-70% dominance potential
 * - Catastrophic (75-100): Total industry disruption, 70-90% dominance
 *
 * Market dynamics:
 * - First-mover advantage: 12-18 month lead, brand recognition, talent attraction
 * - Network effects: Early adopters create moat (data, integrations, ecosystem)
 * - Competitor response: Fast-follower strategies, acquisitions, partnerships
 *
 * Regulatory response:
 * - Probability = (alignmentFactor × 0.6 + disruptionFactor × 0.4)
 * - High disruption + low alignment = heavy regulation
 * - Moderate disruption + high alignment = supportive policy
 *
 * @param input - Milestone type, alignment, first-mover status, competition
 * @returns Disruption forecast with market impact, competitive dynamics, regulatory probability
 */
function predictIndustryDisruption(input) {
    const { milestoneType, alignmentLevel, isFirstMover, competitorCount } = input;
    // Base disruption from milestone type
    let disruptionScore = MILESTONE_DISRUPTION[milestoneType];
    // Apply first-mover bonus (+30%)
    if (isFirstMover) {
        disruptionScore *= 1.3;
    }
    // Cap at 100
    disruptionScore = Math.min(100, disruptionScore);
    // Determine disruption level
    let disruptionLevel;
    if (disruptionScore < 25) {
        disruptionLevel = 'Minor';
    }
    else if (disruptionScore < 50) {
        disruptionLevel = 'Moderate';
    }
    else if (disruptionScore < 75) {
        disruptionLevel = 'Major';
    }
    else {
        disruptionLevel = 'Catastrophic';
    }
    // Determine affected industries (more with higher disruption)
    const affectedIndustries = ['Software', 'Technology'];
    if (disruptionScore >= 30) {
        affectedIndustries.push('Healthcare', 'Finance');
    }
    if (disruptionScore >= 45) {
        affectedIndustries.push('Manufacturing', 'Retail', 'Education');
    }
    if (disruptionScore >= 60) {
        affectedIndustries.push('Transportation', 'Energy', 'Media', 'Legal Services');
    }
    if (disruptionScore >= 75) {
        affectedIndustries.push('Government', 'Military', 'Agriculture', 'Construction', 'All sectors');
    }
    // Calculate market share shift
    // First-mover can capture 70-90% market share for high disruption
    // Late movers capture 10-30% even with equivalent technology
    const baseMarketShare = isFirstMover ? 70 : 20;
    const disruptionBonus = (disruptionScore / 100) * 20;
    const competitionPenalty = Math.min(30, competitorCount * 5);
    const marketShareShift = Math.max(10, Math.min(90, baseMarketShare + disruptionBonus - competitionPenalty));
    // Generate competitor response strategy
    let competitorResponse;
    if (disruptionLevel === 'Minor') {
        competitorResponse = 'Competitors unlikely to react immediately. Niche applications pose limited threat. Monitor for broader adoption signals.';
    }
    else if (disruptionLevel === 'Moderate') {
        competitorResponse = 'Competitors accelerate internal R&D programs. Fast-follower strategies initiated. Expect competitive launches within 12-18 months. Potential acquisition offers for talent and IP.';
    }
    else if (disruptionLevel === 'Major') {
        competitorResponse = 'Industry-wide panic. Competitors form alliances, launch crash programs. Aggressive talent poaching ($2-5M signing bonuses). Open-source community mobilizes. Regulatory lobbying intensifies. Acquisition offers at premium valuations.';
    }
    else {
        competitorResponse = 'Existential threat to incumbent players. Desperate merger attempts, government intervention requests. Widespread industry restructuring. Market capitalization shifts ($100B+ value transfer). Potential antitrust scrutiny. International competition (nation-state AI programs).';
    }
    // Calculate regulatory probability
    const alignmentFactor = alignmentLevel / 100;
    const disruptionFactor = disruptionScore / 100;
    const regulatoryProbability = Math.min(1, alignmentFactor * 0.6 + disruptionFactor * 0.4);
    // Calculate public opinion impact
    // High alignment + high disruption = positive (innovation with safety)
    // Low alignment + high disruption = negative (fear of uncontrolled AI)
    const publicOpinionImpact = Math.round(((alignmentLevel - 50) / 2) - ((disruptionScore - 50) / 4));
    // Calculate economic impact ($B scale)
    // General Intelligence: $500B+ value creation
    // Superintelligence: $5T+ value creation
    const baseEconomicImpact = disruptionScore * 5000000000; // $5B per point
    const firstMoverBonus = isFirstMover ? 1.5 : 1.0;
    const economicImpact = baseEconomicImpact * firstMoverBonus;
    return {
        disruptionLevel,
        disruptionScore: Math.round(disruptionScore),
        firstMover: isFirstMover,
        affectedIndustries,
        marketShareShift: Math.round(marketShareShift),
        competitorResponse,
        regulatoryProbability: parseFloat(regulatoryProbability.toFixed(2)),
        publicOpinionImpact,
        economicImpact,
    };
}
//# sourceMappingURL=predictIndustryDisruption.js.map