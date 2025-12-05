/**
 * @fileoverview StatePricing Mongoose Model - Dynamic drug prices by state
 * @module lib/db/models/crime/StatePricing
 * 
 * OVERVIEW:
 * Stores dynamic pricing for all substances across all 50 states + DC:
 * - Base and current prices per substance
 * - Supply/demand levels affecting prices
 * - Price trends and volatility
 * - Legal status per substance
 * - Active market events (droughts, busts, festivals)
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { StateCode, SubstanceName } from '@/lib/types/crime';
import type { 
  PriceTrend, 
  SubstancePriceEntry, 
  SubstanceLegalStatus, 
  MarketEvent,
  StatePricingBase 
} from '@/lib/types/crime-mmo';

/**
 * Substance price entry subdocument interface
 */
export interface ISubstancePriceEntry {
  substance: SubstanceName;
  basePrice: number;
  currentPrice: number;
  trend: PriceTrend;
  volatility: number;
  demand: number;
  supply: number;
  lastUpdate: Date;
}

/**
 * Market event subdocument interface
 */
export interface IMarketEvent {
  type: 'drought' | 'bust' | 'festival' | 'legalization_vote' | 'surplus' | 'crackdown';
  substance?: SubstanceName;
  priceModifier: number;
  expiresAt: Date;
  description: string;
}

/**
 * StatePricing document interface
 */
export interface IStatePricing extends Document {
  state: StateCode;
  stateName: string;
  prices: ISubstancePriceEntry[];
  legalStatus: Map<string, SubstanceLegalStatus>;
  lawEnforcementIntensity: number;
  playerProductionVolume: number;
  activeEvents: IMarketEvent[];
  lastUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Substance price entry subdocument schema
 */
const SubstancePriceEntrySchema = new Schema<ISubstancePriceEntry>({
  substance: { 
    type: String, 
    required: true,
    enum: ['Cannabis', 'Cocaine', 'Heroin', 'Methamphetamine', 'MDMA', 'LSD', 'Psilocybin', 'Fentanyl', 'Oxycodone']
  },
  basePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, required: true, min: 0 },
  trend: { type: String, required: true, enum: ['rising', 'falling', 'stable'], default: 'stable' },
  volatility: { type: Number, required: true, min: 0, max: 100, default: 20 },
  demand: { type: Number, required: true, min: 0, max: 100, default: 50 },
  supply: { type: Number, required: true, min: 0, max: 100, default: 50 },
  lastUpdate: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Market event subdocument schema
 */
const MarketEventSchema = new Schema<IMarketEvent>({
  type: { 
    type: String, 
    required: true, 
    enum: ['drought', 'bust', 'festival', 'legalization_vote', 'surplus', 'crackdown'] 
  },
  substance: { 
    type: String,
    enum: ['Cannabis', 'Cocaine', 'Heroin', 'Methamphetamine', 'MDMA', 'LSD', 'Psilocybin', 'Fentanyl', 'Oxycodone']
  },
  priceModifier: { type: Number, required: true, min: 0.1, max: 5.0, default: 1.0 },
  expiresAt: { type: Date, required: true },
  description: { type: String, required: true }
}, { _id: false });

/**
 * StatePricing schema
 */
const StatePricingSchema = new Schema<IStatePricing>({
  state: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  stateName: { type: String, required: true },
  prices: { type: [SubstancePriceEntrySchema], required: true },
  legalStatus: { 
    type: Map, 
    of: { type: String, enum: ['legal', 'decriminalized', 'illegal', 'felony'] },
    default: new Map()
  },
  lawEnforcementIntensity: { type: Number, required: true, min: 0, max: 100, default: 50 },
  playerProductionVolume: { type: Number, required: true, min: 0, default: 0 },
  activeEvents: { type: [MarketEventSchema], default: [] },
  lastUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for common queries
StatePricingSchema.index({ 'prices.substance': 1 });
StatePricingSchema.index({ lastUpdate: -1 });

/**
 * Transform toJSON for clean API responses
 */
StatePricingSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    const { _id, __v, ...rest } = ret;
    
    // Convert Map to plain object
    if (rest.legalStatus instanceof Map) {
      rest.legalStatus = Object.fromEntries(rest.legalStatus as Map<string, SubstanceLegalStatus>);
    }
    
    return {
      id: String(_id),
      ...rest,
    };
  }
});

/**
 * StatePricing model
 */
export const StatePricing: Model<IStatePricing> = 
  mongoose.models.StatePricing || 
  mongoose.model<IStatePricing>('StatePricing', StatePricingSchema);

export default StatePricing;
