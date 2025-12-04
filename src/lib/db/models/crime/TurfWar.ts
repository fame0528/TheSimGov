/**
 * @fileoverview TurfWar Model - Gang Territory Conflicts
 * @module models/crime/TurfWar
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 * 
 * OVERVIEW:
 * TurfWar system tracks territorial conflicts between gangs. Wars can be resolved through
 * negotiation, violence, or buyouts. Outcomes affect territory ownership, gang reputation,
 * and member casualties.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type WarMethod = 'Negotiation' | 'Violence' | 'Buyout';
export type WarOutcome = 'ChallengerWins' | 'DefenderWins' | 'Stalemate' | 'Alliance';
export type WarStatus = 'Pending' | 'InProgress' | 'Resolved';

export interface ICasualty {
  userId: mongoose.Types.ObjectId;
  gangId: mongoose.Types.ObjectId;
  status: 'Injured' | 'Arrested' | 'Killed';
  timestamp: Date;
}

export interface ISpoils {
  territoryTransfer: boolean; // Did territory change hands?
  cashSettlement?: number; // Payment to loser
  facilitiesSeized?: mongoose.Types.ObjectId[]; // Facilities taken
  reputationDelta: {
    winner: number;
    loser: number;
  };
}

export interface ITurfWar extends Document {
  challengerGangId: mongoose.Types.ObjectId;
  defenderGangId: mongoose.Types.ObjectId;
  territoryId: mongoose.Types.ObjectId;
  status: WarStatus;
  method?: WarMethod; // Set when initiated
  outcome?: WarOutcome; // Set when resolved
  initiatedBy: mongoose.Types.ObjectId; // User who started war
  initiatedAt: Date;
  resolvedAt?: Date;
  casualties: ICasualty[];
  spoils?: ISpoils;
  negotiationTerms?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  calculateViolenceOutcome(): WarOutcome;
  canResolve(): boolean;
}

const CasualtySchema = new Schema<ICasualty>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  gangId: { type: Schema.Types.ObjectId, ref: 'Gang', required: true },
  status: {
    type: String,
    enum: ['Injured', 'Arrested', 'Killed'],
    required: true
  },
  timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });

const SpoilsSchema = new Schema<ISpoils>({
  territoryTransfer: { type: Boolean, required: true },
  cashSettlement: { type: Number, min: 0 },
  facilitiesSeized: [{ type: Schema.Types.ObjectId, ref: 'ProductionFacility' }],
  reputationDelta: {
    winner: { type: Number, required: true },
    loser: { type: Number, required: true }
  }
}, { _id: false });

const TurfWarSchema = new Schema<ITurfWar>({
  challengerGangId: {
    type: Schema.Types.ObjectId,
    ref: 'Gang',
    required: true,
    index: true
  },
  defenderGangId: {
    type: Schema.Types.ObjectId,
    ref: 'Gang',
    required: true,
    index: true
  },
  territoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Territory',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Resolved'],
    required: true,
    default: 'Pending',
    index: true
  },
  method: {
    type: String,
    enum: ['Negotiation', 'Violence', 'Buyout']
  },
  outcome: {
    type: String,
    enum: ['ChallengerWins', 'DefenderWins', 'Stalemate', 'Alliance']
  },
  initiatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  casualties: {
    type: [CasualtySchema],
    default: []
  },
  spoils: {
    type: SpoilsSchema
  },
  negotiationTerms: {
    challengerOffer: { type: Number, min: 0 },
    defenderDemand: { type: Number, min: 0 },
    acceptedBy: {
      type: String,
      enum: ['Challenger', 'Defender']
    }
  }
}, { timestamps: true });

// Compound indexes for queries
TurfWarSchema.index({ territoryId: 1, status: 1 });
TurfWarSchema.index({ challengerGangId: 1, status: 1 });
TurfWarSchema.index({ defenderGangId: 1, status: 1 });
TurfWarSchema.index({ resolvedAt: -1 }); // Recent wars

// Method: Calculate violence outcome probability
TurfWarSchema.methods.calculateViolenceOutcome = function(
  challengerStrength: number,
  defenderStrength: number
): { winner: 'Challenger' | 'Defender'; casualties: number } {
  const totalStrength = challengerStrength + defenderStrength;
  const challengerWinProb = challengerStrength / totalStrength;
  
  const roll = Math.random();
  const winner = roll < challengerWinProb ? 'Challenger' : 'Defender';
  
  // Casualties proportional to total strength and closeness of fight
  const closeness = Math.abs(challengerStrength - defenderStrength) / totalStrength;
  const baseCasualties = Math.floor((challengerStrength + defenderStrength) / 10);
  const casualties = Math.floor(baseCasualties * (1 - closeness));
  
  return { winner, casualties };
};

// Method: Check if war can be resolved
TurfWarSchema.methods.canResolve = function(): boolean {
  return this.status === 'InProgress' && this.method !== undefined;
};

export const TurfWar: Model<ITurfWar> = mongoose.models.TurfWar || mongoose.model<ITurfWar>('TurfWar', TurfWarSchema);

export default TurfWar;
