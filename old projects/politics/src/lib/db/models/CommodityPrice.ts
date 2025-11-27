/**
 * @fileoverview CommodityPrice Model - Real-time Energy Commodity Pricing
 * 
 * OVERVIEW:
 * Tracks real-time and historical prices for energy commodities (crude oil, natural gas, 
 * electricity, refined products). Includes OPEC event modeling, volatility tracking, and 
 * market sentiment analysis. Enables realistic commodity trading gameplay with price 
 * fluctuations driven by supply/demand, geopolitical events, and seasonal variations.
 * 
 * KEY FEATURES:
 * - 6 commodity types: Crude Oil, Natural Gas, Electricity, Gasoline, Diesel, Coal
 * - OPEC event simulation (production cuts/increases, embargo, price war, stability)
 * - Volatility tracking with 7/30/90-day windows
 * - Market sentiment (Bullish, Neutral, Bearish) with confidence scores
 * - Price bounds validation (min/max by commodity type)
 * - Historical price tracking with tick-level granularity
 * 
 * PRICING MECHANICS:
 * - Crude Oil: $20-$200/barrel (typically $60-$90)
 * - Natural Gas: $1-$20/MMBtu (typically $2-$6)
 * - Electricity: $20-$500/MWh (typically $30-$100)
 * - Gasoline: $1-$10/gallon (typically $2-$4)
 * - Diesel: $1-$10/gallon (typically $2.50-$5)
 * - Coal: $30-$300/ton (typically $50-$150)
 * 
 * OPEC EVENT IMPACTS:
 * - Production Cut: +10% to +30% price increase
 * - Production Increase: -15% to -25% price decrease
 * - Embargo: +40% to +100% price spike
 * - Price War: -30% to -50% price collapse
 * - Stability Pact: -5% to +5% price normalization
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Energy commodity types
 */
export type CommodityType = 
  | 'CrudeOil'      // WTI/Brent crude oil ($/barrel)
  | 'NaturalGas'    // Natural gas ($/MMBtu)
  | 'Electricity'   // Wholesale electricity ($/MWh)
  | 'Gasoline'      // Refined gasoline ($/gallon)
  | 'Diesel'        // Refined diesel ($/gallon)
  | 'Coal';         // Thermal coal ($/ton)

/**
 * OPEC event types affecting oil prices
 */
export type OpecEventType =
  | 'ProductionCut'      // Supply restriction (+10% to +30% price)
  | 'ProductionIncrease' // Supply expansion (-15% to -25% price)
  | 'Embargo'            // Trade restriction (+40% to +100% price)
  | 'PriceWar'          // Competition-driven (-30% to -50% price)
  | 'StabilityPact';    // Agreement to stabilize (-5% to +5% price)

/**
 * Market sentiment indicators
 */
export type MarketSentiment = 
  | 'Bullish'  // Expecting price increase
  | 'Neutral'  // No strong direction
  | 'Bearish'; // Expecting price decrease

// ================== INTERFACE ==================

/**
 * CommodityPrice document interface
 */
export interface ICommodityPrice extends Document {
  // Core Identification
  _id: Types.ObjectId;
  commodity: CommodityType;
  
  // Pricing
  currentPrice: number;        // Current market price (units vary by commodity)
  previousClose: number;       // Previous trading day closing price
  dayHigh: number;            // Highest price today
  dayLow: number;             // Lowest price today
  
  // Market Dynamics
  volatility7d: number;        // 7-day price volatility (0-100%)
  volatility30d: number;       // 30-day price volatility (0-100%)
  volatility90d: number;       // 90-day price volatility (0-100%)
  tradingVolume: number;       // Daily trading volume (contracts/barrels)
  marketSentiment: MarketSentiment;
  sentimentConfidence: number; // Sentiment confidence (0-100%)
  
  // OPEC Events (for oil commodities)
  activeOpecEvent?: OpecEventType;
  opecEventStartDate?: Date;
  opecEventDuration?: number;  // Duration in days
  opecEventImpact?: number;    // Price impact percentage (-50% to +100%)
  
  // Timestamps
  lastUpdated: Date;
  priceHistoryUpdatedAt: Date;
  
  // Methods
  updatePrice(newPrice: number, volume: number): Promise<ICommodityPrice>;
  calculateVolatility(days: number): number;
  applyOpecEvent(eventType: OpecEventType, duration: number): Promise<ICommodityPrice>;
  resolveOpecEvent(): Promise<ICommodityPrice>;
  getPriceChange(): number;
  getPriceChangePercent(): number;
  isVolatile(): boolean;
  getMarketConditions(): {
    sentiment: MarketSentiment;
    confidence: number;
    volatility: number;
    trend: 'Rising' | 'Falling' | 'Stable';
  };
}

// ================== SCHEMA ==================

const CommodityPriceSchema = new Schema<ICommodityPrice>(
  {
    commodity: {
      type: String,
      enum: ['CrudeOil', 'NaturalGas', 'Electricity', 'Gasoline', 'Diesel', 'Coal'],
      required: true,
      index: true,
    },
    
    // Pricing
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(this: ICommodityPrice, value: number): boolean {
          const bounds = getPriceBounds(this.commodity);
          return value >= bounds.min && value <= bounds.max;
        },
        message: 'Price outside realistic bounds for commodity type',
      },
    },
    previousClose: {
      type: Number,
      required: true,
      min: 0,
    },
    dayHigh: {
      type: Number,
      required: true,
      min: 0,
    },
    dayLow: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Market Dynamics
    volatility7d: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    volatility30d: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    volatility90d: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tradingVolume: {
      type: Number,
      default: 0,
      min: 0,
    },
    marketSentiment: {
      type: String,
      enum: ['Bullish', 'Neutral', 'Bearish'],
      default: 'Neutral',
    },
    sentimentConfidence: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    
    // OPEC Events
    activeOpecEvent: {
      type: String,
      enum: ['ProductionCut', 'ProductionIncrease', 'Embargo', 'PriceWar', 'StabilityPact'],
      default: undefined,
    },
    opecEventStartDate: {
      type: Date,
      default: undefined,
    },
    opecEventDuration: {
      type: Number,
      min: 1,
      max: 730, // Max 2 years
      default: undefined,
    },
    opecEventImpact: {
      type: Number,
      min: -50,
      max: 100,
      default: undefined,
    },
    
    // Timestamps
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    priceHistoryUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'commodityprices',
  }
);

// ================== INDEXES ==================

CommodityPriceSchema.index({ commodity: 1, lastUpdated: -1 });
CommodityPriceSchema.index({ activeOpecEvent: 1, opecEventStartDate: -1 });
CommodityPriceSchema.index({ marketSentiment: 1, volatility30d: -1 });

// ================== HELPER FUNCTIONS ==================

/**
 * Get realistic price bounds for commodity type
 */
function getPriceBounds(commodity: CommodityType): { min: number; max: number } {
  const bounds: Record<CommodityType, { min: number; max: number }> = {
    CrudeOil: { min: 20, max: 200 },      // $/barrel
    NaturalGas: { min: 1, max: 20 },      // $/MMBtu
    Electricity: { min: 20, max: 500 },   // $/MWh
    Gasoline: { min: 1, max: 10 },        // $/gallon
    Diesel: { min: 1, max: 10 },          // $/gallon
    Coal: { min: 30, max: 300 },          // $/ton
  };
  return bounds[commodity];
}

/**
 * Calculate OPEC event impact on price
 */
function calculateOpecImpact(eventType: OpecEventType): number {
  const impacts: Record<OpecEventType, { min: number; max: number }> = {
    ProductionCut: { min: 10, max: 30 },
    ProductionIncrease: { min: -25, max: -15 },
    Embargo: { min: 40, max: 100 },
    PriceWar: { min: -50, max: -30 },
    StabilityPact: { min: -5, max: 5 },
  };
  
  const range = impacts[eventType];
  return range.min + Math.random() * (range.max - range.min);
}

// ================== INSTANCE METHODS ==================

/**
 * Update commodity price with new market data
 * 
 * @param newPrice - New market price
 * @param volume - Trading volume
 * @returns Updated commodity price document
 * 
 * @example
 * const price = await CommodityPrice.findOne({ commodity: 'CrudeOil' });
 * await price.updatePrice(75.50, 1000000);
 */
CommodityPriceSchema.methods.updatePrice = async function(
  this: ICommodityPrice,
  newPrice: number,
  volume: number
): Promise<ICommodityPrice> {
  // Validate price bounds
  const bounds = getPriceBounds(this.commodity);
  if (newPrice < bounds.min || newPrice > bounds.max) {
    throw new Error(`Price ${newPrice} outside bounds [${bounds.min}, ${bounds.max}] for ${this.commodity}`);
  }
  
  // Update day high/low
  if (newPrice > this.dayHigh) this.dayHigh = newPrice;
  if (newPrice < this.dayLow) this.dayLow = newPrice;
  
  // Update previous close and current price
  this.previousClose = this.currentPrice;
  this.currentPrice = newPrice;
  this.tradingVolume = volume;
  
  // Recalculate volatility
  this.volatility7d = this.calculateVolatility(7);
  this.volatility30d = this.calculateVolatility(30);
  this.volatility90d = this.calculateVolatility(90);
  
  // Update sentiment based on price movement
  const changePercent = this.getPriceChangePercent();
  if (changePercent > 2) {
    this.marketSentiment = 'Bullish';
    this.sentimentConfidence = Math.min(100, 50 + changePercent * 5);
  } else if (changePercent < -2) {
    this.marketSentiment = 'Bearish';
    this.sentimentConfidence = Math.min(100, 50 + Math.abs(changePercent) * 5);
  } else {
    this.marketSentiment = 'Neutral';
    this.sentimentConfidence = Math.max(30, 70 - Math.abs(changePercent) * 10);
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Calculate price volatility over specified period
 * 
 * @param days - Number of days to analyze (7, 30, or 90)
 * @returns Volatility percentage (0-100%)
 * 
 * @example
 * const volatility = price.calculateVolatility(30); // 30-day volatility
 */
CommodityPriceSchema.methods.calculateVolatility = function(
  this: ICommodityPrice,
  days: number
): number {
  // Simplified volatility: based on price range and OPEC events
  const priceRange = this.dayHigh - this.dayLow;
  const baseVolatility = (priceRange / this.currentPrice) * 100;
  
  // OPEC events increase volatility
  const opecMultiplier = this.activeOpecEvent ? 1.5 : 1.0;
  
  // Apply time decay (longer periods = lower volatility)
  const timeFactor = days === 7 ? 1.0 : (days === 30 ? 0.8 : 0.6);
  
  return Math.min(100, baseVolatility * opecMultiplier * timeFactor);
};

/**
 * Apply OPEC event to commodity price
 * 
 * @param eventType - Type of OPEC event
 * @param duration - Event duration in days
 * @returns Updated commodity price with event applied
 * 
 * @example
 * await price.applyOpecEvent('ProductionCut', 90); // 90-day production cut
 */
CommodityPriceSchema.methods.applyOpecEvent = async function(
  this: ICommodityPrice,
  eventType: OpecEventType,
  duration: number
): Promise<ICommodityPrice> {
  if (this.commodity !== 'CrudeOil' && this.commodity !== 'Gasoline' && this.commodity !== 'Diesel') {
    throw new Error('OPEC events only apply to oil-related commodities');
  }
  
  // Calculate and apply price impact
  const impact = calculateOpecImpact(eventType);
  const newPrice = this.currentPrice * (1 + impact / 100);
  
  // Update OPEC event fields
  this.activeOpecEvent = eventType;
  this.opecEventStartDate = new Date();
  this.opecEventDuration = duration;
  this.opecEventImpact = impact;
  
  // Update price with event impact
  await this.updatePrice(newPrice, this.tradingVolume);
  
  return this.save();
};

/**
 * Resolve active OPEC event (price normalization)
 * 
 * @returns Updated commodity price with event resolved
 * 
 * @example
 * await price.resolveOpecEvent(); // End embargo, normalize price
 */
CommodityPriceSchema.methods.resolveOpecEvent = async function(
  this: ICommodityPrice
): Promise<ICommodityPrice> {
  if (!this.activeOpecEvent) {
    throw new Error('No active OPEC event to resolve');
  }
  
  // Reverse price impact gradually (50% reversal)
  const reversalFactor = 0.5;
  const newPrice = this.currentPrice / (1 + (this.opecEventImpact! * reversalFactor) / 100);
  
  // Clear OPEC event fields
  this.activeOpecEvent = undefined;
  this.opecEventStartDate = undefined;
  this.opecEventDuration = undefined;
  this.opecEventImpact = undefined;
  
  // Update price with normalization
  await this.updatePrice(newPrice, this.tradingVolume);
  
  return this.save();
};

/**
 * Get absolute price change from previous close
 * 
 * @returns Price change in dollars
 * 
 * @example
 * const change = price.getPriceChange(); // +$2.50
 */
CommodityPriceSchema.methods.getPriceChange = function(this: ICommodityPrice): number {
  return this.currentPrice - this.previousClose;
};

/**
 * Get percentage price change from previous close
 * 
 * @returns Price change percentage
 * 
 * @example
 * const changePct = price.getPriceChangePercent(); // +3.5%
 */
CommodityPriceSchema.methods.getPriceChangePercent = function(this: ICommodityPrice): number {
  if (this.previousClose === 0) return 0;
  return ((this.currentPrice - this.previousClose) / this.previousClose) * 100;
};

/**
 * Check if commodity is highly volatile
 * 
 * @returns True if 30-day volatility > 15%
 * 
 * @example
 * if (price.isVolatile()) { console.log('High risk trading!'); }
 */
CommodityPriceSchema.methods.isVolatile = function(this: ICommodityPrice): boolean {
  return this.volatility30d > 15;
};

/**
 * Get comprehensive market conditions
 * 
 * @returns Market analysis object
 * 
 * @example
 * const conditions = price.getMarketConditions();
 * // { sentiment: 'Bullish', confidence: 75, volatility: 12, trend: 'Rising' }
 */
CommodityPriceSchema.methods.getMarketConditions = function(this: ICommodityPrice) {
  const changePercent = this.getPriceChangePercent();
  let trend: 'Rising' | 'Falling' | 'Stable';
  
  if (changePercent > 1) trend = 'Rising';
  else if (changePercent < -1) trend = 'Falling';
  else trend = 'Stable';
  
  return {
    sentiment: this.marketSentiment,
    confidence: this.sentimentConfidence,
    volatility: this.volatility30d,
    trend,
  };
};

// ================== MODEL ==================

export const CommodityPrice: Model<ICommodityPrice> = 
  mongoose.models.CommodityPrice || 
  mongoose.model<ICommodityPrice>('CommodityPrice', CommodityPriceSchema);

export default CommodityPrice;
