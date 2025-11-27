/**
 * @fileoverview MarketData Model - Energy Commodity Market Data & Analytics
 * 
 * OVERVIEW:
 * Stores and analyzes historical price data for energy commodities including OHLC
 * (Open-High-Low-Close) data, volume tracking, volatility calculations, and technical
 * indicators. Supports time-series analysis for trading decisions and market insights.
 * 
 * KEY FEATURES:
 * - OHLC price data with tick-level granularity (1min, 5min, 15min, 1hour, 1day)
 * - Volume tracking (total traded volume per period)
 * - Historical volatility calculations (7/30/90-day periods)
 * - Moving averages (SMA, EMA for 7/30/90/200-day periods)
 * - Price correlation analysis between commodities
 * - Bollinger Bands calculation
 * - RSI (Relative Strength Index) calculation
 * 
 * TIME GRANULARITIES:
 * - 1min: Real-time trading data
 * - 5min: Short-term patterns
 * - 15min: Intraday analysis
 * - 1hour: Hourly trends
 * - 1day: Daily aggregates for long-term analysis
 * 
 * TECHNICAL INDICATORS:
 * - SMA (Simple Moving Average): Arithmetic mean over period
 * - EMA (Exponential Moving Average): Weighted recent prices higher
 * - Volatility: Standard deviation of returns
 * - Bollinger Bands: SMA ± 2 standard deviations
 * - RSI: Momentum indicator (0-100 scale)
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Commodity types
 */
export type CommodityType = 
  | 'CrudeOil'
  | 'NaturalGas'
  | 'Electricity'
  | 'Gasoline'
  | 'Diesel'
  | 'Coal';

/**
 * Time granularity for data points
 */
export type TimeGranularity =
  | '1min'
  | '5min'
  | '15min'
  | '1hour'
  | '1day';

// ================== INTERFACE ==================

/**
 * MarketData document interface
 */
export interface IMarketData extends Document {
  // Core Identification
  _id: Types.ObjectId;
  commodity: CommodityType;
  granularity: TimeGranularity;
  
  // OHLC Data
  timestamp: Date;
  open: number;          // Opening price
  high: number;          // Highest price
  low: number;           // Lowest price
  close: number;         // Closing price
  volume: number;        // Total volume traded
  
  // Calculated Indicators (cached for performance)
  sma7?: number;         // 7-period simple moving average
  sma30?: number;        // 30-period simple moving average
  sma90?: number;        // 90-period simple moving average
  sma200?: number;       // 200-period simple moving average
  ema7?: number;         // 7-period exponential moving average
  ema30?: number;        // 30-period exponential moving average
  volatility7d?: number; // 7-day volatility
  volatility30d?: number;// 30-day volatility
  volatility90d?: number;// 90-day volatility
  rsi?: number;          // Relative strength index
  
  // Methods
  calculateSMA(period: number): Promise<number>;
  calculateEMA(period: number): Promise<number>;
  calculateVolatility(period: number): Promise<number>;
  calculateRSI(period: number): Promise<number>;
  getBollingerBands(period: number, stdDev: number): Promise<{
    upper: number;
    middle: number;
    lower: number;
  }>;
  getPriceChange(): number;
  getPriceChangePercent(): number;
  isHighVolume(): boolean;
}

// ================== SCHEMA ==================

const MarketDataSchema = new Schema<IMarketData>(
  {
    commodity: {
      type: String,
      enum: ['CrudeOil', 'NaturalGas', 'Electricity', 'Gasoline', 'Diesel', 'Coal'],
      required: true,
      index: true,
    },
    granularity: {
      type: String,
      enum: ['1min', '5min', '15min', '1hour', '1day'],
      required: true,
      index: true,
    },
    
    // OHLC Data
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    open: {
      type: Number,
      required: true,
      min: 0,
    },
    high: {
      type: Number,
      required: true,
      min: 0,
    },
    low: {
      type: Number,
      required: true,
      min: 0,
    },
    close: {
      type: Number,
      required: true,
      min: 0,
    },
    volume: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    
    // Cached Indicators
    sma7: {
      type: Number,
      min: 0,
      default: undefined,
    },
    sma30: {
      type: Number,
      min: 0,
      default: undefined,
    },
    sma90: {
      type: Number,
      min: 0,
      default: undefined,
    },
    sma200: {
      type: Number,
      min: 0,
      default: undefined,
    },
    ema7: {
      type: Number,
      min: 0,
      default: undefined,
    },
    ema30: {
      type: Number,
      min: 0,
      default: undefined,
    },
    volatility7d: {
      type: Number,
      min: 0,
      max: 100,
      default: undefined,
    },
    volatility30d: {
      type: Number,
      min: 0,
      max: 100,
      default: undefined,
    },
    volatility90d: {
      type: Number,
      min: 0,
      max: 100,
      default: undefined,
    },
    rsi: {
      type: Number,
      min: 0,
      max: 100,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'marketdata',
  }
);

// ================== INDEXES ==================

MarketDataSchema.index({ commodity: 1, granularity: 1, timestamp: -1 });
MarketDataSchema.index({ timestamp: -1 });
MarketDataSchema.index({ commodity: 1, timestamp: -1 });

// ================== STATIC METHODS ==================

/**
 * Get historical data for commodity
 * 
 * @param commodity - Commodity type
 * @param granularity - Time granularity
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of market data points
 * 
 * @example
 * const data = await MarketData.getHistoricalData('CrudeOil', '1day', startDate, endDate);
 */
MarketDataSchema.statics.getHistoricalData = async function(
  commodity: CommodityType,
  granularity: TimeGranularity,
  startDate: Date,
  endDate: Date
): Promise<IMarketData[]> {
  return this.find({
    commodity,
    granularity,
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 });
};

/**
 * Calculate correlation between two commodities
 * 
 * @param commodity1 - First commodity
 * @param commodity2 - Second commodity
 * @param period - Number of days to analyze
 * @returns Correlation coefficient (-1 to 1)
 * 
 * @example
 * const correlation = await MarketData.calculateCorrelation('CrudeOil', 'Gasoline', 30);
 */
MarketDataSchema.statics.calculateCorrelation = async function(
  commodity1: CommodityType,
  commodity2: CommodityType,
  period: number = 30
): Promise<number> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const data1 = await this.find({
    commodity: commodity1,
    granularity: '1day',
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 });
  
  const data2 = await this.find({
    commodity: commodity2,
    granularity: '1day',
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: 1 });
  
  if (data1.length === 0 || data2.length === 0 || data1.length !== data2.length) {
    return 0;
  }
  
  const prices1 = data1.map((d: IMarketData) => d.close);
  const prices2 = data2.map((d: IMarketData) => d.close);
  
  const mean1 = prices1.reduce((sum: number, p: number) => sum + p, 0) / prices1.length;
  const mean2 = prices2.reduce((sum: number, p: number) => sum + p, 0) / prices2.length;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < prices1.length; i++) {
    const diff1 = prices1[i] - mean1;
    const diff2 = prices2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
};

// ================== INSTANCE METHODS ==================

/**
 * Calculate Simple Moving Average (SMA)
 * 
 * @param period - Number of periods for calculation
 * @returns SMA value
 * 
 * @example
 * const sma30 = await marketData.calculateSMA(30);
 */
MarketDataSchema.methods.calculateSMA = async function(
  this: IMarketData,
  period: number
): Promise<number> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(period);
  
  if (historicalData.length < period) {
    return this.close;  // Not enough data
  }
  
  const sum = historicalData.reduce((acc, data) => acc + data.close, 0);
  return sum / period;
};

/**
 * Calculate Exponential Moving Average (EMA)
 * 
 * @param period - Number of periods for calculation
 * @returns EMA value
 * 
 * @example
 * const ema30 = await marketData.calculateEMA(30);
 */
MarketDataSchema.methods.calculateEMA = async function(
  this: IMarketData,
  period: number
): Promise<number> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(period);
  
  if (historicalData.length < period) {
    return this.close;  // Not enough data
  }
  
  // EMA multiplier
  const multiplier = 2 / (period + 1);
  
  // Start with SMA as initial EMA
  let ema = historicalData.slice(0, period).reduce((acc, data) => acc + data.close, 0) / period;
  
  // Calculate EMA iteratively
  for (let i = period; i < historicalData.length; i++) {
    ema = (historicalData[i].close - ema) * multiplier + ema;
  }
  
  return ema;
};

/**
 * Calculate historical volatility
 * 
 * @param period - Number of periods for calculation
 * @returns Volatility percentage
 * 
 * @example
 * const volatility = await marketData.calculateVolatility(30);
 */
MarketDataSchema.methods.calculateVolatility = async function(
  this: IMarketData,
  period: number
): Promise<number> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(period);
  
  if (historicalData.length < 2) {
    return 0;
  }
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 0; i < historicalData.length - 1; i++) {
    const currentPrice = historicalData[i].close;
    const previousPrice = historicalData[i + 1].close;
    const dailyReturn = (currentPrice - previousPrice) / previousPrice;
    returns.push(dailyReturn);
  }
  
  // Calculate standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualize volatility (multiply by sqrt(252 trading days))
  return stdDev * Math.sqrt(252) * 100;
};

/**
 * Calculate Relative Strength Index (RSI)
 * 
 * @param period - Number of periods for calculation (default 14)
 * @returns RSI value (0-100)
 * 
 * @example
 * const rsi = await marketData.calculateRSI(14);
 */
MarketDataSchema.methods.calculateRSI = async function(
  this: IMarketData,
  period: number = 14
): Promise<number> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(period + 1);
  
  if (historicalData.length < period + 1) {
    return 50;  // Neutral RSI if not enough data
  }
  
  // Calculate price changes
  let gains = 0;
  let losses = 0;
  
  for (let i = 0; i < period; i++) {
    const change = historicalData[i].close - historicalData[i + 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
};

/**
 * Calculate Bollinger Bands
 * 
 * @param period - Number of periods for SMA
 * @param stdDev - Number of standard deviations (default 2)
 * @returns Upper, middle, and lower bands
 * 
 * @example
 * const bands = await marketData.getBollingerBands(20, 2);
 */
MarketDataSchema.methods.getBollingerBands = async function(
  this: IMarketData,
  period: number = 20,
  stdDev: number = 2
): Promise<{ upper: number; middle: number; lower: number }> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(period);
  
  if (historicalData.length < period) {
    return { upper: this.close, middle: this.close, lower: this.close };
  }
  
  // Calculate SMA (middle band)
  const sum = historicalData.reduce((acc, data) => acc + data.close, 0);
  const middle = sum / period;
  
  // Calculate standard deviation
  const variance = historicalData.reduce((acc, data) => {
    return acc + Math.pow(data.close - middle, 2);
  }, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate bands
  const upper = middle + (stdDev * standardDeviation);
  const lower = middle - (stdDev * standardDeviation);
  
  return { upper, middle, lower };
};

/**
 * Get absolute price change from open to close
 * 
 * @returns Price change
 * 
 * @example
 * const change = marketData.getPriceChange(); // +2.50
 */
MarketDataSchema.methods.getPriceChange = function(this: IMarketData): number {
  return this.close - this.open;
};

/**
 * Get percentage price change from open to close
 * 
 * @returns Price change percentage
 * 
 * @example
 * const changePercent = marketData.getPriceChangePercent(); // +3.4%
 */
MarketDataSchema.methods.getPriceChangePercent = function(this: IMarketData): number {
  if (this.open === 0) return 0;
  return ((this.close - this.open) / this.open) * 100;
};

/**
 * Check if volume is significantly high
 * 
 * @returns True if volume > 1.5x average
 * 
 * @example
 * if (marketData.isHighVolume()) { console.log('High volume alert!'); }
 */
MarketDataSchema.methods.isHighVolume = async function(this: IMarketData): Promise<boolean> {
  const Model = this.constructor as Model<IMarketData>;
  
  const historicalData = await Model.find({
    commodity: this.commodity,
    granularity: this.granularity,
    timestamp: { $lte: this.timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(30);
  
  if (historicalData.length === 0) return false;
  
  const avgVolume = historicalData.reduce((sum, data) => sum + data.volume, 0) / historicalData.length;
  
  return this.volume > avgVolume * 1.5;
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Validate OHLC relationships and calculate indicators
 */
MarketDataSchema.pre('save', async function(this: IMarketData, next) {
  // Validate OHLC relationships
  if (this.high < this.low) {
    throw new Error('High must be >= low');
  }
  
  if (this.open > this.high || this.open < this.low) {
    throw new Error('Open must be between low and high');
  }
  
  if (this.close > this.high || this.close < this.low) {
    throw new Error('Close must be between low and high');
  }
  
  // Auto-calculate common indicators (cached for performance)
  try {
    this.sma7 = await this.calculateSMA(7);
    this.sma30 = await this.calculateSMA(30);
    this.ema7 = await this.calculateEMA(7);
    this.ema30 = await this.calculateEMA(30);
    this.volatility7d = await this.calculateVolatility(7);
    this.volatility30d = await this.calculateVolatility(30);
    this.rsi = await this.calculateRSI(14);
  } catch (error) {
    // Indicators optional, continue save
  }
  
  next();
});

// ================== MODEL ==================

interface IMarketDataModel extends Model<IMarketData> {
  getHistoricalData(
    commodity: CommodityType,
    granularity: TimeGranularity,
    startDate: Date,
    endDate: Date
  ): Promise<IMarketData[]>;
  calculateCorrelation(
    commodity1: CommodityType,
    commodity2: CommodityType,
    period?: number
  ): Promise<number>;
}

export const MarketData = (mongoose.models.MarketData || 
    mongoose.model<IMarketData>('MarketData', MarketDataSchema)) as IMarketDataModel;

export default MarketData;
