/**
 * @file src/lib/db/models/logistics/Shipment.ts
 * @description Logistics Shipment Mongoose model for shipment tracking
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents shipments managed by logistics companies, linking contracts, vehicles, and routes.
 * Tracks status, progress, tracking info, assignments, and operational metrics.
 *
 * FEATURES:
 * - Contract, vehicle, route linkage
 * - Status, progress, and tracking
 * - Usage statistics and CRUD operations
 * - Business logic methods
 *
 * USAGE:
 * import Shipment from '@/lib/db/models/logistics/Shipment';
 * const shipments = await Shipment.find({ companyId, status: 'IN_TRANSIT' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Shipment status
 */
export enum ShipmentStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
}

/**
 * Tracking info subdocument
 */
export interface ITrackingInfo {
  location: string;
  timestamp: Date;
  status: ShipmentStatus;
  notes?: string;
}

/**
 * Shipment document interface
 */
export interface IShipment extends Document {
  companyId: string;           // Owning company ID
  contractId: string;          // Linked shipping contract
  vehicleId: string;           // Assigned vehicle
  routeId: string;             // Assigned route
  status: ShipmentStatus;      // Current status
  progress: number;            // Progress percentage (0-100)
  tracking: ITrackingInfo[];   // Tracking info history
  assignments: string[];       // Related assignment IDs
  usageCount: number;          // Number of updates
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateStatus(status: ShipmentStatus, location: string, notes?: string): Promise<void>;
  markDelivered(): Promise<void>;
  cancel(): Promise<void>;
  recordUsage(): Promise<void>;
}

/**
 * Shipment model interface with static methods
 */
export interface IShipmentModel extends Model<IShipment> {
  getActiveShipments(companyId: string): Promise<IShipment[]>;
  getTotalDelivered(companyId: string): Promise<number>;
}

/**
 * Shipment schema
 */
const TrackingInfoSchema = new Schema<ITrackingInfo>({
  location: { type: String, required: true, trim: true },
  timestamp: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: Object.values(ShipmentStatus) },
  notes: { type: String, trim: true },
}, { _id: false });

const ShipmentSchema = new Schema<IShipment>({
  companyId: {
    type: String,
    required: true,
  },
  contractId: {
    type: String,
    required: true,
  },
  vehicleId: {
    type: String,
    required: true,
  },
  routeId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(ShipmentStatus),
    required: true,
    default: ShipmentStatus.PENDING,
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
  },
  tracking: {
    type: [TrackingInfoSchema],
    default: [],
  },
  assignments: {
    type: [String],
    default: [],
  },
  usageCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ companyId: 1 });
ShipmentSchema.index({ contractId: 1 });
ShipmentSchema.index({ vehicleId: 1 });
ShipmentSchema.index({ routeId: 1 });

/**
 * Instance method: Update shipment status
 */
ShipmentSchema.methods.updateStatus = async function (status: ShipmentStatus, location: string, notes?: string): Promise<void> {
  this.status = status;
  this.tracking.push({ location, timestamp: new Date(), status, notes });
  if (status === ShipmentStatus.DELIVERED) {
    this.progress = 100;
  }
  await this.save();
};

/**
 * Instance method: Mark shipment as delivered
 */
ShipmentSchema.methods.markDelivered = async function (): Promise<void> {
  this.status = ShipmentStatus.DELIVERED;
  this.progress = 100;
  this.tracking.push({ location: 'Destination', timestamp: new Date(), status: ShipmentStatus.DELIVERED });
  await this.save();
};

/**
 * Instance method: Cancel shipment
 */
ShipmentSchema.methods.cancel = async function (): Promise<void> {
  this.status = ShipmentStatus.CANCELLED;
  await this.save();
};

/**
 * Instance method: Record usage
 */
ShipmentSchema.methods.recordUsage = async function (): Promise<void> {
  this.usageCount += 1;
  await this.save();
};

/**
 * Static method: Get active shipments for a company
 */
ShipmentSchema.statics.getActiveShipments = async function (companyId: string): Promise<IShipment[]> {
  return this.find({
    companyId,
    status: { $in: [ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT] },
  }).sort({ createdAt: -1 });
};

/**
 * Static method: Get total delivered shipments for a company
 */
ShipmentSchema.statics.getTotalDelivered = async function (companyId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { companyId, status: ShipmentStatus.DELIVERED } },
    { $group: { _id: null, total: { $sum: 1 } } },
  ]);
  return result[0]?.total || 0;
};

// Create and export the model
const Shipment = mongoose.models.Shipment || mongoose.model<IShipment, IShipmentModel>('Shipment', ShipmentSchema);

export default Shipment;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Contract/vehicle/route linkage
 * 2. Status: pending, in transit, delivered, cancelled, delayed (enum)
 * 3. Progress/tracking: percentage, history
 * 4. CRUD: update status, mark delivered, cancel, record usage
 * 5. Indexes: status, companyId, contractId, vehicleId, routeId
 *
 * USAGE:
 * import Shipment from '@/lib/db/models/logistics/Shipment';
 * const shipments = await Shipment.getActiveShipments(companyId);
 */
