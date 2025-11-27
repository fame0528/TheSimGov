/**
 * @file src/lib/db/models/healthcare/Treatment.ts
 * @description Treatment schema for Healthcare Industry - Medical procedures and treatment plans
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Treatment model managing medical procedures, treatment protocols, scheduling, and outcomes.
 * Adapts manufacturing production workflow patterns for medical procedure execution with
 * staff assignment, resource allocation, quality tracking, and multi-phase procedure management.
 * Comprehensive tracking of surgical procedures, diagnostics, therapies, emergency interventions,
 * and preventive care with complete outcome documentation and complication management.
 * 
 * EXTENDS: Manufacturing patterns (70% pattern reuse)
 * - Production workflows → Treatment protocols (pre-op, procedure, recovery)
 * - Assembly steps → Procedure phases (prep, execution, monitoring, completion)
 * - Quality control → Outcome tracking and success metrics
 * - Resource allocation → Medical staff/equipment assignment
 * - Production scheduling → Operating room scheduling
 * - Defect tracking → Complication recording
 * 
 * KEY FEATURES:
 * - Treatment type classification (Surgery, Diagnostic, Therapy, Emergency, Preventive)
 * - Multi-phase procedure workflows with real-time status tracking
 * - Medical staff and equipment assignment with skill matching
 * - Scheduling and duration estimation with variance tracking
 * - Outcome and complication recording with severity levels
 * - Cost tracking and billing integration with insurance
 * - Equipment utilization and sterilization tracking
 * - Pre-authorization and consent management
 * 
 * BUSINESS LOGIC:
 * - Surgery: 3-8 hour procedures, specialist required, pre-op/procedure/recovery phases
 * - Diagnostic: 15-120 min tests, radiologist/pathologist, single phase
 * - Therapy: 30-90 min sessions, therapist required, multiple recurring sessions
 * - Emergency: 30-180 min urgent care, immediate staff allocation, priority scheduling
 * - Preventive: 15-60 min screenings, general physician, routine scheduling
 * - Cost ranges: Emergency $500-$50k, Surgery $5k-$500k, Diagnostic $100-$10k
 * - Complications trigger safety incident reports and quality reviews
 * - Success rate impacts hospital quality metrics and reimbursement
 * 
 * USAGE:
 * ```typescript
 * import Treatment from '@/lib/db/models/healthcare/Treatment';
 * 
 * // Schedule surgical procedure
 * const surgery = await Treatment.create({
 *   patient: patientId,
 *   hospital: hospitalId,
 *   company: companyId,
 *   treatmentType: 'Surgery',
 *   name: 'Appendectomy',
 *   cptCode: '44950',
 *   scheduledDate: new Date('2025-11-20T08:00:00'),
 *   estimatedDuration: 90,
 *   assignedSurgeon: surgeonId,
 *   assignedStaff: [anesthesiologistId, nurse1Id, nurse2Id],
 *   assignedRoom: 'OR-3',
 *   phases: [
 *     { name: 'Pre-Op', estimatedDuration: 30, staff: [nurse1Id] },
 *     { name: 'Anesthesia', estimatedDuration: 15, staff: [anesthesiologistId] },
 *     { name: 'Procedure', estimatedDuration: 60, staff: [surgeonId, nurse1Id, nurse2Id] },
 *     { name: 'Recovery', estimatedDuration: 120, staff: [nurse1Id] }
 *   ],
 *   requiredEquipment: ['Laparoscope', 'Cautery', 'Suction'],
 *   cost: 15000,
 *   preAuthorizationRequired: true
 * });
 * 
 * // Start treatment
 * await surgery.startTreatment();
 * 
 * // Complete phase
 * await surgery.completePhase(0); // Complete Pre-Op
 * 
 * // Record complication
 * await surgery.recordComplication('Minor', 'Unexpected bleeding, controlled');
 * 
 * // Complete treatment
 * await surgery.completeTreatment('Success', []);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Treatment types with different characteristics
 */
export type TreatmentType =
  | 'Surgery'              // Invasive procedures (30 min - 8 hours)
  | 'Diagnostic'           // Tests and imaging (15 min - 2 hours)
  | 'Therapy'              // Physical/occupational therapy (30-90 min)
  | 'Emergency'            // Urgent interventions (30 min - 3 hours)
  | 'Preventive';          // Screenings and check-ups (15-60 min)

/**
 * Treatment status throughout lifecycle
 */
export type TreatmentStatus =
  | 'Scheduled'            // Awaiting start time
  | 'Pre-Op'               // Patient prep in progress
  | 'In Progress'          // Procedure actively being performed
  | 'Post-Op'              // Recovery monitoring
  | 'Completed'            // Finished successfully
  | 'Cancelled'            // Cancelled before start
  | 'Delayed'              // Postponed to later time
  | 'On Hold';             // Temporarily paused

/**
 * Treatment outcome types
 */
export type OutcomeType =
  | 'Success'              // Procedure successful, no complications
  | 'Partial Success'      // Goals partially met
  | 'Complication'         // Successful but with complications
  | 'Failed'               // Procedure unsuccessful
  | 'Aborted';             // Stopped mid-procedure

/**
 * Complication severity levels
 */
export type ComplicationSeverity =
  | 'Minor'                // Minimal impact, easily managed
  | 'Moderate'             // Required intervention
  | 'Major'                // Significant impact on outcome
  | 'Life-Threatening';    // Critical situation

/**
 * Treatment phase tracking
 */
export interface TreatmentPhase {
  name: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped';
  estimatedDuration: number;       // Minutes
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
  staff: Types.ObjectId[];
  notes?: string;
}

/**
 * Complication record
 */
export interface Complication {
  severity: ComplicationSeverity;
  description: string;
  occurredAt: Date;
  reportedBy: Types.ObjectId;      // Medical staff reference
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
}

/**
 * Equipment usage record
 */
export interface EquipmentUsage {
  name: string;
  serialNumber?: string;
  usedFrom: Date;
  usedUntil?: Date;
  sterilized: boolean;
  sterilizationDate?: Date;
}

/**
 * Treatment document interface
 */
export interface ITreatment extends Document {
  // Core identification
  patient: Types.ObjectId;
  hospital: Types.ObjectId;
  company: Types.ObjectId;
  
  // Treatment classification
  treatmentType: TreatmentType;
  name: string;
  description?: string;
  cptCode?: string;                // Current Procedural Terminology code
  icd10Code?: string;              // Diagnosis code
  
  // Scheduling
  scheduledDate: Date;
  completedDate?: Date;
  estimatedDuration: number;       // Total minutes
  actualDuration?: number;
  assignedRoom?: string;
  
  // Staff assignment
  assignedSurgeon?: Types.ObjectId;
  assignedStaff: Types.ObjectId[];
  requiredSpecialty?: string;
  
  // Workflow phases
  phases: TreatmentPhase[];
  currentPhase: number;
  
  // Equipment
  requiredEquipment: string[];
  equipmentUsage: EquipmentUsage[];
  
  // Status & outcomes
  status: TreatmentStatus;
  outcome?: OutcomeType;
  complications: Complication[];
  successNotes?: string;
  
  // Authorization & consent
  preAuthorizationRequired: boolean;
  preAuthorizationNumber?: string;
  consentObtained: boolean;
  consentDate?: Date;
  
  // Financial
  cost: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
  
  // Quality metrics
  qualityScore?: number;           // 1-100
  patientSatisfaction?: number;    // 1-100
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  isActive: boolean;
  isDelayed: boolean;
  totalComplications: number;
  hasComplications: boolean;
  
  // Instance methods
  startTreatment(): Promise<void>;
  completePhase(phaseIndex: number): Promise<void>;
  recordComplication(severity: ComplicationSeverity, description: string, reportedBy: Types.ObjectId): Promise<void>;
  resolveComplication(complicationIndex: number, resolution: string): Promise<void>;
  recordEquipmentUsage(name: string, serialNumber?: string): Promise<void>;
  completeTreatment(outcome: OutcomeType, successNotes?: string): Promise<void>;
  cancelTreatment(reason: string): Promise<void>;
  calculateQualityScore(): number;
}

const TreatmentSchema = new Schema<ITreatment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
      index: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    treatmentType: {
      type: String,
      required: [true, 'Treatment type is required'],
      enum: ['Surgery', 'Diagnostic', 'Therapy', 'Emergency', 'Preventive'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Treatment name is required'],
      trim: true,
      maxlength: [200, 'Treatment name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    cptCode: {
      type: String,
      trim: true,
      maxlength: [10, 'CPT code cannot exceed 10 characters'],
    },
    icd10Code: {
      type: String,
      trim: true,
      maxlength: [10, 'ICD-10 code cannot exceed 10 characters'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    completedDate: Date,
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: [5, 'Estimated duration must be at least 5 minutes'],
      max: [960, 'Estimated duration cannot exceed 16 hours'],
    },
    actualDuration: {
      type: Number,
      min: 0,
    },
    assignedRoom: {
      type: String,
      trim: true,
    },
    assignedSurgeon: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalStaff',
    },
    assignedStaff: [
      { type: Schema.Types.ObjectId, ref: 'MedicalStaff' },
    ],
    requiredSpecialty: {
      type: String,
      trim: true,
    },
    phases: [
      {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        status: {
          type: String,
          required: true,
          enum: ['Not Started', 'In Progress', 'Completed', 'Skipped'],
          default: 'Not Started',
        },
        estimatedDuration: { type: Number, required: true, min: 1 },
        actualDuration: { type: Number, min: 0 },
        startTime: Date,
        endTime: Date,
        staff: [{ type: Schema.Types.ObjectId, ref: 'MedicalStaff' }],
        notes: String,
      },
    ],
    currentPhase: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    requiredEquipment: [
      { type: String, trim: true },
    ],
    equipmentUsage: [
      {
        name: { type: String, required: true, trim: true },
        serialNumber: { type: String, trim: true },
        usedFrom: { type: Date, required: true },
        usedUntil: Date,
        sterilized: { type: Boolean, required: true, default: false },
        sterilizationDate: Date,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ['Scheduled', 'Pre-Op', 'In Progress', 'Post-Op', 'Completed', 'Cancelled', 'Delayed', 'On Hold'],
      default: 'Scheduled',
      index: true,
    },
    outcome: {
      type: String,
      enum: ['Success', 'Partial Success', 'Complication', 'Failed', 'Aborted'],
    },
    complications: [
      {
        severity: {
          type: String,
          required: true,
          enum: ['Minor', 'Moderate', 'Major', 'Life-Threatening'],
        },
        description: { type: String, required: true, trim: true },
        occurredAt: { type: Date, required: true },
        reportedBy: { type: Schema.Types.ObjectId, ref: 'MedicalStaff', required: true },
        resolved: { type: Boolean, required: true, default: false },
        resolution: String,
        resolvedAt: Date,
      },
    ],
    successNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Success notes cannot exceed 1000 characters'],
    },
    preAuthorizationRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    preAuthorizationNumber: {
      type: String,
      trim: true,
    },
    consentObtained: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentDate: Date,
    cost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Cost cannot be negative'],
      max: [1000000, 'Cost cannot exceed $1,000,000'],
    },
    insuranceCoverage: {
      type: Number,
      min: 0,
    },
    patientResponsibility: {
      type: Number,
      min: 0,
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 100,
    },
    patientSatisfaction: {
      type: Number,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
    collection: 'treatments',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TreatmentSchema.index({ hospital: 1, status: 1 });
TreatmentSchema.index({ patient: 1, scheduledDate: -1 });
TreatmentSchema.index({ assignedSurgeon: 1, scheduledDate: 1 });

/**
 * Virtual: Is active
 */
TreatmentSchema.virtual('isActive').get(function (this: ITreatment) {
  return this.status !== 'Completed' && this.status !== 'Cancelled';
});

/**
 * Virtual: Is delayed
 */
TreatmentSchema.virtual('isDelayed').get(function (this: ITreatment) {
  if (this.status === 'Completed' || this.status === 'Cancelled') return false;
  return new Date() > new Date(this.scheduledDate);
});

/**
 * Virtual: Total complications
 */
TreatmentSchema.virtual('totalComplications').get(function (this: ITreatment) {
  return this.complications.length;
});

/**
 * Virtual: Has complications
 */
TreatmentSchema.virtual('hasComplications').get(function (this: ITreatment) {
  return this.complications.length > 0;
});

/**
 * Start treatment and begin first phase
 */
TreatmentSchema.methods.startTreatment = async function (this: ITreatment): Promise<void> {
  this.status = 'In Progress';
  
  if (this.phases.length > 0) {
    this.phases[0].status = 'In Progress';
    this.phases[0].startTime = new Date();
  }
  
  await this.save();
};

/**
 * Complete specific phase and advance to next
 */
TreatmentSchema.methods.completePhase = async function (
  this: ITreatment,
  phaseIndex: number
): Promise<void> {
  if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
    const phase = this.phases[phaseIndex];
    phase.status = 'Completed';
    phase.endTime = new Date();
    
    // Calculate actual duration
    if (phase.startTime) {
      const durationMs = phase.endTime.getTime() - phase.startTime.getTime();
      phase.actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }
    
    // Advance to next phase if current
    if (phaseIndex === this.currentPhase && phaseIndex < this.phases.length - 1) {
      this.currentPhase += 1;
      this.phases[this.currentPhase].status = 'In Progress';
      this.phases[this.currentPhase].startTime = new Date();
    }
    
    // Update status to Post-Op if all phases complete
    const allPhasesComplete = this.phases.every(p => p.status === 'Completed' || p.status === 'Skipped');
    if (allPhasesComplete && this.status === 'In Progress') {
      this.status = 'Post-Op';
    }
  }
  
  await this.save();
};

/**
 * Record complication during treatment
 */
TreatmentSchema.methods.recordComplication = async function (
  this: ITreatment,
  severity: ComplicationSeverity,
  description: string,
  reportedBy: Types.ObjectId
): Promise<void> {
  this.complications.push({
    severity,
    description,
    occurredAt: new Date(),
    reportedBy,
    resolved: false,
  });
  
  // Recalculate quality score
  this.qualityScore = this.calculateQualityScore();
  
  await this.save();
};

/**
 * Resolve complication
 */
TreatmentSchema.methods.resolveComplication = async function (
  this: ITreatment,
  complicationIndex: number,
  resolution: string
): Promise<void> {
  if (complicationIndex >= 0 && complicationIndex < this.complications.length) {
    this.complications[complicationIndex].resolved = true;
    this.complications[complicationIndex].resolution = resolution;
    this.complications[complicationIndex].resolvedAt = new Date();
    
    // Recalculate quality score
    this.qualityScore = this.calculateQualityScore();
    
    await this.save();
  }
};

/**
 * Record equipment usage
 */
TreatmentSchema.methods.recordEquipmentUsage = async function (
  this: ITreatment,
  name: string,
  serialNumber?: string
): Promise<void> {
  this.equipmentUsage.push({
    name,
    serialNumber,
    usedFrom: new Date(),
    sterilized: false,
  });
  
  await this.save();
};

/**
 * Complete treatment with outcome
 */
TreatmentSchema.methods.completeTreatment = async function (
  this: ITreatment,
  outcome: OutcomeType,
  successNotes?: string
): Promise<void> {
  this.status = 'Completed';
  this.completedDate = new Date();
  this.outcome = outcome;
  if (successNotes) this.successNotes = successNotes;
  
  // Calculate actual duration
  if (this.scheduledDate) {
    const durationMs = this.completedDate.getTime() - new Date(this.scheduledDate).getTime();
    this.actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  
  // Calculate quality score
  this.qualityScore = this.calculateQualityScore();
  
  await this.save();
};

/**
 * Cancel treatment
 */
TreatmentSchema.methods.cancelTreatment = async function (
  this: ITreatment,
  reason: string
): Promise<void> {
  this.status = 'Cancelled';
  this.successNotes = `Cancelled: ${reason}`;
  await this.save();
};

/**
 * Calculate quality score based on outcome and complications
 * 
 * Score = Base (outcome) - Complication Penalty + Duration Efficiency
 * - Success: 100 base
 * - Partial Success: 75 base
 * - Complication: 60 base
 * - Failed: 30 base
 * - Aborted: 20 base
 * - Minor complication: -5
 * - Moderate complication: -10
 * - Major complication: -20
 * - Life-Threatening: -30
 * - Duration within 10% of estimate: +5
 * - Duration > 50% over estimate: -10
 */
TreatmentSchema.methods.calculateQualityScore = function (this: ITreatment): number {
  let score = 80; // Default base
  
  // Base score from outcome
  if (this.outcome === 'Success') score = 100;
  else if (this.outcome === 'Partial Success') score = 75;
  else if (this.outcome === 'Complication') score = 60;
  else if (this.outcome === 'Failed') score = 30;
  else if (this.outcome === 'Aborted') score = 20;
  
  // Deduct for complications
  this.complications.forEach(comp => {
    if (comp.severity === 'Minor') score -= 5;
    else if (comp.severity === 'Moderate') score -= 10;
    else if (comp.severity === 'Major') score -= 20;
    else if (comp.severity === 'Life-Threatening') score -= 30;
  });
  
  // Bonus for duration efficiency
  if (this.actualDuration && this.estimatedDuration) {
    const variance = Math.abs(this.actualDuration - this.estimatedDuration) / this.estimatedDuration;
    if (variance <= 0.1) score += 5; // Within 10%
    else if (variance > 0.5) score -= 10; // Over 50%
  }
  
  // Clamp to 1-100
  return Math.max(1, Math.min(100, score));
};

const Treatment: Model<ITreatment> =
  mongoose.models.Treatment || mongoose.model<ITreatment>('Treatment', TreatmentSchema);

export default Treatment;
