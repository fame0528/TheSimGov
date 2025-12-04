/**
 * @fileoverview Leadership Election Mongoose Model
 * @module lib/db/models/politics/LeadershipElection
 * 
 * OVERVIEW:
 * Mongoose model for internal leadership elections within player organizations
 * (Lobbies and Parties). Handles officer elections, board elections, recalls,
 * and votes of confidence.
 * 
 * FEATURES:
 * - Unified model for both Lobby and Party organizations
 * - Candidate management with endorsements
 * - Multiple voting systems (single, approval, ranked, yes/no)
 * - Quorum and threshold enforcement
 * - Runoff election support
 * - Recall petition tracking
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  OrganizationType,
  LeadershipElectionType,
  LeadershipElectionStatus,
  LeadershipPosition,
  VoteType,
  YesNoChoice,
  DEFAULT_ELECTION_SETTINGS,
} from '@/lib/types/leadership';
import type {
  LeadershipElection,
  LeadershipCandidate,
  LeadershipVote,
  LeadershipElectionResults,
  LeadershipElectionSummary,
} from '@/lib/types/leadership';

// ===================== DOCUMENT INTERFACE =====================

export interface ILeadershipElectionDocument extends Omit<LeadershipElection, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  
  // Virtuals
  readonly isFilingOpen: boolean;
  readonly isVotingOpen: boolean;
  readonly currentTurnout: number;
  
  // Instance methods
  canVote(playerId: string, memberStanding: number, memberTenureDays: number): boolean;
  canRun(playerId: string, memberStanding: number, memberTenureDays: number): boolean;
  hasVoted(playerId: string): boolean;
  getCandidateById(playerId: string): LeadershipCandidate | undefined;
  toSummary(): LeadershipElectionSummary;
}

// ===================== STATIC INTERFACE =====================

export interface ILeadershipElectionModel extends Model<ILeadershipElectionDocument> {
  findByOrganization(
    orgType: OrganizationType,
    orgId: string,
    options?: { includeCompleted?: boolean; limit?: number }
  ): Promise<ILeadershipElectionDocument[]>;
  
  findActiveElections(
    orgType?: OrganizationType,
    orgId?: string
  ): Promise<ILeadershipElectionDocument[]>;
  
  findUpcoming(
    days: number,
    orgType?: OrganizationType
  ): Promise<ILeadershipElectionDocument[]>;
}

// ===================== SUB-SCHEMAS =====================

/**
 * Leadership Candidate Sub-Schema
 */
const LeadershipCandidateSchema = new Schema<LeadershipCandidate>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    position: { 
      type: String, 
      enum: Object.values(LeadershipPosition),
      required: true,
    },
    platform: { type: String, maxlength: 1000, default: '' },
    endorsements: [{ type: String }],
    filedAt: { type: Number, required: true },
    withdrew: { type: Boolean, default: false },
    withdrewAt: { type: Number },
    votesReceived: { type: Number, default: 0 },
    votePercentage: { type: Number, default: 0 },
    finalRank: { type: Number },
  },
  { _id: false }
);

/**
 * Leadership Vote Sub-Schema
 */
const LeadershipVoteSchema = new Schema<LeadershipVote>(
  {
    voterId: { type: String, required: true },
    votedAt: { type: Number, required: true },
    choice: { type: String },
    approvedCandidates: [{ type: String }],
    rankedChoices: [{ type: String }],
    yesNoChoice: { 
      type: String, 
      enum: Object.values(YesNoChoice),
    },
    verified: { type: Boolean, default: true },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

/**
 * Election Results Sub-Schema
 */
const ElectionResultsSchema = new Schema<LeadershipElectionResults>(
  {
    eligibleVoters: { type: Number, required: true },
    totalVotesCast: { type: Number, required: true },
    turnoutPercentage: { type: Number, required: true },
    quorumMet: { type: Boolean, required: true },
    winnerId: { type: String },
    winnerName: { type: String },
    winners: [{
      playerId: { type: String, required: true },
      displayName: { type: String, required: true },
      votes: { type: Number, required: true },
    }],
    yesPercentage: { type: Number },
    passed: { type: Boolean },
    runoffRequired: { type: Boolean, default: false },
    runoffCandidates: [{ type: String }],
    certifiedAt: { type: Number },
    certifiedBy: { type: String },
  },
  { _id: false }
);

// ===================== MAIN SCHEMA =====================

const LeadershipElectionSchema = new Schema<ILeadershipElectionDocument>(
  {
    // Organization
    organizationType: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    
    // Election Type
    electionType: {
      type: String,
      enum: Object.values(LeadershipElectionType),
      required: true,
      index: true,
    },
    positions: [{
      type: String,
      enum: Object.values(LeadershipPosition),
    }],
    seatsAvailable: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.seatsAvailable,
      min: 1,
    },
    voteType: {
      type: String,
      enum: Object.values(VoteType),
      default: DEFAULT_ELECTION_SETTINGS.voteType,
    },
    
    // Status
    status: {
      type: String,
      enum: Object.values(LeadershipElectionStatus),
      default: LeadershipElectionStatus.SCHEDULED,
      index: true,
    },
    
    // Info
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    
    // Timing
    filingStart: { type: Number, required: true },
    filingEnd: { type: Number, required: true },
    votingStart: { type: Number, required: true, index: true },
    votingEnd: { type: Number, required: true, index: true },
    
    // Rules
    quorumPercentage: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.quorumPercentage,
      min: 0,
      max: 100,
    },
    winThreshold: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.winThreshold,
      min: 0,
      max: 100,
    },
    allowRunoff: {
      type: Boolean,
      default: DEFAULT_ELECTION_SETTINGS.allowRunoff,
    },
    anonymousVoting: {
      type: Boolean,
      default: DEFAULT_ELECTION_SETTINGS.anonymousVoting,
    },
    minimumStandingToVote: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.minimumStandingToVote,
    },
    minimumTenureToVote: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.minimumTenureToVote,
    },
    minimumStandingToRun: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.minimumStandingToRun,
    },
    minimumTenureToRun: {
      type: Number,
      default: DEFAULT_ELECTION_SETTINGS.minimumTenureToRun,
    },
    
    // Participants
    candidates: [LeadershipCandidateSchema],
    votes: [LeadershipVoteSchema],
    eligibleVoterIds: [{ type: String }],
    votedIds: [{ type: String }],
    
    // Results
    results: ElectionResultsSchema,
    
    // Recall-specific
    recallTargetId: { type: String },
    recallReason: { type: String, maxlength: 1000 },
    recallSignatures: [{ type: String }],
    recallSignaturesRequired: { type: Number },
    
    // Metadata
    createdBy: { type: String, required: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
    parentElectionId: { type: String },
  },
  {
    collection: 'leadership_elections',
    timestamps: false, // Using epoch ms manually
  }
);

// ===================== INDEXES =====================

// Compound index for organization lookups
LeadershipElectionSchema.index({ organizationType: 1, organizationId: 1, status: 1 });

// Active elections lookup
LeadershipElectionSchema.index({ status: 1, votingEnd: 1 });

// Upcoming elections
LeadershipElectionSchema.index({ status: 1, votingStart: 1 });

// ===================== VIRTUALS =====================

LeadershipElectionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

LeadershipElectionSchema.virtual('isFilingOpen').get(function () {
  const now = Date.now();
  return (
    this.status === LeadershipElectionStatus.FILING &&
    now >= this.filingStart &&
    now < this.filingEnd
  );
});

LeadershipElectionSchema.virtual('isVotingOpen').get(function () {
  const now = Date.now();
  return (
    this.status === LeadershipElectionStatus.VOTING &&
    now >= this.votingStart &&
    now < this.votingEnd
  );
});

LeadershipElectionSchema.virtual('currentTurnout').get(function () {
  if (this.eligibleVoterIds.length === 0) return 0;
  return (this.votedIds.length / this.eligibleVoterIds.length) * 100;
});

// ===================== INSTANCE METHODS =====================

LeadershipElectionSchema.methods.canVote = function (
  playerId: string,
  memberStanding: number,
  memberTenureDays: number
): boolean {
  // Must be eligible voter
  if (!this.eligibleVoterIds.includes(playerId)) return false;
  
  // Must not have already voted
  if (this.votedIds.includes(playerId)) return false;
  
  // Check standing requirement
  if (memberStanding < this.minimumStandingToVote) return false;
  
  // Check tenure requirement
  if (memberTenureDays < this.minimumTenureToVote) return false;
  
  // Must be voting period
  return this.isVotingOpen;
};

LeadershipElectionSchema.methods.canRun = function (
  playerId: string,
  memberStanding: number,
  memberTenureDays: number
): boolean {
  // Must be eligible voter (member)
  if (!this.eligibleVoterIds.includes(playerId)) return false;
  
  // Check if already a candidate
  const existingCandidate = this.candidates.find(
    (c: LeadershipCandidate) => c.playerId === playerId && !c.withdrew
  );
  if (existingCandidate) return false;
  
  // Check standing requirement
  if (memberStanding < this.minimumStandingToRun) return false;
  
  // Check tenure requirement
  if (memberTenureDays < this.minimumTenureToRun) return false;
  
  // Must be filing period
  return this.isFilingOpen;
};

LeadershipElectionSchema.methods.hasVoted = function (playerId: string): boolean {
  return this.votedIds.includes(playerId);
};

LeadershipElectionSchema.methods.getCandidateById = function (
  playerId: string
): LeadershipCandidate | undefined {
  return this.candidates.find((c: LeadershipCandidate) => c.playerId === playerId);
};

LeadershipElectionSchema.methods.toSummary = function (): LeadershipElectionSummary {
  const activeCandidates = this.candidates.filter((c: LeadershipCandidate) => !c.withdrew);
  
  return {
    id: this._id.toHexString(),
    organizationType: this.organizationType,
    organizationId: this.organizationId,
    organizationName: this.organizationName,
    electionType: this.electionType,
    positions: this.positions,
    status: this.status,
    title: this.title,
    candidateCount: activeCandidates.length,
    votingStart: this.votingStart,
    votingEnd: this.votingEnd,
    voterTurnout: this.currentTurnout,
    winnerId: this.results?.winnerId,
    winnerName: this.results?.winnerName,
  };
};

// ===================== STATIC METHODS =====================

LeadershipElectionSchema.statics.findByOrganization = async function (
  orgType: OrganizationType,
  orgId: string,
  options: { includeCompleted?: boolean; limit?: number } = {}
): Promise<ILeadershipElectionDocument[]> {
  const query: Record<string, unknown> = {
    organizationType: orgType,
    organizationId: orgId,
  };
  
  if (!options.includeCompleted) {
    query.status = { $nin: [LeadershipElectionStatus.COMPLETED, LeadershipElectionStatus.CANCELLED] };
  }
  
  let queryBuilder = this.find(query).sort({ votingStart: -1 });
  
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder.exec();
};

LeadershipElectionSchema.statics.findActiveElections = async function (
  orgType?: OrganizationType,
  orgId?: string
): Promise<ILeadershipElectionDocument[]> {
  const query: Record<string, unknown> = {
    status: { $in: [
      LeadershipElectionStatus.FILING,
      LeadershipElectionStatus.VOTING,
      LeadershipElectionStatus.COUNTING,
      LeadershipElectionStatus.RUNOFF,
    ]},
  };
  
  if (orgType) query.organizationType = orgType;
  if (orgId) query.organizationId = orgId;
  
  return this.find(query).sort({ votingStart: 1 }).exec();
};

LeadershipElectionSchema.statics.findUpcoming = async function (
  days: number,
  orgType?: OrganizationType
): Promise<ILeadershipElectionDocument[]> {
  const now = Date.now();
  const futureLimit = now + days * 24 * 60 * 60 * 1000;
  
  const query: Record<string, unknown> = {
    status: LeadershipElectionStatus.SCHEDULED,
    votingStart: { $gte: now, $lte: futureLimit },
  };
  
  if (orgType) query.organizationType = orgType;
  
  return this.find(query).sort({ votingStart: 1 }).exec();
};

// ===================== PRE-SAVE HOOKS =====================

LeadershipElectionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on timing
  const now = Date.now();
  
  if (this.status === LeadershipElectionStatus.SCHEDULED && now >= this.filingStart) {
    this.status = LeadershipElectionStatus.FILING;
  }
  
  if (this.status === LeadershipElectionStatus.FILING && now >= this.filingEnd) {
    // Check if enough candidates
    const activeCandidates = this.candidates.filter((c: LeadershipCandidate) => !c.withdrew);
    if (activeCandidates.length > 0 && now >= this.votingStart) {
      this.status = LeadershipElectionStatus.VOTING;
    }
  }
  
  if (this.status === LeadershipElectionStatus.VOTING && now >= this.votingEnd) {
    this.status = LeadershipElectionStatus.COUNTING;
  }
  
  next();
});

// ===================== JSON TRANSFORM =====================

LeadershipElectionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toHexString();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>)._id;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).__v;
    
    // Hide votes if anonymous voting
    if (ret.anonymousVoting && ret.status !== LeadershipElectionStatus.COMPLETED) {
      ret.votes = [];
    }
    
    return ret;
  },
});

LeadershipElectionSchema.set('toObject', {
  virtuals: true,
});

// ===================== MODEL EXPORT =====================

const LeadershipElectionModel = (mongoose.models.LeadershipElection as ILeadershipElectionModel) ||
  mongoose.model<ILeadershipElectionDocument, ILeadershipElectionModel>(
    'LeadershipElection',
    LeadershipElectionSchema
  );

export default LeadershipElectionModel;
