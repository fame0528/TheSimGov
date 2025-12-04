/**
 * @fileoverview Sector Mongoose Model
 * @module lib/db/models/Sector
 *
 * OVERVIEW:
 * Defines the Sector schema for sector-based company system.
 * Enforces sector uniqueness per state/location and ownership restriction by company industry/type.
 * Includes virtuals, methods, and strict type safety for AAA/ECHO compliance.
 *
 * @created 2025-12-03
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Sector } from '@/lib/types/sector';
import { SectorType } from '@/lib/types/sector';
import { IndustryType } from '@/lib/types/enums';
import { canCompanyOwnSector } from '@/lib/types/sector';

/**
 * Sector Document Interface
 */
export interface SectorDocument extends Omit<Sector, 'id'>, Document {
  // Methods
  canExpand(): boolean;
  canDownsize(): boolean;
  validateOwnership(companyIndustry: IndustryType): boolean;
}

/**
 * Sector Schema
 */
const sectorSchema = new Schema<SectorDocument>({
  companyId: {
    type: String,
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(SectorType),
    index: true,
  },
  growthLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  growthRate: {
    type: Number,
    default: 0.01,
    min: 0,
    max: 1,
  },
  size: {
    type: Number,
    default: 1,
    min: 1,
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
  profitMargin: {
    type: Number,
    default: 0.1,
    min: 0,
    max: 1,
  },
  marketShare: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  marketingStrength: {
    type: Number,
    default: 0,
    min: 0,
  },
  unionization: {
    percent: { type: Number, default: 0 },
    workers: { type: Number, default: 0 },
    unionName: { type: String, default: '' },
  },
  events: [{ type: Schema.Types.Mixed }],
  upgrades: [{ type: Schema.Types.Mixed }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Unique compound index: (type, location)
 * Ensures only one company can own a sector type in a given state/location
 */
sectorSchema.index({ type: 1, location: 1 }, { unique: true });

/**
 * Method: Validate sector ownership by company industry
 */
sectorSchema.methods.validateOwnership = function(companyIndustry: IndustryType): boolean {
  return canCompanyOwnSector(companyIndustry, this.type as SectorType);
};

/**
 * Method: Can expand sector
 */
sectorSchema.methods.canExpand = function(): boolean {
  // Example: max growthLevel = 10
  return this.growthLevel < 10;
};

/**
 * Method: Can downsize sector
 */
sectorSchema.methods.canDownsize = function(): boolean {
  // Example: min growthLevel = 1
  return this.growthLevel > 1;
};

/**
 * IMPLEMENTATION NOTES:
 * - Enforces sector uniqueness per state/location
 * - Restricts sector ownership by company industry/type
 * - Strict type safety and documentation for ECHO/AAA compliance
 */

const SectorModel: Model<SectorDocument> = mongoose.models.Sector || mongoose.model<SectorDocument>('Sector', sectorSchema);

export default SectorModel;
