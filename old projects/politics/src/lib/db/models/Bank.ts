/**
 * @file src/lib/db/models/Bank.ts
 * @description Bank model for NPC and player-owned banking institutions
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Bank model represents both NPC banks (system-controlled) and player-owned banks (Level 3+).
 * NPC banks seeded on first run with realistic rate ranges and lending criteria.
 * Implements 5 distinct bank types with different risk profiles and specializations.
 * 
 * BANK TYPES:
 * 1. Local Credit Union (CREDIT_UNION)
 *    - Personal service, higher rates
 *    - Credit Score Min: 550
 *    - Interest Rate: 8-12%
 *    - Max Loan: $500K
 *    - Specialization: Small business, community lending
 * 
 * 2. Regional Bank (REGIONAL)
 *    - Balanced rates, moderate risk
 *    - Credit Score Min: 600
 *    - Interest Rate: 6-10%
 *    - Max Loan: $5M
 *    - Specialization: Regional business expansion
 * 
 * 3. National Bank (NATIONAL)
 *    - Competitive rates, broad services
 *    - Credit Score Min: 650
 *    - Interest Rate: 5-8%
 *    - Max Loan: $50M
 *    - Specialization: Large corporate lending
 * 
 * 4. Investment Bank (INVESTMENT)
 *    - Premium services, high minimums
 *    - Credit Score Min: 700
 *    - Interest Rate: 4-7%
 *    - Max Loan: $500M
 *    - Specialization: IPO, M&A, major projects
 * 
 * 5. Government SBA (GOVERNMENT)
 *    - Low rates, flexible terms
 *    - Credit Score Min: 500
 *    - Interest Rate: 3-6%
 *    - Max Loan: $5M
 *    - Specialization: Startup support, disadvantaged areas
 * 
 * SCHEMA FIELDS:
 * - name: Bank display name (required, unique)
 * - type: Bank type enum (required, indexed)
 * - isNPC: Whether bank is system-controlled (default: true)
 * - ownerId: Reference to User (null for NPC banks)
 * - baseInterestRate: Base annual interest rate (0-1 decimal)
 * - creditScoreMin: Minimum credit score for approval
 * - maxLoanAmount: Maximum single loan amount (cents)
 * - loanTermsMonths: Available loan term lengths (array)
 * - collateralRequired: Whether collateral is required
 * - riskTolerance: Risk appetite (0-1, higher = more lenient)
 * - totalAsssets: Bank's total assets (cents)
 * - totalLiabilities: Bank's total liabilities (cents)
 * - capitalRatio: Capital adequacy ratio (Basel III)
 * - activeLoans: Count of active loans
 * - defaultRate: Historical default rate (0-1)
 * - lastRateUpdate: Last interest rate adjustment
 * - isActive: Whether bank is accepting applications
 * 
 * USAGE:
 * ```typescript
 * import Bank from '@/lib/db/models/Bank';
 * 
 * // Find banks for user credit score
 * const eligibleBanks = await Bank.find({
 *   isActive: true,
 *   creditScoreMin: { $lte: userCreditScore }
 * }).sort({ baseInterestRate: 1 });
 * 
 * // Get best rate for loan amount
 * const bestBank = await Bank.findBestRate(loanAmount, creditScore);
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - NPC banks seeded via script on first deployment
 * - Interest rates fluctuate based on market conditions (future)
 * - Player-owned banks unlocked at Company Level 3+
 * - Basel III capital ratio requirements enforced (8% minimum)
 * - Default rate impacts future lending decisions
 * - All monetary values in cents (USD)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Bank type enumeration
 * 
 * @enum {string}
 */
export enum BankType {
  CREDIT_UNION = 'CREDIT_UNION',
  REGIONAL = 'REGIONAL',
  NATIONAL = 'NATIONAL',
  INVESTMENT = 'INVESTMENT',
  GOVERNMENT = 'GOVERNMENT',
}

/**
 * Bank document interface
 * 
 * @interface IBank
 * @extends {Document}
 */
export interface IBank extends Document {
  name: string;
  type: BankType;
  isNPC: boolean;
  ownerId: Types.ObjectId | null;
  baseInterestRate: number;
  creditScoreMin: number;
  maxLoanAmount: number;
  loanTermsMonths: number[];
  collateralRequired: boolean;
  riskTolerance: number;
  totalAssets: number;
  totalLiabilities: number;
  capitalRatio: number;
  activeLoans: number;
  defaultRate: number;
  lastRateUpdate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateApprovalProbability(creditScore: number, loanAmount: number): number;
  adjustInterestRate(creditScore: number): number;
  canApproveLoan(loanAmount: number): boolean;
}

/**
 * Bank static methods interface
 */
export interface IBankModel extends Model<IBank> {
  findBestRate(loanAmount: number, creditScore: number): Promise<IBank | null>;
  findEligibleBanks(creditScore: number, loanAmount: number): Promise<IBank[]>;
}

/**
 * Bank schema definition
 * 
 * @description
 * Implements realistic banking model with 5 bank types.
 * Supports both NPC and player-owned banks.
 */
const BankSchema = new Schema<IBank>(
  {
    name: {
      type: String,
      required: [true, 'Bank name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Bank name must be at least 3 characters'],
      maxlength: [100, 'Bank name cannot exceed 100 characters'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Bank type is required'],
      enum: {
        values: Object.values(BankType),
        message: '{VALUE} is not a valid bank type',
      },
      index: true,
    },
    isNPC: {
      type: Boolean,
      default: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    baseInterestRate: {
      type: Number,
      required: [true, 'Base interest rate is required'],
      min: [0, 'Interest rate cannot be negative'],
      max: [1, 'Interest rate cannot exceed 100%'],
    },
    creditScoreMin: {
      type: Number,
      required: [true, 'Minimum credit score is required'],
      min: [300, 'Credit score minimum cannot be below 300'],
      max: [850, 'Credit score minimum cannot exceed 850'],
    },
    maxLoanAmount: {
      type: Number,
      required: [true, 'Maximum loan amount is required'],
      min: [0, 'Maximum loan amount cannot be negative'],
    },
    loanTermsMonths: {
      type: [Number],
      required: [true, 'Loan terms are required'],
      validate: {
        validator: function (terms: number[]) {
          return terms.length > 0 && terms.every((term) => term > 0 && term <= 360);
        },
        message: 'Loan terms must be positive and not exceed 360 months',
      },
    },
    collateralRequired: {
      type: Boolean,
      default: false,
    },
    riskTolerance: {
      type: Number,
      required: [true, 'Risk tolerance is required'],
      min: [0, 'Risk tolerance cannot be negative'],
      max: [1, 'Risk tolerance cannot exceed 1'],
      default: 0.5,
    },
    totalAssets: {
      type: Number,
      default: 0,
      min: [0, 'Total assets cannot be negative'],
    },
    totalLiabilities: {
      type: Number,
      default: 0,
      min: [0, 'Total liabilities cannot be negative'],
    },
    capitalRatio: {
      type: Number,
      default: 0.15, // 15% capital ratio (well above Basel III 8% minimum)
      min: [0, 'Capital ratio cannot be negative'],
      max: [1, 'Capital ratio cannot exceed 100%'],
    },
    activeLoans: {
      type: Number,
      default: 0,
      min: [0, 'Active loans count cannot be negative'],
    },
    defaultRate: {
      type: Number,
      default: 0,
      min: [0, 'Default rate cannot be negative'],
      max: [1, 'Default rate cannot exceed 100%'],
    },
    lastRateUpdate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'banks',
  }
);

/**
 * Compound index for efficient bank queries
 * Optimizes lookup by active status, credit score, and rate
 */
BankSchema.index({ isActive: 1, creditScoreMin: 1, baseInterestRate: 1 });
BankSchema.index({ type: 1, isNPC: 1 });

/**
 * Instance method to calculate loan approval probability
 * 
 * @param {number} creditScore - Applicant's credit score
 * @param {number} loanAmount - Requested loan amount (cents)
 * @returns {number} Approval probability (0-1)
 * 
 * @description
 * Calculates probability of loan approval based on credit score,
 * loan amount relative to max, and bank's risk tolerance.
 */
BankSchema.methods.calculateApprovalProbability = function (
  creditScore: number,
  loanAmount: number
): number {
  // Base probability from credit score
  let probability = 0;
  
  if (creditScore < this.creditScoreMin) {
    // Below minimum: very low approval chance
    probability = 0.05;
  } else if (creditScore >= 750) {
    // Excellent credit: high approval chance
    probability = 0.95;
  } else {
    // Scale probability from min score to 750
    const scoreRange = 750 - this.creditScoreMin;
    const scoreAboveMin = creditScore - this.creditScoreMin;
    probability = 0.5 + (scoreAboveMin / scoreRange) * 0.45;
  }
  
  // Adjust for loan amount relative to max
  const loanRatio = loanAmount / this.maxLoanAmount;
  if (loanRatio > 0.8) {
    // Large loan: reduce probability
    probability *= 0.7;
  } else if (loanRatio < 0.3) {
    // Small loan: increase probability
    probability *= 1.1;
  }
  
  // Adjust for bank's risk tolerance
  probability += (this.riskTolerance - 0.5) * 0.2;
  
  // Adjust for bank's current default rate
  if (this.defaultRate > 0.05) {
    // High default rate: more conservative
    probability *= (1 - this.defaultRate);
  }
  
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, probability));
};

/**
 * Instance method to adjust interest rate for specific applicant
 * 
 * @param {number} creditScore - Applicant's credit score
 * @returns {number} Adjusted interest rate (0-1 decimal)
 * 
 * @description
 * Adjusts base interest rate based on applicant's credit score.
 * Higher credit scores get better rates.
 */
BankSchema.methods.adjustInterestRate = function (
  creditScore: number
): number {
  let rate = this.baseInterestRate;
  
  if (creditScore >= 750) {
    // Excellent credit: -1% from base
    rate -= 0.01;
  } else if (creditScore >= 700) {
    // Good credit: -0.5% from base
    rate -= 0.005;
  } else if (creditScore < 600) {
    // Poor credit: +2% from base
    rate += 0.02;
  } else if (creditScore < 650) {
    // Fair credit: +1% from base
    rate += 0.01;
  }
  
  // Ensure rate stays positive
  return Math.max(0.01, rate);
};

/**
 * Instance method to check if bank can approve loan amount
 * 
 * @param {number} loanAmount - Requested loan amount (cents)
 * @returns {boolean} Whether bank can approve loan
 * 
 * @description
 * Checks if bank has sufficient capital to approve loan
 * based on Basel III capital adequacy requirements.
 */
BankSchema.methods.canApproveLoan = function (
  loanAmount: number
): boolean {
  // Check max loan limit
  if (loanAmount > this.maxLoanAmount) {
    return false;
  }
  
  // Check capital adequacy (Basel III: 8% minimum)
  const capital = this.totalAssets - this.totalLiabilities;
  const riskWeightedAssets = this.totalAssets + loanAmount;
  const newCapitalRatio = capital / riskWeightedAssets;
  
  // Maintain 8% minimum capital ratio
  return newCapitalRatio >= 0.08;
};

/**
 * Static method to find best rate for loan
 * 
 * @param {number} loanAmount - Requested loan amount (cents)
 * @param {number} creditScore - Applicant's credit score
 * @returns {Promise<IBank | null>} Bank with best rate, or null
 * 
 * @description
 * Finds eligible bank with lowest adjusted interest rate.
 */
BankSchema.statics.findBestRate = async function (
  loanAmount: number,
  creditScore: number
): Promise<IBank | null> {
  const banks = await (this as IBankModel).findEligibleBanks(creditScore, loanAmount);
  
  if (banks.length === 0) {
    return null;
  }
  
  // Find bank with lowest adjusted rate
  return banks.reduce((best: IBank, bank: IBank) => {
    const bestRate = best.adjustInterestRate(creditScore);
    const bankRate = bank.adjustInterestRate(creditScore);
    return bankRate < bestRate ? bank : best;
  }, banks[0]);
};

/**
 * Static method to find eligible banks
 * 
 * @param {number} creditScore - Applicant's credit score
 * @param {number} loanAmount - Requested loan amount (cents)
 * @returns {Promise<IBank[]>} Array of eligible banks
 * 
 * @description
 * Finds all active banks that meet credit score minimum
 * and can approve the requested loan amount.
 */
BankSchema.statics.findEligibleBanks = async function (
  creditScore: number,
  loanAmount: number
): Promise<IBank[]> {
  const banks = await this.find({
    isActive: true,
    creditScoreMin: { $lte: creditScore },
    maxLoanAmount: { $gte: loanAmount },
  }).sort({ baseInterestRate: 1 });
  
  // Filter by capital adequacy
  return banks.filter((bank: IBank) => bank.canApproveLoan(loanAmount));
};

/**
 * Bank model
 * 
 * @description
 * Mongoose model for Bank collection.
 * Supports both NPC and player-owned banks.
 * 
 * @example
 * ```typescript
 * import Bank from '@/lib/db/models/Bank';
 * 
 * // Find best rate
 * const bestBank = await Bank.findBestRate(1000000, 720);
 * 
 * // Check approval probability
 * const probability = bank.calculateApprovalProbability(680, 500000);
 * 
 * // Get adjusted rate
 * const rate = bank.adjustInterestRate(750);
 * ```
 */
const Bank: IBankModel =
  (mongoose.models.Bank as IBankModel) ||
  mongoose.model<IBank, IBankModel>('Bank', BankSchema);

export default Bank;
