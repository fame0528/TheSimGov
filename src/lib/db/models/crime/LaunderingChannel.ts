import mongoose, { Schema, Document, Model } from 'mongoose';

export type LaunderingMethod = 'Shell' | 'CashBiz' | 'Crypto' | 'TradeBased' | 'Counterfeit';

export interface ILaunderingTxn {
  amount: number;
  date: Date;
  detected: boolean;
}

export interface ILaunderingChannel extends Document {
  ownerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  method: LaunderingMethod;
  throughputCap: number; // max per time window
  feePercent: number; // service fee
  latencyDays: number; // delay before funds available
  detectionRisk: number; // 0-100 baseline risk
  transactionHistory: ILaunderingTxn[];
  createdAt: Date;
  updatedAt: Date;
}

const LaunderingTxnSchema = new Schema<ILaunderingTxn>({
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  detected: { type: Boolean, required: true, default: false }
}, { _id: false });

const LaunderingChannelSchema = new Schema<ILaunderingChannel>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  method: { type: String, enum: ['Shell','CashBiz','Crypto','TradeBased','Counterfeit'], required: true, index: true },
  throughputCap: { type: Number, required: true, min: 1 },
  feePercent: { type: Number, required: true, min: 0, max: 100 },
  latencyDays: { type: Number, required: true, min: 0 },
  detectionRisk: { type: Number, required: true, min: 0, max: 100 },
  transactionHistory: { type: [LaunderingTxnSchema], default: [] }
}, { timestamps: true });

LaunderingChannelSchema.index({ ownerId: 1, method: 1 });
LaunderingChannelSchema.index({ detectionRisk: -1 });

export const LaunderingChannel: Model<ILaunderingChannel> = mongoose.models.LaunderingChannel || mongoose.model<ILaunderingChannel>('LaunderingChannel', LaunderingChannelSchema);

export default LaunderingChannel;
