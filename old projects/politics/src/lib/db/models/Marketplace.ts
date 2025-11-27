/**
 * @file src/lib/db/models/Marketplace.ts
 * @description Marketplace Mongoose schema for E-Commerce platforms
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Marketplace model representing Amazon-style e-commerce platforms with third-party
 * seller management, product catalog tracking, commission-based revenue model, and
 * comprehensive performance metrics. Supports multi-sided platform mechanics with
 * sellers, customers, and advertisers as distinct stakeholder groups.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, E-Commerce industry)
 * - name: Marketplace brand name (e.g., "Amazon", "eBay Marketplace")
 * - url: Platform URL (e.g., "amazon.example.com")
 * - active: Operational status
 * - launchedAt: Marketplace launch date
 * 
 * Marketplace Metrics:
 * - activeSellerCount: Current active third-party sellers
 * - totalSellerCount: Lifetime sellers onboarded
 * - productListings: Total products available
 * - monthlyVisitors: Monthly unique visitors
 * - conversionRate: % of visitors who make purchases (0-100)
 * - averageOrderValue: Average transaction value ($)
 * 
 * Product Categories:
 * - categories: Array of available categories (Electronics, Clothing, Home, Books, Toys, etc.)
 * - featuredCategories: Priority categories for marketing
 * 
 * Commission Structure:
 * - commissionRates: FBA (20%), FBM (10%) commission percentages
 * - sellerFees: Listing fees, referral fees, fulfillment fees
 * - fbaFees: Small ($3), Medium ($5), Large ($8) package fulfillment fees
 * 
 * Financial Metrics:
 * - gmv: Gross Merchandise Value (total seller sales, not platform revenue)
 * - takeRate: Platform revenue / GMV percentage
 * - totalRevenue: Platform revenue (commissions + fees)
 * - monthlyRevenue: Current month platform revenue
 * - yearlyRevenue: Current year platform revenue
 * 
 * Performance Tracking:
 * - sellerPerformance: Aggregate seller metrics (avg rating, defect rate, late shipments)
 * - customerSatisfaction: Overall platform satisfaction score (0-100)
 * - returnRate: % of orders returned (0-100)
 * - fraudRate: % of fraudulent transactions (0-100)
 * 
 * USAGE:
 * ```typescript
 * import Marketplace from '@/lib/db/models/Marketplace';
 * 
 * // Create marketplace
 * const marketplace = await Marketplace.create({
 *   company: ecommerceCompanyId,
 *   name: "TechMart",
 *   url: "techmart.example.com",
 *   categories: ['Electronics', 'Computers', 'Software'],
 *   commissionRates: { fba: 20, fbm: 10 }
 * });
 * 
 * // Update metrics after seller sales
 * await marketplace.updateOne({
 *   $inc: { 
 *     gmv: 1000,              // Seller sold $1,000
 *     totalRevenue: 200,      // Platform earned $200 (20% FBA commission)
 *     monthlyRevenue: 200 
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - GMV = Gross Merchandise Value (total seller sales volume)
 * - Take Rate = Platform revenue / GMV (target: 15-25% blended rate)
 * - FBA (Fulfilled By Amazon) = Platform handles shipping, 20% commission
 * - FBM (Fulfilled By Merchant) = Seller handles shipping, 10% commission
 * - Commission structures based on real-world Amazon/eBay models
 * - Visitor conversion rate: 2-5% (industry standard for e-commerce)
 * - Average order value varies by category (Electronics $200+, Clothing $50-100, Books $15-30)
 * - Seller performance metrics aggregate from individual Seller documents
 * - Monthly/yearly revenue reset by background jobs at period boundaries
 * - Categories expandable as marketplace grows (start 5-10, scale to 30+)
 * - Featured categories drive marketing campaigns and homepage placement
 * - Return rate industry standard: 5-15% (higher for clothing/shoes, lower for electronics)
 * - Fraud rate healthy: < 0.5%, concerning: > 2%, critical: > 5%
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Product categories available on marketplace
 */
export type ProductCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Home'
  | 'Books'
  | 'Toys'
  | 'Sports'
  | 'Beauty'
  | 'Automotive'
  | 'Garden'
  | 'Grocery';

/**
 * Commission structure for different fulfillment methods
 */
export interface CommissionRates {
  fba: number; // FBA commission % (default: 20%)
  fbm: number; // FBM commission % (default: 10%)
}

/**
 * Seller fee structure
 */
export interface SellerFees {
  listing: number;   // Per listing/month fee (default: $0.10)
  referral: number;  // Referral fee % (default: 15%)
  fulfillment: {
    small: number;   // Small package fee (default: $3)
    medium: number;  // Medium package fee (default: $5)
    large: number;   // Large package fee (default: $8)
  };
}

/**
 * Aggregate seller performance metrics
 */
export interface SellerPerformance {
  averageRating: number;        // 0-5 stars
  averageOrderDefectRate: number; // % (< 1% = good)
  averageLateShipmentRate: number; // % (< 4% = good)
  averageCancellationRate: number; // % (< 2.5% = good)
}

/**
 * Marketplace financial metrics
 */
export interface MarketplaceMetrics {
  gmv: number;           // Gross Merchandise Value (total seller sales)
  takeRate: number;      // Platform revenue / GMV (%)
  revenue: number;       // Total platform revenue (commissions + fees)
}

/**
 * Marketplace document interface
 * 
 * @interface IMarketplace
 * @extends {Document}
 */
export interface IMarketplace extends Document {
  // Core
  company: Types.ObjectId;
  name: string;
  url: string;
  active: boolean;
  launchedAt: Date;

  // Marketplace Metrics
  activeSellerCount: number;
  totalSellerCount: number;
  productListings: number;
  monthlyVisitors: number;
  conversionRate: number;
  averageOrderValue: number;

  // Categories
  categories: ProductCategory[];
  featuredCategories: ProductCategory[];

  // Commission Structure
  commissionRates: CommissionRates;
  sellerFees: SellerFees;

  // Financial Metrics
  gmv: number;
  takeRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;

  // Performance Tracking
  sellerPerformance: SellerPerformance;
  customerSatisfaction: number;
  returnRate: number;
  fraudRate: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  effectiveCommissionRate: number;
  monthlyGMV: number;
  revenuePerVisitor: number;
  sellersPerCategory: number;
  marketplaceHealth: string;
}

/**
 * Marketplace schema definition
 */
const MarketplaceSchema = new Schema<IMarketplace>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Marketplace name is required'],
      trim: true,
      minlength: [3, 'Marketplace name must be at least 3 characters'],
      maxlength: [50, 'Marketplace name cannot exceed 50 characters'],
    },
    url: {
      type: String,
      required: [true, 'Marketplace URL is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid URL format (e.g., amazon.example.com)'],
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

    // Marketplace Metrics
    activeSellerCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Active seller count cannot be negative'],
    },
    totalSellerCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total seller count cannot be negative'],
    },
    productListings: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Product listings cannot be negative'],
    },
    monthlyVisitors: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly visitors cannot be negative'],
    },
    conversionRate: {
      type: Number,
      required: true,
      default: 3.5, // 3.5% industry standard
      min: [0, 'Conversion rate cannot be negative'],
      max: [100, 'Conversion rate cannot exceed 100%'],
    },
    averageOrderValue: {
      type: Number,
      required: true,
      default: 75, // $75 average across categories
      min: [1, 'Average order value must be at least $1'],
    },

    // Categories
    categories: {
      type: [String],
      required: true,
      default: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys'],
      enum: {
        values: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Sports', 'Beauty', 'Automotive', 'Garden', 'Grocery'],
        message: '{VALUE} is not a valid product category',
      },
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 20,
        message: 'Must have 1-20 categories',
      },
    },
    featuredCategories: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Cannot have more than 5 featured categories',
      },
    },

    // Commission Structure
    commissionRates: {
      fba: {
        type: Number,
        required: true,
        default: 20,
        min: [5, 'FBA commission must be at least 5%'],
        max: [50, 'FBA commission cannot exceed 50%'],
      },
      fbm: {
        type: Number,
        required: true,
        default: 10,
        min: [3, 'FBM commission must be at least 3%'],
        max: [30, 'FBM commission cannot exceed 30%'],
      },
    },
    sellerFees: {
      listing: {
        type: Number,
        required: true,
        default: 0.10, // $0.10 per listing/month
        min: [0, 'Listing fee cannot be negative'],
      },
      referral: {
        type: Number,
        required: true,
        default: 15, // 15% referral fee
        min: [0, 'Referral fee cannot be negative'],
        max: [50, 'Referral fee cannot exceed 50%'],
      },
      fulfillment: {
        small: {
          type: Number,
          required: true,
          default: 3, // $3 per small package
          min: [0, 'Small fulfillment fee cannot be negative'],
        },
        medium: {
          type: Number,
          required: true,
          default: 5, // $5 per medium package
          min: [0, 'Medium fulfillment fee cannot be negative'],
        },
        large: {
          type: Number,
          required: true,
          default: 8, // $8 per large package
          min: [0, 'Large fulfillment fee cannot be negative'],
        },
      },
    },

    // Financial Metrics
    gmv: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'GMV cannot be negative'],
      index: true, // For top marketplace queries
    },
    takeRate: {
      type: Number,
      required: true,
      default: 20, // 20% take rate (industry avg 15-25%)
      min: [0, 'Take rate cannot be negative'],
      max: [100, 'Take rate cannot exceed 100%'],
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
    yearlyRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Yearly revenue cannot be negative'],
    },

    // Performance Tracking
    sellerPerformance: {
      averageRating: {
        type: Number,
        required: true,
        default: 4.5, // 4.5 stars average
        min: [0, 'Average rating cannot be negative'],
        max: [5, 'Average rating cannot exceed 5 stars'],
      },
      averageOrderDefectRate: {
        type: Number,
        required: true,
        default: 0.5, // 0.5% defect rate (good)
        min: [0, 'Order defect rate cannot be negative'],
        max: [100, 'Order defect rate cannot exceed 100%'],
      },
      averageLateShipmentRate: {
        type: Number,
        required: true,
        default: 2.0, // 2% late shipments (good)
        min: [0, 'Late shipment rate cannot be negative'],
        max: [100, 'Late shipment rate cannot exceed 100%'],
      },
      averageCancellationRate: {
        type: Number,
        required: true,
        default: 1.5, // 1.5% cancellations (good)
        min: [0, 'Cancellation rate cannot be negative'],
        max: [100, 'Cancellation rate cannot exceed 100%'],
      },
    },
    customerSatisfaction: {
      type: Number,
      required: true,
      default: 80, // 80/100 customer satisfaction
      min: [0, 'Customer satisfaction cannot be negative'],
      max: [100, 'Customer satisfaction cannot exceed 100'],
    },
    returnRate: {
      type: Number,
      required: true,
      default: 8.0, // 8% return rate (industry avg 5-15%)
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },
    fraudRate: {
      type: Number,
      required: true,
      default: 0.3, // 0.3% fraud rate (healthy)
      min: [0, 'Fraud rate cannot be negative'],
      max: [100, 'Fraud rate cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
    collection: 'marketplaces',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
MarketplaceSchema.index({ company: 1, active: 1 }); // Active marketplaces
MarketplaceSchema.index({ gmv: -1 }); // Top marketplaces by GMV
MarketplaceSchema.index({ totalRevenue: -1 }); // Top marketplaces by revenue

/**
 * Virtual field: effectiveCommissionRate
 * 
 * @description
 * Calculates blended commission rate assuming 60% FBA, 40% FBM distribution
 * 
 * @returns {number} Blended commission rate percentage
 */
MarketplaceSchema.virtual('effectiveCommissionRate').get(function (this: IMarketplace): number {
  // Assume 60% FBA, 40% FBM distribution (realistic based on Amazon data)
  return this.commissionRates.fba * 0.6 + this.commissionRates.fbm * 0.4;
});

/**
 * Virtual field: monthlyGMV
 * 
 * @description
 * Estimates monthly GMV based on monthly visitors and conversion
 * 
 * @returns {number} Estimated monthly GMV
 */
MarketplaceSchema.virtual('monthlyGMV').get(function (this: IMarketplace): number {
  const monthlyOrders = this.monthlyVisitors * (this.conversionRate / 100);
  return monthlyOrders * this.averageOrderValue;
});

/**
 * Virtual field: revenuePerVisitor
 * 
 * @description
 * Calculates revenue per visitor (RPV) - key marketplace metric
 * 
 * @returns {number} Revenue per visitor ($)
 */
MarketplaceSchema.virtual('revenuePerVisitor').get(function (this: IMarketplace): number {
  if (this.monthlyVisitors === 0) return 0;
  return this.monthlyRevenue / this.monthlyVisitors;
});

/**
 * Virtual field: sellersPerCategory
 * 
 * @description
 * Average sellers per category (helps identify category saturation)
 * 
 * @returns {number} Average sellers per category
 */
MarketplaceSchema.virtual('sellersPerCategory').get(function (this: IMarketplace): number {
  if (this.categories.length === 0) return 0;
  return Math.floor(this.activeSellerCount / this.categories.length);
});

/**
 * Virtual field: marketplaceHealth
 * 
 * @description
 * Overall marketplace health rating based on key metrics
 * 
 * @returns {string} Health rating (Excellent, Good, Fair, Poor, Critical)
 */
MarketplaceSchema.virtual('marketplaceHealth').get(function (this: IMarketplace): string {
  let score = 0;
  
  // Seller performance (0-25 points)
  if (this.sellerPerformance.averageRating >= 4.5) score += 10;
  else if (this.sellerPerformance.averageRating >= 4.0) score += 7;
  else if (this.sellerPerformance.averageRating >= 3.5) score += 4;
  
  if (this.sellerPerformance.averageOrderDefectRate < 1) score += 5;
  else if (this.sellerPerformance.averageOrderDefectRate < 2) score += 3;
  
  if (this.sellerPerformance.averageLateShipmentRate < 4) score += 5;
  else if (this.sellerPerformance.averageLateShipmentRate < 8) score += 3;
  
  if (this.sellerPerformance.averageCancellationRate < 2.5) score += 5;
  else if (this.sellerPerformance.averageCancellationRate < 5) score += 3;
  
  // Customer satisfaction (0-25 points)
  if (this.customerSatisfaction >= 90) score += 25;
  else if (this.customerSatisfaction >= 80) score += 20;
  else if (this.customerSatisfaction >= 70) score += 15;
  else if (this.customerSatisfaction >= 60) score += 10;
  else score += 5;
  
  // Return rate (0-25 points, lower is better)
  if (this.returnRate < 5) score += 25;
  else if (this.returnRate < 10) score += 20;
  else if (this.returnRate < 15) score += 15;
  else if (this.returnRate < 20) score += 10;
  else score += 5;
  
  // Fraud rate (0-25 points, lower is better)
  if (this.fraudRate < 0.5) score += 25;
  else if (this.fraudRate < 1) score += 20;
  else if (this.fraudRate < 2) score += 15;
  else if (this.fraudRate < 5) score += 10;
  else score += 5;
  
  // Total score: 0-100
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
});

/**
 * Pre-save hook: Calculate take rate
 */
MarketplaceSchema.pre<IMarketplace>('save', function (next) {
  // Calculate take rate (platform revenue / GMV)
  if (this.gmv > 0) {
    this.takeRate = (this.totalRevenue / this.gmv) * 100;
  }
  
  next();
});

/**
 * Marketplace model
 * 
 * @example
 * ```typescript
 * import Marketplace from '@/lib/db/models/Marketplace';
 * 
 * // Create marketplace
 * const marketplace = await Marketplace.create({
 *   company: ecommerceCompanyId,
 *   name: "GlobalMart",
 *   url: "globalmart.example.com",
 *   categories: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys'],
 *   featuredCategories: ['Electronics', 'Clothing'],
 *   commissionRates: { fba: 20, fbm: 10 }
 * });
 * 
 * // Record sales transaction
 * const saleAmount = 100; // Seller sold $100 product
 * const commission = saleAmount * 0.20; // 20% FBA commission = $20
 * 
 * await marketplace.updateOne({
 *   $inc: {
 *     gmv: saleAmount,          // Track seller sales
 *     totalRevenue: commission, // Track platform revenue
 *     monthlyRevenue: commission
 *   }
 * });
 * 
 * // Get top marketplaces by GMV
 * const topMarketplaces = await Marketplace.find({ active: true })
 *   .sort({ gmv: -1 })
 *   .limit(10);
 * ```
 */
const Marketplace: Model<IMarketplace> =
  mongoose.models.Marketplace || mongoose.model<IMarketplace>('Marketplace', MarketplaceSchema);

export default Marketplace;
