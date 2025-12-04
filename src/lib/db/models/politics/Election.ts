/**
 * @file src/lib/db/models/politics/Election.ts
 * @description Election Mongoose schema for political elections tracking
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Election model representing political elections across all levels of government.
 * Tracks election lifecycle (Scheduled → Active → Completed → Certified), candidates,
 * voting results, turnout rates, and winner determination. Supports Primary, General,
 * Special, Runoff, and Recall elections for offices from President to local positions.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - electionType: Category (Primary, General, Special, Runoff, Recall)
 * - office: Position being contested (President, Senator, Governor, Mayor, etc.)
 * - electionDate: Scheduled election date
 * - district: Geographic district/jurisdiction (optional for statewide/national)
 * - registeredVoters: Total registered voters eligible to vote
 * 
 * Candidates:
 * - candidates: Array of candidates with vote totals and percentages
 *   Each includes: name, party, votes, votePercentage, incumbent status, endorsements
 * 
 * Status & Results:
 * - status: Election stage (Scheduled, Registration Open, Active, Completed, Certified, Cancelled)
 * - results: Final results including total votes, turnout, winner, margin
 *   Includes: totalVotes, turnoutRate, winner, winnerParty, margin, marginPercentage
 * 
 * IMPLEMENTATION NOTES:
 * - Election types: Primary (party nominees), General (final election), Special (fill vacancy),
 *   Runoff (no majority winner), Recall (remove incumbent)
 * - Offices: President, Senator, Representative, Governor, Mayor, and Other local positions
 * - Status flow: Scheduled → Registration Open → Active → Completed → Certified
 * - Results calculated from candidate vote totals, winner determined by highest votes
 * - Turnout rate: (totalVotes / registeredVoters) * 100
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  ElectionType,
  PoliticalOffice,
  ElectionStatus,
  PoliticalParty,
} from '@/types/politics';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Election candidate interface
 */
export interface ElectionCandidate {
  playerId: string;
  candidateName: string;
  party: PoliticalParty;
  votes: number;
  votePercentage: number;
  incumbent: boolean;
  endorsements: string[];
  campaignWebsite?: string;
}

/**
 * Election results interface
 */
export interface ElectionResults {
  totalVotes: number;
  turnoutRate: number;
  winnerId: string;
  winnerName: string;
  winnerParty: PoliticalParty;
  margin: number;
  marginPercentage: number;
}

/**
 * Election document interface
 */
export interface IElection extends Document {
  // Core
  company: Types.ObjectId;
  electionType: ElectionType;
  office: PoliticalOffice;
  electionDate: Date;
  district?: string;
  registeredVoters: number;

  // Candidates
  candidates: ElectionCandidate[];

  // Status & Results
  status: ElectionStatus;
  results?: ElectionResults;

  // Additional Info
  description?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  daysUntilElection: number;
  isCompleted: boolean;
  isCertified: boolean;
  hasResults: boolean;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Election candidate sub-schema
 */
const ElectionCandidateSchema = new Schema<ElectionCandidate>(
  {
    playerId: {
      type: String,
      required: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Candidate name must be at least 2 characters'],
      maxlength: [100, 'Candidate name cannot exceed 100 characters'],
    },
    party: {
      type: String,
      required: true,
      enum: {
        values: Object.values(PoliticalParty),
        message: '{VALUE} is not a valid political party',
      },
    },
    votes: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Votes cannot be negative'],
    },
    votePercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Vote percentage cannot be negative'],
      max: [100, 'Vote percentage cannot exceed 100%'],
    },
    incumbent: {
      type: Boolean,
      required: true,
      default: false,
    },
    endorsements: {
      type: [String],
      default: [],
    },
    campaignWebsite: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Election results sub-schema
 */
const ElectionResultsSchema = new Schema<ElectionResults>(
  {
    totalVotes: {
      type: Number,
      required: true,
      min: [0, 'Total votes cannot be negative'],
    },
    turnoutRate: {
      type: Number,
      required: true,
      min: [0, 'Turnout rate cannot be negative'],
      max: [100, 'Turnout rate cannot exceed 100%'],
    },
    winnerId: {
      type: String,
      required: true,
      index: true,
    },
    winnerName: {
      type: String,
      required: true,
      trim: true,
    },
    winnerParty: {
      type: String,
      required: true,
      enum: {
        values: Object.values(PoliticalParty),
        message: '{VALUE} is not a valid political party',
      },
    },
    margin: {
      type: Number,
      required: true,
      min: [0, 'Margin cannot be negative'],
    },
    marginPercentage: {
      type: Number,
      required: true,
      min: [0, 'Margin percentage cannot be negative'],
      max: [100, 'Margin percentage cannot exceed 100%'],
    },
  },
  { _id: false }
);

/**
 * Election schema definition
 */
const ElectionSchema = new Schema<IElection>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    electionType: {
      type: String,
      required: [true, 'Election type is required'],
      enum: {
        values: Object.values(ElectionType),
        message: '{VALUE} is not a valid election type',
      },
      index: true,
    },
    office: {
      type: String,
      required: [true, 'Office is required'],
      enum: {
        values: Object.values(PoliticalOffice),
        message: '{VALUE} is not a valid political office',
      },
      index: true,
    },
    electionDate: {
      type: Date,
      required: [true, 'Election date is required'],
      index: true,
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District name cannot exceed 100 characters'],
    },
    registeredVoters: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Registered voters cannot be negative'],
    },

    // Candidates
    candidates: {
      type: [ElectionCandidateSchema],
      required: true,
      default: [],
      validate: {
        validator: function (v: ElectionCandidate[]) {
          return v.length >= 1;
        },
        message: 'At least one candidate is required',
      },
    },

    // Status & Results
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ElectionStatus),
        message: '{VALUE} is not a valid election status',
      },
      default: ElectionStatus.SCHEDULED,
      index: true,
    },
    results: {
      type: ElectionResultsSchema,
    },

    // Additional Info
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'elections',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

ElectionSchema.index({ company: 1, electionDate: -1 });
ElectionSchema.index({ company: 1, status: 1 });
ElectionSchema.index({ company: 1, office: 1 });
ElectionSchema.index({ company: 1, electionType: 1, status: 1 });
ElectionSchema.index({ district: 1, electionDate: -1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

/**
 * Virtual: daysUntilElection
 */
ElectionSchema.virtual('daysUntilElection').get(function (this: IElection): number {
  const now = new Date();
  const electionDate = new Date(this.electionDate);
  const diffTime = electionDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual: isCompleted
 */
ElectionSchema.virtual('isCompleted').get(function (this: IElection): boolean {
  return this.status === ElectionStatus.COMPLETED || this.status === ElectionStatus.CERTIFIED;
});

/**
 * Virtual: isCertified
 */
ElectionSchema.virtual('isCertified').get(function (this: IElection): boolean {
  return this.status === ElectionStatus.CERTIFIED;
});

/**
 * Virtual: hasResults
 */
ElectionSchema.virtual('hasResults').get(function (this: IElection): boolean {
  return !!this.results;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Add a candidate to the election
 */
ElectionSchema.methods.addCandidate = function (
  this: IElection,
  candidate: ElectionCandidate
): void {
  this.candidates.push(candidate);
};

/**
 * Remove a candidate from the election
 */
ElectionSchema.methods.removeCandidate = function (
  this: IElection,
  playerId: string
): void {
  this.candidates = this.candidates.filter((c) => c.playerId !== playerId);
};

/**
 * Calculate turnout rate
 */
ElectionSchema.methods.calculateTurnout = function (this: IElection): number {
  if (this.registeredVoters === 0) return 0;
  const totalVotes = this.candidates.reduce((sum, c) => sum + c.votes, 0);
  return (totalVotes / this.registeredVoters) * 100;
};

/**
 * Certify election results
 */
ElectionSchema.methods.certifyResults = function (
  this: IElection,
  results: ElectionResults
): void {
  this.results = results;
  this.status = ElectionStatus.CERTIFIED;
};

/**
 * Update vote totals and percentages
 */
ElectionSchema.methods.updateVoteTotals = function (this: IElection): void {
  const totalVotes = this.candidates.reduce((sum, c) => sum + c.votes, 0);
  
  if (totalVotes > 0) {
    this.candidates.forEach((candidate) => {
      candidate.votePercentage = (candidate.votes / totalVotes) * 100;
    });
  }
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Pre-save hook: Calculate vote percentages, update results
 */
ElectionSchema.pre<IElection>('save', function (next) {
  // Calculate vote percentages
  const totalVotes = this.candidates.reduce((sum, c) => sum + c.votes, 0);
  
  if (totalVotes > 0) {
    this.candidates.forEach((candidate) => {
      candidate.votePercentage = (candidate.votes / totalVotes) * 100;
    });
  }

  // Auto-generate results if status is Completed or Certified
  if (
    (this.status === ElectionStatus.COMPLETED || this.status === ElectionStatus.CERTIFIED) &&
    this.candidates.length > 0 &&
    totalVotes > 0
  ) {
    // Find winner (candidate with most votes)
    const winner = this.candidates.reduce((prev, current) =>
      current.votes > prev.votes ? current : prev
    );

    // Find second place
    const secondPlace = this.candidates
      .filter((c) => c.playerId !== winner.playerId)
      .reduce((prev, current) => (current.votes > prev.votes ? current : prev), this.candidates[0]);

    // Calculate margin
    const margin = winner.votes - (secondPlace ? secondPlace.votes : 0);
    const marginPercentage = totalVotes > 0 ? (margin / totalVotes) * 100 : 0;

    // Calculate turnout rate
    const turnoutRate = this.registeredVoters > 0 
      ? (totalVotes / this.registeredVoters) * 100 
      : 0;

    // Set results if not already set
    if (!this.results) {
      this.results = {
        totalVotes,
        turnoutRate,
        winnerId: winner.playerId,
        winnerName: winner.candidateName,
        winnerParty: winner.party,
        margin,
        marginPercentage,
      };
    }
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Election: Model<IElection> =
  mongoose.models.Election || mongoose.model<IElection>('Election', ElectionSchema);

export default Election;
