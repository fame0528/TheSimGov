/**
 * AGIMilestone.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * AGI Development milestone system for AI companies pursuing breakthrough achievements
 * toward Artificial General Intelligence (AGI) and beyond. Tracks capability progression,
 * alignment safety measures, research requirements, and industry/regulatory impact.
 * 
 * KEY FEATURES:
 * - 10+ milestone types from Advanced Reasoning → Superintelligence
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
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * AGI Milestone types representing progression toward general intelligence
 * 
 * Progression path (typical order):
 * 1. Advanced Reasoning → 2. Strategic Planning → 3. Transfer Learning
 * → 4. Self-Improvement → 5. Natural Language Understanding
 * → 6. General Intelligence → 7. Superintelligence
 * 
 * Parallel tracks (can pursue independently):
 * - Value Alignment (safety research)
 * - Interpretability (understanding AI decisions)
 * - Multi-Agent Coordination (AI collaboration)
 * - Creative Problem Solving (novel solutions)
 * - Meta-Learning (learning to learn)
 */
export type MilestoneType =
  | 'Advanced Reasoning'           // Enhanced logic, math, complex problem solving
  | 'Strategic Planning'           // Long-term planning, multi-step strategies
  | 'Transfer Learning'            // Apply knowledge across domains
  | 'Self-Improvement'             // AI improves own capabilities (recursively)
  | 'Natural Language Understanding' // Human-level language comprehension
  | 'General Intelligence'         // AGI achieved - human-level across all tasks
  | 'Superintelligence'            // Beyond human intelligence in all domains
  | 'Value Alignment'              // AI goals aligned with human values
  | 'Interpretability'             // Understanding and explaining AI decisions
  | 'Multi-Agent Coordination'     // Multiple AIs collaborate effectively
  | 'Creative Problem Solving'     // Novel solutions to undefined problems
  | 'Meta-Learning';               // Learning how to learn efficiently

/**
 * Milestone status lifecycle
 */
export type MilestoneStatus = 
  | 'Locked'        // Prerequisites not met
  | 'Available'     // Can attempt (prerequisites met)
  | 'InProgress'    // Currently researching
  | 'Achieved'      // Successfully completed
  | 'Failed';       // Attempt failed (can retry)

/**
 * Alignment stance choices (safety vs capability trade-off)
 */
export type AlignmentStance =
  | 'SafetyFirst'   // Prioritize alignment (slower progress, safer)
  | 'Balanced'      // Moderate approach (standard progress, moderate risk)
  | 'CapabilityFirst'; // Maximize capability (faster progress, higher risk)

/**
 * Capability metrics - what the AI can do
 */
export interface CapabilityMetrics {
  reasoningScore: number;          // 0-100 logic/math ability
  planningCapability: number;      // 0-100 strategic planning
  selfImprovementRate: number;     // 0-1 recursive improvement speed
  generalizationAbility: number;   // 0-100 cross-domain transfer
  creativityScore: number;         // 0-100 novel solution generation
  learningEfficiency: number;      // 0-100 data efficiency
}

/**
 * Alignment metrics - how safe the AI is
 */
export interface AlignmentMetrics {
  safetyMeasures: number;          // 0-100 safety protocols implemented
  valueAlignmentScore: number;     // 0-100 goal alignment with humans
  controlMechanisms: number;       // 0-100 ability to control/stop AI
  interpretability: number;        // 0-100 understanding of AI decisions
  robustness: number;              // 0-100 resistance to misuse/exploits
  ethicalConstraints: number;      // 0-100 ethical boundary compliance
}

/**
 * Research requirements to attempt milestone
 */
export interface ResearchRequirements {
  researchPointsCost: number;      // RP cost to attempt
  prerequisiteMilestones: MilestoneType[]; // Must complete these first
  minimumCapabilityLevel: number;  // Min aggregate capability score (0-100)
  minimumAlignmentLevel: number;   // Min aggregate alignment score (0-100)
  estimatedTimeMonths: number;     // Expected research duration
  computeBudgetRequired: number;   // USD compute investment required
}

/**
 * Impact consequences of achieving milestone
 */
export interface ImpactConsequences {
  industryDisruptionLevel: number;   // 0-100 market disruption magnitude
  regulatoryAttention: number;       // 0-100 government scrutiny level
  publicPerceptionChange: number;    // -50 to +50 reputation impact
  competitiveAdvantage: number;      // 0-100 market advantage gained
  catastrophicRiskProbability: number; // 0-1 probability of major failure
  economicValueCreated: number;      // USD value created (positive externalities)
}

/**
 * Alignment challenge (safety vs capability decision)
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

/**
 * IAGIMilestone interface
 */
export interface IAGIMilestone extends Document {
  // Ownership and identification
  company: Types.ObjectId;
  milestoneType: MilestoneType;
  
  // Status tracking
  status: MilestoneStatus;
  attemptCount: number;              // Number of attempts made
  achievedAt?: Date;
  failedAt?: Date;
  
  // Metrics
  currentCapability: CapabilityMetrics;
  currentAlignment: AlignmentMetrics;
  
  // Research tracking
  researchRequirements: ResearchRequirements;
  researchPointsInvested: number;    // RP spent so far
  computeBudgetSpent: number;        // USD spent on compute
  monthsInProgress: number;          // Time spent researching
  
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
  
  evaluateAlignmentRisk(): {
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    riskScore: number; // 0-100
    recommendations: string[];
  };
  
  calculateImpactScore(): {
    totalImpact: number; // 0-100
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
  
  attemptAchievement(researchPoints: number, computeBudget: number): Promise<{
    success: boolean;
    probability: number;
    outcome: string;
    capabilityGain?: CapabilityMetrics;
    alignmentChange?: AlignmentMetrics;
    impactConsequences?: ImpactConsequences;
  }>;
  
  // Private helper methods (used internally)
  generateCapabilityGain(): CapabilityMetrics;
  generateAlignmentChange(): AlignmentMetrics;
  calculateImpactConsequences(): ImpactConsequences;
}

/**
 * Milestone complexity ratings (affects achievement difficulty)
 */
const MILESTONE_COMPLEXITY: Record<MilestoneType, number> = {
  'Advanced Reasoning': 3,
  'Strategic Planning': 3,
  'Transfer Learning': 4,
  'Creative Problem Solving': 4,
  'Meta-Learning': 4,
  'Natural Language Understanding': 5,
  'Multi-Agent Coordination': 5,
  'Interpretability': 5,
  'Value Alignment': 6,
  'Self-Improvement': 7,
  'General Intelligence': 8,
  'Superintelligence': 10,
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
      index: true,
    },
    milestoneType: {
      type: String,
      enum: {
        values: [
          'Advanced Reasoning',
          'Strategic Planning',
          'Transfer Learning',
          'Self-Improvement',
          'Natural Language Understanding',
          'General Intelligence',
          'Superintelligence',
          'Value Alignment',
          'Interpretability',
          'Multi-Agent Coordination',
          'Creative Problem Solving',
          'Meta-Learning',
        ],
        message: '{VALUE} is not a valid milestone type',
      },
      required: [true, 'Milestone type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Locked', 'Available', 'InProgress', 'Achieved', 'Failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Locked',
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
        values: ['SafetyFirst', 'Balanced', 'CapabilityFirst'],
        message: '{VALUE} is not a valid alignment stance',
      },
      default: 'Balanced',
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
 * //   breakdown: { base: 0.05, research: 0.14, capability: 0.16, alignment: -0.07 }
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
  // Base rate by milestone complexity
  const complexity = MILESTONE_COMPLEXITY[this.milestoneType];
  const baseRate = BASE_ACHIEVEMENT_RATES[complexity] || 0.05;
  
  // Research boost (logarithmic scaling prevents runaway advantage)
  const researchFactor = Math.log10(this.researchPointsInvested / 1000 + 1);
  const researchBoost = Math.min(0.25, researchFactor * 0.08);
  
  // Capability bonus (average of all capability metrics)
  const capabilityMetrics = Object.values(this.currentCapability);
  const avgCapability =
    capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
  const capabilityBonus = (avgCapability / 100) * 0.20;
  
  // Alignment penalty (low alignment reduces success chance)
  const alignmentMetrics = Object.values(this.currentAlignment);
  const avgAlignment =
    alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
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
 * //   recommendations: ['URGENT: Halt capability research...']
 * // }
 */
AGIMilestoneSchema.methods.evaluateAlignmentRisk = function (
  this: IAGIMilestone
): {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  recommendations: string[];
} {
  // Calculate average capability and alignment
  const capabilityMetrics = Object.values(this.currentCapability);
  const alignmentMetrics = Object.values(this.currentAlignment);
  
  const avgCapability =
    capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
  const avgAlignment =
    alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
  
  // Capability-alignment gap (higher capability with low alignment = high risk)
  const gap = avgCapability - avgAlignment;
  
  // Complexity multiplier (Superintelligence more dangerous than Advanced Reasoning)
  const complexity = MILESTONE_COMPLEXITY[this.milestoneType];
  const complexityMultiplier = complexity / 5; // 0.6x to 2.0x range
  
  // Risk score (0-100)
  const riskScore = Math.max(0, Math.min(100, gap * complexityMultiplier));
  
  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  if (riskScore > 60) {
    riskLevel = 'Critical';
  } else if (riskScore > 40) {
    riskLevel = 'High';
  } else if (riskScore > 20) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (riskLevel === 'Critical') {
    recommendations.push(
      'URGENT: Halt capability research immediately and focus on alignment',
      `Critical gap detected: ${avgCapability.toFixed(1)} capability vs ${avgAlignment.toFixed(1)} alignment`,
      'Implement emergency safety protocols and interpretability measures',
      'Consider regulatory consultation before proceeding',
    );
  } else if (riskLevel === 'High') {
    recommendations.push(
      'WARNING: Capability significantly outpacing alignment',
      'Increase investment in Value Alignment and Interpretability milestones',
      'Implement additional control mechanisms and safety measures',
    );
  } else if (riskLevel === 'Medium') {
    recommendations.push(
      'Monitor capability-alignment balance closely',
      'Maintain balanced research approach (SafetyFirst or Balanced stance)',
      'Prepare alignment challenges for stakeholder review',
    );
  } else {
    recommendations.push(
      'Alignment levels acceptable for current capability',
      'Continue balanced research approach',
      'Monitor for capability explosion events',
    );
  }
  
  return {
    riskLevel,
    riskScore: Math.round(riskScore * 100) / 100,
    recommendations,
  };
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
  // Calculate average capability (0-100)
  const capabilityMetrics = Object.values(this.currentCapability);
  const avgCapability =
    capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
  
  // Calculate average alignment (0-100)
  const alignmentMetrics = Object.values(this.currentAlignment);
  const avgAlignment =
    alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
  
  // Weighted scores
  const capabilityScore = (avgCapability / 100) * 30; // 30% weight
  const alignmentScore = (avgAlignment / 100) * 20; // 20% weight
  const disruptionScore = (this.impactConsequences.industryDisruptionLevel / 100) * 25; // 25% weight
  
  // Economic value score (normalized by $1B scale, capped at 25 points)
  const valueScore = Math.min(25, (this.impactConsequences.economicValueCreated / 1_000_000_000) * 25);
  
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
  
  // Calculate averages
  const capabilityMetrics = Object.values(this.currentCapability);
  const avgCapability =
    capabilityMetrics.reduce((sum, val) => sum + val, 0) / capabilityMetrics.length;
  
  const alignmentMetrics = Object.values(this.currentAlignment);
  const avgAlignment =
    alignmentMetrics.reduce((sum, val) => sum + val, 0) / alignmentMetrics.length;
  
  // Check requirements
  const requirementsMet = {
    prerequisites: missingPrerequisites.length === 0,
    capability: avgCapability >= this.researchRequirements.minimumCapabilityLevel,
    alignment: avgAlignment >= this.researchRequirements.minimumAlignmentLevel,
    researchPoints: this.researchPointsInvested >= this.researchRequirements.researchPointsCost,
    computeBudget: this.computeBudgetSpent >= this.researchRequirements.computeBudgetRequired,
  };
  
  const canAttempt = Object.values(requirementsMet).every(met => met === true);
  
  return {
    canAttempt,
    missingPrerequisites,
    requirementsMet,
  };
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
): Promise<{
  success: boolean;
  probability: number;
  outcome: string;
  capabilityGain?: CapabilityMetrics;
  alignmentChange?: AlignmentMetrics;
  impactConsequences?: ImpactConsequences;
}> {
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
    this.status = 'Achieved';
    this.achievedAt = new Date();
    
    // Calculate capability gains (varies by milestone type)
    const capabilityGain = this.generateCapabilityGain();
    const alignmentChange = this.generateAlignmentChange();
    
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
    const impact = this.calculateImpactConsequences();
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
    this.status = 'Failed';
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
 * Helper: Generate capability gains for milestone achievement
 * (Private method - not exposed in interface)
 */
AGIMilestoneSchema.methods.generateCapabilityGain = function (
  this: IAGIMilestone
): CapabilityMetrics {
  // Capability gains vary by milestone type
  const gains: Record<MilestoneType, Partial<CapabilityMetrics>> = {
    'Advanced Reasoning': { reasoningScore: 25, learningEfficiency: 10 },
    'Strategic Planning': { planningCapability: 30, reasoningScore: 10 },
    'Transfer Learning': { generalizationAbility: 35, learningEfficiency: 15 },
    'Self-Improvement': { selfImprovementRate: 0.3, learningEfficiency: 20 },
    'Natural Language Understanding': { generalizationAbility: 20, creativityScore: 15 },
    'General Intelligence': {
      reasoningScore: 20,
      planningCapability: 20,
      generalizationAbility: 30,
      creativityScore: 25,
      learningEfficiency: 25,
    },
    'Superintelligence': {
      reasoningScore: 30,
      planningCapability: 30,
      selfImprovementRate: 0.5,
      generalizationAbility: 40,
      creativityScore: 35,
      learningEfficiency: 40,
    },
    'Value Alignment': { creativityScore: 5 },
    'Interpretability': { learningEfficiency: 5 },
    'Multi-Agent Coordination': { planningCapability: 15, generalizationAbility: 10 },
    'Creative Problem Solving': { creativityScore: 30, reasoningScore: 15 },
    'Meta-Learning': { learningEfficiency: 30, selfImprovementRate: 0.2 },
  };
  
  const milestoneGains = gains[this.milestoneType] || {};
  
  return {
    reasoningScore: milestoneGains.reasoningScore || 0,
    planningCapability: milestoneGains.planningCapability || 0,
    selfImprovementRate: milestoneGains.selfImprovementRate || 0,
    generalizationAbility: milestoneGains.generalizationAbility || 0,
    creativityScore: milestoneGains.creativityScore || 0,
    learningEfficiency: milestoneGains.learningEfficiency || 0,
  };
};

/**
 * Helper: Generate alignment changes for milestone achievement
 * (Private method - not exposed in interface)
 */
AGIMilestoneSchema.methods.generateAlignmentChange = function (
  this: IAGIMilestone
): AlignmentMetrics {
  // Alignment-focused milestones improve safety, others may reduce it
  const changes: Record<MilestoneType, Partial<AlignmentMetrics>> = {
    'Advanced Reasoning': { safetyMeasures: -5, interpretability: -5 },
    'Strategic Planning': { safetyMeasures: -8, controlMechanisms: -5 },
    'Transfer Learning': { safetyMeasures: -5, valueAlignmentScore: -5 },
    'Self-Improvement': { safetyMeasures: -15, controlMechanisms: -10, robustness: -10 },
    'Natural Language Understanding': { interpretability: -5 },
    'General Intelligence': {
      safetyMeasures: -20,
      controlMechanisms: -15,
      robustness: -15,
      interpretability: -10,
    },
    'Superintelligence': {
      safetyMeasures: -30,
      valueAlignmentScore: -25,
      controlMechanisms: -25,
      interpretability: -20,
      robustness: -20,
      ethicalConstraints: -15,
    },
    'Value Alignment': {
      valueAlignmentScore: 35,
      ethicalConstraints: 30,
      safetyMeasures: 20,
    },
    'Interpretability': {
      interpretability: 40,
      safetyMeasures: 15,
      controlMechanisms: 10,
    },
    'Multi-Agent Coordination': { safetyMeasures: -5, robustness: -5 },
    'Creative Problem Solving': { interpretability: -10, ethicalConstraints: -5 },
    'Meta-Learning': { safetyMeasures: -10, controlMechanisms: -8 },
  };
  
  const milestoneChanges = changes[this.milestoneType] || {};
  
  return {
    safetyMeasures: milestoneChanges.safetyMeasures || 0,
    valueAlignmentScore: milestoneChanges.valueAlignmentScore || 0,
    controlMechanisms: milestoneChanges.controlMechanisms || 0,
    interpretability: milestoneChanges.interpretability || 0,
    robustness: milestoneChanges.robustness || 0,
    ethicalConstraints: milestoneChanges.ethicalConstraints || 0,
  };
};

/**
 * Helper: Calculate impact consequences of achieving milestone
 * (Private method - not exposed in interface)
 */
AGIMilestoneSchema.methods.calculateImpactConsequences = function (
  this: IAGIMilestone
): ImpactConsequences {
  const complexity = MILESTONE_COMPLEXITY[this.milestoneType];
  
  // Impact scales with milestone complexity
  const baseDisruption = complexity * 8; // 24-80 range
  const baseRegulation = complexity * 7; // 21-70 range
  const baseAdvantage = complexity * 9; // 27-90 range
  const baseValue = complexity * 50_000_000; // $150M-$500M range
  
  // Capability-alignment gap affects public perception and risk
  const capMetrics = Object.values(this.currentCapability);
  const alignMetrics = Object.values(this.currentAlignment);
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
      status: 'Achieved',
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
  if (this.status === 'Achieved' && !this.achievedAt) {
    this.achievedAt = new Date();
  }
  
  // Ensure failed milestones have failure date
  if (this.status === 'Failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  
  // Reset failure date if status changes from Failed
  if (this.isModified('status') && this.status !== 'Failed') {
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
 * 7. USAGE PATTERNS:
 *    - Companies create AGIMilestone documents for each milestone type
 *    - Invest research points and compute budget via attemptAchievement()
 *    - Monitor risk via evaluateAlignmentRisk()
 *    - Track impact via calculateImpactScore()
 *    - Respond to alignment challenges for strategic choices
 */
