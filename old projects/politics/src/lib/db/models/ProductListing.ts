/**
 * @file src/lib/db/models/ProductListing.ts
 * @description ProductListing Mongoose schema for e-commerce product catalog
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * ProductListing model for e-commerce product management with variants, pricing,
 * inventory tracking, SEO optimization, and sales analytics. Supports physical
 * and digital products with flexible variant system (size, color, material, etc.).
 * Integrates with inventory management and order fulfillment systems.
 * 
 * SCHEMA FIELDS:
 * - name: Product name (required, 3-100 chars)
 * - description: Product description (required, 10-2000 chars, markdown supported)
 * - company: Reference to Company document (required, indexed)
 * - category: Product category (Electronics, Clothing, Food, etc.)
 * - basePrice: Starting price in dollars (required, min $0.01)
 * - salePrice: Discounted price if on sale (optional)
 * - costPerUnit: Unit cost for profit margin calculation (required)
 * - stockQuantity: Available inventory count (required, default 0)
 * - lowStockThreshold: Alert threshold for low inventory (default 10)
 * - variants: Product variants array (size, color, etc.)
 * - images: Product image URLs array (max 10)
 * - tags: Searchable tags array (max 20)
 * - seoTitle: SEO-optimized title (max 60 chars)
 * - seoDescription: Meta description (max 160 chars)
 * - seoKeywords: Keywords for search optimization (array)
 * - isActive: Product visibility status (default true)
 * - isFeatured: Featured product flag (default false)
 * - totalSold: Lifetime sales count (default 0)
 * - totalRevenue: Lifetime revenue (default 0)
 * - rating: Average customer rating (0-5, default 0)
 * - reviewCount: Number of reviews (default 0)
 * - createdAt: Product creation timestamp
 * - updatedAt: Last update timestamp
 * 
 * VIRTUAL FIELDS:
 * - effectivePrice: Returns salePrice if available, otherwise basePrice
 * - profitMargin: Calculated as (effectivePrice - costPerUnit) / effectivePrice
 * - isLowStock: Boolean indicating if stockQuantity <= lowStockThreshold
 * - isOnSale: Boolean indicating if salePrice is set
 * 
 * USAGE:
 * ```typescript
 * import ProductListing from '@/lib/db/models/ProductListing';
 * 
 * // Create product
 * const product = await ProductListing.create({
 *   name: 'Premium Laptop Bag',
 *   description: 'Durable leather laptop bag with padded compartments',
 *   company: companyId,
 *   category: 'Electronics',
 *   basePrice: 89.99,
 *   costPerUnit: 35.00,
 *   stockQuantity: 50,
 *   variants: [
 *     { name: 'Size', options: ['13-inch', '15-inch', '17-inch'] },
 *     { name: 'Color', options: ['Black', 'Brown', 'Navy'] }
 *   ],
 *   tags: ['laptop', 'bag', 'accessories', 'business'],
 *   seoTitle: 'Premium Laptop Bag - Professional Business Travel',
 *   seoKeywords: ['laptop bag', 'business bag', 'leather bag']
 * });
 * 
 * // Update inventory after sale
 * await product.updateOne({
 *   $inc: { stockQuantity: -1, totalSold: 1, totalRevenue: product.effectivePrice }
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Variants enable flexible product options without separate SKUs
 * - SEO fields optimize for search engine discovery
 * - Virtual fields compute derived metrics without storage overhead
 * - Company reference indexed for fast catalog queries
 * - Category indexed for filtered product browsing
 * - Tags array supports full-text search and filtering
 * - Rating and reviewCount auto-update via CustomerReview hooks
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Valid product categories
 */
export type ProductCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Food'
  | 'Home & Garden'
  | 'Sports & Outdoors'
  | 'Books & Media'
  | 'Health & Beauty'
  | 'Toys & Games'
  | 'Automotive'
  | 'Office Supplies'
  | 'Other';

/**
 * Product variant interface (size, color, material, etc.)
 */
export interface ProductVariant {
  name: string; // Variant type: 'Size', 'Color', 'Material'
  options: string[]; // Available options: ['Small', 'Medium', 'Large']
  priceModifier?: number; // Optional price adjustment per variant
}

/**
 * ProductListing document interface
 */
export interface IProductListing extends Document {
  name: string;
  description: string;
  company: Types.ObjectId;
  category: ProductCategory;
  basePrice: number;
  salePrice?: number;
  costPerUnit: number;
  stockQuantity: number;
  lowStockThreshold: number;
  variants: ProductVariant[];
  images: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  isActive: boolean;
  isFeatured: boolean;
  totalSold: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  effectivePrice: number;
  profitMargin: number;
  isLowStock: boolean;
  isOnSale: boolean;
}

/**
 * ProductListing schema definition
 */
const ProductListingSchema = new Schema<IProductListing>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: 'text', // Full-text search support
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: [
          'Electronics',
          'Clothing',
          'Food',
          'Home & Garden',
          'Sports & Outdoors',
          'Books & Media',
          'Health & Beauty',
          'Toys & Games',
          'Automotive',
          'Office Supplies',
          'Other',
        ],
        message: '{VALUE} is not a valid product category',
      },
      index: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0.01, 'Price must be at least $0.01'],
    },
    salePrice: {
      type: Number,
      min: [0.01, 'Sale price must be at least $0.01'],
      validate: {
        validator: function (this: IProductListing, value: number) {
          return !value || value < this.basePrice;
        },
        message: 'Sale price must be less than base price',
      },
    },
    costPerUnit: {
      type: Number,
      required: [true, 'Cost per unit is required'],
      min: [0, 'Cost cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    variants: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: (arr: string[]) => arr.length > 0,
            message: 'Variant must have at least one option',
          },
        },
        priceModifier: {
          type: Number,
          default: 0,
        },
      },
    ],
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: 'Cannot have more than 10 product images',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 20,
        message: 'Cannot have more than 20 tags',
      },
      index: true,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title cannot exceed 60 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters'],
    },
    seoKeywords: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    totalSold: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total sold cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'productListings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for efficient queries
 */
ProductListingSchema.index({ company: 1, isActive: 1 }); // Active products per company
ProductListingSchema.index({ company: 1, category: 1 }); // Category browsing
ProductListingSchema.index({ company: 1, isFeatured: 1 }); // Featured products
ProductListingSchema.index({ totalSold: -1 }); // Best sellers
ProductListingSchema.index({ rating: -1 }); // Highest rated

/**
 * Virtual: effectivePrice
 * Returns sale price if available, otherwise base price
 */
ProductListingSchema.virtual('effectivePrice').get(function (this: IProductListing): number {
  return this.salePrice && this.salePrice > 0 ? this.salePrice : this.basePrice;
});

/**
 * Virtual: profitMargin
 * Calculates profit margin as percentage
 */
ProductListingSchema.virtual('profitMargin').get(function (this: IProductListing): number {
  const price = this.salePrice || this.basePrice;
  if (price <= 0 || this.costPerUnit <= 0) return 0;
  return ((price - this.costPerUnit) / price) * 100;
});

/**
 * Virtual: isLowStock
 * Indicates if stock is at or below threshold
 */
ProductListingSchema.virtual('isLowStock').get(function (this: IProductListing): boolean {
  return this.stockQuantity <= this.lowStockThreshold;
});

/**
 * Virtual: isOnSale
 * Indicates if product has active sale price
 */
ProductListingSchema.virtual('isOnSale').get(function (this: IProductListing): boolean {
  return !!this.salePrice && this.salePrice > 0 && this.salePrice < this.basePrice;
});

/**
 * ProductListing model
 */
const ProductListing: Model<IProductListing> =
  mongoose.models.ProductListing ||
  mongoose.model<IProductListing>('ProductListing', ProductListingSchema);

export default ProductListing;
