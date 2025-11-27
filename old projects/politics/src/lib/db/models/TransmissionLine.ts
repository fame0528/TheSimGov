/**
 * @fileoverview TransmissionLine Model - Electrical Grid Transmission Infrastructure
 * 
 * OVERVIEW:
 * Manages high-voltage transmission lines that transport electricity from power plants to
 * distribution networks. Tracks voltage levels, power loss calculations based on resistance
 * and distance, capacity limits, thermal ratings, maintenance schedules, and upgrade mechanics.
 * Enables realistic grid infrastructure gameplay with transmission constraints and expansion.
 * 
 * KEY FEATURES:
 * - 6 voltage classes: 115kV, 138kV, 230kV, 345kV, 500kV, 765kV
 * - Power loss calculation (I²R losses based on current and resistance)
 * - Thermal rating limits (summer vs winter capacity)
 * - Distance-based resistance calculation
 * - Capacity upgrades (voltage class, conductor type, additional circuits)
 * - Maintenance scheduling with outage coordination
 * - Age-based reliability degradation
 * - Congestion tracking and bottleneck identification
 * 
 * VOLTAGE CLASSES & TYPICAL CAPACITY:
 * - 115kV: 50-100 MW, short distribution feeders
 * - 138kV: 100-200 MW, regional distribution
 * - 230kV: 200-500 MW, inter-regional transmission
 * - 345kV: 500-1000 MW, long-distance transmission
 * - 500kV: 1000-2000 MW, major grid interconnections
 * - 765kV: 2000-4000 MW, transcontinental bulk power transfer
 * 
 * POWER LOSS MECHANICS:
 * - Resistance: 0.01-0.05 Ω/km (varies by conductor type and voltage)
 * - Loss = I² × R × Length (where I = Power/Voltage)
 * - Typical loss: 2-4% per 100 km at moderate loading
 * - Higher voltage = lower current = lower I²R losses
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Transmission voltage classes
 */
export type VoltageClass =
  | '115kV'
  | '138kV'
  | '230kV'
  | '345kV'
  | '500kV'
  | '765kV';

/**
 * Conductor types
 */
export type ConductorType =
  | 'ACSR'      // Aluminum Conductor Steel Reinforced (standard)
  | 'ACAR'      // Aluminum Conductor Alloy Reinforced (higher capacity)
  | 'AAAC'      // All Aluminum Alloy Conductor (lighter)
  | 'HTLS';     // High Temperature Low Sag (advanced, higher thermal rating)

/**
 * Line status
 */
export type LineStatus =
  | 'Active'       // Operating normally
  | 'Maintenance'  // Scheduled maintenance outage
  | 'Overloaded'   // Exceeding thermal rating
  | 'Emergency'    // Emergency outage
  | 'Decommissioned'; // Permanently offline

/**
 * Maintenance record
 */
export interface IMaintenanceRecord {
  startDate: Date;
  endDate: Date;
  maintenanceType: 'Inspection' | 'Repair' | 'Upgrade' | 'Emergency';
  costIncurred: number;
  notes?: string;
}

// ================== INTERFACE ==================

/**
 * TransmissionLine document interface
 */
export interface ITransmissionLine extends Document {
  // Core Identification
  _id: Types.ObjectId;
  company: Types.ObjectId;
  name: string;
  lineNumber: string;           // Utility line identifier (e.g., "TX-500-001")
  
  // Physical Characteristics
  fromNode: Types.ObjectId;     // Starting GridNode
  toNode: Types.ObjectId;       // Ending GridNode
  lengthKm: number;             // Length in kilometers
  voltageClass: VoltageClass;
  conductorType: ConductorType;
  numberOfCircuits: number;     // 1, 2, or 3 parallel circuits
  
  // Electrical Characteristics
  resistancePerKm: number;      // Ω/km
  reactancePerKm: number;       // Ω/km (for power flow calculations)
  totalResistance: number;      // Total R = resistancePerKm × lengthKm
  totalReactance: number;       // Total X = reactancePerKm × lengthKm
  
  // Capacity & Ratings
  baseCapacityMW: number;       // Base thermal capacity (MW)
  summerRatingMW: number;       // Summer thermal rating (derated due to heat)
  winterRatingMW: number;       // Winter thermal rating (higher due to cooling)
  emergencyRatingMW: number;    // Short-term emergency rating (1-4 hours)
  currentLoadMW: number;        // Current power flow (MW)
  
  // Power Loss Tracking
  currentLossMW: number;        // Current I²R power loss (MW)
  totalLossMWh: number;         // Lifetime cumulative losses (MWh)
  lossPercentage: number;       // Current loss as % of load
  
  // Reliability & Age
  yearsInService: number;
  constructionDate: Date;
  lastUpgradeDate?: Date;
  reliabilityFactor: number;    // 0-1, decreases with age
  outageHoursPerYear: number;   // Average outage hours
  
  // Status & Operations
  status: LineStatus;
  utilizationPercent: number;   // Current load / summer rating
  congestionFrequency: number;  // Times per year at >90% capacity
  
  // Maintenance
  maintenanceHistory: IMaintenanceRecord[];
  nextInspectionDate?: Date;
  
  // Costs
  constructionCostPerKm: number;
  upgradeCost?: number;
  annualMaintenanceCost: number;
  
  // Methods
  calculatePowerLoss(powerFlowMW: number): number;
  updateLoad(powerFlowMW: number): Promise<ITransmissionLine>;
  upgradeVoltageClass(newClass: VoltageClass): Promise<ITransmissionLine>;
  upgradeConductor(newType: ConductorType): Promise<ITransmissionLine>;
  addCircuit(): Promise<ITransmissionLine>;
  performMaintenance(type: 'Inspection' | 'Repair' | 'Upgrade' | 'Emergency', durationDays: number, cost: number): Promise<ITransmissionLine>;
  isOverloaded(): boolean;
  canHandle(powerMW: number, season: 'Summer' | 'Winter'): boolean;
  getEfficiency(): number;
  getLineMetrics(): {
    capacity: number;
    utilization: number;
    loss: number;
    reliability: number;
    congestionRisk: 'Low' | 'Medium' | 'High';
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
      enum: ['Inspection', 'Repair', 'Upgrade', 'Emergency'],
      required: true,
    },
    costIncurred: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: undefined,
    },
  },
  { _id: false }
);

const TransmissionLineSchema = new Schema<ITransmissionLine>(
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
    lineNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    // Physical Characteristics
    fromNode: {
      type: Schema.Types.ObjectId,
      ref: 'GridNode',
      required: true,
      index: true,
    },
    toNode: {
      type: Schema.Types.ObjectId,
      ref: 'GridNode',
      required: true,
      index: true,
    },
    lengthKm: {
      type: Number,
      required: true,
      min: 0.1,
      max: 2000, // Max 2000 km
    },
    voltageClass: {
      type: String,
      enum: ['115kV', '138kV', '230kV', '345kV', '500kV', '765kV'],
      required: true,
      index: true,
    },
    conductorType: {
      type: String,
      enum: ['ACSR', 'ACAR', 'AAAC', 'HTLS'],
      default: 'ACSR',
    },
    numberOfCircuits: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    
    // Electrical Characteristics
    resistancePerKm: {
      type: Number,
      required: true,
      min: 0.001,
      max: 0.1,
    },
    reactancePerKm: {
      type: Number,
      required: true,
      min: 0.1,
      max: 1.0,
    },
    totalResistance: {
      type: Number,
      required: true,
      min: 0,
    },
    totalReactance: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Capacity & Ratings
    baseCapacityMW: {
      type: Number,
      required: true,
      min: 1,
    },
    summerRatingMW: {
      type: Number,
      required: true,
      min: 1,
    },
    winterRatingMW: {
      type: Number,
      required: true,
      min: 1,
    },
    emergencyRatingMW: {
      type: Number,
      required: true,
      min: 1,
    },
    currentLoadMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Power Loss Tracking
    currentLossMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLossMWh: {
      type: Number,
      default: 0,
      min: 0,
    },
    lossPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Reliability & Age
    yearsInService: {
      type: Number,
      default: 0,
      min: 0,
    },
    constructionDate: {
      type: Date,
      default: Date.now,
    },
    lastUpgradeDate: {
      type: Date,
      default: undefined,
    },
    reliabilityFactor: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    outageHoursPerYear: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Status & Operations
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Overloaded', 'Emergency', 'Decommissioned'],
      default: 'Active',
      index: true,
    },
    utilizationPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 200, // Can exceed 100% temporarily
    },
    congestionFrequency: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Maintenance
    maintenanceHistory: {
      type: [MaintenanceRecordSchema],
      default: [],
    },
    nextInspectionDate: {
      type: Date,
      default: undefined,
    },
    
    // Costs
    constructionCostPerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    upgradeCost: {
      type: Number,
      default: undefined,
      min: 0,
    },
    annualMaintenanceCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'transmissionlines',
  }
);

// ================== INDEXES ==================

TransmissionLineSchema.index({ company: 1, status: 1 });
TransmissionLineSchema.index({ voltageClass: 1, utilizationPercent: -1 });
TransmissionLineSchema.index({ fromNode: 1, toNode: 1 });
TransmissionLineSchema.index({ status: 1, utilizationPercent: -1 });

// ================== HELPER FUNCTIONS ==================

/**
 * Get voltage class specifications
 */
function getVoltageSpecs(voltageClass: VoltageClass): {
  baseCapacity: number;
  resistancePerKm: number;
  reactancePerKm: number;
  constructionCostPerKm: number;
} {
  const specs = {
    '115kV': {
      baseCapacity: 75,
      resistancePerKm: 0.045,
      reactancePerKm: 0.42,
      constructionCostPerKm: 500000,
    },
    '138kV': {
      baseCapacity: 150,
      resistancePerKm: 0.038,
      reactancePerKm: 0.40,
      constructionCostPerKm: 600000,
    },
    '230kV': {
      baseCapacity: 350,
      resistancePerKm: 0.028,
      reactancePerKm: 0.35,
      constructionCostPerKm: 900000,
    },
    '345kV': {
      baseCapacity: 750,
      resistancePerKm: 0.020,
      reactancePerKm: 0.32,
      constructionCostPerKm: 1300000,
    },
    '500kV': {
      baseCapacity: 1500,
      resistancePerKm: 0.015,
      reactancePerKm: 0.30,
      constructionCostPerKm: 2000000,
    },
    '765kV': {
      baseCapacity: 3000,
      resistancePerKm: 0.010,
      reactancePerKm: 0.28,
      constructionCostPerKm: 3500000,
    },
  };
  
  return specs[voltageClass];
}

/**
 * Get conductor type multipliers
 */
function getConductorMultipliers(conductorType: ConductorType): {
  capacityMultiplier: number;
  resistanceMultiplier: number;
  costMultiplier: number;
} {
  const multipliers = {
    ACSR: { capacityMultiplier: 1.0, resistanceMultiplier: 1.0, costMultiplier: 1.0 },
    ACAR: { capacityMultiplier: 1.1, resistanceMultiplier: 0.95, costMultiplier: 1.2 },
    AAAC: { capacityMultiplier: 1.05, resistanceMultiplier: 0.98, costMultiplier: 1.1 },
    HTLS: { capacityMultiplier: 1.3, resistanceMultiplier: 0.85, costMultiplier: 1.5 },
  };
  
  return multipliers[conductorType];
}

// ================== INSTANCE METHODS ==================

/**
 * Calculate power loss for given load
 * 
 * @param powerFlowMW - Power flowing through line (MW)
 * @returns Power loss in MW
 * 
 * @example
 * const loss = line.calculatePowerLoss(500); // 500 MW load
 */
TransmissionLineSchema.methods.calculatePowerLoss = function(
  this: ITransmissionLine,
  powerFlowMW: number
): number {
  // Extract voltage magnitude from voltage class (e.g., "345kV" -> 345)
  const voltageKV = parseInt(this.voltageClass.replace('kV', ''));
  
  // Calculate current: I = P / (√3 × V) for three-phase
  // Simplified: I (kA) = P (MW) / V (kV)
  const currentKA = powerFlowMW / voltageKV;
  
  // Power loss: P_loss = I² × R
  // For AC transmission: multiply by 3 for three-phase
  const lossMW = 3 * Math.pow(currentKA, 2) * this.totalResistance;
  
  return lossMW;
};

/**
 * Update line load and calculate losses
 * 
 * @param powerFlowMW - New power flow (MW)
 * @returns Updated transmission line
 * 
 * @example
 * await line.updateLoad(600);
 */
TransmissionLineSchema.methods.updateLoad = async function(
  this: ITransmissionLine,
  powerFlowMW: number
): Promise<ITransmissionLine> {
  if (powerFlowMW < 0) {
    throw new Error('Power flow cannot be negative');
  }
  
  // Calculate power loss
  const lossMW = this.calculatePowerLoss(powerFlowMW);
  
  // Update current values
  this.currentLoadMW = powerFlowMW;
  this.currentLossMW = lossMW;
  this.lossPercentage = powerFlowMW > 0 ? (lossMW / powerFlowMW) * 100 : 0;
  
  // Update utilization (use summer rating as conservative baseline)
  this.utilizationPercent = (powerFlowMW / this.summerRatingMW) * 100;
  
  // Check for overload
  if (this.utilizationPercent > 100) {
    this.status = 'Overloaded';
    this.congestionFrequency += 1;
  } else if (this.status === 'Overloaded') {
    this.status = 'Active';
  }
  
  // Accumulate total losses (assume 1 hour of operation)
  this.totalLossMWh += lossMW;
  
  return this.save();
};

/**
 * Upgrade transmission line to higher voltage class
 * 
 * @param newClass - New voltage class
 * @returns Upgraded transmission line
 * 
 * @example
 * await line.upgradeVoltageClass('500kV');
 */
TransmissionLineSchema.methods.upgradeVoltageClass = async function(
  this: ITransmissionLine,
  newClass: VoltageClass
): Promise<ITransmissionLine> {
  const currentVolts = parseInt(this.voltageClass.replace('kV', ''));
  const newVolts = parseInt(newClass.replace('kV', ''));
  
  if (newVolts <= currentVolts) {
    throw new Error('New voltage class must be higher than current');
  }
  
  // Get new specs
  const specs = getVoltageSpecs(newClass);
  const conductorMults = getConductorMultipliers(this.conductorType);
  
  // Update voltage class
  this.voltageClass = newClass;
  
  // Update electrical characteristics
  this.resistancePerKm = specs.resistancePerKm * conductorMults.resistanceMultiplier;
  this.reactancePerKm = specs.reactancePerKm;
  this.totalResistance = this.resistancePerKm * this.lengthKm;
  this.totalReactance = this.reactancePerKm * this.lengthKm;
  
  // Update capacity
  this.baseCapacityMW = specs.baseCapacity * conductorMults.capacityMultiplier * this.numberOfCircuits;
  this.summerRatingMW = this.baseCapacityMW * 0.9; // 10% summer deration
  this.winterRatingMW = this.baseCapacityMW * 1.1; // 10% winter boost
  this.emergencyRatingMW = this.baseCapacityMW * 1.3; // 30% emergency rating
  
  // Calculate upgrade cost
  this.upgradeCost = specs.constructionCostPerKm * this.lengthKm * 0.8; // 80% of new construction
  this.lastUpgradeDate = new Date();
  
  return this.save();
};

/**
 * Upgrade conductor type for higher capacity
 * 
 * @param newType - New conductor type
 * @returns Upgraded transmission line
 * 
 * @example
 * await line.upgradeConductor('HTLS');
 */
TransmissionLineSchema.methods.upgradeConductor = async function(
  this: ITransmissionLine,
  newType: ConductorType
): Promise<ITransmissionLine> {
  const oldMults = getConductorMultipliers(this.conductorType);
  const newMults = getConductorMultipliers(newType);
  
  if (newMults.capacityMultiplier <= oldMults.capacityMultiplier) {
    throw new Error('New conductor must have higher capacity than current');
  }
  
  // Update conductor type
  this.conductorType = newType;
  
  // Recalculate with new multipliers
  const voltageSpecs = getVoltageSpecs(this.voltageClass);
  
  this.resistancePerKm = voltageSpecs.resistancePerKm * newMults.resistanceMultiplier;
  this.totalResistance = this.resistancePerKm * this.lengthKm;
  
  this.baseCapacityMW = voltageSpecs.baseCapacity * newMults.capacityMultiplier * this.numberOfCircuits;
  this.summerRatingMW = this.baseCapacityMW * 0.9;
  this.winterRatingMW = this.baseCapacityMW * 1.1;
  this.emergencyRatingMW = this.baseCapacityMW * 1.3;
  
  // Calculate upgrade cost
  this.upgradeCost = this.constructionCostPerKm * this.lengthKm * 0.4; // 40% of construction cost
  this.lastUpgradeDate = new Date();
  
  return this.save();
};

/**
 * Add parallel circuit to increase capacity
 * 
 * @returns Updated transmission line
 * 
 * @example
 * await line.addCircuit(); // Add second or third circuit
 */
TransmissionLineSchema.methods.addCircuit = async function(
  this: ITransmissionLine
): Promise<ITransmissionLine> {
  if (this.numberOfCircuits >= 3) {
    throw new Error('Maximum 3 circuits allowed per line');
  }
  
  const newCircuitCount = this.numberOfCircuits + 1;
  const capacityMultiplier = newCircuitCount / this.numberOfCircuits;
  
  // Update capacity (adding circuit increases capacity proportionally)
  this.numberOfCircuits = newCircuitCount;
  this.baseCapacityMW *= capacityMultiplier;
  this.summerRatingMW *= capacityMultiplier;
  this.winterRatingMW *= capacityMultiplier;
  this.emergencyRatingMW *= capacityMultiplier;
  
  // Resistance decreases (parallel circuits)
  this.totalResistance /= capacityMultiplier;
  this.totalReactance /= capacityMultiplier;
  
  // Calculate upgrade cost (full construction cost of new circuit)
  this.upgradeCost = this.constructionCostPerKm * this.lengthKm;
  this.lastUpgradeDate = new Date();
  
  return this.save();
};

/**
 * Perform line maintenance
 * 
 * @param type - Maintenance type
 * @param durationDays - Duration in days
 * @param cost - Maintenance cost
 * @returns Updated transmission line
 * 
 * @example
 * await line.performMaintenance('Inspection', 2, 50000);
 */
TransmissionLineSchema.methods.performMaintenance = async function(
  this: ITransmissionLine,
  type: 'Inspection' | 'Repair' | 'Upgrade' | 'Emergency',
  durationDays: number,
  cost: number
): Promise<ITransmissionLine> {
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
  
  this.maintenanceHistory.push(maintenanceRecord);
  
  // Set status
  if (type === 'Emergency') {
    this.status = 'Emergency';
    this.outageHoursPerYear += durationDays * 24;
  } else {
    this.status = 'Maintenance';
  }
  
  // Schedule next inspection (1 year for normal, 6 months for older lines)
  if (type === 'Inspection') {
    const nextDate = new Date(endDate);
    const monthsToNext = this.yearsInService > 20 ? 6 : 12;
    nextDate.setMonth(nextDate.getMonth() + monthsToNext);
    this.nextInspectionDate = nextDate;
  }
  
  // Repairs can improve reliability
  if (type === 'Repair') {
    this.reliabilityFactor = Math.min(1.0, this.reliabilityFactor + 0.05);
  }
  
  return this.save();
};

/**
 * Check if line is overloaded
 * 
 * @returns True if exceeding summer rating
 * 
 * @example
 * if (line.isOverloaded()) { console.log('Congestion alert!'); }
 */
TransmissionLineSchema.methods.isOverloaded = function(this: ITransmissionLine): boolean {
  return this.currentLoadMW > this.summerRatingMW;
};

/**
 * Check if line can handle additional load
 * 
 * @param powerMW - Power to transmit
 * @param season - Current season
 * @returns True if capacity available
 * 
 * @example
 * if (line.canHandle(200, 'Summer')) { await line.updateLoad(currentLoad + 200); }
 */
TransmissionLineSchema.methods.canHandle = function(
  this: ITransmissionLine,
  powerMW: number,
  season: 'Summer' | 'Winter' = 'Summer'
): boolean {
  const rating = season === 'Summer' ? this.summerRatingMW : this.winterRatingMW;
  return this.currentLoadMW + powerMW <= rating;
};

/**
 * Calculate transmission efficiency
 * 
 * @returns Efficiency percentage (100 - loss%)
 * 
 * @example
 * const efficiency = line.getEfficiency(); // 97.5%
 */
TransmissionLineSchema.methods.getEfficiency = function(this: ITransmissionLine): number {
  return 100 - this.lossPercentage;
};

/**
 * Get comprehensive line metrics
 * 
 * @returns Line performance metrics
 * 
 * @example
 * const metrics = line.getLineMetrics();
 */
TransmissionLineSchema.methods.getLineMetrics = function(this: ITransmissionLine) {
  let congestionRisk: 'Low' | 'Medium' | 'High';
  
  if (this.utilizationPercent < 70) congestionRisk = 'Low';
  else if (this.utilizationPercent < 90) congestionRisk = 'Medium';
  else congestionRisk = 'High';
  
  return {
    capacity: this.summerRatingMW,
    utilization: this.utilizationPercent,
    loss: this.lossPercentage,
    reliability: this.reliabilityFactor,
    congestionRisk,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Calculate totals and update reliability
 */
TransmissionLineSchema.pre('save', function(this: ITransmissionLine, next) {
  // Calculate total resistance and reactance
  this.totalResistance = this.resistancePerKm * this.lengthKm;
  this.totalReactance = this.reactancePerKm * this.lengthKm;
  
  // Update years in service
  const ageMs = new Date().getTime() - this.constructionDate.getTime();
  this.yearsInService = ageMs / (1000 * 60 * 60 * 24 * 365);
  
  // Calculate reliability degradation (1% per 5 years)
  const ageDegradation = Math.min(0.20, this.yearsInService * 0.002);
  this.reliabilityFactor = Math.max(0.80, 1.0 - ageDegradation);
  
  next();
});

// ================== MODEL ==================

export const TransmissionLine: Model<ITransmissionLine> = 
  mongoose.models.TransmissionLine || 
  mongoose.model<ITransmissionLine>('TransmissionLine', TransmissionLineSchema);

export default TransmissionLine;
