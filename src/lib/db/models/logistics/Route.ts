/**
 * @file src/lib/db/models/logistics/Route.ts
 * @description Logistics Route Mongoose model for transportation paths
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents routes used in logistics operations for shipments and vehicle assignments.
 * Tracks origin, destination, waypoints, distance, status, and operational metrics.
 *
 * FEATURES:
 * - Origin, destination, waypoints
 * - Distance, estimated time, and status
 * - Usage statistics and assignments
 * - CRUD operations and business logic methods
 *
 * USAGE:
 * import Route from '@/lib/db/models/logistics/Route';
 * const routes = await Route.find({ companyId, status: 'ACTIVE' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Route status
 */
export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

/**
 * Waypoint subdocument
 */
export interface IWaypoint {
  name: string;
  coordinates: string;
  arrivalEstimate: Date;
}

/**
 * Route document interface
 */
export interface IRoute extends Document {
  companyId: string;           // Owning company ID
  name: string;                // Route name/identifier
  origin: string;              // Origin location
  destination: string;         // Destination location
  waypoints: IWaypoint[];      // Waypoints along the route
  distance: number;            // Total distance (km)
  estimatedTime: number;       // Estimated time (hours)
  status: RouteStatus;         // Current status
  assignments: string[];       // Current shipment/vehicle IDs
  usageCount: number;          // Number of times used
  createdAt: Date;
  updatedAt: Date;

  // Methods
  assignToShipment(shipmentId: string): Promise<void>;
  retire(): Promise<void>;
  scheduleMaintenance(): Promise<void>;
  recordUsage(): Promise<void>;
}

/**
 * Route model interface with static methods
 */
export interface IRouteModel extends Model<IRoute> {
  getActiveRoutes(companyId: string): Promise<IRoute[]>;
  getTotalDistance(companyId: string): Promise<number>;
}

/**
 * Route schema
 */
const WaypointSchema = new Schema<IWaypoint>({
  name: { type: String, required: true, trim: true },
  coordinates: { type: String, required: true, trim: true },
  arrivalEstimate: { type: Date, required: true },
}, { _id: false });

const RouteSchema = new Schema<IRoute>({
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
  origin: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  waypoints: {
    type: [WaypointSchema],
    default: [],
  },
  distance: {
    type: Number,
    required: true,
    min: 1,
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: Object.values(RouteStatus),
    required: true,
    default: RouteStatus.INACTIVE,
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
RouteSchema.index({ status: 1 });
RouteSchema.index({ origin: 1 });
RouteSchema.index({ destination: 1 });
RouteSchema.index({ companyId: 1 });

/**
 * Instance method: Assign route to shipment
 */
RouteSchema.methods.assignToShipment = async function (shipmentId: string): Promise<void> {
  if (this.status === RouteStatus.RETIRED) {
    throw new Error('Route is retired');
  }
  if (!this.assignments.includes(shipmentId)) {
    this.assignments.push(shipmentId);
    this.status = RouteStatus.ASSIGNED;
    await this.save();
  }
};

/**
 * Instance method: Retire route
 */
RouteSchema.methods.retire = async function (): Promise<void> {
  this.status = RouteStatus.RETIRED;
  this.assignments = [];
  await this.save();
};

/**
 * Instance method: Schedule maintenance
 */
RouteSchema.methods.scheduleMaintenance = async function (): Promise<void> {
  this.status = RouteStatus.UNDER_MAINTENANCE;
  await this.save();
};

/**
 * Instance method: Record usage
 */
RouteSchema.methods.recordUsage = async function (): Promise<void> {
  this.usageCount += 1;
  if (this.status === RouteStatus.UNDER_MAINTENANCE) {
    throw new Error('Cannot record usage during maintenance');
  }
  await this.save();
};

/**
 * Static method: Get active routes for a company
 */
RouteSchema.statics.getActiveRoutes = async function (companyId: string): Promise<IRoute[]> {
  return this.find({
    companyId,
    status: RouteStatus.ACTIVE,
  }).sort({ name: 1 });
};

/**
 * Static method: Get total distance for a company
 */
RouteSchema.statics.getTotalDistance = async function (companyId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { companyId, status: RouteStatus.ACTIVE } },
    { $group: { _id: null, total: { $sum: '$distance' } } },
  ]);
  return result[0]?.total || 0;
};

// Create and export the model
const Route = mongoose.models.Route || mongoose.model<IRoute, IRouteModel>('Route', RouteSchema);

export default Route;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Origin/destination: locations
 * 2. Waypoints: array of stops
 * 3. Status: active, inactive, maintenance, assigned, retired (enum)
 * 4. Distance/estimated time: metrics
 * 5. Assignment: shipment/vehicle IDs
 * 6. CRUD: assign, retire, schedule maintenance, record usage
 * 7. Indexes: status, origin, destination, companyId
 *
 * USAGE:
 * import Route from '@/lib/db/models/logistics/Route';
 * const routes = await Route.getActiveRoutes(companyId);
 */
