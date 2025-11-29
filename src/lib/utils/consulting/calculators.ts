/**
 * @file src/lib/utils/consulting/calculators.ts
 * @description Utility functions for consulting calculations and analytics
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive calculation utilities for consulting business metrics.
 * Includes utilization, revenue, profit margin, and satisfaction calculations.
 */

import {
  ConsultingProjectData,
  ConsultingBillingModel,
  ConsultingProjectStatus,
  ConsultingProjectType,
  ConsultingMetrics,
  ConsultingPipelineStats,
  ConsultingTypeBreakdown,
  ConsultingBillingBreakdown,
  ConsultingClientSummary,
  ConsultingRecommendation,
  ConsultingTeamMember,
  ConsultantUtilization,
} from '@/types/consulting';

// ============================================================================
// UTILIZATION CALCULATORS
// ============================================================================

/**
 * Calculate utilization rate for a project
 * @param hoursWorked - Hours actually worked
 * @param hoursEstimated - Hours estimated for project
 * @returns Utilization rate as percentage (0-300)
 */
export function calculateUtilizationRate(
  hoursWorked: number,
  hoursEstimated: number
): number {
  if (hoursEstimated <= 0) return 0;
  return Math.min(300, Math.round((hoursWorked / hoursEstimated) * 100 * 100) / 100);
}

/**
 * Calculate remaining hours for a project
 * @param hoursEstimated - Total estimated hours
 * @param hoursWorked - Hours already worked
 * @returns Remaining hours (minimum 0)
 */
export function calculateHoursRemaining(
  hoursEstimated: number,
  hoursWorked: number
): number {
  return Math.max(0, hoursEstimated - hoursWorked);
}

/**
 * Check if project is over budget on hours
 * @param hoursWorked - Hours worked
 * @param hoursEstimated - Hours estimated
 * @returns True if over budget
 */
export function isProjectOverBudget(
  hoursWorked: number,
  hoursEstimated: number
): boolean {
  return hoursWorked > hoursEstimated;
}

/**
 * Calculate team utilization across multiple members
 * @param team - Array of team members
 * @returns Array of consultant utilization reports
 */
export function calculateTeamUtilization(
  team: ConsultingTeamMember[]
): ConsultantUtilization[] {
  const consultantMap = new Map<string, {
    name: string;
    hoursAllocated: number;
    hoursLogged: number;
    projectCount: number;
    totalRate: number;
  }>();

  team.forEach(member => {
    const existing = consultantMap.get(member.consultantId);
    if (existing) {
      existing.hoursAllocated += member.hoursAllocated;
      existing.hoursLogged += member.hoursLogged;
      existing.projectCount += 1;
      existing.totalRate += member.hourlyRate;
    } else {
      consultantMap.set(member.consultantId, {
        name: member.consultantName,
        hoursAllocated: member.hoursAllocated,
        hoursLogged: member.hoursLogged,
        projectCount: 1,
        totalRate: member.hourlyRate,
      });
    }
  });

  return Array.from(consultantMap.entries()).map(([id, data]) => ({
    consultantId: id,
    consultantName: data.name,
    totalHoursAllocated: data.hoursAllocated,
    totalHoursLogged: data.hoursLogged,
    utilizationRate: data.hoursAllocated > 0 
      ? Math.round((data.hoursLogged / data.hoursAllocated) * 100)
      : 0,
    projectCount: data.projectCount,
    billableRate: Math.round(data.totalRate / data.projectCount),
  }));
}

// ============================================================================
// REVENUE CALCULATORS
// ============================================================================

/**
 * Calculate project revenue based on billing model
 * @param project - Project data
 * @returns Calculated total revenue
 */
export function calculateProjectRevenue(project: ConsultingProjectData): number {
  switch (project.billingModel) {
    case ConsultingBillingModel.HOURLY:
      return project.hoursWorked * project.hourlyRate + project.performanceBonus;
    
    case ConsultingBillingModel.FIXED:
      return project.fixedFee + project.performanceBonus;
    
    case ConsultingBillingModel.RETAINER: {
      const startDate = new Date(project.startDate);
      const endDate = project.completedAt 
        ? new Date(project.completedAt)
        : new Date();
      const monthsElapsed = Math.max(1, 
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      return project.retainerMonthly * monthsElapsed + project.performanceBonus;
    }
    
    case ConsultingBillingModel.PERFORMANCE:
      return project.fixedFee + project.performanceBonus;
    
    default:
      return project.totalRevenue;
  }
}

/**
 * Calculate hourly rate from fixed fee project
 * @param fixedFee - Total fixed fee
 * @param hoursWorked - Hours worked on project
 * @returns Effective hourly rate
 */
export function calculateEffectiveHourlyRate(
  fixedFee: number,
  hoursWorked: number
): number {
  if (hoursWorked <= 0) return 0;
  return Math.round(fixedFee / hoursWorked);
}

/**
 * Calculate collection rate
 * @param collected - Amount collected
 * @param billed - Amount billed
 * @returns Collection rate as percentage
 */
export function calculateCollectionRate(
  collected: number,
  billed: number
): number {
  if (billed <= 0) return 0;
  return Math.round((collected / billed) * 100);
}

/**
 * Calculate outstanding balance
 * @param billed - Amount billed
 * @param collected - Amount collected
 * @returns Outstanding balance
 */
export function calculateOutstandingBalance(
  billed: number,
  collected: number
): number {
  return Math.max(0, billed - collected);
}

// ============================================================================
// PROFIT MARGIN CALCULATORS
// ============================================================================

/**
 * Calculate profit margin percentage
 * @param revenue - Total revenue
 * @param cost - Total cost
 * @returns Profit margin as percentage
 */
export function calculateProfitMargin(
  revenue: number,
  cost: number
): number {
  if (revenue <= 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100 * 100) / 100;
}

/**
 * Calculate profit amount
 * @param revenue - Total revenue
 * @param cost - Total cost
 * @returns Profit amount
 */
export function calculateProfitAmount(
  revenue: number,
  cost: number
): number {
  return revenue - cost;
}

/**
 * Calculate cost from hours and hourly cost rate
 * @param hours - Hours worked
 * @param costPerHour - Internal cost per hour (salaries, overhead)
 * @param additionalCosts - Additional project expenses
 * @returns Total project cost
 */
export function calculateProjectCost(
  hours: number,
  costPerHour: number,
  additionalCosts: number = 0
): number {
  return hours * costPerHour + additionalCosts;
}

// ============================================================================
// PIPELINE & METRICS CALCULATORS
// ============================================================================

/**
 * Calculate aggregate metrics from project list
 * @param projects - Array of consulting projects
 * @returns Aggregated metrics
 */
export function calculateConsultingMetrics(
  projects: ConsultingProjectData[]
): ConsultingMetrics {
  const metrics: ConsultingMetrics = {
    totalProjects: projects.length,
    activeProjects: 0,
    proposalProjects: 0,
    completedProjects: 0,
    cancelledProjects: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageProfitMargin: 0,
    pipelineValue: 0,
    totalHoursEstimated: 0,
    totalHoursWorked: 0,
    averageUtilizationRate: 0,
    averageClientSatisfaction: 0,
    onTimeDeliveryRate: 0,
    averageScopeCreep: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstandingBalance: 0,
    collectionRate: 0,
  };

  if (projects.length === 0) return metrics;

  let completedWithDelivery = 0;
  let completedOnTime = 0;
  let satisfactionSum = 0;
  let satisfactionCount = 0;
  let marginSum = 0;
  let utilizationSum = 0;
  let scopeCreepSum = 0;

  projects.forEach(project => {
    // Status counts
    switch (project.status) {
      case ConsultingProjectStatus.ACTIVE:
        metrics.activeProjects++;
        metrics.pipelineValue += project.totalRevenue || calculateProjectRevenue(project);
        break;
      case ConsultingProjectStatus.PROPOSAL:
        metrics.proposalProjects++;
        metrics.pipelineValue += project.fixedFee || (project.hoursEstimated * project.hourlyRate);
        break;
      case ConsultingProjectStatus.COMPLETED:
        metrics.completedProjects++;
        completedWithDelivery++;
        if (project.onTimeDelivery) completedOnTime++;
        break;
      case ConsultingProjectStatus.CANCELLED:
        metrics.cancelledProjects++;
        break;
    }

    // Financial metrics
    metrics.totalRevenue += project.totalRevenue;
    metrics.totalCost += project.totalCost;
    metrics.totalBilled += project.billedAmount;
    metrics.totalCollected += project.collectedAmount;

    // Time metrics
    metrics.totalHoursEstimated += project.hoursEstimated;
    metrics.totalHoursWorked += project.hoursWorked;
    utilizationSum += project.utilizationRate;

    // Quality metrics
    if (project.clientSatisfaction > 0) {
      satisfactionSum += project.clientSatisfaction;
      satisfactionCount++;
    }
    marginSum += project.profitMargin;
    scopeCreepSum += project.scopeCreep;
  });

  // Calculate averages
  metrics.totalProfit = metrics.totalRevenue - metrics.totalCost;
  metrics.averageProfitMargin = Math.round(marginSum / projects.length * 100) / 100;
  metrics.averageUtilizationRate = Math.round(utilizationSum / projects.length * 100) / 100;
  metrics.averageClientSatisfaction = satisfactionCount > 0
    ? Math.round(satisfactionSum / satisfactionCount * 10) / 10
    : 0;
  metrics.onTimeDeliveryRate = completedWithDelivery > 0
    ? Math.round((completedOnTime / completedWithDelivery) * 100)
    : 0;
  metrics.averageScopeCreep = Math.round(scopeCreepSum / projects.length * 10) / 10;
  metrics.outstandingBalance = calculateOutstandingBalance(
    metrics.totalBilled,
    metrics.totalCollected
  );
  metrics.collectionRate = calculateCollectionRate(
    metrics.totalCollected,
    metrics.totalBilled
  );

  return metrics;
}

/**
 * Calculate pipeline statistics by status
 * @param projects - Array of consulting projects
 * @returns Array of pipeline stats by stage
 */
export function calculatePipelineStats(
  projects: ConsultingProjectData[]
): ConsultingPipelineStats[] {
  const statusCounts = new Map<ConsultingProjectStatus, {
    count: number;
    totalValue: number;
  }>();

  // Initialize all statuses
  Object.values(ConsultingProjectStatus).forEach(status => {
    statusCounts.set(status, { count: 0, totalValue: 0 });
  });

  // Aggregate by status
  projects.forEach(project => {
    const current = statusCounts.get(project.status)!;
    current.count++;
    current.totalValue += project.totalRevenue || 
      (project.billingModel === ConsultingBillingModel.HOURLY
        ? project.hoursEstimated * project.hourlyRate
        : project.fixedFee);
  });

  // Calculate total pipeline value
  const totalPipelineValue = Array.from(statusCounts.values())
    .reduce((sum, s) => sum + s.totalValue, 0);

  // Build stats array
  return Array.from(statusCounts.entries()).map(([stage, data]) => ({
    stage,
    count: data.count,
    totalValue: data.totalValue,
    averageValue: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
    percentOfPipeline: totalPipelineValue > 0
      ? Math.round((data.totalValue / totalPipelineValue) * 100)
      : 0,
  }));
}

/**
 * Calculate breakdown by project type
 * @param projects - Array of consulting projects
 * @returns Array of type breakdowns
 */
export function calculateTypeBreakdown(
  projects: ConsultingProjectData[]
): ConsultingTypeBreakdown[] {
  const typeMap = new Map<ConsultingProjectType, {
    count: number;
    totalRevenue: number;
    marginSum: number;
    satisfactionSum: number;
    satisfactionCount: number;
  }>();

  // Initialize all types
  Object.values(ConsultingProjectType).forEach(type => {
    typeMap.set(type, {
      count: 0,
      totalRevenue: 0,
      marginSum: 0,
      satisfactionSum: 0,
      satisfactionCount: 0,
    });
  });

  // Aggregate by type
  projects.forEach(project => {
    const current = typeMap.get(project.projectType)!;
    current.count++;
    current.totalRevenue += project.totalRevenue;
    current.marginSum += project.profitMargin;
    if (project.clientSatisfaction > 0) {
      current.satisfactionSum += project.clientSatisfaction;
      current.satisfactionCount++;
    }
  });

  // Build breakdown array
  return Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      totalRevenue: data.totalRevenue,
      averageMargin: data.count > 0 ? Math.round(data.marginSum / data.count * 10) / 10 : 0,
      averageSatisfaction: data.satisfactionCount > 0
        ? Math.round(data.satisfactionSum / data.satisfactionCount * 10) / 10
        : 0,
    }))
    .filter(b => b.count > 0);
}

/**
 * Calculate breakdown by billing model
 * @param projects - Array of consulting projects
 * @returns Array of billing model breakdowns
 */
export function calculateBillingBreakdown(
  projects: ConsultingProjectData[]
): ConsultingBillingBreakdown[] {
  const billingMap = new Map<ConsultingBillingModel, {
    count: number;
    totalRevenue: number;
  }>();

  // Initialize all billing models
  Object.values(ConsultingBillingModel).forEach(model => {
    billingMap.set(model, { count: 0, totalRevenue: 0 });
  });

  // Calculate total revenue for percentage
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalRevenue, 0);

  // Aggregate by billing model
  projects.forEach(project => {
    const current = billingMap.get(project.billingModel)!;
    current.count++;
    current.totalRevenue += project.totalRevenue;
  });

  // Build breakdown array
  return Array.from(billingMap.entries())
    .map(([model, data]) => ({
      model,
      count: data.count,
      totalRevenue: data.totalRevenue,
      averageProjectValue: data.count > 0 ? Math.round(data.totalRevenue / data.count) : 0,
      percentOfRevenue: totalRevenue > 0
        ? Math.round((data.totalRevenue / totalRevenue) * 100)
        : 0,
    }))
    .filter(b => b.count > 0);
}

/**
 * Calculate client summary statistics
 * @param projects - Array of consulting projects
 * @returns Array of client summaries sorted by revenue
 */
export function calculateClientSummaries(
  projects: ConsultingProjectData[]
): ConsultingClientSummary[] {
  const clientMap = new Map<string, {
    projectCount: number;
    totalRevenue: number;
    satisfactionSum: number;
    satisfactionCount: number;
    outstandingBalance: number;
  }>();

  projects.forEach(project => {
    const existing = clientMap.get(project.client);
    if (existing) {
      existing.projectCount++;
      existing.totalRevenue += project.totalRevenue;
      existing.outstandingBalance += calculateOutstandingBalance(
        project.billedAmount,
        project.collectedAmount
      );
      if (project.clientSatisfaction > 0) {
        existing.satisfactionSum += project.clientSatisfaction;
        existing.satisfactionCount++;
      }
    } else {
      clientMap.set(project.client, {
        projectCount: 1,
        totalRevenue: project.totalRevenue,
        satisfactionSum: project.clientSatisfaction > 0 ? project.clientSatisfaction : 0,
        satisfactionCount: project.clientSatisfaction > 0 ? 1 : 0,
        outstandingBalance: calculateOutstandingBalance(
          project.billedAmount,
          project.collectedAmount
        ),
      });
    }
  });

  return Array.from(clientMap.entries())
    .map(([clientName, data]) => ({
      clientName,
      projectCount: data.projectCount,
      totalRevenue: data.totalRevenue,
      averageSatisfaction: data.satisfactionCount > 0
        ? Math.round(data.satisfactionSum / data.satisfactionCount * 10) / 10
        : 0,
      outstandingBalance: data.outstandingBalance,
      isRepeatClient: data.projectCount > 1,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

/**
 * Generate recommendations based on project data
 * @param projects - Array of consulting projects
 * @param metrics - Calculated metrics
 * @returns Array of recommendations
 */
export function generateConsultingRecommendations(
  projects: ConsultingProjectData[],
  metrics: ConsultingMetrics
): ConsultingRecommendation[] {
  const recommendations: ConsultingRecommendation[] = [];

  // Check for overdue projects
  const now = new Date();
  const overdueProjects = projects.filter(p => 
    p.status === ConsultingProjectStatus.ACTIVE &&
    new Date(p.deadline) < now
  );

  overdueProjects.forEach(project => {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: 'Overdue Project',
      description: `${project.projectName} is past deadline. Review scope and timeline.`,
      projectId: project._id,
      projectName: project.projectName,
    });
  });

  // Check for over-budget projects
  const overBudgetProjects = projects.filter(p =>
    p.status === ConsultingProjectStatus.ACTIVE &&
    p.hoursWorked > p.hoursEstimated * 1.1
  );

  overBudgetProjects.forEach(project => {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: 'Over Budget',
      description: `${project.projectName} is ${Math.round((project.hoursWorked / project.hoursEstimated - 1) * 100)}% over budget on hours.`,
      projectId: project._id,
      projectName: project.projectName,
    });
  });

  // Check for low satisfaction projects
  const lowSatisfactionProjects = projects.filter(p =>
    p.status === ConsultingProjectStatus.ACTIVE &&
    p.clientSatisfaction < 70 &&
    p.clientSatisfaction > 0
  );

  lowSatisfactionProjects.forEach(project => {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      title: 'Low Client Satisfaction',
      description: `${project.projectName} has satisfaction of ${project.clientSatisfaction}%. Consider reaching out to client.`,
      projectId: project._id,
      projectName: project.projectName,
    });
  });

  // Check for collection issues
  if (metrics.outstandingBalance > 50000) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      title: 'Outstanding Balance Alert',
      description: `$${metrics.outstandingBalance.toLocaleString()} in outstanding invoices. Review collection process.`,
    });
  }

  // Check for pipeline health
  if (metrics.proposalProjects === 0 && metrics.activeProjects < 3) {
    recommendations.push({
      type: 'opportunity',
      priority: 'high',
      title: 'Pipeline Running Low',
      description: 'No proposals in pipeline. Consider increasing business development activities.',
    });
  }

  // Check utilization
  if (metrics.averageUtilizationRate < 70) {
    recommendations.push({
      type: 'opportunity',
      priority: 'medium',
      title: 'Low Utilization Rate',
      description: `Average utilization is ${Math.round(metrics.averageUtilizationRate)}%. Consider capacity planning.`,
    });
  }

  // Check profit margins
  if (metrics.averageProfitMargin < 60) {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      title: 'Below Target Margins',
      description: `Average margin is ${Math.round(metrics.averageProfitMargin)}%. Target is 65-75%.`,
    });
  }

  // High scope creep warning
  const highScopeCreepProjects = projects.filter(p =>
    p.status === ConsultingProjectStatus.ACTIVE &&
    p.scopeCreep > 20
  );

  highScopeCreepProjects.forEach(project => {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      title: 'High Scope Creep',
      description: `${project.projectName} has ${project.scopeCreep}% scope creep. Review change management.`,
      projectId: project._id,
      projectName: project.projectName,
    });
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// DATE & TIMELINE UTILITIES
// ============================================================================

/**
 * Calculate days until deadline
 * @param deadline - Project deadline date
 * @returns Days remaining (negative if past)
 */
export function calculateDaysUntilDeadline(deadline: string | Date): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate project duration in days
 * @param startDate - Project start date
 * @param endDate - Project end date or current date
 * @returns Duration in days
 */
export function calculateProjectDuration(
  startDate: string | Date,
  endDate?: string | Date
): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if project is at risk (near deadline with low completion)
 * @param project - Project data
 * @returns True if project is at risk
 */
export function isProjectAtRisk(project: ConsultingProjectData): boolean {
  if (project.status !== ConsultingProjectStatus.ACTIVE) return false;
  
  const daysRemaining = calculateDaysUntilDeadline(project.deadline);
  const completion = project.completionPercentage || 
    (project.hoursEstimated > 0 
      ? (project.hoursWorked / project.hoursEstimated) * 100
      : 0);
  
  // At risk if less than 20% time remaining but less than 80% complete
  const totalDays = calculateProjectDuration(project.startDate, project.deadline);
  const percentTimeRemaining = totalDays > 0 ? (daysRemaining / totalDays) * 100 : 0;
  
  return percentTimeRemaining < 20 && completion < 80;
}
