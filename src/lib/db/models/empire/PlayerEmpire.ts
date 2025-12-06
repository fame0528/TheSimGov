/**
 * @file src/lib/db/models/empire/PlayerEmpire.ts
 * @description PlayerEmpire Mongoose model tracking player's interconnected business empire
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Central model aggregating all companies owned by a player into a single empire.
 * Tracks active synergies, calculates combined bonuses, and manages empire progression.
 *
 * THE VISION:
 * As players acquire companies across industries, synergies create compound growth.
 * This model is the hub that calculates and applies all those bonuses.
 *
 * FEATURES:
 * - Company ownership tracking with industry classification
 * - Active synergy management
 * - Empire-wide statistics (total value, revenue, etc.)
 * - Empire level progression with unlocks
 * - Synergy multiplier calculations
 *
 * USAGE:
 * import PlayerEmpire from '@/lib/db/models/empire/PlayerEmpire';
 * const empire = await PlayerEmpire.getOrCreate(userId);
 * await empire.addCompany(companyId, EmpireIndustry.BANKING);
 * await empire.recalculateSynergies();
 */

import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
import {
  EmpireIndustry,
  SynergyTier,
  SynergyBonusTarget,
  CalculatedBonus,
  EmpireStats,
} from '@/lib/types/empire';

/**
 * Empire company subdocument
 */
export interface IEmpireCompany {
  companyId: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  revenue: number;
  value: number;
  isHeadquarters: boolean;
  addedAt: Date;
}

/**
 * Active synergy subdocument
 */
export interface IActiveSynergy {
  synergyId: string;
  synergyName: string;
  tier: SynergyTier;
  activatedAt: Date;
  contributingCompanyIds: string[];
  bonuses: ICalculatedBonus[];
}

/**
 * Calculated bonus subdocument
 */
export interface ICalculatedBonus {
  target: SynergyBonusTarget;
  baseValue: number;
  multiplier: number;
  finalValue: number;
  description: string;
}

/**
 * PlayerEmpire document interface
 */
export interface IPlayerEmpire extends Document {
  // Identity
  userId: string;
  name: string;                          // Empire name (optional)
  
  // Companies
  companies: IEmpireCompany[];
  
  // Synergies
  activeSynergies: IActiveSynergy[];
  
  // Aggregated Stats
  totalValue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  industryCount: number;
  
  // Empire Progression
  empireLevel: number;
  empireXp: number;
  synergyMultiplier: number;             // Global bonus from level + synergies
  
  // Timestamps
  lastSynergyCalculation: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addCompany(companyId: string, name: string, industry: EmpireIndustry, level: number, revenue: number, value: number): Promise<HydratedDocument<IPlayerEmpire>>;
  removeCompany(companyId: string): Promise<HydratedDocument<IPlayerEmpire>>;
  updateCompanyStats(companyId: string, updates: Partial<IEmpireCompany>): Promise<HydratedDocument<IPlayerEmpire>>;
  getIndustries(): EmpireIndustry[];
  hasIndustry(industry: EmpireIndustry): boolean;
  getStats(): EmpireStats;
  addXp(amount: number): Promise<{ leveledUp: boolean; newLevel?: number }>;
  recalculateAggregates(): void;
  setHeadquarters(companyId: string): Promise<HydratedDocument<IPlayerEmpire>>;
}

/**
 * PlayerEmpire model with static methods
 */
export interface IPlayerEmpireModel extends Model<IPlayerEmpire> {
  getOrCreate(userId: string): Promise<HydratedDocument<IPlayerEmpire>>;
  findByUserId(userId: string): Promise<HydratedDocument<IPlayerEmpire> | null>;
  getLeaderboard(limit?: number): Promise<HydratedDocument<IPlayerEmpire>[]>;
  findByIndustryCount(minCount: number): Promise<HydratedDocument<IPlayerEmpire>[]>;
}

/**
 * Empire level requirements
 */
export const EMPIRE_LEVELS = [
  { level: 1, name: 'Startup Founder', xpRequired: 0, minCompanies: 1, minIndustries: 1, multiplier: 1.0 },
  { level: 2, name: 'Serial Entrepreneur', xpRequired: 5000, minCompanies: 2, minIndustries: 2, multiplier: 1.05 },
  { level: 3, name: 'Business Mogul', xpRequired: 15000, minCompanies: 3, minIndustries: 2, multiplier: 1.1 },
  { level: 4, name: 'Industry Leader', xpRequired: 40000, minCompanies: 4, minIndustries: 3, multiplier: 1.15 },
  { level: 5, name: 'Vertical Integrator', xpRequired: 100000, minCompanies: 5, minIndustries: 3, multiplier: 1.2 },
  { level: 6, name: 'Horizontal Expander', xpRequired: 200000, minCompanies: 6, minIndustries: 4, multiplier: 1.25 },
  { level: 7, name: 'Market Dominator', xpRequired: 400000, minCompanies: 8, minIndustries: 5, multiplier: 1.3 },
  { level: 8, name: 'Conglomerate Builder', xpRequired: 800000, minCompanies: 10, minIndustries: 6, multiplier: 1.4 },
  { level: 9, name: 'Empire Titan', xpRequired: 1500000, minCompanies: 12, minIndustries: 7, multiplier: 1.5 },
  { level: 10, name: 'Economic Overlord', xpRequired: 3000000, minCompanies: 15, minIndustries: 8, multiplier: 1.6 },
  { level: 11, name: 'Global Monopolist', xpRequired: 6000000, minCompanies: 20, minIndustries: 9, multiplier: 1.75 },
  { level: 12, name: 'World Controller', xpRequired: 10000000, minCompanies: 25, minIndustries: 10, multiplier: 2.0 },
];

/**
 * XP rewards for actions
 */
export const EMPIRE_XP_REWARDS = {
  COMPANY_ACQUIRED: 1000,
  NEW_INDUSTRY: 2500,
  SYNERGY_ACTIVATED: 1500,
  SYNERGY_ADVANCED: 3000,
  SYNERGY_ELITE: 5000,
  SYNERGY_ULTIMATE: 10000,
  MONTHLY_REVENUE_PER_MILLION: 100,
  RESOURCE_FLOW_ESTABLISHED: 500,
};

/**
 * Empire company schema
 */
const EmpireCompanySchema = new Schema<IEmpireCompany>(
  {
    companyId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      enum: Object.values(EmpireIndustry),
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    isHeadquarters: {
      type: Boolean,
      default: false,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Calculated bonus schema
 */
const CalculatedBonusSchema = new Schema<ICalculatedBonus>(
  {
    target: {
      type: String,
      required: true,
      enum: Object.values(SynergyBonusTarget),
    },
    baseValue: {
      type: Number,
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      default: 1,
    },
    finalValue: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Active synergy schema
 */
const ActiveSynergySchema = new Schema<IActiveSynergy>(
  {
    synergyId: {
      type: String,
      required: true,
    },
    synergyName: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      required: true,
      enum: Object.values(SynergyTier),
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    contributingCompanyIds: {
      type: [String],
      default: [],
    },
    bonuses: {
      type: [CalculatedBonusSchema],
      default: [],
    },
  },
  { _id: false }
);

/**
 * PlayerEmpire schema
 */
const PlayerEmpireSchema = new Schema<IPlayerEmpire>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: 'My Empire',
      trim: true,
      maxlength: 50,
    },
    companies: {
      type: [EmpireCompanySchema],
      default: [],
    },
    activeSynergies: {
      type: [ActiveSynergySchema],
      default: [],
    },
    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    industryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    empireLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },
    empireXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    synergyMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
    },
    lastSynergyCalculation: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
PlayerEmpireSchema.index({ empireLevel: -1, totalValue: -1 });
PlayerEmpireSchema.index({ industryCount: -1 });
PlayerEmpireSchema.index({ 'companies.industry': 1 });

/**
 * Method: Add a company to the empire
 */
PlayerEmpireSchema.methods.addCompany = async function (
  companyId: string,
  name: string,
  industry: EmpireIndustry,
  level: number = 1,
  revenue: number = 0,
  value: number = 0
): Promise<HydratedDocument<IPlayerEmpire>> {
  // Check if company already exists
  const exists = this.companies.some((c: IEmpireCompany) => c.companyId === companyId);
  if (exists) {
    throw new Error('Company already in empire');
  }
  
  // Check if this is a new industry
  const isNewIndustry = !this.hasIndustry(industry);
  
  // Set as headquarters if first company
  const isHeadquarters = this.companies.length === 0;
  
  this.companies.push({
    companyId,
    name,
    industry,
    level,
    revenue,
    value,
    isHeadquarters,
    addedAt: new Date(),
  });
  
  // Update aggregates
  this.recalculateAggregates();
  
  // Award XP
  await this.addXp(EMPIRE_XP_REWARDS.COMPANY_ACQUIRED);
  if (isNewIndustry) {
    await this.addXp(EMPIRE_XP_REWARDS.NEW_INDUSTRY);
  }
  
  await this.save();
  return this as HydratedDocument<IPlayerEmpire>;
};

/**
 * Method: Remove a company from the empire
 */
PlayerEmpireSchema.methods.removeCompany = async function (
  companyId: string
): Promise<HydratedDocument<IPlayerEmpire>> {
  const index = this.companies.findIndex((c: IEmpireCompany) => c.companyId === companyId);
  if (index === -1) {
    throw new Error('Company not found in empire');
  }
  
  const wasHeadquarters = this.companies[index].isHeadquarters;
  this.companies.splice(index, 1);
  
  // If removed headquarters, assign new one
  if (wasHeadquarters && this.companies.length > 0) {
    this.companies[0].isHeadquarters = true;
  }
  
  // Update aggregates
  this.recalculateAggregates();
  
  await this.save();
  return this as HydratedDocument<IPlayerEmpire>;
};

/**
 * Method: Update a company's statistics
 */
PlayerEmpireSchema.methods.updateCompanyStats = async function (
  companyId: string,
  updates: Partial<IEmpireCompany>
): Promise<HydratedDocument<IPlayerEmpire>> {
  const company = this.companies.find((c: IEmpireCompany) => c.companyId === companyId);
  if (!company) {
    throw new Error('Company not found in empire');
  }
  
  // Apply updates
  if (updates.level !== undefined) company.level = updates.level;
  if (updates.revenue !== undefined) company.revenue = updates.revenue;
  if (updates.value !== undefined) company.value = updates.value;
  if (updates.name !== undefined) company.name = updates.name;
  
  // Recalculate aggregates
  this.recalculateAggregates();
  
  await this.save();
  return this as HydratedDocument<IPlayerEmpire>;
};

/**
 * Method: Get unique industries in empire
 */
PlayerEmpireSchema.methods.getIndustries = function (): EmpireIndustry[] {
  const industries = new Set<EmpireIndustry>();
  for (const company of this.companies) {
    industries.add(company.industry);
  }
  return Array.from(industries);
};

/**
 * Method: Check if empire has specific industry
 */
PlayerEmpireSchema.methods.hasIndustry = function (industry: EmpireIndustry): boolean {
  return this.companies.some((c: IEmpireCompany) => c.industry === industry);
};

/**
 * Method: Get empire statistics
 */
PlayerEmpireSchema.methods.getStats = function (): EmpireStats {
  const industries = this.getIndustries();
  const currentLevel = EMPIRE_LEVELS.find(l => l.level === this.empireLevel);
  const nextLevel = EMPIRE_LEVELS.find(l => l.level === this.empireLevel + 1);
  
  // Calculate total synergy bonus percentage
  let totalSynergyBonus = 0;
  for (const synergy of this.activeSynergies) {
    for (const bonus of synergy.bonuses) {
      if (bonus.target === SynergyBonusTarget.ALL_PROFITS || 
          bonus.target === SynergyBonusTarget.REVENUE) {
        totalSynergyBonus += bonus.finalValue;
      }
    }
  }
  
  return {
    totalCompanies: this.companies.length,
    industriesCovered: industries,
    activeSynergiesCount: this.activeSynergies.length,
    totalSynergyBonus,
    monthlyPassiveIncome: this.monthlyRevenue - this.monthlyExpenses,
    resourceFlowsCount: 0, // Will be populated from ResourceFlow model
    empireLevel: this.empireLevel,
    empireXp: this.empireXp,
    nextLevelXp: nextLevel?.xpRequired || this.empireXp,
    totalAssetValue: this.totalValue,
  };
};

/**
 * Method: Add XP and check for level up
 */
PlayerEmpireSchema.methods.addXp = async function (
  amount: number
): Promise<{ leveledUp: boolean; newLevel?: number }> {
  this.empireXp += amount;
  
  let leveledUp = false;
  let newLevel: number | undefined;
  
  // Check for level up
  while (this.empireLevel < EMPIRE_LEVELS.length) {
    const nextLevel = EMPIRE_LEVELS.find(l => l.level === this.empireLevel + 1);
    if (!nextLevel) break;
    
    // Check requirements
    if (
      this.empireXp >= nextLevel.xpRequired &&
      this.companies.length >= nextLevel.minCompanies &&
      this.industryCount >= nextLevel.minIndustries
    ) {
      this.empireLevel += 1;
      this.synergyMultiplier = nextLevel.multiplier;
      leveledUp = true;
      newLevel = this.empireLevel;
    } else {
      break;
    }
  }
  
  // Don't save here - let caller save
  return { leveledUp, newLevel };
};

/**
 * Method: Recalculate aggregate values
 */
PlayerEmpireSchema.methods.recalculateAggregates = function (): void {
  this.totalValue = this.companies.reduce((sum: number, c: IEmpireCompany) => sum + c.value, 0);
  this.monthlyRevenue = this.companies.reduce((sum: number, c: IEmpireCompany) => sum + c.revenue, 0);
  this.industryCount = this.getIndustries().length;
  
  // Update synergy multiplier based on level
  const currentLevel = EMPIRE_LEVELS.find(l => l.level === this.empireLevel);
  if (currentLevel) {
    this.synergyMultiplier = currentLevel.multiplier;
  }
};

/**
 * Method: Set headquarters
 */
PlayerEmpireSchema.methods.setHeadquarters = async function (
  companyId: string
): Promise<HydratedDocument<IPlayerEmpire>> {
  // Clear current headquarters
  for (const company of this.companies) {
    company.isHeadquarters = company.companyId === companyId;
  }
  
  await this.save();
  return this as HydratedDocument<IPlayerEmpire>;
};

/**
 * Static: Get or create empire for user
 */
PlayerEmpireSchema.statics.getOrCreate = async function (
  userId: string
): Promise<HydratedDocument<IPlayerEmpire>> {
  let empire = await this.findOne({ userId });
  
  if (!empire) {
    empire = new this({
      userId,
      name: 'My Empire',
    });
    await empire.save();
  }
  
  return empire;
};

/**
 * Static: Find by user ID
 */
PlayerEmpireSchema.statics.findByUserId = async function (
  userId: string
): Promise<HydratedDocument<IPlayerEmpire> | null> {
  return this.findOne({ userId });
};

/**
 * Static: Get leaderboard by empire level and value
 */
PlayerEmpireSchema.statics.getLeaderboard = async function (
  limit: number = 100
): Promise<HydratedDocument<IPlayerEmpire>[]> {
  return this.find()
    .sort({ empireLevel: -1, totalValue: -1 })
    .limit(limit);
};

/**
 * Static: Find empires with minimum industry count
 */
PlayerEmpireSchema.statics.findByIndustryCount = async function (
  minCount: number
): Promise<HydratedDocument<IPlayerEmpire>[]> {
  return this.find({ industryCount: { $gte: minCount } })
    .sort({ industryCount: -1, totalValue: -1 });
};

// Create and export the model
const PlayerEmpire =
  (mongoose.models.PlayerEmpire as IPlayerEmpireModel) ||
  mongoose.model<IPlayerEmpire, IPlayerEmpireModel>('PlayerEmpire', PlayerEmpireSchema);

export default PlayerEmpire;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. **Single Empire Per User**: One PlayerEmpire document per userId,
 *    aggregating all their companies
 *
 * 2. **Company Snapshots**: Stores essential company data to avoid
 *    excessive lookups. Sync via updateCompanyStats().
 *
 * 3. **Synergy Storage**: Active synergies stored with calculated bonuses
 *    for fast access. Recalculate when companies change.
 *
 * 4. **Empire Levels**: 12 levels of progression with increasing requirements
 *    and synergy multipliers
 *
 * 5. **XP System**: Actions award XP (acquiring companies, new industries,
 *    activating synergies)
 *
 * USAGE:
 * ```typescript
 * import PlayerEmpire from '@/lib/db/models/empire/PlayerEmpire';
 *
 * // Get or create empire
 * const empire = await PlayerEmpire.getOrCreate(userId);
 *
 * // Add a new company
 * await empire.addCompany(companyId, 'Acme Bank', EmpireIndustry.BANKING, 1, 100000, 500000);
 *
 * // Check stats
 * const stats = empire.getStats();
 * console.log(`Empire Level: ${stats.empireLevel}, Industries: ${stats.industriesCovered.length}`);
 * ```
 */
