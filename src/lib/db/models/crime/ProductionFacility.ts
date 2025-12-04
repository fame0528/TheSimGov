import mongoose, { Schema, Document, Model } from 'mongoose';

export type FacilityType = 'Lab' | 'Farm' | 'Warehouse';
export type FacilityStatus = 'Active' | 'Raided' | 'Abandoned' | 'Seized' | 'Converted';

export interface IFacilityInventoryItem {
  substance: string; // validated by catalog elsewhere
  quantity: number; // units
  purity: number; // 0-100
  batch: string;
  createdAt?: Date;
}

export interface IFacilityUpgrade {
  type: string; // e.g. 'Equipment' | 'Security' | 'Automation'
  level: number; // 1+
  installed: Date;
}

export interface IProductionFacility extends Document {
  ownerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  type: FacilityType;
  location: { state: string; city: string };
  capacity: number; // units per production cycle
  quality: number; // influences purity (0-100)
  suspicionLevel: number; // 0-100 risk of raid
  status: FacilityStatus;
  upgrades: IFacilityUpgrade[];
  employees: { userId: mongoose.Types.ObjectId; role: string; skill?: number }[];
  inventory: IFacilityInventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const FacilityUpgradeSchema = new Schema<IFacilityUpgrade>({
  type: { type: String, required: true },
  level: { type: Number, required: true, min: 1 },
  installed: { type: Date, required: true, default: Date.now }
}, { _id: false });

const FacilityInventorySchema = new Schema<IFacilityInventoryItem>({
  substance: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  purity: { type: Number, required: true, min: 0, max: 100 },
  batch: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ProductionFacilitySchema = new Schema<IProductionFacility>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  type: { type: String, enum: ['Lab','Farm','Warehouse'], required: true, index: true },
  location: {
    state: { type: String, required: true, index: true },
    city: { type: String, required: true }
  },
  capacity: { type: Number, required: true, min: 1 },
  quality: { type: Number, required: true, min: 0, max: 100 },
  suspicionLevel: { type: Number, required: true, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ['Active','Raided','Abandoned','Seized','Converted'], required: true, default: 'Active', index: true },
  upgrades: { type: [FacilityUpgradeSchema], default: [] },
  employees: { type: [{ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, role: { type: String, required: true }, skill: { type: Number, min: 0, max: 100 } }], default: [] },
  inventory: { type: [FacilityInventorySchema], default: [] }
}, { timestamps: true });

// Compound indexes (avoid field-level duplicates)
ProductionFacilitySchema.index({ ownerId: 1, status: 1 });
ProductionFacilitySchema.index({ 'location.state': 1, type: 1 });

export const ProductionFacility: Model<IProductionFacility> = mongoose.models.ProductionFacility || mongoose.model<IProductionFacility>('ProductionFacility', ProductionFacilitySchema);

export default ProductionFacility;
