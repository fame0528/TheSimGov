/**
 * @fileoverview Party Mongoose Model
 * @module lib/db/models/politics/Party
 * 
 * OVERVIEW:
 * Persistence layer for player-founded political party organizations.
 * Parties are formal organizations that recruit members, run primaries,
 * nominate candidates, build platforms, and compete in elections.
 * 
 * SCHEMA DESIGN:
 * - Indexed on slug for URL lookups
 * - Indexed on chairId for chair-specific queries
 * - Indexed on affiliation/level for filtering
 * - Compound index on members.playerId for membership queries
 * - Timestamps for audit trails
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Party,
  PartyMember,
  PartyPlatform,
  PlatformPlank,
  PartyPrimary,
  PrimaryCandidate,
  PartyConvention,
  PartyEndorsement,
  PartyActionProposal,
  PartyApplication,
  PartyStrength,
} from '@/lib/types/party';
import {
  PartyLevel,
  PartyStatus,
  PartyMemberRole,
  PartyActionType,
  PrimaryType,
  PrimaryStatus,
  ConventionType,
} from '@/lib/types/party';
import { PoliticalIssue } from '@/lib/types/demographics';
import { PoliticalParty } from '@/types/politics';

// ===================== INTERFACE EXTENSION =====================

/**
 * Mongoose document interface extending Party
 * Note: createdAt/updatedAt from Mongoose are Date objects,
 * but the base Party type uses number (epoch ms) - we override here
 */
export interface IPartyDocument extends Omit<Party, 'id' | 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SUB-SCHEMAS =====================

const PartyMemberSchema = new Schema<PartyMember>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(PartyMemberRole) },
    joinedAt: { type: Number, required: true },
    totalContributions: { type: Number, required: true, default: 0, min: 0 },
    standing: { type: Number, required: true, default: 50, min: 0, max: 100 },
    votesCast: { type: Number, required: true, default: 0, min: 0 },
    delegateEligible: { type: Boolean, required: true, default: false },
    lastActiveAt: { type: Number, required: true },
    contributionTier: {
      type: String,
      required: true,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
  },
  { _id: false }
);

const PlatformPlankSchema = new Schema<PlatformPlank>(
  {
    id: { type: String, required: true },
    issue: { type: String, required: true, enum: Object.values(PoliticalIssue) },
    title: { type: String, required: true, maxlength: 200 },
    text: { type: String, required: true, maxlength: 5000 },
    position: { type: Number, required: true, min: -5, max: 5 },
    priority: { type: Number, required: true, default: 5, min: 1, max: 10 },
    adoptedAt: { type: Number, required: true },
    amendedAt: { type: Number },
  },
  { _id: false }
);

const PartyPlatformSchema = new Schema<PartyPlatform>(
  {
    version: { type: Number, required: true, default: 1, min: 1 },
    adoptedAt: { type: Number, required: true },
    planks: { type: [PlatformPlankSchema], required: true, default: [] },
    preamble: { type: String, required: true, default: '', maxlength: 5000 },
    conventionId: { type: String },
  },
  { _id: false }
);

const PrimaryCandidateSchema = new Schema<PrimaryCandidate>(
  {
    campaignId: { type: String, required: true },
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    filedAt: { type: Number, required: true },
    votesReceived: { type: Number, required: true, default: 0, min: 0 },
    votePercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
    withdrew: { type: Boolean, required: true, default: false },
    withdrewAt: { type: Number },
    endorsements: { type: [String], required: true, default: [] },
  },
  { _id: false }
);

const PartyPrimarySchema = new Schema<PartyPrimary>(
  {
    id: { type: String, required: true },
    electionId: { type: String, required: true },
    office: { type: String, required: true },
    jurisdiction: { type: String, required: true },
    type: { type: String, required: true, enum: Object.values(PrimaryType) },
    status: {
      type: String,
      required: true,
      enum: Object.values(PrimaryStatus),
      default: PrimaryStatus.SCHEDULED,
    },
    filingDeadline: { type: Number, required: true },
    votingStart: { type: Number, required: true },
    votingEnd: { type: Number, required: true },
    candidates: { type: [PrimaryCandidateSchema], required: true, default: [] },
    totalVotes: { type: Number, required: true, default: 0, min: 0 },
    winnerId: { type: String },
    runoffRequired: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const PartyConventionSchema = new Schema<PartyConvention>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: Object.values(ConventionType) },
    location: { type: String, required: true },
    startDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    delegates: { type: [String], required: true, default: [] },
    agenda: { type: [String], required: true, default: [] },
    resolutions: { type: [String], required: true, default: [] },
    completed: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const PartyEndorsementSchema = new Schema<PartyEndorsement>(
  {
    campaignId: { type: String, required: true },
    candidatePlayerId: { type: String, required: true },
    office: { type: String, required: true },
    issuedAt: { type: Number, required: true },
    cycleSequence: { type: Number, required: true },
    fundsCommitted: { type: Number, required: true, default: 0, min: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const PartyActionProposalSchema = new Schema<PartyActionProposal>(
  {
    id: { type: String, required: true },
    actionType: { type: String, required: true, enum: Object.values(PartyActionType) },
    targetId: { type: String },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    proposedBy: { type: String, required: true },
    proposedAt: { type: Number, required: true },
    votingDeadline: { type: Number, required: true },
    votesFor: { type: Number, required: true, default: 0, min: 0 },
    votesAgainst: { type: Number, required: true, default: 0, min: 0 },
    votesAbstain: { type: Number, required: true, default: 0, min: 0 },
    voterIds: { type: [String], required: true, default: [] },
    cost: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED'],
      default: 'PENDING',
    },
    approvalThreshold: { type: Number, required: true, default: 50, min: 0, max: 100 },
  },
  { _id: false }
);

const PartyApplicationSchema = new Schema<PartyApplication>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    message: { type: String, required: true, default: '' },
    appliedAt: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Number },
    rejectionReason: { type: String },
  },
  { _id: false }
);

const PartyStrengthSchema = new Schema<PartyStrength>(
  {
    overall: { type: Number, required: true, default: 0, min: 0, max: 100 },
    membershipScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    treasuryScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    electoralScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    activityScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    winRate: { type: Number, required: true, default: 0, min: 0, max: 1 },
    calculatedAt: { type: Number, required: true },
  },
  { _id: false }
);

// ===================== MAIN SCHEMA =====================

const PartySchema = new Schema<IPartyDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    affiliation: {
      type: String,
      required: true,
      enum: Object.values(PoliticalParty),
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: Object.values(PartyLevel),
      index: true,
    },
    stateCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(PartyStatus),
      default: PartyStatus.ACTIVE,
      index: true,
    },
    founderId: {
      type: String,
      required: true,
      index: true,
    },
    chairId: {
      type: String,
      required: true,
      index: true,
    },
    foundedAt: {
      type: Number,
      required: true,
    },
    members: {
      type: [PartyMemberSchema],
      required: true,
      default: [],
    },
    memberCount: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
      index: true,
    },
    applications: {
      type: [PartyApplicationSchema],
      required: true,
      default: [],
    },
    treasury: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    platform: {
      type: PartyPlatformSchema,
      required: true,
      default: () => ({
        version: 1,
        adoptedAt: Date.now(),
        planks: [],
        preamble: '',
      }),
    },
    primaries: {
      type: [PartyPrimarySchema],
      required: true,
      default: [],
    },
    conventions: {
      type: [PartyConventionSchema],
      required: true,
      default: [],
    },
    endorsements: {
      type: [PartyEndorsementSchema],
      required: true,
      default: [],
    },
    proposals: {
      type: [PartyActionProposalSchema],
      required: true,
      default: [],
    },
    strength: {
      type: PartyStrengthSchema,
      required: true,
      default: () => ({
        overall: 10,
        membershipScore: 10,
        treasuryScore: 0,
        electoralScore: 0,
        activityScore: 0,
        winRate: 0,
        calculatedAt: Date.now(),
      }),
    },
    registrationOpen: {
      type: Boolean,
      required: true,
      default: true,
    },
    minimumDelegateStanding: {
      type: Number,
      required: true,
      default: 60,
      min: 0,
      max: 100,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    primaryColor: {
      type: String,
      trim: true,
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    schemaVersion: {
      type: Number,
      required: true,
      default: 1,
      immutable: true,
    },
  },
  {
    timestamps: true,
    collection: 'parties',
  }
);

// ===================== INDEXES =====================

// Compound index for member queries
PartySchema.index({ 'members.playerId': 1 });

// Compound index for affiliation + level filtering
PartySchema.index({ affiliation: 1, level: 1 });

// Compound index for state-specific parties
PartySchema.index({ level: 1, stateCode: 1 });

// Text index for search
PartySchema.index({ name: 'text', description: 'text' });

// ===================== VIRTUALS =====================

PartySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

PartySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = ret as unknown as Record<string, unknown>;
    return rest;
  },
});

PartySchema.set('toObject', {
  virtuals: true,
});

// ===================== STATICS =====================

/**
 * Find parties by member
 */
PartySchema.statics.findByMember = function (playerId: string) {
  return this.find({ 'members.playerId': playerId, status: PartyStatus.ACTIVE });
};

/**
 * Find parties by affiliation and level
 */
PartySchema.statics.findByAffiliationAndLevel = function (
  affiliation: PoliticalParty,
  level?: PartyLevel
) {
  const query: Record<string, unknown> = { affiliation, status: PartyStatus.ACTIVE };
  if (level) {
    query.level = level;
  }
  return this.find(query).sort({ memberCount: -1 });
};

/**
 * Find parties in a state
 */
PartySchema.statics.findByState = function (stateCode: string) {
  return this.find({
    $or: [
      { level: PartyLevel.STATE, stateCode },
      { level: PartyLevel.NATIONAL },
    ],
    status: PartyStatus.ACTIVE,
  }).sort({ memberCount: -1 });
};

/**
 * Find parties with active primaries
 */
PartySchema.statics.findWithActivePrimaries = function () {
  return this.find({
    'primaries.status': { $in: [PrimaryStatus.FILING_OPEN, PrimaryStatus.CAMPAIGNING, PrimaryStatus.VOTING] },
    status: PartyStatus.ACTIVE,
  });
};

// ===================== METHODS =====================

/**
 * Check if player is a member
 */
PartySchema.methods.isMember = function (playerId: string): boolean {
  return this.members.some((m: PartyMember) => m.playerId === playerId);
};

/**
 * Get member by player ID
 */
PartySchema.methods.getMember = function (playerId: string): PartyMember | undefined {
  return this.members.find((m: PartyMember) => m.playerId === playerId);
};

/**
 * Check if player is chair
 */
PartySchema.methods.isChair = function (playerId: string): boolean {
  return this.chairId === playerId;
};

/**
 * Check if player is leadership (chair, vice chair, treasurer, secretary)
 */
PartySchema.methods.isLeadership = function (playerId: string): boolean {
  const member = this.getMember(playerId);
  return member
    ? [
        PartyMemberRole.CHAIR,
        PartyMemberRole.VICE_CHAIR,
        PartyMemberRole.TREASURER,
        PartyMemberRole.SECRETARY,
      ].includes(member.role)
    : false;
};

/**
 * Check if player is eligible to be a delegate
 */
PartySchema.methods.isDelegateEligible = function (playerId: string): boolean {
  const member = this.getMember(playerId);
  return member ? member.standing >= this.minimumDelegateStanding : false;
};

// ===================== PRE-SAVE HOOKS =====================

PartySchema.pre('save', function (next) {
  // Update member count
  this.memberCount = this.members.length;
  next();
});

// ===================== MODEL =====================

interface IPartyModel extends Model<IPartyDocument> {
  findByMember(playerId: string): ReturnType<Model<IPartyDocument>['find']>;
  findByAffiliationAndLevel(
    affiliation: PoliticalParty,
    level?: PartyLevel
  ): ReturnType<Model<IPartyDocument>['find']>;
  findByState(stateCode: string): ReturnType<Model<IPartyDocument>['find']>;
  findWithActivePrimaries(): ReturnType<Model<IPartyDocument>['find']>;
}

const PartyModel =
  (mongoose.models.Party as IPartyModel) ||
  mongoose.model<IPartyDocument, IPartyModel>('Party', PartySchema);

export default PartyModel;
