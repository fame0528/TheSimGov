/**
 * @file src/lib/game/tick/consultingProcessor.ts
 * @description Consulting tick processor for game tick engine
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Processes time-based consulting events each game tick:
 * - Project progress advancement
 * - Milestone completion tracking
 * - Invoice generation based on billing model
 * - Consultant utilization tracking
 * - Project completion and client satisfaction
 *
 * GAMEPLAY IMPACT:
 * Consulting is high-margin (65-75%):
 * - Hourly billing = revenue per hour worked
 * - Fixed fee = milestone-based revenue recognition
 * - Retainer = guaranteed monthly income
 * - Performance = bonus on successful outcomes
 *
 * @author ECHO v1.4.0
 */

import {
  ITickProcessor,
  GameTime,
  TickProcessorResult,
  TickProcessorOptions,
  TickError,
} from '@/lib/types/gameTick';
import ConsultingProject, { 
  IConsultingProject, 
  ProjectStatus, 
  BillingModel,
  ProjectPhase,
  ProjectPhaseValue,
} from '@/lib/db/models/consulting/ConsultingProject';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Summary of consulting tick processing
 */
export interface ConsultingTickSummary {
  [key: string]: unknown;
  
  // Projects
  projectsProcessed: number;
  projectsActive: number;
  projectsCompleted: number;
  milestonesCompleted: number;
  
  // Time tracking
  hoursWorked: number;
  hoursRemaining: number;
  avgUtilization: number;
  
  // Revenue by billing model
  hourlyRevenue: number;
  fixedFeeRevenue: number;
  retainerRevenue: number;
  performanceBonuses: number;
  totalRevenue: number;
  
  // Costs
  laborCosts: number;
  profitMargin: number;
  
  // Client satisfaction
  avgClientSatisfaction: number;
  onTimeDeliveryRate: number;
}

/**
 * Project processing result
 */
interface ProjectProcessResult {
  processed: number;
  active: number;
  completed: number;
  milestonesCompleted: number;
  hoursWorked: number;
  hoursRemaining: number;
  totalUtilization: number;
  revenue: {
    hourly: number;
    fixed: number;
    retainer: number;
    performance: number;
  };
  laborCosts: number;
  totalSatisfaction: number;
  onTimeCount: number;
  errors: TickError[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROCESSOR_NAME = 'consulting';
const PROCESSOR_PRIORITY = 65; // Run after media

// Hours worked per consultant per month (avg)
const HOURS_PER_MONTH = 160;
const BILLABLE_RATIO = 0.75; // 75% of hours are billable

// Labor cost as % of revenue
const LABOR_COST_RATIO = 0.30; // 30% labor costs (70% margin before overhead)

// Hourly rates by role
const HOURLY_RATES = {
  Lead: 500,
  Senior: 400,
  Analyst: 250,
  Specialist: 300,
};

// Progress rates per phase
const PHASE_PROGRESS = {
  Discovery: 0.15,   // 15% of project
  Planning: 0.15,    // 15% of project
  Execution: 0.50,   // 50% of project
  Delivery: 0.15,    // 15% of project
  Closure: 0.05,     // 5% of project
};

// ============================================================================
// CONSULTING PROCESSOR
// ============================================================================

/**
 * Consulting tick processor
 * Handles all time-based consulting operations
 */
export class ConsultingProcessor implements ITickProcessor {
  name = PROCESSOR_NAME;
  priority = PROCESSOR_PRIORITY;
  enabled = true;
  
  /**
   * Validate processor is ready
   */
  async validate(): Promise<true | string> {
    try {
      await ConsultingProject.findOne().limit(1);
      return true;
    } catch (error) {
      return `Database connection error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }
  
  /**
   * Process one tick for consulting
   */
  async process(
    gameTime: GameTime,
    options?: TickProcessorOptions
  ): Promise<TickProcessorResult> {
    const startTime = Date.now();
    const errors: TickError[] = [];
    
    try {
      // Build filter based on options
      const filter: Record<string, unknown> = {};
      if (options?.companyId) {
        filter['company'] = options.companyId;
      }
      
      // Process projects
      const projectResults = await this.processProjects(filter, gameTime, options?.dryRun);
      errors.push(...projectResults.errors);
      
      // Build summary
      const summary = this.buildSummary(projectResults);
      
      return {
        processor: PROCESSOR_NAME,
        success: errors.filter(e => !e.recoverable).length === 0,
        itemsProcessed: projectResults.processed,
        durationMs: Date.now() - startTime,
        summary,
        errors,
      };
    } catch (error) {
      return {
        processor: PROCESSOR_NAME,
        success: false,
        itemsProcessed: 0,
        durationMs: Date.now() - startTime,
        summary: {} as ConsultingTickSummary,
        errors: [{
          entityId: 'consulting-processor',
          entityType: 'System',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: false,
        }],
      };
    }
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Process consulting projects
   */
  private async processProjects(
    filter: Record<string, unknown>,
    gameTime: GameTime,
    dryRun?: boolean
  ): Promise<ProjectProcessResult> {
    const errors: TickError[] = [];
    let processed = 0;
    let active = 0;
    let completed = 0;
    let milestonesCompleted = 0;
    let hoursWorked = 0;
    let hoursRemaining = 0;
    let totalUtilization = 0;
    let laborCosts = 0;
    let totalSatisfaction = 0;
    let onTimeCount = 0;
    
    const revenue = {
      hourly: 0,
      fixed: 0,
      retainer: 0,
      performance: 0,
    };
    
    // Get active projects
    const projects = await ConsultingProject.find({
      ...filter,
      status: { $in: ['Active', 'Proposal'] },
      active: true,
    });
    
    for (const project of projects) {
      try {
        // Only process active projects (not proposals)
        if (project.status !== ProjectStatus.ACTIVE) {
          processed++;
          continue;
        }
        
        active++;
        
        // Calculate hours worked this month
        const teamSize = project.teamSize || 1;
        const monthlyHours = teamSize * HOURS_PER_MONTH * BILLABLE_RATIO;
        const remainingHours = (project.hoursEstimated || 0) - (project.hoursWorked || 0);
        const hoursThisMonth = Math.min(monthlyHours, remainingHours);
        
        hoursWorked += hoursThisMonth;
        hoursRemaining += remainingHours - hoursThisMonth;
        
        // Calculate utilization
        const utilization = project.hoursEstimated > 0
          ? ((project.hoursWorked || 0) + hoursThisMonth) / project.hoursEstimated * 100
          : 0;
        totalUtilization += utilization;
        
        // Calculate revenue based on billing model
        let monthlyRevenue = 0;
        switch (project.billingModel) {
          case BillingModel.HOURLY:
            monthlyRevenue = hoursThisMonth * (project.hourlyRate || 250);
            revenue.hourly += monthlyRevenue;
            break;
          
          case BillingModel.FIXED:
            // Fixed fee recognized proportionally
            const progressThisMonth = hoursThisMonth / (project.hoursEstimated || 1);
            monthlyRevenue = (project.fixedFee || 0) * progressThisMonth;
            revenue.fixed += monthlyRevenue;
            break;
          
          case BillingModel.RETAINER:
            monthlyRevenue = project.retainerMonthly || 0;
            revenue.retainer += monthlyRevenue;
            break;
          
          case BillingModel.PERFORMANCE:
            // Base + potential bonus
            monthlyRevenue = hoursThisMonth * (project.hourlyRate || 200);
            revenue.hourly += monthlyRevenue;
            break;
        }
        
        // Calculate labor costs
        const projectLaborCost = monthlyRevenue * LABOR_COST_RATIO;
        laborCosts += projectLaborCost;
        
        // Process milestones
        let milestonesCompletedThisMonth = 0;
        if (project.milestones && project.milestones.length > 0) {
          for (const milestone of project.milestones) {
            if (milestone.status === 'InProgress') {
              // Check if due date passed or progress sufficient
              const now = new Date(gameTime.year, gameTime.month - 1, 15);
              if (milestone.dueDate <= now || utilization >= 90) {
                if (!dryRun) {
                  milestone.status = 'Completed';
                  milestone.completionDate = now;
                }
                milestonesCompletedThisMonth++;
              }
            } else if (milestone.status === 'Pending') {
              // Start next pending milestone
              if (!dryRun) {
                milestone.status = 'InProgress';
              }
              break; // Only start one at a time
            }
          }
        }
        milestonesCompleted += milestonesCompletedThisMonth;
        
        // Check for project completion
        const totalHoursAfter = (project.hoursWorked || 0) + hoursThisMonth;
        const isComplete = totalHoursAfter >= (project.hoursEstimated || 0);
        
        if (!dryRun) {
          // Update project metrics
          project.hoursWorked = totalHoursAfter;
          project.utilizationRate = utilization;
          project.totalRevenue = (project.totalRevenue || 0) + monthlyRevenue;
          project.totalCost = (project.totalCost || 0) + projectLaborCost;
          project.billedAmount = (project.billedAmount || 0) + monthlyRevenue;
          
          // Calculate profit margin
          if (project.totalRevenue > 0) {
            project.profitMargin = ((project.totalRevenue - project.totalCost) / project.totalRevenue) * 100;
          }
          
          // Advance phase based on progress
          project.phase = this.calculatePhase(utilization);
          
          // Complete project if done
          if (isComplete) {
            project.status = ProjectStatus.COMPLETED;
            project.completedAt = new Date();
            project.active = false;
            
            // Check if on time
            const deadline = project.deadline;
            const completedDate = new Date(gameTime.year, gameTime.month - 1, 28);
            project.onTimeDelivery = completedDate <= deadline;
            
            // Performance bonus for performance billing
            if (project.billingModel === BillingModel.PERFORMANCE && project.onTimeDelivery) {
              const bonus = project.performanceBonus || 0;
              revenue.performance += bonus;
              project.totalRevenue = (project.totalRevenue || 0) + bonus;
            }
            
            // Simulate client satisfaction (70-100 for completed)
            project.clientSatisfaction = 70 + Math.floor(Math.random() * 30);
            
            completed++;
          }
          
          await project.save();
        }
        
        // Track satisfaction
        totalSatisfaction += project.clientSatisfaction || 80;
        if (project.onTimeDelivery) onTimeCount++;
        
        processed++;
      } catch (error) {
        errors.push({
          entityId: project._id.toString(),
          entityType: 'ConsultingProject',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }
    }
    
    return {
      processed,
      active,
      completed,
      milestonesCompleted,
      hoursWorked,
      hoursRemaining,
      totalUtilization,
      revenue,
      laborCosts,
      totalSatisfaction,
      onTimeCount,
      errors,
    };
  }
  
  /**
   * Calculate project phase based on utilization
   */
  private calculatePhase(utilization: number): ProjectPhaseValue {
    if (utilization < 15) return ProjectPhase.DISCOVERY;
    if (utilization < 30) return ProjectPhase.PLANNING;
    if (utilization < 80) return ProjectPhase.EXECUTION;
    if (utilization < 95) return ProjectPhase.DELIVERY;
    return ProjectPhase.CLOSURE;
  }
  
  /**
   * Build tick summary
   */
  private buildSummary(results: ProjectProcessResult): ConsultingTickSummary {
    const totalRevenue = results.revenue.hourly 
      + results.revenue.fixed 
      + results.revenue.retainer 
      + results.revenue.performance;
    
    const profitMargin = totalRevenue > 0
      ? ((totalRevenue - results.laborCosts) / totalRevenue) * 100
      : 0;
    
    const avgUtilization = results.active > 0
      ? results.totalUtilization / results.active
      : 0;
    
    const avgSatisfaction = results.processed > 0
      ? results.totalSatisfaction / results.processed
      : 0;
    
    const onTimeRate = results.processed > 0
      ? (results.onTimeCount / results.processed) * 100
      : 100;
    
    return {
      // Projects
      projectsProcessed: results.processed,
      projectsActive: results.active,
      projectsCompleted: results.completed,
      milestonesCompleted: results.milestonesCompleted,
      
      // Time tracking
      hoursWorked: results.hoursWorked,
      hoursRemaining: results.hoursRemaining,
      avgUtilization,
      
      // Revenue by billing model
      hourlyRevenue: results.revenue.hourly,
      fixedFeeRevenue: results.revenue.fixed,
      retainerRevenue: results.revenue.retainer,
      performanceBonuses: results.revenue.performance,
      totalRevenue,
      
      // Costs
      laborCosts: results.laborCosts,
      profitMargin,
      
      // Client satisfaction
      avgClientSatisfaction: avgSatisfaction,
      onTimeDeliveryRate: onTimeRate,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance
 */
export const consultingProcessor = new ConsultingProcessor();

export default consultingProcessor;
