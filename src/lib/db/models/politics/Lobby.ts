/**
 * @fileoverview Lobby Mongoose Model
 * @module lib/db/models/politics/Lobby
 * 
 * OVERVIEW:
 * Persistence layer for player-created interest groups (lobbies).
 * Lobbies are organizations that pool resources and influence to affect
 * legislation, endorse candidates, and shape political outcomes.
 * 
 * SCHEMA DESIGN:
 * - Indexed on slug for URL lookups
 * - Indexed on leaderId for leader-specific queries
 * - Indexed on focus/scope for filtering
 * - Compound index on members.playerId for membership queries
 * - Timestamps for audit trails
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Lobby,
  LobbyMember,
  LobbyDuesConfig,
  LobbyIssuePosition,
  LobbyEndorsement,
  LobbyLegislativePosition,
  LobbyActionProposal,
  LobbyApplication,
  LobbyStrength,
} from '@/lib/types/lobby';
import {
  LobbyFocus,
  LobbyScope,
  LobbyStatus,
  LobbyMemberRole,
  LobbyActionType,
} from '@/lib/types/lobby';
import { PoliticalIssue } from '@/lib/types/demographics';

// ===================== INTERFACE EXTENSION =====================

/**
 * Mongoose document interface extending Lobby
 * Note: createdAt/updatedAt from Mongoose are Date objects,
 * but the base Lobby type uses number (epoch ms) - we override here
 */
export interface ILobbyDocument extends Omit<Lobby, 'id' | 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ===================== SUB-SCHEMAS =====================

const LobbyMemberSchema = new Schema<LobbyMember>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(LobbyMemberRole) },
    joinedAt: { type: Number, required: true },
    totalDuesPaid: { type: Number, required: true, default: 0, min: 0 },
    standing: { type: Number, required: true, default: 50, min: 0, max: 100 },
    votesCast: { type: Number, required: true, default: 0, min: 0 },
    actionsProposed: { type: Number, required: true, default: 0, min: 0 },
    lastActiveAt: { type: Number, required: true },
    duesPaidCurrentCycle: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const LobbyDuesConfigSchema = new Schema<LobbyDuesConfig>(
  {
    amountPerCycle: { type: Number, required: true, default: 1000, min: 0 },
    cycleDays: { type: Number, required: true, default: 30, min: 1 },
    gracePeriodDays: { type: Number, required: true, default: 7, min: 0 },
    mandatory: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const LobbyIssuePositionSchema = new Schema<LobbyIssuePosition>(
  {
    issue: { type: String, required: true, enum: Object.values(PoliticalIssue) },
    position: { type: Number, required: true, min: -5, max: 5 },
    priority: { type: Number, required: true, default: 5, min: 1, max: 10 },
    updatedAt: { type: Number, required: true },
  },
  { _id: false }
);

const LobbyEndorsementSchema = new Schema<LobbyEndorsement>(
  {
    campaignId: { type: String, required: true },
    candidatePlayerId: { type: String, required: true },
    type: { type: String, required: true, enum: ['ENDORSE', 'OPPOSE'] },
    issuedAt: { type: Number, required: true },
    cycleSequence: { type: Number, required: true },
    fundsContributed: { type: Number, required: true, default: 0, min: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const LobbyLegislativePositionSchema = new Schema<LobbyLegislativePosition>(
  {
    billId: { type: String, required: true },
    stance: { type: String, required: true, enum: ['SUPPORT', 'OPPOSE', 'NEUTRAL'] },
    priority: { type: Number, required: true, default: 5, min: 1, max: 10 },
    resourcesCommitted: { type: Number, required: true, default: 0, min: 0 },
    decidedAt: { type: Number, required: true },
  },
  { _id: false }
);

const LobbyActionProposalSchema = new Schema<LobbyActionProposal>(
  {
    id: { type: String, required: true },
    actionType: { type: String, required: true, enum: Object.values(LobbyActionType) },
    targetId: { type: String, required: true },
    description: { type: String, required: true },
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
  },
  { _id: false }
);

const LobbyApplicationSchema = new Schema<LobbyApplication>(
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

const LobbyStrengthSchema = new Schema<LobbyStrength>(
  {
    overall: { type: Number, required: true, default: 0, min: 0, max: 100 },
    membershipScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    treasuryScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    activityScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
    successRate: { type: Number, required: true, default: 0, min: 0, max: 1 },
    calculatedAt: { type: Number, required: true },
  },
  { _id: false }
);

// ===================== MAIN SCHEMA =====================

const LobbySchema = new Schema<ILobbyDocument>(
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
    focus: {
      type: String,
      required: true,
      enum: Object.values(LobbyFocus),
      index: true,
    },
    scope: {
      type: String,
      required: true,
      enum: Object.values(LobbyScope),
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
      enum: Object.values(LobbyStatus),
      default: LobbyStatus.ACTIVE,
      index: true,
    },
    founderId: {
      type: String,
      required: true,
      index: true,
    },
    leaderId: {
      type: String,
      required: true,
      index: true,
    },
    foundedAt: {
      type: Number,
      required: true,
    },
    members: {
      type: [LobbyMemberSchema],
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
      type: [LobbyApplicationSchema],
      required: true,
      default: [],
    },
    treasury: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    duesConfig: {
      type: LobbyDuesConfigSchema,
      required: true,
      default: () => ({
        amountPerCycle: 1000,
        cycleDays: 30,
        gracePeriodDays: 7,
        mandatory: true,
      }),
    },
    issuePositions: {
      type: [LobbyIssuePositionSchema],
      required: true,
      default: [],
    },
    endorsements: {
      type: [LobbyEndorsementSchema],
      required: true,
      default: [],
    },
    legislativePositions: {
      type: [LobbyLegislativePositionSchema],
      required: true,
      default: [],
    },
    proposals: {
      type: [LobbyActionProposalSchema],
      required: true,
      default: [],
    },
    strength: {
      type: LobbyStrengthSchema,
      required: true,
      default: () => ({
        overall: 10,
        membershipScore: 10,
        treasuryScore: 0,
        activityScore: 0,
        successRate: 0,
        calculatedAt: Date.now(),
      }),
    },
    inviteOnly: {
      type: Boolean,
      required: true,
      default: false,
    },
    minimumStandingRequired: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
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
    collection: 'lobbies',
  }
);

// ===================== INDEXES =====================

// Compound index for member queries
LobbySchema.index({ 'members.playerId': 1 });

// Compound index for focus + scope filtering
LobbySchema.index({ focus: 1, scope: 1 });

// Compound index for state-specific lobbies
LobbySchema.index({ scope: 1, stateCode: 1 });

// Text index for search
LobbySchema.index({ name: 'text', description: 'text' });

// ===================== VIRTUALS =====================

LobbySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

LobbySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = ret as unknown as Record<string, unknown>;
    return rest;
  },
});

LobbySchema.set('toObject', {
  virtuals: true,
});

// ===================== STATICS =====================

/**
 * Find lobbies by member
 */
LobbySchema.statics.findByMember = function (playerId: string) {
  return this.find({ 'members.playerId': playerId, status: LobbyStatus.ACTIVE });
};

/**
 * Find lobbies by focus and scope
 */
LobbySchema.statics.findByFocusAndScope = function (focus: LobbyFocus, scope?: LobbyScope) {
  const query: Record<string, unknown> = { focus, status: LobbyStatus.ACTIVE };
  if (scope) {
    query.scope = scope;
  }
  return this.find(query).sort({ memberCount: -1 });
};

/**
 * Find lobbies in a state
 */
LobbySchema.statics.findByState = function (stateCode: string) {
  return this.find({
    $or: [
      { scope: LobbyScope.STATE, stateCode },
      { scope: LobbyScope.NATIONAL },
    ],
    status: LobbyStatus.ACTIVE,
  }).sort({ memberCount: -1 });
};

// ===================== METHODS =====================

/**
 * Check if player is a member
 */
LobbySchema.methods.isMember = function (playerId: string): boolean {
  return this.members.some((m: LobbyMember) => m.playerId === playerId);
};

/**
 * Get member by player ID
 */
LobbySchema.methods.getMember = function (playerId: string): LobbyMember | undefined {
  return this.members.find((m: LobbyMember) => m.playerId === playerId);
};

/**
 * Check if player is leader
 */
LobbySchema.methods.isLeader = function (playerId: string): boolean {
  return this.leaderId === playerId;
};

/**
 * Check if player is officer or higher
 */
LobbySchema.methods.isOfficerOrHigher = function (playerId: string): boolean {
  const member = this.getMember(playerId);
  return member
    ? [LobbyMemberRole.LEADER, LobbyMemberRole.OFFICER].includes(member.role)
    : false;
};

// ===================== PRE-SAVE HOOKS =====================

LobbySchema.pre('save', function (next) {
  // Update member count
  this.memberCount = this.members.length;
  next();
});

// ===================== MODEL =====================

interface ILobbyModel extends Model<ILobbyDocument> {
  findByMember(playerId: string): ReturnType<Model<ILobbyDocument>['find']>;
  findByFocusAndScope(
    focus: LobbyFocus,
    scope?: LobbyScope
  ): ReturnType<Model<ILobbyDocument>['find']>;
  findByState(stateCode: string): ReturnType<Model<ILobbyDocument>['find']>;
}

const LobbyModel =
  (mongoose.models.Lobby as ILobbyModel) ||
  mongoose.model<ILobbyDocument, ILobbyModel>('Lobby', LobbySchema);

export default LobbyModel;
