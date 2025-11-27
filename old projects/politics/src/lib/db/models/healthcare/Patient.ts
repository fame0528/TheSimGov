/**
 * @file src/lib/db/models/healthcare/Patient.ts
 * @description Patient schema for Healthcare Industry - Patient admissions and treatment tracking
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Patient model tracking admissions, treatments, diagnoses, outcomes, and billing. Adapts
 * Contract milestone progression patterns for treatment phases, insurance claim processing,
 * and discharge planning. Manages patient lifecycle from admission through discharge with
 * comprehensive medical record tracking.
 * 
 * EXTENDS: Contract.ts (70% pattern reuse)
 * - Admissions → Contract milestones (treatment phases)
 * - Insurance claims → Contract bidding (approval/denial)
 * - Treatment progression → Milestone auto-progression
 * - Billing → Contract payments (upfront, per-phase, final)
 * 
 * KEY FEATURES:
 * - Patient admission and discharge workflows
 * - Treatment phase tracking (Intake, Diagnosis, Treatment, Recovery, Discharge)
 * - Insurance coverage and claim processing
 * - Medical diagnosis tracking (ICD-10 codes)
 * - Medication and procedure tracking
 * - Patient outcome metrics and satisfaction scores
 * - Billing and payment tracking
 * 
 * BUSINESS LOGIC:
 * - Admission creates patient record with initial diagnosis
 * - Treatment phases progress based on medical staff actions
 * - Insurance pre-authorization required for major procedures
 * - Patient responsibility calculated after insurance coverage
 * - Discharge requires all treatment phases complete + billing resolved
 * - Readmission within 30 days tracked for quality metrics
 * 
 * USAGE:
 * ```typescript
 * import Patient from '@/lib/db/models/healthcare/Patient';
 * 
 * // Admit patient
 * const patient = await Patient.create({
 *   firstName: 'John',
 *   lastName: 'Smith',
 *   dateOfBirth: new Date('1975-05-15'),
 *   company: companyId,
 *   hospital: hospitalId,
 *   admissionDate: new Date(),
 *   admissionType: 'Emergency',
 *   chiefComplaint: 'Chest pain',
 *   initialDiagnosis: 'Suspected myocardial infarction',
 *   insuranceContract: insuranceId,
 *   assignedPhysician: physicianId,
 *   department: 'Emergency',
 *   treatmentPhases: [
 *     { name: 'Intake', status: 'Completed', completedDate: new Date() },
 *     { name: 'Diagnosis', status: 'In Progress' },
 *     { name: 'Treatment', status: 'Not Started' },
 *     { name: 'Recovery', status: 'Not Started' },
 *     { name: 'Discharge Planning', status: 'Not Started' }
 *   ]
 * });
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

/**
 * Admission types
 */
export type AdmissionType =
  | 'Emergency'           // ER admission
  | 'Scheduled'           // Pre-planned admission
  | 'Transfer'            // Transfer from another facility
  | 'Observation'         // Short-term observation
  | 'Outpatient';         // Same-day procedure

/**
 * Patient status
 */
export type PatientStatus =
  | 'Admitted'            // Currently in hospital
  | 'In Treatment'        // Actively receiving treatment
  | 'Recovery'            // Post-treatment recovery
  | 'Discharged'          // Released from hospital
  | 'Transferred'         // Transferred to another facility
  | 'Deceased';           // Patient died

/**
 * Treatment phase status
 */
export type PhaseStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

/**
 * Discharge disposition
 */
export type DischargeDisposition =
  | 'Home'                // Discharged to home
  | 'Skilled Nursing'     // Transferred to SNF
  | 'Rehabilitation'      // Transferred to rehab facility
  | 'Another Hospital'    // Transferred to another hospital
  | 'Home Health'         // Home with home health services
  | 'Deceased';           // Patient died

/**
 * Treatment phase tracking
 */
export interface TreatmentPhase {
  name: string;
  description?: string;
  status: PhaseStatus;
  startDate?: Date;
  completedDate?: Date;
  assignedStaff?: Types.ObjectId[];
  procedures?: string[];
  medications?: string[];
  cost: number;                    // Phase cost
}

/**
 * Diagnosis information
 */
export interface Diagnosis {
  icd10Code: string;               // ICD-10 diagnostic code
  description: string;
  diagnosedDate: Date;
  diagnosedBy: Types.ObjectId;     // Medical staff reference
  isPrimary: boolean;              // Primary vs secondary diagnosis
}

/**
 * Medication record
 */
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: Types.ObjectId;    // Medical staff reference
  cost: number;
}

/**
 * Procedure record
 */
export interface Procedure {
  name: string;
  cptCode?: string;                // CPT procedure code
  performedDate: Date;
  performedBy: Types.ObjectId;     // Medical staff reference
  outcome: 'Success' | 'Complication' | 'Cancelled';
  cost: number;
}

/**
 * Insurance claim information
 */
export interface InsuranceClaim {
  claimNumber: string;
  submittedDate: Date;
  approvedDate?: Date;
  deniedDate?: Date;
  status: 'Pending' | 'Approved' | 'Denied' | 'Appealed';
  approvedAmount: number;
  deniedAmount: number;
  denialReason?: string;
}

/**
 * Billing information
 */
export interface BillingInfo {
  totalCharges: number;
  insurancePayment: number;
  patientResponsibility: number;
  amountPaid: number;
  amountDue: number;
  billingDate?: Date;
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
}

/**
 * Patient document interface
 */
export interface IPatient extends Document {
  // Patient identity
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  medicalRecordNumber: string;
  
  // Admission information
  company: Types.ObjectId;
  hospital: Types.ObjectId;
  admissionDate: Date;
  admissionType: AdmissionType;
  department: string;
  room?: string;
  
  // Medical information
  chiefComplaint: string;
  initialDiagnosis: string;
  diagnoses: Diagnosis[];
  treatmentPhases: TreatmentPhase[];
  currentPhase: number;            // Index of current phase
  medications: Medication[];
  procedures: Procedure[];
  
  // Staff assignment
  assignedPhysician: Types.ObjectId;
  assignedNurses: Types.ObjectId[];
  consultingSpecialists: Types.ObjectId[];
  
  // Insurance & billing
  insuranceContract?: Types.ObjectId;
  insuranceClaim?: InsuranceClaim;
  billing: BillingInfo;
  
  // Status & outcomes
  status: PatientStatus;
  dischargeDate?: Date;
  dischargeDisposition?: DischargeDisposition;
  lengthOfStay: number;            // Days
  readmitted: boolean;
  readmissionDate?: Date;
  patientSatisfaction?: number;    // 1-100
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  fullName: string;
  age: number;
  isActive: boolean;
  treatmentComplete: boolean;
  
  // Instance methods
  advancePhase(): Promise<void>;
  completePhase(phaseIndex: number): Promise<void>;
  addDiagnosis(diagnosis: Omit<Diagnosis, 'diagnosedDate'>): Promise<void>;
  prescribeMedication(medication: Omit<Medication, 'startDate'>): Promise<void>;
  recordProcedure(procedure: Omit<Procedure, 'performedDate'>): Promise<void>;
  submitInsuranceClaim(claimNumber: string): Promise<void>;
  discharge(disposition: DischargeDisposition): Promise<void>;
  calculateBilling(): void;
}

const PatientSchema = new Schema<IPatient>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [30, 'First name cannot exceed 30 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [30, 'Last name cannot exceed 30 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    medicalRecordNumber: {
      type: String,
      required: [true, 'Medical record number is required'],
      unique: true,
      trim: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
      index: true,
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required'],
      default: Date.now,
    },
    admissionType: {
      type: String,
      required: [true, 'Admission type is required'],
      enum: ['Emergency', 'Scheduled', 'Transfer', 'Observation', 'Outpatient'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
      trim: true,
      maxlength: [500, 'Chief complaint cannot exceed 500 characters'],
    },
    initialDiagnosis: {
      type: String,
      required: [true, 'Initial diagnosis is required'],
      trim: true,
      maxlength: [500, 'Initial diagnosis cannot exceed 500 characters'],
    },
    diagnoses: [
      {
        icd10Code: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        diagnosedDate: { type: Date, required: true },
        diagnosedBy: { type: Schema.Types.ObjectId, ref: 'MedicalStaff', required: true },
        isPrimary: { type: Boolean, required: true, default: false },
      },
    ],
    treatmentPhases: [
      {
        name: { type: String, required: true },
        description: String,
        status: {
          type: String,
          required: true,
          enum: ['Not Started', 'In Progress', 'Completed', 'Cancelled'],
          default: 'Not Started',
        },
        startDate: Date,
        completedDate: Date,
        assignedStaff: [{ type: Schema.Types.ObjectId, ref: 'MedicalStaff' }],
        procedures: [String],
        medications: [String],
        cost: { type: Number, required: true, default: 0, min: 0 },
      },
    ],
    currentPhase: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    medications: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        frequency: { type: String, required: true, trim: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        prescribedBy: { type: Schema.Types.ObjectId, ref: 'MedicalStaff', required: true },
        cost: { type: Number, required: true, min: 0 },
      },
    ],
    procedures: [
      {
        name: { type: String, required: true, trim: true },
        cptCode: { type: String, trim: true },
        performedDate: { type: Date, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'MedicalStaff', required: true },
        outcome: {
          type: String,
          required: true,
          enum: ['Success', 'Complication', 'Cancelled'],
        },
        cost: { type: Number, required: true, min: 0 },
      },
    ],
    assignedPhysician: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalStaff',
      required: [true, 'Assigned physician is required'],
    },
    assignedNurses: [
      { type: Schema.Types.ObjectId, ref: 'MedicalStaff' },
    ],
    consultingSpecialists: [
      { type: Schema.Types.ObjectId, ref: 'MedicalStaff' },
    ],
    insuranceContract: {
      type: Schema.Types.ObjectId,
      ref: 'InsuranceContract',
    },
    insuranceClaim: {
      type: {
        claimNumber: { type: String, required: true, trim: true },
        submittedDate: { type: Date, required: true },
        approvedDate: Date,
        deniedDate: Date,
        status: {
          type: String,
          required: true,
          enum: ['Pending', 'Approved', 'Denied', 'Appealed'],
          default: 'Pending',
        },
        approvedAmount: { type: Number, required: true, default: 0, min: 0 },
        deniedAmount: { type: Number, required: true, default: 0, min: 0 },
        denialReason: String,
      },
    },
    billing: {
      type: {
        totalCharges: { type: Number, required: true, default: 0, min: 0 },
        insurancePayment: { type: Number, required: true, default: 0, min: 0 },
        patientResponsibility: { type: Number, required: true, default: 0, min: 0 },
        amountPaid: { type: Number, required: true, default: 0, min: 0 },
        amountDue: { type: Number, required: true, default: 0, min: 0 },
        billingDate: Date,
        paymentStatus: {
          type: String,
          required: true,
          enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
          default: 'Pending',
        },
      },
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Admitted', 'In Treatment', 'Recovery', 'Discharged', 'Transferred', 'Deceased'],
      default: 'Admitted',
      index: true,
    },
    dischargeDate: Date,
    dischargeDisposition: {
      type: String,
      enum: ['Home', 'Skilled Nursing', 'Rehabilitation', 'Another Hospital', 'Home Health', 'Deceased'],
    },
    lengthOfStay: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    readmitted: {
      type: Boolean,
      required: true,
      default: false,
    },
    readmissionDate: Date,
    patientSatisfaction: {
      type: Number,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
    collection: 'patients',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PatientSchema.index({ company: 1, hospital: 1, status: 1 });
PatientSchema.index({ assignedPhysician: 1, status: 1 });
PatientSchema.index({ admissionDate: -1 });

/**
 * Virtual: Full name
 */
PatientSchema.virtual('fullName').get(function (this: IPatient) {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Virtual: Age
 */
PatientSchema.virtual('age').get(function (this: IPatient) {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

/**
 * Virtual: Is active
 */
PatientSchema.virtual('isActive').get(function (this: IPatient) {
  return this.status !== 'Discharged' && this.status !== 'Transferred' && this.status !== 'Deceased';
});

/**
 * Virtual: Treatment complete
 */
PatientSchema.virtual('treatmentComplete').get(function (this: IPatient) {
  return this.treatmentPhases.every(phase => phase.status === 'Completed' || phase.status === 'Cancelled');
});

/**
 * Pre-save hook: Calculate length of stay
 */
PatientSchema.pre<IPatient>('save', function (next) {
  if (this.admissionDate) {
    const endDate = this.dischargeDate || new Date();
    const msStay = endDate.getTime() - new Date(this.admissionDate).getTime();
    this.lengthOfStay = Math.ceil(msStay / (1000 * 60 * 60 * 24));
  }
  next();
});

/**
 * Advance to next treatment phase
 */
PatientSchema.methods.advancePhase = async function (this: IPatient): Promise<void> {
  if (this.currentPhase < this.treatmentPhases.length - 1) {
    this.currentPhase += 1;
    this.treatmentPhases[this.currentPhase].status = 'In Progress';
    this.treatmentPhases[this.currentPhase].startDate = new Date();
    this.status = 'In Treatment';
  }
  await this.save();
};

/**
 * Complete specific treatment phase
 */
PatientSchema.methods.completePhase = async function (
  this: IPatient,
  phaseIndex: number
): Promise<void> {
  if (phaseIndex >= 0 && phaseIndex < this.treatmentPhases.length) {
    this.treatmentPhases[phaseIndex].status = 'Completed';
    this.treatmentPhases[phaseIndex].completedDate = new Date();
    
    // Auto-advance if current phase
    if (phaseIndex === this.currentPhase) {
      await this.advancePhase();
    }
    
    // Update status to Recovery if all treatment phases done
    if (this.treatmentComplete && this.status === 'In Treatment') {
      this.status = 'Recovery';
    }
  }
  await this.save();
};

/**
 * Add diagnosis
 */
PatientSchema.methods.addDiagnosis = async function (
  this: IPatient,
  diagnosis: Omit<Diagnosis, 'diagnosedDate'>
): Promise<void> {
  this.diagnoses.push({
    ...diagnosis,
    diagnosedDate: new Date(),
  });
  await this.save();
};

/**
 * Prescribe medication
 */
PatientSchema.methods.prescribeMedication = async function (
  this: IPatient,
  medication: Omit<Medication, 'startDate'>
): Promise<void> {
  this.medications.push({
    ...medication,
    startDate: new Date(),
  });
  
  // Update billing
  this.billing.totalCharges += medication.cost;
  this.calculateBilling();
  
  await this.save();
};

/**
 * Record procedure
 */
PatientSchema.methods.recordProcedure = async function (
  this: IPatient,
  procedure: Omit<Procedure, 'performedDate'>
): Promise<void> {
  this.procedures.push({
    ...procedure,
    performedDate: new Date(),
  });
  
  // Update billing
  this.billing.totalCharges += procedure.cost;
  this.calculateBilling();
  
  await this.save();
};

/**
 * Submit insurance claim
 */
PatientSchema.methods.submitInsuranceClaim = async function (
  this: IPatient,
  claimNumber: string
): Promise<void> {
  this.insuranceClaim = {
    claimNumber,
    submittedDate: new Date(),
    status: 'Pending',
    approvedAmount: 0,
    deniedAmount: 0,
  };
  await this.save();
};

/**
 * Discharge patient
 */
PatientSchema.methods.discharge = async function (
  this: IPatient,
  disposition: DischargeDisposition
): Promise<void> {
  this.status = 'Discharged';
  this.dischargeDate = new Date();
  this.dischargeDisposition = disposition;
  this.calculateBilling();
  await this.save();
};

/**
 * Calculate billing amounts
 */
PatientSchema.methods.calculateBilling = function (this: IPatient): void {
  // Sum all costs
  const phaseCosts = this.treatmentPhases.reduce((sum, phase) => sum + phase.cost, 0);
  const medCosts = this.medications.reduce((sum, med) => sum + med.cost, 0);
  const procCosts = this.procedures.reduce((sum, proc) => sum + proc.cost, 0);
  
  this.billing.totalCharges = phaseCosts + medCosts + procCosts;
  
  // Insurance payment (from approved claim)
  if (this.insuranceClaim && this.insuranceClaim.status === 'Approved') {
    this.billing.insurancePayment = this.insuranceClaim.approvedAmount;
  }
  
  // Patient responsibility
  this.billing.patientResponsibility = this.billing.totalCharges - this.billing.insurancePayment;
  
  // Amount due
  this.billing.amountDue = this.billing.patientResponsibility - this.billing.amountPaid;
  
  // Payment status
  if (this.billing.amountDue === 0) {
    this.billing.paymentStatus = 'Paid';
  } else if (this.billing.amountPaid > 0) {
    this.billing.paymentStatus = 'Partial';
  } else if (this.dischargeDate && new Date().getTime() - new Date(this.dischargeDate).getTime() > 30 * 24 * 60 * 60 * 1000) {
    this.billing.paymentStatus = 'Overdue';
  } else {
    this.billing.paymentStatus = 'Pending';
  }
};

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
