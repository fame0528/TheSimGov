/**
 * @file GridNode.ts
 * @description Enhanced GridNode model – electrical grid node / substation with operational & stability metrics
 * @created 2025-11-28
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Represents a grid node (generation tie, transmission substation, distribution node, or regional interconnection)
 * combining legacy stability analytics (voltage, transformer efficiency, redundancy, blackout risk) with
 * real-time operational fields required by current Phase 3.1 endpoints (currentDemand, currentGeneration, frequency,
 * capacity, lastBalanceDate, lastLoadManagementDate). Methods provide voltage regulation, load balancing, risk
 * assessment, and operational state updates used by balancing and load management endpoints.
 *
 * KEY CAPABILITIES:
 * - Node classification (Generation / Transmission / Distribution / Interconnection)
 * - Voltage deviation monitoring & status classification (Normal / Low / High / Critical)
 * - Transformer utilization, losses & overload detection
 * - N-1 contingency & redundancy tracking for blackout risk scoring
 * - Real-time operational fields for balancing & demand response (currentDemand, currentGeneration, frequency)
 * - Frequency & imbalance derived metrics (simplified AGC model)
 * - Load management timestamps & balancing action support
 *
 * DESIGN NOTES:
 * - No duplicate Mongoose indexes (single-field + distinct compound indexes only)
 * - company field uses simple index; compound indexes add status / blackoutRisk dimensions
 * - Operational additions are additive; legacy analytical methods preserved for future dashboard use
 * - Frequency kept as simple numeric (Hz) – future enhancement may store historical traces externally
 *
 * USAGE EXAMPLE:
 * ```ts
 * import { GridNode } from '@/lib/db/models';
 * const node = await GridNode.create({
 *   company: companyId,
 *   name: 'Western Intertie A',
 *   nodeType: 'Transmission',
 *   location: { city: 'Denver', state: 'CO' },
 *   nominalVoltageKV: 345,
 *   currentVoltageKV: 344.5,
 *   transformerCapacityMVA: 1200,
 *   constructionCost: 250_000_000,
 *   annualMaintenanceCost: 3_500_000,
 *   capacityMW: 1100,
 *   currentDemand: 825,
 *   currentGeneration: 830,
 *   frequency: 60.002
 * });
 * const metrics = node.getNodeMetrics();
 * ```
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================================================
// ENUM & SUB-DOCUMENT TYPES
// ============================================================================

export type NodeType = 'Generation' | 'Transmission' | 'Distribution' | 'Interconnection';
export type NodeStatus = 'Online' | 'Overloaded' | 'Emergency' | 'Offline' | 'Maintenance';
export type VoltageStatus = 'Normal' | 'Low' | 'High' | 'Critical';

export interface IConnectedLine {
  lineId: Types.ObjectId;
  direction: 'Incoming' | 'Outgoing' | 'Bidirectional';
  currentFlowMW: number;
  maxCapacityMW: number;
}

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IGridNode extends Document {
  company: Types.ObjectId;
  name: string;
  nodeType: NodeType;
  location: { city: string; state: string; coordinates?: { lat: number; lng: number } };

  // Voltage & transformer analytics
  nominalVoltageKV: number;
  currentVoltageKV: number;
  voltageDeviation: number;
  voltageStatus: VoltageStatus;
  transformerCapacityMVA: number;
  transformerEfficiency: number;
  transformerLossMW: number;

  // Power flow & connected infrastructure
  totalIncomingMW: number;
  totalOutgoingMW: number;
  localLoadMW: number;
  netFlowMW: number;
  connectedLines: IConnectedLine[];
  connectedPlants: Types.ObjectId[];

  // Stability & risk
  utilizationPercent: number;
  redundancyFactor: number;
  n1Contingency: boolean;
  blackoutRisk: number;

  // Reliability
  yearsInService: number;
  averageOutageHoursPerYear: number;
  lastOutageDate?: Date;
  status: NodeStatus;
  priorityLoad: boolean;

  // Economic
  constructionCost: number;
  annualMaintenanceCost: number;
  commissionedDate: Date;

  // ------------------------------------------------------------------------
  // Operational (Phase 3.1 specific additions)
  // ------------------------------------------------------------------------
  capacityMW: number;                // Rated deliverable capacity (MW)
  currentDemand: number;             // Real-time demand (MW)
  currentGeneration: number;         // Real-time generation available (MW)
  frequency: number;                 // System frequency estimate (Hz)
  lastBalanceDate?: Date;            // Last balancing operation timestamp
  lastLoadManagementDate?: Date;     // Last load management action timestamp

  // Methods
  updateVoltage(v: number): Promise<IGridNode>;
  balanceLoad(): Promise<IGridNode>;
  addLine(lineId: Types.ObjectId, direction: 'Incoming' | 'Outgoing' | 'Bidirectional', capacityMW: number): Promise<IGridNode>;
  removeLine(lineId: Types.ObjectId): Promise<IGridNode>;
  calculateBlackoutRisk(): number;
  checkN1Contingency(): boolean;
  regulateVoltage(): Promise<IGridNode>;
  shedLoad(amountMW: number): Promise<IGridNode>;
  isStable(): boolean;
  canHandleLoad(loadMW: number): boolean;
  updateOperationalState(demandMW: number, generationMW: number, frequencyHz: number): Promise<IGridNode>;
  getNodeMetrics(): {
    voltage: number;
    utilization: number;
    blackoutRisk: number;
    n1Compliant: boolean;
    stability: 'Stable' | 'Unstable' | 'Critical';
    demandMW: number;
    generationMW: number;
    capacityMW: number;
    frequency: number;
  };
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const ConnectedLineSchema = new Schema<IConnectedLine>({
  lineId: { type: Schema.Types.ObjectId, ref: 'TransmissionLine', required: true },
  direction: { type: String, enum: ['Incoming', 'Outgoing', 'Bidirectional'], required: true },
  currentFlowMW: { type: Number, default: 0, min: 0 },
  maxCapacityMW: { type: Number, required: true, min: 0 }
}, { _id: false });

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const GridNodeSchema = new Schema<IGridNode>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  nodeType: { type: String, enum: ['Generation', 'Transmission', 'Distribution', 'Interconnection'], required: true, index: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: { lat: { type: Number }, lng: { type: Number } }
  },
  nominalVoltageKV: { type: Number, required: true, min: 1 },
  currentVoltageKV: { type: Number, required: true, min: 0 },
  voltageDeviation: { type: Number, default: 0 },
  voltageStatus: { type: String, enum: ['Normal', 'Low', 'High', 'Critical'], default: 'Normal' },
  transformerCapacityMVA: { type: Number, required: true, min: 1 },
  transformerEfficiency: { type: Number, default: 98.5, min: 85, max: 100 },
  transformerLossMW: { type: Number, default: 0, min: 0 },
  totalIncomingMW: { type: Number, default: 0, min: 0 },
  totalOutgoingMW: { type: Number, default: 0, min: 0 },
  localLoadMW: { type: Number, default: 0, min: 0 },
  netFlowMW: { type: Number, default: 0 },
  connectedLines: { type: [ConnectedLineSchema], default: [] },
  connectedPlants: { type: [Schema.Types.ObjectId], ref: 'PowerPlant', default: [] },
  utilizationPercent: { type: Number, default: 0, min: 0 },
  redundancyFactor: { type: Number, default: 0, min: 0 },
  n1Contingency: { type: Boolean, default: false },
  blackoutRisk: { type: Number, default: 0, min: 0, max: 100 },
  yearsInService: { type: Number, default: 0, min: 0 },
  averageOutageHoursPerYear: { type: Number, default: 0, min: 0 },
  lastOutageDate: { type: Date },
  status: { type: String, enum: ['Online', 'Overloaded', 'Emergency', 'Offline', 'Maintenance'], default: 'Online', index: true },
  priorityLoad: { type: Boolean, default: false },
  constructionCost: { type: Number, required: true, min: 0 },
  annualMaintenanceCost: { type: Number, required: true, min: 0 },
  commissionedDate: { type: Date, default: Date.now },
  // Operational additions
  capacityMW: { type: Number, required: true, min: 1 },
  currentDemand: { type: Number, default: 0, min: 0 },
  currentGeneration: { type: Number, default: 0, min: 0 },
  frequency: { type: Number, default: 60.0, min: 0 },
  lastBalanceDate: { type: Date },
  lastLoadManagementDate: { type: Date }
}, { timestamps: true, collection: 'gridnodes' });

// ============================================================================
// INDEXES (avoid duplicate single-field definitions)
// ============================================================================
GridNodeSchema.index({ company: 1, status: 1 });
GridNodeSchema.index({ nodeType: 1, blackoutRisk: -1 });
GridNodeSchema.index({ blackoutRisk: -1 });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

GridNodeSchema.methods.updateVoltage = async function (this: IGridNode, voltageKV: number) {
  this.currentVoltageKV = voltageKV;
  this.voltageDeviation = ((voltageKV - this.nominalVoltageKV) / this.nominalVoltageKV) * 100;
  const absDev = Math.abs(this.voltageDeviation);
  if (absDev <= 5) this.voltageStatus = 'Normal';
  else if (absDev <= 10) this.voltageStatus = this.voltageDeviation > 0 ? 'High' : 'Low';
  else { this.voltageStatus = 'Critical'; this.status = 'Emergency'; }
  return this.save();
};

GridNodeSchema.methods.balanceLoad = async function (this: IGridNode) {
  const incoming = this.connectedLines.filter(l => l.direction !== 'Outgoing');
  this.totalIncomingMW = incoming.reduce((s, l) => s + l.currentFlowMW, 0);
  this.transformerLossMW = this.totalIncomingMW * (1 - this.transformerEfficiency / 100);
  const availableMW = this.totalIncomingMW - this.transformerLossMW;
  const flowToDistribute = Math.max(0, availableMW - this.localLoadMW);
  const outgoing = this.connectedLines.filter(l => l.direction !== 'Incoming');
  if (outgoing.length) {
    const totalCap = outgoing.reduce((s, l) => s + l.maxCapacityMW, 0);
    outgoing.forEach(line => { line.currentFlowMW = flowToDistribute * (line.maxCapacityMW / totalCap); });
  }
  this.totalOutgoingMW = outgoing.reduce((s, l) => s + l.currentFlowMW, 0);
  this.netFlowMW = this.totalIncomingMW - this.totalOutgoingMW - this.localLoadMW;
  const totalLoad = this.totalOutgoingMW + this.localLoadMW;
  this.utilizationPercent = (totalLoad / this.transformerCapacityMVA) * 100;
  if (this.utilizationPercent > 100) this.status = 'Overloaded'; else if (this.status === 'Overloaded') this.status = 'Online';
  return this.save();
};

GridNodeSchema.methods.addLine = async function (this: IGridNode, lineId: Types.ObjectId, direction: 'Incoming' | 'Outgoing' | 'Bidirectional', capacityMW: number) {
  if (this.connectedLines.find(l => l.lineId.equals(lineId))) throw new Error('Line already connected');
  this.connectedLines.push({ lineId, direction, currentFlowMW: 0, maxCapacityMW: capacityMW });
  this.redundancyFactor = this.connectedLines.length;
  await this.balanceLoad();
  return this.save();
};

GridNodeSchema.methods.removeLine = async function (this: IGridNode, lineId: Types.ObjectId) {
  const idx = this.connectedLines.findIndex(l => l.lineId.equals(lineId));
  if (idx === -1) throw new Error('Line not connected');
  this.connectedLines.splice(idx, 1);
  this.redundancyFactor = this.connectedLines.length;
  await this.balanceLoad();
  return this.save();
};

GridNodeSchema.methods.calculateBlackoutRisk = function (this: IGridNode) {
  let risk = 0;
  if (this.utilizationPercent > 100) risk += 40; else if (this.utilizationPercent > 90) risk += 30; else if (this.utilizationPercent > 80) risk += 20;
  const absDev = Math.abs(this.voltageDeviation); if (absDev > 10) risk += 30; else if (absDev > 5) risk += 15;
  if (!this.n1Contingency) risk += 20;
  if (this.redundancyFactor < 2) risk += 10; else if (this.redundancyFactor < 3) risk += 5;
  return Math.min(100, risk);
};

GridNodeSchema.methods.checkN1Contingency = function (this: IGridNode) {
  if (this.connectedLines.length < 2) return false;
  const largest = Math.max(...this.connectedLines.map(l => l.maxCapacityMW));
  const remaining = this.connectedLines.reduce((s, l) => s + l.maxCapacityMW, 0) - largest;
  const currentLoad = this.totalOutgoingMW + this.localLoadMW;
  return remaining >= currentLoad;
};

GridNodeSchema.methods.regulateVoltage = async function (this: IGridNode) {
  const delta = this.nominalVoltageKV - this.currentVoltageKV;
  return this.updateVoltage(this.currentVoltageKV + delta * 0.5);
};

GridNodeSchema.methods.shedLoad = async function (this: IGridNode, amountMW: number) {
  if (this.priorityLoad) throw new Error('Cannot shed load from priority node');
  this.localLoadMW = Math.max(0, this.localLoadMW - amountMW);
  await this.balanceLoad();
  return this.save();
};

GridNodeSchema.methods.isStable = function (this: IGridNode) {
  return this.voltageStatus === 'Normal' && this.utilizationPercent <= 100 && this.blackoutRisk < 60;
};

GridNodeSchema.methods.canHandleLoad = function (this: IGridNode, loadMW: number) {
  const projected = this.totalOutgoingMW + this.localLoadMW + loadMW;
  return projected <= this.transformerCapacityMVA && projected <= this.capacityMW;
};

GridNodeSchema.methods.updateOperationalState = async function (this: IGridNode, demandMW: number, generationMW: number, frequencyHz: number) {
  this.currentDemand = demandMW;
  this.currentGeneration = generationMW;
  this.frequency = frequencyHz;
  this.lastBalanceDate = new Date();
  return this.save();
};

GridNodeSchema.methods.getNodeMetrics = function (this: IGridNode) {
  let stability: 'Stable' | 'Unstable' | 'Critical';
  if (this.blackoutRisk < 30) stability = 'Stable'; else if (this.blackoutRisk < 60) stability = 'Unstable'; else stability = 'Critical';
  return {
    voltage: this.voltageDeviation,
    utilization: this.utilizationPercent,
    blackoutRisk: this.blackoutRisk,
    n1Compliant: this.n1Contingency,
    stability,
    demandMW: this.currentDemand,
    generationMW: this.currentGeneration,
    capacityMW: this.capacityMW,
    frequency: this.frequency
  };
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================
GridNodeSchema.pre('save', function (this: IGridNode, next) {
  const ageMs = Date.now() - this.commissionedDate.getTime();
  this.yearsInService = ageMs / (1000 * 60 * 60 * 24 * 365);
  this.blackoutRisk = this.calculateBlackoutRisk();
  this.n1Contingency = this.checkN1Contingency();
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================
export const GridNode: Model<IGridNode> = mongoose.models.GridNode || mongoose.model<IGridNode>('GridNode', GridNodeSchema);
export default GridNode;

/**
 * IMPLEMENTATION NOTES:
 * 1. Frequency & Imbalance: Balancing endpoint derives frequency externally; model simply stores latest value.
 * 2. Capacity vs Transformer MVA: capacityMW expresses deliverable grid capacity; transformerCapacityMVA retains legacy transformer rating.
 * 3. Index Hygiene: No duplicate single-field index definitions; company indexed once; compound indexes extend query capability.
 * 4. Future Enhancements: Add historical sub-doc for balancing actions, telemetry time-series persistence layer.
 */