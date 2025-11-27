/**
 * @file src/lib/db/models/Seller.ts
 * @description Seller Mongoose schema for third-party marketplace sellers
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Seller model representing NPC third-party sellers on marketplace platforms (Amazon FBA/FBM sellers).
 * Tracks seller performance metrics, inventory, fulfillment method (FBA vs FBM), product catalog, and
 * financial performance. Includes seller health scoring based on order defect rate, late shipments,
 * cancellations, and customer ratings following Amazon Seller Central standards.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - name: Business name (e.g., "TechSupplies Inc", "FashionHub LLC")
 * - type: Seller size (Small, Medium, Enterprise)
 * - fulfillmentMethod: FBA (platform fulfills), FBM (seller fulfills), Hybrid
 * - active: Account status
 * - joinedAt: Onboarding date
 * 
 * Inventory & Products:
 * - productCount: Total products listed
 * - inventory: Current inventory units
 * - categories: Product categories sold (Electronics, Clothing, etc.)
 * - averagePrice: Average product price
 * 
 * Performance Metrics:
 * - rating: Seller rating (0-5 stars)
 * - totalOrders: Lifetime orders fulfilled
 * - monthlyOrders: Current month orders
 * - orderDefectRate: % defective orders (< 1% = good, Amazon threshold)
 * - lateShipmentRate: % late shipments (< 4% = good, Amazon threshold)
 * - cancellationRate: % canceled orders (< 2.5% = good, Amazon threshold)
 * - validTrackingRate: % orders with valid tracking (> 95% = good)
 * 
 * Financial Metrics:
 * - totalSales: Lifetime gross sales
 * - monthlySales: Current month sales
 * - totalCommissionsPaid: Lifetime commissions to marketplace
 * - monthlyCommissionsPaid: Current month commissions
 * 
 * Customer Metrics:
 * - returnRate: % orders returned (5-15% typical, varies by category)
 * - customerSatisfaction: Overall satisfaction score (0-100)
 * 
 * USAGE:
 * ```typescript
 * import Seller from '@/lib/db/models/Seller';
 * 
 * // Create NPC seller
 * const seller = await Seller.create({
 *   marketplace: marketplaceId,
 *   name: "ElectroHub Supply",
 *   type: "Medium",
 *   fulfillmentMethod: "FBA",
 *   productCount: 150,
 *   categories: ['Electronics', 'Computers']
 * });
 * 
 * // Record sale transaction
 * const saleAmount = 200;
 * const commission = saleAmount * 0.20; // 20% FBA commission
 * 
 * await seller.updateOne({
 *   $inc: {
 *     totalOrders: 1,
 *     monthlyOrders: 1,
 *     totalSales: saleAmount,
 *     monthlySales: saleAmount,
 *     totalCommissionsPaid: commission,
 *     monthlyCommissionsPaid: commission
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Seller types: Small (< 100 products), Medium (100-1000), Enterprise (> 1000)
 * - FBA = Fulfilled By Amazon (platform handles shipping, 20% commission)
 * - FBM = Fulfilled By Merchant (seller handles shipping, 10% commission)
 * - Hybrid = Mix of FBA and FBM (60% FBA, 40% FBM typical distribution)
 * - Performance metrics follow Amazon Seller Central thresholds
 * - Order Defect Rate (ODR) < 1% required to maintain good standing
 * - Late Shipment Rate < 4% required (Amazon suspends at 4%+)
 * - Cancellation Rate < 2.5% required (Amazon policy)
 * - Valid Tracking Rate > 95% required (customer trust metric)
 * - Rating calculation: weighted average of recent 90 days (recency bias)
 * - Seller health: Excellent (all metrics green), Good, Fair, Poor, Suspended
 * - Monthly metrics reset by background jobs at month boundaries
 * - Commission rates vary by fulfillment method and product category
 * - Return rates vary by category (Clothing 20-30%, Electronics 5-10%, Books 2-5%)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Seller size types
 */
export type SellerType = 'Small' | 'Medium' | 'Enterprise';

/**
 * Fulfillment method types
 */
export type FulfillmentMethod = 'FBA' | 'FBM' | 'Hybrid';

/**
 * Seller health status
 */
export type SellerHealth = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Suspended';

/**
 * Seller document interface
 * 
 * @interface ISeller
 * @extends {Document}
 */
export interface ISeller extends Document {
  // Core
  marketplace: Types.ObjectId;
  name: string;
  type: SellerType;
  fulfillmentMethod: FulfillmentMethod;
  active: boolean;
  joinedAt: Date;

  // Inventory & Products
  productCount: number;
  inventory: number;
  categories: string[];
  averagePrice: number;

  // Performance Metrics
  rating: number;
  totalOrders: number;
  monthlyOrders: number;
  orderDefectRate: number;
  lateShipmentRate: number;
  cancellationRate: number;
  validTrackingRate: number;

  // Financial Metrics
  totalSales: number;
  monthlySales: number;
  totalCommissionsPaid: number;
  monthlyCommissionsPaid: number;

  // Customer Metrics
  returnRate: number;
  customerSatisfaction: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  sellerHealth: SellerHealth;
  averageCommissionRate: number;
  profitMargin: number;
  ordersPerProduct: number;
  inventoryTurnover: number;
}

/**
 * Seller schema definition
 */
const SellerSchema = new Schema<ISeller>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Seller name is required'],
      trim: true,
      minlength: [3, 'Seller name must be at least 3 characters'],
      maxlength: [100, 'Seller name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['Small', 'Medium', 'Enterprise'],
        message: '{VALUE} is not a valid seller type',
      },
      default: 'Small',
    },
    fulfillmentMethod: {
      type: String,
      required: true,
      enum: {
        values: ['FBA', 'FBM', 'Hybrid'],
        message: '{VALUE} is not a valid fulfillment method',
      },
      default: 'FBA',
      index: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Inventory & Products
    productCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Product count cannot be negative'],
    },
    inventory: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Inventory cannot be negative'],
    },
    categories: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 10,
        message: 'Must have 1-10 product categories',
      },
    },
    averagePrice: {
      type: Number,
      required: true,
      default: 50, // $50 average product price
      min: [1, 'Average price must be at least $1'],
    },

    // Performance Metrics
    rating: {
      type: Number,
      required: true,
      default: 4.5, // 4.5 stars default
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    totalOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total orders cannot be negative'],
    },
    monthlyOrders: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly orders cannot be negative'],
    },
    orderDefectRate: {
      type: Number,
      required: true,
      default: 0.5, // 0.5% ODR (good standing)
      min: [0, 'Order defect rate cannot be negative'],
      max: [100, 'Order defect rate cannot exceed 100%'],
    },
    lateShipmentRate: {
      type: Number,
      required: true,
      default: 2.0, // 2% late shipments (good)
      min: [0, 'Late shipment rate cannot be negative'],
      max: [100, 'Late shipment rate cannot exceed 100%'],
    },
    cancellationRate: {
      type: Number,
      required: true,
      default: 1.5, // 1.5% cancellations (good)
      min: [0, 'Cancellation rate cannot be negative'],
      max: [100, 'Cancellation rate cannot exceed 100%'],
    },
    validTrackingRate: {
      type: Number,
      required: true,
      default: 98, // 98% valid tracking (excellent)
      min: [0, 'Valid tracking rate cannot be negative'],
      max: [100, 'Valid tracking rate cannot exceed 100%'],
    },

    // Financial Metrics
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
    totalCommissionsPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total commissions cannot be negative'],
    },
    monthlyCommissionsPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Monthly commissions cannot be negative'],
    },

    // Customer Metrics
    returnRate: {
      type: Number,
      required: true,
      default: 8.0, // 8% return rate (industry average)
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },
    customerSatisfaction: {
      type: Number,
      required: true,
      default: 85, // 85/100 satisfaction
      min: [0, 'Customer satisfaction cannot be negative'],
      max: [100, 'Customer satisfaction cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'sellers',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
SellerSchema.index({ marketplace: 1, active: 1 }); // Active sellers per marketplace
SellerSchema.index({ totalSales: -1 }); // Top sellers by revenue
SellerSchema.index({ rating: -1 }); // Top-rated sellers
SellerSchema.index({ fulfillmentMethod: 1, active: 1 }); // FBA vs FBM breakdown

/**
 * Virtual field: sellerHealth
 * 
 * @description
 * Overall seller health status based on Amazon Seller Central thresholds
 * 
 * @returns {SellerHealth} Health status (Excellent, Good, Fair, Poor, Suspended)
 */
SellerSchema.virtual('sellerHealth').get(function (this: ISeller): SellerHealth {
  // Amazon suspension thresholds (automatic suspension if any exceeded)
  if (
    this.orderDefectRate >= 1.0 ||
    this.lateShipmentRate >= 4.0 ||
    this.cancellationRate >= 2.5 ||
    this.validTrackingRate < 95 ||
    !this.active
  ) {
    return 'Suspended';
  }

  // Excellent: All metrics significantly better than thresholds
  if (
    this.orderDefectRate < 0.5 &&
    this.lateShipmentRate < 2.0 &&
    this.cancellationRate < 1.0 &&
    this.validTrackingRate >= 98 &&
    this.rating >= 4.5
  ) {
    return 'Excellent';
  }

  // Good: All metrics below thresholds with buffer
  if (
    this.orderDefectRate < 0.75 &&
    this.lateShipmentRate < 3.0 &&
    this.cancellationRate < 2.0 &&
    this.validTrackingRate >= 96 &&
    this.rating >= 4.0
  ) {
    return 'Good';
  }

  // Fair: Close to thresholds but not suspended
  if (
    this.orderDefectRate < 0.9 &&
    this.lateShipmentRate < 3.5 &&
    this.cancellationRate < 2.3 &&
    this.validTrackingRate >= 95.5 &&
    this.rating >= 3.5
  ) {
    return 'Fair';
  }

  // Poor: At risk of suspension (metrics approaching thresholds)
  return 'Poor';
});

/**
 * Virtual field: averageCommissionRate
 * 
 * @description
 * Calculates average commission rate based on fulfillment method
 * FBA: 20%, FBM: 10%, Hybrid: 16% (60/40 split)
 * 
 * @returns {number} Average commission rate percentage
 */
SellerSchema.virtual('averageCommissionRate').get(function (this: ISeller): number {
  switch (this.fulfillmentMethod) {
    case 'FBA':
      return 20;
    case 'FBM':
      return 10;
    case 'Hybrid':
      return 16; // 60% FBA (20%) + 40% FBM (10%) = 16%
    default:
      return 15;
  }
});

/**
 * Virtual field: profitMargin
 * 
 * @description
 * Estimates seller profit margin after marketplace commissions
 * Assumes 50% COGS, commissions reduce remaining margin
 * 
 * @returns {number} Estimated profit margin percentage
 */
SellerSchema.virtual('profitMargin').get(function (this: ISeller): number {
  if (this.totalSales === 0) return 0;

  // Calculate actual commission rate from historical data
  const effectiveCommissionRate =
    this.totalCommissionsPaid > 0 ? (this.totalCommissionsPaid / this.totalSales) * 100 : this.averageCommissionRate;

  // Assume 50% COGS, rest is gross margin
  // After commissions: 50% (gross margin) - commission% = net margin
  const grossMargin = 50; // 50% gross margin assumption
  const netMargin = grossMargin - effectiveCommissionRate;

  return Math.max(0, netMargin);
});

/**
 * Virtual field: ordersPerProduct
 * 
 * @description
 * Average monthly orders per product (measures product popularity)
 * 
 * @returns {number} Orders per product per month
 */
SellerSchema.virtual('ordersPerProduct').get(function (this: ISeller): number {
  if (this.productCount === 0) return 0;
  return this.monthlyOrders / this.productCount;
});

/**
 * Virtual field: inventoryTurnover
 * 
 * @description
 * Inventory turnover rate (higher = better cash flow)
 * Formula: Monthly Sales / (Average Price * Inventory)
 * 
 * @returns {number} Inventory turns per month
 */
SellerSchema.virtual('inventoryTurnover').get(function (this: ISeller): number {
  const inventoryValue = this.averagePrice * this.inventory;
  if (inventoryValue === 0) return 0;
  return this.monthlySales / inventoryValue;
});

/**
 * Seller model
 * 
 * @example
 * ```typescript
 * import Seller from '@/lib/db/models/Seller';
 * 
 * // Create seller
 * const seller = await Seller.create({
 *   marketplace: marketplaceId,
 *   name: "TechGadgets Supply Co.",
 *   type: "Medium",
 *   fulfillmentMethod: "FBA",
 *   productCount: 250,
 *   inventory: 5000,
 *   categories: ['Electronics', 'Computers', 'Accessories'],
 *   averagePrice: 75
 * });
 * 
 * // Record sale
 * const sale = { amount: 150, commission: 30 }; // $150 sale, $30 commission (20% FBA)
 * await seller.updateOne({
 *   $inc: {
 *     totalOrders: 1,
 *     monthlyOrders: 1,
 *     totalSales: sale.amount,
 *     monthlySales: sale.amount,
 *     totalCommissionsPaid: sale.commission,
 *     monthlyCommissionsPaid: sale.commission,
 *     inventory: -1 // Decrement inventory
 *   }
 * });
 * 
 * // Check seller health
 * await seller.populate('marketplace');
 * console.log(seller.sellerHealth); // "Excellent", "Good", "Fair", "Poor", or "Suspended"
 * 
 * // Get top sellers
 * const topSellers = await Seller.find({ marketplace: marketplaceId, active: true })
 *   .sort({ totalSales: -1 })
 *   .limit(10);
 * ```
 */
const Seller: Model<ISeller> = mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);

export default Seller;
