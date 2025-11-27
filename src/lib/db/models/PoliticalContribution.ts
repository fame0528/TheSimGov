/**
 * @file lib/db/models/PoliticalContribution.ts
 * @description Political campaign contribution tracking schema
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Tracks campaign donations from companies to political candidates.
 * Level 3+ companies can donate to campaigns to gain political influence.
 * Donations affect government contract access and lobbying power.
 *
 * USAGE:
 * ```typescript
 * import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
 *
 * // Record donation
 * const donation = await PoliticalContribution.create({
 *   company: companyId,
 *   candidateName: 'Senator Jane Smith',
 *   officeType: 'Senate',
 *   amount: 25000,
 *   influencePoints: 50
 * });
 *
 * // Get company donations
 * const donations = await PoliticalContribution.find({ company: companyId })
 *   .sort({ donatedAt: -1 });
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OfficeType = 'President' | 'Senate' | 'House' | 'Governor' | 'Mayor';

/**
 * Political contribution document interface
 */
export interface IPoliticalContribution extends Document {
  company: Types.ObjectId;
  candidateName: string;
  officeType: OfficeType;
  amount: number;
  influencePoints: number;
  donatedAt: Date;
  electionYear: number;
}

/**
 * Political contribution schema
 */
const PoliticalContributionSchema = new Schema<IPoliticalContribution>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      // index: true removed - already indexed via compound index { company: 1, donatedAt: -1 }
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      minlength: [3, 'Candidate name must be at least 3 characters'],
      maxlength: [100, 'Candidate name cannot exceed 100 characters'],
    },
    officeType: {
      type: String,
      required: [true, 'Office type is required'],
      enum: {
        values: ['President', 'Senate', 'House', 'Governor', 'Mayor'],
        message: '{VALUE} is not a valid office type',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Donation amount is required'],
      min: [100, 'Minimum donation is $100'],
    },
    influencePoints: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Influence points cannot be negative'],
    },
    donatedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    electionYear: {
      type: Number,
      required: [true, 'Election year is required'],
      min: [2025, 'Election year must be 2025 or later'],
    },
  },
  {
    timestamps: true,
    collection: 'political_contributions',
  }
);

// Compound indexes for efficient queries
PoliticalContributionSchema.index({ company: 1, donatedAt: -1 });
PoliticalContributionSchema.index({ candidateName: 1, electionYear: 1 });

const PoliticalContribution: Model<IPoliticalContribution> =
  mongoose.models.PoliticalContribution ||
  mongoose.model<IPoliticalContribution>('PoliticalContribution', PoliticalContributionSchema);

export default PoliticalContribution;