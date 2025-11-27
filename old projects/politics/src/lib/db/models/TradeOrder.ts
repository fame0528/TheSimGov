/**
 * @fileoverview TradeOrder Model - Commodity Trade Order Management
 * 
 * OVERVIEW:
 * Manages buy/sell trade orders for energy commodities in both spot and futures markets.
 * Includes order matching, execution tracking, fill tracking, and commission calculations.
 * Supports limit orders, market orders, and stop orders with partial fill capabilities.
 * 
 * KEY FEATURES:
 * - 3 order types: Market (immediate), Limit (price target), Stop (trigger price)
 * - Buy/Sell sides with quantity tracking
 * - Order status lifecycle (Pending → Partially Filled → Filled → Cancelled)
 * - Partial fill tracking with average fill price calculation
 * - Commission structure (0.1%-0.5% based on order size)
 * - Order expiry (day orders, GTC - good-til-cancelled)
 * 
 * ORDER TYPES:
 * - Market Order: Execute immediately at best available price
 * - Limit Order: Execute only at specified price or better
 * - Stop Order: Trigger market order when price reaches stop price
 * 
 * COMMISSION STRUCTURE:
 * - Small orders (<$10k): 0.5%
 * - Medium orders ($10k-$100k): 0.3%
 * - Large orders ($100k-$1M): 0.2%
 * - Institutional orders (>$1M): 0.1%
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
 * Order types
 */
export type OrderType =
  | 'Market' // Execute immediately at market price
  | 'Limit'  // Execute at limit price or better
  | 'Stop';  // Trigger market order at stop price

/**
 * Order side
 */
export type OrderSide =
  | 'Buy'  // Buying commodity
  | 'Sell'; // Selling commodity

/**
 * Order status
 */
export type OrderStatus =
  | 'Pending'         // Waiting for execution
  | 'PartiallyFilled' // Some quantity filled
  | 'Filled'          // Completely filled
  | 'Cancelled'       // Cancelled by trader
  | 'Rejected'        // Rejected by system
  | 'Expired';        // Expired before execution

/**
 * Order duration
 */
export type OrderDuration =
  | 'Day' // Valid until end of trading day
  | 'GTC'; // Good-til-cancelled

// ================== INTERFACE ==================

/**
 * Fill record for partial/full fills
 */
export interface IFillRecord {
  fillPrice: number;      // Price at which quantity was filled
  fillQuantity: number;   // Quantity filled
  fillTime: Date;         // When fill occurred
  commission: number;     // Commission charged for this fill
}

/**
 * TradeOrder document interface
 */
export interface ITradeOrder extends Document {
  // Core Identification
  _id: Types.ObjectId;
  company: Types.ObjectId;
  commodity: CommodityType;
  
  // Order Specifications
  orderType: OrderType;
  orderSide: OrderSide;
  quantity: number;              // Total quantity to trade
  limitPrice?: number;           // For limit orders
  stopPrice?: number;            // For stop orders
  duration: OrderDuration;
  expiryDate?: Date;            // For day orders
  
  // Execution Tracking
  status: OrderStatus;
  filledQuantity: number;        // Quantity executed so far
  remainingQuantity: number;     // Quantity still to execute
  avgFillPrice: number;          // Average price of all fills
  totalCommission: number;       // Total commission paid
  
  // Fill History
  fills: IFillRecord[];          // Array of fill records
  
  // Timestamps
  placedAt: Date;
  firstFillAt?: Date;
  lastFillAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Methods
  executeMarketOrder(marketPrice: number): Promise<ITradeOrder>;
  executeLimitOrder(marketPrice: number): Promise<ITradeOrder>;
  executeStopOrder(marketPrice: number): Promise<ITradeOrder>;
  partialFill(fillPrice: number, fillQuantity: number): Promise<ITradeOrder>;
  cancelOrder(): Promise<ITradeOrder>;
  calculateCommission(fillValue: number): number;
  isExpired(): boolean;
  canExecuteAt(price: number): boolean;
  getOrderSummary(): {
    type: OrderType;
    side: OrderSide;
    commodity: CommodityType;
    quantity: number;
    filled: number;
    remaining: number;
    avgPrice: number;
    totalCost: number;
    status: OrderStatus;
  };
}

// ================== SCHEMA ==================

const FillRecordSchema = new Schema<IFillRecord>(
  {
    fillPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    fillQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    fillTime: {
      type: Date,
      default: Date.now,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const TradeOrderSchema = new Schema<ITradeOrder>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    commodity: {
      type: String,
      enum: ['CrudeOil', 'NaturalGas', 'Electricity', 'Gasoline', 'Diesel', 'Coal'],
      required: true,
      index: true,
    },
    
    // Order Specifications
    orderType: {
      type: String,
      enum: ['Market', 'Limit', 'Stop'],
      required: true,
    },
    orderSide: {
      type: String,
      enum: ['Buy', 'Sell'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    limitPrice: {
      type: Number,
      min: 0,
      default: undefined,
    },
    stopPrice: {
      type: Number,
      min: 0,
      default: undefined,
    },
    duration: {
      type: String,
      enum: ['Day', 'GTC'],
      default: 'Day',
    },
    expiryDate: {
      type: Date,
      default: undefined,
    },
    
    // Execution Tracking
    status: {
      type: String,
      enum: ['Pending', 'PartiallyFilled', 'Filled', 'Cancelled', 'Rejected', 'Expired'],
      default: 'Pending',
      index: true,
    },
    filledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    avgFillPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Fill History
    fills: {
      type: [FillRecordSchema],
      default: [],
    },
    
    // Timestamps
    placedAt: {
      type: Date,
      default: Date.now,
    },
    firstFillAt: {
      type: Date,
      default: undefined,
    },
    lastFillAt: {
      type: Date,
      default: undefined,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'tradeorders',
  }
);

// ================== INDEXES ==================

TradeOrderSchema.index({ company: 1, status: 1 });
TradeOrderSchema.index({ commodity: 1, orderType: 1 });
TradeOrderSchema.index({ placedAt: -1 });
TradeOrderSchema.index({ status: 1, expiryDate: 1 });

// ================== HELPER FUNCTIONS ==================

/**
 * Calculate commission based on fill value
 */
function calculateCommissionRate(fillValue: number): number {
  if (fillValue < 10000) return 0.005;        // 0.5% for small orders
  if (fillValue < 100000) return 0.003;       // 0.3% for medium orders
  if (fillValue < 1000000) return 0.002;      // 0.2% for large orders
  return 0.001;                                // 0.1% for institutional
}

// ================== INSTANCE METHODS ==================

/**
 * Execute market order at current market price
 * 
 * @param marketPrice - Current market price
 * @returns Updated trade order after execution
 * 
 * @example
 * await order.executeMarketOrder(75.50);
 */
TradeOrderSchema.methods.executeMarketOrder = async function(
  this: ITradeOrder,
  marketPrice: number
): Promise<ITradeOrder> {
  if (this.orderType !== 'Market') {
    throw new Error('Not a market order');
  }
  
  if (this.status !== 'Pending') {
    throw new Error('Order already processed');
  }
  
  // Execute full quantity at market price
  await this.partialFill(marketPrice, this.quantity);
  
  return this.save();
};

/**
 * Execute limit order if price conditions met
 * 
 * @param marketPrice - Current market price
 * @returns Updated trade order (filled if price acceptable)
 * 
 * @example
 * await order.executeLimitOrder(74.00); // Executes if price <= $74 for buy
 */
TradeOrderSchema.methods.executeLimitOrder = async function(
  this: ITradeOrder,
  marketPrice: number
): Promise<ITradeOrder> {
  if (this.orderType !== 'Limit') {
    throw new Error('Not a limit order');
  }
  
  if (this.status === 'Filled' || this.status === 'Cancelled') {
    throw new Error('Order already completed');
  }
  
  if (!this.canExecuteAt(marketPrice)) {
    return this;  // Price not favorable, wait
  }
  
  // Execute at limit price (or better market price)
  const fillPrice = this.orderSide === 'Buy' 
    ? Math.min(marketPrice, this.limitPrice!)
    : Math.max(marketPrice, this.limitPrice!);
  
  await this.partialFill(fillPrice, this.remainingQuantity);
  
  return this.save();
};

/**
 * Execute stop order if trigger price reached
 * 
 * @param marketPrice - Current market price
 * @returns Updated trade order (converts to market order if triggered)
 * 
 * @example
 * await order.executeStopOrder(76.00); // Triggers if price >= $76
 */
TradeOrderSchema.methods.executeStopOrder = async function(
  this: ITradeOrder,
  marketPrice: number
): Promise<ITradeOrder> {
  if (this.orderType !== 'Stop') {
    throw new Error('Not a stop order');
  }
  
  if (this.status !== 'Pending') {
    throw new Error('Order already processed');
  }
  
  // Check if stop price triggered
  const triggered = this.orderSide === 'Buy'
    ? marketPrice >= this.stopPrice!
    : marketPrice <= this.stopPrice!;
  
  if (!triggered) {
    return this;  // Stop price not reached yet
  }
  
  // Convert to market order and execute
  await this.partialFill(marketPrice, this.quantity);
  
  return this.save();
};

/**
 * Partially fill order
 * 
 * @param fillPrice - Price at which fill occurs
 * @param fillQuantity - Quantity to fill
 * @returns Updated trade order
 * 
 * @example
 * await order.partialFill(75.25, 500); // Fill 500 units at $75.25
 */
TradeOrderSchema.methods.partialFill = async function(
  this: ITradeOrder,
  fillPrice: number,
  fillQuantity: number
): Promise<ITradeOrder> {
  if (fillQuantity <= 0) {
    throw new Error('Fill quantity must be positive');
  }
  
  if (fillQuantity > this.remainingQuantity) {
    throw new Error('Fill quantity exceeds remaining quantity');
  }
  
  // Calculate commission for this fill
  const fillValue = fillPrice * fillQuantity;
  const commission = this.calculateCommission(fillValue);
  
  // Create fill record
  const fill: IFillRecord = {
    fillPrice,
    fillQuantity,
    fillTime: new Date(),
    commission,
  };
  
  this.fills.push(fill);
  this.totalCommission += commission;
  
  // Update fill tracking
  const previousFilled = this.filledQuantity;
  this.filledQuantity += fillQuantity;
  this.remainingQuantity -= fillQuantity;
  
  // Calculate weighted average fill price
  this.avgFillPrice = (this.avgFillPrice * previousFilled + fillPrice * fillQuantity) / this.filledQuantity;
  
  // Update timestamps
  if (!this.firstFillAt) {
    this.firstFillAt = new Date();
  }
  this.lastFillAt = new Date();
  
  // Update status
  if (this.remainingQuantity === 0) {
    this.status = 'Filled';
    this.completedAt = new Date();
  } else {
    this.status = 'PartiallyFilled';
  }
  
  return this;
};

/**
 * Cancel pending or partially filled order
 * 
 * @returns Cancelled trade order
 * 
 * @example
 * await order.cancelOrder();
 */
TradeOrderSchema.methods.cancelOrder = async function(
  this: ITradeOrder
): Promise<ITradeOrder> {
  if (this.status === 'Filled') {
    throw new Error('Cannot cancel filled order');
  }
  
  if (this.status === 'Cancelled') {
    throw new Error('Order already cancelled');
  }
  
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  
  return this.save();
};

/**
 * Calculate commission for fill value
 * 
 * @param fillValue - Total value of fill
 * @returns Commission amount
 * 
 * @example
 * const commission = order.calculateCommission(50000); // $50k fill
 */
TradeOrderSchema.methods.calculateCommission = function(
  this: ITradeOrder,
  fillValue: number
): number {
  const rate = calculateCommissionRate(fillValue);
  return fillValue * rate;
};

/**
 * Check if order has expired
 * 
 * @returns True if expiry date passed
 * 
 * @example
 * if (order.isExpired()) { await order.cancelOrder(); }
 */
TradeOrderSchema.methods.isExpired = function(this: ITradeOrder): boolean {
  if (this.duration === 'GTC') return false;
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

/**
 * Check if order can execute at given price
 * 
 * @param price - Market price to check
 * @returns True if order should execute
 * 
 * @example
 * if (order.canExecuteAt(74.50)) { await order.executeLimitOrder(74.50); }
 */
TradeOrderSchema.methods.canExecuteAt = function(
  this: ITradeOrder,
  price: number
): boolean {
  if (this.orderType === 'Market') return true;
  
  if (this.orderType === 'Limit') {
    return this.orderSide === 'Buy'
      ? price <= this.limitPrice!
      : price >= this.limitPrice!;
  }
  
  if (this.orderType === 'Stop') {
    return this.orderSide === 'Buy'
      ? price >= this.stopPrice!
      : price <= this.stopPrice!;
  }
  
  return false;
};

/**
 * Get comprehensive order summary
 * 
 * @returns Order details object
 * 
 * @example
 * const summary = order.getOrderSummary();
 * // { type: 'Limit', side: 'Buy', filled: 500, remaining: 500, avgPrice: 75.25, ... }
 */
TradeOrderSchema.methods.getOrderSummary = function(this: ITradeOrder) {
  const totalCost = this.avgFillPrice * this.filledQuantity + this.totalCommission;
  
  return {
    type: this.orderType,
    side: this.orderSide,
    commodity: this.commodity,
    quantity: this.quantity,
    filled: this.filledQuantity,
    remaining: this.remainingQuantity,
    avgPrice: this.avgFillPrice,
    totalCost,
    status: this.status,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Set remaining quantity and expiry date
 */
TradeOrderSchema.pre('save', function(this: ITradeOrder, next) {
  // Initialize remaining quantity
  if (this.isNew) {
    this.remainingQuantity = this.quantity;
  }
  
  // Set expiry date for day orders
  if (this.duration === 'Day' && !this.expiryDate) {
    const expiry = new Date();
    expiry.setHours(16, 0, 0, 0);  // 4 PM market close
    if (new Date() > expiry) {
      expiry.setDate(expiry.getDate() + 1);  // Next trading day
    }
    this.expiryDate = expiry;
  }
  
  next();
});

// ================== MODEL ==================

export const TradeOrder: Model<ITradeOrder> = 
  mongoose.models.TradeOrder || 
  mongoose.model<ITradeOrder>('TradeOrder', TradeOrderSchema);

export default TradeOrder;
