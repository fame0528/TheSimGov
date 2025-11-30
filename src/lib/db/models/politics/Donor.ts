/**
 * @file src/lib/db/models/politics/Donor.ts
 * @description Donor Mongoose schema for political campaign donor tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Donor model representing individuals and organizations that contribute to political campaigns.
 * Tracks donor information, contribution history, compliance limits, contact details, and engagement.
 * Supports individual donors, PACs, corporate entities, and other donor types with FEC compliance tracking.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - donorName: Full name of donor (individual or organization)
 * - donorType: Category (Individual, PAC, Corporate, Labor Union, Non-Profit, Other)
 * - campaign: Reference to Campaign document this donor supports
 * - totalContributed: Lifetime contribution amount to this campaign
 * - lastContributionDate: Date of most recent contribution
 * - complianceLimit: Maximum allowed contribution under election law
 * - isMaxedOut: Whether donor has reached contribution limit
 * 
 * Contact Information:
 * - contact: Sub-document with email, phone, address, city, state, zip
 * 
 * Engagement:
 * - occupation: Donor's occupation (required for individuals)
 * - employer: Donor's employer (required for individuals)
 * - volunteer: Whether donor is also a campaign volunteer
 * - endorsement: Whether donor has publicly endorsed the candidate
 * 
 * Notes:
 * - notes: Internal notes about donor (interests, relationships, etc.)
 * 
 * IMPLEMENTATION NOTES:
 * - Donor types: Individual, PAC, Corporate, Labor Union, Non-Profit, Other
 * - Compliance limits vary by donor type and jurisdiction (federal/state/local)
 * - Individual donors require occupation and employer for FEC compliance
 * - isMaxedOut automatically calculated when totalContributed >= complianceLimit
 * - Contact information stored in sub-document for clean organization
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { DonorType } from '@/types/politics';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Donor contact interface
 */
export interface DonorContact {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Donor document interface
 */
export interface IDonor extends Document {
  // Core
  company: Types.ObjectId;
  donorName: string;
  donorType: DonorType;
  campaign: Types.ObjectId;
  totalContributed: number;
  lastContributionDate?: Date;
  complianceLimit: number;
  /** Alias used by routes */
  maxContribution?: number;
  isMaxedOut: boolean;

  // Contact Information
  contact?: DonorContact;

  // Engagement
  occupation?: string;
  employer?: string;
  volunteer: boolean;
  endorsement: boolean;

  // Notes
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  remainingContributionCapacity: number;
  /** Alias used by routes */
  remainingCapacity?: number;
  contributionPercentage: number;

  // Aggregates for fundraising routes
  thisElectionCycle?: number;
  contributionCount?: number;
  averageContribution?: number;

  // Contributions history
  contributions?: Array<{
    amount: number;
    date: Date;
    type?: string;
  }>;

  // Bundler-related fields
  isBundler?: boolean;
  bundledAmount?: number;
  bundlerNetwork?: Array<string>;

  // Preferences
  preferredParty?: string;
  issueInterests?: Array<string>;
  preferredContact?: string;
  optedOut?: boolean;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Donor contact sub-schema
 */
const DonorContactSchema = new Schema<DonorContact>(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [2, 'State must be 2-letter code'],
    },
    zip: {
      type: String,
      trim: true,
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'],
    },
  },
  { _id: false }
);

/**
 * Donor schema definition
 */
const DonorSchema = new Schema<IDonor>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
      minlength: [2, 'Donor name must be at least 2 characters'],
      maxlength: [200, 'Donor name cannot exceed 200 characters'],
      index: true,
    },
    donorType: {
      type: String,
      required: [true, 'Donor type is required'],
      enum: {
        values: Object.values(DonorType),
        message: '{VALUE} is not a valid donor type',
      },
      index: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign reference is required'],
      index: true,
    },
    totalContributed: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total contributed cannot be negative'],
    },
    lastContributionDate: {
      type: Date,
    },
    complianceLimit: {
      type: Number,
      required: true,
      default: 3300, // Federal individual limit per election cycle (2024)
      min: [0, 'Compliance limit cannot be negative'],
    },
    // Optional alias used by some routes
    maxContribution: {
      type: Number,
      default: undefined,
    },
    isMaxedOut: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    // Contact Information
    contact: {
      type: DonorContactSchema,
    },

    // Engagement
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },
    employer: {
      type: String,
      trim: true,
      maxlength: [100, 'Employer cannot exceed 100 characters'],
    },
    volunteer: {
      type: Boolean,
      required: true,
      default: false,
    },
    endorsement: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },

    // Fundraising aggregates
    thisElectionCycle: { type: Number, default: 0 },
    contributionCount: { type: Number, default: 0 },
    averageContribution: { type: Number, default: 0 },

    // Contributions history
    contributions: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
        type: { type: String },
      },
    ],

    // Bundler-related fields
    isBundler: { type: Boolean, default: false },
    bundledAmount: { type: Number, default: 0 },
    bundlerNetwork: { type: [String], default: [] },

    // Preferences
    preferredParty: { type: String },
    issueInterests: { type: [String], default: [] },
    preferredContact: { type: String },
    optedOut: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'donors',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

DonorSchema.index({ company: 1, campaign: 1 });
DonorSchema.index({ company: 1, donorType: 1 });
DonorSchema.index({ campaign: 1, totalContributed: -1 });
DonorSchema.index({ lastContributionDate: -1 });
DonorSchema.index({ isMaxedOut: 1, campaign: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: remainingContributionCapacity
 */
DonorSchema.virtual('remainingContributionCapacity').get(function (this: IDonor): number {
  return Math.max(0, this.complianceLimit - this.totalContributed);
});

/**
 * Virtual: contributionPercentage
 */
DonorSchema.virtual('contributionPercentage').get(function (this: IDonor): number {
  if (this.complianceLimit === 0) return 0;
  return (this.totalContributed / this.complianceLimit) * 100;
});

// Alias virtuals for route expectations
DonorSchema.virtual('remainingCapacity').get(function (this: IDonor): number {
  return Math.max(0, (this.maxContribution ?? this.complianceLimit) - (this.thisElectionCycle ?? this.totalContributed));
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Record a new contribution
 */
DonorSchema.methods.recordContribution = function (this: IDonor, amount: number): boolean {
  if (amount <= 0) return false;
  if (this.totalContributed + amount > this.complianceLimit) return false;

  this.totalContributed += amount;
  this.lastContributionDate = new Date();
  this.isMaxedOut = this.totalContributed >= this.complianceLimit;
  
  return true;
};

/**
 * Check if donor can contribute more
 */
DonorSchema.methods.canContribute = function (this: IDonor, amount: number): boolean {
  return this.totalContributed + amount <= this.complianceLimit;
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Update isMaxedOut status, validate Individual donor requirements
 */
DonorSchema.pre<IDonor>('save', function (next) {
  // Update maxed out status
  this.isMaxedOut = this.totalContributed >= this.complianceLimit;

  // Validate Individual donors have occupation and employer (FEC requirement)
  if (this.donorType === DonorType.INDIVIDUAL && this.totalContributed > 200) {
    if (!this.occupation || !this.employer) {
      const error = new Error(
        'Individual donors contributing over $200 must provide occupation and employer'
      );
      return next(error);
    }
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Donor: Model<IDonor> =
  mongoose.models.Donor || mongoose.model<IDonor>('Donor', DonorSchema);

export default Donor;
