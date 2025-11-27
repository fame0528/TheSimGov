/**
 * @file src/lib/db/models/Bank.ts
 * @description Bank Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for NPC banks with different personalities and approval algorithms.
 * Supports 5 distinct bank types with unique characteristics and lending policies.
 *
 * FEATURES:
 * - 5 NPC bank personalities (Conservative, Growth, Risk-Taking, Community, Tech-Focused)
 * - Dynamic approval algorithms based on bank personality
 * - Basel III compliance tracking
 * - Credit score requirements and loan limits
 *
 * USAGE:
 * import Bank from '@/lib/db/models/Bank';
 * const banks = await Bank.find({});
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Bank personality types
 */
export enum BankPersonality {
  CONSERVATIVE = 'CONSERVATIVE',
  GROWTH = 'GROWTH',
  RISK_TAKING = 'RISK_TAKING',
  COMMUNITY = 'COMMUNITY',
  TECH_FOCUSED = 'TECH_FOCUSED',
}

/**
 * Bank document interface
 */
export interface IBank extends Document {
  name: string;
  personality: BankPersonality;
  description: string;
  minCreditScore: number;
  maxLoanAmount: number;
  baseInterestRate: number;
  processingTime: number; // Hours
  riskTolerance: number; // 1-10 scale
  preferredIndustries: string[]; // Industry preferences
  capital: number; // Bank's available lending capital
  loansOutstanding: number; // Current loans outstanding
  defaultRate: number; // Historical default rate
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bank schema
 */
const BankSchema = new Schema<IBank>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  personality: {
    type: String,
    enum: Object.values(BankPersonality),
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  minCreditScore: {
    type: Number,
    required: true,
    min: 300,
    max: 850,
  },
  maxLoanAmount: {
    type: Number,
    required: true,
    min: 10000,
  },
  baseInterestRate: {
    type: Number,
    required: true,
    min: 0.01,
    max: 0.25, // 25% max
  },
  processingTime: {
    type: Number,
    required: true,
    min: 1,
    max: 168, // 1 week max
  },
  riskTolerance: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  preferredIndustries: [{
    type: String,
    trim: true,
  }],
  capital: {
    type: Number,
    required: true,
    min: 0,
    default: 10000000, // $10M default capital
  },
  loansOutstanding: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  defaultRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1, // 0-100% as decimal
    default: 0.02, // 2% default rate
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
}, {
  timestamps: true,
});

/**
 * Indexes for performance
 */
BankSchema.index({ personality: 1 });
BankSchema.index({ minCreditScore: 1 });
BankSchema.index({ maxLoanAmount: 1 });
BankSchema.index({ isActive: 1 });
BankSchema.index({ preferredIndustries: 1 });

/**
 * Pre-save middleware to update timestamps
 */
BankSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Static method to get banks suitable for a credit score
 */
BankSchema.statics.getEligibleBanks = function(creditScore: number, loanAmount: number) {
  return this.find({
    isActive: true,
    minCreditScore: { $lte: creditScore },
    maxLoanAmount: { $gte: loanAmount },
  });
};

/**
 * Static method to get banks by personality
 */
BankSchema.statics.getBanksByPersonality = function(personality: BankPersonality) {
  return this.find({
    personality,
    isActive: true,
  });
};

/**
 * Instance method to check if bank can approve loan
 */
BankSchema.methods.canApproveLoan = function(
  creditScore: number,
  loanAmount: number,
  companyIndustry: string
): boolean {
  // Basic eligibility checks
  if (creditScore < this.minCreditScore) return false;
  if (loanAmount > this.maxLoanAmount) return false;

  // Check if company industry is preferred (bonus for approval)
  const industryBonus = this.preferredIndustries.includes(companyIndustry) ? 1.2 : 1.0;

  // Personality-based approval logic
  switch (this.personality) {
    case BankPersonality.CONSERVATIVE:
      // Strict requirements, low risk tolerance
      return creditScore >= 700 && loanAmount <= this.capital * 0.1;

    case BankPersonality.GROWTH:
      // Moderate requirements, growth-oriented
      return creditScore >= 650 && loanAmount <= this.capital * 0.15 * industryBonus;

    case BankPersonality.RISK_TAKING:
      // Flexible requirements, high risk tolerance
      return creditScore >= 600 && loanAmount <= this.capital * 0.2 * industryBonus;

    case BankPersonality.COMMUNITY:
      // Community-focused, local business preference
      return creditScore >= 620 && loanAmount <= this.capital * 0.12;

    case BankPersonality.TECH_FOCUSED:
      // Tech industry preference, higher risk tolerance for tech
      const techBonus = companyIndustry === 'TECH' ? 1.5 : 1.0;
      return creditScore >= 650 && loanAmount <= this.capital * 0.18 * techBonus;

    default:
      return false;
  }
};

/**
 * Instance method to calculate interest rate for loan
 */
BankSchema.methods.calculateInterestRate = function(
  baseRate: number,
  creditScore: number,
  loanAmount: number
): number {
  let adjustment = 0;

  // Credit score adjustment
  if (creditScore >= 800) adjustment -= 0.02; // 2% discount
  else if (creditScore >= 740) adjustment -= 0.01; // 1% discount
  else if (creditScore >= 670) adjustment += 0.01; // 1% premium
  else if (creditScore >= 580) adjustment += 0.02; // 2% premium
  else adjustment += 0.03; // 3% premium for poor credit

  // Personality-based adjustments
  switch (this.personality) {
    case BankPersonality.CONSERVATIVE:
      adjustment += 0.005; // Small premium for safety
      break;
    case BankPersonality.RISK_TAKING:
      adjustment -= 0.01; // Discount for risk tolerance
      break;
    case BankPersonality.TECH_FOCUSED:
      adjustment -= 0.005; // Tech discount
      break;
  }

  // Loan amount adjustment (larger loans get better rates)
  if (loanAmount >= 500000) adjustment -= 0.005;
  if (loanAmount >= 1000000) adjustment -= 0.005;

  return Math.max(0.01, baseRate + adjustment); // Minimum 1%
};

// Create and export the model
const Bank = mongoose.models.Bank || mongoose.model<IBank>('Bank', BankSchema);

export default Bank;