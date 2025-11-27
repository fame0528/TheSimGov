/**
 * AIResearchProject.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Research project schema for AI companies pursuing performance improvements,
 * new capabilities, or efficiency optimizations. Tracks budget allocation,
 * researcher assignment, progress, and actual performance gains achieved.
 * 
 * KEY FEATURES:
 * - Full project lifecycle (InProgress → Completed → Cancelled)
 * - Budget tracking with spent vs allocated monitoring
 * - Researcher assignment and productivity tracking
 * - Performance gain calculation based on researcher skill and time
 * - Project type categorization (Performance, Efficiency, NewCapability)
 * 
 * BUSINESS LOGIC:
 * - Performance gains scale with researcher skill (0.5x to 2x multiplier)
 * - Project complexity affects time requirements and gain potential
 * - Budget overruns reduce final performance gain
 * - Cancellation penalties reduce research points by 10%
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Project status lifecycle
export type ResearchStatus = 'InProgress' | 'Completed' | 'Cancelled';

// Research project categories
export type ResearchType = 'Performance' | 'Efficiency' | 'NewCapability';

// Research complexity levels
export type ResearchComplexity = 'Low' | 'Medium' | 'High';

/**
 * Performance gain metrics
 * Actual improvements achieved by completing the research
 */
export interface PerformanceGain {
  accuracy: number;        // +0-20% improvement to model accuracy
  efficiency: number;      // +0-50% reduction in training cost
  speed: number;          // +0-40% reduction in inference latency
  capability: string | null; // New capability unlocked (e.g., "multimodal")
}

/**
 * Research breakthrough (Phase 4.1)
 * Major discovery during research project with patent/publication potential
 */
export interface Breakthrough {
  name: string;
  area: 'Performance' | 'Efficiency' | 'Alignment' | 'Multimodal' | 'Reasoning' | 'Architecture';
  discoveredAt: Date;
  noveltyScore: number;    // 0-100 (originality rating)
  performanceGainPercent: number; // 0-20%
  efficiencyGainPercent: number;  // 0-50%
  patentable: boolean;
  estimatedPatentValue: number;
}

/**
 * Patent filed from research (Phase 4.1)
 */
export interface Patent {
  patentId: string;
  title: string;
  area: 'Performance' | 'Efficiency' | 'Alignment' | 'Multimodal' | 'Reasoning' | 'Architecture';
  filedAt: Date;
  approvedAt?: Date;
  status: 'Filed' | 'UnderReview' | 'Approved' | 'Rejected';
  filingCost: number;
  estimatedValue: number;
  licensingRevenue: number;
  citations: number;
}

/**
 * Publication from research (Phase 4.1)
 */
export interface Publication {
  publicationId: string;
  title: string;
  authors: string[];
  venue: 'Conference' | 'Journal' | 'Workshop' | 'Preprint';
  venueName: string;
  publishedAt: Date;
  citations: number;
  downloads: number;
}

/**
 * AIResearchProject interface
 */
export interface IAIResearchProject extends Document {
  // Ownership and identification
  company: Types.ObjectId;
  name: string;
  type: ResearchType;
  complexity: ResearchComplexity;
  
  // Project lifecycle
  status: ResearchStatus;
  progress: number; // 0-100%
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Budget tracking
  budgetAllocated: number; // USD allocated for project
  budgetSpent: number; // USD actually spent
  
  // Resource allocation
  assignedResearchers: Types.ObjectId[]; // Employee references
  
  // Performance outcomes (calculated on completion)
  performanceGain: PerformanceGain;
  
  // Phase 4.1: Research Lab additions
  breakthroughs: Breakthrough[];
  patents: Patent[];
  publications: Publication[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculatePerformanceGain(researcherSkills: number[]): PerformanceGain;
  advanceProgress(increment: number, costIncurred: number): void;
  cancel(reason: string): void;
}

/**
 * Complexity multipliers for performance gain potential
 */
const COMPLEXITY_MULTIPLIERS: Record<ResearchComplexity, number> = {
  Low: 0.5,
  Medium: 1.0,
  High: 1.8,
};

/**
 * Base gain potentials by research type
 */
const BASE_GAINS: Record<ResearchType, PerformanceGain> = {
  Performance: {
    accuracy: 15,
    efficiency: 10,
    speed: 10,
    capability: null,
  },
  Efficiency: {
    accuracy: 5,
    efficiency: 40,
    speed: 25,
    capability: null,
  },
  NewCapability: {
    accuracy: 8,
    efficiency: 5,
    speed: 5,
    capability: 'unlocked',
  },
};

const AIResearchProjectSchema = new Schema<IAIResearchProject>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [5, 'Project name must be at least 5 characters'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['Performance', 'Efficiency', 'NewCapability'],
        message: '{VALUE} is not a valid research type',
      },
      required: [true, 'Research type is required'],
      index: true,
    },
    complexity: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid complexity level',
      },
      required: [true, 'Complexity level is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['InProgress', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'InProgress',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    budgetAllocated: {
      type: Number,
      required: [true, 'Budget allocation is required'],
      min: [1000, 'Budget must be at least $1,000'],
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: [0, 'Budget spent cannot be negative'],
    },
    assignedResearchers: {
      type: [Schema.Types.ObjectId],
      ref: 'Employee',
      default: [],
      validate: {
        validator: function (v: Types.ObjectId[]): boolean {
          return v.length >= 1 && v.length <= 10;
        },
        message: 'Project must have between 1 and 10 assigned researchers',
      },
    },
    performanceGain: {
      type: {
        accuracy: {
          type: Number,
          min: [0, 'Accuracy gain must be non-negative'],
          max: [20, 'Accuracy gain cannot exceed 20%'],
          default: 0,
        },
        efficiency: {
          type: Number,
          min: [0, 'Efficiency gain must be non-negative'],
          max: [50, 'Efficiency gain cannot exceed 50%'],
          default: 0,
        },
        speed: {
          type: Number,
          min: [0, 'Speed gain must be non-negative'],
          max: [40, 'Speed gain cannot exceed 40%'],
          default: 0,
        },
        capability: {
          type: String,
          default: null,
        },
      },
      default: () => ({
        accuracy: 0,
        efficiency: 0,
        speed: 0,
        capability: null,
      }),
    },
    // Phase 4.1: Research Lab additions
    breakthroughs: {
      type: [
        {
          name: { type: String, required: true },
          area: {
            type: String,
            enum: ['Performance', 'Efficiency', 'Alignment', 'Multimodal', 'Reasoning', 'Architecture'],
            required: true,
          },
          discoveredAt: { type: Date, default: Date.now },
          noveltyScore: { type: Number, min: 0, max: 100, required: true },
          performanceGainPercent: { type: Number, min: 0, max: 20, default: 0 },
          efficiencyGainPercent: { type: Number, min: 0, max: 50, default: 0 },
          patentable: { type: Boolean, default: false },
          estimatedPatentValue: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    patents: {
      type: [
        {
          patentId: { type: String, required: true },
          title: { type: String, required: true },
          area: {
            type: String,
            enum: ['Performance', 'Efficiency', 'Alignment', 'Multimodal', 'Reasoning', 'Architecture'],
            required: true,
          },
          filedAt: { type: Date, default: Date.now },
          approvedAt: { type: Date },
          status: {
            type: String,
            enum: ['Filed', 'UnderReview', 'Approved', 'Rejected'],
            default: 'Filed',
          },
          filingCost: { type: Number, required: true },
          estimatedValue: { type: Number, default: 0 },
          licensingRevenue: { type: Number, default: 0 },
          citations: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    publications: {
      type: [
        {
          publicationId: { type: String, required: true },
          title: { type: String, required: true },
          authors: { type: [String], required: true },
          venue: {
            type: String,
            enum: ['Conference', 'Journal', 'Workshop', 'Preprint'],
            required: true,
          },
          venueName: { type: String, required: true },
          publishedAt: { type: Date, default: Date.now },
          citations: { type: Number, default: 0 },
          downloads: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'airesearchprojects',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
AIResearchProjectSchema.index({ company: 1, status: 1 });
AIResearchProjectSchema.index({ company: 1, type: 1 });
AIResearchProjectSchema.index({ progress: 1 });

/**
 * Calculate actual performance gain based on research outcomes
 * 
 * Factors affecting gain:
 * - Research type (Performance/Efficiency/NewCapability)
 * - Complexity level (Low/Medium/High)
 * - Researcher skill levels (0.5x to 2x multiplier)
 * - Budget efficiency (overspending reduces gain)
 * - Project completion percentage (partial completion reduces gain)
 * 
 * @param researcherSkills - Array of researcher skill ratings (1-100)
 * @returns Calculated performance gain metrics
 * 
 * @example
 * // High complexity Performance project, 3 skilled researchers (80, 85, 90)
 * project.calculatePerformanceGain([80, 85, 90])
 * // Returns: { accuracy: 18.5, efficiency: 12.3, speed: 11.8, capability: null }
 */
AIResearchProjectSchema.methods.calculatePerformanceGain = function (
  this: IAIResearchProject,
  researcherSkills: number[]
): PerformanceGain {
  // Base gains for project type
  const baseGain = BASE_GAINS[this.type];
  
  // Complexity multiplier
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[this.complexity];
  
  // Researcher skill multiplier (average skill mapped to 0.5-2x range)
  const avgSkill = researcherSkills.reduce((sum, skill) => sum + skill, 0) / researcherSkills.length;
  const skillMultiplier = 0.5 + (avgSkill / 100) * 1.5; // Maps 0-100 skill to 0.5-2.0 multiplier
  
  // Budget efficiency factor (overspending reduces gains)
  const budgetEfficiency = Math.min(1.0, this.budgetAllocated / (this.budgetSpent || 1));
  const budgetFactor = 0.7 + (budgetEfficiency * 0.3); // 0.7-1.0 based on budget use
  
  // Progress completion factor (partial completion reduces gains)
  const progressFactor = this.progress / 100;
  
  // Calculate final multiplier
  const totalMultiplier = complexityMultiplier * skillMultiplier * budgetFactor * progressFactor;
  
  // Apply multiplier to base gains
  const calculatedGain: PerformanceGain = {
    accuracy: Math.min(20, Math.round(baseGain.accuracy * totalMultiplier * 100) / 100),
    efficiency: Math.min(50, Math.round(baseGain.efficiency * totalMultiplier * 100) / 100),
    speed: Math.min(40, Math.round(baseGain.speed * totalMultiplier * 100) / 100),
    capability: this.type === 'NewCapability' && this.progress >= 100 
      ? `${this.name.toLowerCase().replace(/\s+/g, '-')}-capability`
      : null,
  };
  
  return calculatedGain;
};

/**
 * Advance project progress and track costs
 * 
 * @param increment - Progress percentage to add (1-20)
 * @param costIncurred - USD cost for this increment
 * 
 * @throws Error if project is not InProgress
 * @throws Error if budget would be exceeded
 */
AIResearchProjectSchema.methods.advanceProgress = function (
  this: IAIResearchProject,
  increment: number,
  costIncurred: number
): void {
  if (this.status !== 'InProgress') {
    throw new Error(`Cannot advance progress: project status is ${this.status}`);
  }
  
  // Validate budget availability
  if (this.budgetSpent + costIncurred > this.budgetAllocated * 1.1) {
    throw new Error(
      `Budget exceeded: $${this.budgetSpent + costIncurred} > $${this.budgetAllocated * 1.1} (110% limit)`
    );
  }
  
  // Update progress and spending
  this.progress = Math.min(100, this.progress + increment);
  this.budgetSpent += costIncurred;
  
  // Auto-complete if progress reaches 100%
  if (this.progress >= 100) {
    this.status = 'Completed';
    this.completedAt = new Date();
  }
};

/**
 * Cancel research project
 * 
 * Applies 10% penalty to company research points (handled in API route)
 * 
 * @param reason - Reason for cancellation (logged for metrics)
 * 
 * @throws Error if project is already completed or cancelled
 */
AIResearchProjectSchema.methods.cancel = function (
  this: IAIResearchProject,
  _reason: string
): void {
  if (this.status === 'Completed') {
    throw new Error('Cannot cancel completed project');
  }
  
  if (this.status === 'Cancelled') {
    throw new Error('Project is already cancelled');
  }
  
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  
  // Note: 10% research points penalty applied in API route
  // (requires access to Company model)
};

/**
 * Pre-save middleware: Validate status transitions
 */
AIResearchProjectSchema.pre('save', function (next) {
  // Ensure completed projects have completion date
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Ensure cancelled projects have cancellation date
  if (this.status === 'Cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  // Validate budget spending doesn't exceed 110% of allocated
  if (this.budgetSpent > this.budgetAllocated * 1.1) {
    return next(new Error('Budget spending cannot exceed 110% of allocated budget'));
  }
  
  next();
});

// Export model
const AIResearchProject: Model<IAIResearchProject> =
  mongoose.models.AIResearchProject ||
  mongoose.model<IAIResearchProject>('AIResearchProject', AIResearchProjectSchema);

export default AIResearchProject;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PERFORMANCE GAIN CALCULATION:
 *    - Complexity multipliers: Low 0.5x, Medium 1.0x, High 1.8x
 *    - Researcher skills mapped to 0.5-2x multiplier (avg skill / 100 scaled)
 *    - Budget efficiency: 70-100% multiplier based on spending vs allocated
 *    - Progress factor: Partial completion reduces gains proportionally
 * 
 * 2. BUDGET MANAGEMENT:
 *    - Hard limit at 110% of allocated budget (10% overage allowed)
 *    - Overspending reduces final performance gain via budgetFactor
 *    - Budget tracking per progress increment for accurate cost monitoring
 * 
 * 3. PROJECT LIFECYCLE:
 *    - InProgress: Active research with progress increments
 *    - Completed: Progress = 100%, performance gains calculated
 *    - Cancelled: 10% research points penalty (applied in API)
 * 
 * 4. RESEARCHER ASSIGNMENT:
 *    - 1-10 researchers per project (validation enforced)
 *    - Researcher skill level affects final performance gain
 *    - Employee references for tracking and metrics
 * 
 * 5. PERFORMANCE METRICS:
 *    - Accuracy: +0-20% improvement to model accuracy
 *    - Efficiency: +0-50% reduction in training costs
 *    - Speed: +0-40% reduction in inference latency
 *    - Capability: New feature unlock for NewCapability projects
 * 
 * 6. VALIDATION:
 *    - Budget minimum: $1,000 per project
 *    - Progress range: 0-100%
 *    - Researcher count: 1-10 per project
 *    - Budget overage limit: 110% of allocated
 */
