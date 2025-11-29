/**
 * @file EnergyTradeOrder.ts
 * @description Short-term energy market trade order model (bid/offer lifecycle) for intra-day / day-ahead trading.
 * @created 2025-11-28
 *
 * OVERVIEW:
 * Represents market participant orders (buy/sell) for energy products (MWh blocks) with support for limit / market
 * orders, partial fills, cancellation, and settlement tracking. Provides routines used by trading engine endpoints
 * for matching & execution metrics.
 *
 * DESIGN PRINCIPLES:
 * - Immutable executed fills sub-doc entries (records price-volume-time).
 * - Remaining quantity derived from original minus sum(fills.volume).
 * - Prevent duplicate indexes (single compound index for company + status + product + createdAt).
 * - Order validity restricted by expiration date; engine may purge expired open orders.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Limit' | 'Market';
export type OrderStatus = 'Open' | 'PartiallyFilled' | 'Filled' | 'Cancelled' | 'Expired';

export interface IOrderFill {
  fillTime: Date;
  price: number;      // Executed price per MWh
  volumeMWh: number;  // Executed quantity
  counterpartyOrder?: Types.ObjectId; // Optional reference to matched order
}

export interface IEnergyTradeOrder extends Document {
  company: Types.ObjectId;            // Tenant
  traderCompany: Types.ObjectId;      // Company executing the trade
  product: string;                    // e.g., 'PeakBlock', 'OffPeak', '24hr', 'SolarREC'
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: number;                      // For limit orders; market orders may snapshot best price
  quantityMWh: number;                // Original requested volume
  fills: IOrderFill[];
  createdAt: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  settlementDate?: Date;
  comments?: string;

  recordFill(volumeMWh: number, price: number, counterpartyOrder?: Types.ObjectId): Promise<IEnergyTradeOrder>;
  getFilledVolume(): number;
  getRemainingVolume(): number;
  cancel(reason?: string): Promise<IEnergyTradeOrder>;
  markExpired(): Promise<IEnergyTradeOrder>;
  finalizeSettlement(): Promise<IEnergyTradeOrder>;
  isActive(): boolean;
  averageFillPrice(): number;
}

const OrderFillSchema = new Schema<IOrderFill>({
  fillTime: { type: Date, default: Date.now },
  price: { type: Number, required: true, min: 0 },
  volumeMWh: { type: Number, required: true, min: 0.0001 },
  counterpartyOrder: { type: Schema.Types.ObjectId, ref: 'EnergyTradeOrder' }
}, { _id: false });

const EnergyTradeOrderSchema = new Schema<IEnergyTradeOrder>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  traderCompany: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  product: { type: String, required: true, trim: true, maxlength: 60 },
  side: { type: String, enum: ['Buy', 'Sell'], required: true },
  type: { type: String, enum: ['Limit', 'Market'], required: true },
  status: { type: String, enum: ['Open', 'PartiallyFilled', 'Filled', 'Cancelled', 'Expired'], default: 'Open' },
  price: { type: Number, required: true, min: 0 },
  quantityMWh: { type: Number, required: true, min: 0.0001 },
  fills: { type: [OrderFillSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  cancelledAt: { type: Date },
  settlementDate: { type: Date },
  comments: { type: String, trim: true, maxlength: 240 }
}, { collection: 'energytradeorders' });

EnergyTradeOrderSchema.index({ company: 1, status: 1, product: 1, createdAt: -1 });

// ------------------------- Instance Methods ---------------------------------
EnergyTradeOrderSchema.methods.getFilledVolume = function (this: IEnergyTradeOrder) {
  return this.fills.reduce((s, f) => s + f.volumeMWh, 0);
};

EnergyTradeOrderSchema.methods.getRemainingVolume = function (this: IEnergyTradeOrder) {
  return Math.max(0, this.quantityMWh - this.getFilledVolume());
};

EnergyTradeOrderSchema.methods.recordFill = async function (this: IEnergyTradeOrder, volumeMWh: number, price: number, counterpartyOrder?: Types.ObjectId) {
  if (this.status === 'Cancelled' || this.status === 'Expired') throw new Error('Cannot fill closed order');
  if (volumeMWh <= 0) throw new Error('Fill volume must be positive');
  const remaining = this.getRemainingVolume();
  if (volumeMWh > remaining) throw new Error('Fill exceeds remaining volume');
  this.fills.push({ volumeMWh, price, counterpartyOrder, fillTime: new Date() });
  const newRemaining = remaining - volumeMWh;
  if (newRemaining === 0) this.status = 'Filled'; else this.status = 'PartiallyFilled';
  return this.save();
};

EnergyTradeOrderSchema.methods.cancel = async function (this: IEnergyTradeOrder, reason?: string) {
  if (this.status === 'Filled') throw new Error('Cannot cancel filled order');
  if (this.status === 'Cancelled') return this; // idempotent
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  if (reason) this.comments = (this.comments ? this.comments + ' | ' : '') + `Cancelled: ${reason}`;
  return this.save();
};

EnergyTradeOrderSchema.methods.markExpired = async function (this: IEnergyTradeOrder) {
  if (this.status === 'Open' || this.status === 'PartiallyFilled') {
    this.status = 'Expired';
  }
  return this.save();
};

EnergyTradeOrderSchema.methods.finalizeSettlement = async function (this: IEnergyTradeOrder) {
  if (this.status !== 'Filled') throw new Error('Settlement only allowed for filled orders');
  if (!this.settlementDate) this.settlementDate = new Date();
  return this.save();
};

EnergyTradeOrderSchema.methods.isActive = function (this: IEnergyTradeOrder) {
  if (this.status === 'Cancelled' || this.status === 'Expired' || this.status === 'Filled') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

EnergyTradeOrderSchema.methods.averageFillPrice = function (this: IEnergyTradeOrder) {
  if (!this.fills.length) return 0;
  const total = this.fills.reduce((s, f) => s + f.price * f.volumeMWh, 0);
  const vol = this.getFilledVolume() || 1;
  return total / vol;
};

// ------------------------- Pre-save Hook ------------------------------------
EnergyTradeOrderSchema.pre('save', function (this: IEnergyTradeOrder, next) {
  if (this.expiresAt && this.expiresAt < this.createdAt) return next(new Error('expiresAt must be after createdAt'));
  if ((this.status === 'Open' || this.status === 'PartiallyFilled') && this.expiresAt && this.expiresAt < new Date()) {
    this.status = 'Expired';
  }
  next();
});

export const EnergyTradeOrder: Model<IEnergyTradeOrder> = mongoose.models.EnergyTradeOrder || mongoose.model<IEnergyTradeOrder>('EnergyTradeOrder', EnergyTradeOrderSchema);
export default EnergyTradeOrder;

/**
 * IMPLEMENTATION NOTES:
 * 1. Matching Engine: External logic performs order matching; model focuses on persistence & lifecycle.
 * 2. Market Orders: price field stores executed snapshot or indicative price; matching may override.
 * 3. Expiration Sweep: Future scheduled task can call markExpired() for stale open orders.
 * 4. Average Fill Price: Volume-weighted; returns 0 if no fills.
 * 5. Index hygiene: Single compound index only; company field not duplicated.
 */