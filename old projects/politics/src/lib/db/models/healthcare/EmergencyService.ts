/**
 * @file src/lib/db/models/healthcare/EmergencyService.ts
 * @description Emergency service schema for Healthcare Industry - ER events and surge capacity
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Emergency service model tracking ER events, surge capacity, mass casualty incidents, and emergency response
 * with comprehensive triage, resource mobilization, patient disposition, and performance metrics.
 * 
 * EXTENDS: Energy grid emergency (85% pattern reuse)
 * KEY FEATURES: Triage distribution, surge capacity, patient disposition, response metrics
 * 
 * USAGE:
 * ```typescript
 * const emergency = await EmergencyService.create({
 *   hospital: hospitalId, company: companyId, eventType: 'Mass Casualty',
 *   severity: 'Critical', patientsAffected: 25, status: 'Active',
 *   triageDistribution: { red: 8, yellow: 12, green: 4, black: 1 }
 * });
 * await emergency.activateSurgeCapacity(15, 20, ['Portable X-Ray']);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export type EmergencyType = 'Mass Casualty' | 'Infectious Outbreak' | 'Natural Disaster' | 'Capacity Surge' | 'Equipment Failure' | 'Hazmat' | 'Active Shooter';
export type EmergencySeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';
export type EmergencyStatus = 'Active' | 'Contained' | 'Resolved' | 'Escalated';

export interface TriageDistribution {
  red: number;
  yellow: number;
  green: number;
  black: number;
}

export interface DispositionCounts {
  admitted: number;
  transferred: number;
  discharged: number;
  deceased: number;
  pending: number;
}

export interface ResourceMobilization {
  staffCalled: number;
  staffArrived: number;
  bedsOpened: number;
  equipmentDeployed: string[];
  externalAssistance: string[];
}

export interface IEmergencyService extends Document {
  hospital: Types.ObjectId;
  company: Types.ObjectId;
  eventType: EmergencyType;
  severity: EmergencySeverity;
  description: string;
  startTime: Date;
  endTime?: Date;
  responseTime: number;
  duration?: number;
  status: EmergencyStatus;
  patientsAffected: number;
  triageDistribution: TriageDistribution;
  disposition: DispositionCounts;
  resources: ResourceMobilization;
  commandCenterActivated: boolean;
  incidentCommander?: Types.ObjectId;
  externalAgenciesNotified: string[];
  successfulStabilizations: number;
  complications: number;
  criticalSaves: number;
  resolutionNotes?: string;
  lessonsLearned?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  isActive: boolean;
  totalPatients: number;
  mortalityRate: number;
  responseEfficiency: number;
  
  activateSurgeCapacity(staff: number, beds: number, equipment?: string[]): Promise<void>;
  updateDisposition(type: keyof DispositionCounts, count: number): Promise<void>;
  recordPatientOutcome(triage: keyof TriageDistribution, outcome: 'Stabilized' | 'Complication' | 'Critical Save'): Promise<void>;
  escalate(reason: string): Promise<void>;
  resolveEmergency(notes: string): Promise<void>;
  calculateResponseEfficiency(): number;
}

const EmergencyServiceSchema = new Schema<IEmergencyService>(
  {
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    eventType: { type: String, required: true, enum: ['Mass Casualty', 'Infectious Outbreak', 'Natural Disaster', 'Capacity Surge', 'Equipment Failure', 'Hazmat', 'Active Shooter'], index: true },
    severity: { type: String, required: true, enum: ['Minor', 'Moderate', 'Major', 'Critical'], index: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    startTime: { type: Date, required: true, default: Date.now, index: true },
    endTime: Date,
    responseTime: { type: Number, required: true, default: 0, min: 0 },
    duration: { type: Number, min: 0 },
    status: { type: String, required: true, enum: ['Active', 'Contained', 'Resolved', 'Escalated'], default: 'Active', index: true },
    patientsAffected: { type: Number, required: true, default: 0, min: 0 },
    triageDistribution: {
      type: {
        red: { type: Number, required: true, default: 0, min: 0 },
        yellow: { type: Number, required: true, default: 0, min: 0 },
        green: { type: Number, required: true, default: 0, min: 0 },
        black: { type: Number, required: true, default: 0, min: 0 }
      },
      required: true
    },
    disposition: {
      type: {
        admitted: { type: Number, required: true, default: 0, min: 0 },
        transferred: { type: Number, required: true, default: 0, min: 0 },
        discharged: { type: Number, required: true, default: 0, min: 0 },
        deceased: { type: Number, required: true, default: 0, min: 0 },
        pending: { type: Number, required: true, default: 0, min: 0 }
      },
      required: true
    },
    resources: {
      type: {
        staffCalled: { type: Number, required: true, default: 0, min: 0 },
        staffArrived: { type: Number, required: true, default: 0, min: 0 },
        bedsOpened: { type: Number, required: true, default: 0, min: 0 },
        equipmentDeployed: [String],
        externalAssistance: [String]
      },
      required: true
    },
    commandCenterActivated: { type: Boolean, required: true, default: false },
    incidentCommander: { type: Schema.Types.ObjectId, ref: 'MedicalStaff' },
    externalAgenciesNotified: [String],
    successfulStabilizations: { type: Number, required: true, default: 0, min: 0 },
    complications: { type: Number, required: true, default: 0, min: 0 },
    criticalSaves: { type: Number, required: true, default: 0, min: 0 },
    resolutionNotes: { type: String, trim: true, maxlength: 2000 },
    lessonsLearned: [String]
  },
  { timestamps: true, collection: 'emergencyservices', toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EmergencyServiceSchema.index({ hospital: 1, status: 1 });

EmergencyServiceSchema.virtual('isActive').get(function(this: IEmergencyService) {
  return this.status === 'Active' || this.status === 'Escalated';
});

EmergencyServiceSchema.virtual('totalPatients').get(function(this: IEmergencyService) {
  const { red, yellow, green, black } = this.triageDistribution;
  return red + yellow + green + black;
});

EmergencyServiceSchema.virtual('mortalityRate').get(function(this: IEmergencyService) {
  const total = this.totalPatients;
  return total === 0 ? 0 : (this.disposition.deceased / total) * 100;
});

EmergencyServiceSchema.virtual('responseEfficiency').get(function(this: IEmergencyService) {
  return this.calculateResponseEfficiency();
});

EmergencyServiceSchema.pre<IEmergencyService>('save', function(next) {
  if (this.endTime && this.startTime) {
    const ms = new Date(this.endTime).getTime() - new Date(this.startTime).getTime();
    this.duration = Math.round(ms / (1000 * 60));
  }
  next();
});

EmergencyServiceSchema.methods.activateSurgeCapacity = async function(this: IEmergencyService, staff: number, beds: number, equipment?: string[]): Promise<void> {
  this.resources.staffCalled += staff;
  this.resources.staffArrived += Math.floor(staff * 0.8);
  this.resources.bedsOpened += beds;
  if (equipment && equipment.length > 0) this.resources.equipmentDeployed.push(...equipment);
  this.status = 'Contained';
  await this.save();
};

EmergencyServiceSchema.methods.updateDisposition = async function(this: IEmergencyService, type: keyof DispositionCounts, count: number): Promise<void> {
  this.disposition[type] += count;
  this.disposition.pending = Math.max(0, this.disposition.pending - count);
  await this.save();
};

EmergencyServiceSchema.methods.recordPatientOutcome = async function(this: IEmergencyService, _triage: keyof TriageDistribution, outcome: 'Stabilized' | 'Complication' | 'Critical Save'): Promise<void> {
  if (outcome === 'Stabilized') this.successfulStabilizations += 1;
  else if (outcome === 'Complication') this.complications += 1;
  else if (outcome === 'Critical Save') {
    this.criticalSaves += 1;
    this.successfulStabilizations += 1;
  }
  await this.save();
};

EmergencyServiceSchema.methods.escalate = async function(this: IEmergencyService, reason: string): Promise<void> {
  this.status = 'Escalated';
  this.resolutionNotes = this.resolutionNotes ? `${this.resolutionNotes}\n\nEscalated: ${reason}` : `Escalated: ${reason}`;
  if (this.severity !== 'Critical') {
    const severities: EmergencySeverity[] = ['Minor', 'Moderate', 'Major', 'Critical'];
    const idx = severities.indexOf(this.severity);
    if (idx < severities.length - 1) this.severity = severities[idx + 1];
  }
  await this.save();
};

EmergencyServiceSchema.methods.resolveEmergency = async function(this: IEmergencyService, notes: string): Promise<void> {
  this.status = 'Resolved';
  this.endTime = new Date();
  this.resolutionNotes = notes;
  if (this.responseTime === 0) {
    const ms = this.endTime.getTime() - new Date(this.startTime).getTime();
    this.responseTime = Math.round(ms / (1000 * 60));
  }
  await this.save();
};

EmergencyServiceSchema.methods.calculateResponseEfficiency = function(this: IEmergencyService): number {
  let score = 0;
  let targetTime = 120;
  if (this.severity === 'Critical') targetTime = 15;
  else if (this.severity === 'Major') targetTime = 30;
  else if (this.severity === 'Moderate') targetTime = 60;
  const timeScore = Math.max(0, 100 - ((this.responseTime - targetTime) / targetTime) * 100);
  score += timeScore * 0.3;
  const total = this.totalPatients || 1;
  const stabilizationRate = (this.successfulStabilizations / total) * 100;
  score += stabilizationRate * 0.3;
  const mortalityScore = Math.max(0, 100 - this.mortalityRate * 5);
  score += mortalityScore * 0.25;
  const staffUtilization = this.resources.staffCalled > 0 ? (this.resources.staffArrived / this.resources.staffCalled) * 100 : 100;
  score += staffUtilization * 0.15;
  return Math.round(Math.max(0, Math.min(100, score)));
};

const EmergencyService: Model<IEmergencyService> = mongoose.models.EmergencyService || mongoose.model<IEmergencyService>('EmergencyService', EmergencyServiceSchema);
export default EmergencyService;
