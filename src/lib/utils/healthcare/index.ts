/**
 * @fileoverview Healthcare Industry Utilities
 * @module lib/utils/healthcare
 *
 * OVERVIEW:
 * Utility functions for healthcare industry calculations, validations, and business logic.
 * Supports hospitals, clinics, pharmaceuticals, medical devices, and research projects.
 * Provides standardized calculations for quality metrics, financial analysis, and regulatory compliance.
 *
 * BUSINESS LOGIC:
 * - Quality metric calculations (patient satisfaction, mortality rates, wait times)
 * - Financial analysis (profitability, reimbursement, cost analysis)
 * - Regulatory compliance checking (FDA, HIPAA, accreditation)
 * - Clinical trial success probability modeling
 * - Medical device classification and approval pathways
 * - Hospital/clinic operational efficiency metrics
 *
 * @created 2025-11-24
 * @author ECHO v1.3.0
 */

/**
 * ============================================================================
 * HOSPITAL UTILITIES
 * ============================================================================
 */

/**
 * Calculate hospital quality score based on multiple metrics
 */
export function calculateHospitalQualityScore(
  patientSatisfaction: number,
  mortalityRate: number,
  readmissionRate: number,
  accreditationStatus: string
): number {
  let score = 0;

  // Patient satisfaction (40% weight)
  score += (patientSatisfaction / 100) * 40;

  // Mortality rate (inverse scoring, 30% weight)
  // Lower mortality = higher score
  const mortalityScore = Math.max(0, 100 - (mortalityRate * 10));
  score += (mortalityScore / 100) * 30;

  // Readmission rate (inverse scoring, 20% weight)
  const readmissionScore = Math.max(0, 100 - (readmissionRate * 2));
  score += (readmissionScore / 100) * 20;

  // Accreditation bonus (10% weight)
  const accreditationBonus = accreditationStatus === 'Full' ? 100 :
                            accreditationStatus === 'Provisional' ? 50 : 0;
  score += (accreditationBonus / 100) * 10;

  return Math.round(score);
}

/**
 * Calculate hospital capacity utilization rate
 */
export function calculateHospitalCapacityUtilization(
  occupiedBeds: number,
  totalBeds: number,
  averageLengthOfStay: number
): number {
  const utilizationRate = (occupiedBeds / totalBeds) * 100;

  // Adjust for length of stay efficiency
  // Optimal length of stay is typically 4-6 days
  const losEfficiency = Math.max(0.5, Math.min(1.5, 5 / averageLengthOfStay));

  return Math.round(utilizationRate * losEfficiency);
}

/**
 * Calculate hospital financial projection based on current metrics
 */
export function calculateHospitalFinancialProjection(
  currentRevenue: number,
  operatingCosts: number,
  projectedGrowth: number,
  years: number
): number[] {
  const projections: number[] = [currentRevenue - operatingCosts];

  for (let i = 1; i <= years; i++) {
    const projectedRevenue = currentRevenue * Math.pow(1 + projectedGrowth, i);
    const projectedCosts = operatingCosts * Math.pow(1 + 0.03, i); // 3% annual cost increase
    const projectedProfit = projectedRevenue - projectedCosts;
    projections.push(Math.round(projectedProfit));
  }

  return projections;
}

/**
 * Calculate hospital patient satisfaction score
 */
export function calculateHospitalPatientSatisfaction(
  waitTime: number,
  staffRating: number,
  facilityRating: number,
  communicationRating: number
): number {
  // Weighted average of satisfaction factors
  const waitTimeScore = Math.max(0, 100 - (waitTime * 2)); // Lower wait time = higher score
  const overallScore = (
    waitTimeScore * 0.3 +
    staffRating * 0.3 +
    facilityRating * 0.2 +
    communicationRating * 0.2
  );

  return Math.round(overallScore);
}

/**
 * Validate hospital license information
 */
export function validateHospitalLicense(
  licenseNumber: string,
  state: string,
  accreditationStatus: string
): boolean {
  // Basic license format validation
  const licensePattern = /^[A-Z]{2}\d{6,8}$/;
  if (!licensePattern.test(licenseNumber)) return false;

  // Check state prefix
  if (!licenseNumber.startsWith(state.substring(0, 2).toUpperCase())) return false;

  // Accreditation validation
  const validAccreditations = ['Full', 'Provisional', 'None'];
  return validAccreditations.includes(accreditationStatus);
}

/**
 * Calculate hospital inflation adjustment for costs
 */
export function calculateHospitalInflationAdjustment(
  baseCost: number,
  years: number,
  inflationRate: number = 0.025
): number {
  return baseCost * Math.pow(1 + inflationRate, years);
}

/**
 * ============================================================================
 * CLINIC UTILITIES
 * ============================================================================
 */

/**
 * Calculate clinic efficiency score
 */
export function calculateClinicEfficiency(
  utilizationRate: number,
  waitTime: number,
  noShowRate: number,
  followUpCompliance: number
): number {
  let score = 0;

  // Utilization rate (30% weight) - optimal is 80-90%
  let utilizationScore = 0;
  if (utilizationRate >= 80 && utilizationRate <= 95) utilizationScore = 100;
  else if (utilizationRate >= 70 && utilizationRate <= 99) utilizationScore = 80;
  else utilizationScore = Math.max(0, 100 - Math.abs(85 - utilizationRate) * 2);
  score += (utilizationScore / 100) * 30;

  // Wait time (inverse scoring, 25% weight) - lower is better
  const waitTimeScore = Math.max(0, 100 - (waitTime / 2));
  score += (waitTimeScore / 100) * 25;

  // No-show rate (inverse scoring, 25% weight)
  const noShowScore = Math.max(0, 100 - (noShowRate * 4));
  score += (noShowScore / 100) * 25;

  // Follow-up compliance (20% weight)
  score += (followUpCompliance / 100) * 20;

  return Math.round(score);
}

/**
 * ============================================================================
 * PHARMACEUTICAL UTILITIES
 * ============================================================================
 */

/**
 * Calculate drug development success probability by phase
 */
export function calculateDrugSuccessProbability(
  currentPhase: string,
  therapeuticArea: string,
  companyExperience: number
): number {
  const baseProbabilities: Record<string, number> = {
    'Preclinical': 80,
    'Phase1': 65,
    'Phase2': 35,
    'Phase3': 60,
    'Filing': 85,
    'Approved': 95
  };

  let probability = baseProbabilities[currentPhase] || 50;

  // Adjust by therapeutic area difficulty
  const areaMultipliers: Record<string, number> = {
    'Oncology': 0.7,
    'Neurology': 0.75,
    'Cardiovascular': 0.9,
    'Infectious Disease': 0.85,
    'Endocrinology': 0.95,
    'Dermatology': 1.0
  };

  probability *= areaMultipliers[therapeuticArea] || 1.0;

  // Adjust by company experience (more experience = higher success)
  const experienceBonus = Math.min(0.2, companyExperience * 0.01);
  probability += experienceBonus * probability;

  return Math.min(95, Math.max(5, probability));
}

/**
 * Calculate patent value based on market potential and exclusivity
 */
export function calculatePatentValue(
  estimatedMarketSize: number,
  patentExpiration: Date,
  developmentStage: string
): number {
  const yearsRemaining = Math.max(0, (patentExpiration.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000));

  // Base value calculation
  let baseValue = estimatedMarketSize * 0.1; // 10% of market potential

  // Development stage multiplier
  const stageMultipliers: Record<string, number> = {
    'preclinical': 0.1,
    'phase1': 0.2,
    'phase2': 0.4,
    'phase3': 0.7,
    'approved': 1.0,
    'post_market': 0.8
  };

  baseValue *= stageMultipliers[developmentStage] || 0.1;

  // Time value (exponential decay)
  const timeValue = Math.pow(0.95, Math.max(0, 20 - yearsRemaining));

  return Math.round(baseValue * timeValue);
}

/**
 * ============================================================================
 * MEDICAL DEVICE UTILITIES
 * ============================================================================
 */

/**
 * Determine FDA device classification based on risk level
 */
export function determineDeviceClass(
  riskLevel: 'Low' | 'Moderate' | 'High',
  contactDuration: 'Transient' | 'Short-term' | 'Long-term',
  bodyContact: 'External' | 'Mucosal' | 'Internal'
): 'Class I' | 'Class II' | 'Class III' {
  // Simplified classification logic based on FDA guidelines
  if (riskLevel === 'High' ||
      (bodyContact === 'Internal' && contactDuration === 'Long-term')) {
    return 'Class III';
  }

  if (riskLevel === 'Moderate' ||
      bodyContact === 'Internal' ||
      contactDuration === 'Long-term') {
    return 'Class II';
  }

  return 'Class I';
}

/**
 * Calculate device reimbursement rate based on classification and innovation
 */
export function calculateDeviceReimbursement(
  deviceClass: 'Class I' | 'Class II' | 'Class III',
  innovationLevel: 'Incremental' | 'Moderate' | 'Breakthrough',
  clinicalEvidence: number // 0-100
): number {
  // Base reimbursement rates by class
  const baseRates: Record<string, number> = {
    'Class I': 0.6,    // 60% of cost
    'Class II': 0.75,  // 75% of cost
    'Class III': 0.85  // 85% of cost
  };

  let rate = baseRates[deviceClass];

  // Innovation bonus
  const innovationBonuses: Record<string, number> = {
    'Incremental': 0,
    'Moderate': 0.05,
    'Breakthrough': 0.15
  };

  rate += innovationBonuses[innovationLevel];

  // Clinical evidence bonus (up to 10% based on evidence strength)
  rate += (clinicalEvidence / 100) * 0.1;

  return Math.min(1.0, rate);
}

/**
 * ============================================================================
 * RESEARCH UTILITIES
 * ============================================================================
 */

/**
 * Calculate clinical trial timeline by phase and patient count
 */
export function calculateTrialTimeline(
  phase: string,
  patientCount: number
): number {
  const baseTimelines: Record<string, number> = {
    'preclinical': 24,   // 24 months
    'phase1': 18,        // 18 months
    'phase2': 30,        // 30 months
    'phase3': 48,        // 48 months
    'phase4': 24,        // 24 months
    'post_market': 12    // 12 months
  };

  let months = baseTimelines[phase] || 24;

  // Adjust based on patient count (larger trials take longer)
  if (patientCount > 1000) {
    months *= 1.3; // 30% longer for large trials
  } else if (patientCount > 500) {
    months *= 1.2; // 20% longer for medium trials
  } else if (patientCount < 50) {
    months *= 0.8; // 20% shorter for small trials
  }

  return Math.round(months);
}

/**
 * Calculate research project risk score
 */
export function calculateResearchRisk(
  researchType: string,
  phase: string,
  regulatory?: {
    irbApproval?: boolean;
    fdaApproval?: boolean;
    adverseEvents?: number;
    seriousAdverseEvents?: number;
  }
): number {
  let riskScore = 50; // Base risk

  // Research type risk
  const typeRisks: Record<string, number> = {
    'clinical_trial': 40,
    'drug_discovery': 35,
    'device_development': 30,
    'biomarker_research': 20,
    'basic_research': 15,
    'translational': 25
  };
  riskScore += typeRisks[researchType] || 0;

  // Phase risk
  const phaseRisks: Record<string, number> = {
    'preclinical': 20,
    'phase1': 40,
    'phase2': 60,
    'phase3': 80,
    'phase4': 30,
    'post_market': 15
  };
  riskScore += phaseRisks[phase] || 0;

  // Regulatory risk
  if (!regulatory?.irbApproval) riskScore += 20;
  if (!regulatory?.fdaApproval) riskScore += 15;
  if ((regulatory?.adverseEvents || 0) > 10) riskScore += 25;
  if ((regulatory?.seriousAdverseEvents || 0) > 2) riskScore += 30;

  return Math.max(0, Math.min(100, riskScore));
}

/**
 * Calculate funding efficiency for research projects
 */
export function calculateFundingEfficiency(
  funding?: {
    totalBudget?: number;
    fundingSource?: string;
  },
  timeline?: {
    startDate?: Date;
    estimatedCompletion?: Date;
  },
  status?: string
): number {
  if (!funding?.totalBudget || funding.totalBudget <= 0) return 0;

  const budget = funding.totalBudget;
  let efficiency = 50; // Base efficiency

  // Funding source efficiency
  const sourceMultipliers: Record<string, number> = {
    'government': 1.2,
    'foundation': 1.1,
    'venture_capital': 0.9,
    'pharma': 1.0,
    'private': 0.8,
    'internal': 1.3
  };
  efficiency *= sourceMultipliers[funding.fundingSource || 'private'] || 1.0;

  // Timeline efficiency
  if (timeline?.startDate && timeline?.estimatedCompletion) {
    const now = new Date();
    const start = new Date(timeline.startDate);
    const end = new Date(timeline.estimatedCompletion);
    const totalMonths = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const elapsedMonths = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const progressRatio = Math.min(1, elapsedMonths / totalMonths);

    // Efficiency bonus for on-time progress
    if (progressRatio < 0.8) efficiency *= 1.1; // Ahead of schedule
    else if (progressRatio > 1.2) efficiency *= 0.9; // Behind schedule
  }

  // Status efficiency
  const statusMultipliers: Record<string, number> = {
    'completed': 1.2,
    'active': 1.0,
    'recruiting': 0.9,
    'planning': 0.7,
    'on_hold': 0.5,
    'terminated': 0.3
  };
  efficiency *= statusMultipliers[status || 'planning'] || 1.0;

  return Math.max(0, Math.min(100, efficiency));
}

/**
 * Calculate trial success probability
 */
export function calculateTrialSuccessProbability(
  phase: string,
  therapeuticArea: string,
  participants?: {
    targetCount?: number;
    enrolledCount?: number;
  },
  regulatory?: {
    irbApproval?: boolean;
    fdaApproval?: boolean;
  }
): number {
  // Start with drug success probability
  let probability = calculateDrugSuccessProbability(phase, therapeuticArea, 0);

  // Adjust for participant enrollment
  if (participants?.targetCount && participants?.enrolledCount) {
    const enrollmentRate = participants.enrolledCount / participants.targetCount;
    if (enrollmentRate < 0.5) probability *= 0.7; // Low enrollment hurts success
    else if (enrollmentRate > 0.9) probability *= 1.1; // High enrollment helps
  }

  // Regulatory approval bonus
  if (regulatory?.irbApproval) probability *= 1.1;
  if (regulatory?.fdaApproval) probability *= 1.2;

  return Math.min(95, Math.max(5, probability));
}

/**
 * Calculate regulatory timeline for approval
 */
export function calculateRegulatoryTimeline(
  phase: string,
  researchType: string,
  regulatory?: {
    irbApproval?: boolean;
    fdaApproval?: boolean;
  }
): number {
  // Base timelines in months
  const baseTimelines: Record<string, number> = {
    'preclinical': 6,
    'phase1': 3,
    'phase2': 6,
    'phase3': 12,
    'phase4': 6,
    'post_market': 3
  };

  let timeline = baseTimelines[phase] || 6;

  // Research type adjustments
  const typeMultipliers: Record<string, number> = {
    'clinical_trial': 1.0,
    'drug_discovery': 1.2,
    'device_development': 0.8,
    'biomarker_research': 0.6,
    'basic_research': 0.4,
    'translational': 0.9
  };
  timeline *= typeMultipliers[researchType] || 1.0;

  // Approval status adjustments
  if (regulatory?.irbApproval) timeline *= 0.8; // Already approved, faster process
  if (regulatory?.fdaApproval) timeline *= 0.7; // Pre-approved, much faster

  return Math.round(timeline * 10) / 10;
}

/**
 * Project research outcomes based on current parameters
 */
export function projectResearchOutcomes(
  therapeuticArea: string,
  researchType: string,
  totalBudget: number,
  startDate?: Date
): {
  projectedPublications: number;
  projectedPatents: number;
  projectedRevenue: number;
  timelineMonths: number;
  successProbability: number;
} {
  const now = new Date();
  const start = startDate ? new Date(startDate) : now;

  // Base projections
  let publications = 0;
  let patents = 0;
  let revenue = 0;
  let timeline = 24; // 24 months default

  // Therapeutic area adjustments
  const areaMultipliers: Record<string, { publications: number; patents: number; revenue: number; timeline: number; }> = {
    'Oncology': { publications: 2.0, patents: 1.8, revenue: 3.0, timeline: 1.2 },
    'Neurology': { publications: 1.8, patents: 1.5, revenue: 2.5, timeline: 1.3 },
    'Cardiovascular': { publications: 1.5, patents: 1.2, revenue: 2.0, timeline: 1.0 },
    'Rare Diseases': { publications: 1.3, patents: 2.0, revenue: 4.0, timeline: 1.5 },
    'Other': { publications: 1.0, patents: 1.0, revenue: 1.0, timeline: 1.0 }
  };

  const multipliers = areaMultipliers[therapeuticArea] || areaMultipliers['Other'];

  // Research type adjustments
  const typeMultipliers: Record<string, { publications: number; patents: number; revenue: number; timeline: number; }> = {
    'clinical_trial': { publications: 1.5, patents: 0.8, revenue: 2.0, timeline: 1.0 },
    'drug_discovery': { publications: 1.2, patents: 2.0, revenue: 3.0, timeline: 1.3 },
    'device_development': { publications: 1.0, patents: 1.5, revenue: 1.8, timeline: 0.9 },
    'biomarker_research': { publications: 1.8, patents: 1.2, revenue: 1.2, timeline: 0.8 },
    'basic_research': { publications: 2.0, patents: 0.5, revenue: 0.5, timeline: 0.7 },
    'translational': { publications: 1.3, patents: 1.3, revenue: 1.5, timeline: 1.1 }
  };

  const typeMult = typeMultipliers[researchType] || { publications: 1.0, patents: 1.0, revenue: 1.0, timeline: 1.0 };

  // Calculate projections
  publications = Math.round(5 * multipliers.publications * typeMult.publications);
  patents = Math.round(2 * multipliers.patents * typeMult.patents);
  revenue = Math.round(totalBudget * 2 * multipliers.revenue * typeMult.revenue);
  timeline = Math.round(24 * multipliers.timeline * typeMult.timeline);

  // Success probability
  const successProbability = calculateDrugSuccessProbability('phase3', therapeuticArea, 0);

  return {
    projectedPublications: publications,
    projectedPatents: patents,
    projectedRevenue: revenue,
    timelineMonths: timeline,
    successProbability
  };
}

/**
 * ============================================================================
 * GENERAL HEALTHCARE UTILITIES
 * ============================================================================
 */

/**
 * Calculate healthcare inflation adjustment
 */
export function calculateHealthcareInflation(baseCost: number, years: number): number {
  // Healthcare inflation typically 2-3% above general inflation
  const annualInflation = 0.025; // 2.5%
  return baseCost * Math.pow(1 + annualInflation, years);
}

/**
 * Validate healthcare license numbers
 */
export function validateHealthcareLicense(
  licenseType: 'Medical' | 'Pharmacy' | 'Nursing',
  licenseNumber: string,
  state: string
): boolean {
  // Simplified validation - in real implementation, would check against state databases
  const patterns: Record<string, RegExp> = {
    'Medical': /^[A-Z]{2}\d{6}$/,  // e.g., MD123456
    'Pharmacy': /^[A-Z]{2}\d{5}$/, // e.g., RX12345
    'Nursing': /^[A-Z]{2}\d{7}$/   // e.g., RN1234567
  };

  const pattern = patterns[licenseType];
  if (!pattern) return false;

  return pattern.test(licenseNumber) && licenseNumber.startsWith(state.substring(0, 2).toUpperCase());
}

/**
 * Calculate patient volume projections
 */
export function projectPatientVolume(
  currentVolume: number,
  growthRate: number,
  years: number,
  marketConditions: 'Favorable' | 'Neutral' | 'Challenging'
): number[] {
  const projections: number[] = [currentVolume];

  // Adjust growth rate by market conditions
  const conditionMultipliers: Record<string, number> = {
    'Favorable': 1.2,
    'Neutral': 1.0,
    'Challenging': 0.8
  };

  const adjustedRate = growthRate * conditionMultipliers[marketConditions];

  for (let i = 1; i <= years; i++) {
    const projected = projections[i-1] * (1 + adjustedRate);
    projections.push(Math.round(projected));
  }

  return projections;
}

/**
 * Project hospital patient growth based on demographic trends and service expansion
 */
export function projectHospitalPatientGrowth(
  currentPatients: number,
  demographicGrowth: number,
  serviceExpansion: number,
  competitionLevel: 'Low' | 'Medium' | 'High',
  years: number
): number[] {
  const projections: number[] = [currentPatients];

  // Competition impact on growth
  const competitionMultipliers: Record<string, number> = {
    'Low': 1.0,
    'Medium': 0.9,
    'High': 0.75
  };

  const competitionMultiplier = competitionMultipliers[competitionLevel];

  for (let i = 1; i <= years; i++) {
    // Combined growth from demographics and service expansion
    const totalGrowthRate = (demographicGrowth + serviceExpansion) * competitionMultiplier;
    const projected = projections[i-1] * (1 + totalGrowthRate);
    projections.push(Math.round(projected));
  }

  return projections;
}

/**
 * ============================================================================
 * VALIDATION UTILITIES
 * ============================================================================
 */

/**
 * Validate healthcare business metrics
 * Returns validation result with isValid flag and errors object
 */
export function validateHealthcareMetrics(metrics: Record<string, number | string | boolean>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Common validations
  if (typeof metrics.patientSatisfaction === 'number' && (metrics.patientSatisfaction < 0 || metrics.patientSatisfaction > 100)) {
    errors.patientSatisfaction = 'Patient satisfaction must be between 0 and 100';
  }

  if (typeof metrics.mortalityRate === 'number' && (metrics.mortalityRate < 0 || metrics.mortalityRate > 100)) {
    errors.mortalityRate = 'Mortality rate must be between 0 and 100';
  }

  if (typeof metrics.marketShare === 'number' && (metrics.marketShare < 0 || metrics.marketShare > 100)) {
    errors.marketShare = 'Market share must be between 0 and 100';
  }

  if (typeof metrics.complianceScore === 'number' && (metrics.complianceScore < 0 || metrics.complianceScore > 100)) {
    errors.complianceScore = 'Compliance score must be between 0 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate hospital business metrics
 * Returns validation result with isValid flag and errors object
 */
export function validateHospitalMetrics(metrics: Record<string, any>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Common validations
  if (metrics.patientSatisfaction && (metrics.patientSatisfaction < 0 || metrics.patientSatisfaction > 100)) {
    errors.patientSatisfaction = 'Patient satisfaction must be between 0 and 100';
  }

  if (metrics.qualityScore && (metrics.qualityScore < 0 || metrics.qualityScore > 100)) {
    errors.qualityScore = 'Quality score must be between 0 and 100';
  }

  if (metrics.capacityUtilization && (metrics.capacityUtilization < 0 || metrics.capacityUtilization > 200)) {
    errors.capacityUtilization = 'Capacity utilization must be between 0 and 200';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Calculate clinical trial timeline (alias for calculateTrialTimeline)
 */
export function calculateClinicalTrialTimeline(phase: string, patientCount: number): number {
  return calculateTrialTimeline(phase, patientCount);
}

/**
 * Calculate regulatory compliance score
 */
export function calculateRegulatoryCompliance(
  documentationCompleteness: number,
  auditHistory: number,
  complianceTraining: number
): number {
  // Weighted average of compliance factors
  const score = (
    documentationCompleteness * 0.4 +
    auditHistory * 0.4 +
    complianceTraining * 0.2
  );

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate drug development costs
 */
export function calculateDrugDevelopmentCosts(
  phase: string,
  therapeuticArea: string,
  patientCount: number
): number {
  // Base costs by phase (in millions USD)
  const baseCosts: Record<string, number> = {
    'Preclinical': 50,
    'Phase1': 20,
    'Phase2': 50,
    'Phase3': 150,
    'Filing': 100
  };

  let cost = baseCosts[phase] || 50;

  // Therapeutic area multipliers
  const areaMultipliers: Record<string, number> = {
    'Oncology': 1.5,
    'Neurology': 1.3,
    'Cardiovascular': 1.2,
    'Rare Diseases': 2.0,
    'Other': 1.0
  };

  cost *= areaMultipliers[therapeuticArea] || 1.0;

  // Patient count adjustment
  cost *= (1 + patientCount / 10000);

  return Math.round(cost * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate pharmaceutical license information
 */
export function validatePharmaceuticalLicense(
  licenseNumber: string,
  issuingAuthority: string,
  expirationDate: Date
): boolean {
  // Basic license format validation
  const licensePattern = /^[A-Z]{2}\d{6,8}$/;
  if (!licensePattern.test(licenseNumber)) return false;

  // Check expiration
  if (expirationDate <= new Date()) return false;

  // Validate issuing authority
  const validAuthorities = ['FDA', 'EMA', 'MHRA', 'TGA', 'PMDA'];
  return validAuthorities.includes(issuingAuthority);
}

/**
 * Calculate market potential for pharmaceutical products
 */
export function calculateMarketPotential(
  targetPopulation: number,
  prevalenceRate: number,
  treatmentCost: number,
  marketPenetration: number
): number {
  // Calculate addressable market
  const addressablePatients = targetPopulation * prevalenceRate;
  const treatedPatients = addressablePatients * marketPenetration;

  return treatedPatients * treatmentCost;
}

/**
 * Validate pharmaceutical business metrics
 * Returns validation result with isValid flag and errors object
 */
export function validatePharmaceuticalMetrics(metrics: Record<string, number | boolean>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Common validations
  if (typeof metrics.successProbability === 'number' && (metrics.successProbability < 0 || metrics.successProbability > 100)) {
    errors.successProbability = 'Success probability must be between 0 and 100';
  }

  if (typeof metrics.marketShare === 'number' && (metrics.marketShare < 0 || metrics.marketShare > 100)) {
    errors.marketShare = 'Market share must be between 0 and 100';
  }

  if (typeof metrics.patentValue === 'number' && metrics.patentValue < 0) {
    errors.patentValue = 'Patent value cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate research project metrics
 * Returns validation result with isValid flag and errors object
 */
export function validateResearchMetrics(metrics: Record<string, number | boolean>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Common validations
  if (typeof metrics.progress === 'number' && (metrics.progress < 0 || metrics.progress > 100)) {
    errors.progress = 'Progress must be between 0 and 100';
  }

  if (typeof metrics.riskScore === 'number' && (metrics.riskScore < 0 || metrics.riskScore > 100)) {
    errors.riskScore = 'Risk score must be between 0 and 100';
  }

  if (typeof metrics.funding === 'number' && metrics.funding < 0) {
    errors.funding = 'Funding cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate insurance company metrics
 */
export function validateInsuranceMetrics(metrics: Record<string, number>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate claim ratio (should be reasonable percentage)
  if (metrics.claimRatio && (metrics.claimRatio < 0 || metrics.claimRatio > 200)) {
    errors.claimRatio = 'Claim ratio must be between 0 and 200 percent';
  }

  // Validate underwriting profit (can be negative but not extremely so)
  if (metrics.underwritingProfit && metrics.underwritingProfit < -1000000) {
    errors.underwritingProfit = 'Underwriting profit cannot be less than -1M';
  }

  // Validate risk pool stability (should be positive for stable pools)
  if (metrics.riskPoolStability && metrics.riskPoolStability < -100) {
    errors.riskPoolStability = 'Risk pool stability cannot be less than -100';
  }

  // Validate network adequacy (should be percentage between 0-100)
  if (metrics.networkAdequacy && (metrics.networkAdequacy < 0 || metrics.networkAdequacy > 100)) {
    errors.networkAdequacy = 'Network adequacy must be between 0 and 100 percent';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * ============================================================================
 * CLINIC ADVANCED UTILITIES (Object-Based Signatures)
 * ============================================================================
 * These functions accept object parameters matching API route usage patterns.
 * They compose the primitive-based functions for complex clinic calculations.
 */

/**
 * Clinic capacity interface for typed function parameters
 */
export interface ClinicCapacity {
  examRooms?: number;
  dailyCapacity?: number;
  parkingSpaces?: number;
}

/**
 * Clinic staffing interface for typed function parameters
 */
export interface ClinicStaffing {
  physicians?: number;
  nursePractitioners?: number;
  nurses?: number;
  medicalAssistants?: number;
  administrative?: number;
}

/**
 * Clinic performance interface for typed function parameters
 */
export interface ClinicPerformance {
  averageWaitTime?: number;
  patientSatisfaction?: number;
  noShowRate?: number;
  followUpCompliance?: number;
}

/**
 * Clinic financials interface for typed function parameters
 */
export interface ClinicFinancials {
  annualRevenue?: number;
  annualCosts?: number;
  payerMix?: {
    insurance?: number;
    selfPay?: number;
    medicare?: number;
    medicaid?: number;
  };
}

/**
 * Clinic location interface for typed function parameters
 */
export interface ClinicLocation {
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

/**
 * Calculate clinic efficiency using object parameters (API-compatible)
 * Overload that accepts object parameters for route compatibility
 */
export function calculateClinicEfficiencyFromObjects(
  capacity: ClinicCapacity,
  staffing: ClinicStaffing,
  performance: ClinicPerformance
): number {
  // Calculate utilization rate from capacity and staffing
  const totalStaff = (staffing.physicians || 0) + (staffing.nursePractitioners || 0) + 
                     (staffing.nurses || 0) + (staffing.medicalAssistants || 0);
  const optimalStaffRatio = 4; // 4 patients per staff member optimal
  const theoreticalCapacity = totalStaff * optimalStaffRatio * 8; // 8 hour day
  const dailyCapacity = capacity.dailyCapacity || theoreticalCapacity;
  const utilizationRate = Math.min(100, (theoreticalCapacity / dailyCapacity) * 100);

  // Extract performance metrics with defaults
  const waitTime = performance.averageWaitTime || 30;
  const noShowRate = performance.noShowRate || 10;
  const followUpCompliance = performance.followUpCompliance || 80;

  // Use the primitive function
  return calculateClinicEfficiency(utilizationRate, waitTime, noShowRate, followUpCompliance);
}

/**
 * Calculate clinic patient flow metrics
 * Analyzes patient throughput, bottlenecks, and flow efficiency
 */
export function calculateClinicPatientFlow(
  dailyCapacity: number,
  staffing: ClinicStaffing,
  averageWaitTime: number
): {
  hourlyCapacity: number;
  peakHourCapacity: number;
  averageThroughput: number;
  capacityUtilization: number;
  staffEfficiency: number;
  bottleneckFactor: number;
} {
  // Calculate total clinical staff
  const clinicalStaff = (staffing.physicians || 0) + (staffing.nursePractitioners || 0);
  const supportStaff = (staffing.nurses || 0) + (staffing.medicalAssistants || 0);
  const totalStaff = clinicalStaff + supportStaff;

  // Hourly calculations (assume 8-hour operating day)
  const operatingHours = 8;
  const hourlyCapacity = Math.round(dailyCapacity / operatingHours);

  // Peak hour typically sees 20% more patients
  const peakHourCapacity = Math.round(hourlyCapacity * 1.2);

  // Average throughput based on staff and wait time
  const avgPatientTime = 15 + averageWaitTime; // 15 min avg visit + wait
  const patientsPerStaffHour = Math.round(60 / avgPatientTime);
  const averageThroughput = clinicalStaff * patientsPerStaffHour;

  // Capacity utilization
  const capacityUtilization = Math.min(100, (averageThroughput / hourlyCapacity) * 100);

  // Staff efficiency (patients per staff member per hour)
  const staffEfficiency = totalStaff > 0 ? Math.round((averageThroughput / totalStaff) * 100) / 100 : 0;

  // Bottleneck factor (1.0 = no bottleneck, higher = worse)
  const idealWaitTime = 10; // 10 minutes ideal
  const bottleneckFactor = Math.round((averageWaitTime / idealWaitTime) * 100) / 100;

  return {
    hourlyCapacity,
    peakHourCapacity,
    averageThroughput,
    capacityUtilization: Math.round(capacityUtilization),
    staffEfficiency,
    bottleneckFactor
  };
}

/**
 * Calculate clinic financial projection
 * Projects revenue, costs, and profitability over time
 */
export function calculateClinicFinancialProjection(
  financials: ClinicFinancials,
  capacity: ClinicCapacity,
  staffing: ClinicStaffing
): {
  currentProfit: number;
  profitMargin: number;
  projectedAnnualGrowth: number;
  breakEvenPoint: number;
  revenuePerPatient: number;
  costPerPatient: number;
  profitability: number;
  yearlyProjection: number[];
} {
  const revenue = financials.annualRevenue || 0;
  const costs = financials.annualCosts || 0;
  const dailyPatients = capacity.dailyCapacity || 50;
  const annualPatients = dailyPatients * 260; // 260 working days

  // Current profit
  const currentProfit = revenue - costs;
  const profitMargin = revenue > 0 ? Math.round((currentProfit / revenue) * 100) : 0;

  // Per-patient metrics
  const revenuePerPatient = annualPatients > 0 ? Math.round(revenue / annualPatients) : 0;
  const costPerPatient = annualPatients > 0 ? Math.round(costs / annualPatients) : 0;

  // Growth projection based on staffing and capacity
  const totalStaff = (staffing.physicians || 0) + (staffing.nursePractitioners || 0) + 
                     (staffing.nurses || 0) + (staffing.medicalAssistants || 0);
  const staffCapacityRatio = totalStaff / (dailyPatients / 10); // Ideal: 1 staff per 10 daily patients
  const baseGrowth = 0.03; // 3% base annual growth
  const staffBonus = Math.min(0.05, staffCapacityRatio * 0.02); // Up to 5% bonus from good staffing
  const projectedAnnualGrowth = Math.round((baseGrowth + staffBonus) * 100);

  // Break-even point (months to recover investment)
  const breakEvenPoint = currentProfit > 0 ? Math.round(costs / (currentProfit / 12)) : 999;

  // 5-year projection
  const yearlyProjection: number[] = [currentProfit];
  for (let i = 1; i <= 5; i++) {
    const projectedRevenue = revenue * Math.pow(1 + (projectedAnnualGrowth / 100), i);
    const projectedCosts = costs * Math.pow(1.025, i); // 2.5% cost inflation
    yearlyProjection.push(Math.round(projectedRevenue - projectedCosts));
  }

  return {
    currentProfit,
    profitMargin,
    projectedAnnualGrowth,
    breakEvenPoint,
    revenuePerPatient,
    costPerPatient,
    profitability: currentProfit,
    yearlyProjection
  };
}

/**
 * Calculate clinic service utilization
 * Analyzes how efficiently services and resources are being used
 */
export function calculateClinicServiceUtilization(
  services: string[],
  capacity: ClinicCapacity,
  staffing: ClinicStaffing
): {
  serviceCount: number;
  servicesPerStaff: number;
  examRoomUtilization: number;
  overallUtilization: number;
  utilizationByService: Record<string, number>;
  recommendations: string[];
} {
  const serviceCount = services.length;
  const totalClinicalStaff = (staffing.physicians || 0) + (staffing.nursePractitioners || 0);
  const examRooms = capacity.examRooms || 5;
  const dailyCapacity = capacity.dailyCapacity || 50;

  // Services per staff member
  const servicesPerStaff = totalClinicalStaff > 0 ? 
    Math.round((serviceCount / totalClinicalStaff) * 100) / 100 : 0;

  // Exam room utilization (patients per room per day)
  const patientsPerRoom = dailyCapacity / examRooms;
  const idealPatientsPerRoom = 12; // 12 patients per room per 8-hour day = 40 min appointments
  const examRoomUtilization = Math.min(100, Math.round((patientsPerRoom / idealPatientsPerRoom) * 100));

  // Overall utilization composite score
  const overallUtilization = Math.round(
    (examRoomUtilization * 0.6) + // Exam rooms are primary driver
    (servicesPerStaff * 10 * 0.4) // Services coverage
  );

  // Utilization by service type (estimated)
  const utilizationByService: Record<string, number> = {};
  const baseUtilization = overallUtilization;
  services.forEach((service, index) => {
    // Vary utilization slightly by service
    const variance = ((index % 3) - 1) * 5; // -5, 0, or +5
    utilizationByService[service] = Math.min(100, Math.max(0, baseUtilization + variance));
  });

  // Generate recommendations
  const recommendations: string[] = [];
  if (examRoomUtilization < 70) {
    recommendations.push('Consider reducing exam rooms or increasing patient volume');
  }
  if (examRoomUtilization > 95) {
    recommendations.push('Near capacity - consider adding exam rooms');
  }
  if (servicesPerStaff > 5) {
    recommendations.push('High service load per staff - consider specialization');
  }
  if (servicesPerStaff < 2 && totalClinicalStaff > 2) {
    recommendations.push('Low service coverage - consider expanding service offerings');
  }

  return {
    serviceCount,
    servicesPerStaff,
    examRoomUtilization,
    overallUtilization: Math.min(100, overallUtilization),
    utilizationByService,
    recommendations
  };
}

/**
 * Calculate clinic wait times projection
 * Estimates wait times based on capacity, staffing, and clinic type
 */
export function calculateClinicWaitTimes(
  capacity: ClinicCapacity,
  staffing: ClinicStaffing,
  clinicType: string
): {
  estimatedWaitTime: number;
  peakWaitTime: number;
  offPeakWaitTime: number;
  waitTimeByHour: number[];
  waitTimeRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  improvementPotential: number;
} {
  // Base wait times by clinic type
  const baseWaitTimes: Record<string, number> = {
    'primary_care': 20,
    'specialty': 25,
    'urgent_care': 15,
    'dental': 12,
    'mental_health': 10,
    'surgical': 30,
    'Primary Care': 20,
    'Specialty': 25,
    'Urgent Care': 15,
    'Diagnostic': 18
  };

  const baseWait = baseWaitTimes[clinicType] || 20;

  // Calculate staff-to-capacity ratio impact
  const totalClinicalStaff = (staffing.physicians || 0) + (staffing.nursePractitioners || 0);
  const dailyCapacity = capacity.dailyCapacity || 50;
  const staffRatio = totalClinicalStaff / (dailyCapacity / 20); // Ideal: 1 clinician per 20 patients
  const staffImpact = staffRatio >= 1 ? -5 : Math.round((1 - staffRatio) * 15);

  // Exam room impact
  const examRooms = capacity.examRooms || 5;
  const roomRatio = examRooms / (dailyCapacity / 10); // Ideal: 1 room per 10 patients
  const roomImpact = roomRatio >= 1 ? -3 : Math.round((1 - roomRatio) * 10);

  // Calculate estimated wait time
  const estimatedWaitTime = Math.max(5, Math.round(baseWait + staffImpact + roomImpact));

  // Peak and off-peak times
  const peakWaitTime = Math.round(estimatedWaitTime * 1.5);
  const offPeakWaitTime = Math.round(estimatedWaitTime * 0.6);

  // Wait time by hour (8 AM to 5 PM)
  const waitTimeByHour: number[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    let hourlyWait = estimatedWaitTime;
    // Peak hours: 9-11 AM and 2-4 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      hourlyWait = peakWaitTime;
    } else if (hour === 8 || hour === 12 || hour === 17) {
      hourlyWait = offPeakWaitTime;
    }
    waitTimeByHour.push(hourlyWait);
  }

  // Rating based on estimated wait time
  let waitTimeRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  if (estimatedWaitTime <= 10) waitTimeRating = 'Excellent';
  else if (estimatedWaitTime <= 20) waitTimeRating = 'Good';
  else if (estimatedWaitTime <= 35) waitTimeRating = 'Fair';
  else waitTimeRating = 'Poor';

  // Improvement potential (percentage reduction possible with optimal staffing/resources)
  const idealWait = Math.max(5, baseWait - 10);
  const improvementPotential = Math.round(((estimatedWaitTime - idealWait) / estimatedWaitTime) * 100);

  return {
    estimatedWaitTime,
    peakWaitTime,
    offPeakWaitTime,
    waitTimeByHour,
    waitTimeRating,
    improvementPotential
  };
}

/**
 * Project clinic demand based on location and specialties
 * Forecasts patient demand for clinic planning
 */
export function projectClinicDemand(
  location: ClinicLocation,
  specialties: string[],
  clinicType: string
): {
  estimatedMonthlyDemand: number;
  demandGrowthRate: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  marketPotential: number;
  seasonalFactors: number[];
  demandBySpecialty: Record<string, number>;
} {
  // Base demand by clinic type
  const baseDemand: Record<string, number> = {
    'primary_care': 1500,
    'specialty': 800,
    'urgent_care': 2000,
    'dental': 600,
    'mental_health': 400,
    'surgical': 300,
    'Primary Care': 1500,
    'Specialty': 800,
    'Urgent Care': 2000,
    'Diagnostic': 700
  };

  const monthlyBase = baseDemand[clinicType] || 1000;

  // Location-based adjustments (simplified - in production would use real demographic data)
  const stateMultipliers: Record<string, number> = {
    'CA': 1.4, 'TX': 1.3, 'FL': 1.3, 'NY': 1.5,
    'PA': 1.1, 'IL': 1.2, 'OH': 1.0, 'GA': 1.1,
    'NC': 1.1, 'MI': 1.0
  };
  const locationMultiplier = stateMultipliers[location.state || ''] || 1.0;

  // Specialty demand multipliers
  const specialtyMultipliers: Record<string, number> = {
    'Cardiology': 1.3,
    'Orthopedics': 1.2,
    'Dermatology': 1.1,
    'Pediatrics': 1.4,
    'Geriatrics': 1.5,
    'Mental Health': 1.3,
    'General Practice': 1.0,
    'Internal Medicine': 1.1
  };

  // Calculate specialty-adjusted demand
  let totalSpecialtyMultiplier = 1.0;
  const demandBySpecialty: Record<string, number> = {};
  
  specialties.forEach(specialty => {
    const mult = specialtyMultipliers[specialty] || 1.0;
    totalSpecialtyMultiplier += (mult - 1) * 0.2; // 20% weight per specialty
    demandBySpecialty[specialty] = Math.round(monthlyBase * mult * locationMultiplier / specialties.length);
  });

  // Final monthly demand
  const estimatedMonthlyDemand = Math.round(monthlyBase * locationMultiplier * totalSpecialtyMultiplier);

  // Growth rate based on healthcare trends (3-8% annually)
  const demandGrowthRate = Math.round((3 + Math.random() * 5) * 10) / 10;

  // Competition level (simplified)
  const competitionLevel: 'Low' | 'Medium' | 'High' = 
    locationMultiplier > 1.3 ? 'High' : locationMultiplier > 1.1 ? 'Medium' : 'Low';

  // Market potential (annual revenue potential in $)
  const avgRevenuePerVisit = 150;
  const marketPotential = estimatedMonthlyDemand * 12 * avgRevenuePerVisit;

  // Seasonal factors (monthly index, Jan = index 0)
  const seasonalFactors = [
    0.85,  // Jan - post-holiday slowdown
    0.90,  // Feb
    1.05,  // Mar - flu season tail
    1.00,  // Apr
    0.95,  // May
    0.90,  // Jun - summer slowdown
    0.85,  // Jul
    0.90,  // Aug - back to school
    1.05,  // Sep
    1.10,  // Oct - flu season start
    1.15,  // Nov
    1.10   // Dec
  ];

  return {
    estimatedMonthlyDemand,
    demandGrowthRate,
    competitionLevel,
    marketPotential,
    seasonalFactors,
    demandBySpecialty
  };
}

/**
 * Validate clinic license and accreditations
 * Checks if clinic meets licensing requirements
 */
export function validateClinicLicense(
  accreditations: string[]
): boolean {
  // Check for essential accreditations
  const essentialAccreditations = ['State License', 'CMS Certification'];
  const hasEssential = essentialAccreditations.some(acc => 
    accreditations.some(a => a.toLowerCase().includes(acc.toLowerCase()))
  );

  // If no accreditations provided, assume basic compliance
  if (accreditations.length === 0) return true;

  // Check for any disqualifying conditions (none listed = valid)
  const disqualifying = ['Suspended', 'Revoked', 'Expired'];
  const hasDisqualifying = accreditations.some(acc =>
    disqualifying.some(d => acc.toLowerCase().includes(d.toLowerCase()))
  );

  return !hasDisqualifying && (hasEssential || accreditations.length > 0);
}

/**
 * Validate clinic metrics for business rules
 * Returns validation result with any errors found
 */
export function validateClinicMetrics(
  metrics: {
    efficiency?: number;
    patientFlow?: number;
    financialHealth?: boolean;
  }
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Efficiency validation (0-100)
  if (metrics.efficiency !== undefined) {
    if (metrics.efficiency < 0 || metrics.efficiency > 100) {
      errors.efficiency = 'Efficiency must be between 0 and 100';
    }
  }

  // Patient flow validation (0-100)
  if (metrics.patientFlow !== undefined) {
    if (metrics.patientFlow < 0 || metrics.patientFlow > 100) {
      errors.patientFlow = 'Patient flow must be between 0 and 100';
    }
  }

  // Financial health is boolean, no validation needed beyond type

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * ============================================================================
 * ROUTE-COMPATIBLE OVERLOADS
 * ============================================================================
 * These functions provide simpler signatures for route compatibility.
 * They wrap the more complex utility functions with sensible defaults.
 */

/**
 * Determine device class from FDA approval pathway (route-compatible)
 * Maps FDA approval pathway to device class with reasonable defaults
 * @param fdaApproval - The FDA approval pathway string
 */
export function determineDeviceClassFromApproval(
  fdaApproval: string
): 'Class I' | 'Class II' | 'Class III' {
  // Map FDA approval pathways to device classes
  const approvalToClass: Record<string, 'Class I' | 'Class II' | 'Class III'> = {
    '510(k)': 'Class II',
    'PMA': 'Class III',
    'De Novo': 'Class II',
    'HDE': 'Class III',
    'Exempt': 'Class I',
    'Class I': 'Class I',
    'Class II': 'Class II',
    'Class III': 'Class III'
  };
  
  return approvalToClass[fdaApproval] || 'Class II';
}

/**
 * Calculate device reimbursement from product data (route-compatible)
 * Accepts reimbursement code, price, and device class directly
 */
export function calculateDeviceReimbursementSimple(
  reimbursementCode: string,
  averageSellingPrice: number,
  deviceClass: string
): number {
  // Map device class to base rate
  const classRates: Record<string, number> = {
    'Class I': 0.6,
    'Class II': 0.75,
    'Class III': 0.85
  };
  
  const baseRate = classRates[deviceClass] || 0.7;
  
  // Code-based adjustments
  let codeBonus = 0;
  if (reimbursementCode?.startsWith('C')) codeBonus = 0.05; // Category C codes
  if (reimbursementCode?.startsWith('L')) codeBonus = 0.03; // L codes
  
  return Math.min(1.0, baseRate + codeBonus) * averageSellingPrice;
}

/**
 * Validate healthcare license from accreditations array (route-compatible)
 * Accepts an array of accreditation strings and validates
 */
export function validateHealthcareLicenseFromAccreditations(
  accreditations: string[] | Record<string, any>
): boolean {
  // Handle array of strings
  if (Array.isArray(accreditations)) {
    if (accreditations.length === 0) return true;
    
    const disqualifying = ['Suspended', 'Revoked', 'Expired'];
    const hasDisqualifying = accreditations.some(acc =>
      typeof acc === 'string' && disqualifying.some(d => acc.toLowerCase().includes(d.toLowerCase()))
    );
    
    return !hasDisqualifying;
  }
  
  // Handle object (regulatory info)
  if (typeof accreditations === 'object' && accreditations !== null) {
    const regulatory = accreditations as Record<string, any>;
    // Check for valid compliance score
    if (regulatory.complianceScore !== undefined) {
      return regulatory.complianceScore >= 60;
    }
    // Check for recalls/warning letters
    if (regulatory.recalls > 2 || regulatory.warningLetters > 1) {
      return false;
    }
    return true;
  }
  
  return true;
}
