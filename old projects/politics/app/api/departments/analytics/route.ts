/**
 * @file app/api/departments/analytics/route.ts
 * @description Cross-department analytics and KPI aggregation API
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Aggregates KPIs, metrics, and performance data across all departments.
 * Provides company-wide analytics, department comparisons, trend analysis,
 * and strategic insights for decision-making.
 * 
 * ENDPOINTS:
 * - GET /api/departments/analytics - Get comprehensive company analytics
 * - GET /api/departments/analytics/trends - Get historical trend data
 * - GET /api/departments/analytics/benchmarks - Get industry benchmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import Department from '@/lib/db/models/Department';
import Loan from '@/lib/db/models/Loan';
import MarketingCampaign from '@/lib/db/models/MarketingCampaign';
import ResearchProject from '@/lib/db/models/ResearchProject';
import Employee from '@/lib/db/models/Employee';
import { calculateCreditScore } from '@/lib/utils/finance/creditScore';

interface DepartmentAnalytics {
  department: string;
  type: string;
  budget: number;
  budgetPercentage: number;
  staffCount: number;
  efficiency: number;
  performance: number;
  roi: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  specificMetrics: Record<string, any>;
}

interface CompanyAnalytics {
  overview: {
    companyName: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    cash: number;
    totalStaff: number;
    departmentCount: number;
  };
  departments: DepartmentAnalytics[];
  finance: {
    creditScore: number;
    creditRating: string;
    totalDebt: number;
    debtToEquity: number;
    cashRunwayMonths: number;
    activeLoans: number;
    totalInvestments: number;
    investmentROI: number;
  };
  hr: {
    totalEmployees: number;
    avgSatisfaction: number;
    avgProductivity: number;
    turnoverRate: number;
    openPositions: number;
    retentionRisk: number;
    trainingROI: number;
  };
  marketing: {
    brandReputation: number;
    marketShare: number;
    activeCampaigns: number;
    avgCampaignROI: number;
    customerAcquisitionCost: number;
    lifetimeValue: number;
    totalReach: number;
  };
  rd: {
    innovationScore: number;
    activeProjects: number;
    completedProjects: number;
    patentsOwned: number;
    technologyLevel: number;
    avgProjectROI: number;
    breakthroughProbability: number;
  };
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * GET /api/departments/analytics
 * Get comprehensive company analytics
 * 
 * Query params:
 * - companyId: Company ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    await connect();
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Verify company ownership
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
    }).lean();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch all departments
    const departments = await Department.find({
      company: companyId,
      active: true,
    }).lean();

    if (departments.length === 0) {
      return NextResponse.json(
        { error: 'No active departments found' },
        { status: 404 }
      );
    }

    // Fetch all employees
    const employees = await Employee.find({
      company: companyId,
      status: 'Active',
    }).lean();

    // Initialize analytics object
    const analytics: CompanyAnalytics = {
      overview: {
        companyName: company.name,
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        cash: company.cash || 0,
        totalStaff: employees.length,
        departmentCount: departments.length,
      },
      departments: [],
      finance: {
        creditScore: 0,
        creditRating: 'N/A',
        totalDebt: 0,
        debtToEquity: 0,
        cashRunwayMonths: 0,
        activeLoans: 0,
        totalInvestments: 0,
        investmentROI: 0,
      },
      hr: {
        totalEmployees: employees.length,
        avgSatisfaction: 0,
        avgProductivity: 0,
        turnoverRate: 0,
        openPositions: 0,
        retentionRisk: 0,
        trainingROI: 0,
      },
      marketing: {
        brandReputation: 0,
        marketShare: 0,
        activeCampaigns: 0,
        avgCampaignROI: 0,
        customerAcquisitionCost: 0,
        lifetimeValue: 0,
        totalReach: 0,
      },
      rd: {
        innovationScore: 0,
        activeProjects: 0,
        completedProjects: 0,
        patentsOwned: 0,
        technologyLevel: 0,
        avgProjectROI: 0,
        breakthroughProbability: 0,
      },
      insights: [],
      warnings: [],
      recommendations: [],
    };

    // Process each department
    for (const dept of departments) {
      // Calculate department status
      const avgPerformance = (dept.efficiency + dept.performance + dept.roi) / 3;
      let status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      if (avgPerformance >= 80) status = 'Excellent';
      else if (avgPerformance >= 60) status = 'Good';
      else if (avgPerformance >= 40) status = 'Fair';
      else status = 'Poor';

      const deptAnalytics: DepartmentAnalytics = {
        department: dept.name,
        type: dept.type,
        budget: dept.budget || 0,
        budgetPercentage: dept.budgetPercentage || 0,
        staffCount: dept.staff?.length || 0,
        efficiency: dept.efficiency || 0,
        performance: dept.performance || 0,
        roi: dept.roi || 0,
        status,
        specificMetrics: {},
      };

      // Aggregate department-specific data
      analytics.overview.totalRevenue += dept.totalRevenue || 0;
      analytics.overview.totalExpenses += dept.totalExpenses || 0;

      // Finance department
      if (dept.type === 'finance') {
        analytics.finance.totalDebt = dept.totalDebt || 0;
        analytics.finance.debtToEquity = dept.debtToEquity || 0;
        analytics.finance.cashRunwayMonths = dept.runwayMonths || 0;
        analytics.finance.activeLoans = dept.activeLoans || 0;

        // Calculate credit score
        const loans = await Loan.find({
          company: companyId,
          status: { $in: ['Active', 'Pending'] },
        }).lean();

        const companyEstablished = (company as any).established || Date.now();
        const creditAgeMonths = Math.floor(
          (Date.now() - new Date(companyEstablished).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        );
        
        const creditScoreData = calculateCreditScore({
          paymentHistory: {
            onTimePayments: loans.filter(l => (l.paymentsMade || 0) > (l.paymentsMissed || 0)).length,
            latePayments: loans.filter(l => (l.delinquencyStatus || 0) > 0 && (l.delinquencyStatus || 0) <= 90).length,
            defaults: loans.filter(l => (l.delinquencyStatus || 0) > 90).length,
          },
          debtToEquity: analytics.finance.debtToEquity,
          creditAge: creditAgeMonths,
          activeLoans: loans.length,
          totalDebt: analytics.finance.totalDebt,
          monthlyRevenue: analytics.overview.totalRevenue / 12,
          cashReserves: company.cash || 0,
          recentInquiries: 0,
        });

        analytics.finance.creditScore = creditScoreData.score;
        analytics.finance.creditRating = creditScoreData.rating;

        // Investment data
        const investments = (dept as any).investments || [];
        const activeInvestments = investments.filter((inv: any) => inv.active);
        analytics.finance.totalInvestments = activeInvestments.reduce(
          (sum: number, inv: any) => sum + (inv.currentValue || inv.principal || 0),
          0
        );
        const totalInvested = activeInvestments.reduce(
          (sum: number, inv: any) => sum + (inv.principal || 0),
          0
        );
        analytics.finance.investmentROI =
          totalInvested > 0
            ? ((analytics.finance.totalInvestments - totalInvested) / totalInvested) * 100
            : 0;

        deptAnalytics.specificMetrics = {
          creditScore: analytics.finance.creditScore,
          totalDebt: analytics.finance.totalDebt,
          cashRunway: analytics.finance.cashRunwayMonths,
          activeLoans: analytics.finance.activeLoans,
          totalInvestments: analytics.finance.totalInvestments,
        };
      }

      // HR department
      if (dept.type === 'hr') {
        analytics.hr.avgSatisfaction = dept.avgSatisfaction || 0;
        analytics.hr.avgProductivity = dept.avgProductivity || 0;
        analytics.hr.turnoverRate = dept.turnoverRate || 0;
        analytics.hr.openPositions = dept.openPositions || 0;
        analytics.hr.retentionRisk = dept.retentionRisk || 0;
        analytics.hr.trainingROI = dept.trainingROI || 0;

        deptAnalytics.specificMetrics = {
          avgSatisfaction: analytics.hr.avgSatisfaction,
          turnoverRate: analytics.hr.turnoverRate,
          openPositions: analytics.hr.openPositions,
          retentionRisk: analytics.hr.retentionRisk,
        };
      }

      // Marketing department
      if (dept.type === 'marketing') {
        analytics.marketing.brandReputation = dept.brandReputation || 0;
        analytics.marketing.marketShare = dept.marketShare || 0;
        analytics.marketing.activeCampaigns = dept.activeCampaigns || 0;
        analytics.marketing.customerAcquisitionCost = dept.customerAcquisitionCost || 0;
        analytics.marketing.lifetimeValue = dept.lifetimeValue || 0;
        analytics.marketing.totalReach = dept.totalReach || 0;

        // Calculate average campaign ROI
        const campaigns = await MarketingCampaign.find({
          company: companyId,
          status: { $in: ['Active', 'Completed'] },
        }).lean();

        const totalROI = campaigns.reduce((sum, camp) => sum + (camp.roi || 0), 0);
        analytics.marketing.avgCampaignROI =
          campaigns.length > 0 ? totalROI / campaigns.length : 0;

        deptAnalytics.specificMetrics = {
          brandReputation: analytics.marketing.brandReputation,
          marketShare: analytics.marketing.marketShare,
          activeCampaigns: analytics.marketing.activeCampaigns,
          avgCampaignROI: analytics.marketing.avgCampaignROI,
        };
      }

      // R&D department
      if (dept.type === 'rd') {
        analytics.rd.innovationScore = dept.innovationScore || 0;
        analytics.rd.activeProjects = dept.activeProjects || 0;
        analytics.rd.completedProjects = dept.completedProjects || 0;
        analytics.rd.patentsOwned = dept.patentsOwned || 0;
        analytics.rd.technologyLevel = dept.technologyLevel || 1;
        analytics.rd.breakthroughProbability = dept.breakthroughProbability || 0;

        // Calculate average project ROI
        const projects = await ResearchProject.find({
          company: companyId,
          status: 'Completed',
        }).lean();

        const successfulProjects = projects.filter(
          (p) => p.successLevel === 'Success' || p.successLevel === 'ExceptionalSuccess'
        );
        analytics.rd.avgProjectROI =
          successfulProjects.length > 0
            ? successfulProjects.reduce((sum, p) => sum + ((p as any).estimatedROI || 0), 0) /
              successfulProjects.length
            : 0;

        deptAnalytics.specificMetrics = {
          innovationScore: analytics.rd.innovationScore,
          activeProjects: analytics.rd.activeProjects,
          patentsOwned: analytics.rd.patentsOwned,
          technologyLevel: analytics.rd.technologyLevel,
        };
      }

      analytics.departments.push(deptAnalytics);
    }

    // Calculate overview metrics
    analytics.overview.netProfit =
      analytics.overview.totalRevenue - analytics.overview.totalExpenses;
    analytics.overview.profitMargin =
      analytics.overview.totalRevenue > 0
        ? (analytics.overview.netProfit / analytics.overview.totalRevenue) * 100
        : 0;

    // Generate insights
    if (analytics.overview.profitMargin > 20) {
      analytics.insights.push('Strong profitability - consider reinvesting in growth');
    }
    if (analytics.finance.creditScore > 740) {
      analytics.insights.push('Excellent credit score - favorable loan terms available');
    }
    if (analytics.marketing.avgCampaignROI > 150) {
      analytics.insights.push('Marketing campaigns delivering exceptional ROI');
    }
    if (analytics.rd.innovationScore > 80) {
      analytics.insights.push('High innovation capacity - potential for breakthrough products');
    }
    if (analytics.hr.avgSatisfaction > 80 && analytics.hr.turnoverRate < 10) {
      analytics.insights.push('Strong employee satisfaction and retention');
    }

    // Generate warnings
    if (analytics.finance.cashRunwayMonths < 6) {
      analytics.warnings.push(
        `Low cash runway (${analytics.finance.cashRunwayMonths} months) - consider cost reduction or fundraising`
      );
    }
    if (analytics.finance.debtToEquity > 1.5) {
      analytics.warnings.push('High debt-to-equity ratio - financial risk elevated');
    }
    if (analytics.hr.turnoverRate > 20) {
      analytics.warnings.push('High employee turnover - investigate retention issues');
    }
    if (analytics.marketing.customerAcquisitionCost > analytics.marketing.lifetimeValue) {
      analytics.warnings.push('CAC exceeds LTV - unsustainable customer economics');
    }

    // Generate recommendations
    if (analytics.finance.totalInvestments < analytics.overview.cash * 0.1) {
      analytics.recommendations.push(
        'Consider allocating 10-20% of cash reserves to passive investments'
      );
    }
    if (analytics.marketing.activeCampaigns === 0 && analytics.overview.cash > 50000) {
      analytics.recommendations.push(
        'No active marketing campaigns - consider launching brand awareness campaign'
      );
    }
    if (analytics.rd.activeProjects === 0 && analytics.rd.innovationScore < 50) {
      analytics.recommendations.push(
        'Low innovation score with no active R&D - invest in product innovation'
      );
    }
    if (analytics.hr.openPositions > 5) {
      analytics.recommendations.push(
        `${analytics.hr.openPositions} open positions - prioritize recruitment to fill critical roles`
      );
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('GET /api/departments/analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
