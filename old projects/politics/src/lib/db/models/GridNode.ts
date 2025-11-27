/**
 * @fileoverview GridNode Model - Electrical Grid Substation & Distribution Points
 * 
 * OVERVIEW:
 * Manages grid nodes (substations, transformers, distribution points) that serve as interconnection
 * points in the electrical grid. Tracks voltage transformation, load balancing, voltage regulation,
 * blackout risk calculations, and power flow distribution. Enables realistic grid topology gameplay
 * with stability constraints and failure cascades.
 * 
 * KEY FEATURES:
 * - 4 node types: Generation (power plant connection), Transmission (bulk power transfer),
 *   Distribution (step-down to local grids), Interconnection (tie between regions)
 * - Voltage transformation (e.g., 345kV → 138kV → 13.8kV)
 * - Load balancing across connected lines
 * - Voltage regulation (maintain ±5% tolerance)
 * - Blackout risk calculation based on N-1 contingency
 * - Power flow tracking (incoming vs outgoing)
 * - Transformer capacity and losses
 * 
 * NODE TYPES & VOLTAGE LEVELS:
 * - Generation: 13.8kV-24kV (generator output) → Transmission voltage
 * - Transmission: 115kV-765kV high-voltage interconnections
 * - Distribution: 13.8kV-69kV medium-voltage local distribution
 * - Interconnection: Connect multiple transmission systems
 * 
 * LOAD BALANCING:
 * - Equal distribution across available lines
 * - N-1 contingency: Can handle loss of largest line
 * - Automatic load shedding if capacity exceeded
 * - Priority loads (hospitals, critical infrastructure)
 * 
 * BLACKOUT RISK FACTORS:
 * - Overload percentage (>100% = critical risk)
 * - N-1 contingency compliance (can survive largest outage?)
 * - Voltage deviation from nominal (>±5% = unstable)
 * - Number of redundant paths
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ================== TYPES & ENUMS ==================

/**
 * Grid node types
 */
export type NodeType =
  | 'Generation'      // Power plant connection point
  | 'Transmission'    // High-voltage bulk transfer substation
  | 'Distribution'    // Step-down to local distribution
  | 'Interconnection'; // Regional tie point

/**
 * Node status
 */
export type NodeStatus =
  | 'Online'       // Operating normally
  | 'Overloaded'   // Exceeding capacity
  | 'Emergency'    // Emergency conditions (voltage collapse, etc.)
  | 'Offline'      // Not in service
  | 'Maintenance'; // Scheduled maintenance

/**
 * Voltage regulation status
 */
export type VoltageStatus =
  | 'Normal'     // Within ±5% of nominal
  | 'Low'        // Below -5%
  | 'High'       // Above +5%
  | 'Critical';  // Beyond ±10%

/**
 * Connected line reference
 */
export interface IConnectedLine {
  lineId: Types.ObjectId;      // TransmissionLine reference
  direction: 'Incoming' | 'Outgoing' | 'Bidirectional';
  currentFlowMW: number;        // Current power flow (MW)
  maxCapacityMW: number;        // Line capacity (MW)
}

// ================== INTERFACE ==================

/**
 * GridNode document interface
 */
export interface IGridNode extends Document {
  // Core Identification
  _id: Types.ObjectId;
  company: Types.ObjectId;
  name: string;
  nodeType: NodeType;
  location: {
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Voltage Characteristics
  nominalVoltageKV: number;     // Nominal voltage (kV)
  currentVoltageKV: number;     // Actual voltage (kV)
  voltageDeviation: number;     // % deviation from nominal
  voltageStatus: VoltageStatus;
  
  // Transformer Capacity
  transformerCapacityMVA: number; // Transformer rating (MVA)
  transformerEfficiency: number;   // Transformer efficiency (%)
  transformerLossMW: number;       // Current transformer losses (MW)
  
  // Power Flow
  totalIncomingMW: number;      // Sum of incoming power
  totalOutgoingMW: number;      // Sum of outgoing power + local load
  localLoadMW: number;          // Load served at this node
  netFlowMW: number;            // Incoming - Outgoing
  
  // Connected Infrastructure
  connectedLines: IConnectedLine[];  // Connected transmission lines
  connectedPlants: Types.ObjectId[]; // PowerPlant references (if Generation node)
  
  // Load Balancing & Stability
  utilizationPercent: number;   // Current load / transformer capacity
  redundancyFactor: number;     // Number of redundant paths
  n1Contingency: boolean;       // Can survive largest line outage?
  blackoutRisk: number;         // Risk score (0-100%)
  
  // Reliability
  yearsInService: number;
  averageOutageHoursPerYear: number;
  lastOutageDate?: Date;
  
  // Status
  status: NodeStatus;
  priorityLoad: boolean;        // Critical infrastructure node
  
  // Costs
  constructionCost: number;
  annualMaintenanceCost: number;
  
  // Timestamps
  commissionedDate: Date;
  
  // Methods
  updateVoltage(voltageKV: number): Promise<IGridNode>;
  balanceLoad(): Promise<IGridNode>;
  addLine(lineId: Types.ObjectId, direction: 'Incoming' | 'Outgoing' | 'Bidirectional', capacityMW: number): Promise<IGridNode>;
  removeLine(lineId: Types.ObjectId): Promise<IGridNode>;
  calculateBlackoutRisk(): number;
  checkN1Contingency(): boolean;
  regulateVoltage(): Promise<IGridNode>;
  shedLoad(amountMW: number): Promise<IGridNode>;
  isStable(): boolean;
  canHandleLoad(loadMW: number): boolean;
  getNodeMetrics(): {
    voltage: number;
    utilization: number;
    blackoutRisk: number;
    n1Compliant: boolean;
    stability: 'Stable' | 'Unstable' | 'Critical';
  };
}

// ================== SCHEMA ==================

const ConnectedLineSchema = new Schema<IConnectedLine>(
  {
    lineId: {
      type: Schema.Types.ObjectId,
      ref: 'TransmissionLine',
      required: true,
    },
    direction: {
      type: String,
      enum: ['Incoming', 'Outgoing', 'Bidirectional'],
      required: true,
    },
    currentFlowMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxCapacityMW: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const GridNodeSchema = new Schema<IGridNode>(
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
    nodeType: {
      type: String,
      enum: ['Generation', 'Transmission', 'Distribution', 'Interconnection'],
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
    
    // Voltage Characteristics
    nominalVoltageKV: {
      type: Number,
      required: true,
      min: 1,
    },
    currentVoltageKV: {
      type: Number,
      required: true,
      min: 0,
    },
    voltageDeviation: {
      type: Number,
      default: 0,
      min: -100,
      max: 100,
    },
    voltageStatus: {
      type: String,
      enum: ['Normal', 'Low', 'High', 'Critical'],
      default: 'Normal',
    },
    
    // Transformer Capacity
    transformerCapacityMVA: {
      type: Number,
      required: true,
      min: 1,
    },
    transformerEfficiency: {
      type: Number,
      default: 98.5,
      min: 90,
      max: 100,
    },
    transformerLossMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Power Flow
    totalIncomingMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOutgoingMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    localLoadMW: {
      type: Number,
      default: 0,
      min: 0,
    },
    netFlowMW: {
      type: Number,
      default: 0,
    },
    
    // Connected Infrastructure
    connectedLines: {
      type: [ConnectedLineSchema],
      default: [],
    },
    connectedPlants: {
      type: [Schema.Types.ObjectId],
      ref: 'PowerPlant',
      default: [],
    },
    
    // Load Balancing & Stability
    utilizationPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    redundancyFactor: {
      type: Number,
      default: 0,
      min: 0,
    },
    n1Contingency: {
      type: Boolean,
      default: false,
    },
    blackoutRisk: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Reliability
    yearsInService: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageOutageHoursPerYear: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOutageDate: {
      type: Date,
      default: undefined,
    },
    
    // Status
    status: {
      type: String,
      enum: ['Online', 'Overloaded', 'Emergency', 'Offline', 'Maintenance'],
      default: 'Online',
      index: true,
    },
    priorityLoad: {
      type: Boolean,
      default: false,
    },
    
    // Costs
    constructionCost: {
      type: Number,
      required: true,
      min: 0,
    },
    annualMaintenanceCost: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Timestamps
    commissionedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'gridnodes',
  }
);

// ================== INDEXES ==================

GridNodeSchema.index({ company: 1, status: 1 });
GridNodeSchema.index({ nodeType: 1, 'location.state': 1 });
GridNodeSchema.index({ blackoutRisk: -1 });
GridNodeSchema.index({ status: 1, blackoutRisk: -1 });

// ================== INSTANCE METHODS ==================

/**
 * Update node voltage and check regulation
 * 
 * @param voltageKV - New voltage level (kV)
 * @returns Updated grid node
 * 
 * @example
 * await node.updateVoltage(347.2); // Slightly above 345kV nominal
 */
GridNodeSchema.methods.updateVoltage = async function(
  this: IGridNode,
  voltageKV: number
): Promise<IGridNode> {
  this.currentVoltageKV = voltageKV;
  
  // Calculate deviation
  this.voltageDeviation = ((voltageKV - this.nominalVoltageKV) / this.nominalVoltageKV) * 100;
  
  // Determine voltage status
  const absDeviation = Math.abs(this.voltageDeviation);
  
  if (absDeviation <= 5) {
    this.voltageStatus = 'Normal';
  } else if (absDeviation <= 10) {
    this.voltageStatus = this.voltageDeviation > 0 ? 'High' : 'Low';
  } else {
    this.voltageStatus = 'Critical';
    this.status = 'Emergency';
  }
  
  return this.save();
};

/**
 * Balance load across connected outgoing lines
 * 
 * @returns Updated grid node
 * 
 * @example
 * await node.balanceLoad();
 */
GridNodeSchema.methods.balanceLoad = async function(
  this: IGridNode
): Promise<IGridNode> {
  // Calculate total incoming power
  const incomingLines = this.connectedLines.filter(l => 
    l.direction === 'Incoming' || l.direction === 'Bidirectional'
  );
  this.totalIncomingMW = incomingLines.reduce((sum, line) => sum + line.currentFlowMW, 0);
  
  // Account for transformer losses
  this.transformerLossMW = this.totalIncomingMW * (1 - this.transformerEfficiency / 100);
  const availableMW = this.totalIncomingMW - this.transformerLossMW;
  
  // Subtract local load
  const flowToDistribute = Math.max(0, availableMW - this.localLoadMW);
  
  // Get outgoing lines
  const outgoingLines = this.connectedLines.filter(l => 
    l.direction === 'Outgoing' || l.direction === 'Bidirectional'
  );
  
  if (outgoingLines.length > 0) {
    // Calculate total outgoing capacity
    const totalCapacity = outgoingLines.reduce((sum, line) => sum + line.maxCapacityMW, 0);
    
    // Distribute proportionally to capacity
    outgoingLines.forEach(line => {
      const proportion = line.maxCapacityMW / totalCapacity;
      line.currentFlowMW = flowToDistribute * proportion;
    });
    
    this.totalOutgoingMW = outgoingLines.reduce((sum, line) => sum + line.currentFlowMW, 0);
  } else {
    this.totalOutgoingMW = 0;
  }
  
  // Calculate net flow
  this.netFlowMW = this.totalIncomingMW - this.totalOutgoingMW - this.localLoadMW;
  
  // Update utilization
  const totalLoad = this.totalOutgoingMW + this.localLoadMW;
  this.utilizationPercent = (totalLoad / this.transformerCapacityMVA) * 100;
  
  // Check for overload
  if (this.utilizationPercent > 100) {
    this.status = 'Overloaded';
  } else if (this.status === 'Overloaded') {
    this.status = 'Online';
  }
  
  return this.save();
};

/**
 * Add connected transmission line
 * 
 * @param lineId - TransmissionLine ID
 * @param direction - Power flow direction
 * @param capacityMW - Line capacity
 * @returns Updated grid node
 * 
 * @example
 * await node.addLine(lineId, 'Incoming', 500);
 */
GridNodeSchema.methods.addLine = async function(
  this: IGridNode,
  lineId: Types.ObjectId,
  direction: 'Incoming' | 'Outgoing' | 'Bidirectional',
  capacityMW: number
): Promise<IGridNode> {
  // Check if line already connected
  const existingLine = this.connectedLines.find(l => l.lineId.equals(lineId));
  if (existingLine) {
    throw new Error('Line already connected to this node');
  }
  
  // Add new connection
  this.connectedLines.push({
    lineId,
    direction,
    currentFlowMW: 0,
    maxCapacityMW: capacityMW,
  });
  
  // Update redundancy factor
  this.redundancyFactor = this.connectedLines.length;
  
  // Rebalance load
  await this.balanceLoad();
  
  return this.save();
};

/**
 * Remove connected transmission line
 * 
 * @param lineId - TransmissionLine ID to remove
 * @returns Updated grid node
 * 
 * @example
 * await node.removeLine(lineId);
 */
GridNodeSchema.methods.removeLine = async function(
  this: IGridNode,
  lineId: Types.ObjectId
): Promise<IGridNode> {
  const index = this.connectedLines.findIndex(l => l.lineId.equals(lineId));
  
  if (index === -1) {
    throw new Error('Line not connected to this node');
  }
  
  this.connectedLines.splice(index, 1);
  
  // Update redundancy factor
  this.redundancyFactor = this.connectedLines.length;
  
  // Rebalance remaining lines
  await this.balanceLoad();
  
  return this.save();
};

/**
 * Calculate blackout risk score
 * 
 * @returns Risk score (0-100%)
 * 
 * @example
 * const risk = node.calculateBlackoutRisk();
 */
GridNodeSchema.methods.calculateBlackoutRisk = function(this: IGridNode): number {
  let risk = 0;
  
  // Factor 1: Overload risk (0-40 points)
  if (this.utilizationPercent > 100) {
    risk += 40;
  } else if (this.utilizationPercent > 90) {
    risk += 30;
  } else if (this.utilizationPercent > 80) {
    risk += 20;
  }
  
  // Factor 2: Voltage deviation (0-30 points)
  const absDeviation = Math.abs(this.voltageDeviation);
  if (absDeviation > 10) {
    risk += 30;
  } else if (absDeviation > 5) {
    risk += 15;
  }
  
  // Factor 3: N-1 contingency (0-20 points)
  if (!this.n1Contingency) {
    risk += 20;
  }
  
  // Factor 4: Redundancy (0-10 points)
  if (this.redundancyFactor < 2) {
    risk += 10;
  } else if (this.redundancyFactor < 3) {
    risk += 5;
  }
  
  return Math.min(100, risk);
};

/**
 * Check N-1 contingency compliance
 * 
 * @returns True if can survive largest line outage
 * 
 * @example
 * const compliant = node.checkN1Contingency();
 */
GridNodeSchema.methods.checkN1Contingency = function(this: IGridNode): boolean {
  if (this.connectedLines.length < 2) {
    return false; // Need at least 2 lines for redundancy
  }
  
  // Find largest line capacity
  const largestCapacity = Math.max(...this.connectedLines.map(l => l.maxCapacityMW));
  
  // Calculate remaining capacity after largest line outage
  const totalCapacity = this.connectedLines.reduce((sum, line) => sum + line.maxCapacityMW, 0);
  const remainingCapacity = totalCapacity - largestCapacity;
  
  // Check if remaining capacity can handle current load
  const currentLoad = this.totalOutgoingMW + this.localLoadMW;
  
  return remainingCapacity >= currentLoad;
};

/**
 * Regulate voltage to nominal level
 * 
 * @returns Updated grid node
 * 
 * @example
 * await node.regulateVoltage();
 */
GridNodeSchema.methods.regulateVoltage = async function(
  this: IGridNode
): Promise<IGridNode> {
  // Bring voltage back to nominal (simplified - in reality uses tap changers)
  const targetVoltage = this.nominalVoltageKV;
  
  // Gradual adjustment (can't instantly change)
  const delta = targetVoltage - this.currentVoltageKV;
  const adjustment = delta * 0.5; // Adjust 50% of deviation
  
  await this.updateVoltage(this.currentVoltageKV + adjustment);
  
  return this.save();
};

/**
 * Shed load to prevent overload
 * 
 * @param amountMW - Amount of load to shed (MW)
 * @returns Updated grid node
 * 
 * @example
 * await node.shedLoad(50); // Shed 50 MW of non-priority load
 */
GridNodeSchema.methods.shedLoad = async function(
  this: IGridNode,
  amountMW: number
): Promise<IGridNode> {
  if (this.priorityLoad) {
    throw new Error('Cannot shed load from priority node');
  }
  
  this.localLoadMW = Math.max(0, this.localLoadMW - amountMW);
  
  // Rebalance after load shedding
  await this.balanceLoad();
  
  return this.save();
};

/**
 * Check if node is stable
 * 
 * @returns True if voltage normal and not overloaded
 * 
 * @example
 * if (node.isStable()) { console.log('Grid stable'); }
 */
GridNodeSchema.methods.isStable = function(this: IGridNode): boolean {
  return this.voltageStatus === 'Normal' && this.utilizationPercent <= 100;
};

/**
 * Check if node can handle additional load
 * 
 * @param loadMW - Additional load (MW)
 * @returns True if capacity available
 * 
 * @example
 * if (node.canHandleLoad(100)) { node.localLoadMW += 100; }
 */
GridNodeSchema.methods.canHandleLoad = function(
  this: IGridNode,
  loadMW: number
): boolean {
  const currentLoad = this.totalOutgoingMW + this.localLoadMW;
  const newLoad = currentLoad + loadMW;
  return newLoad <= this.transformerCapacityMVA;
};

/**
 * Get comprehensive node metrics
 * 
 * @returns Node performance metrics
 * 
 * @example
 * const metrics = node.getNodeMetrics();
 */
GridNodeSchema.methods.getNodeMetrics = function(this: IGridNode) {
  let stability: 'Stable' | 'Unstable' | 'Critical';
  
  if (this.blackoutRisk < 30) stability = 'Stable';
  else if (this.blackoutRisk < 60) stability = 'Unstable';
  else stability = 'Critical';
  
  return {
    voltage: this.voltageDeviation,
    utilization: this.utilizationPercent,
    blackoutRisk: this.blackoutRisk,
    n1Compliant: this.n1Contingency,
    stability,
  };
};

// ================== PRE-SAVE HOOKS ==================

/**
 * Pre-save hook: Update blackout risk and N-1 contingency
 */
GridNodeSchema.pre('save', function(this: IGridNode, next) {
  // Update years in service
  const ageMs = new Date().getTime() - this.commissionedDate.getTime();
  this.yearsInService = ageMs / (1000 * 60 * 60 * 24 * 365);
  
  // Calculate blackout risk
  this.blackoutRisk = this.calculateBlackoutRisk();
  
  // Check N-1 contingency
  this.n1Contingency = this.checkN1Contingency();
  
  next();
});

// ================== MODEL ==================

export const GridNode: Model<IGridNode> = 
  mongoose.models.GridNode || 
  mongoose.model<IGridNode>('GridNode', GridNodeSchema);

export default GridNode;
