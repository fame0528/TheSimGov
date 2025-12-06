/**
 * @file src/lib/db/models/banking/BankSettings.ts
 * @description BankSettings Mongoose model for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Configuration and state for the player's bank.
 * Controls interest rates, loan limits, approval policies, and bank leveling.
 * This is the "control panel" for the banking business.
 *
 * FEATURES:
 * - Deposit interest rates by account type
 * - Loan interest rates by risk tier
 * - Approval policy (conservative to aggressive)
 * - Bank level progression with unlocks
 * - Capital requirements and reserve ratios
 * - Daily/weekly limits and quotas
 *
 * GAMEPLAY:
 * - Players adjust settings to optimize profit vs risk
 * - Level up to unlock better rates and higher limits
 * - Balance deposit rates (cost) vs loan rates (revenue)
 * - Manage capital reserve for stability
 *
 * USAGE:
 * import BankSettings from '@/lib/db/models/banking/BankSettings';
 * const settings = await BankSettings.findOne({ companyId });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { AccountType } from './BankDeposit';
import { RiskTier } from './LoanApplicant';

/**
 * Approval policy determines how strictly the bank evaluates applicants
 */
export enum ApprovalPolicy {
  CONSERVATIVE = 'CONSERVATIVE', // Only prime borrowers, low risk
  MODERATE = 'MODERATE',         // Balanced approach
  AGGRESSIVE = 'AGGRESSIVE',     // Accept higher risk for higher returns
  PREDATORY = 'PREDATORY',       // Very high rates, accepts almost anyone (reputation cost)
}

/**
 * Bank level unlocks
 */
export interface BankLevelUnlock {
  level: number;
  name: string;
  description: string;
  maxLoanAmount: number;
  maxDepositRate: number;
  unlockFeatures: string[];
}

/**
 * Daily statistics tracking
 */
export interface DailyStats {
  date: Date;
  loansApproved: number;
  loansRejected: number;
  loansDefaulted: number;
  depositsReceived: number;
  withdrawalsProcessed: number;
  interestEarned: number;
  interestPaid: number;
  netIncome: number;
}

/**
 * BankSettings document interface
 */
export interface IBankSettings extends Document {
  // Bank identity
  companyId: string;          // Player's bank company ID
  bankName: string;           // Display name
  slogan?: string;            // Bank's marketing slogan
  
  // Bank level progression
  level: number;              // 1-20
  experience: number;         // XP toward next level
  totalLoansIssued: number;   // Lifetime count
  totalLoansValue: number;    // Lifetime value
  totalDepositsReceived: number;
  successfulRepayments: number;
  defaults: number;
  
  // Deposit rates (what bank PAYS to depositors)
  depositRates: {
    checking: number;
    savings: number;
    moneyMarket: number;
    cd3Month: number;
    cd6Month: number;
    cd12Month: number;
    cd24Month: number;
  };
  
  // Loan rates (what bank CHARGES borrowers) - by risk tier
  loanRates: {
    prime: number;
    nearPrime: number;
    subprime: number;
    deepSubprime: number;
  };
  
  // Approval policy
  approvalPolicy: ApprovalPolicy;
  autoApproveBelow: number;   // Auto-approve loans under this amount (0 = disabled)
  autoRejectAbove: number;    // Auto-reject loans above this amount (0 = disabled)
  minCreditScoreAccepted: number;
  maxDebtToIncomeRatio: number;
  
  // Limits (increase with level)
  maxSingleLoanAmount: number;
  maxTotalLoansOutstanding: number;
  maxDailyApprovals: number;
  
  // Capital management
  capitalReserve: number;     // Liquid capital for operations
  targetReserveRatio: number; // Target reserve as % of deposits
  currentReserveRatio: number;
  
  // Reputation and marketing
  reputation: number;         // 1-100, affects customer quality
  marketingBudget: number;    // Daily spend on attracting customers
  applicantsPerDay: number;   // Base rate of new applicants
  
  // Operating costs
  dailyOperatingCost: number;
  employeeCount: number;
  branchCount: number;
  
  // Statistics
  dailyStats: DailyStats[];
  lastStatsDate: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateNetInterestMargin(): number;
  canApproveLoan(amount: number, riskTier: RiskTier): boolean;
  getLevelProgress(): { current: number; next: number; progress: number };
  addExperience(xp: number): Promise<{ leveledUp: boolean; newLevel?: number }>;
  updateDailyStats(stats: Partial<DailyStats>): Promise<void>;
  getEffectiveLoanRate(riskTier: RiskTier): number;
  getEffectiveDepositRate(accountType: AccountType): number;
}

/**
 * BankSettings model interface with static methods
 */
export interface IBankSettingsModel extends Model<IBankSettings> {
  getOrCreate(companyId: string, bankName: string): Promise<IBankSettings>;
  getLeaderboard(): Promise<IBankSettings[]>;
}

/**
 * Level requirements and unlocks
 */
export const BANK_LEVELS: BankLevelUnlock[] = [
  { level: 1, name: 'Startup Bank', description: 'Just starting out', maxLoanAmount: 50000, maxDepositRate: 0.02, unlockFeatures: ['Basic Checking', 'Basic Savings'] },
  { level: 2, name: 'Neighborhood Bank', description: 'Known in the community', maxLoanAmount: 100000, maxDepositRate: 0.025, unlockFeatures: ['CD 3-Month'] },
  { level: 3, name: 'Community Bank', description: 'Trusted local institution', maxLoanAmount: 200000, maxDepositRate: 0.03, unlockFeatures: ['CD 6-Month', 'Auto Loans'] },
  { level: 4, name: 'Regional Bank', description: 'Growing presence', maxLoanAmount: 500000, maxDepositRate: 0.035, unlockFeatures: ['Money Market', 'Business Loans'] },
  { level: 5, name: 'State Bank', description: 'Statewide recognition', maxLoanAmount: 1000000, maxDepositRate: 0.04, unlockFeatures: ['CD 12-Month', 'Mortgages'] },
  { level: 6, name: 'Multi-State Bank', description: 'Crossing borders', maxLoanAmount: 2000000, maxDepositRate: 0.042, unlockFeatures: ['Investment Products'] },
  { level: 7, name: 'National Bank', description: 'Nationwide presence', maxLoanAmount: 5000000, maxDepositRate: 0.045, unlockFeatures: ['CD 24-Month', 'Commercial Loans'] },
  { level: 8, name: 'Major Bank', description: 'Industry player', maxLoanAmount: 10000000, maxDepositRate: 0.048, unlockFeatures: ['Credit Cards'] },
  { level: 9, name: 'Super-Regional Bank', description: 'Dominant in regions', maxLoanAmount: 25000000, maxDepositRate: 0.05, unlockFeatures: ['Wealth Management'] },
  { level: 10, name: 'Top 50 Bank', description: 'Among the elite', maxLoanAmount: 50000000, maxDepositRate: 0.052, unlockFeatures: ['Private Banking'] },
  { level: 11, name: 'Top 25 Bank', description: 'Major player', maxLoanAmount: 100000000, maxDepositRate: 0.054, unlockFeatures: ['Investment Banking Lite'] },
  { level: 12, name: 'Top 10 Bank', description: 'Industry leader', maxLoanAmount: 250000000, maxDepositRate: 0.056, unlockFeatures: ['Syndicated Loans'] },
  { level: 13, name: 'Mega Bank', description: 'Too big to ignore', maxLoanAmount: 500000000, maxDepositRate: 0.058, unlockFeatures: ['Derivatives Trading'] },
  { level: 14, name: 'Systemically Important', description: 'Too big to fail', maxLoanAmount: 1000000000, maxDepositRate: 0.06, unlockFeatures: ['Government Contracts'] },
  { level: 15, name: 'Global Bank', description: 'International presence', maxLoanAmount: 2500000000, maxDepositRate: 0.062, unlockFeatures: ['Currency Trading'] },
  { level: 16, name: 'World Bank', description: 'Global powerhouse', maxLoanAmount: 5000000000, maxDepositRate: 0.064, unlockFeatures: ['Sovereign Lending'] },
  { level: 17, name: 'Financial Empire', description: 'Controlling markets', maxLoanAmount: 10000000000, maxDepositRate: 0.066, unlockFeatures: ['Market Making'] },
  { level: 18, name: 'Banking Titan', description: 'Legendary institution', maxLoanAmount: 25000000000, maxDepositRate: 0.068, unlockFeatures: ['Central Bank Deals'] },
  { level: 19, name: 'Supreme Bank', description: 'Unrivaled power', maxLoanAmount: 50000000000, maxDepositRate: 0.07, unlockFeatures: ['Economic Influence'] },
  { level: 20, name: 'The Bank', description: 'There is only one', maxLoanAmount: 100000000000, maxDepositRate: 0.075, unlockFeatures: ['Complete Dominance'] },
];

/**
 * XP requirements per level
 */
const XP_PER_LEVEL = [
  0,      // Level 1 (start)
  1000,   // Level 2
  3000,   // Level 3
  7000,   // Level 4
  15000,  // Level 5
  30000,  // Level 6
  50000,  // Level 7
  80000,  // Level 8
  120000, // Level 9
  180000, // Level 10
  250000, // Level 11
  350000, // Level 12
  500000, // Level 13
  700000, // Level 14
  1000000, // Level 15
  1500000, // Level 16
  2200000, // Level 17
  3200000, // Level 18
  4500000, // Level 19
  6500000, // Level 20
];

/**
 * BankSettings schema
 */
const BankSettingsSchema = new Schema<IBankSettings>(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    slogan: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    // Level progression
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      default: 1,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalLoansIssued: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalLoansValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalDepositsReceived: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    successfulRepayments: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    defaults: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Deposit rates
    depositRates: {
      checking: { type: Number, default: 0.001, min: 0, max: 0.15 },
      savings: { type: Number, default: 0.02, min: 0, max: 0.15 },
      moneyMarket: { type: Number, default: 0.03, min: 0, max: 0.15 },
      cd3Month: { type: Number, default: 0.035, min: 0, max: 0.15 },
      cd6Month: { type: Number, default: 0.04, min: 0, max: 0.15 },
      cd12Month: { type: Number, default: 0.045, min: 0, max: 0.15 },
      cd24Month: { type: Number, default: 0.05, min: 0, max: 0.15 },
    },
    
    // Loan rates
    loanRates: {
      prime: { type: Number, default: 0.05, min: 0.01, max: 0.35 },
      nearPrime: { type: Number, default: 0.08, min: 0.01, max: 0.35 },
      subprime: { type: Number, default: 0.15, min: 0.01, max: 0.35 },
      deepSubprime: { type: Number, default: 0.25, min: 0.01, max: 0.35 },
    },
    
    // Approval policy
    approvalPolicy: {
      type: String,
      enum: Object.values(ApprovalPolicy),
      default: ApprovalPolicy.MODERATE,
    },
    autoApproveBelow: {
      type: Number,
      default: 0,
      min: 0,
    },
    autoRejectAbove: {
      type: Number,
      default: 0,
      min: 0,
    },
    minCreditScoreAccepted: {
      type: Number,
      default: 550,
      min: 300,
      max: 850,
    },
    maxDebtToIncomeRatio: {
      type: Number,
      default: 0.43,
      min: 0.1,
      max: 0.8,
    },
    
    // Limits
    maxSingleLoanAmount: {
      type: Number,
      default: 50000,
      min: 1000,
    },
    maxTotalLoansOutstanding: {
      type: Number,
      default: 500000,
      min: 10000,
    },
    maxDailyApprovals: {
      type: Number,
      default: 10,
      min: 1,
    },
    
    // Capital management
    capitalReserve: {
      type: Number,
      default: 100000,
      min: 0,
    },
    targetReserveRatio: {
      type: Number,
      default: 0.1,
      min: 0.05,
      max: 0.5,
    },
    currentReserveRatio: {
      type: Number,
      default: 0.1,
      min: 0,
    },
    
    // Reputation
    reputation: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    marketingBudget: {
      type: Number,
      default: 1000,
      min: 0,
    },
    applicantsPerDay: {
      type: Number,
      default: 5,
      min: 1,
    },
    
    // Operating costs
    dailyOperatingCost: {
      type: Number,
      default: 500,
      min: 0,
    },
    employeeCount: {
      type: Number,
      default: 5,
      min: 1,
    },
    branchCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    
    // Statistics
    dailyStats: [{
      date: { type: Date, required: true },
      loansApproved: { type: Number, default: 0 },
      loansRejected: { type: Number, default: 0 },
      loansDefaulted: { type: Number, default: 0 },
      depositsReceived: { type: Number, default: 0 },
      withdrawalsProcessed: { type: Number, default: 0 },
      interestEarned: { type: Number, default: 0 },
      interestPaid: { type: Number, default: 0 },
      netIncome: { type: Number, default: 0 },
    }],
    lastStatsDate: {
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
BankSettingsSchema.index({ level: -1 });
BankSettingsSchema.index({ reputation: -1 });
BankSettingsSchema.index({ totalLoansValue: -1 });

/**
 * Instance method: Calculate net interest margin
 */
BankSettingsSchema.methods.calculateNetInterestMargin = function(): number {
  // Simplified: Average loan rate - average deposit rate
  const avgLoanRate = (
    this.loanRates.prime +
    this.loanRates.nearPrime +
    this.loanRates.subprime +
    this.loanRates.deepSubprime
  ) / 4;
  
  const avgDepositRate = (
    this.depositRates.checking +
    this.depositRates.savings +
    this.depositRates.moneyMarket +
    this.depositRates.cd3Month +
    this.depositRates.cd6Month +
    this.depositRates.cd12Month +
    this.depositRates.cd24Month
  ) / 7;
  
  return avgLoanRate - avgDepositRate;
};

/**
 * Instance method: Check if can approve loan
 */
BankSettingsSchema.methods.canApproveLoan = function(
  amount: number,
  riskTier: RiskTier
): boolean {
  // Check amount limits
  if (amount > this.maxSingleLoanAmount) return false;
  
  // Check policy
  switch (this.approvalPolicy) {
    case ApprovalPolicy.CONSERVATIVE:
      return riskTier === RiskTier.PRIME || riskTier === RiskTier.NEAR_PRIME;
    case ApprovalPolicy.MODERATE:
      return riskTier !== RiskTier.DEEP_SUBPRIME;
    case ApprovalPolicy.AGGRESSIVE:
      return true;
    case ApprovalPolicy.PREDATORY:
      return true;
    default:
      return false;
  }
};

/**
 * Instance method: Get level progress
 */
BankSettingsSchema.methods.getLevelProgress = function(): {
  current: number;
  next: number;
  progress: number;
} {
  const currentXp = XP_PER_LEVEL[this.level - 1] || 0;
  const nextXp = XP_PER_LEVEL[this.level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const xpInLevel = this.experience - currentXp;
  const xpNeeded = nextXp - currentXp;
  
  return {
    current: xpInLevel,
    next: xpNeeded,
    progress: xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100,
  };
};

/**
 * Instance method: Add experience and potentially level up
 */
BankSettingsSchema.methods.addExperience = async function(
  xp: number
): Promise<{ leveledUp: boolean; newLevel?: number }> {
  this.experience += xp;
  
  let leveledUp = false;
  let newLevel: number | undefined;
  
  // Check for level up
  while (
    this.level < 20 &&
    this.experience >= XP_PER_LEVEL[this.level]
  ) {
    this.level += 1;
    leveledUp = true;
    newLevel = this.level;
    
    // Apply level bonuses
    const levelConfig = BANK_LEVELS[this.level - 1];
    if (levelConfig) {
      this.maxSingleLoanAmount = levelConfig.maxLoanAmount;
      // Could also update other limits here
    }
  }
  
  await this.save();
  return { leveledUp, newLevel };
};

/**
 * Instance method: Update daily stats
 */
BankSettingsSchema.methods.updateDailyStats = async function(
  stats: Partial<DailyStats>
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find or create today's stats
  let todayStats = this.dailyStats.find(
    (s: DailyStats) => s.date.getTime() === today.getTime()
  );
  
  if (!todayStats) {
    todayStats = {
      date: today,
      loansApproved: 0,
      loansRejected: 0,
      loansDefaulted: 0,
      depositsReceived: 0,
      withdrawalsProcessed: 0,
      interestEarned: 0,
      interestPaid: 0,
      netIncome: 0,
    };
    this.dailyStats.push(todayStats);
  }
  
  // Update stats
  if (stats.loansApproved) todayStats.loansApproved += stats.loansApproved;
  if (stats.loansRejected) todayStats.loansRejected += stats.loansRejected;
  if (stats.loansDefaulted) todayStats.loansDefaulted += stats.loansDefaulted;
  if (stats.depositsReceived) todayStats.depositsReceived += stats.depositsReceived;
  if (stats.withdrawalsProcessed) todayStats.withdrawalsProcessed += stats.withdrawalsProcessed;
  if (stats.interestEarned) todayStats.interestEarned += stats.interestEarned;
  if (stats.interestPaid) todayStats.interestPaid += stats.interestPaid;
  
  // Calculate net income
  todayStats.netIncome = todayStats.interestEarned - todayStats.interestPaid - this.dailyOperatingCost;
  
  // Keep only last 30 days
  if (this.dailyStats.length > 30) {
    this.dailyStats = this.dailyStats.slice(-30);
  }
  
  this.lastStatsDate = new Date();
  await this.save();
};

/**
 * Instance method: Get effective loan rate for a risk tier
 */
BankSettingsSchema.methods.getEffectiveLoanRate = function(riskTier: RiskTier): number {
  switch (riskTier) {
    case RiskTier.PRIME:
      return this.loanRates.prime;
    case RiskTier.NEAR_PRIME:
      return this.loanRates.nearPrime;
    case RiskTier.SUBPRIME:
      return this.loanRates.subprime;
    case RiskTier.DEEP_SUBPRIME:
      return this.loanRates.deepSubprime;
    default:
      return this.loanRates.nearPrime;
  }
};

/**
 * Instance method: Get effective deposit rate for an account type
 */
BankSettingsSchema.methods.getEffectiveDepositRate = function(accountType: AccountType): number {
  switch (accountType) {
    case AccountType.CHECKING:
      return this.depositRates.checking;
    case AccountType.SAVINGS:
      return this.depositRates.savings;
    case AccountType.MONEY_MARKET:
      return this.depositRates.moneyMarket;
    case AccountType.CD_3_MONTH:
      return this.depositRates.cd3Month;
    case AccountType.CD_6_MONTH:
      return this.depositRates.cd6Month;
    case AccountType.CD_12_MONTH:
      return this.depositRates.cd12Month;
    case AccountType.CD_24_MONTH:
      return this.depositRates.cd24Month;
    default:
      return this.depositRates.savings;
  }
};

/**
 * Static method: Get or create bank settings
 */
BankSettingsSchema.statics.getOrCreate = async function(
  companyId: string,
  bankName: string
): Promise<IBankSettings> {
  let settings = await this.findOne({ companyId });
  
  if (!settings) {
    settings = new this({
      companyId,
      bankName,
      slogan: 'Your trusted financial partner',
    });
    await settings.save();
  }
  
  return settings;
};

/**
 * Static method: Get bank leaderboard
 */
BankSettingsSchema.statics.getLeaderboard = async function(): Promise<IBankSettings[]> {
  return this.find()
    .sort({ level: -1, experience: -1 })
    .limit(100);
};

// Create and export the model
const BankSettings = mongoose.models.BankSettings || 
  mongoose.model<IBankSettings, IBankSettingsModel>('BankSettings', BankSettingsSchema);

export default BankSettings;
export { XP_PER_LEVEL };
