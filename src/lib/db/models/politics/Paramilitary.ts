/**
 * @file src/lib/db/models/politics/Paramilitary.ts
 * @description Paramilitary Mongoose schema for armed organizations
 * @created 2025-12-03
 * 
 * OVERVIEW:
 * Mongoose model for paramilitary organizations including military forces,
 * police departments, organized crime groups, PMCs, militias, and security firms.
 * Tracks members, troops, territories, finances (legitimate and illicit),
 * conflicts, and operations.
 * 
 * @author ECHO v1.4.0
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  ParamilitaryType,
  ParamilitaryScope,
  ParamilitaryStatus,
  ParamilitaryMemberRole,
  OperationType,
  ContrabandType,
  ConflictStatus,
  type ParamilitaryMember,
  type TroopUnit,
  type TerritoryControl,
  type ContrabandItem,
  type LaunderingOperation,
  type ActiveConflict,
  type ParamilitaryApplication,
  type OperationRecord,
  type ParamilitaryStrength,
} from '@/lib/types/paramilitary';

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IParamilitary extends Document {
  // Core
  name: string;
  slug: string;
  description: string;
  type: ParamilitaryType;
  scope: ParamilitaryScope;
  stateCode?: string;
  status: ParamilitaryStatus;
  founderId: string;
  bossId: string;
  foundedAt: number;

  // Members & Troops
  members: ParamilitaryMember[];
  memberCount: number;
  troops: TroopUnit[];
  totalTroops: number;
  applications: ParamilitaryApplication[];

  // Finances
  treasury: number;
  dirtyMoney: number;
  weeklyExpenses: number;
  contraband: ContrabandItem[];
  launderingOps: LaunderingOperation[];

  // Territory & Conflict
  territories: TerritoryControl[];
  conflicts: ActiveConflict[];
  operationHistory: OperationRecord[];

  // Risk
  heatLevel: number;
  lawEnforcementAttention: number;
  wantedLevel: number;

  // Metrics
  strength: ParamilitaryStrength;

  // Settings
  recruiting: boolean;
  minimumStandingRequired: number;

  // Metadata
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const ParamilitaryMemberSchema = new Schema<ParamilitaryMember>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: Object.values(ParamilitaryMemberRole),
      default: ParamilitaryMemberRole.RECRUIT,
    },
    joinedAt: { type: Number, required: true },
    operationsCompleted: { type: Number, default: 0, min: 0 },
    standing: { type: Number, default: 50, min: 0, max: 100 },
    profitShare: { type: Number, default: 1, min: 0, max: 100 },
    active: { type: Boolean, default: true },
    personalHeat: { type: Number, default: 0, min: 0, max: 100 },
    lastActiveAt: { type: Number, required: true },
  },
  { _id: false }
);

const TroopUnitSchema = new Schema<TroopUnit>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    effectiveness: { type: Number, default: 50, min: 0, max: 100 },
    locationId: { type: String, required: true },
    deployed: { type: Boolean, default: false },
    assignmentId: { type: String },
    equipmentLevel: { type: Number, default: 1, min: 1, max: 10 },
    morale: { type: Number, default: 70, min: 0, max: 100 },
    trainingLevel: { type: Number, default: 1, min: 1, max: 10 },
  },
  { _id: false }
);

const TerritoryControlSchema = new Schema<TerritoryControl>(
  {
    territoryId: { type: String, required: true },
    controlPercent: { type: Number, required: true, min: 0, max: 100 },
    weeklyIncome: { type: Number, default: 0, min: 0 },
    troopsStationed: { type: Number, default: 0, min: 0 },
    establishedAt: { type: Number, required: true },
    contested: { type: Boolean, default: false },
    contestedBy: { type: String },
  },
  { _id: false }
);

const ContrabandItemSchema = new Schema<ContrabandItem>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(ContrabandType),
    },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    streetValue: { type: Number, required: true, min: 0 },
    quality: { type: Number, default: 50, min: 0, max: 100 },
    acquiredAt: { type: Number, required: true },
  },
  { _id: false }
);

const LaunderingOperationSchema = new Schema<LaunderingOperation>(
  {
    id: { type: String, required: true },
    businessId: { type: String, required: true },
    businessName: { type: String, required: true, trim: true },
    dirtyMoneyInput: { type: Number, default: 0, min: 0 },
    cleanMoneyOutput: { type: Number, default: 0, min: 0 },
    efficiency: { type: Number, default: 0.7, min: 0, max: 1 },
    detectionRisk: { type: Number, default: 0.1, min: 0, max: 1 },
    active: { type: Boolean, default: true },
    establishedAt: { type: Number, required: true },
  },
  { _id: false }
);

const ActiveConflictSchema = new Schema<ActiveConflict>(
  {
    id: { type: String, required: true },
    enemyOrgId: { type: String, required: true },
    enemyOrgName: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(ConflictStatus),
    },
    startedAt: { type: Number, required: true },
    casualtiesSuffered: { type: Number, default: 0, min: 0 },
    casualtiesInflicted: { type: Number, default: 0, min: 0 },
    territoriesLost: { type: Number, default: 0, min: 0 },
    territoriesGained: { type: Number, default: 0, min: 0 },
    initiatedByUs: { type: Boolean, required: true },
  },
  { _id: false }
);

const ParamilitaryApplicationSchema = new Schema<ParamilitaryApplication>(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
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

const OperationRecordSchema = new Schema<OperationRecord>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(OperationType),
    },
    description: { type: String, required: true, trim: true },
    executedAt: { type: Number, required: true },
    success: { type: Boolean, required: true },
    revenue: { type: Number, default: 0 },
    costs: { type: Number, default: 0 },
    heatGenerated: { type: Number, default: 0, min: 0 },
    casualties: { type: Number, default: 0, min: 0 },
    participants: { type: [String], default: [] },
  },
  { _id: false }
);

const ParamilitaryStrengthSchema = new Schema<ParamilitaryStrength>(
  {
    overall: { type: Number, default: 10, min: 0, max: 100 },
    militaryPower: { type: Number, default: 10, min: 0, max: 100 },
    financialStrength: { type: Number, default: 0, min: 0, max: 100 },
    territorialControl: { type: Number, default: 0, min: 0, max: 100 },
    politicalInfluence: { type: Number, default: 0, min: 0, max: 100 },
    notoriety: { type: Number, default: 0, min: 0, max: 100 },
    calculatedAt: { type: Number, required: true },
  },
  { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const ParamilitarySchema = new Schema<IParamilitary>(
  {
    // Core
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: Object.values(ParamilitaryType),
        message: '{VALUE} is not a valid paramilitary type',
      },
      index: true,
    },
    scope: {
      type: String,
      required: [true, 'Scope is required'],
      enum: {
        values: Object.values(ParamilitaryScope),
        message: '{VALUE} is not a valid scope',
      },
      index: true,
    },
    stateCode: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ParamilitaryStatus),
        message: '{VALUE} is not a valid status',
      },
      default: ParamilitaryStatus.ACTIVE,
      index: true,
    },
    founderId: {
      type: String,
      required: [true, 'Founder ID is required'],
      index: true,
    },
    bossId: {
      type: String,
      required: [true, 'Boss ID is required'],
      index: true,
    },
    foundedAt: {
      type: Number,
      required: true,
    },

    // Members & Troops
    members: {
      type: [ParamilitaryMemberSchema],
      default: [],
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    troops: {
      type: [TroopUnitSchema],
      default: [],
    },
    totalTroops: {
      type: Number,
      default: 0,
      min: 0,
    },
    applications: {
      type: [ParamilitaryApplicationSchema],
      default: [],
    },

    // Finances
    treasury: {
      type: Number,
      default: 0,
      min: 0,
    },
    dirtyMoney: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    contraband: {
      type: [ContrabandItemSchema],
      default: [],
    },
    launderingOps: {
      type: [LaunderingOperationSchema],
      default: [],
    },

    // Territory & Conflict
    territories: {
      type: [TerritoryControlSchema],
      default: [],
    },
    conflicts: {
      type: [ActiveConflictSchema],
      default: [],
    },
    operationHistory: {
      type: [OperationRecordSchema],
      default: [],
      // Limit to last 100 operations
      validate: {
        validator: function (v: OperationRecord[]) {
          return v.length <= 100;
        },
        message: 'Operation history cannot exceed 100 records',
      },
    },

    // Risk
    heatLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lawEnforcementAttention: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    wantedLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Metrics
    strength: {
      type: ParamilitaryStrengthSchema,
      required: true,
    },

    // Settings
    recruiting: {
      type: Boolean,
      default: true,
    },
    minimumStandingRequired: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Metadata
    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'paramilitaries',
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
ParamilitarySchema.index({ type: 1, status: 1 });
ParamilitarySchema.index({ scope: 1, stateCode: 1 });
ParamilitarySchema.index({ status: 1, memberCount: -1 });
ParamilitarySchema.index({ 'members.playerId': 1 });
ParamilitarySchema.index({ 'strength.overall': -1 });
ParamilitarySchema.index({ heatLevel: -1 });

// Text index for search
ParamilitarySchema.index({ name: 'text', description: 'text' });

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

ParamilitarySchema.pre<IParamilitary>('save', function (next) {
  // Update member count
  this.memberCount = this.members.filter(m => m.active).length;
  
  // Update total troops
  this.totalTroops = this.troops.reduce((sum, unit) => sum + unit.size, 0);
  
  // Trim operation history to last 100
  if (this.operationHistory.length > 100) {
    this.operationHistory = this.operationHistory.slice(-100);
  }
  
  // Update wanted level based on heat
  this.wantedLevel = Math.floor(this.heatLevel / 20);
  
  next();
});

// ============================================================================
// STATIC METHODS
// ============================================================================

ParamilitarySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug: slug.toLowerCase() });
};

ParamilitarySchema.statics.findByMember = function (playerId: string) {
  return this.find({ 'members.playerId': playerId, status: ParamilitaryStatus.ACTIVE });
};

ParamilitarySchema.statics.findByType = function (type: ParamilitaryType) {
  return this.find({ type, status: ParamilitaryStatus.ACTIVE }).sort({ memberCount: -1 });
};

// ============================================================================
// INSTANCE METHODS
// ============================================================================

ParamilitarySchema.methods.addMember = function (member: ParamilitaryMember) {
  this.members.push(member);
  this.memberCount = this.members.filter((m: ParamilitaryMember) => m.active).length;
};

ParamilitarySchema.methods.removeMember = function (playerId: string) {
  this.members = this.members.filter((m: ParamilitaryMember) => m.playerId !== playerId);
  this.memberCount = this.members.filter((m: ParamilitaryMember) => m.active).length;
};

ParamilitarySchema.methods.addOperation = function (operation: OperationRecord) {
  this.operationHistory.push(operation);
  if (this.operationHistory.length > 100) {
    this.operationHistory.shift(); // Remove oldest
  }
  
  // Update heat based on operation
  this.heatLevel = Math.min(100, this.heatLevel + operation.heatGenerated);
};

ParamilitarySchema.methods.reduceHeat = function (amount: number) {
  this.heatLevel = Math.max(0, this.heatLevel - amount);
  this.wantedLevel = Math.floor(this.heatLevel / 20);
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Paramilitary: Model<IParamilitary> =
  mongoose.models.Paramilitary || mongoose.model<IParamilitary>('Paramilitary', ParamilitarySchema);

export default Paramilitary;
