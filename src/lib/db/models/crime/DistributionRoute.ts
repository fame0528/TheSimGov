import mongoose, { Schema, Document, Model } from 'mongoose';

export type RouteMethod = 'Road' | 'Air' | 'Rail' | 'Courier';
export type RouteStatus = 'Active' | 'Suspended' | 'Interdicted';

export interface IDistributionRoute extends Document {
  ownerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  method: RouteMethod;
  capacity: number; // units per shipment
  cost: number; // base cost
  speed: number; // hours duration
  riskScore: number; // seizure probability proxy 0-100
  status: RouteStatus;
  shipments: { id: string; quantity: number; status: string; eta?: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema({
  id: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, required: true },
  eta: { type: Date }
}, { _id: false });

const DistributionRouteSchema = new Schema<IDistributionRoute>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  origin: { state: { type: String, required: true }, city: { type: String, required: true } },
  destination: { state: { type: String, required: true }, city: { type: String, required: true } },
  method: { type: String, enum: ['Road','Air','Rail','Courier'], required: true },
  capacity: { type: Number, required: true, min: 1 },
  cost: { type: Number, required: true, min: 0 },
  speed: { type: Number, required: true, min: 1 },
  riskScore: { type: Number, required: true, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ['Active','Suspended','Interdicted'], required: true, default: 'Active' },
  shipments: { type: [ShipmentSchema], default: [] }
}, { timestamps: true });

DistributionRouteSchema.index({ ownerId: 1, status: 1 });
DistributionRouteSchema.index({ 'origin.state': 1, 'destination.state': 1 });

export const DistributionRoute: Model<IDistributionRoute> = mongoose.models.DistributionRoute || mongoose.model<IDistributionRoute>('DistributionRoute', DistributionRouteSchema);

export default DistributionRoute;
