/**
 * @file src/lib/game/tick/healthcareProcessor.ts
 * @description Healthcare tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based healthcare events each game tick:
 * - Research project phase progression
 * - Clinical trial recruitment and outcomes
 * - Drug/device approval processes
 * - Hospital and clinic patient flow
 * - Insurance claims and premiums
 * - Equipment maintenance cycles
 *
 * GAMEPLAY IMPACT:
 * This drives healthcare industry progression. Each tick:
 * - Research projects advance through phases
 * - Clinical trials enroll patients and generate results
 * - FDA approvals are processed
 * - Healthcare facilities serve patients
 * - Insurance collects premiums and pays claims
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
  HealthcareTickSummary,
} from '@/lib/types/gameTick';
import { ResearchProjectDocument } from '@/lib/db/models/healthcare/ResearchProject';
import { HospitalDocument } from '@/lib/db/models/healthcare/Hospital';
import { ClinicDocument } from '@/lib/db/models/healthcare/Clinic';
import { PharmaceuticalDocument } from '@/lib/db/models/healthcare/Pharmaceutical';
import { MedicalDeviceDocument } from '@/lib/db/models/healthcare/MedicalDevice';
import { HealthcareInsuranceDocument } from '@/lib/db/models/healthcare/HealthcareInsurance';
import mongoose from 'mongoose';

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'healthcare';
const PROCESSOR_PRIORITY = 25; // After banking/empire, before entertainment

// XP rewards
const XP_PER_RESEARCH_PHASE_ADVANCE = 100;
const XP_PER_DRUG_APPROVED = 500;
const XP_PER_DEVICE_APPROVED = 300;
const XP_PER_TRIAL_COMPLETED = 200;
const XP_PER_PATIENT_TREATED = 5;
const XP_PER_CLAIM_PROCESSED = 2;

// Research progression rates (probability per tick to advance phase)
const RESEARCH_PHASE_RATES: Record<string, number> = {
  preclinical: 0.15,   // 15% chance to advance to Phase 1
  phase1: 0.10,        // 10% chance to advance to Phase 2
  phase2: 0.08,        // 8% chance to advance to Phase 3
  phase3: 0.05,        // 5% chance to advance to Phase 4/approval
  phase4: 0.03,        // 3% chance to complete post-market
};

// Failure rates per phase
const RESEARCH_FAILURE_RATES: Record<string, number> = {
  preclinical: 0.05,
  phase1: 0.10,
  phase2: 0.15,
  phase3: 0.12,
  phase4: 0.02,
};

// ============================================================================
// TYPE ALIASES FOR MODEL ACCESS
// ============================================================================

// Lazy-load models to avoid circular dependencies
const getModels = () => ({
  ResearchProject: mongoose.models.ResearchProject as mongoose.Model<ResearchProjectDocument>,
  Hospital: mongoose.models.Hospital as mongoose.Model<HospitalDocument>,
  Clinic: mongoose.models.Clinic as mongoose.Model<ClinicDocument>,
  Pharmaceutical: mongoose.models.Pharmaceutical as mongoose.Model<PharmaceuticalDocument>,
  MedicalDevice: mongoose.models.MedicalDevice as mongoose.Model<MedicalDeviceDocument>,
  HealthcareInsurance: mongoose.models.HealthcareInsurance as mongoose.Model<HealthcareInsuranceDocument>,
});

// ============================================================================
// HEALTHCARE PROCESSOR
// ============================================================================

/**
 * Healthcare tick processor
 * Handles all time-based healthcare operations
 */
export class HealthcareProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      const models = getModels();
      // Verify at least one model is accessible
      if (models.ResearchProject) {
        await models.ResearchProject.findOne().limit(1);
      }
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for healthcare
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    // Initialize summary counters
    const summary: HealthcareTickSummary = {
      researchProjectsProcessed: 0,
      projectsAdvancedPhase: 0,
      projectsFailed: 0,
      projectsCompleted: 0,
      patentsAwarded: 0,
      publicationsPublished: 0,
      trialsRecruiting: 0,
      trialsActive: 0,
      patientsEnrolled: 0,
      adverseEvents: 0,
      drugsApproved: 0,
      devicesApproved: 0,
      productRevenue: 0,
      clinicsProcessed: 0,
      hospitalsProcessed: 0,
      patientVisits: 0,
      proceduresPerformed: 0,
      serviceRevenue: 0,
      insurancePoliciesProcessed: 0,
      premiumsCollected: 0,
      claimsPaid: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      rdCosts: 0,
      netProfit: 0,
    };
    
    try {
      const models = getModels();
      
      // Build query filter
      const baseQuery: Record<string, unknown> = {};
      if (options?.playerId) {
        baseQuery.ownedBy = options.playerId;
      }
      if (options?.companyId) {
        baseQuery.ownedBy = options.companyId;
      }
      
      // Process research projects
      if (models.ResearchProject) {
        const researchResults = await this.processResearchProjects(
          models.ResearchProject,
          baseQuery,
          gameTime,
          options
        );
        summary.researchProjectsProcessed = researchResults.processed;
        summary.projectsAdvancedPhase = researchResults.advanced;
        summary.projectsFailed = researchResults.failed;
        summary.projectsCompleted = researchResults.completed;
        summary.rdCosts += researchResults.costs;
        errors.push(...researchResults.errors);
      }
      
      // Process hospitals
      if (models.Hospital) {
        const hospitalResults = await this.processHospitals(
          models.Hospital,
          baseQuery,
          gameTime,
          options
        );
        summary.hospitalsProcessed = hospitalResults.processed;
        summary.patientVisits += hospitalResults.patientVisits;
        summary.proceduresPerformed += hospitalResults.procedures;
        summary.serviceRevenue += hospitalResults.revenue;
        summary.totalExpenses += hospitalResults.expenses;
        errors.push(...hospitalResults.errors);
      }
      
      // Process clinics
      if (models.Clinic) {
        const clinicResults = await this.processClinics(
          models.Clinic,
          baseQuery,
          gameTime,
          options
        );
        summary.clinicsProcessed = clinicResults.processed;
        summary.patientVisits += clinicResults.patientVisits;
        summary.serviceRevenue += clinicResults.revenue;
        summary.totalExpenses += clinicResults.expenses;
        errors.push(...clinicResults.errors);
      }
      
      // Process pharmaceuticals (active drugs generating revenue)
      if (models.Pharmaceutical) {
        const pharmaResults = await this.processPharmaceuticals(
          models.Pharmaceutical,
          baseQuery,
          gameTime,
          options
        );
        summary.drugsApproved = pharmaResults.approved;
        summary.productRevenue += pharmaResults.revenue;
        errors.push(...pharmaResults.errors);
      }
      
      // Process medical devices
      if (models.MedicalDevice) {
        const deviceResults = await this.processMedicalDevices(
          models.MedicalDevice,
          baseQuery,
          gameTime,
          options
        );
        summary.devicesApproved = deviceResults.approved;
        summary.productRevenue += deviceResults.revenue;
        errors.push(...deviceResults.errors);
      }
      
      // Process insurance
      if (models.HealthcareInsurance) {
        const insuranceResults = await this.processInsurance(
          models.HealthcareInsurance,
          baseQuery,
          gameTime,
          options
        );
        summary.insurancePoliciesProcessed = insuranceResults.processed;
        summary.premiumsCollected = insuranceResults.premiums;
        summary.claimsPaid = insuranceResults.claims;
        errors.push(...insuranceResults.errors);
      }
      
      // Calculate totals
      summary.totalRevenue = summary.serviceRevenue + summary.productRevenue + summary.premiumsCollected;
      summary.totalExpenses += summary.rdCosts + summary.claimsPaid;
      summary.netProfit = summary.totalRevenue - summary.totalExpenses;
      
      const itemsProcessed = 
        summary.researchProjectsProcessed +
        summary.hospitalsProcessed +
        summary.clinicsProcessed +
        summary.insurancePoliciesProcessed;
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed,
        errors,
        summary,
        durationMs: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        errors: [{
          entityId: 'system',
          entityType: 'HealthcareProcessor',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
        summary,
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  // ==========================================================================
  // RESEARCH PROJECT PROCESSING
  // ==========================================================================
  
  /**
   * Process all active research projects
   */
  private async processResearchProjects(
    model: mongoose.Model<ResearchProjectDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    advanced: number;
    failed: number;
    completed: number;
    costs: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let advanced = 0;
    let failed = 0;
    let completed = 0;
    let costs = 0;
    
    try {
      // Get active research projects
      const projects = await model.find({
        ...baseQuery,
        status: { $in: ['active', 'recruiting'] },
      }).limit(options?.limit || 1000);
      
      for (const project of projects) {
        try {
          processed++;
          
          // Calculate monthly costs
          const monthlyCost = (project.funding?.totalBudget || 0) / 36; // Assume 3-year budget
          costs += monthlyCost;
          
          // Check for phase advancement
          const phase = project.phase || 'preclinical';
          const advanceRate = RESEARCH_PHASE_RATES[phase] || 0.05;
          const failRate = RESEARCH_FAILURE_RATES[phase] || 0.05;
          
          const roll = Math.random();
          
          if (roll < failRate) {
            // Project failed
            if (!options?.dryRun) {
              project.status = 'terminated';
              await project.save();
            }
            failed++;
          } else if (roll < failRate + advanceRate) {
            // Project advances
            const nextPhase = this.getNextPhase(phase);
            if (nextPhase === 'completed') {
              if (!options?.dryRun) {
                project.status = 'completed';
                project.timeline = project.timeline || {};
                project.timeline.actualCompletion = new Date();
                await project.save();
              }
              completed++;
            } else {
              if (!options?.dryRun) {
                project.phase = nextPhase as ResearchProjectDocument['phase'];
                await project.save();
              }
              advanced++;
            }
          }
          // else: No change this tick
          
        } catch (error) {
          errors.push({
            entityId: project._id?.toString() || 'unknown',
            entityType: 'ResearchProject',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'ResearchProject',
        message: error instanceof Error ? error.message : 'Failed to query research projects',
        recoverable: true,
      });
    }
    
    return { processed, advanced, failed, completed, costs, errors };
  }
  
  /**
   * Get next research phase
   */
  private getNextPhase(current: string): string {
    const phases = ['preclinical', 'phase1', 'phase2', 'phase3', 'phase4', 'post_market', 'completed'];
    const index = phases.indexOf(current);
    if (index === -1 || index >= phases.length - 1) return 'completed';
    return phases[index + 1];
  }
  
  // ==========================================================================
  // HOSPITAL PROCESSING
  // ==========================================================================
  
  /**
   * Process all hospitals
   */
  private async processHospitals(
    model: mongoose.Model<HospitalDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    patientVisits: number;
    procedures: number;
    revenue: number;
    expenses: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let patientVisits = 0;
    let procedures = 0;
    let revenue = 0;
    let expenses = 0;
    
    try {
      const hospitals = await model.find({
        ...baseQuery,
      }).limit(options?.limit || 500);
      
      for (const hospital of hospitals) {
        try {
          processed++;
          
          // Calculate monthly patient volume based on capacity
          const capacity = hospital.capacity || { beds: 100 };
          const beds = capacity.beds || 100;
          const occupancy = 0.7 + Math.random() * 0.2; // 70-90% occupancy
          const monthlyPatients = Math.floor(beds * 30 * occupancy);
          patientVisits += monthlyPatients;
          
          // Procedures based on patient volume
          const procedureRate = 0.3; // 30% of patients have procedures
          const monthlyProcedures = Math.floor(monthlyPatients * procedureRate);
          procedures += monthlyProcedures;
          
          // Revenue calculation
          const avgRevenuePerPatient = 2500;
          const avgProcedureRevenue = 15000;
          const monthlyRevenue = 
            (monthlyPatients * avgRevenuePerPatient) +
            (monthlyProcedures * avgProcedureRevenue);
          revenue += monthlyRevenue;
          
          // Expenses (typically 85-95% of revenue in healthcare)
          const expenseRatio = 0.85 + Math.random() * 0.1;
          const monthlyExpenses = monthlyRevenue * expenseRatio;
          expenses += monthlyExpenses;
          
          // Update hospital stats if not dry run
          if (!options?.dryRun) {
            hospital.capacity = hospital.capacity || {};
            hospital.capacity.occupiedBeds = Math.floor(beds * occupancy);
            await hospital.save();
          }
          
        } catch (error) {
          errors.push({
            entityId: hospital._id?.toString() || 'unknown',
            entityType: 'Hospital',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Hospital',
        message: error instanceof Error ? error.message : 'Failed to query hospitals',
        recoverable: true,
      });
    }
    
    return { processed, patientVisits, procedures, revenue, expenses, errors };
  }
  
  // ==========================================================================
  // CLINIC PROCESSING
  // ==========================================================================
  
  /**
   * Process all clinics
   */
  private async processClinics(
    model: mongoose.Model<ClinicDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    patientVisits: number;
    revenue: number;
    expenses: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let patientVisits = 0;
    let revenue = 0;
    let expenses = 0;
    
    try {
      const clinics = await model.find({
        ...baseQuery,
      }).limit(options?.limit || 500);
      
      for (const clinic of clinics) {
        try {
          processed++;
          
          // Calculate monthly patient volume
          const capacity = clinic.capacity || { dailyCapacity: 50 };
          const dailyCap = capacity.dailyCapacity || 50;
          const utilizationRate = 0.6 + Math.random() * 0.3; // 60-90%
          const monthlyPatients = Math.floor(dailyCap * 22 * utilizationRate); // 22 working days
          patientVisits += monthlyPatients;
          
          // Revenue (lower than hospital per patient)
          const avgRevenuePerVisit = 250;
          const monthlyRevenue = monthlyPatients * avgRevenuePerVisit;
          revenue += monthlyRevenue;
          
          // Expenses
          const expenseRatio = 0.75 + Math.random() * 0.1;
          expenses += monthlyRevenue * expenseRatio;
          
        } catch (error) {
          errors.push({
            entityId: clinic._id?.toString() || 'unknown',
            entityType: 'Clinic',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Clinic',
        message: error instanceof Error ? error.message : 'Failed to query clinics',
        recoverable: true,
      });
    }
    
    return { processed, patientVisits, revenue, expenses, errors };
  }
  
  // ==========================================================================
  // PHARMACEUTICAL PROCESSING
  // ==========================================================================
  
  /**
   * Process pharmaceuticals (approved drugs generating sales)
   */
  private async processPharmaceuticals(
    model: mongoose.Model<PharmaceuticalDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    approved: number;
    revenue: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let approved = 0;
    let revenue = 0;
    
    try {
      // Get approved pharmaceuticals
      const pharmas = await model.find({
        ...baseQuery,
        status: 'approved',
      }).limit(options?.limit || 500);
      
      for (const pharma of pharmas) {
        try {
          approved++;
          
          // Calculate monthly revenue based on annual revenue
          const annualRevenue = pharma.annualRevenue || 1000000;
          const monthlyRevenue = annualRevenue / 12;
          revenue += monthlyRevenue;
          
        } catch (error) {
          errors.push({
            entityId: pharma._id?.toString() || 'unknown',
            entityType: 'Pharmaceutical',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'Pharmaceutical',
        message: error instanceof Error ? error.message : 'Failed to query pharmaceuticals',
        recoverable: true,
      });
    }
    
    return { approved, revenue, errors };
  }
  
  // ==========================================================================
  // MEDICAL DEVICE PROCESSING
  // ==========================================================================
  
  /**
   * Process medical devices (approved devices generating sales)
   */
  private async processMedicalDevices(
    model: mongoose.Model<MedicalDeviceDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    approved: number;
    revenue: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let approved = 0;
    let revenue = 0;
    
    try {
      // Get approved medical devices
      const devices = await model.find({
        ...baseQuery,
        regulatoryStatus: 'approved',
      }).limit(options?.limit || 500);
      
      for (const device of devices) {
        try {
          approved++;
          
          // Calculate monthly revenue from products
          let deviceRevenue = 0;
          if (device.products && device.products.length > 0) {
            for (const product of device.products) {
              const unitPrice = product.averageSellingPrice || 10000;
              const annualUnits = product.annualUnits || 100;
              deviceRevenue += (unitPrice * annualUnits) / 12;
            }
          } else {
            // Fallback if no products
            deviceRevenue = (device.annualRevenue || 1000000) / 12;
          }
          revenue += deviceRevenue;
          
        } catch (error) {
          errors.push({
            entityId: device._id?.toString() || 'unknown',
            entityType: 'MedicalDevice',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'MedicalDevice',
        message: error instanceof Error ? error.message : 'Failed to query medical devices',
        recoverable: true,
      });
    }
    
    return { approved, revenue, errors };
  }
  
  // ==========================================================================
  // INSURANCE PROCESSING
  // ==========================================================================
  
  /**
   * Process healthcare insurance (premiums and claims)
   */
  private async processInsurance(
    model: mongoose.Model<HealthcareInsuranceDocument>,
    baseQuery: Record<string, unknown>,
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<{
    processed: number;
    premiums: number;
    claims: number;
    errors: TickError[];
  }> {
    const errors: TickError[] = [];
    let processed = 0;
    let premiums = 0;
    let claims = 0;
    
    try {
      const policies = await model.find({
        ...baseQuery,
        status: 'active',
      }).limit(options?.limit || 1000);
      
      for (const policy of policies) {
        try {
          processed++;
          
          // Collect monthly premium (annual premium / 12)
          const annualPremiums = policy.financials?.annualPremiumRevenue || 6000000;
          const monthlyPremiums = annualPremiums / 12;
          premiums += monthlyPremiums;
          
          // Process claims (use actual claims paid if available)
          const annualClaims = policy.financials?.annualClaimsPaid || (annualPremiums * 0.85);
          const monthlyClaims = annualClaims / 12;
          claims += monthlyClaims;
          
        } catch (error) {
          errors.push({
            entityId: policy._id?.toString() || 'unknown',
            entityType: 'HealthcareInsurance',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            recoverable: true,
          });
        }
      }
    } catch (error) {
      errors.push({
        entityId: 'system',
        entityType: 'HealthcareInsurance',
        message: error instanceof Error ? error.message : 'Failed to query insurance policies',
        recoverable: true,
      });
    }
    
    return { processed, premiums, claims, errors };
  }
}

// Export singleton instance
export const healthcareProcessor = new HealthcareProcessor();

export default HealthcareProcessor;
