/**
 * @fileoverview Gang Model - MMO Social Layer
 * @module models/crime/Gang
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * OVERVIEW:
 * Gang/Cartel system for Crime domain MMO gameplay. Supports player-led organizations
 * with member management, territory control, shared resources, and faction relationships.
 * Enables cooperative criminal operations and turf wars.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type GangStatus = 'Active' | 'Disbanded' | 'War';
export type MemberRank = 'Founder' | 'Officer' | 'Member' | 'Recruit';
export type MemberRole = 'Leader' | 'Enforcer' | 'Dealer' | 'Chemist' | 'Driver' | 'Accountant';

export interface IGangMember {
  userId: mongoose.Types.ObjectId;
  rank: MemberRank;
  role?: MemberRole;
  joinedAt: Date;
  contributionScore?: number; // For merit tracking
}

export interface IRivalry {
  gangId: mongoose.Types.ObjectId;
  hostilityLevel: number; // 0-100
  incidents: number;
  lastIncident?: Date;
}

export interface IGang extends Document {
  name: string;
  tag: string; // Abbreviation/call sign (3-6 chars)
  leaderId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId; // Optional company affiliation
  members: IGangMember[];
  territories: mongoose.Types.ObjectId[]; // refs Territory
  reputation: number; // -100 to 100
  factionAlliances: Map<string, string>; // factionId -> status (Allied/Neutral/Hostile)
  bankroll: number; // Shared gang funds
  facilities: mongoose.Types.ObjectId[]; // refs ProductionFacility
  rivalries: IRivalry[];
  status: GangStatus;
  color?: string; // Display color for territory map (hex code)
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isMember(userId: string): boolean;
  hasRank(userId: string, minRank: MemberRank): boolean;
  getMember(userId: string): IGangMember | undefined;
}

const GangMemberSchema = new Schema<IGangMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rank: { 
    type: String, 
    enum: ['Founder', 'Officer', 'Member', 'Recruit'], 
    required: true,
    default: 'Recruit'
  },
  role: { 
    type: String, 
    enum: ['Leader', 'Enforcer', 'Dealer', 'Chemist', 'Driver', 'Accountant']
  },
  joinedAt: { type: Date, required: true, default: Date.now },
  contributionScore: { type: Number, default: 0, min: 0 }
}, { _id: false });

const RivalrySchema = new Schema<IRivalry>({
  gangId: { type: Schema.Types.ObjectId, ref: 'Gang', required: true },
  hostilityLevel: { type: Number, required: true, min: 0, max: 100, default: 0 },
  incidents: { type: Number, required: true, default: 0 },
  lastIncident: { type: Date }
}, { _id: false });

const GangSchema = new Schema<IGang>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 3,
    maxlength: 50,
    index: true
  },
  tag: { 
    type: String, 
    required: true, 
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 6,
    unique: true,
    index: true
  },
  leaderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company',
    index: true
  },
  members: { 
    type: [GangMemberSchema], 
    default: [],
    validate: {
      validator: function(members: IGangMember[]) {
        return members.length <= 100; // Max 100 members per gang
      },
      message: 'Gang cannot exceed 100 members'
    }
  },
  territories: { 
    type: [{ type: Schema.Types.ObjectId, ref: 'Territory' }], 
    default: [],
    validate: {
      validator: function(territories: mongoose.Types.ObjectId[]) {
        return territories.length <= 30; // Max 30 territories per gang
      },
      message: 'Gang cannot control more than 30 territories'
    }
  },
  reputation: { 
    type: Number, 
    required: true, 
    default: 0,
    min: -100,
    max: 100
  },
  factionAlliances: { 
    type: Map, 
    of: String,
    default: new Map()
  },
  bankroll: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  facilities: { 
    type: [{ type: Schema.Types.ObjectId, ref: 'ProductionFacility' }], 
    default: []
  },
  rivalries: { 
    type: [RivalrySchema], 
    default: []
  },
  status: { 
    type: String, 
    enum: ['Active', 'Disbanded', 'War'], 
    required: true, 
    default: 'Active',
    index: true
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i, // Hex color validation
    default: '#3B82F6' // Default blue
  }
}, { timestamps: true });

// Compound indexes for common queries
GangSchema.index({ leaderId: 1, status: 1 });
GangSchema.index({ status: 1, reputation: -1 }); // Leaderboard queries
GangSchema.index({ 'members.userId': 1 }); // Member lookup

// Virtual for member count
GangSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for territory count
GangSchema.virtual('territoryCount').get(function() {
  return this.territories.length;
});

// Method: Check if user is member
GangSchema.methods.isMember = function(userId: string): boolean {
  return this.members.some((m: IGangMember) => m.userId.toString() === userId);
};

// Method: Check if user has rank (hierarchy check)
GangSchema.methods.hasRank = function(userId: string, minRank: MemberRank): boolean {
  const rankHierarchy: MemberRank[] = ['Recruit', 'Member', 'Officer', 'Founder'];
  const member = this.members.find((m: IGangMember) => m.userId.toString() === userId);
  if (!member) return false;
  
  const memberRankIndex = rankHierarchy.indexOf(member.rank);
  const minRankIndex = rankHierarchy.indexOf(minRank);
  
  return memberRankIndex >= minRankIndex;
};

// Method: Get member by userId
GangSchema.methods.getMember = function(userId: string): IGangMember | undefined {
  return this.members.find((m: IGangMember) => m.userId.toString() === userId);
};

export const Gang: Model<IGang> = mongoose.models.Gang || mongoose.model<IGang>('Gang', GangSchema);

export default Gang;
