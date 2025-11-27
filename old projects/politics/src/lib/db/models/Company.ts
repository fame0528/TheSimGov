/**
 * @file src/lib/db/models/Company.ts
 * @description Company Mongoose schema for business management system
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Company model representing player-owned businesses with industry-specific mechanics,
 * financial tracking, and reputation systems. Each user can own multiple companies
 * across different industries. Companies track revenue, expenses, employees, and
 * maintain transaction history for complete financial transparency.
 * 
 * SCHEMA FIELDS:
 * - name: Company name (required, unique per user, 3-50 chars)
 * - industry: Business sector (Construction, Real Estate, Crypto, Stocks, Retail, Banking)
 * - mission: Company mission statement (optional, max 500 chars)
 * - owner: Reference to User document (required, indexed)
 * - cash: Current cash on hand (required, default $10,000)
 * - revenue: Total lifetime revenue (required, default $0)
 * - expenses: Total lifetime expenses (required, default $0)
 * - employees: Count of hired employees (required, default 0)
 * - reputation: Company reputation score (required, default 50, range 0-100)
 * - foundedAt: Company creation timestamp (auto-generated)
 * - updatedAt: Last update timestamp (auto-generated)
 * 
 * VIRTUAL FIELDS:
 * - netWorth: Calculated as cash + assets - liabilities
 * - profitLoss: Calculated as revenue - expenses
 * 
 * USAGE:
 * ```typescript
 * import Company from '@/lib/db/models/Company';
 * 
 * // Create company
 * const company = await Company.create({
 *   name: 'Acme Construction',
 *   industry: 'Construction',
 *   mission: 'Building the future, one project at a time',
 *   owner: userId,
 *   cash: 10000
 * });
 * 
 * // Find user's companies
 * const companies = await Company.find({ owner: userId });
 * 
 * // Update financials
 * await company.updateOne({ 
 *   $inc: { cash: -5000, expenses: 5000 } 
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Industry enum enforces valid business sectors
 * - Cash cannot go below $0 (enforced by validation)
 * - Owner reference indexed for fast user queries
 * - Reputation range: 0-100 (50 is neutral)
 * - All financial values stored as integers (cents avoided for simplicity)
 * - Virtual fields compute derived metrics without storage overhead
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { INDUSTRIES, INDUSTRY_INFO, type IndustryType } from '@/lib/constants/industries';

// Re-export for backward compatibility
export { INDUSTRY_INFO, type IndustryType };

/**
 * Company document interface
 * 
 * @interface ICompany
 * @extends {Document}
 * 
 * @property {string} name - Unique company name
 * @property {IndustryType} industry - Business sector
 * @property {string} [mission] - Company mission statement
 * @property {Types.ObjectId} owner - Reference to User document
 * @property {number} cash - Current cash on hand
 * @property {number} revenue - Total lifetime revenue
 * @property {number} expenses - Total lifetime expenses
 * @property {number} employees - Number of hired employees
 * @property {number} reputation - Company reputation (0-100)
 * @property {Date} foundedAt - Company creation date
 * @property {Date} updatedAt - Last update timestamp
 * @property {Types.ObjectId[]} [agiMilestones] - References to achieved AGI milestones
 * @property {number} [highestCapabilityScore] - Peak AGI capability achieved (0-100)
 * @property {number} [currentAlignmentScore] - Current AI safety rating (0-100)
 * @property {number} [catastrophicEventsPrevented] - Near-miss safety events avoided
 * @property {Date} [firstAGIAchievedAt] - Timestamp when General Intelligence milestone achieved
 */
export interface ICompany extends Document {
  name: string;
  industry: IndustryType;
  subcategory?: 'AI' | 'Software' | 'Hardware'; // Technology only
  mission?: string;
  owner: Types.ObjectId;
  userId: Types.ObjectId; // Alias for owner (user ownership)
  cash: number;
  revenue: number;
  expenses: number;
  employees: number;
  reputation: number;
  foundedAt: Date;
  updatedAt: Date;
  
  // Level system fields
  level: 1 | 2 | 3 | 4 | 5;
  experience: number;
  totalRevenueGenerated: number;
  leveledUpAt?: Date;

  // Player banking system fields (Level 3+ feature)
  playerBank?: {
    licensed: boolean;
    licenseDate: Date;
    capital: number;           // Banking capital for lending
    totalLoansIssued: number;
    totalInterestEarned: number;
    defaultLosses: number;
  };

  // AI company extension fields (Technology → AI subcategory)
  researchFocus?: string; // e.g. 'nlp', 'vision', 'multimodal', 'agent systems'
  researchBudget?: number; // allocated budget (cash reserved) for current cycle
  researchPoints?: number; // accumulated R&D points from completed models/projects
  models?: Types.ObjectId[]; // references AIModel documents (added after model schema exists)
  computeType?: 'GPU' | 'Cloud' | 'Hybrid'; // primary compute strategy
  gpuCount?: number; // physical GPUs owned
  gpuUtilization?: number; // 0-1 utilization ratio
  cloudCredits?: number; // remaining purchased cloud compute credits
  storageCapacity?: number; // TB of storage allocated to datasets/models
  apiCalls?: number; // lifetime API calls served by deployed models
  activeCustomers?: number; // number of customers actively using deployed endpoints
  uptime?: number; // 0-100 % uptime of deployed inference endpoints
  industryRanking?: number; // relative ranking among AI companies (lower is better, 1 = top)
  
  // AGI Development tracking fields (Phase 5.1)
  agiMilestones?: Types.ObjectId[]; // References to achieved AGI milestones
  highestCapabilityScore?: number; // Peak AGI capability achieved (0-100)
  currentAlignmentScore?: number; // Current AI safety rating (0-100)
  catastrophicEventsPrevented?: number; // Near-miss safety events avoided
  firstAGIAchievedAt?: Date; // Timestamp when General Intelligence milestone achieved
  
  // Industry Dominance & Global Impact tracking fields (Phase 5.2)
  marketShareAI?: number; // Current AI market share (0-100)
  antitrustRiskScore?: number; // Antitrust risk assessment (0-100)
  publicPerceptionScore?: number; // Public opinion rating (0-100)
  regulatoryPressureLevel?: number; // Regulatory pressure score (0-100)
  lastDominanceUpdate?: Date; // Timestamp of last dominance metrics calculation
  
  // Shorthand aliases for AGI fields
  agiCapability?: number; // Alias for highestCapabilityScore
  agiAlignment?: number; // Alias for currentAlignmentScore
  
  // Virtual fields (computed, not stored)
  netWorth: number;
  profitLoss: number;
  experienceToNextLevel: number;
  levelName: string;
}

/**
 * Company schema definition
 * 
 * @description
 * Defines structure, validation rules, and indexes for Company documents.
 * Includes virtual fields for derived financial metrics.
 * Enforces business rules (positive cash, valid industries, reputation range).
 */
const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [3, 'Company name must be at least 3 characters'],
      maxlength: [50, 'Company name cannot exceed 50 characters'],
      // Note: Uniqueness enforced per user via compound index below
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: {
        values: [...INDUSTRIES],
        message: '{VALUE} is not a valid industry',
      },
    },
    subcategory: {
      type: String,
      enum: {
        values: ['AI', 'Software', 'Hardware'],
        message: '{VALUE} is not a valid technology subcategory',
      },
      // Only required for Technology industry (validated in pre-save hook)
    },
    mission: {
      type: String,
      trim: true,
      maxlength: [500, 'Mission statement cannot exceed 500 characters'],
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Company owner is required'],
      index: true, // Fast user company lookups
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Virtual alias - populated automatically from owner
    },
    cash: {
      type: Number,
      required: true,
      default: 10000, // Starting seed capital
      min: [0, 'Cash cannot be negative'],
    },
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    expenses: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Expenses cannot be negative'],
    },
    employees: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Employee count cannot be negative'],
    },
    reputation: {
      type: Number,
      required: true,
      default: 50, // Neutral starting reputation
      min: [0, 'Reputation cannot be below 0'],
      max: [100, 'Reputation cannot exceed 100'],
    },
    foundedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true, // Cannot be changed after creation
    },
    
    // Level system fields
    level: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Level cannot be below 1'],
      max: [5, 'Level cannot exceed 5'],
    },
    experience: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Experience cannot be negative'],
    },
    totalRevenueGenerated: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue generated cannot be negative'],
    },
    leveledUpAt: {
      type: Date,
      // Optional - only set when company levels up
    },

    // ==== AI EXTENSION FIELDS (populated when subcategory === 'AI') ==== //
    researchFocus: {
      type: String,
      trim: true,
      maxlength: [50, 'Research focus cannot exceed 50 characters'],
    },
    researchBudget: {
      type: Number,
      default: 0,
      min: [0, 'Research budget cannot be negative'],
    },
    researchPoints: {
      type: Number,
      default: 0,
      min: [0, 'Research points cannot be negative'],
      index: true,
    },
    models: [
      {
        type: Schema.Types.ObjectId,
        ref: 'AIModel', // will resolve after model creation; non-blocking
      },
    ],
    computeType: {
      type: String,
      enum: {
        values: ['GPU', 'Cloud', 'Hybrid'],
        message: '{VALUE} is not a valid compute type',
      },
    },
    gpuCount: {
      type: Number,
      default: 0,
      min: [0, 'GPU count cannot be negative'],
    },
    gpuUtilization: {
      type: Number,
      default: 0,
      min: [0, 'GPU utilization cannot be below 0'],
      max: [1, 'GPU utilization cannot exceed 1'],
    },
    cloudCredits: {
      type: Number,
      default: 0,
      min: [0, 'Cloud credits cannot be negative'],
    },
    storageCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Storage capacity cannot be negative'],
    },
    apiCalls: {
      type: Number,
      default: 0,
      min: [0, 'API calls cannot be negative'],
    },
    activeCustomers: {
      type: Number,
      default: 0,
      min: [0, 'Active customers cannot be negative'],
    },
    uptime: {
      type: Number,
      default: 0,
      min: [0, 'Uptime cannot be below 0'],
      max: [100, 'Uptime cannot exceed 100'],
    },
    industryRanking: {
      type: Number,
      default: 0,
      min: [0, 'Industry ranking cannot be negative'],
      index: true,
    },

    // ==== AGI DEVELOPMENT TRACKING (Phase 5.1) ==== //
    agiMilestones: [
      {
        type: Schema.Types.ObjectId,
        ref: 'AGIMilestone', // References achieved AGI milestones
      },
    ],
    highestCapabilityScore: {
      type: Number,
      default: 0,
      min: [0, 'Highest capability score cannot be negative'],
      max: [100, 'Highest capability score cannot exceed 100'],
    },
    currentAlignmentScore: {
      type: Number,
      default: 100, // Start with perfect alignment
      min: [0, 'Current alignment score cannot be negative'],
      max: [100, 'Current alignment score cannot exceed 100'],
    },
    catastrophicEventsPrevented: {
      type: Number,
      default: 0,
      min: [0, 'Catastrophic events prevented cannot be negative'],
    },
    firstAGIAchievedAt: {
      type: Date,
      // Optional - only set when General Intelligence milestone achieved
    },

    // ==== INDUSTRY DOMINANCE & GLOBAL IMPACT TRACKING (Phase 5.2) ==== //
    marketShareAI: {
      type: Number,
      default: 0,
      min: [0, 'Market share cannot be negative'],
      max: [100, 'Market share cannot exceed 100'],
      index: true, // Fast market leader queries
    },
    antitrustRiskScore: {
      type: Number,
      default: 0,
      min: [0, 'Antitrust risk score cannot be negative'],
      max: [100, 'Antitrust risk score cannot exceed 100'],
    },
    publicPerceptionScore: {
      type: Number,
      default: 50, // Neutral starting perception
      min: [0, 'Public perception score cannot be negative'],
      max: [100, 'Public perception score cannot exceed 100'],
    },
    regulatoryPressureLevel: {
      type: Number,
      default: 0,
      min: [0, 'Regulatory pressure level cannot be negative'],
      max: [100, 'Regulatory pressure level cannot exceed 100'],
    },
    lastDominanceUpdate: {
      type: Date,
      // Optional - timestamp of last dominance metrics calculation
    },

    // ==== PLAYER BANKING FIELDS (Level 3+ feature) ==== //
    playerBank: {
      licensed: {
        type: Boolean,
        default: false,
      },
      licenseDate: {
        type: Date,
      },
      capital: {
        type: Number,
        default: 0,
        min: [0, 'Banking capital cannot be negative'],
      },
      totalLoansIssued: {
        type: Number,
        default: 0,
        min: [0, 'Total loans issued cannot be negative'],
      },
      totalInterestEarned: {
        type: Number,
        default: 0,
        min: [0, 'Total interest earned cannot be negative'],
      },
      defaultLosses: {
        type: Number,
        default: 0,
        min: [0, 'Default losses cannot be negative'],
      },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Use foundedAt instead of createdAt
    collection: 'companies',
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true },
  }
);

/**
 * Compound index: Ensure unique company names per user
 * Users can have "Acme Corp" in different accounts, but not duplicate names in same account
 */
CompanySchema.index({ owner: 1, name: 1 }, { unique: true });

// Conditional validation hook: enforce AI fields only for Technology/AI companies
CompanySchema.pre('save', function (next) {
  const doc = this as ICompany;
  
  // Set userId alias from owner
  if (doc.owner && !doc.userId) {
    doc.userId = doc.owner;
  }
  
  // If not technology subcategory AI, skip
  if (!(doc.industry === 'Technology' && doc.subcategory === 'AI')) return next();

  // Basic focus requirement for AI companies
  if (!doc.researchFocus) {
    doc.researchFocus = 'general';
  }
  // Ensure uptime within bounds (already validated but normalize potential floats)
  if (typeof doc.uptime === 'number') {
    if (doc.uptime < 0) doc.uptime = 0;
    if (doc.uptime > 100) doc.uptime = 100;
  }
  // Ensure utilization within bounds
  if (typeof doc.gpuUtilization === 'number') {
    if (doc.gpuUtilization < 0) doc.gpuUtilization = 0;
    if (doc.gpuUtilization > 1) doc.gpuUtilization = 1;
  }
  next();
});

/**
 * Virtual field: netWorth
 * 
 * @description
 * Calculates net worth as cash (simplified for Phase 1).
 * Future phases will add assets (real estate, inventory) and liabilities (loans, debt).
 * 
 * @returns {number} Current net worth
 */
CompanySchema.virtual('netWorth').get(function (this: ICompany): number {
  // Phase 1: Net worth = cash only
  // Future: cash + assets - liabilities
  return this.cash;
});

/**
 * Virtual field: profitLoss
 * 
 * @description
 * Calculates lifetime profit/loss as revenue minus expenses.
 * Positive value indicates profitable company, negative indicates losses.
 * 
 * @returns {number} Lifetime profit or loss
 */
CompanySchema.virtual('profitLoss').get(function (this: ICompany): number {
  return this.revenue - this.expenses;
});

/**
 * Virtual field: experienceToNextLevel
 * 
 * @description
 * Calculates XP required to reach next level based on current level.
 * Returns 0 if already at max level (5).
 * 
 * @returns {number} XP needed for next level
 */
CompanySchema.virtual('experienceToNextLevel').get(function (this: ICompany): number {
  if (this.level >= 5) return 0;
  
  const xpMap: Record<number, number> = {
    1: 1000,   // L1 → L2
    2: 5000,   // L2 → L3
    3: 25000,  // L3 → L4
    4: 100000, // L4 → L5
  };
  
  return xpMap[this.level] || 0;
});

/**
 * Virtual field: levelName
 * 
 * @description
 * Gets the human-readable level name from constants based on industry and level.
 * Falls back to generic name if config not found.
 * 
 * @returns {string} Level name (e.g., "AI Startup", "Regional Retail Chain")
 */
CompanySchema.virtual('levelName').get(function (this: ICompany): string {
  // Import would create circular dependency, so we'll use generic names
  // Frontend will fetch from constants directly
  const genericNames: Record<number, string> = {
    1: 'Startup',
    2: 'Small Business',
    3: 'Regional Corporation',
    4: 'National Corporation',
    5: 'Fortune 500 Company',
  };
  
  return genericNames[this.level] || 'Unknown Level';
});

/**
 * Virtual field: agiCapability (alias for highestCapabilityScore)
 * 
 * @description
 * Convenience getter for AGI capability score (0-100).
 * Maps to highestCapabilityScore field.
 * 
 * @returns {number} AGI capability score
 */
CompanySchema.virtual('agiCapability').get(function (this: ICompany): number {
  return this.highestCapabilityScore || 0;
});

/**
 * Virtual field: agiAlignment (alias for currentAlignmentScore)
 * 
 * @description
 * Convenience getter for AGI alignment/safety score (0-100).
 * Maps to currentAlignmentScore field.
 * 
 * @returns {number} AGI alignment score
 */
CompanySchema.virtual('agiAlignment').get(function (this: ICompany): number {
  return this.currentAlignmentScore || 100; // Default to perfect alignment
});

/**
 * Company model
 * 
 * @description
 * Mongoose model for Company collection.
 * Checks if model exists before creating to prevent OverwriteModelError in hot reload.
 * 
 * @example
 * ```typescript
 * import Company from '@/lib/db/models/Company';
 * 
 * // Create company
 * const company = await Company.create({
 *   name: 'Tech Innovations Inc',
 *   industry: 'Crypto',
 *   mission: 'Revolutionizing blockchain infrastructure',
 *   owner: userId,
 * });
 * 
 * // Find user's companies
 * const companies = await Company.find({ owner: userId })
 *   .sort({ foundedAt: -1 })
 *   .limit(10);
 * 
 * // Update financials after transaction
 * await company.updateOne({
 *   $inc: { 
 *     cash: -1000,      // Deduct $1,000
 *     expenses: 1000    // Track as expense
 *   }
 * });
 * 
 * // Get company with owner details
 * const company = await Company.findById(companyId).populate('owner', 'firstName lastName email');
 * ```
 */
const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
