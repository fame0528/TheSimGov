/**
 * @file src/lib/db/models/Inventory.ts
 * @description Inventory Mongoose schema for materials and products tracking
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Inventory model for tracking raw materials, work-in-progress (WIP), and finished goods
 * across multiple facilities and warehouses. Supports FIFO/LIFO/JIT inventory methods,
 * reorder point automation, ABC analysis, and lot/batch traceability.
 * 
 * SCHEMA FIELDS:
 * Core:
 * - company: Reference to Company document (required, indexed)
 * - facility: Reference to ManufacturingFacility (optional, for facility-specific inventory)
 * - itemType: Inventory category (RawMaterial, WIP, FinishedGoods, Packaging, Tooling, MRO)
 * - sku: Stock Keeping Unit identifier (unique per company)
 * - name: Item name/description
 * - category: Item category (Electronics, Metals, Chemicals, etc.)
 * - uom: Unit of Measure (ea, lb, kg, gal, m, ft)
 * 
 * Quantity & Location:
 * - quantityOnHand: Current inventory quantity
 * - quantityAvailable: On-hand minus reserved/allocated
 * - quantityReserved: Reserved for production orders
 * - quantityOnOrder: Inbound from suppliers
 * - location: Storage location (Warehouse A, Bin 12-C, etc.)
 * - warehouseZone: Zone identifier (Receiving, Storage, Staging, Shipping)
 * 
 * Inventory Method:
 * - inventoryMethod: FIFO, LIFO, JIT, WeightedAverage
 * - lot Tracking: Whether lot/batch tracking enabled
 * - serialTracking: Whether serial number tracking enabled
 * - expirationTracking: Whether expiration date tracking enabled
 * - shelfLife: Days until expiration (for perishables)
 * 
 * Costing:
 * - unitCost: Cost per unit (current)
 * - averageCost: Weighted average cost
 * - lastPurchaseCost: Most recent purchase price
 * - standardCost: Standard/target cost
 * - totalValue: Quantity × Unit cost
 * - valuationMethod: FIFO, LIFO, Average, Standard
 * 
 * Reorder Management:
 * - reorderPoint: Quantity triggering reorder
 * - reorderQuantity: Amount to order (EOQ)
 * - safetyStock: Buffer inventory level
 * - leadTimeDays: Supplier lead time (days)
 * - minQuantity: Minimum stock level (safety + lead time demand)
 * - maxQuantity: Maximum stock level (storage capacity)
 * - autoReorderEnabled: Automatic PO generation
 * 
 * ABC Analysis:
 * - abcClassification: A (high value), B (medium), C (low value)
 * - annualUsage: Units consumed per year
 * - annualValue: Annual usage × Unit cost
 * - turnoverRate: Annual usage / Average inventory
 * - daysOnHand: Current inventory / Daily usage
 * 
 * Quality & Compliance:
 * - qualityStatus: Approved, Quarantine, Rejected, Pending
 * - lastInspectionDate: Most recent QC inspection
 * - certificationRequired: Compliance certifications needed
 * - hazardousMaterial: OSHA/DOT hazmat classification
 * - storageRequirements: Temperature, humidity, special handling
 * 
 * Supplier:
 * - preferredSupplier: Primary supplier reference
 * - alternateSuppliers: Backup supplier references
 * - lastPurchaseDate: Most recent purchase date
 * - lastReceiptDate: Most recent goods receipt
 * 
 * Usage Tracking:
 * - consumed30Days: Units consumed last 30 days
 * - consumed90Days: Units consumed last 90 days
 * - consumedYTD: Units consumed year-to-date
 * - averageDailyUsage: Rolling average consumption
 * - forecastedUsage: Predicted monthly demand
 * 
 * Adjustments:
 * - lastCycleCountDate: Last physical count
 * - cycleCountFrequency: Count frequency (Daily, Weekly, Monthly, Quarterly)
 * - varianceCount: Number of count discrepancies (YTD)
 * - shrinkage: Inventory loss/theft (%)
 * - obsolete: Whether item is obsolete
 * - obsolescenceRisk: Risk of obsolescence (0-100)
 * 
 * USAGE:
 * ```typescript
 * import Inventory from '@/lib/db/models/Inventory';
 * 
 * // Create inventory item
 * const item = await Inventory.create({
 *   company: companyId,
 *   facility: facilityId,
 *   itemType: 'RawMaterial',
 *   sku: 'RM-STEEL-001',
 *   name: 'Steel Sheet - 4x8ft',
 *   category: 'Metals',
 *   uom: 'ea',
 *   quantityOnHand: 500,
 *   unitCost: 125.50,
 *   reorderPoint: 100,
 *   reorderQuantity: 250
 * });
 * 
 * // Find low-stock items
 * const lowStock = await Inventory.find({
 *   company: companyId,
 *   quantityAvailable: { $lte: '$reorderPoint' },
 *   autoReorderEnabled: true
 * });
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - FIFO (First In First Out): Oldest inventory consumed first (perishables, dated goods)
 * - LIFO (Last In First Out): Newest inventory consumed first (tax benefit in rising prices)
 * - JIT (Just In Time): Minimal inventory, frequent deliveries (reduce carrying costs)
 * - Weighted Average: Average cost of all units in inventory
 * - Reorder point = (Average daily usage × Lead time) + Safety stock
 * - Economic Order Quantity (EOQ) = √(2 × Annual demand × Ordering cost / Holding cost)
 * - Safety stock = Z-score × √Lead time × Demand standard deviation
 * - ABC Classification: A (top 20% by value, 80% of total), B (30%, 15%), C (50%, 5%)
 * - Inventory turnover = Cost of goods sold / Average inventory value (target: 4-8x/year)
 * - Days on hand = 365 / Inventory turnover (target: 45-90 days)
 * - Cycle counting: A items (monthly), B items (quarterly), C items (annually)
 * - Shrinkage causes: Theft, damage, spoilage, administrative error (target < 2%)
 * - Obsolescence risk: Slow-moving (> 180 days), technology changes, product discontinuation
 * - Quality status: Approved (ready for use), Quarantine (pending inspection), Rejected (scrap)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Item types
 */
export type ItemType =
  | 'RawMaterial'     // Raw materials for production
  | 'WIP'             // Work-in-progress inventory
  | 'FinishedGoods'   // Completed products
  | 'Packaging'       // Packaging materials
  | 'Tooling'         // Tools, dies, molds
  | 'MRO';            // Maintenance, Repair, Operations supplies

/**
 * Inventory methods
 */
export type InventoryMethod =
  | 'FIFO'            // First In First Out
  | 'LIFO'            // Last In First Out
  | 'JIT'             // Just In Time
  | 'WeightedAverage'; // Weighted average cost

/**
 * Valuation methods
 */
export type ValuationMethod =
  | 'FIFO'
  | 'LIFO'
  | 'Average'
  | 'Standard';

/**
 * Quality status
 */
export type QualityStatus =
  | 'Approved'        // Ready for use
  | 'Quarantine'      // Pending inspection
  | 'Rejected'        // Failed QC
  | 'Pending';        // Awaiting decision

/**
 * ABC classification
 */
export type ABCClassification =
  | 'A'               // High value (80% of value, 20% of items)
  | 'B'               // Medium value (15% of value, 30% of items)
  | 'C';              // Low value (5% of value, 50% of items)

/**
 * Cycle count frequency
 */
export type CycleCountFrequency =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annually';

/**
 * Inventory document interface
 * 
 * @interface IInventory
 * @extends {Document}
 */
export interface IInventory extends Document {
  // Core
  company: Types.ObjectId;
  facility?: Types.ObjectId;
  itemType: ItemType;
  sku: string;
  name: string;
  category: string;
  uom: string;

  // Quantity & Location
  quantityOnHand: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityOnOrder: number;
  location: string;
  warehouseZone: string;

  // Inventory Method
  inventoryMethod: InventoryMethod;
  lotTracking: boolean;
  serialTracking: boolean;
  expirationTracking: boolean;
  shelfLife: number;

  // Costing
  unitCost: number;
  averageCost: number;
  lastPurchaseCost: number;
  standardCost: number;
  totalValue: number;
  valuationMethod: ValuationMethod;

  // Reorder Management
  reorderPoint: number;
  reorderQuantity: number;
  safetyStock: number;
  leadTimeDays: number;
  minQuantity: number;
  maxQuantity: number;
  autoReorderEnabled: boolean;

  // ABC Analysis
  abcClassification: ABCClassification;
  annualUsage: number;
  annualValue: number;
  turnoverRate: number;
  daysOnHand: number;

  // Quality & Compliance
  qualityStatus: QualityStatus;
  lastInspectionDate?: Date;
  certificationRequired: string[];
  hazardousMaterial: boolean;
  storageRequirements: string;

  // Supplier
  preferredSupplier?: Types.ObjectId;
  alternateSuppliers: Types.ObjectId[];
  lastPurchaseDate?: Date;
  lastReceiptDate?: Date;

  // Usage Tracking
  consumed30Days: number;
  consumed90Days: number;
  consumedYTD: number;
  averageDailyUsage: number;
  forecastedUsage: number;

  // Adjustments
  lastCycleCountDate?: Date;
  cycleCountFrequency: CycleCountFrequency;
  varianceCount: number;
  shrinkage: number;
  obsolete: boolean;
  obsolescenceRisk: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  stockStatus: string;
  needsReorder: boolean;
  stockHealth: string;
  turnoverHealth: string;
}

/**
 * Inventory schema definition
 */
const InventorySchema = new Schema<IInventory>(
  {
    // Core
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'ManufacturingFacility',
      default: null,
      index: true,
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: {
        values: ['RawMaterial', 'WIP', 'FinishedGoods', 'Packaging', 'Tooling', 'MRO'],
        message: '{VALUE} is not a valid item type',
      },
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'SKU must be at least 3 characters'],
      maxlength: [50, 'SKU cannot exceed 50 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [150, 'Item name cannot exceed 150 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      index: true,
    },
    uom: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'UOM cannot exceed 10 characters'],
    },

    // Quantity & Location
    quantityOnHand: {
      type: Number,
      required: [true, 'Quantity on hand is required'],
      default: 0,
      min: [0, 'Quantity on hand cannot be negative'],
    },
    quantityAvailable: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity available cannot be negative'],
    },
    quantityReserved: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity reserved cannot be negative'],
    },
    quantityOnOrder: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity on order cannot be negative'],
    },
    location: {
      type: String,
      required: true,
      default: 'Main Warehouse',
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    warehouseZone: {
      type: String,
      required: true,
      default: 'Storage',
      trim: true,
      maxlength: [50, 'Warehouse zone cannot exceed 50 characters'],
    },

    // Inventory Method
    inventoryMethod: {
      type: String,
      required: true,
      enum: {
        values: ['FIFO', 'LIFO', 'JIT', 'WeightedAverage'],
        message: '{VALUE} is not a valid inventory method',
      },
      default: 'FIFO',
    },
    lotTracking: {
      type: Boolean,
      required: true,
      default: false,
    },
    serialTracking: {
      type: Boolean,
      required: true,
      default: false,
    },
    expirationTracking: {
      type: Boolean,
      required: true,
      default: false,
    },
    shelfLife: {
      type: Number,
      required: true,
      default: 365, // 1 year default
      min: [1, 'Shelf life must be at least 1 day'],
    },

    // Costing
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    averageCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average cost cannot be negative'],
    },
    lastPurchaseCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Last purchase cost cannot be negative'],
    },
    standardCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Standard cost cannot be negative'],
    },
    totalValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total value cannot be negative'],
    },
    valuationMethod: {
      type: String,
      required: true,
      enum: {
        values: ['FIFO', 'LIFO', 'Average', 'Standard'],
        message: '{VALUE} is not a valid valuation method',
      },
      default: 'FIFO',
    },

    // Reorder Management
    reorderPoint: {
      type: Number,
      required: [true, 'Reorder point is required'],
      min: [0, 'Reorder point cannot be negative'],
    },
    reorderQuantity: {
      type: Number,
      required: [true, 'Reorder quantity is required'],
      min: [1, 'Reorder quantity must be at least 1'],
    },
    safetyStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Safety stock cannot be negative'],
    },
    leadTimeDays: {
      type: Number,
      required: true,
      default: 14, // 2 weeks default
      min: [1, 'Lead time must be at least 1 day'],
      max: [365, 'Lead time cannot exceed 365 days'],
    },
    minQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Min quantity cannot be negative'],
    },
    maxQuantity: {
      type: Number,
      required: true,
      default: 10000,
      min: [1, 'Max quantity must be at least 1'],
    },
    autoReorderEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },

    // ABC Analysis
    abcClassification: {
      type: String,
      required: true,
      enum: {
        values: ['A', 'B', 'C'],
        message: '{VALUE} is not a valid ABC classification',
      },
      default: 'C',
      index: true,
    },
    annualUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Annual usage cannot be negative'],
    },
    annualValue: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Annual value cannot be negative'],
    },
    turnoverRate: {
      type: Number,
      required: true,
      default: 4, // 4 turns/year
      min: [0, 'Turnover rate cannot be negative'],
    },
    daysOnHand: {
      type: Number,
      required: true,
      default: 90, // 90 days
      min: [0, 'Days on hand cannot be negative'],
    },

    // Quality & Compliance
    qualityStatus: {
      type: String,
      required: true,
      enum: {
        values: ['Approved', 'Quarantine', 'Rejected', 'Pending'],
        message: '{VALUE} is not a valid quality status',
      },
      default: 'Approved',
      index: true,
    },
    lastInspectionDate: {
      type: Date,
      default: null,
    },
    certificationRequired: {
      type: [String],
      default: [],
    },
    hazardousMaterial: {
      type: Boolean,
      required: true,
      default: false,
    },
    storageRequirements: {
      type: String,
      default: 'Standard',
      trim: true,
      maxlength: [200, 'Storage requirements cannot exceed 200 characters'],
    },

    // Supplier
    preferredSupplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    alternateSuppliers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Supplier' }],
      default: [],
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    lastReceiptDate: {
      type: Date,
      default: null,
    },

    // Usage Tracking
    consumed30Days: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Consumed 30 days cannot be negative'],
    },
    consumed90Days: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Consumed 90 days cannot be negative'],
    },
    consumedYTD: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Consumed YTD cannot be negative'],
    },
    averageDailyUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Average daily usage cannot be negative'],
    },
    forecastedUsage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Forecasted usage cannot be negative'],
    },

    // Adjustments
    lastCycleCountDate: {
      type: Date,
      default: null,
    },
    cycleCountFrequency: {
      type: String,
      required: true,
      enum: {
        values: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
        message: '{VALUE} is not a valid cycle count frequency',
      },
      default: 'Quarterly',
    },
    varianceCount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Variance count cannot be negative'],
    },
    shrinkage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Shrinkage cannot be negative'],
      max: [100, 'Shrinkage cannot exceed 100%'],
    },
    obsolete: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    obsolescenceRisk: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Obsolescence risk cannot be negative'],
      max: [100, 'Obsolescence risk cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'inventory',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for query optimization
 */
InventorySchema.index({ company: 1, sku: 1 }, { unique: true }); // Unique SKU per company
InventorySchema.index({ company: 1, itemType: 1 }); // Type filtering
InventorySchema.index({ company: 1, abcClassification: 1 }); // ABC reporting
InventorySchema.index({ company: 1, qualityStatus: 1 }); // Quality filter
InventorySchema.index({ quantityAvailable: 1, reorderPoint: 1 }); // Reorder alerts

/**
 * Virtual field: stockStatus
 */
InventorySchema.virtual('stockStatus').get(function (this: IInventory): string {
  if (this.quantityAvailable === 0) return 'Out of Stock';
  if (this.quantityAvailable <= this.reorderPoint) return 'Low Stock';
  if (this.quantityAvailable <= this.safetyStock) return 'Critical';
  if (this.quantityAvailable >= this.maxQuantity) return 'Overstock';
  return 'Normal';
});

/**
 * Virtual field: needsReorder
 */
InventorySchema.virtual('needsReorder').get(function (this: IInventory): boolean {
  return this.quantityAvailable <= this.reorderPoint && this.autoReorderEnabled;
});

/**
 * Virtual field: stockHealth
 */
InventorySchema.virtual('stockHealth').get(function (this: IInventory): string {
  const stockRatio = this.quantityAvailable / this.maxQuantity;
  if (stockRatio < 0.1) return 'Critical';
  if (stockRatio < 0.3) return 'Low';
  if (stockRatio < 0.7) return 'Normal';
  if (stockRatio < 0.9) return 'Good';
  return 'Overstocked';
});

/**
 * Virtual field: turnoverHealth
 */
InventorySchema.virtual('turnoverHealth').get(function (this: IInventory): string {
  if (this.turnoverRate < 2) return 'Slow-Moving';
  if (this.turnoverRate < 4) return 'Normal';
  if (this.turnoverRate < 8) return 'Fast-Moving';
  return 'Very Fast';
});

/**
 * Pre-save hook: Calculate metrics
 */
InventorySchema.pre<IInventory>('save', function (next) {
  // Calculate total value
  this.totalValue = this.quantityOnHand * this.unitCost;

  // Calculate quantity available
  this.quantityAvailable = Math.max(0, this.quantityOnHand - this.quantityReserved);

  // Update average cost (weighted average)
  if (this.lastPurchaseCost > 0 && this.quantityOnHand > 0) {
    this.averageCost = (this.averageCost * 0.7) + (this.lastPurchaseCost * 0.3); // Weighted toward recent
  }

  // Calculate annual value
  this.annualValue = this.annualUsage * this.averageCost;

  // Calculate turnover rate
  if (this.quantityOnHand > 0) {
    this.turnoverRate = this.annualUsage / this.quantityOnHand;
  }

  // Calculate days on hand
  if (this.averageDailyUsage > 0) {
    this.daysOnHand = this.quantityOnHand / this.averageDailyUsage;
  }

  next();
});

/**
 * Inventory model
 * 
 * @example
 * ```typescript
 * import Inventory from '@/lib/db/models/Inventory';
 * 
 * // Create inventory item
 * const item = await Inventory.create({
 *   company: companyId,
 *   facility: facilityId,
 *   itemType: 'RawMaterial',
 *   sku: 'RM-ALU-001',
 *   name: 'Aluminum Ingot',
 *   category: 'Metals',
 *   uom: 'KG',
 *   quantityOnHand: 10000,
 *   unitCost: 2.50,
 *   reorderPoint: 2000,
 *   reorderQuantity: 5000,
 *   autoReorderEnabled: true
 * });
 * 
 * // Find items needing reorder
 * const reorderItems = await Inventory.find({
 *   company: companyId,
 *   quantityAvailable: { $lte: mongoose.Types.Decimal128.fromString('$reorderPoint') },
 *   autoReorderEnabled: true
 * });
 * ```
 */
const Inventory: Model<IInventory> =
  mongoose.models.Inventory ||
  mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;
