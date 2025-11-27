/**
 * @file src/lib/db/models/healthcare/Compliance.ts
 * @description Compliance schema for Healthcare Industry - Regulatory tracking and audits
 * @created 2025-11-19
 * 
 * OVERVIEW:
 * Compliance model tracking healthcare regulatory requirements, inspections, violations,
 * and remediation with comprehensive JCAHO accreditation, CMS certification, state licensing,
 * OSHA safety compliance, and FDA oversight management.
 * 
 * EXTENDS: Energy compliance (90% pattern reuse)
 * KEY FEATURES: Multi-agency tracking, violation management, corrective actions, accreditation levels
 * 
 * USAGE:
 * ```typescript
 * const compliance = await Compliance.create({
 *   hospital: hospitalId, company: companyId, agency: 'JCAHO',
 *   inspectionType: 'Full Survey', inspectionDate: new Date(),
 *   status: 'Under Review', accreditationLevel: 'Gold Seal'
 * });
 * await compliance.recordViolation('Infection Control', 'Major', 'Description', 75000);
 * ```
 */

import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export type ComplianceAgency = 'JCAHO' | 'CMS' | 'State Health' | 'OSHA' | 'FDA';
export type ComplianceStatus = 'Compliant' | 'Under Review' | 'Non-Compliant' | 'Remediated' | 'Conditional' | 'Suspended';
export type ViolationSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';
export type InspectionType = 'Full Survey' | 'Focused Survey' | 'Complaint Investigation' | 'Follow-Up' | 'Random Audit';
export type AccreditationLevel = 'Gold Seal' | 'Silver' | 'Conditional' | 'Provisional' | 'Denied';

export interface Violation {
  type: string;
  severity: ViolationSeverity;
  description: string;
  citationNumber?: string;
  fine: number;
  remediated: boolean;
  deadline: Date;
  correctiveAction?: string;
  correctiveActionDate?: Date;
  remediationNotes?: string;
  remediatedDate?: Date;
  verifiedBy?: string;
}

export interface ICompliance extends Document {
  hospital: Types.ObjectId;
  company: Types.ObjectId;
  agency: ComplianceAgency;
  inspectionType: InspectionType;
  inspectionDate: Date;
  nextInspectionDate?: Date;
  inspector?: string;
  status: ComplianceStatus;
  overallScore?: number;
  findings: string[];
  recommendations: string[];
  violations: Violation[];
  totalFines: number;
  finesPaid: number;
  accreditationLevel?: AccreditationLevel;
  certificationNumber?: string;
  certificationExpiry?: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  isCompliant: boolean;
  hasActiveViolations: boolean;
  remediationProgress: number;
  daysUntilNextInspection: number;
  
  recordViolation(type: string, severity: ViolationSeverity, description: string, fine: number, deadline?: Date, citationNumber?: string): Promise<void>;
  submitCorrectiveAction(violationIndex: number, plan: string): Promise<void>;
  remediateViolation(violationIndex: number, notes: string, verifiedBy?: string): Promise<void>;
  updateAccreditation(level: AccreditationLevel, score: number): Promise<void>;
  scheduleFollowUp(date: Date): Promise<void>;
  completeFollowUp(): Promise<void>;
  calculateRemediationProgress(): number;
}

const ComplianceSchema = new Schema<ICompliance>(
  {
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    agency: { type: String, required: true, enum: ['JCAHO', 'CMS', 'State Health', 'OSHA', 'FDA'], index: true },
    inspectionType: { type: String, required: true, enum: ['Full Survey', 'Focused Survey', 'Complaint Investigation', 'Follow-Up', 'Random Audit'] },
    inspectionDate: { type: Date, required: true, index: true },
    nextInspectionDate: Date,
    inspector: String,
    status: { type: String, required: true, enum: ['Compliant', 'Under Review', 'Non-Compliant', 'Remediated', 'Conditional', 'Suspended'], default: 'Under Review', index: true },
    overallScore: { type: Number, min: 0, max: 100 },
    findings: [String],
    recommendations: [String],
    violations: [{
      type: { type: String, required: true },
      severity: { type: String, required: true, enum: ['Minor', 'Moderate', 'Major', 'Critical'] },
      description: { type: String, required: true },
      citationNumber: String,
      fine: { type: Number, required: true, min: 0 },
      remediated: { type: Boolean, required: true, default: false },
      deadline: { type: Date, required: true },
      correctiveAction: String,
      correctiveActionDate: Date,
      remediationNotes: String,
      remediatedDate: Date,
      verifiedBy: String
    }],
    totalFines: { type: Number, required: true, default: 0, min: 0 },
    finesPaid: { type: Number, required: true, default: 0, min: 0 },
    accreditationLevel: { type: String, enum: ['Gold Seal', 'Silver', 'Conditional', 'Provisional', 'Denied'] },
    certificationNumber: String,
    certificationExpiry: Date,
    followUpRequired: { type: Boolean, required: true, default: false },
    followUpDate: Date,
    followUpCompleted: { type: Boolean, required: true, default: false }
  },
  { timestamps: true, collection: 'compliance', toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ComplianceSchema.index({ hospital: 1, agency: 1, inspectionDate: -1 });

ComplianceSchema.virtual('isCompliant').get(function(this: ICompliance) {
  return this.status === 'Compliant' || this.status === 'Remediated';
});

ComplianceSchema.virtual('hasActiveViolations').get(function(this: ICompliance) {
  return this.violations.some(v => !v.remediated);
});

ComplianceSchema.virtual('remediationProgress').get(function(this: ICompliance) {
  return this.calculateRemediationProgress();
});

ComplianceSchema.virtual('daysUntilNextInspection').get(function(this: ICompliance) {
  if (!this.nextInspectionDate) return -1;
  const ms = new Date(this.nextInspectionDate).getTime() - new Date().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
});

ComplianceSchema.methods.recordViolation = async function(this: ICompliance, type: string, severity: ViolationSeverity, description: string, fine: number, deadline?: Date, citationNumber?: string): Promise<void> {
  if (!deadline) {
    const d = new Date();
    if (severity === 'Critical') d.setDate(d.getDate() + 1);
    else if (severity === 'Major') d.setDate(d.getDate() + 30);
    else if (severity === 'Moderate') d.setDate(d.getDate() + 90);
    else d.setDate(d.getDate() + 180);
    deadline = d;
  }
  this.violations.push({ type, severity, description, citationNumber, fine, remediated: false, deadline });
  this.totalFines += fine;
  this.status = 'Non-Compliant';
  this.followUpRequired = true;
  await this.save();
};

ComplianceSchema.methods.submitCorrectiveAction = async function(this: ICompliance, violationIndex: number, plan: string): Promise<void> {
  if (violationIndex >= 0 && violationIndex < this.violations.length) {
    this.violations[violationIndex].correctiveAction = plan;
    this.violations[violationIndex].correctiveActionDate = new Date();
    await this.save();
  }
};

ComplianceSchema.methods.remediateViolation = async function(this: ICompliance, violationIndex: number, notes: string, verifiedBy?: string): Promise<void> {
  if (violationIndex >= 0 && violationIndex < this.violations.length) {
    this.violations[violationIndex].remediated = true;
    this.violations[violationIndex].remediationNotes = notes;
    this.violations[violationIndex].remediatedDate = new Date();
    if (verifiedBy) this.violations[violationIndex].verifiedBy = verifiedBy;
    if (this.violations.every(v => v.remediated)) this.status = 'Remediated';
    await this.save();
  }
};

ComplianceSchema.methods.updateAccreditation = async function(this: ICompliance, level: AccreditationLevel, score: number): Promise<void> {
  this.accreditationLevel = level;
  this.overallScore = score;
  const next = new Date();
  if (level === 'Gold Seal' || level === 'Silver') next.setFullYear(next.getFullYear() + 3);
  else if (level === 'Conditional') next.setFullYear(next.getFullYear() + 1);
  else if (level === 'Provisional') next.setMonth(next.getMonth() + 6);
  this.nextInspectionDate = next;
  await this.save();
};

ComplianceSchema.methods.scheduleFollowUp = async function(this: ICompliance, date: Date): Promise<void> {
  this.followUpRequired = true;
  this.followUpDate = date;
  this.followUpCompleted = false;
  await this.save();
};

ComplianceSchema.methods.completeFollowUp = async function(this: ICompliance): Promise<void> {
  this.followUpCompleted = true;
  this.followUpRequired = false;
  if (this.violations.every(v => v.remediated)) this.status = 'Compliant';
  await this.save();
};

ComplianceSchema.methods.calculateRemediationProgress = function(this: ICompliance): number {
  if (this.violations.length === 0) return 100;
  const remediated = this.violations.filter(v => v.remediated).length;
  return Math.round((remediated / this.violations.length) * 100);
};

const Compliance: Model<ICompliance> = mongoose.models.Compliance || mongoose.model<ICompliance>('Compliance', ComplianceSchema);
export default Compliance;
