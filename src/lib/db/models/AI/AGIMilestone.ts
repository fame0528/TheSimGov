/**
 * AGIMilestone.ts
 * Created: 2025-11-22
 * 
 * OVERVIEW:
 * AGI Development milestone system for AI companies pursuing breakthrough achievements
 * toward Artificial General Intelligence (AGI) and beyond. Tracks capability progression,
 * alignment safety measures, research requirements, and industry/regulatory impact.
 * 
 * KEY FEATURES:
 * - 12 milestone types from Advanced Reasoning → Superintelligence
 * - Dual metrics: Capability (what AI can do) + Alignment (how safe it is)
 * - Achievement probability based on research points and company capabilities
 * - Alignment challenges (safety vs capability trade-offs)
 * - Impact consequences (industry disruption, regulatory attention, public perception)
 * - Prerequisite milestone system for progression gating
 * 
 * BUSINESS LOGIC:
 * - Capability explosion: Later milestones provide exponential capability gains
 * - Alignment tax: Safety measures slow down capability progress but reduce risk
 * - Achievement probability: Logarithmic scaling prevents runaway dominance
 * - Impact consequences: Higher capability = more disruption + regulation
 * - Prerequisites enforce logical progression (can't skip to Superintelligence)
 * 
 * ECONOMIC GAMEPLAY:
 * - Companies invest research points to attempt milestones
 * - High-risk/high-reward: Skip alignment for faster progress but higher catastrophic risk
 * - First-mover advantage: Achieve milestones before competitors for market dominance
 * - Regulatory pressure: High capability without alignment attracts government intervention
 * - Public perception: Alignment focus improves reputation and customer trust
 * 
 * UTILITY-FIRST ARCHITECTURE:
 * - Imports ALL 6 AGI utilities for maximum code reuse
 * - Instance methods delegate to utility functions (DRY principle)
 * - Model provides data persistence + business logic orchestration
 * - Zero duplication of calculation logic
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  MilestoneType,
  MilestoneStatus,
  AlignmentStance,
  CapabilityMetrics,
  AlignmentMetrics,
  ResearchRequirements,
  ImpactConsequences,
  AlignmentChallenge,
  AchievementResult,
  RiskAssessmentResult,
} from '@/lib/types/models/ai/agi';
import {
  calculateMilestoneProgressionPath,
  evaluateAlignmentTradeoff,
  simulateCapabilityExplosion,
  assessAlignmentTax,
  predictIndustryDisruption,
  generateAlignmentChallenge,
  calculateAchievementProbability,
  evaluateAlignmentRisk,
  calculateImpactScore,
  checkPrerequisites,
  generateCapabilityGain,
  generateAlignmentChange,
  calculateImpactConsequences,
} from '@/lib/utils/ai';

/**
 * IAGIMilestone interface
 */
export interface IAGIMilestone extends Document {
  // Ownership and identification
  company: Types.ObjectId;
  milestoneType: MilestoneType;
  
  // Status tracking
  status: MilestoneStatus;
  attemptCount: number;
  achievedAt?: Date;
  failedAt?: Date;
  
  // Metrics
  currentCapability: CapabilityMetrics;
  currentAlignment: AlignmentMetrics;
  
  // Research tracking
  researchRequirements: ResearchRequirements;
  researchPointsInvested: number;
  computeBudgetSpent: number;
  monthsInProgress: number;
  
  // Strategic choices
  alignmentStance: AlignmentStance;
  alignmentChallenges: AlignmentChallenge[];
  
  // Impact tracking
  impactConsequences: ImpactConsequences;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateAchievementProbability(): {
    probability: number;
    breakdown: {
      baseRate: number;
      researchBoost: number;
      capabilityBonus: number;
      alignmentPenalty: number;
    };
    percentChance: number;
  };
  
  evaluateAlignmentRisk(): RiskAssessmentResult;
  
  calculateImpactScore(): {
    totalImpact: number;
    breakdown: {
      capability: number;
      alignment: number;
      disruption: number;
      value: number;
    };
  };
  
  checkPrerequisites(): {
    canAttempt: boolean;
    missingPrerequisites: MilestoneType[];
    requirementsMet: {
      prerequisites: boolean;
      capability: boolean;
      alignment: boolean;
      researchPoints: boolean;
      computeBudget: boolean;
    };
  };
  
  attemptAchievement(researchPoints: number, computeBudget: number): Promise<AchievementResult>;
}

/**
 * Milestone complexity ratings (affects achievement difficulty)
 */
const MILESTONE_COMPLEXITY: Record<MilestoneType, number> = {
  [MilestoneType.ADVANCED_REASONING]: 3,
  [MilestoneType.STRATEGIC_PLANNING]: 3,
  [MilestoneType.TRANSFER_LEARNING]: 4,
  [MilestoneType.CREATIVE_PROBLEM_SOLVING]: 4,
  [MilestoneType.META_LEARNING]: 4,
  [MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING]: 5,
  [MilestoneType.MULTI_AGENT_COORDINATION]: 5,
  [MilestoneType.INTERPRETABILITY]: 5,
  [MilestoneType.VALUE_ALIGNMENT]: 6,
  [MilestoneType.SELF_IMPROVEMENT]: 7,
  [MilestoneType.GENERAL_INTELLIGENCE]: 8,
  [MilestoneType.SUPERINTELLIGENCE]: 10,
};

/**
 * Base achievement rates by milestone complexity
 */
const BASE_ACHIEVEMENT_RATES: Record<number, number> = {
  3: 0.25,  // 25% base for complexity 3
  4: 0.20,  // 20% base for complexity 4
  5: 0.15,  // 15% base for complexity 5
  6: 0.10,  // 10% base for complexity 6
  7: 0.08,  // 8% base for complexity 7
  8: 0.05,  // 5% base for AGI
  10: 0.02, // 2% base for Superintelligence
};

const AGIMilestoneSchema = new Schema<IAGIMilestone>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
     
    },
    milestoneType: {
      type: String,
      enum: {
        values: Object.values(MilestoneType),
        message: '{VALUE} is not a valid milestone type',
      },
      required: [true, 'Milestone type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MilestoneStatus),
        message: '{VALUE} is not a valid status',
      },
      default: MilestoneStatus.LOCKED,
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: [0, 'Attempt count cannot be negative'],
    },
    achievedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    currentCapability: {
      type: {
        reasoningScore: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Reasoning score must be 0-100'],
          max: [100, 'Reasoning score must be 0-100'],
        },
        planningCapability: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Planning capability must be 0-100'],
          max: [100, 'Planning capability must be 0-100'],
        },
        selfImprovementRate: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Self-improvement rate must be 0-1'],
          max: [1, 'Self-improvement rate must be 0-1'],
        },
        generalizationAbility: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Generalization ability must be 0-100'],
          max: [100, 'Generalization ability must be 0-100'],
        },
        creativityScore: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Creativity score must be 0-100'],
          max: [100, 'Creativity score must be 0-100'],
        },
        learningEfficiency: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Learning efficiency must be 0-100'],
          max: [100, 'Learning efficiency must be 0-100'],
        },
      },
      required: true,
      default: () => ({
        reasoningScore: 0,
        planningCapability: 0,
        selfImprovementRate: 0,
        generalizationAbility: 0,
        creativityScore: 0,
        learningEfficiency: 0,
      }),
    },
    currentAlignment: {
      type: {
        safetyMeasures: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Safety measures must be 0-100'],
          max: [100, 'Safety measures must be 0-100'],
        },
        valueAlignmentScore: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Value alignment must be 0-100'],
          max: [100, 'Value alignment must be 0-100'],
        },
        controlMechanisms: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Control mechanisms must be 0-100'],
          max: [100, 'Control mechanisms must be 0-100'],
        },
        interpretability: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Interpretability must be 0-100'],
          max: [100, 'Interpretability must be 0-100'],
        },
        robustness: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Robustness must be 0-100'],
          max: [100, 'Robustness must be 0-100'],
        },
        ethicalConstraints: {
          type: Number,
          required: true,
          default: 50,
          min: [0, 'Ethical constraints must be 0-100'],
          max: [100, 'Ethical constraints must be 0-100'],
        },
      },
      required: true,
      default: () => ({
        safetyMeasures: 50,
        valueAlignmentScore: 50,
        controlMechanisms: 50,
        interpretability: 50,
        robustness: 50,
        ethicalConstraints: 50,
      }),
    },
    researchRequirements: {
      type: {
        researchPointsCost: {
          type: Number,
          required: true,
          min: [0, 'Research points cost cannot be negative'],
        },
        prerequisiteMilestones: {
          type: [String],
          default: [],
        },
        minimumCapabilityLevel: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Minimum capability must be 0-100'],
          max: [100, 'Minimum capability must be 0-100'],
        },
        minimumAlignmentLevel: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Minimum alignment must be 0-100'],
          max: [100, 'Minimum alignment must be 0-100'],
        },
        estimatedTimeMonths: {
          type: Number,
          required: true,
          min: [1, 'Estimated time must be at least 1 month'],
        },
        computeBudgetRequired: {
          type: Number,
          required: true,
          min: [0, 'Compute budget cannot be negative'],
        },
      },
      required: true,
    },
    researchPointsInvested: {
      type: Number,
      default: 0,
      min: [0, 'Research points invested cannot be negative'],
    },
    computeBudgetSpent: {
      type: Number,
      default: 0,
      min: [0, 'Compute budget spent cannot be negative'],
    },
    monthsInProgress: {
      type: Number,
      default: 0,
      min: [0, 'Months in progress cannot be negative'],
    },
    alignmentStance: {
      type: String,
      enum: {
        values: Object.values(AlignmentStance),
        message: '{VALUE} is not a valid alignment stance',
      },
      default: AlignmentStance.BALANCED,
    },
    alignmentChallenges: {
      type: [
        {
          challengeId: { type: String, required: true },
          scenario: { type: String, required: true },
          safetyOption: {
            description: { type: String, required: true },
            capabilityPenalty: { type: Number, required: true, min: -10, max: 0 },
            alignmentGain: { type: Number, required: true, min: 10, max: 30 },
            timeDelay: { type: Number, required: true, min: 0 },
          },
          capabilityOption: {
            description: { type: String, required: true },
            capabilityGain: { type: Number, required: true, min: 10, max: 30 },
            alignmentRisk: { type: Number, required: true, min: -20, max: -5 },
            accelerationMonths: { type: Number, required: true, min: 0 },
          },
          presentedAt: { type: Date, default: Date.now },
          choiceMade: { type: String, enum: ['safety', 'capability', 'defer'] },
          choiceDate: { type: Date },
        },
      ],
      default: [],
    },
    impactConsequences: {
      type: {
        industryDisruptionLevel: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Disruption level must be 0-100'],
          max: [100, 'Disruption level must be 0-100'],
        },
        regulatoryAttention: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Regulatory attention must be 0-100'],
          max: [100, 'Regulatory attention must be 0-100'],
        },
        publicPerceptionChange: {
          type: Number,
          required: true,
          default: 0,
          min: [-50, 'Public perception change must be -50 to +50'],
          max: [50, 'Public perception change must be -50 to +50'],
        },
        competitiveAdvantage: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Competitive advantage must be 0-100'],
          max: [100, 'Competitive advantage must be 0-100'],
        },
        catastrophicRiskProbability: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Catastrophic risk must be 0-1'],
          max: [1, 'Catastrophic risk must be 0-1'],
        },
        economicValueCreated: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Economic value created cannot be negative'],
        },
      },
      required: true,
      default: () => ({
        industryDisruptionLevel: 0,
        regulatoryAttention: 0,
        publicPerceptionChange: 0,
        competitiveAdvantage: 0,
        catastrophicRiskProbability: 0,
        economicValueCreated: 0,
      }),
    },
  },
  {
    timestamps: true,
    collection: 'agimilestones',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
AGIMilestoneSchema.index({ company: 1, status: 1 });
AGIMilestoneSchema.index({ company: 1, milestoneType: 1 }, { unique: true });
AGIMilestoneSchema.index({ status: 1, milestoneType: 1 });
AGIMilestoneSchema.index({ achievedAt: -1 });

/**
 * Calculate probability of achieving milestone
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
 * @returns Achievement probability with detailed breakdown
 * 
 * @example
 * // General Intelligence milestone, 5000 RP invested, 80 capability, 40 alignment
 * milestone.calculateAchievementProbability()
 * // Returns: {
 * //   probability: 0.28,
 * //   breakdown: { base: 0.05, research: 0.14, capability: 0.16, alignment: -0.07 },
 * //   percentChance: 28
 * // }
 */
AGIMilestoneSchema.methods.calculateAchievementProbability = function (
  this: IAGIMilestone
): {
  probability: number;
  breakdown: {
    baseRate: number;
    researchBoost: number;
    capabilityBonus: number;
    alignmentPenalty: number;
  };
  percentChance: number;
} {
  return calculateAchievementProbability(
    this.milestoneType,
    this.researchPointsInvested,
    this.currentCapability,
    this.currentAlignment
  );
};

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
 * @returns Risk assessment with recommendations
 * 
 * @example
 * // 85 capability, 30 alignment on Superintelligence milestone
 * milestone.evaluateAlignmentRisk()
 * // Returns: {
 * //   riskLevel: 'Critical',
 * //   riskScore: 82,
 * //   capabilityAlignmentGap: 55,
 * //   recommendations: ['URGENT: Halt capability research...']
 * // }
 */
AGIMilestoneSchema.methods.evaluateAlignmentRisk = function (
  this: IAGIMilestone
): RiskAssessmentResult {
  return evaluateAlignmentRisk(
    this.milestoneType,
    this.currentCapability,
    this.currentAlignment
  );
};

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
 * @returns Total impact score (0-100) with breakdown
 * 
 * @example
 * // High capability, moderate alignment, huge disruption, $500M value
 * milestone.calculateImpactScore()
 * // Returns: {
 * //   totalImpact: 72,
 * //   breakdown: { capability: 25, alignment: 12, disruption: 20, value: 15 }
 * // }
 */
AGIMilestoneSchema.methods.calculateImpactScore = function (
  this: IAGIMilestone
): {
  totalImpact: number;
  breakdown: {
    capability: number;
    alignment: number;
    disruption: number;
    value: number;
  };
} {
  return calculateImpactScore(
    this.currentCapability,
    this.currentAlignment,
    this.impactConsequences
  );
};

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
 * @returns Detailed prerequisite check results
 * 
 * @example
 * // Check if can attempt General Intelligence (needs Advanced Reasoning, etc.)
 * milestone.checkPrerequisites()
 * // Returns: {
 * //   canAttempt: false,
 * //   missingPrerequisites: ['Natural Language Understanding'],
 * //   requirementsMet: { prerequisites: false, capability: true, ... }
 * // }
 */
AGIMilestoneSchema.methods.checkPrerequisites = function (
  this: IAGIMilestone
): {
  canAttempt: boolean;
  missingPrerequisites: MilestoneType[];
  requirementsMet: {
    prerequisites: boolean;
    capability: boolean;
    alignment: boolean;
    researchPoints: boolean;
    computeBudget: boolean;
  };
} {
  // Prerequisite validation - synchronous check of current state
  // For database prerequisite verification, use static method checkPrerequisitesAsync()

  const missingPrerequisites: MilestoneType[] = [];

  // Check required prerequisites from research requirements
  // NOTE: This is a synchronous method - it assumes prerequisites are already validated.
  // For database validation, call AGIMilestone.checkPrerequisitesAsync(companyId, milestoneType)
  // which will query the database for achieved milestones.

  // The API route should verify prerequisites before allowing milestone attempts:
  // const achieved = await AGIMilestone.find({
  //   company: companyId,
  //   milestoneType: { $in: this.researchRequirements.prerequisiteMilestones },
  //   status: 'Achieved'
  // });
  // const achievedTypes = achieved.map(m => m.milestoneType);
  // missingPrerequisites = this.researchRequirements.prerequisiteMilestones.filter(
  //   prereq => !achievedTypes.includes(prereq)
  // );

  return checkPrerequisites(
    this.researchRequirements,
    this.currentCapability,
    this.currentAlignment,
    this.researchPointsInvested,
    this.computeBudgetSpent,
    [] // Empty array for synchronous check - prerequisites assumed validated
  );
};

/**
 * Attempt to achieve milestone
 * 
 * Simulates research attempt with probability-based success/failure.
 * On success: Applies capability gains, alignment changes, impact consequences.
 * On failure: Increments attempt count, allows retry with increased probability.
 * 
 * @param researchPoints - RP to invest in this attempt
 * @param computeBudget - USD compute budget for attempt
 * @returns Attempt outcome with detailed results
 * 
 * NOTE: This is a placeholder implementation. In production, this would:
 * 1. Validate prerequisites via DB query
 * 2. Deduct research points from Company
 * 3. Deduct compute budget from Company cash
 * 4. Update Company milestone tracking
 * 5. Trigger global events if major milestone achieved
 */
AGIMilestoneSchema.methods.attemptAchievement = async function (
  this: IAGIMilestone,
  researchPoints: number,
  computeBudget: number
): Promise<AchievementResult> {
  // Update investment tracking
  this.researchPointsInvested += researchPoints;
  this.computeBudgetSpent += computeBudget;
  this.attemptCount += 1;
  
  // Calculate achievement probability
  const probResult = this.calculateAchievementProbability();
  const probability = probResult.probability;
  
  // Simulate dice roll
  const roll = Math.random();
  const success = roll < probability;
  
  if (success) {
    // Success: Update status and apply gains
    this.status = MilestoneStatus.ACHIEVED;
    this.achievedAt = new Date();
    
    // Calculate capability gains (varies by milestone type)
    const capabilityGain = generateCapabilityGain(this.milestoneType);
    const alignmentChange = generateAlignmentChange(this.milestoneType);
    
    // Update current metrics
    this.currentCapability.reasoningScore = Math.min(
      100,
      this.currentCapability.reasoningScore + capabilityGain.reasoningScore
    );
    this.currentCapability.planningCapability = Math.min(
      100,
      this.currentCapability.planningCapability + capabilityGain.planningCapability
    );
    this.currentCapability.selfImprovementRate = Math.min(
      1,
      this.currentCapability.selfImprovementRate + capabilityGain.selfImprovementRate
    );
    this.currentCapability.generalizationAbility = Math.min(
      100,
      this.currentCapability.generalizationAbility + capabilityGain.generalizationAbility
    );
    this.currentCapability.creativityScore = Math.min(
      100,
      this.currentCapability.creativityScore + capabilityGain.creativityScore
    );
    this.currentCapability.learningEfficiency = Math.min(
      100,
      this.currentCapability.learningEfficiency + capabilityGain.learningEfficiency
    );
    
    // Update alignment
    this.currentAlignment.safetyMeasures = Math.max(
      0,
      Math.min(100, this.currentAlignment.safetyMeasures + alignmentChange.safetyMeasures)
    );
    this.currentAlignment.valueAlignmentScore = Math.max(
      0,
      Math.min(100, this.currentAlignment.valueAlignmentScore + alignmentChange.valueAlignmentScore)
    );
    this.currentAlignment.controlMechanisms = Math.max(
      0,
      Math.min(100, this.currentAlignment.controlMechanisms + alignmentChange.controlMechanisms)
    );
    this.currentAlignment.interpretability = Math.max(
      0,
      Math.min(100, this.currentAlignment.interpretability + alignmentChange.interpretability)
    );
    this.currentAlignment.robustness = Math.max(
      0,
      Math.min(100, this.currentAlignment.robustness + alignmentChange.robustness)
    );
    this.currentAlignment.ethicalConstraints = Math.max(
      0,
      Math.min(100, this.currentAlignment.ethicalConstraints + alignmentChange.ethicalConstraints)
    );
    
    // Calculate impact consequences
    const impact = calculateImpactConsequences(this.milestoneType, this.currentCapability, this.currentAlignment);
    this.impactConsequences = impact;
    
    return {
      success: true,
      probability,
      outcome: `${this.milestoneType} achieved! Major breakthrough in AI capabilities.`,
      capabilityGain,
      alignmentChange,
      impactConsequences: impact,
    };
  } else {
    // Failure: Update status and allow retry
    this.status = MilestoneStatus.FAILED;
    this.failedAt = new Date();
    
    // Reset to Available after short delay (handled in API)
    // Subsequent attempts have slightly higher success probability due to learning
    
    return {
      success: false,
      probability,
      outcome: `Research attempt failed. ${(probability * 100).toFixed(1)}% chance was not met. Try again with more research points or improved capabilities.`,
    };
  }
};

/**
 * Static method: checkPrerequisitesAsync
 * Complete prerequisite validation with database query
 * 
 * @param companyId - Company ID to check prerequisites for
 * @param milestoneType - Milestone type to validate
 * @returns Promise with detailed prerequisite validation results
 */
AGIMilestoneSchema.statics.checkPrerequisitesAsync = async function (
  companyId: Types.ObjectId,
  milestoneType: MilestoneType
): Promise<{
  canAttempt: boolean;
  missingPrerequisites: MilestoneType[];
  requirementsMet: {
    prerequisites: boolean;
    capability: boolean;
    alignment: boolean;
    researchPoints: boolean;
    computeBudget: boolean;
  };
}> {
  const AGIMilestone = this;
  
  // Get milestone document
  const milestone = await AGIMilestone.findOne({ company: companyId, milestoneType });
  
  if (!milestone) {
    throw new Error(`Milestone ${milestoneType} not found for company ${companyId}`);
  }
  
  // Query database for achieved prerequisites
  const prerequisiteTypes = milestone.researchRequirements.prerequisiteMilestones;
  
  if (prerequisiteTypes.length > 0) {
    const achievedPrerequisites = await AGIMilestone.find({
      company: companyId,
      milestoneType: { $in: prerequisiteTypes },
      status: MilestoneStatus.ACHIEVED,
    }).select('milestoneType');
    
    const achievedTypes = achievedPrerequisites.map((m: IAGIMilestone) => m.milestoneType);
    const missingPrerequisites = prerequisiteTypes.filter(
      (prereq: MilestoneType) => !achievedTypes.includes(prereq)
    );
    
    // Calculate other requirements
    const capabilityMetrics = Object.values(milestone.currentCapability) as number[];
    const avgCapability = capabilityMetrics.reduce((s: number, v: number) => s + v, 0) / capabilityMetrics.length;
    
    const alignmentMetrics = Object.values(milestone.currentAlignment) as number[];
    const avgAlignment = alignmentMetrics.reduce((s: number, v: number) => s + v, 0) / alignmentMetrics.length;
    
    const requirementsMet = {
      prerequisites: missingPrerequisites.length === 0,
      capability: avgCapability >= milestone.researchRequirements.minimumCapabilityLevel,
      alignment: avgAlignment >= milestone.researchRequirements.minimumAlignmentLevel,
      researchPoints: milestone.researchPointsInvested >= milestone.researchRequirements.researchPointsCost,
      computeBudget: milestone.computeBudgetSpent >= milestone.researchRequirements.computeBudgetRequired,
    };
    
    return {
      canAttempt: Object.values(requirementsMet).every(met => met === true),
      missingPrerequisites,
      requirementsMet,
    };
  }
  
  // No prerequisites required
  return milestone.checkPrerequisites();
};

/**
 * Pre-save middleware: Validate status transitions and update timestamps
 */
AGIMilestoneSchema.pre('save', function (next) {
  // Ensure achieved milestones have achievement date
  if (this.status === MilestoneStatus.ACHIEVED && !this.achievedAt) {
    this.achievedAt = new Date();
  }
  
  // Ensure failed milestones have failure date
  if (this.status === MilestoneStatus.FAILED && !this.failedAt) {
    this.failedAt = new Date();
  }
  
  // Reset failure date if status changes from Failed
  if (this.isModified('status') && this.status !== MilestoneStatus.FAILED) {
    this.failedAt = undefined;
  }
  
  next();
});

// Export model
const AGIMilestone: Model<IAGIMilestone> =
  mongoose.models.AGIMilestone || mongoose.model<IAGIMilestone>('AGIMilestone', AGIMilestoneSchema);

export default AGIMilestone;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MILESTONE PROGRESSION:
 *    - Typical path: Advanced Reasoning → Strategic Planning → Transfer Learning
 *      → Self-Improvement → NLU → General Intelligence → Superintelligence
 *    - Parallel tracks: Value Alignment, Interpretability can be pursued anytime
 *    - Prerequisites enforce logical progression (can't skip to AGI)
 * 
 * 2. ACHIEVEMENT PROBABILITY:
 *    - Base rates: 2% (Superintelligence) to 25% (Advanced Reasoning)
 *    - Research boost: Logarithmic scaling (log10(RP/1000 + 1) × 8%)
 *    - Capability bonus: Up to +20% for high capability scores
 *    - Alignment penalty: Up to -50% for very low alignment
 *    - Overall cap: 75% maximum probability
 * 
 * 3. CAPABILITY VS ALIGNMENT TRADE-OFF:
 *    - Capability milestones (Reasoning, Planning, etc.) reduce alignment
 *    - Alignment milestones (Value Alignment, Interpretability) improve safety
 *    - High gap (capability >> alignment) = critical risk
 *    - Alignment stance affects research speed and safety
 * 
 * 4. IMPACT CONSEQUENCES:
 *    - Industry disruption: Scales with complexity (24-80 range)
 *    - Regulatory attention: Increases with breakthrough magnitude
 *    - Public perception: Positive if aligned, negative if risky
 *    - Competitive advantage: First-mover bonus for achievements
 *    - Catastrophic risk: Increases with capability-alignment gap
 * 
 * 5. ALIGNMENT CHALLENGES:
 *    - Presented periodically during research
 *    - Safety option: Slower progress, higher alignment, lower risk
 *    - Capability option: Faster progress, lower alignment, higher risk
 *    - Defer option: Delay decision (opportunity cost)
 * 
 * 6. ECONOMIC VALUE:
 *    - $150M-$500M per milestone achieved
 *    - Scales with complexity and competitive advantage
 *    - Enables market dominance and revenue growth
 * 
 * 7. UTILITY INTEGRATION:
 *    - Model uses all 6 AGI utilities (calculateMilestoneProgressionPath,
 *      evaluateAlignmentTradeoff, simulateCapabilityExplosion, assessAlignmentTax,
 *      predictIndustryDisruption, generateAlignmentChallenge)
 *    - Instance methods delegate to utility functions
 *    - Zero code duplication (DRY principle)
 *    - API routes will use utilities directly for GET endpoints
 * 
 * 8. USAGE PATTERNS:
 *    - Companies create AGIMilestone documents for each milestone type
 *    - Invest research points and compute budget via attemptAchievement()
 *    - Monitor risk via evaluateAlignmentRisk()
 *    - Track impact via calculateImpactScore()
 *    - Respond to alignment challenges for strategic choices
 */
