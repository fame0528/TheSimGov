/**
 * @file src/lib/db/models/business/Business.ts
 * @description Business model for legalized operations converted from Crime facilities or created directly.
 * @created 2025-12-01
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { BusinessCategory, BusinessStatus } from '@/lib/types/business';

export interface BusinessDocument extends Document {
  name: string;
  ownerId: string;
  companyId?: string;
  facilityId?: string;
  convertedFromFacilityId?: string;
  category: BusinessCategory;
  status: BusinessStatus;
  taxRate: number;
  inventory: Array<{
    substance: string;
    quantity: number;
    purity: number;
    batch?: string;
  }>;
  address: {
    state: string;
    city: string;
    addressLine?: string;
    postalCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  __v?: number; // Mongoose version key for optimistic concurrency
}

const inventoryItemSchema = new Schema(
  {
    substance: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    purity: { type: Number, required: true, min: 0, max: 100 },
    batch: { type: String },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    addressLine: { type: String },
    postalCode: { type: String },
  },
  { _id: false }
);

const businessSchema = new Schema<BusinessDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true, index: true },
    companyId: { type: String, index: true },
    facilityId: { type: String, index: true },
    convertedFromFacilityId: { type: String, index: true },
    category: {
      type: String,
      required: true,
      enum: ['Dispensary', 'Cultivation Facility', 'Distribution Center', 'Processing Plant'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Pending', 'Suspended', 'Closed', 'Converted'],
      default: 'Active',
      index: true,
    },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    inventory: { type: [inventoryItemSchema], default: [] },
    address: { type: addressSchema, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
businessSchema.index({ name: 1, ownerId: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
businessSchema.index({ 'address.state': 1, category: 1, status: 1 });
// Ensure only one Business is created per converted facility
businessSchema.index(
  { convertedFromFacilityId: 1 },
  { unique: true, sparse: true }
);

const BusinessModel: Model<BusinessDocument> =
  mongoose.models.Business || mongoose.model<BusinessDocument>('Business', businessSchema);

export default BusinessModel;
