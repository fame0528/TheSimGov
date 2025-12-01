import mongoose, { Schema, Document, Model } from 'mongoose';

export type HeatScope = 'Global' | 'State' | 'City' | 'User' | 'Gang';

export interface IHeatFactor {
  source: string;
  delta: number; // applied change
  decay: number; // decay rate per tick
}

export interface IHeatLevel extends Document {
  scope: HeatScope;
  scopeId: string; // could be state code, city key, userId, gangId
  current: number; // 0-100
  factors: IHeatFactor[];
  thresholds: { raid: number; investigation: number; surveillance: number };
  lastDecay: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HeatFactorSchema = new Schema<IHeatFactor>({
  source: { type: String, required: true },
  delta: { type: Number, required: true },
  decay: { type: Number, required: true }
}, { _id: false });

const HeatLevelSchema = new Schema<IHeatLevel>({
  scope: { type: String, enum: ['Global','State','City','User','Gang'], required: true, index: true },
  scopeId: { type: String, required: true, index: true },
  current: { type: Number, required: true, min: 0, max: 100 },
  factors: { type: [HeatFactorSchema], default: [] },
  thresholds: { raid: { type: Number, required: true, default: 80 }, investigation: { type: Number, required: true, default: 60 }, surveillance: { type: Number, required: true, default: 40 } },
  lastDecay: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

HeatLevelSchema.index({ scope: 1, scopeId: 1 });
HeatLevelSchema.index({ current: -1 });

export const HeatLevel: Model<IHeatLevel> = mongoose.models.HeatLevel || mongoose.model<IHeatLevel>('HeatLevel', HeatLevelSchema);

export default HeatLevel;
