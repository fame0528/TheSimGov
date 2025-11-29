/**
 * @file CommodityPrice.ts
 * @description Energy commodity real-time & historical pricing with volatility windows and OPEC event adjustments.
 * @created 2025-11-28
 *
 * OVERVIEW:
 * Tracks spot & moving-average prices for major energy commodities (Crude Oil, Natural Gas, Coal, Uranium, Gasoline,
 * Diesel, Jet Fuel, LNG, Ethanol) along with day/week/month/quarter volatility bands. Supports modeled geopolitical
 * / OPEC events that apply temporary price deltas with decay/resolution logic. Provides normalized price insight for
 * trading endpoints and analytics dashboards.
 *
 * DESIGN PRINCIPLES:
 * - No duplicate indexes per ECHO v1.3.1 (single company + commodity compound applied once)
 * - Moving averages recalculated on record append (lightweight; future optimization may batch)
 * - OPEC events stored as sub-documents with impact magnitude (%) and decay behavior
 *
 * USAGE EXAMPLE:
 * ```ts
 * import { CommodityPrice } from '@/lib/db/models';
 * const brent = await CommodityPrice.create({
 *   company: companyId,
 *   commodity: 'CrudeOil',
 *   symbol: 'BRENT',
 *   currentPrice: 82.34
 * });
 * await brent.applyOPECEvent('ProductionCut', 5.5, 14); // +5.5% over 14 days decay
 * const analytics = brent.getVolatilitySnapshot();
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CommodityType = 'CrudeOil' | 'NaturalGas' | 'Coal' | 'Uranium' | 'Gasoline' | 'Diesel' | 'JetFuel' | 'LNG' | 'Ethanol';

export interface IOPECEvent {
  eventType: 'ProductionCut' | 'ProductionIncrease' | 'GeopoliticalRisk' | 'SupplyDisruption' | 'DemandShock';
  impactPercent: number;            // + or - percent applied to price
  startDate: Date;
  decayDays: number;               // Linear decay period after start
  resolved: boolean;
  resolutionDate?: Date;
}

export interface IHistoricalPriceRecord {
  date: Date;
  price: number;
}

export interface ICommodityPrice extends Document {
  company: Types.ObjectId;
  commodity: CommodityType;
  symbol: string;              // Market symbol (e.g., BRENT, WTI, HHGAS)
  currentPrice: number;
  dayAverage: number;
  weekAverage: number;
  monthAverage: number;
  quarterAverage: number;
  dayVolatility: number;       // % change range over day window
  weekVolatility: number;
  monthVolatility: number;
  quarterVolatility: number;
  opecEvents: IOPECEvent[];
  historical: IHistoricalPriceRecord[];

  recordPrice(price: number, date?: Date): Promise<ICommodityPrice>;
  applyOPECEvent(eventType: IOPECEvent['eventType'], impactPercent: number, decayDays: number): Promise<ICommodityPrice>;
  resolveEvent(index: number): Promise<ICommodityPrice>;
  getAdjustedPrice(): number;
  getVolatilitySnapshot(): {
    current: number;
    dayAvg: number; weekAvg: number; monthAvg: number; quarterAvg: number;
    dayVol: number; weekVol: number; monthVol: number; quarterVol: number;
    activeEvents: number;
  };
}

const OPECEventSchema = new Schema<IOPECEvent>({
  eventType: { type: String, enum: ['ProductionCut', 'ProductionIncrease', 'GeopoliticalRisk', 'SupplyDisruption', 'DemandShock'], required: true },
  impactPercent: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  decayDays: { type: Number, default: 0, min: 0 },
  resolved: { type: Boolean, default: false },
  resolutionDate: { type: Date }
}, { _id: false });

const HistoricalRecordSchema = new Schema<IHistoricalPriceRecord>({
  date: { type: Date, default: Date.now },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const CommodityPriceSchema = new Schema<ICommodityPrice>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  commodity: { type: String, enum: ['CrudeOil', 'NaturalGas', 'Coal', 'Uranium', 'Gasoline', 'Diesel', 'JetFuel', 'LNG', 'Ethanol'], required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true, maxlength: 15 },
  currentPrice: { type: Number, required: true, min: 0 },
  dayAverage: { type: Number, default: 0 },
  weekAverage: { type: Number, default: 0 },
  monthAverage: { type: Number, default: 0 },
  quarterAverage: { type: Number, default: 0 },
  dayVolatility: { type: Number, default: 0 },
  weekVolatility: { type: Number, default: 0 },
  monthVolatility: { type: Number, default: 0 },
  quarterVolatility: { type: Number, default: 0 },
  opecEvents: { type: [OPECEventSchema], default: [] },
  historical: { type: [HistoricalRecordSchema], default: [] }
}, { timestamps: true, collection: 'commodityprices' });

// Compound index for company + commodity + symbol (query acceleration)
CommodityPriceSchema.index({ company: 1, commodity: 1, symbol: 1 }, { unique: false });

// -------------------------- Helper Functions -------------------------------
function calcWindow(records: IHistoricalPriceRecord[], days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.filter(r => r.date.getTime() >= cutoff);
}

function avg(records: IHistoricalPriceRecord[]) {
  if (!records.length) return 0;
  return records.reduce((s, r) => s + r.price, 0) / records.length;
}

function volatility(records: IHistoricalPriceRecord[]) {
  if (records.length < 2) return 0;
  const prices = records.map(r => r.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const mid = (max + min) / 2 || 1;
  return ((max - min) / mid) * 100;
}

// -------------------------- Instance Methods -------------------------------
CommodityPriceSchema.methods.recordPrice = async function (this: ICommodityPrice, price: number, date: Date = new Date()) {
  this.currentPrice = price;
  this.historical.push({ price, date });
  // Recalculate moving averages & volatility windows
  const day = calcWindow(this.historical, 1);
  const week = calcWindow(this.historical, 7);
  const month = calcWindow(this.historical, 30);
  const quarter = calcWindow(this.historical, 90);
  this.dayAverage = avg(day);
  this.weekAverage = avg(week);
  this.monthAverage = avg(month);
  this.quarterAverage = avg(quarter);
  this.dayVolatility = volatility(day);
  this.weekVolatility = volatility(week);
  this.monthVolatility = volatility(month);
  this.quarterVolatility = volatility(quarter);
  return this.save();
};

CommodityPriceSchema.methods.applyOPECEvent = async function (this: ICommodityPrice, eventType: IOPECEvent['eventType'], impactPercent: number, decayDays: number) {
  this.opecEvents.push({ eventType, impactPercent, decayDays, startDate: new Date(), resolved: false });
  return this.save();
};

CommodityPriceSchema.methods.resolveEvent = async function (this: ICommodityPrice, index: number) {
  if (!this.opecEvents[index]) throw new Error('Event index out of bounds');
  this.opecEvents[index].resolved = true;
  this.opecEvents[index].resolutionDate = new Date();
  return this.save();
};

CommodityPriceSchema.methods.getAdjustedPrice = function (this: ICommodityPrice) {
  let adjusted = this.currentPrice;
  const now = Date.now();
  this.opecEvents.forEach(ev => {
    if (ev.resolved) return; // resolved events no longer apply
    const elapsedDays = (now - ev.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = ev.decayDays > 0 ? Math.max(0, 1 - (elapsedDays / ev.decayDays)) : 1;
    adjusted *= (1 + (ev.impactPercent / 100) * decayFactor);
  });
  return Number(adjusted.toFixed(4));
};

CommodityPriceSchema.methods.getVolatilitySnapshot = function (this: ICommodityPrice) {
  return {
    current: this.getAdjustedPrice(),
    dayAvg: this.dayAverage,
    weekAvg: this.weekAverage,
    monthAvg: this.monthAverage,
    quarterAvg: this.quarterAverage,
    dayVol: this.dayVolatility,
    weekVol: this.weekVolatility,
    monthVol: this.monthVolatility,
    quarterVol: this.quarterVolatility,
    activeEvents: this.opecEvents.filter(e => !e.resolved).length
  };
};

// -------------------------- Pre-save Hook ----------------------------------
CommodityPriceSchema.pre('save', function (this: ICommodityPrice, next) {
  // Ensure historical length doesn't explode (basic cap – future archive strategy may replace)
  if (this.historical.length > 5000) this.historical.splice(0, this.historical.length - 5000);
  next();
});

export const CommodityPrice: Model<ICommodityPrice> = mongoose.models.CommodityPrice || mongoose.model<ICommodityPrice>('CommodityPrice', CommodityPriceSchema);
export default CommodityPrice;

/**
 * IMPLEMENTATION NOTES:
 * 1. Volatility calculation uses simple high-low range normalization; future enhancement may adopt stdev.
 * 2. Decay model linear; could replace with exponential or piecewise for realism.
 * 3. Adjusted price multiplies sequential event impacts – order independent due to multiplicative chaining.
 * 4. Index hygiene: Single compound index avoids duplicate single-field definitions; company & commodity queries fast.
 */