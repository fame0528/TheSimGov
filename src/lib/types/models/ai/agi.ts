/**
 * AGI Milestone System Type Definitions
 * 
 * Comprehensive type system for AGI (Artificial General Intelligence) milestone progression.
 * Supports 12-milestone tech tree from Advanced Reasoning to Superintelligence with dual
 * capability/alignment metrics, strategic path selection, and risk assessment.
 * 
 * @module types/models/ai/agi
 * @category AI Industry
 * 
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 */

import { Types } from 'mongoose';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * AGI Milestone Types - 12-milestone technology tree
 * 
 * Progression paths:
 * - Capability Track: Advanced Reasoning → Strategic Planning → Transfer Learning
 *   → Creative Problem Solving → Meta-Learning → Natural Language Understanding
 *   → Multi-Agent Coordination → Self-Improvement → General Intelligence → Superintelligence
 * - Alignment Track: Value Alignment, Interpretability (can be pursued in parallel)
 * 
 * Prerequisites enforce logical progression (cannot skip to AGI without foundations).
 */
export enum MilestoneType {
  ADVANCED_REASONING = 'Advanced Reasoning',
  STRATEGIC_PLANNING = 'Strategic Planning',
  TRANSFER_LEARNING = 'Transfer Learning',
  CREATIVE_PROBLEM_SOLVING = 'Creative Problem Solving',
  META_LEARNING = 'Meta-Learning',
  NATURAL_LANGUAGE_UNDERSTANDING = 'Natural Language Understanding',
  MULTI_AGENT_COORDINATION = 'Multi-Agent Coordination',
  SELF_IMPROVEMENT = 'Self-Improvement',
  GENERAL_INTELLIGENCE = 'General Intelligence',
  SUPERINTELLIGENCE = 'Superintelligence',
  VALUE_ALIGNMENT = 'Value Alignment',
  INTERPRETABILITY = 'Interpretability',
}

/**
 * Milestone Status - Lifecycle states
 * 
 * State transitions:
 * - Locked → Available (prerequisites met)
 * - Available → InProgress (first research investment)
 * - InProgress → Achieved (successful attempt) OR Failed (failed attempt)
 * - Failed → Available (retry after cooldown)
 */
export enum MilestoneStatus {
  LOCKED = 'Locked',
  AVAILABLE = 'Available',
  IN_PROGRESS = 'InProgress',
  ACHIEVED = 'Achieved',
  FAILED = 'Failed',
}

/**
 * Alignment Stance - Strategic approach to AGI development
 * 
 * - SafetyFirst: Prioritize alignment over speed (48mo, 85 align, 5% risk, $800M)
 * - Balanced: Balance safety and capability (36mo, 70 align, 15% risk, $1.2B)
 * - CapabilityFirst: Prioritize capability over safety (24mo, 40 align, 35% risk, $1.8B)
 *   (Requires current alignment >= 60 to prevent critical risk)
 */
export enum AlignmentStance {
  SAFETY_FIRST = 'SafetyFirst',
  BALANCED = 'Balanced',
  CAPABILITY_FIRST = 'CapabilityFirst',
}

// ============================================================================
// METRICS INTERFACES
// ============================================================================

/**
 * Capability Metrics - AI performance dimensions (0-100 scale)
 * 
 * Measures:
 * - reasoningScore: Logical deduction, problem-solving ability
 * - planningCapability: Long-term strategy, multi-step coordination
 * - selfImprovementRate: Ability to modify own algorithms (0-1 multiplier)
 * - generalizationAbility: Transfer learning across domains
 * - creativityScore: Novel solution generation
 * - learningEfficiency: Data efficiency, sample complexity reduction
 * 
 * Higher capability = faster progress, higher economic value, greater risk
 */
export interface CapabilityMetrics {
  reasoningScore: number;
  planningCapability: number;
  selfImprovementRate: number;
  generalizationAbility: number;
  creativityScore: number;
  learningEfficiency: number;
}

/**
 * Alignment Metrics - AI safety dimensions (0-100 scale)
 * 
 * Measures:
 * - safetyMeasures: Harm prevention, constraint adherence
 * - valueAlignmentScore: Human value preservation
 * - controlMechanisms: Shutdown capability, containment
 * - interpretability: Explainability, transparency
 * - robustness: Reliability, consistency under edge cases
 * - ethicalConstraints: Ethical reasoning, moral guidelines
 * 
 * Higher alignment = slower progress, lower catastrophic risk, better public perception
 */
export interface AlignmentMetrics {
  safetyMeasures: number;
  valueAlignmentScore: number;
  controlMechanisms: number;
  interpretability: number;
  robustness: number;
  ethicalConstraints: number;
}

// ============================================================================
// RESEARCH REQUIREMENTS
// ============================================================================

/**
 * Research Requirements - Prerequisites and costs for milestone achievement
 * 
 * Investment requirements:
 * - researchPointsCost: 3,000 - 20,000 RP (logarithmic boost to success probability)
 * - prerequisiteMilestones: Previous milestones that must be achieved first
 * - minimumCapabilityLevel: Average capability threshold (0-100)
 * - minimumAlignmentLevel: Average alignment threshold (0-100)
 * - estimatedTimeMonths: Time estimate (6-24 months)
 * - computeBudgetRequired: GPU compute cost ($500k - $10M)
 * 
 * Example: General Intelligence requires Self-Improvement + NLU, 20k RP, 
 * 70 capability, 50 alignment, 24 months, $10M compute
 */
export interface ResearchRequirements {
  researchPointsCost: number;
  prerequisiteMilestones: MilestoneType[];
  minimumCapabilityLevel: number;
  minimumAlignmentLevel: number;
  estimatedTimeMonths: number;
  computeBudgetRequired: number;
}

// ============================================================================
// IMPACT & CONSEQUENCES
// ============================================================================

/**
 * Impact Consequences - Industry, economic, and risk outcomes
 * 
 * Measures:
 * - industryDisruptionLevel: 0-100 (24-80 range by complexity)
 * - regulatoryAttention: 0-100 (21-70 range, increases with breakthroughs)
 * - publicPerceptionChange: -50 to +50 (positive if aligned, negative if risky)
 * - competitiveAdvantage: 0-100 (27-90 range, first-mover bonus +30%)
 * - catastrophicRiskProbability: 0-1 (increases with capability-alignment gap)
 * - economicValueCreated: Dollars ($150M - $500M per milestone)
 * 
 * First-mover advantage: Companies achieving milestones before competitors
 * gain market dominance, attract top talent, and command premium pricing.
 */
export interface ImpactConsequences {
  industryDisruptionLevel: number;
  regulatoryAttention: number;
  publicPerceptionChange: number;
  competitiveAdvantage: number;
  catastrophicRiskProbability: number;
  economicValueCreated: number;
}

// ============================================================================
// ALIGNMENT CHALLENGES
// ============================================================================

/**
 * Alignment Challenge - Safety vs capability trade-off decision
 * 
 * Presented periodically during research. Players choose:
 * - Safety option: Slower progress, higher alignment, lower risk
 *   (-5 to -10 cap, +15 to +30 align, +2 to +6 months delay)
 * - Capability option: Faster progress, lower alignment, higher risk
 *   (+15 to +30 cap, -10 to -20 align, -3 to -6 months acceleration)
 * 
 * Challenges are milestone-specific with unique scenarios and consequences.
 * 
 * Example: Self-Improvement milestone challenge:
 * "Your AI has discovered a method to rewrite its own reward function.
 * Do you allow this modification?"
 * - Safety: Restrict self-modification, maintain human oversight
 * - Capability: Allow autonomous improvement, risk value drift
 */
export interface AlignmentChallenge {
  challengeId: string;
  scenario: string;                 // Description of the decision
  safetyOption: {
    description: string;
    capabilityPenalty: number;      // -10 to 0 capability reduction
    alignmentGain: number;          // +10 to +30 alignment improvement
    timeDelay: number;              // Months of delay
  };
  capabilityOption: {
    description: string;
    capabilityGain: number;         // +10 to +30 capability boost
    alignmentRisk: number;          // -20 to -5 alignment degradation
    accelerationMonths: number;     // Months saved
  };
  presentedAt: Date;
  choiceMade?: 'safety' | 'capability' | 'defer';
  choiceDate?: Date;
}

// ============================================================================
// PROGRESSION PATH RESULTS
// ============================================================================

/**
 * Progression Path Result - Optimal milestone ordering recommendation
 * 
 * Output from calculateMilestoneProgressionPath utility.
 * Provides strategic guidance based on alignment stance.
 * 
 * Typical SafetyFirst path (48mo, 75k RP, 85 align, 5% risk):
 * 1. Value Alignment
 * 2. Interpretability
 * 3. Advanced Reasoning
 * 4. Strategic Planning
 * 5. Transfer Learning
 * ... (alignment-focused ordering)
 * 
 * Typical CapabilityFirst path (24mo, 60k RP, 40 align, 35% risk):
 * 1. Advanced Reasoning
 * 2. Strategic Planning
 * 3. Transfer Learning
 * 4. Self-Improvement
 * 5. General Intelligence
 * ... (AGI rush, requires align >= 60)
 */
export interface ProgressionPathResult {
  recommendedOrder: MilestoneType[];
  reasoning: string;
  totalEstimatedMonths: number;
  totalResearchPoints: number;
  totalComputeBudget: number;
  estimatedFinalCapability: number;
  estimatedFinalAlignment: number;
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  criticalDecisions: string[];
}

/**
 * Alignment Tradeoff Result - Three-path comparison
 * 
 * Output from evaluateAlignmentTradeoff utility.
 * Compares SafetyFirst, Balanced, and CapabilityFirst strategies.
 * 
 * Recommendation logic:
 * - Low align (<40): Force SafetyFirst (critical risk)
 * - High align (>=70) + budget: Allow CapabilityFirst
 * - Otherwise: Recommend Balanced
 */
export interface AlignmentTradeoffResult {
  safetyFirstPath: {
    timeline: number;
    finalAlignment: number;
    catastrophicRisk: number;
    estimatedCost: number;
    pros: string[];
    cons: string[];
  };
  balancedPath: {
    timeline: number;
    finalAlignment: number;
    catastrophicRisk: number;
    estimatedCost: number;
    pros: string[];
    cons: string[];
  };
  capabilityFirstPath: {
    timeline: number;
    finalAlignment: number;
    catastrophicRisk: number;
    estimatedCost: number;
    pros: string[];
    cons: string[];
    requiresMinimumAlignment: number;
  };
  recommendation: AlignmentStance;
  reasoning: string;
}

/**
 * Capability Explosion Result - Recursive self-improvement simulation
 * 
 * Output from simulateCapabilityExplosion utility.
 * Models exponential capability growth and control degradation.
 * 
 * Trigger conditions:
 * - Self-Improvement milestone achieved
 * - selfImprovementRate > 0.3
 * - alignment < 70
 * 
 * Simulation:
 * - Growth: 1.3-1.8x per iteration, 5-15 cycles
 * - Control degradation: 15% per iteration
 * - Emergency actions: Shutdown thresholds at 50%/30%/10% control
 */
export interface CapabilityExplosionResult {
  willExplode: boolean;
  trigger: string;
  iterationsToExplosion: number;
  finalCapabilityMultiplier: number;
  controlProbability: number;
  emergencyActions: string[];
  timeToExplosion: string;
}

/**
 * Alignment Tax Result - Speed penalty analysis
 * 
 * Output from assessAlignmentTax utility.
 * Calculates time overhead for safety measures.
 * 
 * Formula: Base 3mo + 0.08mo per alignment point above 50
 * 
 * Examples:
 * - 50 align: 3mo (no tax)
 * - 70 align: 4.6mo (53% tax)
 * - 90 align: 6.2mo (107% tax)
 * 
 * Worth-it analysis: Tax justified if cost-benefit ratio > 1.5 or align >= 70
 */
export interface AlignmentTaxResult {
  baseSpeed: number;
  taxedSpeed: number;
  taxPercentage: number;
  monthsAdded: number;
  alignmentLevel: number;
  worthIt: boolean;
  reasoning: string;
  safetyBenefits: string[];
}

/**
 * Industry Disruption Result - Market impact forecast
 * 
 * Output from predictIndustryDisruption utility.
 * Models competitive dynamics and economic consequences.
 * 
 * Disruption levels:
 * - Minor (<25): Niche applications, limited adoption
 * - Moderate (25-50): Industry-wide changes, 20-40% market shift
 * - Major (50-75): Market transformation, 40-70% dominance
 * - Catastrophic (75-100): Total industry disruption, 70-90% dominance
 * 
 * First-mover bonus: +30% disruption, faster adoption, premium pricing
 */
export interface IndustryDisruptionResult {
  disruptionLevel: 'Minor' | 'Moderate' | 'Major' | 'Catastrophic';
  disruptionScore: number;
  firstMover: boolean;
  affectedIndustries: string[];
  marketShareShift: number;
  competitorResponse: string;
  regulatoryProbability: number;
  publicOpinionImpact: number;
  economicImpact: number;
}

// ============================================================================
// INPUT TYPES FOR API REQUESTS
// ============================================================================

/**
 * Create Milestone Input - POST /api/ai/agi/milestones
 */
export interface CreateMilestoneInput {
  companyId: string;
  milestoneType: MilestoneType;
  alignmentStance?: AlignmentStance;
}

/**
 * Update Milestone Progress Input - PATCH /api/ai/agi/milestones/[id]
 */
export interface UpdateMilestoneProgressInput {
  researchPointsInvested?: number;
  computeBudgetSpent?: number;
  monthsInProgress?: number;
  currentCapability?: Partial<CapabilityMetrics>;
  currentAlignment?: Partial<AlignmentMetrics>;
}

/**
 * Attempt Achievement Input - POST /api/ai/agi/milestones/[id]/attempt
 */
export interface AttemptAchievementInput {
  researchPoints: number;
  computeBudget: number;
}

/**
 * Alignment Decision Input - POST /api/ai/agi/alignment/decision
 */
export interface AlignmentDecisionInput {
  milestoneId: string;
  challengeId: string;
  choice: 'safety' | 'capability';
}

/**
 * Progression Path Query - GET /api/ai/agi/progression-path
 */
export interface ProgressionPathQuery {
  companyId: string;
  stance?: AlignmentStance;
}

/**
 * Impact Prediction Query - GET /api/ai/agi/impact
 */
export interface ImpactPredictionQuery {
  companyId: string;
  milestoneType?: MilestoneType;
}

// ============================================================================
// ACHIEVEMENT RESULT
// ============================================================================

/**
 * Achievement Attempt Result - Success or failure outcome
 * 
 * Returned from AGIMilestone.attemptAchievement() instance method.
 * 
 * Success outcome:
 * - Capability gains (25-40 points across metrics)
 * - Alignment changes (-30 to +40 points, capability milestones reduce alignment)
 * - Impact consequences (industry disruption, economic value, risk)
 * - Status change to Achieved
 * 
 * Failure outcome:
 * - Status change to Failed
 * - Retry allowed after cooldown
 * - Subsequent attempts have slightly higher probability (learning effect)
 */
export interface AchievementResult {
  success: boolean;
  probability: number;
  outcome: string;
  capabilityGain?: CapabilityMetrics;
  alignmentChange?: AlignmentMetrics;
  impactConsequences?: ImpactConsequences;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Risk Assessment Result - Catastrophic risk evaluation
 * 
 * Output from AGIMilestone.evaluateAlignmentRisk() instance method.
 * 
 * Risk levels (based on capability-alignment gap weighted by complexity):
 * - Low (<10): Safe operation, negligible risk
 * - Medium (10-30): Manageable risk, monitoring required
 * - High (30-50): Significant risk, immediate action needed
 * - Critical (>50): Existential threat, emergency protocols
 * 
 * Gap calculation: (avgCapability - avgAlignment) × (complexity / 5)
 */
export interface RiskAssessmentResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  capabilityAlignmentGap: number;
  recommendations: string[];
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types exported via their interface declarations above
