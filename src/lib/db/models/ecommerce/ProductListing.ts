/**
 * @fileoverview ProductListing Mongoose Schema - E-Commerce Product Catalog
 * @module lib/db/models/ecommerce/ProductListing
 * 
 * OVERVIEW:
 * Product catalog model for e-commerce with variants, pricing, SEO optimization,
 * inventory tracking, and sales analytics. Supports physical and digital products
 * with flexible variant system (size, color, material, etc.).
 * 
 * FEATURES:
 * - Product variants with price modifiers
 * - SEO fields for search optimization
 * - Stock tracking with low-stock alerts
 * - Sales metrics (totalSold, totalRevenue, rating)
 * - Virtual fields for computed properties
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product categories matching legacy implementation
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
 * Product variant interface for size, color, material options
 */
export interface ProductVariant {
  /** Variant type name (e.g., 'Size', 'Color') */
  name: string;
  /** Available options (e.g., ['Small', 'Medium', 'Large']) */
  options: string[];
  /** Optional price adjustment per variant */
  priceModifier?: number;
}

/**
 * ProductListing document interface
 */
export interface IProductListing extends Document {
  _id: Types.ObjectId;
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
  
  // Virtuals
  effectivePrice: number;
  profitMargin: number;
  isLowStock: boolean;
  isOnSale: boolean;
}

// ============================================================================
// Schema Definition
// ============================================================================

const ProductListingSchema = new Schema<IProductListing>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: 'text',
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

// ============================================================================
// Indexes
// ============================================================================

// Compound indexes for efficient queries
ProductListingSchema.index({ company: 1, isActive: 1 });
ProductListingSchema.index({ company: 1, category: 1 });
ProductListingSchema.index({ company: 1, isFeatured: 1 });
ProductListingSchema.index({ totalSold: -1 });
ProductListingSchema.index({ rating: -1 });

// ============================================================================
// Virtual Fields
// ============================================================================

/**
 * effectivePrice - Returns sale price if available, otherwise base price
 */
ProductListingSchema.virtual('effectivePrice').get(function (this: IProductListing): number {
  return this.salePrice && this.salePrice > 0 ? this.salePrice : this.basePrice;
});

/**
 * profitMargin - Calculates profit margin percentage
 */
ProductListingSchema.virtual('profitMargin').get(function (this: IProductListing): number {
  const price = this.salePrice || this.basePrice;
  if (price <= 0 || this.costPerUnit <= 0) return 0;
  return ((price - this.costPerUnit) / price) * 100;
});

/**
 * isLowStock - Indicates if stock is at or below threshold
 */
ProductListingSchema.virtual('isLowStock').get(function (this: IProductListing): boolean {
  return this.stockQuantity <= this.lowStockThreshold;
});

/**
 * isOnSale - Indicates if product has active sale price
 */
ProductListingSchema.virtual('isOnSale').get(function (this: IProductListing): boolean {
  return !!this.salePrice && this.salePrice > 0 && this.salePrice < this.basePrice;
});

// ============================================================================
// Model Export
// ============================================================================

const ProductListing: Model<IProductListing> =
  mongoose.models.ProductListing ||
  mongoose.model<IProductListing>('ProductListing', ProductListingSchema);

export default ProductListing;
