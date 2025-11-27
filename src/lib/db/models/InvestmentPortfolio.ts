/**
 * @file src/lib/db/models/InvestmentPortfolio.ts
 * @description Investment Portfolio Mongoose model for banking system
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Mongoose model for managing company investment portfolios with rebalancing,
 * risk assessment, and performance tracking across multiple investment types.
 *
 * FEATURES:
 * - Portfolio-level performance tracking
 * - Automatic rebalancing based on target allocations
 * - Risk tolerance assessment and management
 * - Diversification scoring and optimization
 * - Integration with individual Investment model
 *
 * USAGE:
 * import InvestmentPortfolio from '@/lib/db/models/InvestmentPortfolio';
 * const portfolio = await InvestmentPortfolio.findOne({ companyId });
 */

import mongoose, { Schema, Document } from 'mongoose';
import { InvestmentType } from '@/lib/types/enums';

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

  // Virtual properties
  totalReturn: number;
  returnPercentage: number;

  // Methods
  calculateTotalValue(): Promise<number>;
  calculateDiversificationScore(): Promise<number>;
  getAllocationBreakdown(): Promise<{ [key in InvestmentType]?: { amount: number; percentage: number } }>;
  needsRebalancing(threshold?: number): Promise<boolean>;
  generateRebalancingRecommendations(): Promise<{
    type: InvestmentType;
    currentPercentage: number;
    targetPercentage: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
  }[]>;
  updateTotals(): Promise<void>;
}

/**
 * Investment Portfolio schema
 */
const InvestmentPortfolioSchema = new Schema<IInvestmentPortfolio>({
  companyId: {
    type: String,
    required: true,
    unique: true,
    // index: true removed - unique: true already creates an index
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
 * Note: companyId already has unique: true at field level (line 76), which creates the index
 * No additional schema-level index needed to avoid duplicate index warnings
 */

/**
 * Virtual for total return
 */
InvestmentPortfolioSchema.virtual('totalReturn').get(function() {
  return (this.totalValue + this.totalDividends) - this.totalInvested;
});

/**
 * Virtual for return percentage
 */
InvestmentPortfolioSchema.virtual('returnPercentage').get(function() {
  const totalReturn = (this.totalValue + this.totalDividends) - this.totalInvested;
  return this.totalInvested > 0 ? (totalReturn / this.totalInvested) * 100 : 0;
});

/**
 * Instance method to calculate total value
 */
InvestmentPortfolioSchema.methods.calculateTotalValue = async function(): Promise<number> {
  const Investment = mongoose.model('Investment');
  const investments = await Investment.find({
    _id: { $in: this.investments },
    isActive: true,
  });

  this.totalValue = investments.reduce((sum, inv) => sum + (inv.units * inv.currentPrice), 0);
  return this.totalValue;
};

/**
 * Instance method to calculate diversification score
 */
InvestmentPortfolioSchema.methods.calculateDiversificationScore = async function(): Promise<number> {
  const Investment = mongoose.model('Investment');
  const investments = await Investment.find({
    _id: { $in: this.investments },
    isActive: true,
  });

  if (investments.length === 0) return 0;

  // Count investments by type
  const typeCounts: { [key in InvestmentType]?: number } = {};
  let totalValue = 0;

  for (const investment of investments) {
    const value = investment.units * investment.currentPrice;
    totalValue += value;

    if (!typeCounts[investment.type as InvestmentType]) {
      typeCounts[investment.type as InvestmentType] = 0;
    }
    typeCounts[investment.type as InvestmentType]! += value;
  }

  // Calculate diversification score (inverse of concentration)
  const types = Object.keys(typeCounts) as InvestmentType[];
  if (types.length === 0) return 0;

  let diversificationScore = 0;
  for (const type of types) {
    const percentage = totalValue > 0 ? typeCounts[type]! / totalValue : 0;
    diversificationScore += percentage * percentage; // Sum of squares
  }

  // Lower score means better diversification (more types with equal weight)
  return Math.max(0, 1 - diversificationScore);
};

/**
 * Instance method to get allocation breakdown
 */
InvestmentPortfolioSchema.methods.getAllocationBreakdown = async function() {
  const Investment = mongoose.model('Investment');
  const investments = await Investment.find({
    _id: { $in: this.investments },
    isActive: true,
  });

  const breakdown: { [key in InvestmentType]?: { amount: number; percentage: number } } = {};
  let totalValue = 0;

  // Calculate current allocations
  for (const investment of investments) {
    const value = investment.units * investment.currentPrice;
    totalValue += value;

    if (!breakdown[investment.type as InvestmentType]) {
      breakdown[investment.type as InvestmentType] = { amount: 0, percentage: 0 };
    }
    breakdown[investment.type as InvestmentType]!.amount += value;
  }

  // Calculate percentages
  for (const type of Object.keys(breakdown) as InvestmentType[]) {
    breakdown[type]!.percentage = totalValue > 0
      ? (breakdown[type]!.amount / totalValue) * 100
      : 0;
  }

  return breakdown;
};

/**
 * Instance method to check if rebalancing is needed
 */
InvestmentPortfolioSchema.methods.needsRebalancing = async function(threshold: number = 5): Promise<boolean> {
  const currentAllocations = await this.getAllocationBreakdown();

  for (const [type, targetPercentage] of Object.entries(this.targetAllocations)) {
    const currentPercentage = currentAllocations[type as InvestmentType]?.percentage || 0;
    const deviation = Math.abs(currentPercentage - (targetPercentage as number));

    if (deviation > threshold) {
      return true;
    }
  }

  return false;
};

/**
 * Instance method to generate rebalancing recommendations
 */
InvestmentPortfolioSchema.methods.generateRebalancingRecommendations = async function() {
  const currentAllocations = await this.getAllocationBreakdown();
  const recommendations: {
    type: InvestmentType;
    currentPercentage: number;
    targetPercentage: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    amount: number;
  }[] = [];

  for (const [typeStr, targetPercentage] of Object.entries(this.targetAllocations)) {
    const type = typeStr as InvestmentType;
    const currentPercentage = currentAllocations[type]?.percentage || 0;
    const deviation = currentPercentage - (targetPercentage as number);

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let amount = 0;

    if (Math.abs(deviation) > 2) { // 2% threshold for action
      if (deviation > 0) {
        action = 'SELL';
        amount = (deviation / 100) * this.totalValue;
      } else {
        action = 'BUY';
        amount = Math.abs(deviation / 100) * this.totalValue;
      }
    }

    recommendations.push({
      type,
      currentPercentage,
      targetPercentage: targetPercentage as number,
      action,
      amount,
    });
  }

  return recommendations;
};

/**
 * Instance method to update portfolio totals
 */
InvestmentPortfolioSchema.methods.updateTotals = async function(): Promise<void> {
  const Investment = mongoose.model('Investment');
  const investments = await Investment.find({
    _id: { $in: this.investments },
    isActive: true,
  });

  this.totalValue = 0;
  this.totalDividends = 0;

  for (const investment of investments) {
    this.totalValue += investment.units * investment.currentPrice;
    this.totalDividends += investment.dividendsPaid;
  }
};

/**
 * Static method to create default portfolio for company
 */
InvestmentPortfolioSchema.statics.createDefaultPortfolio = async function(companyId: string) {
  const defaultAllocations = {
    [InvestmentType.STOCKS]: 40,
    [InvestmentType.BONDS]: 30,
    [InvestmentType.REAL_ESTATE]: 20,
    [InvestmentType.INDEX_FUNDS]: 10,
  };

  const portfolio = new this({
    companyId,
    riskTolerance: 5,
    targetAllocations: defaultAllocations,
  });

  await portfolio.save();
  return portfolio;
};

/**
 * Pre-save middleware to update totals
 */
InvestmentPortfolioSchema.pre('save', async function(next) {
  if (this.isModified('investments') || this.isNew) {
    await this.updateTotals();
  }
  next();
});

// Create and export the model
const InvestmentPortfolio = mongoose.models.InvestmentPortfolio ||
  mongoose.model<IInvestmentPortfolio>('InvestmentPortfolio', InvestmentPortfolioSchema);

export default InvestmentPortfolio;