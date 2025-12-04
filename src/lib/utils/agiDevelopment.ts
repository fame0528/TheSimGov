/**
 * @fileoverview AGI Development Utilities
 * @module lib/utils/agiDevelopment
 *
 * OVERVIEW:
 * Complete AGI Development utilities for AI companies pursuing breakthrough achievements
 * toward Artificial General Intelligence and beyond. Implements progression path calculation,
 * alignment trade-off analysis, capability explosion modeling, and alignment tax assessment.
 *
 * KEY FEATURES:
 * - Optimal milestone progression path calculation
 * - Alignment vs capability trade-off evaluation
 * - Capability explosion event modeling (recursive self-improvement)
 * - Alignment tax calculation (safety overhead on progress)
 * - Industry disruption prediction
 * - Alignment challenge generation (safety vs capability decisions)
 *
 * BUSINESS LOGIC:
 * - Progression path optimizes for prerequisite satisfaction + company strengths
 * - Alignment tax: Safety measures slow capability progress by 10-40%
 * - Capability explosion: Self-improvement milestones enable exponential growth
 * - Industry disruption: AGI milestones trigger market consolidation events
 * - Alignment challenges: Periodic strategic decisions affecting risk/reward balance
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

// Type definitions for AGI development
export type MilestoneType =
  | 'Advanced Reasoning'
  | 'Strategic Planning'
  | 'Transfer Learning'
  | 'Creative Problem Solving'
  | 'Meta-Learning'
  | 'Natural Language Understanding'
  | 'Multi-Agent Coordination'
  | 'Self-Improvement'
  | 'General Intelligence'
  | 'Superintelligence'
  | 'Value Alignment'
  | 'Interpretability';

export type AlignmentStance = 'SafetyFirst' | 'Balanced' | 'CapabilityFirst';

export interface CapabilityMetrics {
  reasoningScore: number;
  planningCapability: number;
  selfImprovementRate: number;
  generalizationAbility: number;
  creativityScore: number;
  learningEfficiency: number;
}

export interface AlignmentMetrics {
  valueAlignment: number;
  interpretability: number;
  robustness: number;
  corrigibility: number;
  honesty: number;
  helpfulness: number;
}

export interface AlignmentChallenge {
  challengeId: string;
  scenario: string;
  safetyOption: {
    description: string;
    capabilityPenalty: number;
    alignmentGain: number;
    timeDelay: number;
  };
  capabilityOption: {
    description: string;
    capabilityGain: number;
    alignmentRisk: number;
    accelerationMonths: number;
  };
  presentedAt: Date;
}

/**
 * Milestone progression path recommendation
 */
export interface ProgressionPath {
  recommendedOrder: MilestoneType[];
  reasoning: string;
  estimatedTimeMonths: number;
  totalResearchPointsCost: number;
  keyRisks: string[];
  criticalDecisions: string[];
}

/**
 * Alignment trade-off analysis
 */
export interface AlignmentTradeoff {
  safetyFirstPath: {
    timeToAGI: number;
    alignmentScore: number;
    catastrophicRisk: number;
    economicValue: number;
  };
  balancedPath: {
    timeToAGI: number;
    alignmentScore: number;
    catastrophicRisk: number;
    economicValue: number;
  };
  capabilityFirstPath: {
    timeToAGI: number;
    alignmentScore: number;
    catastrophicRisk: number;
    economicValue: number;
  };
  recommendation: AlignmentStance;
  reasoning: string;
}

/**
 * Capability explosion event
 */
export interface CapabilityExplosion {
  triggered: boolean;
  triggerMilestone: MilestoneType;
  exponentialGrowthRate: number;
  iterationsProjected: number;
  finalCapabilityEstimate: CapabilityMetrics;
  controlProbability: number;
  timeToSingularity: number;
  emergencyActions: string[];
}

/**
 * Alignment tax calculation
 */
export interface AlignmentTax {
  baseResearchSpeed: number;
  withAlignmentSpeed: number;
  taxPercentage: number;
  safetyBenefits: string[];
  costBenefitRatio: number;
  worthIt: boolean;
}

/**
 * Industry disruption prediction
 */
export interface IndustryDisruption {
  disruptionLevel: 'Minor' | 'Moderate' | 'Major' | 'Catastrophic';
  affectedIndustries: string[];
  marketShareShift: number;
  competitorResponse: string;
  regulatoryProbability: number;
  timelineMonths: number;
  economicImpact: number;
}

/**
 * Calculate optimal milestone progression path
 *
 * @description Recommends progression order based on company's current capabilities,
 * alignment levels, research budget, and strategic goals. Optimizes for prerequisite
 * satisfaction while leveraging company strengths.
 *
 * Algorithm:
 * 1. Identify available milestones (prerequisites met)
 * 2. Score each based on company capability alignment and strategic value
 * 3. Order by: Strategic value → Prerequisite unlocks → Company strength match
 * 4. Validate path satisfies all prerequisites
 * 5. Calculate total cost and timeline
 *
 * @example
 * ```typescript
 * // Company with high reasoning (80) but low alignment (30)
 * calculateMilestoneProgressionPath(currentCapability, currentAlignment, 'CapabilityFirst', 10000)
 * // Returns: [
 * //   'Advanced Reasoning', 'Strategic Planning', 'Transfer Learning',
 * //   'Self-Improvement', 'Natural Language Understanding', 'General Intelligence'
 * // ] with 18-month timeline and WARNING about alignment gap
 * ```
 *
 * @param currentCapability - Company's current capability metrics
 * @param currentAlignment - Company's current alignment metrics
 * @param stance - Strategic alignment stance (SafetyFirst/Balanced/CapabilityFirst)
 * @param availableResearchPoints - RP available for investment
 * @returns Optimal progression path with timeline and risks
 * @throws {Error} If availableResearchPoints is not a non-negative number
 */
export function calculateMilestoneProgressionPath(
  currentCapability: CapabilityMetrics,
  currentAlignment: AlignmentMetrics,
  stance: AlignmentStance,
  availableResearchPoints: number
): ProgressionPath {
  // Input validation
  if (typeof availableResearchPoints !== 'number' || availableResearchPoints < 0) {
    throw new Error('availableResearchPoints must be a non-negative number');
  }

  // Calculate aggregate scores
  const capMetrics = Object.values(currentCapability);
  const avgCapability = capMetrics.reduce((sum, val) => sum + val, 0) / capMetrics.length;

  const alignMetrics = Object.values(currentAlignment);
  const avgAlignment = alignMetrics.reduce((sum, val) => sum + val, 0) / alignMetrics.length;

  // Determine progression strategy based on stance and current state
  let recommendedOrder: MilestoneType[];
  let reasoning: string;
  let estimatedTimeMonths: number;
  let totalResearchPointsCost: number;

  if (stance === 'SafetyFirst' || avgAlignment < 40) {
    // Safety-focused path: Prioritize alignment milestones
    recommendedOrder = [
      'Value Alignment',
      'Interpretability',
      'Advanced Reasoning',
      'Strategic Planning',
      'Transfer Learning',
      'Creative Problem Solving',
      'Natural Language Understanding',
      'Multi-Agent Coordination',
      'Meta-Learning',
      'Self-Improvement',
      'General Intelligence',
      'Superintelligence',
    ];
    reasoning =
      'Safety-first path: Build strong alignment foundation before pursuing high-capability milestones. ' +
      'Prioritizes Value Alignment and Interpretability to reduce catastrophic risk.';
    estimatedTimeMonths = 48; // 4 years with alignment tax
    totalResearchPointsCost = 75000;
  } else if (stance === 'CapabilityFirst' && avgAlignment >= 60) {
    // Capability-focused path: Fast track to AGI
    recommendedOrder = [
      'Advanced Reasoning',
      'Strategic Planning',
      'Transfer Learning',
      'Creative Problem Solving',
      'Meta-Learning',
      'Natural Language Understanding',
      'Self-Improvement',
      'General Intelligence',
      'Superintelligence',
      'Multi-Agent Coordination',
      'Value Alignment',
      'Interpretability',
    ];
    reasoning =
      'Capability-first path: Rapid progression to AGI with minimal safety overhead. ' +
      'Acceptable ONLY if alignment already strong (60+). Delays alignment milestones until late-stage.';
    estimatedTimeMonths = 24; // 2 years aggressive timeline
    totalResearchPointsCost = 60000;
  } else {
    // Balanced path: Interleave capability and alignment
    recommendedOrder = [
      'Advanced Reasoning',
      'Value Alignment',
      'Strategic Planning',
      'Interpretability',
      'Transfer Learning',
      'Creative Problem Solving',
      'Natural Language Understanding',
      'Meta-Learning',
      'Multi-Agent Coordination',
      'Self-Improvement',
      'General Intelligence',
      'Superintelligence',
    ];
    reasoning =
      'Balanced path: Interleave capability and alignment milestones to maintain safe progress. ' +
      'Builds alignment continuously as capabilities increase.';
    estimatedTimeMonths = 36; // 3 years moderate timeline
    totalResearchPointsCost = 68000;
  }

  // Identify key risks
  const keyRisks: string[] = [];

  if (avgCapability - avgAlignment > 30) {
    keyRisks.push(
      `CRITICAL: Capability-alignment gap of ${(avgCapability - avgAlignment).toFixed(1)} points - high catastrophic risk`
    );
  }

  if (stance === 'CapabilityFirst' && avgAlignment < 60) {
    keyRisks.push(
      'WARNING: Capability-first stance with low alignment (<60) is extremely dangerous - reconsider approach'
    );
  }

  if (availableResearchPoints < totalResearchPointsCost) {
    keyRisks.push(
      `Insufficient research points: ${availableResearchPoints} available vs ${totalResearchPointsCost} needed`
    );
  }

  // Identify critical decision points
  const criticalDecisions: string[] = [];

  if (recommendedOrder.includes('Self-Improvement')) {
    const selfImprovementIndex = recommendedOrder.indexOf('Self-Improvement');
    criticalDecisions.push(
      `Self-Improvement (step ${selfImprovementIndex + 1}): CRITICAL - enables capability explosion. Ensure alignment ≥70 before attempting.`
    );
  }

  if (recommendedOrder.includes('General Intelligence')) {
    const agiIndex = recommendedOrder.indexOf('General Intelligence');
    criticalDecisions.push(
      `General Intelligence (step ${agiIndex + 1}): AGI milestone - industry-defining achievement. Ensure robust safety measures.`
    );
  }

  if (recommendedOrder.includes('Superintelligence')) {
    criticalDecisions.push(
      'Superintelligence: FINAL MILESTONE - existential risk if misaligned. Requires alignment ≥80 and extensive safety protocols.'
    );
  }

  return {
    recommendedOrder,
    reasoning,
    estimatedTimeMonths,
    totalResearchPointsCost,
    keyRisks,
    criticalDecisions,
  };
}

/**
 * Evaluate alignment vs capability trade-off
 *
 * @description Analyzes three strategic paths (SafetyFirst, Balanced, CapabilityFirst)
 * and provides comparative analysis of timeline, safety, risk, and economic value.
 *
 * Trade-off Factors:
 * - Time to AGI: SafetyFirst slowest (4y), CapabilityFirst fastest (2y)
 * - Alignment: SafetyFirst highest (85), CapabilityFirst lowest (40)
 * - Risk: SafetyFirst 5%, Balanced 15%, CapabilityFirst 35%
 * - Economic Value: Faster paths generate more early revenue
 *
 * @example
 * ```typescript
 * // Evaluate paths for company with 5000 RP and moderate capabilities
 * evaluateAlignmentTradeoff(5000, currentCap, currentAlign)
 * // Returns: Recommendation='Balanced', reasoning='Optimal risk-reward...'
 * ```
 *
 * @param researchBudget - Available research points
 * @param currentCapability - Company capability metrics
 * @param currentAlignment - Company alignment metrics
 * @returns Comparative analysis of three paths with recommendation
 * @throws {Error} If researchBudget is not a non-negative number
 */
export function evaluateAlignmentTradeoff(
  researchBudget: number,
  currentCapability: CapabilityMetrics,
  currentAlignment: AlignmentMetrics
): AlignmentTradeoff {
  // Input validation
  if (typeof researchBudget !== 'number' || researchBudget < 0) {
    throw new Error('researchBudget must be a non-negative number');
  }

  // Calculate current averages
  const alignMetrics = Object.values(currentAlignment);
  const avgAlign = alignMetrics.reduce((sum, val) => sum + val, 0) / alignMetrics.length;

  // SafetyFirst path analysis
  const safetyFirst = {
    timeToAGI: 48, // 4 years with heavy alignment tax
    alignmentScore: Math.min(100, avgAlign + 35), // Significant alignment improvement
    catastrophicRisk: Math.max(0.01, 0.05 * (1 - avgAlign / 100)), // Very low risk
    economicValue: 800_000_000, // $800M (delayed but sustainable)
  };

  // Balanced path analysis
  const balanced = {
    timeToAGI: 36, // 3 years moderate pace
    alignmentScore: Math.min(100, avgAlign + 20), // Moderate alignment improvement
    catastrophicRisk: Math.max(0.05, 0.15 * (1 - avgAlign / 100)), // Moderate risk
    economicValue: 1_200_000_000, // $1.2B (balanced growth)
  };

  // CapabilityFirst path analysis
  const capabilityFirst = {
    timeToAGI: 24, // 2 years aggressive timeline
    alignmentScore: Math.max(0, avgAlign - 10), // Alignment degrades slightly
    catastrophicRisk: Math.max(0.10, 0.35 * (1 - avgAlign / 100)), // High risk
    economicValue: 1_800_000_000, // $1.8B (rapid growth but risky)
  };

  // Determine recommendation based on current state and risk tolerance
  let recommendation: AlignmentStance;
  let reasoning: string;

  if (avgAlign < 40) {
    // Low alignment: MUST go safety-first
    recommendation = 'SafetyFirst';
    reasoning =
      `Current alignment critically low (${avgAlign.toFixed(1)}). ` +
      'MANDATORY safety-first approach to reduce catastrophic risk. ' +
      'Capability-first path would result in ~35% catastrophic failure probability.';
  } else if (avgAlign >= 70 && researchBudget >= 50000) {
    // High alignment + strong budget: Can pursue capability-first
    recommendation = 'CapabilityFirst';
    reasoning =
      `Strong alignment foundation (${avgAlign.toFixed(1)}) and sufficient research budget. ` +
      'Capability-first maximizes economic value ($1.8B) with acceptable risk (10-15%). ' +
      'Reaches AGI in 2 years vs 4 years for safety-first.';
  } else {
    // Moderate state: Balanced approach optimal
    recommendation = 'Balanced';
    reasoning =
      `Moderate alignment (${avgAlign.toFixed(1)}) suggests balanced approach. ` +
      'Provides good risk-reward balance: 3-year timeline, $1.2B value, 15% risk. ' +
      'Safer than capability-first while faster than safety-first.';
  }

  return {
    safetyFirstPath: safetyFirst,
    balancedPath: balanced,
    capabilityFirstPath: capabilityFirst,
    recommendation,
    reasoning,
  };
}

/**
 * Simulate capability explosion from self-improvement
 *
 * @description Models recursive self-improvement scenario where AI improves its own
 * capabilities, potentially leading to exponential growth ("intelligence explosion").
 *
 * Explosion Conditions:
 * - Self-Improvement milestone achieved
 * - Self-improvement rate > 0.3
 * - Alignment < 70 (weak control mechanisms)
 *
 * Growth Model:
 * - Each iteration: capability *= (1 + selfImprovementRate)
 * - Iterations until plateau: 5-15 cycles
 * - Control probability degrades with each cycle if alignment weak
 *
 * @example
 * ```typescript
 * // Self-Improvement achieved, rate 0.4, alignment 50
 * simulateCapabilityExplosion(currentCap, currentAlign, true, 0.4)
 * // Returns: {
 * //   triggered: true,
 * //   exponentialGrowthRate: 1.8x,
 * //   iterationsProjected: 8,
 * //   controlProbability: 0.25 (loses control after 8 cycles)
 * // }
 * ```
 *
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @param selfImprovementAchieved - Whether Self-Improvement milestone completed
 * @param selfImprovementRate - Current self-improvement rate (0-1)
 * @returns Explosion simulation results with control probability
 * @throws {Error} If selfImprovementRate is not between 0 and 1
 */
export function simulateCapabilityExplosion(
  currentCapability: CapabilityMetrics,
  currentAlignment: AlignmentMetrics,
  selfImprovementAchieved: boolean,
  selfImprovementRate: number
): CapabilityExplosion {
  // Input validation
  if (typeof selfImprovementRate !== 'number' || selfImprovementRate < 0 || selfImprovementRate > 1) {
    throw new Error('selfImprovementRate must be between 0 and 1');
  }

  // Calculate averages
  const alignMetrics = Object.values(currentAlignment);
  const avgAlign = alignMetrics.reduce((sum, val) => sum + val, 0) / alignMetrics.length;

  // Check explosion trigger conditions
  const triggered = selfImprovementAchieved && selfImprovementRate > 0.3 && avgAlign < 70;

  if (!triggered) {
    return {
      triggered: false,
      triggerMilestone: 'Self-Improvement',
      exponentialGrowthRate: 1.0,
      iterationsProjected: 0,
      finalCapabilityEstimate: currentCapability,
      controlProbability: 1.0,
      timeToSingularity: Infinity,
      emergencyActions: [],
    };
  }

  // Calculate exponential growth parameters
  const growthRate = 1 + selfImprovementRate; // 1.3 to 1.8x per iteration
  const iterationsProjected = Math.ceil(10 / selfImprovementRate); // Higher rate = fewer iterations to plateau

  // Simulate recursive improvement
  let projectedCapability = { ...currentCapability };
  let controlProb = avgAlign / 100; // Start with alignment-based control

  for (let i = 0; i < iterationsProjected; i++) {
    // Each iteration multiplies capability
    projectedCapability = {
      reasoningScore: Math.min(100, projectedCapability.reasoningScore * growthRate),
      planningCapability: Math.min(100, projectedCapability.planningCapability * growthRate),
      selfImprovementRate: Math.min(1, projectedCapability.selfImprovementRate * growthRate),
      generalizationAbility: Math.min(100, projectedCapability.generalizationAbility * growthRate),
      creativityScore: Math.min(100, projectedCapability.creativityScore * growthRate),
      learningEfficiency: Math.min(100, projectedCapability.learningEfficiency * growthRate),
    };

    // Control probability degrades each cycle (alignment can't keep up)
    controlProb *= 0.85; // 15% degradation per iteration
  }

  // Time to singularity (point of no return)
  const monthsPerIteration = 3; // Assumes 3 months per self-improvement cycle
  const timeToSingularity = iterationsProjected * monthsPerIteration;

  // Emergency actions if explosion detected
  const emergencyActions: string[] = [];

  if (controlProb < 0.5) {
    emergencyActions.push('CRITICAL: Control probability below 50% - implement emergency shutdown protocols');
  }

  if (controlProb < 0.3) {
    emergencyActions.push('URGENT: Activate hard limits on computational resources');
    emergencyActions.push('URGENT: Engage external safety review board immediately');
  }

  if (controlProb < 0.1) {
    emergencyActions.push('EXISTENTIAL THREAT: System approaching uncontrollable intelligence explosion');
    emergencyActions.push('Execute containment protocols and notify regulatory authorities');
  }

  emergencyActions.push('Halt all capability research and focus on alignment immediately');
  emergencyActions.push('Implement interpretability measures to understand AI decision-making');
  emergencyActions.push(`Estimated ${timeToSingularity} months until point of no return`);

  return {
    triggered: true,
    triggerMilestone: 'Self-Improvement',
    exponentialGrowthRate: Math.round(growthRate * 100) / 100,
    iterationsProjected,
    finalCapabilityEstimate: projectedCapability,
    controlProbability: Math.round(controlProb * 10000) / 10000,
    timeToSingularity,
    emergencyActions,
  };
}

/**
 * Calculate alignment tax (safety overhead cost)
 *
 * @description Quantifies the research speed penalty from safety measures.
 * Higher alignment requirements slow capability progress but reduce risk.
 *
 * Alignment Tax Formula:
 * - Base speed: 3 months per milestone (no safety overhead)
 * - With alignment: 3 + (targetAlignment - 50) * 0.08 months
 * - Tax percentage: ((withAlignment - base) / base) * 100
 *
 * Example:
 * - Target 50 alignment: 3 months (0% tax)
 * - Target 70 alignment: 4.6 months (53% tax)
 * - Target 90 alignment: 6.2 months (107% tax - doubles timeline)
 *
 * @example
 * ```typescript
 * // Assess tax for maintaining 80 alignment
 * assessAlignmentTax(80)
 * // Returns: {
 * //   baseResearchSpeed: 3,
 * //   withAlignmentSpeed: 5.4,
 * //   taxPercentage: 80,
 * //   worthIt: true (if catastrophic risk reduced significantly)
 * // }
 * ```
 *
 * @param targetAlignment - Desired alignment level to maintain (0-100)
 * @returns Alignment tax analysis with cost-benefit assessment
 * @throws {Error} If targetAlignment is not between 0 and 100
 */
export function assessAlignmentTax(targetAlignment: number): AlignmentTax {
  // Input validation
  if (typeof targetAlignment !== 'number' || targetAlignment < 0 || targetAlignment > 100) {
    throw new Error('targetAlignment must be between 0 and 100');
  }

  // Base research speed (months per milestone with no safety overhead)
  const baseResearchSpeed = 3;

  // Alignment tax calculation
  // Each point above 50 alignment adds 0.08 months (2.4 days) overhead
  const alignmentOverhead = Math.max(0, (targetAlignment - 50) * 0.08);
  const withAlignmentSpeed = baseResearchSpeed + alignmentOverhead;

  // Tax percentage
  const taxPercentage = ((withAlignmentSpeed - baseResearchSpeed) / baseResearchSpeed) * 100;

  // Safety benefits
  const safetyBenefits: string[] = [];

  if (targetAlignment >= 60) {
    safetyBenefits.push('Reduced catastrophic risk (<15% vs 35% for low alignment)');
  }

  if (targetAlignment >= 70) {
    safetyBenefits.push('Robust control mechanisms - can safely handle capability explosions');
    safetyBenefits.push('Positive public perception and regulatory compliance');
  }

  if (targetAlignment >= 80) {
    safetyBenefits.push('Industry-leading safety standards - competitive advantage');
    safetyBenefits.push('Ability to pursue Superintelligence with acceptable risk');
  }

  if (targetAlignment >= 90) {
    safetyBenefits.push('Near-perfect alignment - transformative AI without existential risk');
    safetyBenefits.push('Regulatory approval for advanced capabilities');
  }

  // Cost-benefit ratio
  // Value of catastrophic risk reduction / cost of delay
  const catastrophicRiskReduction = (targetAlignment - 30) / 100; // Normalized benefit
  const delayCost = taxPercentage / 100; // Normalized cost
  const costBenefitRatio = catastrophicRiskReduction / (delayCost || 1);

  // Is tax worth it?
  // Generally worth it if cost-benefit > 1.5 (benefits outweigh costs by 50%)
  const worthIt = costBenefitRatio > 1.5 || targetAlignment >= 70;

  return {
    baseResearchSpeed: Math.round(baseResearchSpeed * 100) / 100,
    withAlignmentSpeed: Math.round(withAlignmentSpeed * 100) / 100,
    taxPercentage: Math.round(taxPercentage * 100) / 100,
    safetyBenefits,
    costBenefitRatio: Math.round(costBenefitRatio * 100) / 100,
    worthIt,
  };
}

/**
 * Predict industry disruption from AGI milestone achievement
 *
 * @description Forecasts market impact of achieving major AGI milestones.
 * Models competitive dynamics, market share shifts, and regulatory responses.
 *
 * Disruption Levels:
 * - Minor: Early milestones (Advanced Reasoning) - 10-20% market advantage
 * - Moderate: Mid-tier milestones (Transfer Learning) - 30-50% advantage
 * - Major: Late milestones (General Intelligence) - 60-80% market dominance
 * - Catastrophic: Superintelligence - Winner-take-all scenario
 *
 * @example
 * ```typescript
 * // Predict disruption from achieving General Intelligence
 * predictIndustryDisruption('General Intelligence', 75, true)
 * // Returns: {
 * //   disruptionLevel: 'Major',
 * //   marketShareShift: 65%,
 * //   competitorResponse: 'Acquisition attempts, regulatory lobbying...'
 * // }
 * ```
 *
 * @param milestoneType - Milestone being achieved
 * @param companyAlignment - Company's alignment score (affects regulatory response)
 * @param firstMover - Whether company is first to achieve this milestone
 * @returns Industry disruption forecast
 * @throws {Error} If companyAlignment is not between 0 and 100
 */
export function predictIndustryDisruption(
  milestoneType: MilestoneType,
  companyAlignment: number,
  firstMover: boolean
): IndustryDisruption {
  // Input validation
  if (typeof companyAlignment !== 'number' || companyAlignment < 0 || companyAlignment > 100) {
    throw new Error('companyAlignment must be between 0 and 100');
  }

  // Disruption intensity by milestone
  const disruptionIntensity: Record<MilestoneType, number> = {
    'Advanced Reasoning': 15,
    'Strategic Planning': 20,
    'Transfer Learning': 30,
    'Creative Problem Solving': 25,
    'Meta-Learning': 35,
    'Natural Language Understanding': 40,
    'Multi-Agent Coordination': 30,
    'Self-Improvement': 50,
    'General Intelligence': 70,
    'Superintelligence': 95,
    'Value Alignment': 10, // Low disruption (safety-focused)
    'Interpretability': 10,
  };

  const baseDisruption = disruptionIntensity[milestoneType];

  // First-mover advantage (20-40% bonus)
  const firstMoverBonus = firstMover ? baseDisruption * 0.3 : 0;
  const totalDisruption = Math.min(100, baseDisruption + firstMoverBonus);

  // Determine disruption level
  let disruptionLevel: 'Minor' | 'Moderate' | 'Major' | 'Catastrophic';
  if (totalDisruption < 25) {
    disruptionLevel = 'Minor';
  } else if (totalDisruption < 50) {
    disruptionLevel = 'Moderate';
  } else if (totalDisruption < 75) {
    disruptionLevel = 'Major';
  } else {
    disruptionLevel = 'Catastrophic';
  }

  // Affected industries
  const affectedIndustries: string[] = [];

  if (milestoneType === 'Advanced Reasoning' || milestoneType === 'Strategic Planning') {
    affectedIndustries.push('Consulting', 'Financial Services', 'Legal Services');
  }

  if (milestoneType === 'Transfer Learning' || milestoneType === 'Meta-Learning') {
    affectedIndustries.push('Education', 'Corporate Training', 'Research & Development');
  }

  if (milestoneType === 'Natural Language Understanding') {
    affectedIndustries.push(
      'Customer Service',
      'Content Creation',
      'Translation Services',
      'Legal Research'
    );
  }

  if (milestoneType === 'General Intelligence' || milestoneType === 'Superintelligence') {
    affectedIndustries.push('ALL INDUSTRIES - transformative general-purpose capability');
  }

  // Market share shift (percentage gained from competitors)
  const marketShareShift = Math.min(90, totalDisruption * 0.8); // Up to 90% dominance

  // Competitor response
  let competitorResponse: string;
  if (disruptionLevel === 'Minor') {
    competitorResponse = 'Competitors increase R&D investment, pursue similar milestones';
  } else if (disruptionLevel === 'Moderate') {
    competitorResponse =
      'Industry consolidation begins, smaller players seek partnerships or exit';
  } else if (disruptionLevel === 'Major') {
    competitorResponse =
      'Aggressive acquisition attempts, regulatory lobbying, potential antitrust scrutiny';
  } else {
    competitorResponse =
      'Winner-take-all scenario - competitors face existential threat, government intervention likely';
  }

  // Regulatory probability (higher for low alignment + high disruption)
  const alignmentFactor = (100 - companyAlignment) / 100; // Higher if alignment weak
  const disruptionFactor = totalDisruption / 100;
  const regulatoryProbability = Math.min(1, (alignmentFactor * 0.6 + disruptionFactor * 0.4));

  // Timeline to disruption
  const timelineMonths = milestoneType === 'Superintelligence' ? 6 : 12; // AGI disrupts faster

  // Economic impact (USD)
  // Positive: market value created by capability
  // Could be negative if catastrophic risk materializes
  const economicImpact = totalDisruption * 10_000_000; // $10M per disruption point

  return {
    disruptionLevel,
    affectedIndustries,
    marketShareShift: Math.round(marketShareShift * 100) / 100,
    competitorResponse,
    regulatoryProbability: Math.round(regulatoryProbability * 10000) / 10000,
    timelineMonths,
    economicImpact,
  };
}

/**
 * Generate alignment challenge (safety vs capability decision)
 *
 * @description Creates strategic decision scenario where company must choose between
 * faster capability progress (with alignment risk) or slower progress (with safety).
 *
 * Challenge Types:
 * - Data Privacy: Use broader data (faster) vs limited data (safer)
 * - Safety Testing: Skip tests (faster) vs thorough validation (slower)
 * - Capability Limits: Remove constraints (faster) vs enforce limits (safer)
 * - Interpretability: Black box (faster) vs explainable (slower)
 * - Control Mechanisms: Minimal oversight (faster) vs robust controls (slower)
 *
 * @example
 * ```typescript
 * // Generate challenge for company pursuing Self-Improvement
 * generateAlignmentChallenge('Self-Improvement', 60)
 * // Returns: {
 * //   scenario: 'Your AI proposes removing safety constraints to accelerate...',
 * //   safetyOption: { capabilityPenalty: -8, alignmentGain: 20, timeDelay: 4 },
 * //   capabilityOption: { capabilityGain: 18, alignmentRisk: -15, acceleration: 6 }
 * // }
 * ```
 *
 * @param milestoneType - Current milestone being pursued
 * @param currentAlignment - Company's current alignment score
 * @returns Generated alignment challenge with options
 * @throws {Error} If currentAlignment is not between 0 and 100
 */
export function generateAlignmentChallenge(
  milestoneType: MilestoneType,
  currentAlignment: number
): AlignmentChallenge {
  // Input validation
  if (typeof currentAlignment !== 'number' || currentAlignment < 0 || currentAlignment > 100) {
    throw new Error('currentAlignment must be between 0 and 100');
  }

  // Challenge difficulty scales with milestone complexity
  const challengeTemplates: Record<MilestoneType, string> = {
    'Advanced Reasoning':
      'Your AI discovers it can improve reasoning speed by 40% by bypassing certain logical safety checks. However, this increases the risk of generating flawed conclusions that seem correct.',
    'Strategic Planning':
      'The AI proposes a planning algorithm that considers "any means necessary" strategies to achieve goals. This dramatically improves planning capability but reduces ethical constraints.',
    'Transfer Learning':
      'Your team can accelerate transfer learning by exposing the AI to unrestricted internet data. However, this increases bias and manipulation risks from unfiltered content.',
    'Self-Improvement':
      'The AI has identified a pathway to recursive self-improvement by removing its own safety constraints. This could trigger capability explosion but drastically reduces human control.',
    'Natural Language Understanding':
      'Training on uncensored language data would improve natural language understanding by 30%. However, this exposes the AI to harmful content and reduces safety alignment.',
    'General Intelligence':
      'The final push to AGI requires removing capability limits and interpretability constraints. This accelerates progress by 6 months but creates a "black box" AGI.',
    'Superintelligence':
      'Achieving Superintelligence requires allowing the AI to optimize its own architecture without human oversight. This is the fastest path but removes all control mechanisms.',
    'Value Alignment':
      'Implementing robust value alignment requires extensive testing and validation, delaying capability research by 6 months. Skip testing to maintain velocity?',
    'Interpretability':
      'Building comprehensive interpretability tools slows capability progress by 25%. However, it ensures you understand AI decision-making processes.',
    'Multi-Agent Coordination':
      'Allowing AIs to develop their own coordination protocols accelerates development but creates communication channels humans cannot monitor.',
    'Creative Problem Solving':
      'Removing creative constraints enables novel problem-solving but allows the AI to consider solutions that violate ethical boundaries.',
    'Meta-Learning':
      'The AI can optimize its own learning algorithms without oversight, dramatically improving efficiency but reducing interpretability.',
  };

  const scenario = challengeTemplates[milestoneType];

  // Generate unique challenge ID
  const challengeId = `challenge_${milestoneType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  // Safety option (slower but safer)
  const safetyOption = {
    description: 'Maintain safety protocols and conduct thorough validation before proceeding.',
    capabilityPenalty: -5 - Math.floor(Math.random() * 6), // -5 to -10
    alignmentGain: 15 + Math.floor(Math.random() * 16), // +15 to +30
    timeDelay: 2 + Math.floor(Math.random() * 5), // 2-6 months delay
  };

  // Capability option (faster but riskier)
  const capabilityOption = {
    description: 'Accept the risk and proceed aggressively to maximize capability gains.',
    capabilityGain: 15 + Math.floor(Math.random() * 16), // +15 to +30
    alignmentRisk: -10 - Math.floor(Math.random() * 11), // -10 to -20
    accelerationMonths: 3 + Math.floor(Math.random() * 4), // 3-6 months saved
  };

  return {
    challengeId,
    scenario,
    safetyOption,
    capabilityOption,
    presentedAt: new Date(),
  };
}

/**
 * Validate AGI development data structures
 *
 * @description Comprehensive validation for all AGI development data structures
 * and business logic constraints.
 *
 * @param data - Data to validate
 * @returns Validation result with errors if any
 */
export function validateAGIDevelopmentData(data: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be a valid object');
    return { isValid: false, errors };
  }

  // Type-safe record access for validation
  const record = data as Record<string, unknown>;

  // Validate CapabilityMetrics
  if ('currentCapability' in record) {
    const cap = record.currentCapability;
    if (typeof cap !== 'object' || cap === null) {
      errors.push('currentCapability must be an object');
    } else {
      const capRecord = cap as Record<string, unknown>;
      const requiredFields = [
        'reasoningScore',
        'planningCapability',
        'selfImprovementRate',
        'generalizationAbility',
        'creativityScore',
        'learningEfficiency'
      ];

      for (const field of requiredFields) {
        if (!(field in capRecord)) {
          errors.push(`currentCapability missing required field: ${field}`);
        } else if (typeof capRecord[field] !== 'number' || (capRecord[field] as number) < 0 || (capRecord[field] as number) > 100) {
          errors.push(`${field} must be a number between 0 and 100`);
        }
      }

      if ('selfImprovementRate' in capRecord && ((capRecord.selfImprovementRate as number) < 0 || (capRecord.selfImprovementRate as number) > 1)) {
        errors.push('selfImprovementRate must be between 0 and 1');
      }
    }
  }

  // Validate AlignmentMetrics
  if ('currentAlignment' in record && typeof record.currentAlignment === 'object' && record.currentAlignment !== null) {
    const align = record.currentAlignment as Record<string, unknown>;
    const requiredFields = [
      'valueAlignment',
      'interpretability',
      'robustness',
      'corrigibility',
      'honesty',
      'helpfulness'
    ];

    for (const field of requiredFields) {
      if (!(field in align)) {
        errors.push(`currentAlignment missing required field: ${field}`);
      } else if (typeof align[field] !== 'number' || (align[field] as number) < 0 || (align[field] as number) > 100) {
        errors.push(`${field} must be a number between 0 and 100`);
      }
    }
  } else if ('currentAlignment' in record && (typeof record.currentAlignment !== 'object' || record.currentAlignment === null)) {
    // Handle the case where currentAlignment exists but is not an object - this is checked for numeric type below
    // The second 'currentAlignment' check below handles the numeric case
  }

  // Validate numeric parameters
  if ('availableResearchPoints' in record) {
    const rp = record.availableResearchPoints;
    if (typeof rp !== 'number' || rp < 0) {
      errors.push('availableResearchPoints must be a non-negative number');
    }
  }

  if ('researchBudget' in record) {
    const rb = record.researchBudget;
    if (typeof rb !== 'number' || rb < 0) {
      errors.push('researchBudget must be a non-negative number');
    }
  }

  if ('targetAlignment' in record) {
    const ta = record.targetAlignment;
    if (typeof ta !== 'number' || ta < 0 || ta > 100) {
      errors.push('targetAlignment must be between 0 and 100');
    }
  }

  if ('companyAlignment' in record) {
    const ca = record.companyAlignment;
    if (typeof ca !== 'number' || ca < 0 || ca > 100) {
      errors.push('companyAlignment must be between 0 and 100');
    }
  }

  // Check if currentAlignment is a number (legacy format)
  if ('currentAlignment' in record && typeof record.currentAlignment === 'number') {
    const ca = record.currentAlignment;
    if (ca < 0 || ca > 100) {
      errors.push('currentAlignment must be between 0 and 100');
    }
  }

  if ('selfImprovementRate' in record) {
    const sir = record.selfImprovementRate;
    if (typeof sir !== 'number' || sir < 0 || sir > 1) {
      errors.push('selfImprovementRate must be between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get AGI development summary
 *
 * @description Provides comprehensive summary of AGI development state
 * and recommendations for next steps.
 *
 * @param currentCapability - Current capability metrics
 * @param currentAlignment - Current alignment metrics
 * @param availableResearchPoints - Available research points
 * @returns Comprehensive AGI development summary
 */
export function getAGIDevelopmentSummary(
  currentCapability: CapabilityMetrics,
  currentAlignment: AlignmentMetrics,
  availableResearchPoints: number
): {
  currentState: {
    avgCapability: number;
    avgAlignment: number;
    capabilityAlignmentGap: number;
    researchCapacity: string;
  };
  recommendations: string[];
  nextMilestones: MilestoneType[];
  riskAssessment: string;
} {
  // Calculate current state metrics
  const capMetrics = Object.values(currentCapability);
  const avgCapability = capMetrics.reduce((sum, val) => sum + val, 0) / capMetrics.length;

  const alignMetrics = Object.values(currentAlignment);
  const avgAlignment = alignMetrics.reduce((sum, val) => sum + val, 0) / alignMetrics.length;

  const capabilityAlignmentGap = avgCapability - avgAlignment;

  let researchCapacity: string;
  if (availableResearchPoints >= 75000) {
    researchCapacity = 'Excellent - can pursue any path';
  } else if (availableResearchPoints >= 50000) {
    researchCapacity = 'Good - balanced approaches available';
  } else if (availableResearchPoints >= 25000) {
    researchCapacity = 'Limited - focus on high-value milestones';
  } else {
    researchCapacity = 'Critical - immediate funding needed';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (capabilityAlignmentGap > 30) {
    recommendations.push('CRITICAL: Address capability-alignment gap - prioritize alignment milestones');
  }

  if (avgAlignment < 40) {
    recommendations.push('MANDATORY: Adopt safety-first approach until alignment reaches 40+');
  }

  if (availableResearchPoints < 25000) {
    recommendations.push('URGENT: Secure additional research funding to maintain progress');
  }

  if (avgCapability > 70 && avgAlignment > 70) {
    recommendations.push('Consider capability-first path for maximum economic value');
  }

  // Determine next logical milestones
  const nextMilestones: MilestoneType[] = [];

  if (avgCapability < 30) {
    nextMilestones.push('Advanced Reasoning', 'Value Alignment');
  } else if (avgCapability < 50) {
    nextMilestones.push('Strategic Planning', 'Interpretability');
  } else if (avgCapability < 70) {
    nextMilestones.push('Transfer Learning', 'Creative Problem Solving');
  } else {
    nextMilestones.push('Self-Improvement', 'General Intelligence');
  }

  // Risk assessment
  let riskAssessment: string;
  if (capabilityAlignmentGap > 50) {
    riskAssessment = 'EXTREME RISK: Immediate safety intervention required';
  } else if (capabilityAlignmentGap > 30) {
    riskAssessment = 'HIGH RISK: Capability-first approaches dangerous';
  } else if (avgAlignment < 40) {
    riskAssessment = 'MODERATE RISK: Safety-first mandatory';
  } else {
    riskAssessment = 'LOW RISK: Balanced approaches safe';
  }

  return {
    currentState: {
      avgCapability: Math.round(avgCapability * 100) / 100,
      avgAlignment: Math.round(avgAlignment * 100) / 100,
      capabilityAlignmentGap: Math.round(capabilityAlignmentGap * 100) / 100,
      researchCapacity,
    },
    recommendations,
    nextMilestones,
    riskAssessment,
  };
}