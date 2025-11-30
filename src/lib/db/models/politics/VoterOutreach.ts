/**
 * @file src/lib/db/models/politics/VoterOutreach.ts
 * @description VoterOutreach Mongoose schema for political voter outreach tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * VoterOutreach model representing voter engagement activities for political campaigns.
 * Tracks outreach methods (Door-to-Door, Phone Banking, Digital Ads, Direct Mail, etc.),
 * targeting, effectiveness metrics, costs, and engagement results. Supports campaigns
 * at all levels of government with comprehensive outreach activity tracking.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - campaign: Reference to Campaign document (required, indexed)
 * - outreachType: Method (Door-to-Door, Phone Banking, Digital Ads, Direct Mail, Text Banking, Social Media, Town Hall, Other)
 * - targetAudience: Demographic or geographic target (e.g., "Voters 18-34", "District 5 Residents")
 * - startDate: Outreach activity start date
 * - endDate: Outreach activity end date
 * - status: Activity status (Planned, Active, Completed, Cancelled)
 * 
 * Metrics:
 * - votersContacted: Number of voters successfully reached
 * - votersPledged: Number of voters who pledged support
 * - cost: Total cost of outreach activity ($)
 * - volunteersInvolved: Number of volunteers participating
 * 
 * Effectiveness:
 * - effectivenessScore: Calculated effectiveness rating (0-100)
 *   Based on pledge rate, contact rate, cost per contact, engagement
 * - notes: Internal notes about activity results and learnings
 * 
 * IMPLEMENTATION NOTES:
 * - Outreach types: Door-to-Door, Phone Banking, Digital Ads, Direct Mail, Text Banking, Social Media, Town Hall, Other
 * - Status flow: Planned → Active → Completed (or Cancelled)
 * - Effectiveness calculated as: (pledged/contacted) * 100 if contacted > 0
 * - Cost per contact: cost / votersContacted (if votersContacted > 0)
 * - Pledge rate: (votersPledged / votersContacted) * 100 (conversion rate)
 * - All metrics default to 0 and cannot be negative
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * VoterOutreach document interface
 */
export interface IVoterOutreach extends Document {
  // Core
  company: Types.ObjectId;
  campaign: Types.ObjectId;
  outreachType: string;
  targetAudience: string;
  startDate: Date;
  endDate?: Date;
  status: string;

  // Metrics
  votersContacted: number;
  votersPledged: number;
  cost: number;
  volunteersInvolved: number;

  // Effectiveness
  effectivenessScore: number;
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  pledgeRate: number;
  costPerContact: number;
  contactRate: number;
  isActive: boolean;
  // Method signatures for TypeScript awareness
  updateMetrics(contacted: number, pledged: number): void;
  calculateEffectiveness(): number;
  complete(): void;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * VoterOutreach schema definition
 */
const VoterOutreachSchema = new Schema<IVoterOutreach>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign reference is required'],
      index: true,
    },
    outreachType: {
      type: String,
      required: [true, 'Outreach type is required'],
      index: true,
    },
    targetAudience: {
      type: String,
      required: [true, 'Target audience is required'],
      trim: true,
      minlength: [2, 'Target audience must be at least 2 characters'],
      maxlength: [200, 'Target audience cannot exceed 200 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: 'PLANNED',
      index: true,
    },

    // Metrics
    votersContacted: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Voters contacted cannot be negative'],
    },
    votersPledged: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Voters pledged cannot be negative'],
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    volunteersInvolved: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Volunteers involved cannot be negative'],
    },

    // Effectiveness
    effectivenessScore: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Effectiveness score cannot be negative'],
      max: [100, 'Effectiveness score cannot exceed 100'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'voteroutreach',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

VoterOutreachSchema.index({ company: 1, campaign: 1 });
VoterOutreachSchema.index({ company: 1, status: 1 });
VoterOutreachSchema.index({ campaign: 1, outreachType: 1 });
VoterOutreachSchema.index({ startDate: -1 });
VoterOutreachSchema.index({ effectivenessScore: -1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: pledgeRate
 */
VoterOutreachSchema.virtual('pledgeRate').get(function (this: IVoterOutreach): number {
  if (this.votersContacted === 0) return 0;
  return (this.votersPledged / this.votersContacted) * 100;
});

/**
 * Virtual: costPerContact
 */
VoterOutreachSchema.virtual('costPerContact').get(function (this: IVoterOutreach): number {
  if (this.votersContacted === 0) return 0;
  return this.cost / this.votersContacted;
});

/**
 * Virtual: contactRate
 */
VoterOutreachSchema.virtual('contactRate').get(function (this: IVoterOutreach): number {
  // If target audience size was tracked, could calculate contact rate
  // For now, return pledgeRate as proxy for effectiveness
  return this.pledgeRate;
});

/**
 * Virtual: isActive
 */
VoterOutreachSchema.virtual('isActive').get(function (this: IVoterOutreach): boolean {
  return this.status === 'ACTIVE';
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Update contact metrics
 */
VoterOutreachSchema.methods.updateMetrics = function (
  this: IVoterOutreach,
  contacted: number,
  pledged: number
): void {
  this.votersContacted = Math.max(0, contacted);
  this.votersPledged = Math.max(0, Math.min(pledged, contacted)); // Pledged can't exceed contacted
  
  // Recalculate effectiveness
  this.calculateEffectiveness();
};

/**
 * Calculate effectiveness score
 */
VoterOutreachSchema.methods.calculateEffectiveness = function (this: IVoterOutreach): number {
  if (this.votersContacted === 0) {
    this.effectivenessScore = 0;
    return 0;
  }

  // Effectiveness based on pledge rate
  const pledgeRate = this.pledgeRate;
  
  // Bonus for high contact volume (diminishing returns)
  const volumeBonus = Math.min(10, Math.log10(this.votersContacted + 1) * 2);
  
  // Penalty for high cost per contact (if cost > $5 per contact)
  const costPenalty = this.costPerContact > 5 ? Math.min(10, (this.costPerContact - 5) / 2) : 0;
  
  // Calculate final score
  const score = Math.max(0, Math.min(100, pledgeRate + volumeBonus - costPenalty));
  
  this.effectivenessScore = score;
  return score;
};

/**
 * Complete outreach activity
 */
VoterOutreachSchema.methods.complete = function (this: IVoterOutreach): void {
  this.status = 'COMPLETED';
  this.endDate = new Date();
  this.calculateEffectiveness();
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Validate pledged <= contacted, calculate effectiveness
 */
VoterOutreachSchema.pre<IVoterOutreach>('save', function (next) {
  // Ensure pledged doesn't exceed contacted
  if (this.votersPledged > this.votersContacted) {
    this.votersPledged = this.votersContacted;
  }

  // Auto-calculate effectiveness if metrics changed
  if (this.isModified('votersContacted') || this.isModified('votersPledged') || this.isModified('cost')) {
    this.calculateEffectiveness();
  }

  // Auto-complete if end date has passed
  if (this.endDate && new Date(this.endDate) < new Date() && this.status !== 'COMPLETED') {
    this.status = 'COMPLETED';
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const VoterOutreach: Model<IVoterOutreach> =
  mongoose.models.VoterOutreach || mongoose.model<IVoterOutreach>('VoterOutreach', VoterOutreachSchema);

export default VoterOutreach;
