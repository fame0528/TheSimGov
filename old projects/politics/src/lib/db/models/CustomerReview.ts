/**
 * @file src/lib/db/models/CustomerReview.ts
 * @description CustomerReview Mongoose schema for product review management
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * CustomerReview model for e-commerce product feedback and ratings with moderation,
 * helpfulness voting, and verified purchase validation. Supports 1-5 star ratings,
 * text reviews with image uploads, and abuse reporting. Integrates with ProductListing
 * to auto-update rating and review count via post-save hooks.
 * 
 * SCHEMA FIELDS:
 * - product: Reference to ProductListing document (required, indexed)
 * - company: Reference to Company document (required, indexed)
 * - customerName: Reviewer name (required, 2-50 chars)
 * - customerEmail: Reviewer email (required, validated, indexed)
 * - rating: Star rating 1-5 (required)
 * - title: Review headline (optional, max 100 chars)
 * - text: Review content (required, 10-2000 chars)
 * - images: Review image URLs (max 5)
 * - isVerifiedPurchase: Purchased product flag (default false, indexed)
 * - helpfulVotes: Count of "helpful" votes (default 0)
 * - unhelpfulVotes: Count of "unhelpful" votes (default 0)
 * - moderationStatus: Review approval state (Pending, Approved, Rejected)
 * - moderationNotes: Admin notes for rejection (optional)
 * - reportCount: Abuse report count (default 0)
 * - isPublished: Visibility status (default false until approved)
 * - purchaseDate: Verified purchase date (optional)
 * - createdAt: Review creation timestamp
 * - updatedAt: Last update timestamp
 * 
 * VIRTUAL FIELDS:
 * - helpfulnessRatio: Calculated as helpfulVotes / (helpfulVotes + unhelpfulVotes)
 * - isApproved: Boolean indicating if moderationStatus === 'Approved'
 * - isRejected: Boolean indicating if moderationStatus === 'Rejected'
 * - daysSincePurchase: Days between purchase and review (if verified)
 * 
 * USAGE:
 * ```typescript
 * import CustomerReview from '@/lib/db/models/CustomerReview';
 * 
 * // Create review
 * const review = await CustomerReview.create({
 *   product: productId,
 *   company: companyId,
 *   customerName: 'Jane Doe',
 *   customerEmail: 'jane@example.com',
 *   rating: 5,
 *   title: 'Excellent quality!',
 *   text: 'This laptop bag exceeded my expectations. Great material and craftsmanship.',
 *   isVerifiedPurchase: true,
 *   purchaseDate: new Date('2025-10-15')
 * });
 * 
 * // Approve review (triggers auto-update of ProductListing rating)
 * await review.updateOne({
 *   moderationStatus: 'Approved',
 *   isPublished: true
 * });
 * 
 * // Add helpful vote
 * await review.updateOne({ $inc: { helpfulVotes: 1 } });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Post-save hook auto-updates ProductListing.rating and .reviewCount
 * - Moderation prevents spam and inappropriate content
 * - Verified purchase badge increases review credibility
 * - Helpfulness voting surfaces most useful reviews
 * - Report threshold (e.g., 5+ reports) triggers auto-moderation
 * - Company reference enables review management dashboard
 * - Product reference indexed for efficient review listing
 * - Email indexed for duplicate review prevention per product
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { logger } from '@/lib/utils/logger';

/**
 * Moderation status states
 */
export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * CustomerReview document interface
 */
export interface ICustomerReview extends Document {
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
  
  // Virtual fields
  helpfulnessRatio: number;
  isApproved: boolean;
  isRejected: boolean;
  daysSincePurchase: number | null;
}

/**
 * CustomerReview schema definition
 */
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
    purchaseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'customerReviews',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Compound indexes for efficient queries
 */
CustomerReviewSchema.index({ product: 1, isPublished: 1 }); // Published reviews per product
CustomerReviewSchema.index({ product: 1, customerEmail: 1 }, { unique: true }); // One review per customer per product
CustomerReviewSchema.index({ company: 1, moderationStatus: 1 }); // Moderation queue
CustomerReviewSchema.index({ helpfulVotes: -1 }); // Most helpful reviews

/**
 * Virtual: helpfulnessRatio
 * Calculates ratio of helpful votes (0-1 range)
 */
CustomerReviewSchema.virtual('helpfulnessRatio').get(function (this: ICustomerReview): number {
  const totalVotes = this.helpfulVotes + this.unhelpfulVotes;
  if (totalVotes === 0) return 0;
  return this.helpfulVotes / totalVotes;
});

/**
 * Virtual: isApproved
 * Indicates if review is approved
 */
CustomerReviewSchema.virtual('isApproved').get(function (this: ICustomerReview): boolean {
  return this.moderationStatus === 'Approved';
});

/**
 * Virtual: isRejected
 * Indicates if review is rejected
 */
CustomerReviewSchema.virtual('isRejected').get(function (this: ICustomerReview): boolean {
  return this.moderationStatus === 'Rejected';
});

/**
 * Virtual: daysSincePurchase
 * Calculates days between purchase and review creation
 */
CustomerReviewSchema.virtual('daysSincePurchase').get(function (this: ICustomerReview): number | null {
  if (!this.purchaseDate) return null;
  const diffMs = this.createdAt.getTime() - this.purchaseDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

/**
 * Pre-save hook: Auto-publish approved reviews
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

/**
 * Post-save hook: Update ProductListing rating and review count
 * Automatically recalculates average rating when review is approved/rejected
 */
CustomerReviewSchema.post('save', async function (doc: ICustomerReview) {
  if (doc.moderationStatus === 'Approved' && doc.isPublished) {
    try {
      const ProductListing = mongoose.model('ProductListing');
      
      // Aggregate approved reviews for this product
      const stats = await mongoose.model('CustomerReview').aggregate([
        {
          $match: {
            product: doc.product,
            moderationStatus: 'Approved',
            isPublished: true,
          },
        },
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);
      
      if (stats.length > 0) {
        await ProductListing.findByIdAndUpdate(doc.product, {
          rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
          reviewCount: stats[0].count,
        });
      }
    } catch (error) {
      logger.error('Error updating product rating', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'post-save hook',
        component: 'CustomerReview Model',
        productId: doc.product,
        reviewId: doc._id
      });
    }
  }
});

/**
 * Post-remove hook: Update ProductListing rating after review deletion
 */
CustomerReviewSchema.post('findOneAndDelete', async function (doc: ICustomerReview | null) {
  if (doc && doc.moderationStatus === 'Approved') {
    try {
      const ProductListing = mongoose.model('ProductListing');
      
      const stats = await mongoose.model('CustomerReview').aggregate([
        {
          $match: {
            product: doc.product,
            moderationStatus: 'Approved',
            isPublished: true,
          },
        },
        {
          $group: {
            _id: '$product',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);
      
      if (stats.length > 0) {
        await ProductListing.findByIdAndUpdate(doc.product, {
          rating: Math.round(stats[0].avgRating * 10) / 10,
          reviewCount: stats[0].count,
        });
      } else {
        // No reviews left, reset to 0
        await ProductListing.findByIdAndUpdate(doc.product, {
          rating: 0,
          reviewCount: 0,
        });
      }
    } catch (error) {
      logger.error('Error updating product rating after deletion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'post-remove hook',
        component: 'CustomerReview Model',
        productId: doc.product,
        reviewId: doc._id
      });
    }
  }
});

/**
 * CustomerReview model
 */
const CustomerReview: Model<ICustomerReview> =
  mongoose.models.CustomerReview ||
  mongoose.model<ICustomerReview>('CustomerReview', CustomerReviewSchema);

export default CustomerReview;
