/**
 * @file lib/db/models/CompanyLocation.ts
 * @description Mongoose schema for company locations (HQ, branches, address, state, region, costs, benefits)
 * @created 2025-11-15
 *
 * OVERVIEW:
 * Represents a physical location (HQ or branch) for a company, including address, state, region,
 * location-specific costs (taxes, wages, regulations), and benefits (talent pool, market size).
 * Supports multi-location operations and geographic expansion mechanics.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LocationType = 'HQ' | 'Branch';

export interface ICompanyLocation extends Document {
  company: Types.ObjectId; // Reference to Company
  type: LocationType; // HQ or Branch
  address: string;
  state: string; // e.g., 'CA', 'NY'
  region: string; // e.g., 'West', 'Northeast'
  openedAt: Date;
  costs: {
    taxes: number;
    wages: number;
    regulations: number;
    rent: number;
    [key: string]: number;
  };
  benefits: {
    talentPool: number;
    marketSize: number;
    logistics: number;
    [key: string]: number;
  };
}

const CompanyLocationSchema = new Schema<ICompanyLocation>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  type: { type: String, enum: ['HQ', 'Branch'], required: true },
  address: { type: String, required: true, maxlength: 200 },
  state: { type: String, required: true, maxlength: 2 },
  region: { type: String, required: true },
  openedAt: { type: Date, required: true, default: Date.now },
  costs: {
    taxes: { type: Number, required: true, default: 0 },
    wages: { type: Number, required: true, default: 0 },
    regulations: { type: Number, required: true, default: 0 },
    rent: { type: Number, required: true, default: 0 },
  },
  benefits: {
    talentPool: { type: Number, required: true, default: 0 },
    marketSize: { type: Number, required: true, default: 0 },
    logistics: { type: Number, required: true, default: 0 },
  },
});

CompanyLocationSchema.index({ company: 1, address: 1 }, { unique: true });

const CompanyLocation: Model<ICompanyLocation> =
  mongoose.models.CompanyLocation || mongoose.model<ICompanyLocation>('CompanyLocation', CompanyLocationSchema);

export default CompanyLocation;
