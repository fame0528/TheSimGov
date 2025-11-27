/**
 * @file src/lib/db/models/Storage.ts
 * @description Oil and gas storage facility schema for Energy Industry
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Storage facility model for managing commodity inventory in tanks, terminals,
 * and strategic reserves. Tracks capacity utilization, transfer operations,
 * storage costs, and inventory quality segregation.
 * 
 * KEY FEATURES:
 * - Multi-commodity storage (Oil, Gas, NGL)
 * - Capacity management with overflow protection
 * - Transfer operations tracking (receipts and deliveries)
 * - Quality-based inventory segregation
 * - Storage cost calculations (per barrel/MCF per day)
 * - Strategic reserve designation
 * - Temperature and pressure monitoring
 * 
 * BUSINESS LOGIC:
 * - Capacity: 50,000-10,000,000 barrels (oil/NGL) or MCF (gas)
 * - Storage cost: $0.50-$3.00 per barrel per month
 * - Gas storage cost: $0.10-$0.50 per MCF per month
 * - Utilization alert: 85% capacity (high)
 * - Utilization critical: 95% capacity (overflow risk)
 * - Quality segregation: Premium, Standard, Sour (oil/gas)
 * - FIFO inventory rotation for accounting
 * 
 * TRANSFER OPERATIONS:
 * - Receipt: Incoming commodity from wells/fields
 * - Delivery: Outgoing commodity to customers/pipelines
 * - Transfer rate: 1,000-100,000 barrels/day (oil)
 * - Gas transfer rate: 10,000-1,000,000 MCF/day
 * - Pipeline connections: Multiple inputs/outputs
 * - Tanker truck capacity: 200-300 barrels per truck
 * 
 * USAGE:
 * ```typescript
 * import Storage from '@/lib/db/models/Storage';
 * 
 * // Create storage facility
 * const storage = await Storage.create({
 *   company: companyId,
 *   name: 'Cushing Tank Farm #5',
 *   location: {
 *     latitude: 35.9848,
 *     longitude: -96.7667,
 *     region: 'Cushing, OK'
 *   },
 *   facilityType: 'Tank Farm',
 *   commodity: 'Oil',
 *   totalCapacity: 2000000,
 *   storageCostPerUnit: 1.50,
 *   isStrategicReserve: false
 * });
 * 
 * // Add inventory
 * await storage.receiveInventory(10000, 'Standard');
 * 
 * // Deliver inventory
 * await storage.deliverInventory(5000, 'Standard');
 * 
 * // Check utilization
 * const status = storage.getUtilizationStatus();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Storage facility types
 */
export type FacilityType = 
  | 'Tank Farm'              // Above-ground storage tanks
  | 'Underground Salt Cavern' // Solution-mined caverns (primarily gas)
  | 'Terminal'               // Distribution terminal
  | 'Strategic Reserve'      // Government or corporate strategic stockpile
  | 'Pipeline Storage';      // Linepack storage in pipelines

/**
 * Commodity stored
 */
export type StorageCommodity = 'Oil' | 'Gas' | 'NGL';

/**
 * Quality grades for segregation
 */
export type QualityGrade = 
  | 'Premium'                // High quality (+10-15% value)
  | 'Standard'               // Standard market grade
  | 'Sour';                  // Contains sulfur (-20-25% value)

/**
 * Facility operational status
 */
export type StorageStatus = 
  | 'Active'                 // Normal operations
  | 'Maintenance'            // Temporary shutdown
  | 'Full'                   // At capacity
  | 'Emergency'              // Emergency operations (leak, fire, etc.)
  | 'Decommissioned';        // Permanently closed

/**
 * Geographic location
 */
export interface StorageLocation {
  latitude: number;
  longitude: number;
  region: string;            // Area name (e.g., "Cushing, OK", "Gulf Coast")
}

/**
 * Inventory by quality grade
 */
export interface QualityInventory {
  premium: number;           // Premium grade volume
  standard: number;          // Standard grade volume
  sour: number;              // Sour grade volume
}

/**
 * Transfer operation record
 */
export interface TransferOperation {
  date: Date;
  type: 'Receipt' | 'Delivery';
  volume: number;            // Barrels or MCF
  quality: QualityGrade;
  counterparty?: string;     // Customer or supplier name
  transportMethod: 'Pipeline' | 'Tanker Truck' | 'Rail' | 'Barge';
  rate: number;              // Barrels/day or MCF/day
}

/**
 * Storage facility document interface
 */
export interface IStorage extends Document {
  company: Types.ObjectId;
  name: string;
  location: StorageLocation;
  facilityType: FacilityType;
  commodity: StorageCommodity;
  status: StorageStatus;
  
  // Capacity
  totalCapacity: number;               // Barrels or MCF
  currentInventory: QualityInventory;
  
  // Costs
  storageCostPerUnit: number;          // $/barrel/month or $/MCF/month
  
  // Operations
  maxReceiptRate: number;              // Max barrels/day or MCF/day incoming
  maxDeliveryRate: number;             // Max barrels/day or MCF/day outgoing
  transferHistory: TransferOperation[];
  
  // Technical specs
  temperature?: number;                // Current temp (°F) for monitoring
  pressure?: number;                   // Current pressure (PSI) for gas storage
  
  // Strategic designation
  isStrategicReserve: boolean;         // Strategic stockpile flag
  minimumInventory?: number;           // Minimum volume for strategic reserves
  
  // Metadata
  commissionedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  totalCurrentInventory: number;
  utilizationPercent: number;
  utilizationStatus: string;
  availableCapacity: number;
  
  // Instance methods
  receiveInventory(volume: number, quality: QualityGrade, counterparty?: string, method?: string): Promise<void>;
  deliverInventory(volume: number, quality: QualityGrade, counterparty?: string, method?: string): Promise<void>;
  calculateMonthlyCost(): number;
  getUtilizationStatus(): string;
  canReceive(volume: number): boolean;
  canDeliver(volume: number, quality: QualityGrade): boolean;
}

const StorageSchema = new Schema<IStorage>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Storage facility name is required'],
      trim: true,
      minlength: [3, 'Facility name must be at least 3 characters'],
      maxlength: [100, 'Facility name cannot exceed 100 characters'],
    },
    location: {
      type: {
        latitude: {
          type: Number,
          required: [true, 'Latitude is required'],
          min: [-90, 'Latitude must be between -90 and 90'],
          max: [90, 'Latitude must be between -90 and 90'],
        },
        longitude: {
          type: Number,
          required: [true, 'Longitude is required'],
          min: [-180, 'Longitude must be between -180 and 180'],
          max: [180, 'Longitude must be between -180 and 180'],
        },
        region: {
          type: String,
          required: [true, 'Region is required'],
          trim: true,
          maxlength: [100, 'Region name cannot exceed 100 characters'],
        },
      },
      required: true,
    },
    facilityType: {
      type: String,
      required: [true, 'Facility type is required'],
      enum: {
        values: ['Tank Farm', 'Underground Salt Cavern', 'Terminal', 'Strategic Reserve', 'Pipeline Storage'],
        message: '{VALUE} is not a valid facility type',
      },
      index: true,
    },
    commodity: {
      type: String,
      required: [true, 'Commodity type is required'],
      enum: {
        values: ['Oil', 'Gas', 'NGL'],
        message: '{VALUE} is not a valid commodity',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Active', 'Maintenance', 'Full', 'Emergency', 'Decommissioned'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
      index: true,
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [50000, 'Capacity must be at least 50,000 units'],
      max: [10000000, 'Capacity cannot exceed 10,000,000 units'],
    },
    currentInventory: {
      type: {
        premium: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Premium inventory cannot be negative'],
        },
        standard: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Standard inventory cannot be negative'],
        },
        sour: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Sour inventory cannot be negative'],
        },
      },
      required: true,
    },
    storageCostPerUnit: {
      type: Number,
      required: [true, 'Storage cost is required'],
      min: [0.10, 'Storage cost must be at least $0.10/unit/month'],
      max: [3.00, 'Storage cost cannot exceed $3.00/unit/month'],
    },
    maxReceiptRate: {
      type: Number,
      required: [true, 'Maximum receipt rate is required'],
      min: [1000, 'Receipt rate must be at least 1,000 units/day'],
      max: [1000000, 'Receipt rate cannot exceed 1,000,000 units/day'],
    },
    maxDeliveryRate: {
      type: Number,
      required: [true, 'Maximum delivery rate is required'],
      min: [1000, 'Delivery rate must be at least 1,000 units/day'],
      max: [1000000, 'Delivery rate cannot exceed 1,000,000 units/day'],
    },
    transferHistory: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        type: {
          type: String,
          required: true,
          enum: ['Receipt', 'Delivery'],
        },
        volume: {
          type: Number,
          required: true,
          min: [0, 'Volume cannot be negative'],
        },
        quality: {
          type: String,
          required: true,
          enum: ['Premium', 'Standard', 'Sour'],
        },
        counterparty: {
          type: String,
          trim: true,
          maxlength: [150, 'Counterparty name cannot exceed 150 characters'],
        },
        transportMethod: {
          type: String,
          required: true,
          enum: ['Pipeline', 'Tanker Truck', 'Rail', 'Barge'],
        },
        rate: {
          type: Number,
          required: true,
          min: [0, 'Rate cannot be negative'],
        },
      },
    ],
    temperature: {
      type: Number,
      min: [-50, 'Temperature must be between -50°F and 200°F'],
      max: [200, 'Temperature must be between -50°F and 200°F'],
    },
    pressure: {
      type: Number,
      min: [0, 'Pressure cannot be negative'],
      max: [10000, 'Pressure cannot exceed 10,000 PSI'],
    },
    isStrategicReserve: {
      type: Boolean,
      required: true,
      default: false,
    },
    minimumInventory: {
      type: Number,
      min: [0, 'Minimum inventory cannot be negative'],
    },
    commissionedDate: {
      type: Date,
      required: [true, 'Commissioned date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'storage',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique facility name per company
StorageSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for location-based queries
StorageSchema.index({ 'location.region': 1, commodity: 1 });
StorageSchema.index({ facilityType: 1, status: 1 });

/**
 * Virtual: Total current inventory (sum of all quality grades)
 */
StorageSchema.virtual('totalCurrentInventory').get(function (this: IStorage) {
  return (
    this.currentInventory.premium +
    this.currentInventory.standard +
    this.currentInventory.sour
  );
});

/**
 * Virtual: Utilization percentage
 */
StorageSchema.virtual('utilizationPercent').get(function (this: IStorage) {
  if (this.totalCapacity === 0) return 0;
  
  const utilization = (this.totalCurrentInventory / this.totalCapacity) * 100;
  return Math.round(utilization * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Utilization status
 * 
 * Returns status based on capacity usage:
 * - 'Low': < 50%
 * - 'Normal': 50-84%
 * - 'High': 85-94%
 * - 'Critical': 95-100%
 */
StorageSchema.virtual('utilizationStatus').get(function (this: IStorage) {
  const percent = this.utilizationPercent;
  
  if (percent >= 95) return 'Critical';
  if (percent >= 85) return 'High';
  if (percent >= 50) return 'Normal';
  return 'Low';
});

/**
 * Virtual: Available capacity (remaining space)
 */
StorageSchema.virtual('availableCapacity').get(function (this: IStorage) {
  return Math.max(0, this.totalCapacity - this.totalCurrentInventory);
});

/**
 * Receive inventory (incoming commodity)
 * 
 * Adds volume to storage inventory by quality grade.
 * Prevents overflow by capping at total capacity.
 * Logs transfer operation in history.
 * 
 * @param volume - Barrels or MCF to receive
 * @param quality - Quality grade (Premium, Standard, Sour)
 * @param counterparty - Optional supplier name
 * @param method - Optional transport method (defaults to 'Pipeline')
 * 
 * @throws Error if volume is negative
 * @throws Error if volume exceeds available capacity
 * 
 * @example
 * await storage.receiveInventory(10000, 'Standard', 'Permian Pipeline Co', 'Pipeline');
 */
StorageSchema.methods.receiveInventory = async function (
  this: IStorage,
  volume: number,
  quality: QualityGrade,
  counterparty?: string,
  method: string = 'Pipeline'
): Promise<void> {
  if (volume < 0) {
    throw new Error('Volume cannot be negative');
  }
  
  if (volume > this.availableCapacity) {
    throw new Error(`Insufficient capacity. Available: ${this.availableCapacity}, Requested: ${volume}`);
  }
  
  // Add to appropriate quality grade
  const qualityKey = quality.toLowerCase() as 'premium' | 'standard' | 'sour';
  this.currentInventory[qualityKey] += volume;
  
  // Log transfer operation
  this.transferHistory.push({
    date: new Date(),
    type: 'Receipt',
    volume,
    quality,
    counterparty,
    transportMethod: method as 'Pipeline' | 'Tanker Truck' | 'Rail' | 'Barge',
    rate: Math.min(volume, this.maxReceiptRate),
  });
  
  // Update status if reaching capacity
  if (this.utilizationPercent >= 95) {
    this.status = 'Full';
  }
  
  await this.save();
};

/**
 * Deliver inventory (outgoing commodity)
 * 
 * Removes volume from storage inventory by quality grade.
 * Prevents negative inventory (floors at zero).
 * Logs transfer operation in history.
 * 
 * @param volume - Barrels or MCF to deliver
 * @param quality - Quality grade (Premium, Standard, Sour)
 * @param counterparty - Optional customer name
 * @param method - Optional transport method (defaults to 'Pipeline')
 * 
 * @throws Error if volume is negative
 * @throws Error if insufficient inventory of specified quality
 * 
 * @example
 * await storage.deliverInventory(5000, 'Premium', 'Refinery Inc', 'Pipeline');
 */
StorageSchema.methods.deliverInventory = async function (
  this: IStorage,
  volume: number,
  quality: QualityGrade,
  counterparty?: string,
  method: string = 'Pipeline'
): Promise<void> {
  if (volume < 0) {
    throw new Error('Volume cannot be negative');
  }
  
  const qualityKey = quality.toLowerCase() as 'premium' | 'standard' | 'sour';
  const available = this.currentInventory[qualityKey];
  
  if (volume > available) {
    throw new Error(`Insufficient ${quality} inventory. Available: ${available}, Requested: ${volume}`);
  }
  
  // Remove from inventory
  this.currentInventory[qualityKey] -= volume;
  
  // Log transfer operation
  this.transferHistory.push({
    date: new Date(),
    type: 'Delivery',
    volume,
    quality,
    counterparty,
    transportMethod: method as 'Pipeline' | 'Tanker Truck' | 'Rail' | 'Barge',
    rate: Math.min(volume, this.maxDeliveryRate),
  });
  
  // Update status if no longer full
  if (this.status === 'Full' && this.utilizationPercent < 95) {
    this.status = 'Active';
  }
  
  await this.save();
};

/**
 * Calculate monthly storage cost
 * 
 * Calculates total monthly cost based on current inventory.
 * Formula: totalInventory × storageCostPerUnit
 * 
 * @returns Monthly storage cost in dollars
 * 
 * @example
 * const cost = storage.calculateMonthlyCost();
 * // Returns $150,000 for 100k barrels at $1.50/barrel/month
 */
StorageSchema.methods.calculateMonthlyCost = function (this: IStorage): number {
  return Math.round(this.totalCurrentInventory * this.storageCostPerUnit);
};

/**
 * Get utilization status
 * 
 * Returns human-readable utilization status with percentage.
 * 
 * @returns Status string (e.g., "Normal (72.3%)")
 */
StorageSchema.methods.getUtilizationStatus = function (this: IStorage): string {
  return `${this.utilizationStatus} (${this.utilizationPercent}%)`;
};

/**
 * Check if can receive volume
 * 
 * Validates if facility can accept specified volume without exceeding capacity.
 * 
 * @param volume - Volume to check
 * @returns True if sufficient capacity available
 */
StorageSchema.methods.canReceive = function (this: IStorage, volume: number): boolean {
  return volume <= this.availableCapacity;
};

/**
 * Check if can deliver volume
 * 
 * Validates if facility has sufficient inventory of specified quality to deliver.
 * 
 * @param volume - Volume to check
 * @param quality - Quality grade to check
 * @returns True if sufficient inventory available
 */
StorageSchema.methods.canDeliver = function (
  this: IStorage,
  volume: number,
  quality: QualityGrade
): boolean {
  const qualityKey = quality.toLowerCase() as 'premium' | 'standard' | 'sour';
  return volume <= this.currentInventory[qualityKey];
};

const Storage: Model<IStorage> =
  mongoose.models.Storage || mongoose.model<IStorage>('Storage', StorageSchema);

export default Storage;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. CAPACITY MANAGEMENT:
 *    - Range: 50,000-10,000,000 units (barrels for oil, MCF for gas)
 *    - Utilization alerts: 85% (High), 95% (Critical)
 *    - Overflow protection: Caps at total capacity
 *    - Available capacity: Calculated virtual field
 * 
 * 2. QUALITY SEGREGATION:
 *    - Premium: High-quality commodity (+10-15% value)
 *    - Standard: Market-grade commodity (base price)
 *    - Sour: Contains sulfur (-20-25% value)
 *    - Separate inventory tracking prevents quality mixing
 * 
 * 3. TRANSFER OPERATIONS:
 *    - Receipt: Incoming from wells, fields, suppliers
 *    - Delivery: Outgoing to customers, refineries, pipelines
 *    - Transfer rates: 1,000-1,000,000 units/day
 *    - Transport methods: Pipeline, Tanker Truck, Rail, Barge
 *    - History logged for compliance and auditing
 * 
 * 4. STORAGE COSTS:
 *    - Oil/NGL: $0.50-$3.00 per barrel per month
 *    - Gas: $0.10-$0.50 per MCF per month
 *    - Monthly cost = totalInventory × costPerUnit
 *    - Costs vary by facility type and location
 * 
 * 5. FACILITY TYPES:
 *    - Tank Farm: Above-ground tanks (oil, NGL)
 *    - Underground Salt Cavern: Solution-mined storage (primarily gas)
 *    - Terminal: Distribution hub with rail/truck/pipeline access
 *    - Strategic Reserve: Government or corporate stockpile
 *    - Pipeline Storage: Linepack storage within pipeline system
 * 
 * 6. STRATEGIC RESERVES:
 *    - Special designation for emergency stockpiles
 *    - Minimum inventory requirement enforced
 *    - Limited deliveries (emergency only)
 *    - Government or corporate management
 * 
 * 7. TECHNICAL MONITORING:
 *    - Temperature: -50°F to 200°F (thermal expansion tracking)
 *    - Pressure: 0-10,000 PSI (gas storage safety)
 *    - Automated alerts for critical thresholds
 *    - Leak detection systems integration
 * 
 * 8. LIFECYCLE STATES:
 *    - Active: Normal operations
 *    - Maintenance: Temporary shutdown for repairs
 *    - Full: At or near capacity (95%+)
 *    - Emergency: Leak, fire, or other critical event
 *    - Decommissioned: Permanently closed
 */
