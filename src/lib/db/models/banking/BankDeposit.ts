/**
 * @file src/lib/db/models/banking/BankDeposit.ts
 * @description BankDeposit Mongoose model for banking gameplay
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents customer deposits in the player's bank.
 * Deposits provide the capital the bank uses to make loans.
 * Different account types offer different interest rates and terms.
 *
 * FEATURES:
 * - Multiple account types (Checking, Savings, CD, Money Market)
 * - Interest accrual on deposits
 * - Withdrawal tracking and limits
 * - Customer loyalty and satisfaction
 * - Deposit insurance simulation
 *
 * GAMEPLAY:
 * - Player sets interest rates to attract depositors
 * - Higher rates = more deposits but higher costs
 * - Balance deposits vs loans for profitability
 * - Customer satisfaction affects retention
 *
 * USAGE:
 * import BankDeposit from '@/lib/db/models/banking/BankDeposit';
 * const deposits = await BankDeposit.find({ bankId });
 */

import mongoose, { Schema, Document, Model, HydratedDocument } from 'mongoose';

/**
 * Account types with different characteristics
 */
export enum AccountType {
  CHECKING = 'CHECKING',       // Low/no interest, unlimited access
  SAVINGS = 'SAVINGS',         // Low interest, limited withdrawals
  MONEY_MARKET = 'MONEY_MARKET', // Higher interest, minimum balance
  CD_3_MONTH = 'CD_3_MONTH',   // Locked for 3 months
  CD_6_MONTH = 'CD_6_MONTH',   // Locked for 6 months
  CD_12_MONTH = 'CD_12_MONTH', // Locked for 12 months
  CD_24_MONTH = 'CD_24_MONTH', // Locked for 24 months
}

/**
 * Deposit status
 */
export enum DepositStatus {
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',     // CD has matured
  CLOSED = 'CLOSED',        // Customer closed account
  WITHDRAWN = 'WITHDRAWN',  // Withdrawn (with penalty if CD)
}

/**
 * Customer type affects behavior
 */
export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  CORPORATE = 'CORPORATE',
  HIGH_NET_WORTH = 'HIGH_NET_WORTH',
}

/**
 * Transaction record for account activity
 */
export interface IDepositTransaction {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST' | 'FEE' | 'PENALTY';
  amount: number;
  balanceAfter: number;
  date: Date;
  description?: string;
}

/**
 * BankDeposit document interface
 */
export interface IBankDeposit extends Document {
  // Bank relationship
  bankId: string;           // Player's bank company ID
  
  // Customer info (generated NPC)
  customerName: string;
  customerType: CustomerType;
  customerSince: Date;
  satisfactionScore: number; // 1-100
  
  // Account details
  accountType: AccountType;
  status: DepositStatus;
  
  // Balance tracking
  balance: number;
  initialDeposit: number;
  interestRate: number;       // Annual rate offered
  interestAccrued: number;    // Total interest paid
  lastInterestDate: Date;
  
  // CD-specific
  maturityDate?: Date;
  earlyWithdrawalPenalty?: number; // Months of interest forfeited
  
  // Transaction history
  transactions: IDepositTransaction[];
  monthlyWithdrawals: number;  // Count this month (for savings limits)
  lastWithdrawalDate?: Date;
  
  // Timestamps
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  deposit(amount: number): Promise<IBankDeposit>;
  withdraw(amount: number): Promise<{ success: boolean; penalty?: number; message: string }>;
  accrueInterest(): Promise<IBankDeposit>;
  close(): Promise<{ finalBalance: number; penalty?: number }>;
  calculateEarlyWithdrawalPenalty(): number;
}

/**
 * BankDeposit model interface with static methods
 */
export interface IBankDepositModel extends Model<IBankDeposit> {
  getTotalDeposits(bankId: string): Promise<number>;
  getDepositsByType(bankId: string): Promise<Record<AccountType, { count: number; total: number }>>;
  processMonthlyInterest(bankId: string): Promise<number>;
  generateRandomDepositor(bankId: string, bankLevel: number): Promise<HydratedDocument<IBankDeposit>>;
  resetMonthlyWithdrawalCounts(bankId: string): Promise<number>;
}

/**
 * BankDeposit schema
 */
const BankDepositSchema = new Schema<IBankDeposit>(
  {
    bankId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Customer info
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: Object.values(CustomerType),
      required: true,
      default: CustomerType.INDIVIDUAL,
    },
    customerSince: {
      type: Date,
      required: true,
      default: Date.now,
    },
    satisfactionScore: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 75,
    },
    
    // Account details
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DepositStatus),
      required: true,
      default: DepositStatus.ACTIVE,
    },
    
    // Balance tracking
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    initialDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 0.15, // Max 15% APY
    },
    interestAccrued: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastInterestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    
    // CD-specific
    maturityDate: {
      type: Date,
    },
    earlyWithdrawalPenalty: {
      type: Number,
      min: 0,
    },
    
    // Transaction history
    transactions: [{
      type: {
        type: String,
        enum: ['DEPOSIT', 'WITHDRAWAL', 'INTEREST', 'FEE', 'PENALTY'],
        required: true,
      },
      amount: { type: Number, required: true },
      balanceAfter: { type: Number, required: true },
      date: { type: Date, required: true, default: Date.now },
      description: { type: String, trim: true },
    }],
    monthlyWithdrawals: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lastWithdrawalDate: {
      type: Date,
    },
    
    // Timestamps
    openedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
BankDepositSchema.index({ status: 1 });
BankDepositSchema.index({ accountType: 1 });
BankDepositSchema.index({ maturityDate: 1 });
BankDepositSchema.index({ customerType: 1 });

/**
 * Account type configurations
 */
const ACCOUNT_CONFIG: Record<AccountType, {
  minBalance: number;
  monthlyWithdrawalLimit: number;
  earlyPenaltyMonths?: number;
  baseInterestRate: number;
}> = {
  [AccountType.CHECKING]: {
    minBalance: 0,
    monthlyWithdrawalLimit: Infinity,
    baseInterestRate: 0.001, // 0.1%
  },
  [AccountType.SAVINGS]: {
    minBalance: 100,
    monthlyWithdrawalLimit: 6, // Federal Reg D limit
    baseInterestRate: 0.02, // 2%
  },
  [AccountType.MONEY_MARKET]: {
    minBalance: 2500,
    monthlyWithdrawalLimit: 6,
    baseInterestRate: 0.03, // 3%
  },
  [AccountType.CD_3_MONTH]: {
    minBalance: 500,
    monthlyWithdrawalLimit: 0,
    earlyPenaltyMonths: 1,
    baseInterestRate: 0.035, // 3.5%
  },
  [AccountType.CD_6_MONTH]: {
    minBalance: 500,
    monthlyWithdrawalLimit: 0,
    earlyPenaltyMonths: 3,
    baseInterestRate: 0.04, // 4%
  },
  [AccountType.CD_12_MONTH]: {
    minBalance: 500,
    monthlyWithdrawalLimit: 0,
    earlyPenaltyMonths: 6,
    baseInterestRate: 0.045, // 4.5%
  },
  [AccountType.CD_24_MONTH]: {
    minBalance: 1000,
    monthlyWithdrawalLimit: 0,
    earlyPenaltyMonths: 12,
    baseInterestRate: 0.05, // 5%
  },
};

/**
 * Instance method: Make a deposit
 */
BankDepositSchema.methods.deposit = async function(amount: number) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  
  this.balance += amount;
  this.transactions.push({
    type: 'DEPOSIT',
    amount,
    balanceAfter: this.balance,
    date: new Date(),
    description: 'Deposit',
  });
  
  // Increase satisfaction slightly
  this.satisfactionScore = Math.min(100, this.satisfactionScore + 1);
  
  await this.save();
  return this;
};

/**
 * Instance method: Make a withdrawal
 */
BankDepositSchema.methods.withdraw = async function(
  amount: number
): Promise<{ success: boolean; penalty?: number; message: string }> {
  if (amount <= 0) {
    return { success: false, message: 'Withdrawal amount must be positive' };
  }
  
  if (amount > this.balance) {
    return { success: false, message: 'Insufficient funds' };
  }
  
  const config = ACCOUNT_CONFIG[this.accountType as AccountType];
  
  // Check minimum balance for Money Market
  if (this.accountType === AccountType.MONEY_MARKET) {
    if (this.balance - amount < config.minBalance) {
      return { success: false, message: `Money Market requires minimum balance of $${config.minBalance}` };
    }
  }
  
  // Check withdrawal limits for savings/money market
  if (config.monthlyWithdrawalLimit !== Infinity && config.monthlyWithdrawalLimit > 0) {
    if (this.monthlyWithdrawals >= config.monthlyWithdrawalLimit) {
      return { success: false, message: `Exceeded ${config.monthlyWithdrawalLimit} monthly withdrawals` };
    }
  }
  
  // Handle CD early withdrawal
  let penalty = 0;
  if (this.accountType.startsWith('CD_')) {
    if (this.maturityDate && new Date() < this.maturityDate) {
      penalty = this.calculateEarlyWithdrawalPenalty();
      // Decrease satisfaction significantly for early CD withdrawal
      this.satisfactionScore = Math.max(1, this.satisfactionScore - 20);
    }
  }
  
  this.balance -= amount;
  if (penalty > 0) {
    this.balance -= penalty;
    this.transactions.push({
      type: 'PENALTY',
      amount: -penalty,
      balanceAfter: this.balance,
      date: new Date(),
      description: 'Early withdrawal penalty',
    });
  }
  
  this.transactions.push({
    type: 'WITHDRAWAL',
    amount: -amount,
    balanceAfter: this.balance,
    date: new Date(),
    description: penalty > 0 ? 'Early CD withdrawal' : 'Withdrawal',
  });
  
  this.monthlyWithdrawals += 1;
  this.lastWithdrawalDate = new Date();
  
  await this.save();
  return { 
    success: true, 
    penalty: penalty > 0 ? penalty : undefined,
    message: penalty > 0 ? `Withdrawal processed with $${penalty.toFixed(2)} penalty` : 'Withdrawal processed'
  };
};

/**
 * Instance method: Calculate early withdrawal penalty
 */
BankDepositSchema.methods.calculateEarlyWithdrawalPenalty = function(): number {
  const config = ACCOUNT_CONFIG[this.accountType as AccountType];
  if (!config.earlyPenaltyMonths) return 0;
  
  // Penalty is X months of interest
  const monthlyRate = this.interestRate / 12;
  return this.balance * monthlyRate * config.earlyPenaltyMonths;
};

/**
 * Instance method: Accrue interest
 */
BankDepositSchema.methods.accrueInterest = async function() {
  if (this.status !== DepositStatus.ACTIVE) return this;
  
  const now = new Date();
  const lastDate = this.lastInterestDate;
  const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 1) return this; // Don't accrue more than once per day
  
  // Daily interest accrual
  const dailyRate = this.interestRate / 365;
  const interest = this.balance * dailyRate * daysDiff;
  
  if (interest > 0) {
    this.balance += interest;
    this.interestAccrued += interest;
    this.lastInterestDate = now;
    
    this.transactions.push({
      type: 'INTEREST',
      amount: interest,
      balanceAfter: this.balance,
      date: now,
      description: `Interest for ${daysDiff} day(s)`,
    });
    
    await this.save();
  }
  
  return this;
};

/**
 * Instance method: Close account
 */
BankDepositSchema.methods.close = async function(): Promise<{ finalBalance: number; penalty?: number }> {
  let penalty = 0;
  
  // Calculate penalty for CDs
  if (this.accountType.startsWith('CD_') && this.maturityDate && new Date() < this.maturityDate) {
    penalty = this.calculateEarlyWithdrawalPenalty();
    this.balance -= penalty;
    
    this.transactions.push({
      type: 'PENALTY',
      amount: -penalty,
      balanceAfter: this.balance,
      date: new Date(),
      description: 'Early closure penalty',
    });
  }
  
  const finalBalance = this.balance;
  this.balance = 0;
  this.status = DepositStatus.CLOSED;
  this.closedAt = new Date();
  
  this.transactions.push({
    type: 'WITHDRAWAL',
    amount: -finalBalance,
    balanceAfter: 0,
    date: new Date(),
    description: 'Account closure - final withdrawal',
  });
  
  await this.save();
  
  return { finalBalance, penalty: penalty > 0 ? penalty : undefined };
};

/**
 * Static method: Get total deposits for a bank
 */
BankDepositSchema.statics.getTotalDeposits = async function(bankId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { bankId, status: DepositStatus.ACTIVE } },
    { $group: { _id: null, total: { $sum: '$balance' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Static method: Get deposits breakdown by type
 */
BankDepositSchema.statics.getDepositsByType = async function(
  bankId: string
): Promise<Record<AccountType, { count: number; total: number }>> {
  const result = await this.aggregate([
    { $match: { bankId, status: DepositStatus.ACTIVE } },
    {
      $group: {
        _id: '$accountType',
        count: { $sum: 1 },
        total: { $sum: '$balance' },
      },
    },
  ]);
  
  const breakdown: Record<string, { count: number; total: number }> = {};
  for (const type of Object.values(AccountType)) {
    breakdown[type] = { count: 0, total: 0 };
  }
  for (const item of result) {
    breakdown[item._id] = { count: item.count, total: item.total };
  }
  
  return breakdown as Record<AccountType, { count: number; total: number }>;
};

/**
 * Static method: Process monthly interest for all accounts
 */
BankDepositSchema.statics.processMonthlyInterest = async function(bankId: string): Promise<number> {
  const deposits = await this.find({ bankId, status: DepositStatus.ACTIVE });
  let totalInterestPaid = 0;
  
  for (const deposit of deposits) {
    const beforeBalance = deposit.balance;
    await deposit.accrueInterest();
    totalInterestPaid += deposit.balance - beforeBalance;
  }
  
  return totalInterestPaid;
};

/**
 * Static method: Reset monthly withdrawal counts
 */
BankDepositSchema.statics.resetMonthlyWithdrawalCounts = async function(bankId: string): Promise<number> {
  const result = await this.updateMany(
    { bankId, status: DepositStatus.ACTIVE },
    { $set: { monthlyWithdrawals: 0 } }
  );
  return result.modifiedCount;
};

/**
 * Static method: Generate random depositor
 */
BankDepositSchema.statics.generateRandomDepositor = async function(
  bankId: string,
  bankLevel: number = 1
): Promise<HydratedDocument<IBankDeposit>> {
  // Name generation
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Sophia', 'Elijah', 'Isabella', 'Lucas', 'Mia', 'Mason', 'Charlotte', 'Logan', 'Amelia', 'Ethan', 'Harper', 'James', 'Evelyn', 'Benjamin'];
  const lastNames = ['Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker'];
  const customerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  // Customer type weighted by bank level
  let customerType: CustomerType;
  const typeRoll = Math.random();
  if (typeRoll < 0.6) {
    customerType = CustomerType.INDIVIDUAL;
  } else if (typeRoll < 0.8) {
    customerType = CustomerType.SMALL_BUSINESS;
  } else if (typeRoll < 0.9 + bankLevel * 0.01) {
    customerType = CustomerType.CORPORATE;
  } else {
    customerType = CustomerType.HIGH_NET_WORTH;
  }
  
  // Account type selection
  const accountTypes = Object.values(AccountType);
  let accountType: AccountType;
  const accountRoll = Math.random();
  if (accountRoll < 0.3) {
    accountType = AccountType.CHECKING;
  } else if (accountRoll < 0.55) {
    accountType = AccountType.SAVINGS;
  } else if (accountRoll < 0.7) {
    accountType = AccountType.MONEY_MARKET;
  } else {
    // Random CD
    const cds = [AccountType.CD_3_MONTH, AccountType.CD_6_MONTH, AccountType.CD_12_MONTH, AccountType.CD_24_MONTH];
    accountType = cds[Math.floor(Math.random() * cds.length)];
  }
  
  const config = ACCOUNT_CONFIG[accountType];
  
  // Initial deposit based on customer type and account type
  let baseDeposit: number;
  switch (customerType) {
    case CustomerType.INDIVIDUAL:
      baseDeposit = 1000 + Math.random() * 10000;
      break;
    case CustomerType.SMALL_BUSINESS:
      baseDeposit = 5000 + Math.random() * 50000;
      break;
    case CustomerType.CORPORATE:
      baseDeposit = 50000 + Math.random() * 500000;
      break;
    case CustomerType.HIGH_NET_WORTH:
      baseDeposit = 100000 + Math.random() * 1000000;
      break;
  }
  
  // Ensure minimum balance met
  const initialDeposit = Math.max(config.minBalance, Math.round(baseDeposit * 100) / 100);
  
  // Interest rate (bank level can offer better rates)
  const interestRate = config.baseInterestRate + (bankLevel * 0.001); // +0.1% per level
  
  // Calculate maturity date for CDs
  let maturityDate: Date | undefined;
  if (accountType.startsWith('CD_')) {
    const months = parseInt(accountType.replace('CD_', '').replace('_MONTH', ''));
    maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + months);
  }
  
  // Satisfaction score
  const satisfactionScore = 65 + Math.floor(Math.random() * 30); // 65-95
  
  const deposit = new this({
    bankId,
    customerName,
    customerType,
    customerSince: new Date(),
    satisfactionScore,
    accountType,
    status: DepositStatus.ACTIVE,
    balance: initialDeposit,
    initialDeposit,
    interestRate,
    maturityDate,
    earlyWithdrawalPenalty: config.earlyPenaltyMonths,
    openedAt: new Date(),
    transactions: [{
      type: 'DEPOSIT',
      amount: initialDeposit,
      balanceAfter: initialDeposit,
      date: new Date(),
      description: 'Initial deposit',
    }],
  });
  
  await deposit.save();
  return deposit;
};

// Create and export the model
const BankDeposit = mongoose.models.BankDeposit || 
  mongoose.model<IBankDeposit, IBankDepositModel>('BankDeposit', BankDepositSchema);

export default BankDeposit;
