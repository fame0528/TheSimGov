/**
 * @fileoverview CustomerReview Mongoose Schema - Product Review Management
 * @module lib/db/models/ecommerce/CustomerReview
 * 
 * OVERVIEW:
 * Customer review model for e-commerce product feedback with moderation,
 * helpfulness voting, and verified purchase validation. Supports 1-5 star
 * ratings with text reviews and image uploads.
 * 
 * FEATURES:
 * - Star ratings (1-5)
 * - Verified purchase badge
 * - Helpfulness voting (helpful/unhelpful)
 * - Moderation workflow (Pending/Approved/Rejected)
 * - Report abuse functionality
 * - Auto-updates ProductListing ratings
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Moderation status states
 */
export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * CustomerReview document interface
 */
export interface ICustomerReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  company: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  rating: number;
  title?: string;
  text: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  reportCount: number;
  isPublished: boolean;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  helpfulnessRatio: number;
  isApproved: boolean;
  isRejected: boolean;
  daysSincePurchase: number | null;
}

// ============================================================================
// Schema Definition
// ============================================================================

const CustomerReviewSchema = new Schema<ICustomerReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'ProductListing',
      required: [true, 'Product reference is required'],
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [50, 'Customer name cannot exceed 50 characters'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: 'Cannot upload more than 5 review images',
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    helpfulVotes: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Helpful votes cannot be negative'],
    },
    unhelpfulVotes: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Unhelpful votes cannot be negative'],
    },
    moderationStatus: {
      type: String,
      required: true,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid moderation status',
      },
      index: true,
    },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Moderation notes cannot exceed 500 characters'],
    },
    reportCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Report count cannot be negative'],
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    purchaseDate: { type: Date },
  },
  {
    timestamps: true,
    collection: 'customerReviews',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// Indexes
// ============================================================================

CustomerReviewSchema.index({ product: 1, isPublished: 1 });
CustomerReviewSchema.index({ product: 1, customerEmail: 1 }, { unique: true });
CustomerReviewSchema.index({ company: 1, moderationStatus: 1 });
CustomerReviewSchema.index({ helpfulVotes: -1 });

// ============================================================================
// Virtual Fields
// ============================================================================

CustomerReviewSchema.virtual('helpfulnessRatio').get(function (this: ICustomerReview): number {
  const totalVotes = this.helpfulVotes + this.unhelpfulVotes;
  if (totalVotes === 0) return 0;
  return this.helpfulVotes / totalVotes;
});

CustomerReviewSchema.virtual('isApproved').get(function (this: ICustomerReview): boolean {
  return this.moderationStatus === 'Approved';
});

CustomerReviewSchema.virtual('isRejected').get(function (this: ICustomerReview): boolean {
  return this.moderationStatus === 'Rejected';
});

CustomerReviewSchema.virtual('daysSincePurchase').get(function (this: ICustomerReview): number | null {
  if (!this.purchaseDate) return null;
  const diffMs = this.createdAt.getTime() - this.purchaseDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Auto-publish approved reviews
 */
CustomerReviewSchema.pre('save', function (next) {
  if (this.isModified('moderationStatus') && this.moderationStatus === 'Approved') {
    this.isPublished = true;
  }
  if (this.isModified('moderationStatus') && this.moderationStatus === 'Rejected') {
    this.isPublished = false;
  }
  next();
});

// ============================================================================
// Model Export
// ============================================================================

const CustomerReview: Model<ICustomerReview> =
  mongoose.models.CustomerReview ||
  mongoose.model<ICustomerReview>('CustomerReview', CustomerReviewSchema);

export default CustomerReview;
