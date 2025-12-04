/**
 * @fileoverview Proposal Mongoose Model
 * @module lib/db/models/politics/Proposal
 * 
 * OVERVIEW:
 * Mongoose model for formal proposals within player organizations.
 * Supports policy proposals, bylaw amendments, resolutions, and action items
 * with formal voting procedures, amendments, and discussion threads.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { OrganizationType } from '@/lib/types/leadership';
import {
  ProposalCategory,
  ProposalStatus,
  ProposalPriority,
  ProposalVoteChoice,
  CommentType,
  DEFAULT_PROPOSAL_SETTINGS,
  calculateTally,
  generateProposalNumber,
} from '@/lib/types/proposal';
import type {
  Proposal,
  ProposalSponsor,
  ProposalVote,
  VoteTally,
  ProposalComment,
  ProposalAmendment,
  ImplementationStep,
  ProposalSummary,
} from '@/lib/types/proposal';

// ===================== DOCUMENT INTERFACE =====================

export interface IProposalDocument extends Omit<Proposal, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  
  // Virtuals
  readonly isDebateOpen: boolean;
  readonly isVotingOpen: boolean;
  readonly canBeEdited: boolean;
  
  // Instance methods
  hasVoted(playerId: string): boolean;
  isSponsor(playerId: string): boolean;
  recalculateTally(eligibleVoters: number): VoteTally;
  toSummary(): ProposalSummary;
}

// ===================== STATIC INTERFACE =====================

export interface IProposalModel extends Model<IProposalDocument> {
  findByOrganization(
    orgType: OrganizationType,
    orgId: string,
    options?: { status?: ProposalStatus | ProposalStatus[]; limit?: number }
  ): Promise<IProposalDocument[]>;
  
  findActive(
    orgType?: OrganizationType,
    orgId?: string
  ): Promise<IProposalDocument[]>;
  
  getNextSequence(
    orgId: string,
    category: ProposalCategory,
    year: number
  ): Promise<number>;
}

// ===================== SUB-SCHEMAS =====================

/**
 * Sponsor Sub-Schema
 */
const SponsorSchema = new Schema<ProposalSponsor>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    sponsoredAt: { type: Number, required: true },
    statement: { type: String, maxlength: 500 },
  },
  { _id: false }
);

/**
 * Vote Sub-Schema
 */
const VoteSchema = new Schema<ProposalVote>(
  {
    voterId: { type: String, required: true },
    voterName: { type: String, required: true },
    choice: {
      type: String,
      enum: Object.values(ProposalVoteChoice),
      required: true,
    },
    votedAt: { type: Number, required: true },
    explanation: { type: String, maxlength: 500 },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

/**
 * Tally Sub-Schema
 */
const TallySchema = new Schema<VoteTally>(
  {
    yea: { type: Number, default: 0 },
    nay: { type: Number, default: 0 },
    abstain: { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    eligibleVoters: { type: Number, default: 0 },
    turnout: { type: Number, default: 0 },
    yeaPercentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    quorumMet: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Comment Sub-Schema
 */
const CommentSchema = new Schema<ProposalComment>(
  {
    id: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(CommentType),
      default: CommentType.DISCUSSION,
    },
    content: { type: String, required: true, maxlength: 2000 },
    postedAt: { type: Number, required: true },
    editedAt: { type: Number },
    parentId: { type: String },
    reactions: {
      agree: { type: Number, default: 0 },
      disagree: { type: Number, default: 0 },
      insightful: { type: Number, default: 0 },
    },
    reactedBy: [{
      playerId: { type: String, required: true },
      reaction: { type: String, enum: ['agree', 'disagree', 'insightful'], required: true },
    }],
  },
  { _id: false }
);

/**
 * Amendment Sub-Schema
 */
const AmendmentSchema = new Schema<ProposalAmendment>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    targetSection: { type: String, required: true },
    originalText: { type: String },
    proposedText: { type: String, required: true },
    rationale: { type: String, maxlength: 1000 },
    sponsorId: { type: String, required: true },
    sponsorName: { type: String, required: true },
    coSponsors: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'VOTING', 'ADOPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
    votesFor: { type: Number, default: 0 },
    votesAgainst: { type: Number, default: 0 },
    voterIds: [{ type: String }],
    votingDeadline: { type: Number },
    createdAt: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Implementation Step Sub-Schema
 */
const ImplementationStepSchema = new Schema<ImplementationStep>(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    assignedTo: { type: String },
    dueDate: { type: Number },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      default: 'PENDING',
    },
    notes: { type: String },
    completedAt: { type: Number },
  },
  { _id: false }
);

// ===================== MAIN SCHEMA =====================

const ProposalSchema = new Schema<IProposalDocument>(
  {
    proposalNumber: {
      type: String,
      required: true,
      index: true,
    },
    
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
    
    // Category & Status
    category: {
      type: String,
      enum: Object.values(ProposalCategory),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ProposalPriority),
      default: ProposalPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(ProposalStatus),
      default: ProposalStatus.DRAFT,
      index: true,
    },
    
    // Content
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    body: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    rationale: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    
    // Sponsorship
    sponsors: [SponsorSchema],
    minSponsorsRequired: {
      type: Number,
      default: DEFAULT_PROPOSAL_SETTINGS.minSponsorsRequired,
    },
    
    // Timeline
    createdAt: { type: Number, required: true },
    submittedAt: { type: Number },
    debateStart: { type: Number },
    debateEnd: { type: Number },
    votingStart: { type: Number, index: true },
    votingEnd: { type: Number, index: true },
    decidedAt: { type: Number },
    updatedAt: { type: Number, required: true },
    
    // Voting Rules
    quorumPercentage: {
      type: Number,
      default: DEFAULT_PROPOSAL_SETTINGS.quorumPercentage,
    },
    passThreshold: {
      type: Number,
      default: DEFAULT_PROPOSAL_SETTINGS.passThreshold,
    },
    vetoable: {
      type: Boolean,
      default: DEFAULT_PROPOSAL_SETTINGS.vetoable,
    },
    
    // Voting Data
    votes: [VoteSchema],
    voterIds: [{ type: String }],
    tally: TallySchema,
    
    // Discussion
    comments: [CommentSchema],
    
    // Amendments
    amendments: [AmendmentSchema],
    
    // Implementation
    implementationSteps: [ImplementationStepSchema],
    implementationDeadline: { type: Number },
    implementedAt: { type: Number },
    
    // Related
    relatedProposals: [{ type: String }],
    tags: [{ type: String }],
    
    // Metadata
    createdBy: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  {
    collection: 'proposals',
    timestamps: false,
  }
);

// ===================== INDEXES =====================

ProposalSchema.index({ organizationType: 1, organizationId: 1, status: 1 });
ProposalSchema.index({ organizationId: 1, category: 1, createdAt: -1 });
ProposalSchema.index({ status: 1, votingEnd: 1 });
ProposalSchema.index({ tags: 1 });

// ===================== VIRTUALS =====================

ProposalSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProposalSchema.virtual('isDebateOpen').get(function () {
  const now = Date.now();
  return (
    this.status === ProposalStatus.DEBATE &&
    this.debateStart !== undefined &&
    this.debateEnd !== undefined &&
    now >= this.debateStart &&
    now < this.debateEnd
  );
});

ProposalSchema.virtual('isVotingOpen').get(function () {
  const now = Date.now();
  return (
    this.status === ProposalStatus.VOTING &&
    this.votingStart !== undefined &&
    this.votingEnd !== undefined &&
    now >= this.votingStart &&
    now < this.votingEnd
  );
});

ProposalSchema.virtual('canBeEdited').get(function () {
  return [ProposalStatus.DRAFT].includes(this.status);
});

// ===================== INSTANCE METHODS =====================

ProposalSchema.methods.hasVoted = function (playerId: string): boolean {
  return this.voterIds.includes(playerId);
};

ProposalSchema.methods.isSponsor = function (playerId: string): boolean {
  return this.sponsors.some((s: ProposalSponsor) => s.playerId === playerId);
};

ProposalSchema.methods.recalculateTally = function (eligibleVoters: number): VoteTally {
  return calculateTally(
    this.votes,
    eligibleVoters,
    this.quorumPercentage,
    this.passThreshold
  );
};

ProposalSchema.methods.toSummary = function (): ProposalSummary {
  const primarySponsor = this.sponsors.find((s: ProposalSponsor) => s.isPrimary);
  
  return {
    id: this._id.toHexString(),
    proposalNumber: this.proposalNumber,
    organizationType: this.organizationType,
    organizationId: this.organizationId,
    organizationName: this.organizationName,
    category: this.category,
    priority: this.priority,
    status: this.status,
    title: this.title,
    summary: this.summary,
    sponsorCount: this.sponsors.length,
    primarySponsorName: primarySponsor?.displayName || 'Unknown',
    voteCount: this.votes.length,
    commentCount: this.comments.length,
    amendmentCount: this.amendments.length,
    votingStart: this.votingStart,
    votingEnd: this.votingEnd,
    yeaPercentage: this.tally?.yeaPercentage,
    passed: this.tally?.passed,
    createdAt: this.createdAt,
  };
};

// ===================== STATIC METHODS =====================

ProposalSchema.statics.findByOrganization = async function (
  orgType: OrganizationType,
  orgId: string,
  options: { status?: ProposalStatus | ProposalStatus[]; limit?: number } = {}
): Promise<IProposalDocument[]> {
  const query: Record<string, unknown> = {
    organizationType: orgType,
    organizationId: orgId,
  };
  
  if (options.status) {
    if (Array.isArray(options.status)) {
      query.status = { $in: options.status };
    } else {
      query.status = options.status;
    }
  }
  
  let queryBuilder = this.find(query).sort({ createdAt: -1 });
  
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder.exec();
};

ProposalSchema.statics.findActive = async function (
  orgType?: OrganizationType,
  orgId?: string
): Promise<IProposalDocument[]> {
  const query: Record<string, unknown> = {
    status: { $in: [
      ProposalStatus.SUBMITTED,
      ProposalStatus.DEBATE,
      ProposalStatus.VOTING,
    ]},
  };
  
  if (orgType) query.organizationType = orgType;
  if (orgId) query.organizationId = orgId;
  
  return this.find(query).sort({ votingStart: 1 }).exec();
};

ProposalSchema.statics.getNextSequence = async function (
  orgId: string,
  category: ProposalCategory,
  year: number
): Promise<number> {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  
  const count = await this.countDocuments({
    organizationId: orgId,
    category,
    createdAt: { $gte: yearStart, $lt: yearEnd },
  });
  
  return count + 1;
};

// ===================== PRE-SAVE HOOKS =====================

ProposalSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  
  // Generate proposal number if new
  if (this.isNew && !this.proposalNumber) {
    const year = new Date().getFullYear();
    const sequence = await (this.constructor as IProposalModel).getNextSequence(
      this.organizationId,
      this.category,
      year
    );
    this.proposalNumber = generateProposalNumber(this.category, year, sequence);
  }
  
  // Auto-update status based on timing
  const now = Date.now();
  
  if (this.status === ProposalStatus.SUBMITTED && this.debateStart && now >= this.debateStart) {
    this.status = ProposalStatus.DEBATE;
  }
  
  if (this.status === ProposalStatus.DEBATE && this.debateEnd && now >= this.debateEnd) {
    if (this.votingStart && now >= this.votingStart) {
      this.status = ProposalStatus.VOTING;
    }
  }
  
  if (this.status === ProposalStatus.VOTING && this.votingEnd && now >= this.votingEnd) {
    // Status will be set to PASSED or FAILED by the vote counting logic
  }
  
  next();
});

// ===================== JSON TRANSFORM =====================

ProposalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toHexString();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>)._id;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

ProposalSchema.set('toObject', {
  virtuals: true,
});

// ===================== MODEL EXPORT =====================

const ProposalModel = (mongoose.models.Proposal as IProposalModel) ||
  mongoose.model<IProposalDocument, IProposalModel>('Proposal', ProposalSchema);

export default ProposalModel;
