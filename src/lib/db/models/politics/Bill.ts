/**
 * @file src/lib/db/models/politics/Bill.ts
 * @description Bill Mongoose schema for legislative bills tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Bill model representing legislative bills across all levels of government.
 * Tracks bill lifecycle (Drafted → Introduced → In Committee → Floor Debate → 
 * Passed/Failed → Vetoed/Signed), legislative votes, amendments, and impact analysis.
 * Supports bills in categories: Economic, Healthcare, Education, Infrastructure, etc.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - billNumber: Legislative bill identifier (e.g., "H.R. 1234", "S. 567")
 * - title: Bill title/short description
 * - category: Bill subject area (Economic, Healthcare, Education, etc.)
 * - sponsor: Primary sponsor (legislator name)
 * - cosponsors: Array of cosponsor names
 * - introducedDate: Date bill was introduced
 * - status: Bill lifecycle stage (Drafted, Introduced, In Committee, etc.)
 * 
 * Content:
 * - summary: Brief description of bill's purpose and provisions
 * - fullText: Complete bill text (optional, can be long)
 * 
 * Legislative Process:
 * - votes: Array of legislative votes (legislator, party, district, vote)
 * - amendments: Array of amendments (amendment number, sponsor, description, adopted)
 * - expectedImpact: Impact analysis (economic, social, environmental, cost, population, timeframe)
 * 
 * Committee & Action:
 * - committee: Committee assigned to review bill
 * - lastAction: Description of most recent legislative action
 * - lastActionDate: Date of most recent action
 * 
 * IMPLEMENTATION NOTES:
 * - Status flow: Drafted → Introduced → In Committee → Floor Debate → Passed/Failed → Vetoed/Signed
 * - Categories: Economic, Healthcare, Education, Infrastructure, Environment, Defense, Justice, Social, Technology, Other
 * - Votes tracked: Yea, Nay, Abstain, Present, Absent (legislator name, party, district, vote type)
 * - Amendments: Track amendment number, sponsor, description, adoption status
 * - Impact: Economic impact, social impact, environmental impact, estimated cost, affected population, implementation timeframe
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  BillStatus,
  BillCategory,
  VoteType,
  PoliticalParty,
} from '@/types/politics';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Legislative vote interface
 */
export interface LegislativeVote {
  legislatorName: string;
  party: PoliticalParty;
  district: string;
  vote: VoteType;
}

/**
 * Bill amendment interface
 */
export interface BillAmendment {
  amendmentNumber: string;
  sponsor: string;
  description: string;
  adoptedDate?: Date;
  adopted: boolean;
}

/**
 * Bill impact interface
 */
export interface BillImpact {
  economicImpact: number;
  socialImpact: number;
  environmentalImpact: number;
  estimatedCost?: number;
  affectedPopulation?: number;
  implementationTimeframe?: string;
}

/**
 * Bill document interface
 */
export interface IBill extends Document {
  // Core
  company: Types.ObjectId;
  billNumber: string;
  title: string;
  category: BillCategory;
  sponsor: string;
  cosponsors: string[];
  introducedDate: Date;
  status: BillStatus;

  // Content
  summary: string;
  fullText?: string;

  // Legislative Process
  votes: LegislativeVote[];
  amendments: BillAmendment[];
  expectedImpact?: BillImpact;

  // Committee & Action
  committee?: string;
  lastAction?: string;
  lastActionDate?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  totalVotes: number;
  yeaVotes: number;
  nayVotes: number;
  supportPercentage: number;
  isPassed: boolean;
  isSigned: boolean;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Legislative vote sub-schema
 */
const LegislativeVoteSchema = new Schema<LegislativeVote>(
  {
    legislatorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Legislator name cannot exceed 100 characters'],
    },
    party: {
      type: String,
      required: true,
      enum: {
        values: Object.values(PoliticalParty),
        message: '{VALUE} is not a valid political party',
      },
    },
    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'District cannot exceed 50 characters'],
    },
    vote: {
      type: String,
      required: true,
      enum: {
        values: Object.values(VoteType),
        message: '{VALUE} is not a valid vote type',
      },
    },
  },
  { _id: false }
);

/**
 * Bill amendment sub-schema
 */
const BillAmendmentSchema = new Schema<BillAmendment>(
  {
    amendmentNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Amendment number cannot exceed 50 characters'],
    },
    sponsor: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Sponsor name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    adoptedDate: {
      type: Date,
    },
    adopted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Bill impact sub-schema
 */
const BillImpactSchema = new Schema<BillImpact>(
  {
    economicImpact: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Economic impact cannot be negative'],
      max: [10, 'Economic impact cannot exceed 10'],
    },
    socialImpact: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Social impact cannot be negative'],
      max: [10, 'Social impact cannot exceed 10'],
    },
    environmentalImpact: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Environmental impact cannot be negative'],
      max: [10, 'Environmental impact cannot exceed 10'],
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
    },
    affectedPopulation: {
      type: Number,
      min: [0, 'Affected population cannot be negative'],
    },
    implementationTimeframe: {
      type: String,
      trim: true,
      maxlength: [100, 'Implementation timeframe cannot exceed 100 characters'],
    },
  },
  { _id: false }
);

/**
 * Bill schema definition
 */
const BillSchema = new Schema<IBill>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    billNumber: {
      type: String,
      required: [true, 'Bill number is required'],
      trim: true,
      minlength: [2, 'Bill number must be at least 2 characters'],
      maxlength: [50, 'Bill number cannot exceed 50 characters'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(BillCategory),
        message: '{VALUE} is not a valid bill category',
      },
      index: true,
    },
    sponsor: {
      type: String,
      required: [true, 'Sponsor is required'],
      trim: true,
      minlength: [2, 'Sponsor name must be at least 2 characters'],
      maxlength: [100, 'Sponsor name cannot exceed 100 characters'],
    },
    cosponsors: {
      type: [String],
      default: [],
    },
    introducedDate: {
      type: Date,
      required: [true, 'Introduced date is required'],
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(BillStatus),
        message: '{VALUE} is not a valid bill status',
      },
      default: BillStatus.DRAFTED,
      index: true,
    },

    // Content
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      minlength: [10, 'Summary must be at least 10 characters'],
      maxlength: [5000, 'Summary cannot exceed 5000 characters'],
    },
    fullText: {
      type: String,
      trim: true,
      maxlength: [50000, 'Full text cannot exceed 50000 characters'],
    },

    // Legislative Process
    votes: {
      type: [LegislativeVoteSchema],
      default: [],
    },
    amendments: {
      type: [BillAmendmentSchema],
      default: [],
    },
    expectedImpact: {
      type: BillImpactSchema,
    },

    // Committee & Action
    committee: {
      type: String,
      trim: true,
      maxlength: [200, 'Committee name cannot exceed 200 characters'],
    },
    lastAction: {
      type: String,
      trim: true,
      maxlength: [500, 'Last action description cannot exceed 500 characters'],
    },
    lastActionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'bills',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

BillSchema.index({ company: 1, status: 1 });
BillSchema.index({ company: 1, category: 1 });
BillSchema.index({ sponsor: 1, status: 1 });
BillSchema.index({ introducedDate: -1 });
BillSchema.index({ billNumber: 1, company: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: totalVotes
 */
BillSchema.virtual('totalVotes').get(function (this: IBill): number {
  return this.votes.length;
});

/**
 * Virtual: yeaVotes
 */
BillSchema.virtual('yeaVotes').get(function (this: IBill): number {
  return this.votes.filter((v) => v.vote === VoteType.YEA).length;
});

/**
 * Virtual: nayVotes
 */
BillSchema.virtual('nayVotes').get(function (this: IBill): number {
  return this.votes.filter((v) => v.vote === VoteType.NAY).length;
});

/**
 * Virtual: supportPercentage
 */
BillSchema.virtual('supportPercentage').get(function (this: IBill): number {
  const yeaCount = this.yeaVotes;
  const nayCount = this.nayVotes;
  const totalRelevant = yeaCount + nayCount;
  
  if (totalRelevant === 0) return 0;
  return (yeaCount / totalRelevant) * 100;
});

/**
 * Virtual: isPassed
 */
BillSchema.virtual('isPassed').get(function (this: IBill): boolean {
  return (
    this.status === BillStatus.PASSED_HOUSE ||
    this.status === BillStatus.PASSED_SENATE ||
    this.status === BillStatus.SIGNED
  );
});

/**
 * Virtual: isSigned
 */
BillSchema.virtual('isSigned').get(function (this: IBill): boolean {
  return this.status === BillStatus.SIGNED;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Add a vote to the bill
 */
BillSchema.methods.addVote = function (this: IBill, vote: LegislativeVote): void {
  this.votes.push(vote);
};

/**
 * Add an amendment to the bill
 */
BillSchema.methods.addAmendment = function (this: IBill, amendment: BillAmendment): void {
  this.amendments.push(amendment);
};

/**
 * Update bill status and last action
 */
BillSchema.methods.updateStatus = function (
  this: IBill,
  status: BillStatus,
  action: string
): void {
  this.status = status;
  this.lastAction = action;
  this.lastActionDate = new Date();
};

/**
 * Calculate vote support level
 */
BillSchema.methods.calculateSupport = function (this: IBill): number {
  return this.supportPercentage;
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Update last action date
 */
BillSchema.pre<IBill>('save', function (next) {
  // Update last action date if status changed
  if (this.isModified('status') && !this.lastActionDate) {
    this.lastActionDate = new Date();
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
