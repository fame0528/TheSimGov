/**
 * @file src/lib/db/models/politics/Union.ts
 * @description Mongoose model for Labor Unions
 * @module lib/db/models/politics/Union
 * 
 * OVERVIEW:
 * Database model for labor unions and worker organizations.
 * Unions organize workers, negotiate contracts, engage in collective
 * actions, and participate in political activities.
 * 
 * COLLECTIONS:
 * - unions: Main union documents with embedded members, contracts, actions
 * 
 * INDEXES:
 * - sector + status: Filter by industry and active status
 * - scope + stateCode: Geographic filtering
 * - presidentId: Find unions by leader
 * - slug: URL-friendly lookup
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  UnionSector,
  UnionScope,
  UnionStatus,
  UnionMemberRole,
  CollectiveAction,
  ActionStatus,
  ContractType,
  type UnionMember,
  type UnionApplication,
  type UnionIssuePosition,
  type UnionEndorsement,
  type UnionLegislativePosition,
  type CollectiveActionRecord,
  type LaborContract,
  type UnionStrength,
  type UnionDuesConfig,
  type UnionFinances,
  type UnionRelationship,
} from '@/lib/types/union';
import { PoliticalIssue } from '@/lib/types/demographics';

// ===================== SUB-SCHEMAS =====================

/**
 * Union member sub-schema
 */
const UnionMemberSchema = new Schema<UnionMember>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: Object.values(UnionMemberRole), required: true },
    workplace: { type: String },
    jobTitle: { type: String },
    joinedAt: { type: Number, required: true },
    totalDuesPaid: { type: Number, default: 0 },
    standing: { type: Number, default: 50, min: 0, max: 100 },
    meetingsAttended: { type: Number, default: 0 },
    actionsParticipated: { type: Number, default: 0 },
    lastActiveAt: { type: Number, required: true },
    duesPaidCurrentCycle: { type: Boolean, default: false },
    isOfficer: { type: Boolean, default: false },
    electedAt: { type: Number },
    termEnds: { type: Number },
  },
  { _id: false }
);

/**
 * Application sub-schema
 */
const UnionApplicationSchema = new Schema<UnionApplication>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    workplace: { type: String, required: true },
    jobTitle: { type: String, required: true },
    appliedAt: { type: Number, required: true },
    message: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedBy: { type: String },
    reviewedAt: { type: Number },
    rejectionReason: { type: String },
  },
  { _id: false }
);

/**
 * Issue position sub-schema
 */
const UnionIssuePositionSchema = new Schema<UnionIssuePosition>(
  {
    issue: { type: String, enum: Object.values(PoliticalIssue), required: true },
    position: { type: Number, required: true, min: -5, max: 5 },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    statement: { type: String },
    adoptedAt: { type: Number, required: true },
    votedOn: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Endorsement sub-schema
 */
const UnionEndorsementSchema = new Schema<UnionEndorsement>(
  {
    candidateId: { type: String, required: true },
    candidateName: { type: String, required: true },
    race: { type: String, required: true },
    electionId: { type: String, required: true },
    endorsedAt: { type: Number, required: true },
    endorsementLevel: { type: String, enum: ['FULL', 'CONDITIONAL', 'NO_ENDORSEMENT'], required: true },
    statement: { type: String },
    donationAmount: { type: Number },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Legislative position sub-schema
 */
const UnionLegislativePositionSchema = new Schema<UnionLegislativePosition>(
  {
    billId: { type: String, required: true },
    billTitle: { type: String, required: true },
    position: { type: String, enum: ['SUPPORT', 'OPPOSE', 'NEUTRAL', 'WATCHING'], required: true },
    priority: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    statement: { type: String },
    lobbyingBudget: { type: Number },
    adoptedAt: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * External support sub-schema for collective actions
 */
const ExternalSupportSchema = new Schema(
  {
    unionId: { type: String, required: true },
    unionName: { type: String, required: true },
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ['FINANCIAL', 'SOLIDARITY', 'BOTH'], default: 'SOLIDARITY' },
  },
  { _id: false }
);

/**
 * Collective action outcome sub-schema
 */
const ActionOutcomeSchema = new Schema(
  {
    success: { type: Boolean, required: true },
    demandsMetPct: { type: Number, default: 0 },
    concessions: [{ type: String }],
    memberSacrifices: [{ type: String }],
    publicOpinionImpact: { type: Number, default: 0 },
    economicImpact: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Collective action sub-schema
 */
const CollectiveActionRecordSchema = new Schema<CollectiveActionRecord>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: Object.values(CollectiveAction), required: true },
    status: { type: String, enum: Object.values(ActionStatus), required: true },
    targetEmployers: [{ type: String }],
    targetIndustry: { type: String, enum: Object.values(UnionSector) },
    proposedAt: { type: Number, required: true },
    voteStartedAt: { type: Number },
    voteEndedAt: { type: Number },
    startedAt: { type: Number },
    endedAt: { type: Number },
    votesFor: { type: Number, default: 0 },
    votesAgainst: { type: Number, default: 0 },
    votesAbstain: { type: Number, default: 0 },
    requiredApproval: { type: Number, default: 66 },
    participantCount: { type: Number, default: 0 },
    expectedParticipants: { type: Number, default: 0 },
    demands: [{ type: String }],
    outcome: ActionOutcomeSchema,
    strikesFundUsed: { type: Number, default: 0 },
    externalSupport: [ExternalSupportSchema],
  },
  { _id: false }
);

/**
 * Labor contract sub-schema
 */
const LaborContractSchema = new Schema<LaborContract>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: Object.values(ContractType), required: true },
    employerId: { type: String, required: true },
    employerName: { type: String, required: true },
    effectiveDate: { type: Number, required: true },
    expirationDate: { type: Number, required: true },
    wageIncreasePct: { type: Number, default: 0 },
    minimumWage: { type: Number },
    costOfLivingAdjustment: { type: Boolean, default: false },
    healthcareCoverage: { type: String, enum: ['NONE', 'BASIC', 'STANDARD', 'PREMIUM'], default: 'NONE' },
    pensionContributionPct: { type: Number, default: 0 },
    paidTimeOffDays: { type: Number, default: 0 },
    sickDays: { type: Number, default: 0 },
    parentalLeaveDays: { type: Number, default: 0 },
    workweekHours: { type: Number, default: 40 },
    overtimeRate: { type: Number, default: 1.5 },
    safetyProvisions: [{ type: String }],
    justCauseTermination: { type: Boolean, default: false },
    seniorityProtections: { type: Boolean, default: false },
    layoffNoticeWeeks: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'NEGOTIATING', 'RATIFIED', 'EXPIRED', 'TERMINATED'], default: 'DRAFT' },
    ratifiedAt: { type: Number },
    memberApprovalPct: { type: Number },
    negotiatedBy: [{ type: String }],
  },
  { _id: false }
);

/**
 * Union strength sub-schema
 */
const UnionStrengthSchema = new Schema<UnionStrength>(
  {
    overall: { type: Number, default: 0 },
    membershipScore: { type: Number, default: 0 },
    densityScore: { type: Number, default: 0 },
    treasuryScore: { type: Number, default: 0 },
    contractStrength: { type: Number, default: 0 },
    politicalInfluence: { type: Number, default: 0 },
    actionCapacity: { type: Number, default: 0 },
    solidarityScore: { type: Number, default: 0 },
    calculatedAt: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Dues config sub-schema
 */
const UnionDuesConfigSchema = new Schema<UnionDuesConfig>(
  {
    amountPerCycle: { type: Number, default: 50 },
    cycleDays: { type: Number, default: 30 },
    percentageOfWages: { type: Number },
    gracePeriodDays: { type: Number, default: 14 },
    mandatory: { type: Boolean, default: true },
    reducedRateForUnemployed: { type: Boolean, default: true },
    strikeFundAllocation: { type: Number, default: 20 },
  },
  { _id: false }
);

/**
 * Finances sub-schema
 */
const UnionFinancesSchema = new Schema<UnionFinances>(
  {
    generalFund: { type: Number, default: 0 },
    strikeFund: { type: Number, default: 0 },
    politicalActionFund: { type: Number, default: 0 },
    educationFund: { type: Number, default: 0 },
    emergencyFund: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    monthlyExpenses: { type: Number, default: 0 },
    lastAuditDate: { type: Number },
  },
  { _id: false }
);

/**
 * Relationship sub-schema
 */
const UnionRelationshipSchema = new Schema<UnionRelationship>(
  {
    unionId: { type: String, required: true },
    unionName: { type: String, required: true },
    type: { type: String, enum: ['FEDERATION', 'AFFILIATE', 'RIVAL', 'ALLY', 'NEUTRAL'], default: 'NEUTRAL' },
    relationship: { type: Number, default: 0, min: -100, max: 100 },
    mutualAidAgreement: { type: Boolean, default: false },
    establishedAt: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Headquarters sub-schema
 */
const HeadquartersSchema = new Schema(
  {
    address: { type: String },
    city: { type: String, required: true },
    stateCode: { type: String, required: true },
    zipCode: { type: String },
  },
  { _id: false }
);

// ===================== MAIN SCHEMA =====================

/**
 * Document interface for Union
 */
export interface UnionDocument extends Document {
  name: string;
  slug: string;
  acronym?: string;
  description: string;
  motto?: string;
  sector: UnionSector;
  scope: UnionScope;
  status: UnionStatus;
  stateCode?: string;
  headquarters: {
    address?: string;
    city: string;
    stateCode: string;
    zipCode?: string;
  };
  founderId: string;
  presidentId: string;
  foundedAt: number;
  members: UnionMember[];
  memberCount: number;
  potentialMembers: number;
  applications: UnionApplication[];
  finances: UnionFinances;
  duesConfig: UnionDuesConfig;
  issuePositions: UnionIssuePosition[];
  endorsements: UnionEndorsement[];
  legislativePositions: UnionLegislativePosition[];
  actions: CollectiveActionRecord[];
  lastStrike?: number;
  strikeDaysThisYear: number;
  contracts: LaborContract[];
  activeContractCount: number;
  strength: UnionStrength;
  relationships: UnionRelationship[];
  federationId?: string;
  affiliateUnionIds: string[];
  isPublic: boolean;
  membershipOpen: boolean;
  requiresWorkplaceVerification: boolean;
  minimumStandingRequired: number;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  
  // Virtuals
  isActive: boolean;
  isStriking: boolean;
  totalTreasury: number;
  
  // Methods
  addMember(member: UnionMember): Promise<void>;
  removeMember(playerId: string): Promise<boolean>;
  calculateStrength(): UnionStrength;
}

/**
 * Main Union schema
 */
const UnionSchema = new Schema<UnionDocument>(
  {
    // Identity
    name: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true },
    acronym: { type: String, maxlength: 20 },
    description: { type: String, required: true, maxlength: 2000 },
    motto: { type: String, maxlength: 200 },
    
    // Classification
    sector: { type: String, enum: Object.values(UnionSector), required: true },
    scope: { type: String, enum: Object.values(UnionScope), required: true },
    status: { type: String, enum: Object.values(UnionStatus), default: UnionStatus.ORGANIZING },
    
    // Location
    stateCode: { type: String, maxlength: 2 },
    headquarters: { type: HeadquartersSchema, required: true },
    
    // Leadership
    founderId: { type: String, required: true },
    presidentId: { type: String, required: true },
    foundedAt: { type: Number, required: true },
    
    // Membership
    members: [UnionMemberSchema],
    memberCount: { type: Number, default: 0 },
    potentialMembers: { type: Number, default: 0 },
    applications: [UnionApplicationSchema],
    
    // Finances
    finances: { type: UnionFinancesSchema, default: () => ({}) },
    duesConfig: { type: UnionDuesConfigSchema, default: () => ({}) },
    
    // Political activity
    issuePositions: [UnionIssuePositionSchema],
    endorsements: [UnionEndorsementSchema],
    legislativePositions: [UnionLegislativePositionSchema],
    
    // Collective action
    actions: [CollectiveActionRecordSchema],
    lastStrike: { type: Number },
    strikeDaysThisYear: { type: Number, default: 0 },
    
    // Contracts
    contracts: [LaborContractSchema],
    activeContractCount: { type: Number, default: 0 },
    
    // Strength
    strength: { type: UnionStrengthSchema, default: () => ({ calculatedAt: Date.now() }) },
    
    // Relationships
    relationships: [UnionRelationshipSchema],
    federationId: { type: String },
    affiliateUnionIds: [{ type: String }],
    
    // Settings
    isPublic: { type: Boolean, default: true },
    membershipOpen: { type: Boolean, default: true },
    requiresWorkplaceVerification: { type: Boolean, default: false },
    minimumStandingRequired: { type: Number, default: 0 },
    
    // Metadata
    schemaVersion: { type: Number, default: 1 },
    createdAt: { type: Number, default: () => Date.now() },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  {
    collection: 'unions',
    timestamps: false, // We use custom timestamps
  }
);

// ===================== INDEXES =====================

// Core lookups
UnionSchema.index({ slug: 1 });
UnionSchema.index({ sector: 1, status: 1 });
UnionSchema.index({ scope: 1, stateCode: 1 });
UnionSchema.index({ presidentId: 1 });
UnionSchema.index({ status: 1 });

// Member queries
UnionSchema.index({ 'members.playerId': 1 });

// Text search
UnionSchema.index({ name: 'text', description: 'text', acronym: 'text' });

// ===================== VIRTUALS =====================

/**
 * Check if union is in an active state
 */
UnionSchema.virtual('isActive').get(function (this: UnionDocument) {
  return [UnionStatus.ACTIVE, UnionStatus.STRIKING, UnionStatus.NEGOTIATING].includes(this.status);
});

/**
 * Check if currently on strike
 */
UnionSchema.virtual('isStriking').get(function (this: UnionDocument) {
  return this.status === UnionStatus.STRIKING;
});

/**
 * Total treasury across all funds
 */
UnionSchema.virtual('totalTreasury').get(function (this: UnionDocument) {
  const f = this.finances;
  return (f.generalFund || 0) + (f.strikeFund || 0) + (f.politicalActionFund || 0) + 
         (f.educationFund || 0) + (f.emergencyFund || 0);
});

// ===================== METHODS =====================

/**
 * Add a new member to the union
 */
UnionSchema.methods.addMember = async function (member: UnionMember): Promise<void> {
  this.members.push(member);
  this.memberCount = this.members.length;
  await this.save();
};

/**
 * Remove a member from the union
 */
UnionSchema.methods.removeMember = async function (playerId: string): Promise<boolean> {
  const initialLength = this.members.length;
  this.members = this.members.filter((m: UnionMember) => m.playerId !== playerId);
  
  if (this.members.length < initialLength) {
    this.memberCount = this.members.length;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Calculate union strength based on various factors
 */
UnionSchema.methods.calculateStrength = function (): UnionStrength {
  const membershipScore = Math.min(100, this.memberCount * 2);
  const densityScore = this.potentialMembers > 0 
    ? Math.min(100, (this.memberCount / this.potentialMembers) * 100)
    : 0;
  
  const totalTreasury = this.finances.generalFund + this.finances.strikeFund + 
                        this.finances.politicalActionFund;
  const treasuryScore = Math.min(100, totalTreasury / 10000);
  
  const ratifiedContracts = this.contracts.filter(
    (c: LaborContract) => c.status === 'RATIFIED'
  ).length;
  const contractStrength = Math.min(100, ratifiedContracts * 20);
  
  const activeEndorsements = this.endorsements.filter((e: UnionEndorsement) => e.active).length;
  const politicalInfluence = Math.min(100, activeEndorsements * 10 + 
                                       this.legislativePositions.length * 5);
  
  const recentActions = this.actions.filter(
    (a: CollectiveActionRecord) => a.status === ActionStatus.RESOLVED && a.outcome?.success
  ).length;
  const actionCapacity = Math.min(100, recentActions * 15 + 
                                  (this.finances.strikeFund / 5000));
  
  const allies = this.relationships.filter(
    (r: UnionRelationship) => r.type === 'ALLY' || r.type === 'FEDERATION'
  ).length;
  const solidarityScore = Math.min(100, allies * 15 + 
                                   (this.federationId ? 20 : 0));
  
  const overall = Math.round(
    (membershipScore * 0.20 +
     densityScore * 0.15 +
     treasuryScore * 0.15 +
     contractStrength * 0.20 +
     politicalInfluence * 0.10 +
     actionCapacity * 0.10 +
     solidarityScore * 0.10)
  );
  
  const strength: UnionStrength = {
    overall,
    membershipScore: Math.round(membershipScore),
    densityScore: Math.round(densityScore),
    treasuryScore: Math.round(treasuryScore),
    contractStrength: Math.round(contractStrength),
    politicalInfluence: Math.round(politicalInfluence),
    actionCapacity: Math.round(actionCapacity),
    solidarityScore: Math.round(solidarityScore),
    calculatedAt: Date.now(),
  };
  
  this.strength = strength;
  return strength;
};

// ===================== MIDDLEWARE =====================

/**
 * Pre-save: Update timestamps, member count, contract count, and recalculate strength
 */
UnionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.memberCount = this.members.length;
  this.activeContractCount = this.contracts.filter(
    (c: LaborContract) => c.status === 'RATIFIED' && c.expirationDate > Date.now()
  ).length;
  
  // Recalculate strength on save
  this.calculateStrength();
  
  next();
});

// ===================== STATICS =====================

/**
 * Static methods interface
 */
interface UnionModel extends Model<UnionDocument> {
  findByPresident(presidentId: string): Promise<UnionDocument[]>;
  findBySector(sector: UnionSector): Promise<UnionDocument[]>;
}

/**
 * Find unions by president ID
 */
UnionSchema.statics.findByPresident = async function (presidentId: string): Promise<UnionDocument[]> {
  return this.find({ presidentId, status: { $ne: UnionStatus.DISSOLVED } });
};

/**
 * Find unions by sector
 */
UnionSchema.statics.findBySector = async function (sector: UnionSector): Promise<UnionDocument[]> {
  return this.find({ sector, status: { $in: [UnionStatus.ACTIVE, UnionStatus.STRIKING, UnionStatus.NEGOTIATING] } });
};

// ===================== EXPORT =====================

const Union = (mongoose.models.Union as UnionModel) || 
  mongoose.model<UnionDocument, UnionModel>('Union', UnionSchema);

export default Union;
