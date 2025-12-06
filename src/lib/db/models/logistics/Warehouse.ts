/**
 * @file src/lib/db/models/logistics/Warehouse.ts
 * @description Logistics Warehouse Mongoose model for storage facilities
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Represents warehouses used in logistics operations for storage and inventory management.
 * Tracks location, capacity, inventory, status, assignments, and operational metrics.
 *
 * FEATURES:
 * - Location, status, and assignment
 * - Capacity, inventory, and utilization tracking
 * - Usage statistics and downtime
 * - CRUD operations and business logic methods
 *
 * USAGE:
 * import Warehouse from '@/lib/db/models/logistics/Warehouse';
 * const warehouses = await Warehouse.find({ companyId, status: 'ACTIVE' });
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Warehouse status
 */
export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  IDLE = 'IDLE',
  ASSIGNED = 'ASSIGNED',
  RETIRED = 'RETIRED',
}

/**
 * Inventory item subdocument
 */
export interface IInventoryItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  lastUpdated: Date;
}

/**
 * Warehouse document interface
 */
export interface IWarehouse extends Document {
  companyId: string;           // Owning company ID
  name: string;                // Warehouse name/identifier
  location: string;            // Address or coordinates
  status: WarehouseStatus;     // Current status
  capacity: number;            // Max storage capacity (tons)
  utilization: number;         // Current utilization (%)
  inventory: IInventoryItem[]; // Inventory items
  assignments: string[];       // Current shipment/contract IDs
  usageHours: number;          // Total operational hours
  downtimeHours: number;       // Total downtime hours
  createdAt: Date;
  updatedAt: Date;

  // Methods
  assignToContract(contractId: string): Promise<void>;
  retire(): Promise<void>;
  scheduleMaintenance(date: Date): Promise<void>;
  recordUsage(hours: number): Promise<void>;
  recordDowntime(hours: number): Promise<void>;
  addInventoryItem(item: IInventoryItem): Promise<void>;
  updateInventoryItem(sku: string, quantity: number): Promise<void>;
}

/**
 * Warehouse model interface with static methods
 */
export interface IWarehouseModel extends Model<IWarehouse> {
  getActiveWarehouses(companyId: string): Promise<IWarehouse[]>;
  getTotalCapacity(companyId: string): Promise<number>;
}

/**
 * Warehouse schema
 */
const InventoryItemSchema = new Schema<IInventoryItem>({
  sku: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  lastUpdated: { type: Date, required: true, default: Date.now },
}, { _id: false });

const WarehouseSchema = new Schema<IWarehouse>({
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
  location: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(WarehouseStatus),
    required: true,
    default: WarehouseStatus.IDLE,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  utilization: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
  },
  inventory: {
    type: [InventoryItemSchema],
    default: [],
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
}, {
  timestamps: true,
});

/**
 * Indexes
 */
WarehouseSchema.index({ status: 1 });
WarehouseSchema.index({ location: 1 });
WarehouseSchema.index({ companyId: 1 });

/**
 * Instance method: Assign warehouse to contract
 */
WarehouseSchema.methods.assignToContract = async function (contractId: string): Promise<void> {
  if (this.status === WarehouseStatus.RETIRED) {
    throw new Error('Warehouse is retired');
  }
  if (!this.assignments.includes(contractId)) {
    this.assignments.push(contractId);
    this.status = WarehouseStatus.ASSIGNED;
    await this.save();
  }
};

/**
 * Instance method: Retire warehouse
 */
WarehouseSchema.methods.retire = async function (): Promise<void> {
  this.status = WarehouseStatus.RETIRED;
  this.assignments = [];
  await this.save();
};

/**
 * Instance method: Schedule maintenance
 */
WarehouseSchema.methods.scheduleMaintenance = async function (date: Date): Promise<void> {
  this.status = WarehouseStatus.IN_MAINTENANCE;
  await this.save();
};

/**
 * Instance method: Record usage hours
 */
WarehouseSchema.methods.recordUsage = async function (hours: number): Promise<void> {
  this.usageHours += hours;
  if (this.status === WarehouseStatus.IN_MAINTENANCE) {
    throw new Error('Cannot record usage during maintenance');
  }
  await this.save();
};

/**
 * Instance method: Record downtime hours
 */
WarehouseSchema.methods.recordDowntime = async function (hours: number): Promise<void> {
  this.downtimeHours += hours;
  await this.save();
};

/**
 * Instance method: Add inventory item
 */
WarehouseSchema.methods.addInventoryItem = async function (item: IInventoryItem): Promise<void> {
  const exists = this.inventory.find((i: IInventoryItem) => i.sku === item.sku);
  if (exists) {
    throw new Error('Item already exists');
  }
  this.inventory.push(item);
  this.utilization = Math.min(100, this.utilization + (item.quantity / this.capacity) * 100);
  await this.save();
};

/**
 * Instance method: Update inventory item quantity
 */
WarehouseSchema.methods.updateInventoryItem = async function (sku: string, quantity: number): Promise<void> {
  const item = this.inventory.find((i: IInventoryItem) => i.sku === sku);
  if (!item) {
    throw new Error('Item not found');
  }
  item.quantity = quantity;
  item.lastUpdated = new Date();
  this.utilization = Math.min(100, this.inventory.reduce((sum: number, i: IInventoryItem) => sum + i.quantity, 0) / this.capacity * 100);
  await this.save();
};

/**
 * Static method: Get active warehouses for a company
 */
WarehouseSchema.statics.getActiveWarehouses = async function (companyId: string): Promise<IWarehouse[]> {
  return this.find({
    companyId,
    status: WarehouseStatus.ACTIVE,
  }).sort({ name: 1 });
};

/**
 * Static method: Get total capacity for a company
 */
WarehouseSchema.statics.getTotalCapacity = async function (companyId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { companyId, status: WarehouseStatus.ACTIVE } },
    { $group: { _id: null, total: { $sum: '$capacity' } } },
  ]);
  return result[0]?.total || 0;
};

// Create and export the model
const Warehouse = mongoose.models.Warehouse || mongoose.model<IWarehouse, IWarehouseModel>('Warehouse', WarehouseSchema);

export default Warehouse;

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Location: address/coordinates
 * 2. Status: active, maintenance, idle, assigned, retired (enum)
 * 3. Inventory: array of items (sku, name, quantity, unit)
 * 4. Capacity/utilization: storage metrics
 * 5. Assignment: shipment/contract IDs
 * 6. CRUD: assign, retire, schedule maintenance, record usage/downtime, add/update inventory
 * 7. Indexes: status, location, companyId
 *
 * USAGE:
 * import Warehouse from '@/lib/db/models/logistics/Warehouse';
 * const warehouses = await Warehouse.getActiveWarehouses(companyId);
 */
