/**
 * @file src/lib/db/models/logistics/Vehicle.ts
 * @description Logistics Vehicle Mongoose model for transportation assets
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents vehicles used in logistics operations: trucks, ships, planes, trains.
 * Tracks status, capacity, assignments, maintenance, and operational metrics.
 *
 * FEATURES:
 * - Vehicle type, status, and assignment
 * - Capacity, speed, fuel, and maintenance tracking
 * - Usage statistics and downtime
 * - CRUD operations and business logic methods
 *
 * USAGE:
 * import Vehicle from '@/lib/db/models/logistics/Vehicle';
 * const vehicles = await Vehicle.find({ companyId, status: 'ACTIVE' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Vehicle types
 */
export enum VehicleType {
  TRUCK = 'TRUCK',
  SHIP = 'SHIP',
  PLANE = 'PLANE',
  TRAIN = 'TRAIN',
}

/**
 * Vehicle status
 */
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

/**
 * Vehicle document interface
 */
export interface IVehicle extends Document {
  companyId: string;           // Owning company ID
  name: string;                // Vehicle name/identifier
  type: VehicleType;           // Type of vehicle
  status: VehicleStatus;       // Current status
  capacity: number;            // Max cargo capacity (tons)
  speed: number;               // Max speed (km/h)
  fuelType: string;            // Fuel type (diesel, electric, etc.)
  fuelCapacity: number;        // Fuel tank size (liters)
  lastMaintenance: Date;       // Last maintenance date
  nextMaintenanceDue: Date;    // Next scheduled maintenance
  assignments: string[];       // Current shipment/route IDs
  usageHours: number;          // Total operational hours
  downtimeHours: number;       // Total downtime hours
  createdAt: Date;
  updatedAt: Date;

  // Methods
  assignToShipment(shipmentId: string): Promise<void>;
  retire(): Promise<void>;
  scheduleMaintenance(date: Date): Promise<void>;
  recordUsage(hours: number): Promise<void>;
  recordDowntime(hours: number): Promise<void>;
}

/**
 * Vehicle model interface with static methods
 */
export interface IVehicleModel extends Model<IVehicle> {
  getActiveVehicles(companyId: string): Promise<IVehicle[]>;
  getTotalCapacity(companyId: string): Promise<number>;
}

/**
 * Vehicle schema
 */
const VehicleSchema = new Schema<IVehicle>(
  {
    companyId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      required: true,
      default: VehicleStatus.IDLE,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    speed: {
      type: Number,
      required: true,
      min: 1,
    },
    fuelType: {
      type: String,
      required: true,
      trim: true,
    },
    fuelCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    lastMaintenance: {
      type: Date,
      required: true,
      default: Date.now,
    },
    nextMaintenanceDue: {
      type: Date,
      required: true,
      default: Date.now,
    },
    assignments: {
      type: [String],
      default: [],
    },
    usageHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    downtimeHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ companyId: 1 });
VehicleSchema.index({ nextMaintenanceDue: 1 });

/**
 * Instance method: Assign vehicle to shipment
 */
VehicleSchema.methods.assignToShipment = async function (shipmentId: string): Promise<void> {
  if (this.status === VehicleStatus.RETIRED) {
    throw new Error('Vehicle is retired');
  }
  if (!this.assignments.includes(shipmentId)) {
    this.assignments.push(shipmentId);
    this.status = VehicleStatus.ASSIGNED;
    await this.save();
  }
};

/**
 * Instance method: Retire vehicle
 */
VehicleSchema.methods.retire = async function (): Promise<void> {
  this.status = VehicleStatus.RETIRED;
  this.assignments = [];
  await this.save();
};

/**
 * Instance method: Schedule maintenance
 */
VehicleSchema.methods.scheduleMaintenance = async function (date: Date): Promise<void> {
  this.nextMaintenanceDue = date;
  this.status = VehicleStatus.IN_MAINTENANCE;
  await this.save();
};

/**
 * Instance method: Record usage hours
 */
VehicleSchema.methods.recordUsage = async function (hours: number): Promise<void> {
  this.usageHours += hours;
  if (this.status === VehicleStatus.IN_MAINTENANCE) {
    throw new Error('Cannot record usage during maintenance');
  }
  await this.save();
};

/**
 * Instance method: Record downtime hours
 */
VehicleSchema.methods.recordDowntime = async function (hours: number): Promise<void> {
  this.downtimeHours += hours;
  await this.save();
};

/**
 * Static method: Get active vehicles for a company
 */
VehicleSchema.statics.getActiveVehicles = async function (companyId: string): Promise<IVehicle[]> {
  return this.find({
    companyId,
    status: VehicleStatus.ACTIVE,
  }).sort({ name: 1 });
};

/**
 * Static method: Get total capacity for a company
 */
VehicleSchema.statics.getTotalCapacity = async function (companyId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { companyId, status: VehicleStatus.ACTIVE } },
    { $group: { _id: null, total: { $sum: '$capacity' } } },
  ]);
  return result[0]?.total || 0;
};

// Create and export the model
const Vehicle = mongoose.models.Vehicle || mongoose.model<IVehicle, IVehicleModel>('Vehicle', VehicleSchema);

export default Vehicle;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Vehicle types: truck, ship, plane, train (enum)
 * 2. Status: active, maintenance, idle, assigned, retired (enum)
 * 3. Assignment: shipment/route IDs
 * 4. Maintenance: last/next dates, status
 * 5. Usage/downtime: operational metrics
 * 6. CRUD: assign, retire, schedule maintenance, record usage/downtime
 * 7. Indexes: status, type, companyId, nextMaintenanceDue
 *
 * USAGE:
 * import Vehicle from '@/lib/db/models/logistics/Vehicle';
 * const vehicles = await Vehicle.getActiveVehicles(companyId);
 */
