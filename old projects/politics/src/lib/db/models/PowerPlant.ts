/**
 * @fileoverview PowerPlant Model - Electricity Generation Facilities
 * 
 * OVERVIEW:
 * Manages power generation facilities including coal, natural gas, nuclear, and hydroelectric
 * plants. Tracks capacity factors, fuel consumption, emissions, maintenance scheduling, efficiency
 * degradation over time, and startup/shutdown costs. Enables realistic electricity generation
 * gameplay with operational costs, environmental impacts, and grid integration.
 * 
 * KEY FEATURES:
 * - 4 plant types: Coal, Natural Gas, Nuclear, Hydroelectric
 * - Nameplate capacity vs actual generation (capacity factor)
 * - Fuel consumption rates and costs (except hydro/nuclear)
 * - CO2 emissions tracking with carbon pricing
 * - Maintenance scheduling with downtime costs
 * - Efficiency degradation (0.5-1% per year)
 * - Startup/shutdown costs and ramp rates
 * - Grid stability contribution (baseload vs peaking)
 * 
 * PLANT TYPES & SPECS:
 * - Coal: 200-1000 MW, 60-80% capacity factor, $1.0-1.5/MWh fuel cost, 2.2 lb CO2/kWh
 * - Natural Gas: 50-500 MW, 50-70% capacity factor, $2.5-4.0/MWh fuel cost, 1.0 lb CO2/kWh
 * - Nuclear: 800-1500 MW, 85-95% capacity factor, $0.5-0.7/MWh fuel cost, 0 lb CO2/kWh
 * - Hydro: 50-2000 MW, 40-60% capacity factor (seasonal), $0/MWh fuel cost, 0 lb CO2/kWh
 * 
 * OPERATIONAL MECHANICS:
 * - Startup time: Coal 6-12h, Gas 1-3h, Nuclear 24-72h, Hydro 1-15min
 * - Ramp rate: Coal 1-3%/min, Gas 5-10%/min, Nuclear 0.5-2%/min, Hydro 50-100%/min
 * - Maintenance: Annual 2-4 weeks scheduled downtime
 * - Efficiency degradation: 0.5-1.0% per year (recoverable via overhauls)
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Power plant types
 */
export type PlantType =
  | 'Coal'        // Coal-fired thermal plant
  | 'NaturalGas'  // Natural gas combined cycle
  | 'Nuclear'     // Nuclear fission reactor
  | 'Hydro';      // Hydroelectric dam

/**
 * Plant operational status
 */
export type PlantStatus =
  | 'Offline'      // Not generating
  | 'StartingUp'   // Ramping to operational state
  | 'Online'       // Actively generating
  | 'ShuttingDown' // Ramping down
  | 'Maintenance'  // Scheduled maintenance
  | 'Emergency';   // Emergency shutdown

/**
 * Maintenance record
 */
export interface IMaintenanceRecord {
  startDate: Date;
  endDate: Date;
  maintenanceType: 'Scheduled' | 'Emergency' | 'Overhaul';
  costIncurred: number;
  efficiencyRestored?: number; // % efficiency restored (for overhauls)
  notes?: string;
}

// ================== INTERFACE ==================

/**
 * PowerPlant document interface
 */
export interface IPowerPlant extends Document {
  // Core Identification
  _id: Types.ObjectId;
  company: Types.ObjectId;
  name: string;
  plantType: PlantType;
  location: {
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Capacity & Generation
  nameplateCapacity: number;     // Maximum capacity (MW)
  currentOutput: number;          // Current generation (MW)
  targetCapacityFactor: number;   // Target capacity factor (0-1)
  actualCapacityFactor: number;   // Actual YTD capacity factor (0-1)
  
  // Efficiency & Degradation
  baseEfficiency: number;         // Design efficiency (%)
  currentEfficiency: number;      // Current efficiency with degradation (%)
  degradationRate: number;        // Annual efficiency loss (%/year)
  lastOverhaulDate?: Date;
  yearsInOperation: number;
  
  // Fuel & Emissions (not applicable to Hydro/Nuclear)
  fuelType?: string;              // Coal, Natural Gas, Uranium, None
  fuelCostPerMWh: number;         // $/MWh fuel cost
  fuelConsumptionRate: number;    // MMBtu/MWh or tons/MWh
  co2EmissionsRate: number;       // lb CO2/kWh
  totalCO2Emitted: number;        // Total lifetime emissions (tons)
  
  // Operational Characteristics
  startupTimehours: number;       // Hours to reach full capacity from cold start
  shutdownTimeHours: number;      // Hours to safely shut down
  rampRatePercentPerMin: number;  // % of capacity change per minute
  minimumLoadPercent: number;     // Minimum stable operating level (%)
  
  // Costs
  constructionCost: number;       // Initial capital cost
  startupCost: number;            // Cost per startup
  shutdownCost: number;           // Cost per shutdown
  fixedOMCostPerYear: number;     // Fixed O&M costs ($/year)
  variableOMCostPerMWh: number;   // Variable O&M costs ($/MWh)
  
  // Status & Operations
  status: PlantStatus;
  lastStartup?: Date;
  lastShutdown?: Date;
  totalStartups: number;
  hoursOnline: number;
  totalMWhGenerated: number;
  
  // Maintenance
  maintenanceSchedule: Date[];    // Array of scheduled maintenance dates
  maintenanceHistory: IMaintenanceRecord[];
  nextMaintenanceDate?: Date;
  
  // Grid Integration
  connectedGridNode?: Types.ObjectId; // GridNode reference
  priorityDispatch: boolean;      // Priority for dispatch (baseload plants)
  blackStartCapable: boolean;     // Can restart grid after blackout
  
  // Timestamps
  commissionedDate: Date;
  decommissionDate?: Date;
  
  // Methods
  startPlant(): Promise<IPowerPlant>;
  shutdownPlant(): Promise<IPowerPlant>;
  setOutput(targetMW: number): Promise<IPowerPlant>;
  performMaintenance(type: 'Scheduled' | 'Emergency' | 'Overhaul', durationDays: number, cost: number): Promise<IPowerPlant>;
  calculateDegradation(): number;
  calculateFuelCost(mwhGenerated: number): number;
  calculateEmissions(mwhGenerated: number): number;
  getOperatingCost(mwhGenerated: number): number;
  isAvailable(): boolean;
  canRampTo(targetMW: number, timeMinutes: number): boolean;
  getPlantMetrics(): {
    efficiency: number;
    capacityFactor: number;
    availability: number;
    totalCost: number;
    emissions: number;
  };
}

// ================== SCHEMA ==================

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maintenanceType: {
      type: String,
      enum: ['Scheduled', 'Emergency', 'Overhaul'],
      required: true,
    },
    costIncurred: {
      type: Number,
      required: true,
      min: 0,
    },
    efficiencyRestored: {
      type: Number,
      min: 0,
      max: 100,
      default: undefined,
    },
    notes: {
      type: String,
      default: undefined,
    },
  },
  { _id: false }
);

const PowerPlantSchema = new Schema<IPowerPlant>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    plantType: {
      type: String,
      enum: ['Coal', 'NaturalGas', 'Nuclear', 'Hydro'],
      required: true,
      index: true,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    
    // Capacity & Generation
    nameplateCapacity: {
      type: Number,
      required: true,
      min: 1,
      max: 5000, // Max 5 GW
    },
    currentOutput: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetCapacityFactor: {
      type: Number,
      default: 0.75,
      min: 0,
      max: 1,
    },
    actualCapacityFactor: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    
    // Efficiency & Degradation
    baseEfficiency: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },
    currentEfficiency: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },
    degradationRate: {
      type: Number,
      default: 0.75, // 0.75% per year
      min: 0,
      max: 5,
    },
    lastOverhaulDate: {
      type: Date,
      default: undefined,
    },
    yearsInOperation: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Fuel & Emissions
    fuelType: {
      type: String,
      default: undefined,
    },
    fuelCostPerMWh: {
      type: Number,
      default: 0,
      min: 0,
    },
    fuelConsumptionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    co2EmissionsRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCO2Emitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Operational Characteristics
    startupTimehours: {
      type: Number,
      required: true,
      min: 0,
    },
    shutdownTimeHours: {
      type: Number,
      required: true,
      min: 0,
    },
    rampRatePercentPerMin: {
      type: Number,
      required: true,
      min: 0.1,
      max: 100,
    },
    minimumLoadPercent: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },
    
    // Costs
    constructionCost: {
      type: Number,
      required: true,
      min: 0,
    },
    startupCost: {
      type: Number,
      required: true,
      min: 0,
    },
    shutdownCost: {
      type: Number,
      required: true,
      min: 0,
    },
    fixedOMCostPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
    variableOMCostPerMWh: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Status & Operations
    status: {
      type: String,
      enum: ['Offline', 'StartingUp', 'Online', 'ShuttingDown', 'Maintenance', 'Emergency'],
      default: 'Offline',
      index: true,
    },
    lastStartup: {
      type: Date,
      default: undefined,
    },
    lastShutdown: {
      type: Date,
      default: undefined,
    },
    totalStartups: {
      type: Number,
      default: 0,
      min: 0,
    },
    hoursOnline: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMWhGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Maintenance
    maintenanceSchedule: {
      type: [Date],
      default: [],
    },
    maintenanceHistory: {
      type: [MaintenanceRecordSchema],
      default: [],
    },
    nextMaintenanceDate: {
      type: Date,
      default: undefined,
    },
    
    // Grid Integration
    connectedGridNode: {
      type: Schema.Types.ObjectId,
      ref: 'GridNode',
      default: undefined,
    },
    priorityDispatch: {
      type: Boolean,
      default: false,
    },
    blackStartCapable: {
      type: Boolean,
      default: false,
    },
    
    // Timestamps
    commissionedDate: {
      type: Date,
      default: Date.now,
    },
    decommissionDate: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'powerplants',
  }
);

// ================== INDEXES ==================

PowerPlantSchema.index({ company: 1, status: 1 });
PowerPlantSchema.index({ plantType: 1, status: 1 });
PowerPlantSchema.index({ 'location.state': 1 });
PowerPlantSchema.index({ connectedGridNode: 1 });

// ================== INSTANCE METHODS ==================

/**
 * Start power plant from offline state
 * 
 * @returns Updated power plant
 * 
 * @example
 * await plant.startPlant();
 */
PowerPlantSchema.methods.startPlant = async function(
  this: IPowerPlant
): Promise<IPowerPlant> {
  if (this.status !== 'Offline') {
    throw new Error(`Cannot start plant from ${this.status} state`);
  }
  
  if (this.decommissionDate && new Date() >= this.decommissionDate) {
    throw new Error('Plant has been decommissioned');
  }
  
  this.status = 'StartingUp';
  this.lastStartup = new Date();
  this.totalStartups += 1;
  
  // Deduct startup cost (handled externally via company finances)
  
  return this.save();
};

/**
 * Shutdown power plant to offline state
 * 
 * @returns Updated power plant
 * 
 * @example
 * await plant.shutdownPlant();
 */
PowerPlantSchema.methods.shutdownPlant = async function(
  this: IPowerPlant
): Promise<IPowerPlant> {
  if (this.status === 'Offline' || this.status === 'ShuttingDown') {
    throw new Error('Plant already offline or shutting down');
  }
  
  this.status = 'ShuttingDown';
  this.lastShutdown = new Date();
  
  // Calculate hours online since last startup
  if (this.lastStartup) {
    const hoursOnline = (new Date().getTime() - this.lastStartup.getTime()) / (1000 * 60 * 60);
    this.hoursOnline += hoursOnline;
  }
  
  return this.save();
};

/**
 * Set target output level (respects ramp rate limits)
 * 
 * @param targetMW - Target output in MW
 * @returns Updated power plant
 * 
 * @example
 * await plant.setOutput(500); // Ramp to 500 MW
 */
PowerPlantSchema.methods.setOutput = async function(
  this: IPowerPlant,
  targetMW: number
): Promise<IPowerPlant> {
  if (this.status !== 'Online') {
    throw new Error('Plant must be online to set output');
  }
  
  if (targetMW < 0 || targetMW > this.nameplateCapacity) {
    throw new Error(`Target output must be between 0 and ${this.nameplateCapacity} MW`);
  }
  
  // Check minimum load constraint
  const minMW = (this.minimumLoadPercent / 100) * this.nameplateCapacity;
  if (targetMW > 0 && targetMW < minMW) {
    throw new Error(`Output must be at least ${minMW} MW (${this.minimumLoadPercent}% minimum load)`);
  }
  
  // Ramp rate check (simplified - instant in this implementation)
  // In real implementation, would require time-based ramping
  this.currentOutput = targetMW;
  
  return this.save();
};

/**
 * Perform scheduled or emergency maintenance
 * 
 * @param type - Maintenance type
 * @param durationDays - Duration in days
 * @param cost - Maintenance cost
 * @returns Updated power plant
 * 
 * @example
 * await plant.performMaintenance('Scheduled', 14, 500000);
 */
PowerPlantSchema.methods.performMaintenance = async function(
  this: IPowerPlant,
  type: 'Scheduled' | 'Emergency' | 'Overhaul',
  durationDays: number,
  cost: number
): Promise<IPowerPlant> {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  // Create maintenance record
  const maintenanceRecord: IMaintenanceRecord = {
    startDate,
    endDate,
    maintenanceType: type,
    costIncurred: cost,
  };
  
  // Overhaul restores efficiency
  if (type === 'Overhaul') {
    const efficiencyLoss = this.baseEfficiency - this.currentEfficiency;
    const restoration = efficiencyLoss * 0.8; // Restore 80% of lost efficiency
    this.currentEfficiency += restoration;
    maintenanceRecord.efficiencyRestored = restoration;
    this.lastOverhaulDate = startDate;
  }
  
  this.maintenanceHistory.push(maintenanceRecord);
  this.status = 'Maintenance';
  
  // Schedule next maintenance (1 year from now for scheduled)
  if (type === 'Scheduled') {
    const nextDate = new Date(endDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    this.nextMaintenanceDate = nextDate;
  }
  
  return this.save();
};

/**
 * Calculate current efficiency degradation
 * 
 * @returns Current degradation percentage
 * 
 * @example
 * const degradation = plant.calculateDegradation(); // 3.75% after 5 years
 */
PowerPlantSchema.methods.calculateDegradation = function(
  this: IPowerPlant
): number {
  const yearsSinceOverhaul = this.lastOverhaulDate
    ? (new Date().getTime() - this.lastOverhaulDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    : this.yearsInOperation;
  
  return this.degradationRate * yearsSinceOverhaul;
};

/**
 * Calculate fuel cost for generation
 * 
 * @param mwhGenerated - MWh generated
 * @returns Fuel cost in dollars
 * 
 * @example
 * const fuelCost = plant.calculateFuelCost(1000); // 1000 MWh
 */
PowerPlantSchema.methods.calculateFuelCost = function(
  this: IPowerPlant,
  mwhGenerated: number
): number {
  return mwhGenerated * this.fuelCostPerMWh;
};

/**
 * Calculate CO2 emissions for generation
 * 
 * @param mwhGenerated - MWh generated
 * @returns CO2 emissions in tons
 * 
 * @example
 * const emissions = plant.calculateEmissions(1000); // 1000 MWh
 */
PowerPlantSchema.methods.calculateEmissions = function(
  this: IPowerPlant,
  mwhGenerated: number
): number {
  // Convert lb/kWh to tons/MWh
  const tonsPerMWh = (this.co2EmissionsRate * 1000) / 2000;
  return mwhGenerated * tonsPerMWh;
};

/**
 * Calculate total operating cost
 * 
 * @param mwhGenerated - MWh generated
 * @returns Total operating cost
 * 
 * @example
 * const cost = plant.getOperatingCost(1000); // 1000 MWh
 */
PowerPlantSchema.methods.getOperatingCost = function(
  this: IPowerPlant,
  mwhGenerated: number
): number {
  const fuelCost = this.calculateFuelCost(mwhGenerated);
  const variableOMCost = mwhGenerated * this.variableOMCostPerMWh;
  const fixedOMDaily = this.fixedOMCostPerYear / 365;
  
  return fuelCost + variableOMCost + fixedOMDaily;
};

/**
 * Check if plant is available for generation
 * 
 * @returns True if plant can generate
 * 
 * @example
 * if (plant.isAvailable()) { await plant.startPlant(); }
 */
PowerPlantSchema.methods.isAvailable = function(this: IPowerPlant): boolean {
  return this.status === 'Offline' || this.status === 'Online';
};

/**
 * Check if plant can ramp to target in given time
 * 
 * @param targetMW - Target output
 * @param timeMinutes - Time available
 * @returns True if ramp is feasible
 * 
 * @example
 * if (plant.canRampTo(600, 30)) { await plant.setOutput(600); }
 */
PowerPlantSchema.methods.canRampTo = function(
  this: IPowerPlant,
  targetMW: number,
  timeMinutes: number
): boolean {
  const currentMW = this.currentOutput;
  const deltaMW = Math.abs(targetMW - currentMW);
  const deltaPercent = (deltaMW / this.nameplateCapacity) * 100;
  const maxDeltaPercent = this.rampRatePercentPerMin * timeMinutes;
  
  return deltaPercent <= maxDeltaPercent;
};

/**
 * Get comprehensive plant metrics
 * 
 * @returns Plant performance metrics
 * 
 * @example
 * const metrics = plant.getPlantMetrics();
 */
PowerPlantSchema.methods.getPlantMetrics = function(this: IPowerPlant) {
  const availability = this.status === 'Online' || this.status === 'Offline' ? 1 : 0;
  const totalCost = this.constructionCost + (this.totalStartups * this.startupCost);
  
  return {
    efficiency: this.currentEfficiency,
    capacityFactor: this.actualCapacityFactor,
    availability,
    totalCost,
    emissions: this.totalCO2Emitted,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Update efficiency based on degradation
 */
PowerPlantSchema.pre('save', function(this: IPowerPlant, next) {
  // Calculate and apply efficiency degradation
  const degradation = this.calculateDegradation();
  this.currentEfficiency = Math.max(10, this.baseEfficiency - degradation);
  
  // Update actual capacity factor
  if (this.totalMWhGenerated > 0) {
    const maxPossibleMWh = this.nameplateCapacity * 8760 * this.yearsInOperation;
    if (maxPossibleMWh > 0) {
      this.actualCapacityFactor = this.totalMWhGenerated / maxPossibleMWh;
    }
  }
  
  next();
});

// ================== MODEL ==================

export const PowerPlant: Model<IPowerPlant> = 
  mongoose.models.PowerPlant || 
  mongoose.model<IPowerPlant>('PowerPlant', PowerPlantSchema);

export default PowerPlant;
