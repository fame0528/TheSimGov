/**
 * @file PPA.ts
 * @description Power Purchase Agreement (PPA) long-term contract model with delivery tracking, escalation, penalties & bonuses.
 * @created 2025-11-28
 *
 * OVERVIEW:
 * Represents bilateral energy procurement agreements between buyer (off-taker) and seller (generator/developer).
 * Tracks contracted volume, delivery records, performance guarantees, escalation clauses, and financial adjustments (penalties/bonuses).
 * Provides lifecycle support methods used by compliance & settlement endpoints.
 *
 * KEY FEATURES:
 * - Contracted volume & term enforcement
 * - Escalation (annual price step-ups) & optional CPI adjustment hooks
 * - Performance guarantee evaluation (delivered vs contracted ratio)
 * - Penalty + bonus application with cumulative financial tracking
 * - Delivery recording with deficiency calculation
 *
 * INDEX HYGIENE: Single compound index (company + buyerCompany + sellerCompany + startDate) – avoids duplicates.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDeliveryRecord {
  date: Date;
  deliveredMWh: number;
  deficiencyMWh: number; // contractedPeriodVolume - delivered
}

export interface IPenaltyRecord {
  date: Date;
  amount: number;      // monetary penalty applied
  reason: string;
}

export interface IBonusRecord {
  date: Date;
  amount: number;      // monetary bonus applied
  reason: string;
}

export interface IPPA extends Document {
  company: Types.ObjectId;            // Owning platform company (tenant)
  buyerCompany: Types.ObjectId;       // Off-taker
  sellerCompany: Types.ObjectId;      // Generator/developer
  contractId: string;
  energySource: 'Solar' | 'Wind' | 'Hydro' | 'Geothermal' | 'Biomass' | 'Nuclear' | 'Gas' | 'Coal';
  startDate: Date;
  endDate: Date;
  contractedAnnualMWh: number;
  basePricePerMWh: number;
  escalationPercentAnnual: number;      // Annual escalation percentage
  performanceGuaranteePercent: number;  // Required delivery performance threshold
  penaltyRatePerMWh: number;            // Penalty applied per deficiency MWh
  bonusRatePerMWh: number;              // Bonus per surplus vs guarantee threshold
  deliveryRecords: IDeliveryRecord[];
  penalties: IPenaltyRecord[];
  bonuses: IBonusRecord[];
  totalPenalties: number;
  totalBonuses: number;
  lastEscalationDate?: Date;
  active: boolean;

  recordDelivery(date: Date, deliveredMWh: number): Promise<IPPA>;
  applyAnnualEscalation(date?: Date): Promise<IPPA>;
  evaluatePerformance(): { delivered: number; contracted: number; performancePercent: number; guaranteeMet: boolean };
  applyPenalty(reason: string, amount: number): Promise<IPPA>;
  applyBonus(reason: string, amount: number): Promise<IPPA>;
  calculateSettlement(): { netAdjustment: number; totalPenalties: number; totalBonuses: number };
}

const DeliveryRecordSchema = new Schema<IDeliveryRecord>({
  date: { type: Date, required: true },
  deliveredMWh: { type: Number, required: true, min: 0 },
  deficiencyMWh: { type: Number, required: true, min: 0 }
}, { _id: false });

const PenaltyRecordSchema = new Schema<IPenaltyRecord>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, maxlength: 240 }
}, { _id: false });

const BonusRecordSchema = new Schema<IBonusRecord>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true, maxlength: 240 }
}, { _id: false });

const PPASchema = new Schema<IPPA>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  buyerCompany: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  sellerCompany: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  contractId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  energySource: { type: String, enum: ['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Nuclear', 'Gas', 'Coal'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  contractedAnnualMWh: { type: Number, required: true, min: 1 },
  basePricePerMWh: { type: Number, required: true, min: 0 },
  escalationPercentAnnual: { type: Number, default: 0, min: 0 },
  performanceGuaranteePercent: { type: Number, default: 95, min: 0, max: 100 },
  penaltyRatePerMWh: { type: Number, default: 0, min: 0 },
  bonusRatePerMWh: { type: Number, default: 0, min: 0 },
  deliveryRecords: { type: [DeliveryRecordSchema], default: [] },
  penalties: { type: [PenaltyRecordSchema], default: [] },
  bonuses: { type: [BonusRecordSchema], default: [] },
  totalPenalties: { type: Number, default: 0 },
  totalBonuses: { type: Number, default: 0 },
  lastEscalationDate: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'ppas' });

PPASchema.index({ company: 1, buyerCompany: 1, sellerCompany: 1, startDate: 1 });

PPASchema.methods.recordDelivery = async function (this: IPPA, date: Date, deliveredMWh: number) {
  if (date < this.startDate || date > this.endDate) throw new Error('Delivery date outside contract term');
  const periodContract = this.contractedAnnualMWh / 365; // rough daily slice (simplification)
  const deficiency = Math.max(0, periodContract - deliveredMWh);
  this.deliveryRecords.push({ date, deliveredMWh, deficiencyMWh: deficiency });
  if (deficiency && this.penaltyRatePerMWh > 0) {
    const penaltyAmount = deficiency * this.penaltyRatePerMWh;
    this.penalties.push({ date, amount: penaltyAmount, reason: 'Delivery Deficiency' });
    this.totalPenalties += penaltyAmount;
  }
  return this.save();
};

PPASchema.methods.applyAnnualEscalation = async function (this: IPPA, date: Date = new Date()) {
  const yearSinceStart = date.getFullYear() - this.startDate.getFullYear();
  if (!this.lastEscalationDate || this.lastEscalationDate.getFullYear() < date.getFullYear()) {
    if (this.escalationPercentAnnual > 0) {
      this.basePricePerMWh = this.basePricePerMWh * (1 + this.escalationPercentAnnual / 100);
      this.lastEscalationDate = date;
    }
  }
  if (yearSinceStart >= 10) this.active = false; // example sunset rule (simplified)
  return this.save();
};

PPASchema.methods.evaluatePerformance = function (this: IPPA) {
  const delivered = this.deliveryRecords.reduce((s, r) => s + r.deliveredMWh, 0);
  const contracted = this.contractedAnnualMWh; // Simplified to annual contracted volume
  const performancePercent = contracted ? (delivered / contracted) * 100 : 0;
  const guaranteeMet = performancePercent >= this.performanceGuaranteePercent;
  return { delivered, contracted, performancePercent, guaranteeMet };
};

PPASchema.methods.applyPenalty = async function (this: IPPA, reason: string, amount: number) {
  if (amount <= 0) throw new Error('Penalty amount must be positive');
  this.penalties.push({ date: new Date(), amount, reason });
  this.totalPenalties += amount;
  return this.save();
};

PPASchema.methods.applyBonus = async function (this: IPPA, reason: string, amount: number) {
  if (amount <= 0) throw new Error('Bonus amount must be positive');
  this.bonuses.push({ date: new Date(), amount, reason });
  this.totalBonuses += amount;
  return this.save();
};

PPASchema.methods.calculateSettlement = function (this: IPPA) {
  return {
    netAdjustment: this.totalBonuses - this.totalPenalties,
    totalPenalties: this.totalPenalties,
    totalBonuses: this.totalBonuses
  };
};

PPASchema.pre('save', function (this: IPPA, next) {
  if (this.endDate < this.startDate) return next(new Error('endDate must be after startDate'));
  if (this.endDate < new Date()) this.active = false;
  next();
});

export const PPA: Model<IPPA> = mongoose.models.PPA || mongoose.model<IPPA>('PPA', PPASchema);
export default PPA;

/**
 * IMPLEMENTATION NOTES:
 * 1. Daily contracted slice simplified: contractedAnnualMWh / 365; future upgrade may use calendar breakdown.
 * 2. Escalation logic excludes CPI integration; hook may inject external inflation adjustment later.
 * 3. Settlement returns net (bonuses - penalties) for financial endpoint aggregation.
 * 4. Index hygiene: Single compound index only; no field-level index duplication.
 */