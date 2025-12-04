/**
 * @file lib/db/models/LobbyingAction.ts
 * @description Legislative lobbying action tracking schema
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Tracks lobbying efforts by companies to influence legislation.
 * Level 4+ companies can lobby for favorable laws and regulations.
 * Success depends on company level, influence points, and lobbying power.
 *
 * USAGE:
 * ```typescript
 * import LobbyingAction from '@/lib/db/models/LobbyingAction';
 *
 * // Record lobbying action
 * const lobby = await LobbyingAction.create({
 *   company: companyId,
 *   targetLegislation: 'Clean Energy Tax Credits',
 *   legislationType: 'Tax',
 *   influencePointsCost: 25,
 *   successProbability: 65,
 *   status: 'Pending'
 * });
 *
 * // Get company lobbying history
 * const actions = await LobbyingAction.find({ company: companyId })
 *   .sort({ initiatedAt: -1 });
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LegislationType = 'Tax' | 'Regulation' | 'Subsidy' | 'Trade' | 'Labor' | 'Environment';
export type LobbyingStatus = 'Pending' | 'Successful' | 'Failed';

/**
 * Lobbying action document interface
 */
export interface ILobbyingAction extends Document {
  company?: Types.ObjectId;
  targetLegislation: string;
  legislationType: LegislationType;
  influencePointsCost: number;
  successProbability: number;
  status: LobbyingStatus;
  outcome?: {
    effectType: string;
    effectValue: number;
    duration: number; // months
  };
  initiatedAt: Date;
  resolvedAt?: Date;
}

/**
 * Lobbying action schema
 */
const LobbyingActionSchema = new Schema<ILobbyingAction>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      // optional to support general lobbying intents
    },
    targetLegislation: {
      type: String,
      required: [true, 'Target legislation is required'],
      trim: true,
      minlength: [5, 'Legislation name must be at least 5 characters'],
      maxlength: [200, 'Legislation name cannot exceed 200 characters'],
    },
    legislationType: {
      type: String,
      required: [true, 'Legislation type is required'],
      enum: {
        values: ['Tax', 'Regulation', 'Subsidy', 'Trade', 'Labor', 'Environment'],
        message: '{VALUE} is not a valid legislation type',
      },
    },
    influencePointsCost: {
      type: Number,
      required: [true, 'Influence points cost is required'],
      min: [1, 'Minimum influence points cost is 1'],
    },
    successProbability: {
      type: Number,
      required: [true, 'Success probability is required'],
      min: [0, 'Success probability cannot be below 0'],
      max: [100, 'Success probability cannot exceed 100'],
    },
    status: {
      type: String,
      required: true,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Successful', 'Failed'],
        message: '{VALUE} is not a valid status',
      },
      index: true,
    },
    outcome: {
      effectType: {
        type: String,
        // e.g., 'taxReduction', 'subsidyGrant', 'regulationRemoval'
      },
      effectValue: {
        type: Number,
        // e.g., -5 (tax reduction), +100000 (subsidy amount)
      },
      duration: {
        type: Number,
        // Duration in months
        min: [1, 'Minimum duration is 1 month'],
      },
    },
    initiatedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
      // Set when status changes to Successful/Failed
    },
  },
  {
    timestamps: true,
    collection: 'lobbying_actions',
  }
);

// Compound indexes for efficient queries
LobbyingActionSchema.index({ company: 1, initiatedAt: -1 });
LobbyingActionSchema.index({ status: 1, resolvedAt: -1 });

const LobbyingAction: Model<ILobbyingAction> =
  mongoose.models.LobbyingAction ||
  mongoose.model<ILobbyingAction>('LobbyingAction', LobbyingActionSchema);

export default LobbyingAction;