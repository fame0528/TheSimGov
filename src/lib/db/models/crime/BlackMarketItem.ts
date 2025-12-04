/**
 * @fileoverview BlackMarketItem Model - Off-market goods/services
 * @module models/crime/BlackMarketItem
 *
 * @created 2025-12-01
 *
 * OVERVIEW:
 * Represents listings for black market items (non-substance goods/services).
 * Separate from MarketplaceListing (which is substance-focused). Tracks risk and
 * law-enforcement exposure.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export type BlackMarketCategory = 'Stolen Goods' | 'Counterfeits' | 'Weapons' | 'Restricted Items' | 'Services';
export type BlackMarketItemStatus = 'Active' | 'Sold' | 'Seized' | 'Removed';

export interface IBlackMarketItem extends Document {
  companyId?: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  category: BlackMarketCategory;
  itemName: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  location: { state: string; city: string };
  riskScore: number; // 0-100
  status: BlackMarketItemStatus;
  sellerReputation: number; // 0-100
  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlackMarketItemSchema = new Schema<IBlackMarketItem>({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { 
    type: String, 
    enum: ['Stolen Goods','Counterfeits','Weapons','Restricted Items','Services'],
    required: true,
    index: true
  },
  itemName: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
  description: { type: String, required: true, minlength: 10, maxlength: 2000 },
  quantity: { type: Number, required: true, min: 0 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  location: { 
    state: { type: String, required: true, index: true },
    city: { type: String, required: true }
  },
  riskScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
  status: { 
    type: String, 
    enum: ['Active','Sold','Seized','Removed'], 
    required: true, 
    default: 'Active',
    index: true 
  },
  sellerReputation: { type: Number, required: true, min: 0, max: 100, default: 50 },
  postedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

// Compound indexes
BlackMarketItemSchema.index({ sellerId: 1, postedAt: -1 });
BlackMarketItemSchema.index({ category: 1, status: 1, postedAt: -1 });

export const BlackMarketItem: Model<IBlackMarketItem> =
  mongoose.models.BlackMarketItem || 
  mongoose.model<IBlackMarketItem>('BlackMarketItem', BlackMarketItemSchema);

export default BlackMarketItem;
