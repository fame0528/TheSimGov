/**
 * @file src/lib/db/models/empire/Synergy.ts
 * @description Synergy Mongoose model for empire synergy definitions
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Stores synergy definitions - the rules for how industries connect.
 * These are game configuration, not player data. Players "activate"
 * synergies by owning companies in the required industries.
 *
 * SYNERGY TYPES:
 * - Basic (2 industries): Easy to achieve, modest bonuses
 * - Advanced (3 industries): Meaningful progression milestone
 * - Elite (4 industries): Significant empire, major bonuses
 * - Ultimate (5+ industries): End-game domination
 *
 * GAMEPLAY:
 * - Player owns Bank + Tech Company → Fintech Empire synergy activates
 * - Synergy provides: -15% loan rates, +20% automation efficiency
 * - Stacking synergies creates compound growth
 *
 * USAGE:
 * import Synergy from '@/lib/db/models/empire/Synergy';
 * const synergies = await Synergy.findByIndustries([EmpireIndustry.BANKING, EmpireIndustry.TECH]);
 */

import mongoose, { Schema, Document, Model, HydratedDocument } from 'mongoose';
import {
  EmpireIndustry,
  SynergyTier,
  SynergyBonusType,
  SynergyBonusTarget,
  SynergyBonus,
} from '@/lib/types/empire';

/**
 * Synergy bonus subdocument interface
 */
export interface ISynergyBonus {
  type: SynergyBonusType;
  target: SynergyBonusTarget;
  value: number;
  appliesToIndustry?: EmpireIndustry;
  description: string;
}

/**
 * Synergy document interface
 */
export interface ISynergy extends Document {
  // Identity
  synergyId: string;              // Unique string ID (e.g., 'fintech-empire')
  name: string;                   // Display name
  description: string;            // What this synergy does
  
  // Requirements
  requiredIndustries: EmpireIndustry[];
  tier: SynergyTier;
  unlockLevel: number;            // Min empire level to activate
  
  // Bonuses
  bonuses: ISynergyBonus[];
  
  // UI
  icon: string;                   // Icon name or path
  color: string;                  // Theme color hex
  
  // Metadata
  isActive: boolean;              // Can players unlock this?
  sortOrder: number;              // Display order
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Synergy model with static methods
 */
export interface ISynergyModel extends Model<ISynergy> {
  findByIndustries(industries: EmpireIndustry[]): Promise<HydratedDocument<ISynergy>[]>;
  findByTier(tier: SynergyTier): Promise<HydratedDocument<ISynergy>[]>;
  getActiveSynergies(): Promise<HydratedDocument<ISynergy>[]>;
  findBySynergyId(synergyId: string): Promise<HydratedDocument<ISynergy> | null>;
}

/**
 * Synergy bonus schema
 */
const SynergyBonusSchema = new Schema<ISynergyBonus>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(SynergyBonusType),
    },
    target: {
      type: String,
      required: true,
      enum: Object.values(SynergyBonusTarget),
    },
    value: {
      type: Number,
      required: true,
    },
    appliesToIndustry: {
      type: String,
      enum: Object.values(EmpireIndustry),
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Synergy schema
 */
const SynergySchema = new Schema<ISynergy>(
  {
    synergyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    requiredIndustries: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length >= 2;
        },
        message: 'Synergy must require at least 2 industries',
      },
      enum: Object.values(EmpireIndustry),
    },
    tier: {
      type: String,
      required: true,
      enum: Object.values(SynergyTier),
      index: true,
    },
    unlockLevel: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 100,
    },
    bonuses: {
      type: [SynergyBonusSchema],
      required: true,
      validate: {
        validator: function (v: ISynergyBonus[]) {
          return v.length >= 1;
        },
        message: 'Synergy must have at least 1 bonus',
      },
    },
    icon: {
      type: String,
      default: 'sparkles',
    },
    color: {
      type: String,
      default: '#6366f1',
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
SynergySchema.index({ requiredIndustries: 1 });
SynergySchema.index({ tier: 1, sortOrder: 1 });
SynergySchema.index({ isActive: 1, tier: 1 });

/**
 * Static: Find synergies that can be activated by given industries
 */
SynergySchema.statics.findByIndustries = async function (
  industries: EmpireIndustry[]
): Promise<HydratedDocument<ISynergy>[]> {
  // Find synergies where ALL required industries are in the provided set
  return this.find({
    isActive: true,
    requiredIndustries: { $not: { $elemMatch: { $nin: industries } } },
  }).sort({ tier: 1, sortOrder: 1 });
};

/**
 * Static: Find synergies by tier
 */
SynergySchema.statics.findByTier = async function (
  tier: SynergyTier
): Promise<HydratedDocument<ISynergy>[]> {
  return this.find({ tier, isActive: true }).sort({ sortOrder: 1 });
};

/**
 * Static: Get all active synergies
 */
SynergySchema.statics.getActiveSynergies = async function (): Promise<
  HydratedDocument<ISynergy>[]
> {
  return this.find({ isActive: true }).sort({ tier: 1, sortOrder: 1 });
};

/**
 * Static: Find by synergy ID
 */
SynergySchema.statics.findBySynergyId = async function (
  synergyId: string
): Promise<HydratedDocument<ISynergy> | null> {
  return this.findOne({ synergyId: synergyId.toLowerCase() });
};

// Create and export the model
const Synergy =
  (mongoose.models.Synergy as ISynergyModel) ||
  mongoose.model<ISynergy, ISynergyModel>('Synergy', SynergySchema);

export default Synergy;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Synergy ID**: String-based ID (e.g., 'fintech-empire') for easier
 *    reference in code and seeding
 *
 * 2. **Required Industries**: Array that must ALL be owned to activate
 *    the synergy - MongoDB query finds where player has all required
 *
 * 3. **Tier System**: BASIC (2) → ADVANCED (3) → ELITE (4) → ULTIMATE (5+)
 *    provides natural progression
 *
 * 4. **Multiple Bonuses**: Each synergy can grant multiple bonuses,
 *    allowing complex effects (cost reduction + revenue boost)
 *
 * 5. **Unlock Level**: Gates powerful synergies behind empire progression
 *
 * USAGE:
 * ```typescript
 * import Synergy from '@/lib/db/models/empire/Synergy';
 *
 * // Find synergies player can activate
 * const playerIndustries = [EmpireIndustry.BANKING, EmpireIndustry.TECH];
 * const available = await Synergy.findByIndustries(playerIndustries);
 *
 * // Get all basic synergies
 * const basics = await Synergy.findByTier(SynergyTier.BASIC);
 * ```
 */
