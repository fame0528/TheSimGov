/**
 * @file src/lib/db/models/Investment.ts
 * @description Investment Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for company investment portfolios supporting multiple investment types,
 * performance tracking, dividend payments, and portfolio management.
 *
 * FEATURES:
 * - 4 investment types (Stocks, Bonds, Real Estate, Index Funds)
 * - Real-time price tracking and performance calculation
 * - Dividend payment automation
 * - Portfolio rebalancing and optimization
 * - Risk assessment and diversification metrics
 *
 * USAGE:
 * import Investment from '@/lib/db/models/Investment';
 * const investments = await Investment.find({ companyId });
 */

import mongoose, { Schema, Document } from 'mongoose';
import { InvestmentType } from '@/lib/types/enums';

/**
 * Investment document interface
 */
export interface IInvestment extends Document {
  companyId: string;
  type: InvestmentType;
  amount: number; // Total invested amount
  purchasePrice: number; // Price per unit at purchase
  currentPrice: number; // Current price per unit
  units: number; // Number of units owned
  purchaseDate: Date;
  lastUpdated: Date;
  dividendsPaid: number; // Total dividends received
  expectedReturn: number; // Annual expected return (as decimal)
  volatility: number; // Risk/volatility measure (0-1)
  lastDividendDate?: Date;
  nextDividendDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Investment Portfolio document interface
 */
export interface IInvestmentPortfolio extends Document {
  companyId: string;
  totalValue: number;
  totalInvested: number;
  totalDividends: number;
  investments: string[]; // Investment IDs
  lastRebalanced?: Date;
  riskTolerance: number; // 1-10 scale
  targetAllocations: {
    [key in InvestmentType]?: number; // Target percentage for each type
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Investment schema
 */
const InvestmentSchema = new Schema<IInvestment>({
  companyId: {
    type: String,
    required: true,
    // index: true removed - using compound indexes { companyId: 1, type: 1 } and { companyId: 1, isActive: 1 }
  },
  type: {
    type: String,
    enum: Object.values(InvestmentType),
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1000, // Minimum $1k investment
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0.01,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0.01,
  },
  units: {
    type: Number,
    required: true,
    min: 0.01,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dividendsPaid: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  expectedReturn: {
    type: Number,
    required: true,
    min: 0,
    max: 1, // 0-100% as decimal
  },
  volatility: {
    type: Number,
    required: true,
    min: 0,
    max: 1, // 0-100% as decimal
  },
  lastDividendDate: {
    type: Date,
  },
  nextDividendDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

/**
 * Investment Portfolio schema
 */
const InvestmentPortfolioSchema = new Schema<IInvestmentPortfolio>({
  companyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  totalValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalInvested: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalDividends: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  investments: [{
    type: String,
    ref: 'Investment',
  }],
  lastRebalanced: {
    type: Date,
  },
  riskTolerance: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5,
  },
  targetAllocations: {
    type: Map,
    of: Number,
    default: {},
  },
}, {
  timestamps: true,
});

/**
 * Indexes for performance
 * Note: InvestmentPortfolio companyId has unique: true (line 155) which creates an index automatically
 */
InvestmentSchema.index({ companyId: 1, type: 1 });
InvestmentSchema.index({ companyId: 1, isActive: 1 });
InvestmentSchema.index({ nextDividendDate: 1 });
InvestmentSchema.index({ lastUpdated: 1 });

// Removed: InvestmentPortfolioSchema.index({ companyId: 1 }, { unique: true }) - duplicates field-level unique (line 155)

/**
 * Virtual for current value
 */
InvestmentSchema.virtual('currentValue').get(function() {
  return this.units * this.currentPrice;
});

/**
 * Virtual for total return
 */
InvestmentSchema.virtual('totalReturn').get(function() {
  const currentValue = this.units * this.currentPrice;
  return (currentValue + this.dividendsPaid) - this.amount;
});

/**
 * Virtual for return percentage
 */
InvestmentSchema.virtual('returnPercentage').get(function() {
  const currentValue = this.units * this.currentPrice;
  const totalReturn = (currentValue + this.dividendsPaid) - this.amount;
  return this.amount > 0 ? (totalReturn / this.amount) * 100 : 0;
});

/**
 * Instance method to update price
 */
InvestmentSchema.methods.updatePrice = function(newPrice: number): void {
  this.currentPrice = newPrice;
  this.lastUpdated = new Date();
};

/**
 * Instance method to pay dividend
 */
InvestmentSchema.methods.payDividend = function(dividendAmount: number): number {
  this.dividendsPaid += dividendAmount;
  this.lastDividendDate = new Date();

  // Schedule next dividend (quarterly for most investments)
  const nextDividend = new Date();
  nextDividend.setMonth(nextDividend.getMonth() + 3);
  this.nextDividendDate = nextDividend;

  return dividendAmount;
};

/**
 * Instance method to calculate quarterly dividend
 */
InvestmentSchema.methods.calculateQuarterlyDividend = function(): number {
  const annualDividendRate = this.getDividendRate();
  return (this.amount * annualDividendRate) / 4;
};

/**
 * Instance method to get dividend rate based on investment type
 */
InvestmentSchema.methods.getDividendRate = function(): number {
  switch (this.type) {
    case InvestmentType.STOCKS:
      return 0.02; // 2% annual dividend
    case InvestmentType.BONDS:
      return 0.03; // 3% annual dividend
    case InvestmentType.REAL_ESTATE:
      return 0.04; // 4% annual dividend (REIT-like)
    case InvestmentType.INDEX_FUNDS:
      return 0.025; // 2.5% annual dividend
    default:
      return 0.02;
  }
};

/**
 * Static method to update all investment prices (simulated market movement)
 */
InvestmentSchema.statics.updateAllPrices = async function() {
  const investments = await this.find({ isActive: true });

  for (const investment of investments) {
    // Simulate price movement based on volatility
    const randomChange = (Math.random() - 0.5) * 2 * investment.volatility;
    const maxChange = 0.1; // Max 10% change per update
    const change = Math.max(-maxChange, Math.min(maxChange, randomChange));

    const newPrice = investment.currentPrice * (1 + change);
    investment.updatePrice(Math.max(0.01, newPrice)); // Minimum price

    await investment.save();
  }

  return investments.length;
};

/**
 * Static method to process dividend payments
 */
InvestmentSchema.statics.processDividendPayments = async function() {
  const dueDividends = await this.find({
    isActive: true,
    nextDividendDate: { $lte: new Date() },
  });

  let totalDividendsPaid = 0;

  for (const investment of dueDividends) {
    const dividendAmount = investment.calculateQuarterlyDividend();
    investment.payDividend(dividendAmount);
    totalDividendsPaid += dividendAmount;
    await investment.save();
  }

  return { count: dueDividends.length, totalAmount: totalDividendsPaid };
};

/**
 * Portfolio instance method to calculate total value
 */
InvestmentPortfolioSchema.methods.calculateTotalValue = async function(): Promise<number> {
  const investments = await mongoose.model('Investment').find({
    _id: { $in: this.investments },
    isActive: true,
  });

  this.totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  return this.totalValue;
};

/**
 * Portfolio instance method to calculate diversification score
 */
InvestmentPortfolioSchema.methods.calculateDiversificationScore = function(): number {
  // This would require loading all investments and calculating based on types
  // Placeholder implementation
  return 0.5; // 50% diversification as default
};

/**
 * Portfolio instance method to get allocation breakdown
 */
InvestmentPortfolioSchema.methods.getAllocationBreakdown = async function() {
  const investments = await mongoose.model('Investment').find({
    _id: { $in: this.investments },
    isActive: true,
  });

  const breakdown: { [key in InvestmentType]?: { amount: number; percentage: number } } = {};

  for (const investment of investments) {
    const investmentType = investment.type as InvestmentType;
    if (!breakdown[investmentType]) {
      breakdown[investmentType] = { amount: 0, percentage: 0 };
    }
    const currentValue = investment.units * investment.currentPrice;
    breakdown[investmentType]!.amount += currentValue;
  }

  // Calculate percentages
  for (const type of Object.keys(breakdown) as InvestmentType[]) {
    breakdown[type]!.percentage = this.totalValue > 0
      ? (breakdown[type]!.amount / this.totalValue) * 100
      : 0;
  }

  return breakdown;
};

// Create and export the models
const Investment = mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);
const InvestmentPortfolio = mongoose.models.InvestmentPortfolio || mongoose.model<IInvestmentPortfolio>('InvestmentPortfolio', InvestmentPortfolioSchema);

export default Investment;
export { InvestmentPortfolio };