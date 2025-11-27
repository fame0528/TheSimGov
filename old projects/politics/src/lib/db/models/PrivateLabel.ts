/**
 * @file src/lib/db/models/PrivateLabel.ts
 * @description PrivateLabel Mongoose schema for marketplace own-brand products
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * PrivateLabel model representing Amazon Basics-style own-brand products that compete directly
 * with third-party sellers using marketplace sales data insights. Tracks product development,
 * competitive analysis, pricing strategy, margin optimization, and ethical considerations.
 * High-margin business (40-60%) with data-driven product selection and seller displacement risks.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - product: Reference to Product document (the private label SKU)
 * - brandName: Private label brand (e.g., "AmazonBasics", "Marketplace Essentials")
 * - category: Product category
 * - active: Product availability status
 * - launchedAt: Product launch date
 * 
 * Development:
 * - developmentCost: Upfront product development cost
 * - sourcingCost: Manufacturing/sourcing cost per unit
 * - targetMargin: Target profit margin percentage
 * - competitorProducts: Competing seller products analyzed
 * 
 * Competitive Analysis:
 * - avgCompetitorPrice: Average competitor price
 * - avgCompetitorRating: Average competitor rating
 * - estimatedMarketSize: Annual market size (units/year)
 * - marketShareGoal: Target market share percentage
 * 
 * Pricing Strategy:
 * - undercut Percentage: % below avg competitor price
 * - dynamicPricing: Whether price adjusts based on competition
 * - priceFloor: Minimum price (maintain margins)
 * - priceCeiling: Maximum price (stay competitive)
 * 
 * Performance Metrics:
 * - totalSales: Lifetime units sold
 * - monthlySales: Current month units sold
 * - totalRevenue: Lifetime gross revenue
 * - monthlyRevenue: Current month revenue
 * - marketShare: Current category market share percentage
 * 
 * Financial Metrics:
 * - grossMargin: Margin before marketing costs
 * - netMargin: Margin after all costs
 * - totalProfit: Lifetime profit
 * - monthlyProfit: Current month profit
 * - roiMultiple: Return on investment (profit / development cost)
 * 
 * Ethical Tracking:
 * - sellersDisplaced: Number of sellers potentially displaced
 * - dataAdvantage: Whether used competitor sales data
 * - antitrustRisk: Risk of anti-competitive allegations (0-100)
 * 
 * USAGE:
 * ```typescript
 * import PrivateLabel from '@/lib/db/models/PrivateLabel';
 * 
 * // Create private label product
 * const privateLabel = await PrivateLabel.create({
 *   marketplace: marketplaceId,
 *   product: productId,
 *   brandName: "Marketplace Essentials",
 *   category: "Electronics",
 *   developmentCost: 50000,
 *   sourcingCost: 15,
 *   targetMargin: 50,
 *   avgCompetitorPrice: 35
 * });
 * 
 * // Record sale
 * const price = 29.99;
 * const cost = 15;
 * const profit = price - cost;
 * 
 * await privateLabel.updateOne({
 *   $inc: {
 *     totalSales: 1,
 *     monthlySales: 1,
 *     totalRevenue: price,
 *     monthlyRevenue: price,
 *     totalProfit: profit,
 *     monthlyProfit: profit
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Target margins: 40-60% (vs marketplace seller 10-30%)
 * - Undercut strategy: Price 10-20% below average competitor
 * - Development costs: $20k-$100k per product (design, testing, tooling)
 * - Sourcing: Manufacturing cost typically 20-40% of retail price
 * - Market share goal: 5-15% (avoid antitrust scrutiny at > 20%)
 * - Product selection criteria: High sales volume, low seller ratings, high prices
 * - Data advantage: Use marketplace sales data to identify opportunities (ethical concern)
 * - Seller displacement: Average 3-5 sellers lose significant sales per private label launch
 * - Antitrust risk: High if market share > 40%, using non-public seller data, predatory pricing
 * - ROI timeline: 12-18 months to recover development cost
 * - Category targeting: Start with commoditized products (batteries, cables, basics)
 * - Avoid: Unique/branded products (patent risks, brand loyalty)
 * - Quality strategy: Match competitor quality at lower price (value positioning)
 * - Distribution advantage: Preferential search placement on own marketplace
 * - Political risk: Regulatory scrutiny from displaced sellers, antitrust investigations
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * PrivateLabel document interface
 * 
 * @interface IPrivateLabel
 * @extends {Document}
 */
export interface IPrivateLabel extends Document {
  // Core
  marketplace: Types.ObjectId;
  product: Types.ObjectId;
  brandName: string;
  category: string;
  active: boolean;
  launchedAt: Date;

  // Development
  developmentCost: number;
  sourcingCost: number;
  targetMargin: number;
  competitorProducts: Types.ObjectId[];

  // Competitive Analysis
  avgCompetitorPrice: number;
  avgCompetitorRating: number;
  estimatedMarketSize: number;
  marketShareGoal: number;

  // Pricing Strategy
  undercutPercentage: number;
  dynamicPricing: boolean;
  priceFloor: number;
  priceCeiling: number;

  // Performance Metrics
  totalSales: number;
  monthlySales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  marketShare: number;

  // Financial Metrics
  grossMargin: number;
  netMargin: number;
  totalProfit: number;
  monthlyProfit: number;
  roiMultiple: number;

  // Ethical Tracking
  sellersDisplaced: number;
  dataAdvantage: boolean;
  antitrustRisk: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  breakeven: boolean;
  competitiveAdvantage: number;
  monthsToBreakeven: number;
  ethicalConcern: string;
}

/**
 * PrivateLabel schema definition
 */
const PrivateLabelSchema = new Schema<IPrivateLabel>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      unique: true,
      index: true,
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      minlength: [3, 'Brand name must be at least 3 characters'],
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Sports', 'Beauty', 'Automotive', 'Garden', 'Grocery'],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    launchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Development
    developmentCost: {
      type: Number,
      required: [true, 'Development cost is required'],
      min: [1000, 'Development cost must be at least $1,000'],
      max: [1000000, 'Development cost cannot exceed $1M'],
    },
    sourcingCost: {
      type: Number,
      required: [true, 'Sourcing cost is required'],
      min: [0.10, 'Sourcing cost must be at least $0.10'],
    },
    targetMargin: {
      type: Number,
      required: true,
      default: 50, // 50% target margin
      min: [10, 'Target margin must be at least 10%'],
      max: [90, 'Target margin cannot exceed 90%'],
    },
    competitorProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },

    // Competitive Analysis
    avgCompetitorPrice: {
      type: Number,
      required: [true, 'Average competitor price is required'],
      min: [0.01, 'Avg competitor price must be at least $0.01'],
    },
    avgCompetitorRating: {
      type: Number,
      required: true,
      default: 4.0, // 4.0 stars avg
      min: [0, 'Avg competitor rating cannot be negative'],
      max: [5, 'Avg competitor rating cannot exceed 5 stars'],
    },
    estimatedMarketSize: {
      type: Number,
      required: true,
      default: 10000, // 10k units/year
      min: [100, 'Estimated market size must be at least 100 units/year'],
    },
    marketShareGoal: {
      type: Number,
      required: true,
      default: 10, // 10% market share goal
      min: [1, 'Market share goal must be at least 1%'],
      max: [40, 'Market share goal cannot exceed 40% (antitrust risk)'],
    },

    // Pricing Strategy
    undercutPercentage: {
      type: Number,
      required: true,
      default: 15, // 15% below competitors
      min: [0, 'Undercut percentage cannot be negative'],
      max: [50, 'Undercut percentage cannot exceed 50%'],
    },
    dynamicPricing: {
      type: Boolean,
      required: true,
      default: true,
    },
    priceFloor: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Price floor cannot be negative'],
    },
    priceCeiling: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Price ceiling cannot be negative'],
    },

    // Performance Metrics
    totalSales: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total sales cannot be negative'],
    },
    monthlySales: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly sales cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    monthlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly revenue cannot be negative'],
    },
    marketShare: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Market share cannot be negative'],
      max: [100, 'Market share cannot exceed 100%'],
    },

    // Financial Metrics
    grossMargin: {
      type: Number,
      required: true,
      default: 0,
      min: [-100, 'Gross margin cannot be below -100%'],
      max: [100, 'Gross margin cannot exceed 100%'],
    },
    netMargin: {
      type: Number,
      required: true,
      default: 0,
      min: [-100, 'Net margin cannot be below -100%'],
      max: [100, 'Net margin cannot exceed 100%'],
    },
    totalProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    monthlyProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    roiMultiple: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'ROI multiple cannot be negative'],
    },

    // Ethical Tracking
    sellersDisplaced: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Sellers displaced cannot be negative'],
    },
    dataAdvantage: {
      type: Boolean,
      required: true,
      default: true, // Assumes marketplace uses seller data
    },
    antitrustRisk: {
      type: Number,
      required: true,
      default: 30, // 30/100 moderate risk
      min: [0, 'Antitrust risk cannot be negative'],
      max: [100, 'Antitrust risk cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'privatelabels',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
PrivateLabelSchema.index({ marketplace: 1, category: 1, active: 1 }); // Private labels by category
PrivateLabelSchema.index({ totalProfit: -1 }); // Top profitable products
PrivateLabelSchema.index({ marketShare: -1 }); // Market share tracking
PrivateLabelSchema.index({ antitrustRisk: -1 }); // Risk monitoring

/**
 * Virtual field: breakeven
 * 
 * @description
 * Whether product has recovered development cost
 * 
 * @returns {boolean} True if profit >= development cost
 */
PrivateLabelSchema.virtual('breakeven').get(function (this: IPrivateLabel): boolean {
  return this.totalProfit >= this.developmentCost;
});

/**
 * Virtual field: competitiveAdvantage
 * 
 * @description
 * Price advantage percentage vs competitors
 * 
 * @returns {number} Percentage below competitor average
 */
PrivateLabelSchema.virtual('competitiveAdvantage').get(function (this: IPrivateLabel): number {
  if (this.avgCompetitorPrice === 0) return 0;
  const ourPrice = this.priceFloor > 0 ? this.priceFloor : this.avgCompetitorPrice * (1 - this.undercutPercentage / 100);
  return ((this.avgCompetitorPrice - ourPrice) / this.avgCompetitorPrice) * 100;
});

/**
 * Virtual field: monthsToBreakeven
 * 
 * @description
 * Estimated months to recover development cost at current profit rate
 * 
 * @returns {number} Months to breakeven
 */
PrivateLabelSchema.virtual('monthsToBreakeven').get(function (this: IPrivateLabel): number {
  if (this.breakeven) return 0; // Already recovered
  if (this.monthlyProfit <= 0) return Infinity; // Not profitable
  
  const remainingCost = this.developmentCost - this.totalProfit;
  return Math.ceil(remainingCost / this.monthlyProfit);
});

/**
 * Virtual field: ethicalConcern
 * 
 * @description
 * Ethical concern level based on data advantage, seller displacement, antitrust risk
 * 
 * @returns {string} Concern level (Low, Moderate, High, Critical)
 */
PrivateLabelSchema.virtual('ethicalConcern').get(function (this: IPrivateLabel): string {
  let score = 0;

  // Data advantage (0-30 points)
  if (this.dataAdvantage) score += 30;

  // Sellers displaced (0-30 points)
  if (this.sellersDisplaced >= 10) score += 30;
  else if (this.sellersDisplaced >= 5) score += 20;
  else if (this.sellersDisplaced >= 3) score += 10;

  // Antitrust risk (0-40 points)
  score += Math.floor(this.antitrustRisk * 0.4);

  // Total score: 0-100
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
});

/**
 * Pre-save hook: Calculate margins, ROI, pricing bounds
 */
PrivateLabelSchema.pre<IPrivateLabel>('save', function (next) {
  // Calculate price floor (maintain target margin)
  const minPrice = this.sourcingCost / (1 - this.targetMargin / 100);
  if (this.priceFloor === 0) {
    this.priceFloor = minPrice;
  }

  // Calculate price ceiling (competitor average)
  if (this.priceCeiling === 0) {
    this.priceCeiling = this.avgCompetitorPrice;
  }

  // Calculate gross margin (revenue - sourcing cost)
  if (this.totalRevenue > 0) {
    const totalCost = this.totalSales * this.sourcingCost;
    this.grossMargin = ((this.totalRevenue - totalCost) / this.totalRevenue) * 100;
  }

  // Calculate net margin (gross profit - development cost amortization)
  // Amortize development cost over 12 months
  const monthlyDevelopmentCost = this.developmentCost / 12;
  if (this.monthlyRevenue > 0) {
    const monthlyGrossProfit = this.monthlyRevenue - this.monthlySales * this.sourcingCost;
    const monthlyNetProfit = monthlyGrossProfit - monthlyDevelopmentCost;
    this.netMargin = (monthlyNetProfit / this.monthlyRevenue) * 100;
  }

  // Calculate ROI multiple (profit / development cost)
  if (this.developmentCost > 0) {
    this.roiMultiple = this.totalProfit / this.developmentCost;
  }

  // Calculate market share (our sales / estimated market size)
  if (this.estimatedMarketSize > 0) {
    // Assume monthly market size = annual / 12
    const monthlyMarketSize = this.estimatedMarketSize / 12;
    this.marketShare = monthlyMarketSize > 0 ? (this.monthlySales / monthlyMarketSize) * 100 : 0;
  }

  // Calculate antitrust risk based on market share and data advantage
  let risk = this.marketShare; // Base risk = market share
  if (this.dataAdvantage) risk += 20; // Using seller data = +20 risk
  if (this.sellersDisplaced >= 5) risk += 15; // Displaced sellers = +15 risk
  this.antitrustRisk = Math.min(100, risk);

  next();
});

/**
 * PrivateLabel model
 * 
 * @example
 * ```typescript
 * import PrivateLabel from '@/lib/db/models/PrivateLabel';
 * 
 * // Create private label product
 * const privateLabel = await PrivateLabel.create({
 *   marketplace: marketplaceId,
 *   product: productId,
 *   brandName: "Essentials by Marketplace",
 *   category: "Electronics",
 *   developmentCost: 50000,
 *   sourcingCost: 12,
 *   targetMargin: 50,
 *   avgCompetitorPrice: 39.99,
 *   avgCompetitorRating: 4.2,
 *   estimatedMarketSize: 50000, // 50k units/year
 *   undercutPercentage: 20 // Price 20% below competitors
 * });
 * 
 * // Record sale
 * const salePrice = 31.99; // 20% below $39.99
 * const cost = 12;
 * const profit = salePrice - cost; // $19.99 profit
 * 
 * await privateLabel.updateOne({
 *   $inc: {
 *     totalSales: 1,
 *     monthlySales: 1,
 *     totalRevenue: salePrice,
 *     monthlyRevenue: salePrice,
 *     totalProfit: profit,
 *     monthlyProfit: profit
 *   }
 * });
 * 
 * // Check profitability
 * console.log(privateLabel.grossMargin); // e.g., 62% gross margin
 * console.log(privateLabel.breakeven); // false (need more sales)
 * console.log(privateLabel.monthsToBreakeven); // e.g., 15 months
 * console.log(privateLabel.ethicalConcern); // e.g., "Moderate"
 * ```
 */
const PrivateLabel: Model<IPrivateLabel> =
  mongoose.models.PrivateLabel || mongoose.model<IPrivateLabel>('PrivateLabel', PrivateLabelSchema);

export default PrivateLabel;
