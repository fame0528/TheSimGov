/**
 * @fileoverview Department Analytics API Route
 * @module app/api/departments/[type]/analytics/route
 * 
 * OVERVIEW:
 * GET endpoint to retrieve performance analytics for a specific department.
 * Returns KPI trends, financial metrics, and department-specific analytics.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Department from '@/lib/db/models/Department';
import { connectDB } from '@/lib/db';
import { DepartmentTypeSchema } from '@/lib/validations/department';
import type { DepartmentType, DepartmentAnalytics } from '@/lib/types/department';

/**
 * GET /api/departments/[type]/analytics
 * 
 * Retrieves comprehensive analytics for a department including:
 * - Health score (0-100 weighted KPI average)
 * - KPI breakdown (efficiency, performance, ROI, utilization, quality)
 * - Department-specific metrics (loans, employees, campaigns, research)
 * - Level and budget information
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * 
 * PARAMS:
 * - type: 'finance' | 'hr' | 'marketing' | 'rd'
 * 
 * QUERY PARAMS:
 * - period: 'week' | 'month' | 'quarter' | 'year' (optional, default: 'month')
 * 
 * RESPONSE:
 * - 200: Analytics object with complete metrics
 * - 400: Invalid department type
 * - 401: Unauthorized (no session)
 * - 404: Department not found
 * - 500: Server error
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/departments/finance/analytics?period=quarter');
 * const analytics = await response.json();
 * // Returns: { healthScore: 82, kpis: {...}, activeLoanCount: 3, totalDebt: 450000, ... }
 * ```
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company associated with this user' },
        { status: 400 }
      );
    }

    // Validate department type
    const { type } = await params;
    const typeResult = DepartmentTypeSchema.safeParse(type);
    if (!typeResult.success) {
      return NextResponse.json(
        { error: 'Invalid department type. Must be: finance, hr, marketing, or rd' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';

    // Connect to database
    await connectDB();

    // Retrieve department with virtuals
    const department = await Department.findOne({
      companyId,
      type: typeResult.data as DepartmentType,
    });

    if (!department) {
      return NextResponse.json(
        { error: `Department '${type}' not found for this company` },
        { status: 404 }
      );
    }

    // Calculate health score using instance method
    const healthScore = department.calculateHealthScore();

    // Build analytics response based on department type
    const baseAnalytics = {
      departmentId: department._id.toString(),
      companyId: department.companyId.toString(),
      type: department.type,
      name: department.name,
      level: department.level,
      budget: department.budget,
      budgetPercentage: department.budgetPercentage,
      healthScore,
      kpis: department.kpis,
      period,
    };

    let specificAnalytics = {};

    // Add department-specific analytics
    switch (department.type) {
      case 'finance':
        specificAnalytics = {
          totalRevenue: department.totalRevenue,
          totalExpenses: department.totalExpenses,
          currentProfit: department.currentProfit, // Virtual
          creditScore: department.creditScore,
          cashReserves: department.cashReserves,
          activeLoanCount: department.activeLoanCount, // Virtual
          totalDebt: department.totalDebt, // Virtual
          totalInvestmentValue: department.totalInvestmentValue, // Virtual
          loans: department.loans?.map(loan => ({
            id: loan.id,
            type: loan.loanType,
            amount: loan.amount,
            remainingBalance: loan.remainingBalance,
            status: loan.status,
          })) || [],
          investments: department.investments?.map(inv => ({
            id: inv.id,
            type: inv.investmentType,
            amount: inv.amount,
            currentValue: inv.currentValue,
            returnRate: inv.returnRate,
          })) || [],
        };
        break;

      case 'hr':
        specificAnalytics = {
          totalEmployees: department.totalEmployees,
          employeeTurnover: department.employeeTurnover,
          avgSalary: department.avgSalary,
          trainingBudget: department.trainingBudget,
          activeTrainingCount: department.activeTrainingCount, // Virtual
          activeRecruitmentCount: department.activeRecruitmentCount, // Virtual
          trainingPrograms: department.trainingPrograms?.map(prog => ({
            id: prog.id,
            name: prog.name,
            skillTarget: prog.skillTarget,
            enrolled: prog.enrolled,
            capacity: prog.capacity,
            status: prog.status,
          })) || [],
          recruitmentCampaigns: department.recruitmentCampaigns?.map(camp => ({
            id: camp.id,
            role: camp.role,
            positions: camp.positions,
            applicants: camp.applicants,
            hired: camp.hired,
            status: camp.status,
          })) || [],
          skillsInventory: department.skillsInventory || [],
        };
        break;

      case 'marketing':
        specificAnalytics = {
          brandValue: department.brandValue,
          customerBase: department.customerBase,
          marketShare: department.marketShare,
          activeCampaignCount: department.activeCampaignCount, // Virtual
          avgCampaignROI: department.avgCampaignROI, // Virtual
          customerAcquisitionCost: department.customerAcquisitionCost,
          customerLifetimeValue: department.customerLifetimeValue,
          campaigns: department.campaigns?.map(camp => ({
            id: camp.id,
            name: camp.name,
            type: camp.campaignType,
            budget: camp.budget,
            reach: camp.reach,
            conversions: camp.conversions,
            roi: camp.roi,
            status: camp.status,
          })) || [],
        };
        break;

      case 'rd':
        specificAnalytics = {
          innovationPoints: department.innovationPoints,
          researchSpeed: department.researchSpeed,
          techLevel: department.techLevel,
          activeResearchCount: department.activeResearchCount, // Virtual
          grantedPatentCount: department.grantedPatentCount, // Virtual
          totalPatentValue: department.totalPatentValue, // Virtual
          researchProjects: department.researchProjects?.map(proj => ({
            id: proj.id,
            name: proj.name,
            category: proj.category,
            progress: proj.progress,
            successChance: proj.successChance,
            potentialImpact: proj.potentialImpact,
            status: proj.status,
          })) || [],
          patents: department.patents?.map(pat => ({
            id: pat.id,
            name: pat.name,
            category: pat.category,
            value: pat.value,
            status: pat.status,
          })) || [],
        };
        break;
    }

    const analytics = {
      ...baseAnalytics,
      ...specificAnalytics,
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/departments/[type]/analytics] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Virtuals Usage**: Leverages model virtuals for computed properties (zero DB overhead)
 * 2. **Health Score**: Uses calculateHealthScore() instance method (weighted KPI average)
 * 3. **Department-Specific**: Returns tailored metrics based on department type
 * 4. **Comprehensive**: Includes KPIs, financials, entities, and summary stats
 * 5. **Period Support**: Query param for future time-series analytics
 * 
 * METRICS BY DEPARTMENT:
 * - **Finance**: Revenue, expenses, profit, credit score, loans, investments
 * - **HR**: Employees, turnover, salary, training, recruitment, skills
 * - **Marketing**: Brand value, customers, market share, campaigns, CAC, LTV
 * - **R&D**: Innovation points, research speed, tech level, projects, patents
 * 
 * SECURITY:
 * - Authentication required (NextAuth session)
 * - Company-scoped queries
 * - Read-only operation (no modifications)
 * 
 * PREVENTS:
 * - Unauthorized analytics access
 * - Cross-company data exposure
 * - Heavy computed queries (uses virtuals efficiently)
 */
