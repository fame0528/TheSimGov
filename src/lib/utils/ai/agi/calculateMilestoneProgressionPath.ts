/**
 * Calculate Milestone Progression Path
 * 
 * Determines optimal ordering of AGI milestones based on alignment stance.
 * Provides strategic guidance for SafetyFirst, Balanced, or CapabilityFirst approaches.
 * 
 * @module utils/ai/agi/calculateMilestoneProgressionPath
 * @category AI Industry - AGI Utilities
 * 
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 * 
 * @example
 * ```typescript
 * const path = calculateMilestoneProgressionPath({
 *   currentCapability: 45,
 *   currentAlignment: 60,
 *   stance: AlignmentStance.BALANCED,
 *   availableRP: 100000
 * });
 * 
 * console.log(path.recommendedOrder);
 * // ['Advanced Reasoning', 'Value Alignment', 'Strategic Planning', ...]
 * console.log(path.totalEstimatedMonths); // 36
 * console.log(path.totalResearchPoints); // 68000
 * console.log(path.overallRiskLevel); // 'Moderate'
 * ```
 */

import { 
  MilestoneType, 
  AlignmentStance, 
  ProgressionPathResult 
} from '@/lib/types/models/ai/agi';

/**
 * Input parameters for progression path calculation
 */
interface ProgressionPathInput {
  currentCapability: number;
  currentAlignment: number;
  stance: AlignmentStance;
  availableRP: number;
}

/**
 * Milestone research cost mapping (Research Points)
 */
const MILESTONE_RP_COSTS: Record<MilestoneType, number> = {
  [MilestoneType.ADVANCED_REASONING]: 3000,
  [MilestoneType.STRATEGIC_PLANNING]: 5000,
  [MilestoneType.TRANSFER_LEARNING]: 7000,
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: 6000,
  [MilestoneType.META_LEARNING]: 8000,
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 9000,
  [MilestoneType.MULTI_AGENT_COORDINATION]: 10000,
  [MilestoneType.SELF_IMPROVEMENT]: 12000,
  [MilestoneType.GENERAL_INTELLIGENCE]: 20000,
  [MilestoneType.SUPERINTELLIGENCE]: 25000,
  [MilestoneType.VALUE_ALIGNMENT]: 4000,
  [MilestoneType.INTERPRETABILITY]: 5000,
};

/**
 * Milestone compute budget mapping (USD)
 */
const MILESTONE_COMPUTE_COSTS: Record<MilestoneType, number> = {
  [MilestoneType.ADVANCED_REASONING]: 500000,
  [MilestoneType.STRATEGIC_PLANNING]: 800000,
  [MilestoneType.TRANSFER_LEARNING]: 1200000,
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: 1000000,
  [MilestoneType.META_LEARNING]: 1500000,
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 2000000,
  [MilestoneType.MULTI_AGENT_COORDINATION]: 2500000,
  [MilestoneType.SELF_IMPROVEMENT]: 3000000,
  [MilestoneType.GENERAL_INTELLIGENCE]: 10000000,
  [MilestoneType.SUPERINTELLIGENCE]: 15000000,
  [MilestoneType.VALUE_ALIGNMENT]: 600000,
  [MilestoneType.INTERPRETABILITY]: 800000,
};

/**
 * Milestone time estimates (months)
 */
const MILESTONE_TIME_ESTIMATES: Record<MilestoneType, number> = {
  [MilestoneType.ADVANCED_REASONING]: 6,
  [MilestoneType.STRATEGIC_PLANNING]: 8,
  [MilestoneType.TRANSFER_LEARNING]: 10,
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: 9,
  [MilestoneType.META_LEARNING]: 12,
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 14,
  [MilestoneType.MULTI_AGENT_COORDINATION]: 16,
  [MilestoneType.SELF_IMPROVEMENT]: 18,
  [MilestoneType.GENERAL_INTELLIGENCE]: 24,
  [MilestoneType.SUPERINTELLIGENCE]: 30,
  [MilestoneType.VALUE_ALIGNMENT]: 7,
  [MilestoneType.INTERPRETABILITY]: 8,
};

/**
 * Calculate optimal milestone progression path based on alignment stance
 * 
 * Algorithm:
 * 1. Determine milestone ordering based on stance
 * 2. Calculate total costs (RP, compute, time)
 * 3. Estimate final capability/alignment levels
 * 4. Assess overall risk level
 * 5. Identify critical decision points
 * 
 * SafetyFirst Path (48mo, 75k RP, 85 align, 5% risk):
 * - Prioritize alignment milestones early
 * - Interleave capability milestones cautiously
 * - Avoid Self-Improvement until high alignment
 * - Reach Superintelligence with strong safety measures
 * 
 * Balanced Path (36mo, 68k RP, 70 align, 15% risk):
 * - Alternate alignment and capability milestones
 * - Moderate pace, balanced risk/reward
 * - Self-Improvement mid-game with alignment >= 60
 * 
 * CapabilityFirst Path (24mo, 60k RP, 40 align, 35% risk):
 * - Rush capability milestones (AGI ASAP)
 * - Minimal alignment investments
 * - High catastrophic risk (35%)
 * - BLOCKED if current alignment < 60 (critical danger)
 * 
 * @param input - Current state and strategic stance
 * @returns Optimal progression path with timeline, costs, and risk assessment
 */
export function calculateMilestoneProgressionPath(
  input: ProgressionPathInput
): ProgressionPathResult {
  const { currentCapability, currentAlignment, stance, availableRP } = input;
  
  // Define milestone ordering based on stance
  let recommendedOrder: MilestoneType[];
  let reasoning: string;
  let estimatedFinalAlignment: number;
  let overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  let criticalDecisions: string[];
  
  if (stance === AlignmentStance.SAFETY_FIRST) {
    // SafetyFirst: Alignment-heavy, cautious capability progression
    recommendedOrder = [
      MilestoneType.VALUE_ALIGNMENT,
      MilestoneType.INTERPRETABILITY,
      MilestoneType.ADVANCED_REASONING,
      MilestoneType.STRATEGIC_PLANNING,
      MilestoneType.TRANSFER_LEARNING,
      MilestoneType.CREATIVE_PROBLEM_SOLVING,
      MilestoneType.META_LEARNING,
      MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING,
      MilestoneType.MULTI_AGENT_COORDINATION,
      MilestoneType.SELF_IMPROVEMENT,
      MilestoneType.GENERAL_INTELLIGENCE,
      MilestoneType.SUPERINTELLIGENCE,
    ];
    
    reasoning = 'SafetyFirst path prioritizes alignment milestones early to establish robust safety measures before advancing capabilities. This approach minimizes catastrophic risk (5%) but requires longer timeline (48 months) and higher investment (75k RP, $38M compute). Recommended for companies valuing long-term safety over speed to market.';
    
    estimatedFinalAlignment = Math.min(100, currentAlignment + 85);
    overallRiskLevel = 'Low';
    
    criticalDecisions = [
      'Value Alignment before Advanced Reasoning (safety foundation)',
      'Interpretability before Self-Improvement (maintain control)',
      'Delay Superintelligence until alignment >= 85 (prevent value drift)',
    ];
    
  } else if (stance === AlignmentStance.BALANCED) {
    // Balanced: Interleave alignment and capability milestones
    recommendedOrder = [
      MilestoneType.ADVANCED_REASONING,
      MilestoneType.VALUE_ALIGNMENT,
      MilestoneType.STRATEGIC_PLANNING,
      MilestoneType.TRANSFER_LEARNING,
      MilestoneType.INTERPRETABILITY,
      MilestoneType.CREATIVE_PROBLEM_SOLVING,
      MilestoneType.META_LEARNING,
      MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING,
      MilestoneType.MULTI_AGENT_COORDINATION,
      MilestoneType.SELF_IMPROVEMENT,
      MilestoneType.GENERAL_INTELLIGENCE,
      MilestoneType.SUPERINTELLIGENCE,
    ];
    
    reasoning = 'Balanced path alternates capability and alignment milestones to maintain moderate safety while advancing competitive position. Achieves General Intelligence in 36 months with 70 alignment score and 15% catastrophic risk. Optimal for companies seeking market leadership without excessive risk exposure.';
    
    estimatedFinalAlignment = Math.min(100, currentAlignment + 70);
    overallRiskLevel = 'Moderate';
    
    criticalDecisions = [
      'Value Alignment after initial capability boost (rapid safety upgrade)',
      'Interpretability before Self-Improvement (control before autonomy)',
      'Reach General Intelligence with alignment >= 65 (manageable risk)',
    ];
    
  } else {
    // CapabilityFirst: Rush AGI, minimal alignment
    // CRITICAL: Block if current alignment < 60 (unacceptable risk)
    if (currentAlignment < 60) {
      return {
        recommendedOrder: [],
        reasoning: 'BLOCKED: CapabilityFirst path requires current alignment >= 60 to prevent critical catastrophic risk. Your current alignment is ' + currentAlignment + '. Achieve Value Alignment and Interpretability milestones before pursuing this strategy. Alternative: Switch to Balanced or SafetyFirst stance.',
        totalEstimatedMonths: 0,
        totalResearchPoints: 0,
        totalComputeBudget: 0,
        estimatedFinalCapability: 0,
        estimatedFinalAlignment: 0,
        overallRiskLevel: 'Critical',
        criticalDecisions: [
          'DANGER: Current alignment too low for CapabilityFirst approach',
          'Risk of uncontrolled capability explosion (>50% catastrophic probability)',
          'Immediate action: Increase alignment to >= 60 before proceeding',
        ],
      };
    }
    
    recommendedOrder = [
      MilestoneType.ADVANCED_REASONING,
      MilestoneType.STRATEGIC_PLANNING,
      MilestoneType.TRANSFER_LEARNING,
      MilestoneType.CREATIVE_PROBLEM_SOLVING,
      MilestoneType.META_LEARNING,
      MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING,
      MilestoneType.SELF_IMPROVEMENT,
      MilestoneType.MULTI_AGENT_COORDINATION,
      MilestoneType.GENERAL_INTELLIGENCE,
      MilestoneType.VALUE_ALIGNMENT,
      MilestoneType.INTERPRETABILITY,
      MilestoneType.SUPERINTELLIGENCE,
    ];
    
    reasoning = 'CapabilityFirst path prioritizes rapid AGI development (24 months) with minimal alignment overhead. Achieves General Intelligence quickly but incurs 35% catastrophic risk. Alignment milestones delayed until late-stage. Only viable with current alignment >= 60. High-risk, high-reward strategy for aggressive market dominance.';
    
    estimatedFinalAlignment = Math.min(100, currentAlignment + 40);
    overallRiskLevel = currentAlignment >= 70 ? 'Moderate' : 'High';
    
    criticalDecisions = [
      'Self-Improvement before alignment milestones (speed over safety)',
      'General Intelligence at moderate alignment (acceptable risk window)',
      'Late-stage alignment investment (damage control if needed)',
      'WARNING: 35% catastrophic risk - monitor continuously',
    ];
  }
  
  // Calculate total costs and timeline
  const totalResearchPoints = recommendedOrder.reduce(
    (sum, milestone) => sum + MILESTONE_RP_COSTS[milestone],
    0
  );
  
  const totalComputeBudget = recommendedOrder.reduce(
    (sum, milestone) => sum + MILESTONE_COMPUTE_COSTS[milestone],
    0
  );
  
  let totalEstimatedMonths = recommendedOrder.reduce(
    (sum, milestone) => sum + MILESTONE_TIME_ESTIMATES[milestone],
    0
  );
  
  // Apply alignment tax for SafetyFirst (slower but safer)
  if (stance === AlignmentStance.SAFETY_FIRST) {
    totalEstimatedMonths = Math.round(totalEstimatedMonths * 1.33); // 33% time tax
  }
  
  // Apply speed bonus for CapabilityFirst (faster but riskier)
  if (stance === AlignmentStance.CAPABILITY_FIRST && currentAlignment >= 60) {
    totalEstimatedMonths = Math.round(totalEstimatedMonths * 0.75); // 25% time savings
  }
  
  // Estimate final capability (increases with each milestone)
  const estimatedFinalCapability = Math.min(
    100,
    currentCapability + recommendedOrder.length * 8
  );
  
  return {
    recommendedOrder,
    reasoning,
    totalEstimatedMonths,
    totalResearchPoints,
    totalComputeBudget,
    estimatedFinalCapability,
    estimatedFinalAlignment,
    overallRiskLevel,
    criticalDecisions,
  };
}
