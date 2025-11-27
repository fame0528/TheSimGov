/**
 * @file src/lib/db/models/ExtractionSite.ts
 * @description Extraction site schema for Energy Industry - Multi-well operations and inventory management
 * @created 2025-11-18
 * 
 * OVERVIEW:
 * Extraction site model representing multi-well oil and gas operations with centralized
 * inventory management, production aggregation, and operational oversight. Manages
 * multiple wells and gas fields from a single location, providing consolidated metrics
 * and logistics coordination.
 * 
 * KEY FEATURES:
 * - Multi-well operations (aggregates production from multiple sources)
 * - Centralized inventory management (oil and gas storage)
 * - Production aggregation and reporting
 * - Logistics coordination (tanker trucks, pipeline connections)
 * - Worker safety tracking
 * - Environmental compliance monitoring
 * - Real-time commodity inventory
 * 
 * BUSINESS LOGIC:
 * - Site can manage 1-50 wells simultaneously
 * - Total production = sum of all connected wells/fields
 * - Inventory capacity: 10,000-1,000,000 barrels (oil) or MCF (gas)
 * - Safety incidents reduce operational efficiency by 10-30%
 * - Environmental violations incur fines ($50k-$500k per violation)
 * - Logistics cost: $5-$15 per barrel transported
 * - Worker ratio: 1 worker per 3-5 wells
 * 
 * INVENTORY MANAGEMENT:
 * - Real-time tracking of oil and gas reserves
 * - Automated alerts at 80% capacity
 * - Overflow protection (production throttled at 95% capacity)
 * - Quality segregation (premium vs standard vs sour)
 * - FIFO inventory rotation
 * 
 * USAGE:
 * ```typescript
 * import ExtractionSite from '@/lib/db/models/ExtractionSite';
 * 
 * // Create extraction site
 * const site = await ExtractionSite.create({
 *   company: companyId,
 *   name: 'Permian Basin Site Alpha',
 *   location: {
 *     latitude: 31.9686,
 *     longitude: -102.0779,
 *     region: 'West Texas'
 *   },
 *   operationType: 'Both',
 *   inventoryCapacity: {
 *     oil: 500000,
 *     gas: 2000000
 *   },
 *   workers: 45,
 *   oilWells: [well1._id, well2._id],
 *   gasFields: [field1._id]
 * });
 * 
 * // Calculate total production
 * const production = await site.calculateTotalProduction();
 * 
 * // Check inventory status
 * const status = await site.checkInventoryStatus();
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Operation types for extraction sites
 */
export type OperationType = 
  | 'Oil Only'          // Oil wells only
  | 'Gas Only'          // Gas fields only
  | 'Both';             // Mixed oil and gas operations

/**
 * Site operational status
 */
export type SiteStatus = 
  | 'Construction'      // Under development
  | 'Active'            // Normal operations
  | 'Maintenance'       // Temporary shutdown
  | 'Safety Hold'       // Operations suspended due to safety concerns
  | 'Environmental Hold' // Operations suspended due to violations
  | 'Decommissioning';  // Being shut down permanently

/**
 * Geographic location data
 */
export interface SiteLocation {
  latitude: number;      // Geographic latitude (-90 to 90)
  longitude: number;     // Geographic longitude (-180 to 180)
  region: string;        // Area name (e.g., "Permian Basin", "Gulf of Mexico")
}

/**
 * Inventory capacity limits
 */
export interface InventoryCapacity {
  oil: number;           // Barrels capacity
  gas: number;           // MCF capacity
}

/**
 * Current inventory levels
 */
export interface CurrentInventory {
  oil: number;           // Barrels currently stored
  gas: number;           // MCF currently stored
  lastUpdated: Date;
}

/**
 * Safety incident tracking
 */
export interface SafetyIncident {
  date: Date;
  type: 'Minor' | 'Major' | 'Critical';
  description: string;
  resolved: boolean;
  fine?: number;         // Regulatory fine amount
}

/**
 * Environmental violation tracking
 */
export interface EnvironmentalViolation {
  date: Date;
  type: 'Spill' | 'Emissions' | 'Water Contamination' | 'Wildlife Impact';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  fine: number;          // Regulatory fine ($50k-$500k)
  remediated: boolean;
}

/**
 * Extraction site document interface
 */
export interface IExtractionSite extends Document {
  company: Types.ObjectId;
  name: string;
  location: SiteLocation;
  operationType: OperationType;
  status: SiteStatus;
  
  // Well connections
  oilWells: Types.ObjectId[];      // References to OilWell documents
  gasFields: Types.ObjectId[];     // References to GasField documents
  
  // Inventory management
  inventoryCapacity: InventoryCapacity;
  currentInventory: CurrentInventory;
  
  // Operations
  workers: number;                 // Number of workers on site
  operationalEfficiency: number;   // Percentage (0-100, affected by safety)
  logisticsCostPerBarrel: number;  // Cost to transport per barrel
  
  // Safety & compliance
  safetyIncidents: SafetyIncident[];
  environmentalViolations: EnvironmentalViolation[];
  lastSafetyInspection?: Date;
  lastEnvironmentalInspection?: Date;
  
  // Metadata
  establishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  totalWellsManaged: number;
  inventoryUtilizationOil: number;
  inventoryUtilizationGas: number;
  needsWorkers: boolean;
  
  // Instance methods
  calculateTotalProduction(): Promise<{oil: number; gas: number}>;
  checkInventoryStatus(): {oil: string; gas: string};
  addInventory(type: 'oil' | 'gas', amount: number): Promise<void>;
  removeInventory(type: 'oil' | 'gas', amount: number): Promise<void>;
  recordSafetyIncident(incident: Omit<SafetyIncident, 'date' | 'resolved'>): Promise<void>;
  recordEnvironmentalViolation(violation: Omit<EnvironmentalViolation, 'date' | 'remediated'>): Promise<void>;
}

const ExtractionSiteSchema = new Schema<IExtractionSite>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      minlength: [3, 'Site name must be at least 3 characters'],
      maxlength: [100, 'Site name cannot exceed 100 characters'],
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
    operationType: {
      type: String,
      required: [true, 'Operation type is required'],
      enum: {
        values: ['Oil Only', 'Gas Only', 'Both'],
        message: '{VALUE} is not a valid operation type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Construction', 'Active', 'Maintenance', 'Safety Hold', 'Environmental Hold', 'Decommissioning'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Construction',
      index: true,
    },
    oilWells: [
      {
        type: Schema.Types.ObjectId,
        ref: 'OilWell',
      },
    ],
    gasFields: [
      {
        type: Schema.Types.ObjectId,
        ref: 'GasField',
      },
    ],
    inventoryCapacity: {
      type: {
        oil: {
          type: Number,
          required: [true, 'Oil capacity is required'],
          min: [10000, 'Oil capacity must be at least 10,000 barrels'],
          max: [1000000, 'Oil capacity cannot exceed 1,000,000 barrels'],
        },
        gas: {
          type: Number,
          required: [true, 'Gas capacity is required'],
          min: [100000, 'Gas capacity must be at least 100,000 MCF'],
          max: [10000000, 'Gas capacity cannot exceed 10,000,000 MCF'],
        },
      },
      required: true,
    },
    currentInventory: {
      type: {
        oil: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Oil inventory cannot be negative'],
        },
        gas: {
          type: Number,
          required: true,
          default: 0,
          min: [0, 'Gas inventory cannot be negative'],
        },
        lastUpdated: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
      required: true,
    },
    workers: {
      type: Number,
      required: [true, 'Worker count is required'],
      min: [1, 'At least 1 worker is required'],
      max: [500, 'Worker count cannot exceed 500'],
    },
    operationalEfficiency: {
      type: Number,
      required: true,
      default: 100,
      min: [0, 'Efficiency must be between 0 and 100'],
      max: [100, 'Efficiency must be between 0 and 100'],
    },
    logisticsCostPerBarrel: {
      type: Number,
      required: [true, 'Logistics cost is required'],
      min: [5, 'Logistics cost must be at least $5/barrel'],
      max: [15, 'Logistics cost cannot exceed $15/barrel'],
      default: 10,
    },
    safetyIncidents: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        type: {
          type: String,
          required: true,
          enum: ['Minor', 'Major', 'Critical'],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        resolved: {
          type: Boolean,
          required: true,
          default: false,
        },
        fine: {
          type: Number,
          min: [0, 'Fine cannot be negative'],
        },
      },
    ],
    environmentalViolations: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        type: {
          type: String,
          required: true,
          enum: ['Spill', 'Emissions', 'Water Contamination', 'Wildlife Impact'],
        },
        severity: {
          type: String,
          required: true,
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        fine: {
          type: Number,
          required: [true, 'Fine is required for violations'],
          min: [50000, 'Fine must be at least $50,000'],
          max: [500000, 'Fine cannot exceed $500,000'],
        },
        remediated: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
    lastSafetyInspection: {
      type: Date,
    },
    lastEnvironmentalInspection: {
      type: Date,
    },
    establishedDate: {
      type: Date,
      required: [true, 'Established date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'extractionsites',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique site name per company
ExtractionSiteSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for geographic queries
ExtractionSiteSchema.index({ 'location.region': 1, operationType: 1 });
ExtractionSiteSchema.index({ status: 1, company: 1 });

/**
 * Virtual: Total wells/fields managed by this site
 */
ExtractionSiteSchema.virtual('totalWellsManaged').get(function (this: IExtractionSite) {
  return this.oilWells.length + this.gasFields.length;
});

/**
 * Virtual: Oil inventory utilization percentage
 */
ExtractionSiteSchema.virtual('inventoryUtilizationOil').get(function (this: IExtractionSite) {
  if (this.inventoryCapacity.oil === 0) return 0;
  
  const utilization = (this.currentInventory.oil / this.inventoryCapacity.oil) * 100;
  return Math.round(utilization * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Gas inventory utilization percentage
 */
ExtractionSiteSchema.virtual('inventoryUtilizationGas').get(function (this: IExtractionSite) {
  if (this.inventoryCapacity.gas === 0) return 0;
  
  const utilization = (this.currentInventory.gas / this.inventoryCapacity.gas) * 100;
  return Math.round(utilization * 10) / 10; // Round to 1 decimal
});

/**
 * Virtual: Check if site needs more workers
 * 
 * Rule: 1 worker per 3-5 wells (average 4)
 * If workers < (totalWells / 4), needs workers
 */
ExtractionSiteSchema.virtual('needsWorkers').get(function (this: IExtractionSite) {
  const totalWells = this.totalWellsManaged;
  const requiredWorkers = Math.ceil(totalWells / 4);
  
  return this.workers < requiredWorkers;
});

/**
 * Calculate total production from all connected wells and fields
 * 
 * Aggregates current production across all oil wells and gas fields.
 * Applies operational efficiency multiplier to account for safety incidents
 * or other operational constraints.
 * 
 * @returns Object with total oil (barrels/day) and gas (MCF/day) production
 * 
 * @example
 * const production = await site.calculateTotalProduction();
 * // { oil: 5000, gas: 25000 }
 */
ExtractionSiteSchema.methods.calculateTotalProduction = async function (
  this: IExtractionSite
): Promise<{oil: number; gas: number}> {
  const OilWell = mongoose.model('OilWell');
  const GasField = mongoose.model('GasField');
  
  let totalOil = 0;
  let totalGas = 0;
  
  // Sum oil production from all connected wells
  if (this.oilWells.length > 0) {
    const wells = await OilWell.find({ _id: { $in: this.oilWells } });
    totalOil = wells.reduce((sum, well) => sum + (well.currentProduction || 0), 0);
  }
  
  // Sum gas production from all connected fields
  if (this.gasFields.length > 0) {
    const fields = await GasField.find({ _id: { $in: this.gasFields } });
    totalGas = fields.reduce((sum, field) => sum + (field.currentProduction || 0), 0);
  }
  
  // Apply operational efficiency multiplier
  const efficiencyFactor = this.operationalEfficiency / 100;
  totalOil = Math.round(totalOil * efficiencyFactor);
  totalGas = Math.round(totalGas * efficiencyFactor);
  
  return { oil: totalOil, gas: totalGas };
};

/**
 * Check inventory status and return alert level
 * 
 * Returns status for oil and gas inventory:
 * - 'Normal': < 80% capacity
 * - 'High': 80-94% capacity (alert)
 * - 'Critical': 95-100% capacity (production throttled)
 * - 'Overflow': > 100% capacity (shouldn't happen, error state)
 * 
 * @returns Object with oil and gas status strings
 */
ExtractionSiteSchema.methods.checkInventoryStatus = function (
  this: IExtractionSite
): {oil: string; gas: string} {
  const getStatus = (current: number, capacity: number): string => {
    const percentage = (current / capacity) * 100;
    
    if (percentage >= 100) return 'Overflow';
    if (percentage >= 95) return 'Critical';
    if (percentage >= 80) return 'High';
    return 'Normal';
  };
  
  return {
    oil: getStatus(this.currentInventory.oil, this.inventoryCapacity.oil),
    gas: getStatus(this.currentInventory.gas, this.inventoryCapacity.gas),
  };
};

/**
 * Add inventory to storage
 * 
 * Adds oil or gas to current inventory. Prevents overflow by capping
 * at capacity limit. Updates lastUpdated timestamp.
 * 
 * @param type - 'oil' or 'gas'
 * @param amount - Barrels (oil) or MCF (gas) to add
 * 
 * @throws Error if amount is negative
 * 
 * @example
 * await site.addInventory('oil', 1000); // Add 1000 barrels
 */
ExtractionSiteSchema.methods.addInventory = async function (
  this: IExtractionSite,
  type: 'oil' | 'gas',
  amount: number
): Promise<void> {
  if (amount < 0) {
    throw new Error('Cannot add negative inventory');
  }
  
  const capacity = this.inventoryCapacity[type];
  this.currentInventory[type] = Math.min(
    this.currentInventory[type] + amount,
    capacity
  );
  
  this.currentInventory.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Remove inventory from storage
 * 
 * Removes oil or gas from current inventory. Prevents negative values
 * by flooring at zero. Updates lastUpdated timestamp.
 * 
 * @param type - 'oil' or 'gas'
 * @param amount - Barrels (oil) or MCF (gas) to remove
 * 
 * @throws Error if amount is negative
 * 
 * @example
 * await site.removeInventory('gas', 5000); // Remove 5000 MCF
 */
ExtractionSiteSchema.methods.removeInventory = async function (
  this: IExtractionSite,
  type: 'oil' | 'gas',
  amount: number
): Promise<void> {
  if (amount < 0) {
    throw new Error('Cannot remove negative inventory');
  }
  
  this.currentInventory[type] = Math.max(
    this.currentInventory[type] - amount,
    0
  );
  
  this.currentInventory.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Record safety incident
 * 
 * Logs a safety incident and reduces operational efficiency based on severity:
 * - Minor: -10% efficiency
 * - Major: -20% efficiency
 * - Critical: -30% efficiency
 * 
 * If critical incident, changes status to 'Safety Hold'
 * 
 * @param incident - Incident details (type, description, fine)
 */
ExtractionSiteSchema.methods.recordSafetyIncident = async function (
  this: IExtractionSite,
  incident: Omit<SafetyIncident, 'date' | 'resolved'>
): Promise<void> {
  this.safetyIncidents.push({
    ...incident,
    date: new Date(),
    resolved: false,
  });
  
  // Reduce efficiency based on severity
  const efficiencyImpact = {
    Minor: 10,
    Major: 20,
    Critical: 30,
  };
  
  this.operationalEfficiency = Math.max(
    0,
    this.operationalEfficiency - efficiencyImpact[incident.type]
  );
  
  // Critical incidents trigger safety hold
  if (incident.type === 'Critical') {
    this.status = 'Safety Hold';
  }
  
  await this.save();
};

/**
 * Record environmental violation
 * 
 * Logs an environmental violation and applies regulatory fine.
 * If violation is Critical severity, changes status to 'Environmental Hold'
 * 
 * @param violation - Violation details (type, severity, description, fine)
 */
ExtractionSiteSchema.methods.recordEnvironmentalViolation = async function (
  this: IExtractionSite,
  violation: Omit<EnvironmentalViolation, 'date' | 'remediated'>
): Promise<void> {
  this.environmentalViolations.push({
    ...violation,
    date: new Date(),
    remediated: false,
  });
  
  // Critical violations trigger environmental hold
  if (violation.severity === 'Critical') {
    this.status = 'Environmental Hold';
  }
  
  await this.save();
};

const ExtractionSite: Model<IExtractionSite> =
  mongoose.models.ExtractionSite || mongoose.model<IExtractionSite>('ExtractionSite', ExtractionSiteSchema);

export default ExtractionSite;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. MULTI-WELL OPERATIONS:
 *    - Site can manage 1-50 wells/fields simultaneously
 *    - Production aggregated from all connected sources
 *    - Operational efficiency applied as multiplier
 *    - Worker ratio: 1 per 3-5 wells (average 4)
 * 
 * 2. INVENTORY MANAGEMENT:
 *    - Oil capacity: 10,000-1,000,000 barrels
 *    - Gas capacity: 100,000-10,000,000 MCF
 *    - Alert at 80% capacity
 *    - Production throttled at 95% capacity
 *    - Overflow prevention (caps at capacity)
 * 
 * 3. SAFETY INCIDENTS:
 *    - Minor: -10% efficiency, no status change
 *    - Major: -20% efficiency, no status change
 *    - Critical: -30% efficiency, status → 'Safety Hold'
 *    - Incidents logged permanently
 *    - Resolution tracked but efficiency recovers manually
 * 
 * 4. ENVIRONMENTAL VIOLATIONS:
 *    - Fines: $50k-$500k depending on severity
 *    - Types: Spill, Emissions, Water Contamination, Wildlife Impact
 *    - Critical severity → 'Environmental Hold' status
 *    - Remediation tracked for compliance
 * 
 * 5. OPERATIONAL EFFICIENCY:
 *    - Default: 100%
 *    - Reduced by safety incidents
 *    - Affects total production calculations
 *    - Recovers through maintenance or incident resolution
 * 
 * 6. LOGISTICS COSTS:
 *    - $5-$15 per barrel transported
 *    - Affected by location remoteness
 *    - Offshore sites: higher costs ($12-$15)
 *    - Inland sites: lower costs ($5-$8)
 * 
 * 7. LIFECYCLE STATES:
 *    - Construction: Being built, no operations
 *    - Active: Normal production operations
 *    - Maintenance: Temporary shutdown for repairs
 *    - Safety Hold: Suspended due to safety incidents
 *    - Environmental Hold: Suspended due to violations
 *    - Decommissioning: Permanent shutdown in progress
 */
