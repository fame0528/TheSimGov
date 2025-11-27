/**
 * @file src/lib/db/models/Product.ts
 * @description Product Mongoose schema for marketplace product listings
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Product model representing individual SKUs listed on marketplace platforms. Tracks product
 * details (name, category, price, inventory), seller information, performance metrics (sales,
 * views, conversion), customer feedback (rating, reviews), and sponsored advertising status.
 * Supports FBA and FBM fulfillment with different storage/shipping costs.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - marketplace: Reference to Marketplace document
 * - seller: Reference to Seller document
 * - sku: Unique product identifier (auto-generated)
 * - name: Product title
 * - category: Product category (Electronics, Clothing, etc.)
 * - price: Current selling price
 * - cost: Seller's cost/COGS (for margin calculations)
 * - active: Listing status
 * - listedAt: First listing date
 * 
 * Inventory & Fulfillment:
 * - inventory: Current stock quantity
 * - fulfillmentMethod: FBA (platform warehouses) or FBM (seller ships)
 * - packageSize: Small, Medium, Large (affects FBA fees)
 * - weight: Product weight in lbs (affects shipping costs)
 * 
 * Performance Metrics:
 * - totalSales: Lifetime units sold
 * - monthlySales: Current month units sold
 * - totalRevenue: Lifetime gross revenue
 * - monthlyRevenue: Current month revenue
 * - viewCount: Total product views
 * - conversionRate: % views that result in purchase (0-100)
 * 
 * Customer Feedback:
 * - rating: Average customer rating (0-5 stars)
 * - reviewCount: Total customer reviews
 * - returnRate: % orders returned (0-100)
 * 
 * Advertising:
 * - sponsored: Whether product is in paid advertising campaign
 * - adCampaign: Reference to AdCampaign if sponsored
 * - adSpend: Total ad spend for this product
 * - adRevenue: Revenue attributed to ads
 * 
 * USAGE:
 * ```typescript
 * import Product from '@/lib/db/models/Product';
 * 
 * // Create product listing
 * const product = await Product.create({
 *   marketplace: marketplaceId,
 *   seller: sellerId,
 *   name: "Wireless Bluetooth Headphones",
 *   category: "Electronics",
 *   price: 79.99,
 *   cost: 30,
 *   inventory: 500,
 *   fulfillmentMethod: "FBA",
 *   packageSize: "Medium"
 * });
 * 
 * // Record product sale
 * await product.updateOne({
 *   $inc: {
 *     totalSales: 1,
 *     monthlySales: 1,
 *     totalRevenue: product.price,
 *     monthlyRevenue: product.price,
 *     inventory: -1,
 *     viewCount: 50 // Assume 50 views led to this sale
 *   }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - SKU format: MKT-SELLER-RANDOM (e.g., "MKT-123-A4B2C8")
 * - Package sizes: Small (< 1 lb), Medium (1-10 lbs), Large (> 10 lbs)
 * - FBA fees: Small $3, Medium $5, Large $8 per unit
 * - Conversion rate healthy: 2-5% (industry standard for e-commerce)
 * - Return rates vary by category: Electronics 5-10%, Clothing 20-30%, Books 2-5%
 * - Sponsored products appear in search results, cost CPC $0.50-$3.00
 * - ACOS (Advertising Cost of Sale) = Ad Spend / Ad Revenue (healthy: < 20%)
 * - Inventory limits apply for FBA (based on storage capacity at fulfillment centers)
 * - Monthly metrics reset by background jobs at month boundaries
 * - Profit margin = (Price - Cost - Commissions - FBA Fees) / Price
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Package size types (affects FBA fees)
 */
export type PackageSize = 'Small' | 'Medium' | 'Large';

/**
 * Product document interface
 * 
 * @interface IProduct
 * @extends {Document}
 */
export interface IProduct extends Document {
  // Core
  marketplace: Types.ObjectId;
  seller: Types.ObjectId;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  active: boolean;
  listedAt: Date;

  // Inventory & Fulfillment
  inventory: number;
  fulfillmentMethod: 'FBA' | 'FBM';
  packageSize: PackageSize;
  weight: number;

  // Performance Metrics
  totalSales: number;
  monthlySales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  viewCount: number;
  conversionRate: number;

  // Customer Feedback
  rating: number;
  reviewCount: number;
  returnRate: number;

  // Advertising
  sponsored: boolean;
  adCampaign?: Types.ObjectId;
  adSpend: number;
  adRevenue: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  grossMargin: number;
  profitPerUnit: number;
  acos: number;
  salesVelocity: number;
  inventoryDays: number;
}

/**
 * Product schema definition
 */
const ProductSchema = new Schema<IProduct>(
  {
    // Core
    marketplace: {
      type: Schema.Types.ObjectId,
      ref: 'Marketplace',
      required: [true, 'Marketplace reference is required'],
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^MKT-[A-Z0-9]+-[A-Z0-9]+$/, 'Invalid SKU format (e.g., MKT-123-A4B2C8)'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [5, 'Product name must be at least 5 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: 'text', // Full-text search
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: ['Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Sports', 'Beauty', 'Automotive', 'Garden', 'Grocery'],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be at least $0.01'],
      max: [10000, 'Price cannot exceed $10,000'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    listedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    // Inventory & Fulfillment
    inventory: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Inventory cannot be negative'],
    },
    fulfillmentMethod: {
      type: String,
      required: true,
      enum: {
        values: ['FBA', 'FBM'],
        message: '{VALUE} is not a valid fulfillment method',
      },
      default: 'FBA',
    },
    packageSize: {
      type: String,
      required: true,
      enum: {
        values: ['Small', 'Medium', 'Large'],
        message: '{VALUE} is not a valid package size',
      },
      default: 'Medium',
    },
    weight: {
      type: Number,
      required: true,
      default: 1, // 1 lb default
      min: [0.1, 'Weight must be at least 0.1 lbs'],
      max: [150, 'Weight cannot exceed 150 lbs'],
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
    viewCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    conversionRate: {
      type: Number,
      required: true,
      default: 3.0, // 3% conversion rate
      min: [0, 'Conversion rate cannot be negative'],
      max: [100, 'Conversion rate cannot exceed 100%'],
    },

    // Customer Feedback
    rating: {
      type: Number,
      required: true,
      default: 4.5, // 4.5 stars default
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    reviewCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    returnRate: {
      type: Number,
      required: true,
      default: 8.0, // 8% return rate (varies by category)
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },

    // Advertising
    sponsored: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    adCampaign: {
      type: Schema.Types.ObjectId,
      ref: 'AdCampaign',
      default: null,
    },
    adSpend: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Ad spend cannot be negative'],
    },
    adRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Ad revenue cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'products',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
ProductSchema.index({ marketplace: 1, category: 1, active: 1 }); // Browse by category
ProductSchema.index({ seller: 1, active: 1 }); // Seller's products
ProductSchema.index({ monthlySales: -1 }); // Best sellers
ProductSchema.index({ rating: -1, reviewCount: -1 }); // Top-rated products
ProductSchema.index({ sponsored: 1, category: 1 }); // Sponsored products by category

/**
 * Virtual field: grossMargin
 * 
 * @description
 * Gross margin percentage (before commissions and fees)
 * 
 * @returns {number} Gross margin percentage
 */
ProductSchema.virtual('grossMargin').get(function (this: IProduct): number {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price) * 100;
});

/**
 * Virtual field: profitPerUnit
 * 
 * @description
 * Profit per unit after commissions and FBA fees
 * 
 * @returns {number} Profit per unit ($)
 */
ProductSchema.virtual('profitPerUnit').get(function (this: IProduct): number {
  // Commission rates
  const commissionRate = this.fulfillmentMethod === 'FBA' ? 0.20 : 0.10;
  const commission = this.price * commissionRate;

  // FBA fulfillment fees
  let fbaFee = 0;
  if (this.fulfillmentMethod === 'FBA') {
    switch (this.packageSize) {
      case 'Small':
        fbaFee = 3;
        break;
      case 'Medium':
        fbaFee = 5;
        break;
      case 'Large':
        fbaFee = 8;
        break;
    }
  }

  // Profit = Price - Cost - Commission - FBA Fee
  return this.price - this.cost - commission - fbaFee;
});

/**
 * Virtual field: acos
 * 
 * @description
 * ACOS (Advertising Cost of Sale) = Ad Spend / Ad Revenue
 * Healthy ACOS: < 20%, Concerning: 20-40%, Unprofitable: > 40%
 * 
 * @returns {number} ACOS percentage
 */
ProductSchema.virtual('acos').get(function (this: IProduct): number {
  if (this.adRevenue === 0) return 0;
  return (this.adSpend / this.adRevenue) * 100;
});

/**
 * Virtual field: salesVelocity
 * 
 * @description
 * Average daily sales rate (monthly sales / 30 days)
 * 
 * @returns {number} Units sold per day
 */
ProductSchema.virtual('salesVelocity').get(function (this: IProduct): number {
  return this.monthlySales / 30;
});

/**
 * Virtual field: inventoryDays
 * 
 * @description
 * Days of inventory remaining at current sales velocity
 * 
 * @returns {number} Days until stockout
 */
ProductSchema.virtual('inventoryDays').get(function (this: IProduct): number {
  if (this.salesVelocity === 0) return Infinity;
  return Math.floor(this.inventory / this.salesVelocity);
});

/**
 * Pre-save hook: Generate SKU if not provided
 */
ProductSchema.pre<IProduct>('save', function (next) {
  if (!this.sku) {
    // Generate SKU: MKT-{random6chars}-{random6chars}
    const randomPart1 = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomPart2 = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `MKT-${randomPart1}-${randomPart2}`;
  }

  next();
});

/**
 * Product model
 * 
 * @example
 * ```typescript
 * import Product from '@/lib/db/models/Product';
 * 
 * // Create product
 * const product = await Product.create({
 *   marketplace: marketplaceId,
 *   seller: sellerId,
 *   name: "Ultra HD 4K Monitor 27-inch",
 *   category: "Electronics",
 *   price: 299.99,
 *   cost: 150,
 *   inventory: 200,
 *   fulfillmentMethod: "FBA",
 *   packageSize: "Large",
 *   weight: 12
 * });
 * 
 * // Record sale
 * await product.updateOne({
 *   $inc: {
 *     totalSales: 1,
 *     monthlySales: 1,
 *     totalRevenue: product.price,
 *     monthlyRevenue: product.price,
 *     inventory: -1,
 *     viewCount: 25 // 25 views led to this sale
 *   }
 * });
 * 
 * // Check profitability
 * console.log(product.grossMargin); // e.g., 50% gross margin
 * console.log(product.profitPerUnit); // e.g., $79.99 profit after fees
 * 
 * // Get best sellers by category
 * const bestSellers = await Product.find({ 
 *   marketplace: marketplaceId,
 *   category: "Electronics",
 *   active: true 
 * })
 *   .sort({ monthlySales: -1 })
 *   .limit(20);
 * ```
 */
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
