/**
 * @file app/api/consulting/projects/route.ts
 * @description Consulting project management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles professional consulting project creation and retrieval for Technology/Software companies
 * offering consulting services. Implements project lifecycle management with time tracking,
 * billing models (Hourly, Fixed, Retainer, Performance), client satisfaction, and profitability.
 * 
 * ENDPOINTS:
 * - POST /api/consulting/projects - Create new consulting project
 * - GET /api/consulting/projects - List projects with filtering
 * 
 * BUSINESS LOGIC:
 * - Project types: Strategy, Implementation, Audit, Training, Advisory
 * - Billing models: Hourly ($150-500/hr), Fixed ($50k-$500k), Retainer ($10k-$50k/mo), Performance (% of value)
 * - Time tracking: Hours estimated vs worked, utilization rate
 * - Client satisfaction: 1-10 scale (target: 8+)
 * - Profit margin: 40-60% target (consultant costs, overhead)
 * - Status lifecycle: Proposal → Active → Completed/Cancelled
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/servers route (auth, validation, error handling)
 * - Adapted financial validation for project launch
 * - Custom billing calculation per model type
 * - Project-specific filtering and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import ConsultingProject from '@/lib/db/models/ConsultingProject';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/consulting/projects
 * 
 * Create new consulting project with billing configuration
 * 
 * Request Body:
 * {
 *   company: string;                 // Company ID (Technology/Software)
 *   client: string;                  // Client company ID
 *   projectName: string;             // Project title
 *   projectType: 'Strategy' | 'Implementation' | 'Audit' | 'Training' | 'Advisory';
 *   scope: string;                   // Project scope description
 *   billingModel: 'Hourly' | 'Fixed' | 'Retainer' | 'Performance';
 *   hourlyRate?: number;             // For Hourly billing
 *   fixedPrice?: number;             // For Fixed billing
 *   retainerAmount?: number;         // For Retainer billing
 *   performancePercent?: number;     // For Performance billing
 *   hoursEstimated?: number;         // Estimated hours
 *   deadline?: Date;                 // Project deadline
 *   deliverables?: string[];         // Expected deliverables
 * }
 * 
 * Response:
 * {
 *   project: IConsultingProject;
 *   billingSetup: {
 *     model: string;
 *     rate: number;
 *     estimatedRevenue: number;
 *     targetMargin: number;
 *   };
 *   timeline: {
 *     hoursEstimated: number;
 *     deadline: Date;
 *     estimatedWeeks: number;
 *   };
 *   message: string;
 * }
 * 
 * Business Logic:
 * 1. Validate company exists and user owns it
 * 2. Verify company is Technology/Software industry
 * 3. Verify client company exists
 * 4. Validate billing model configuration
 * 5. Create project document with status = Proposal
 * 6. Calculate estimated revenue based on billing model
 * 7. Set target profit margin (50% default)
 * 8. Return project with billing and timeline details
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const {
      company: companyId,
      client: clientId,
      projectName,
      projectType,
      scope,
      billingModel,
      hourlyRate,
      fixedPrice,
      retainerAmount,
      performancePercent,
      hoursEstimated,
      deadline,
      deliverables,
    } = body;

    // Validate required fields
    if (!companyId || !clientId || !projectName || !projectType || !billingModel) {
      return NextResponse.json(
        { error: 'Missing required fields: company, client, projectName, projectType, billingModel' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Verify company is Technology/Software industry
    if (company.industry !== 'Technology' || company.subcategory !== 'Software') {
      return NextResponse.json(
        {
          error: 'Invalid company type - Must be Technology/Software industry',
          industry: company.industry,
          subcategory: company.subcategory,
        },
        { status: 400 }
      );
    }

    // Verify client company exists
    const client = await Company.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client company not found' }, { status: 404 });
    }

    // Validate billing model configuration
    let finalHourlyRate = hourlyRate;
    let finalFixedPrice = fixedPrice;
    let finalRetainerAmount = retainerAmount;
    let finalPerformancePercent = performancePercent;

    switch (billingModel) {
      case 'Hourly':
        if (!finalHourlyRate || finalHourlyRate < 100) {
          finalHourlyRate = 250; // Default $250/hr
        }
        break;
      case 'Fixed':
        if (!finalFixedPrice || finalFixedPrice < 10000) {
          return NextResponse.json(
            { error: 'Fixed price must be at least $10,000' },
            { status: 400 }
          );
        }
        break;
      case 'Retainer':
        if (!finalRetainerAmount || finalRetainerAmount < 5000) {
          finalRetainerAmount = 15000; // Default $15k/month
        }
        break;
      case 'Performance':
        if (!finalPerformancePercent || finalPerformancePercent < 1 || finalPerformancePercent > 50) {
          finalPerformancePercent = 10; // Default 10% of value created
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid billing model' },
          { status: 400 }
        );
    }

    // Calculate estimated revenue
    let estimatedRevenue = 0;
    const estimatedHours = hoursEstimated || 160; // Default 160 hours (~1 month)

    switch (billingModel) {
      case 'Hourly':
        estimatedRevenue = estimatedHours * (finalHourlyRate || 250);
        break;
      case 'Fixed':
        estimatedRevenue = finalFixedPrice || 0;
        break;
      case 'Retainer':
        estimatedRevenue = (finalRetainerAmount || 15000) * 3; // Assume 3-month engagement
        break;
      case 'Performance':
        estimatedRevenue = 100000 * ((finalPerformancePercent || 10) / 100); // Assume $100k value created
        break;
    }

    // Create consulting project
    const project = await ConsultingProject.create({
      company: new Types.ObjectId(companyId),
      client: new Types.ObjectId(clientId),
      projectName,
      projectType,
      status: 'Proposal',
      scope: scope || '',
      deliverables: deliverables || [],
      billingModel,
      hourlyRate: finalHourlyRate,
      fixedPrice: finalFixedPrice,
      retainerAmount: finalRetainerAmount,
      performancePercent: finalPerformancePercent,
      hoursEstimated: estimatedHours,
      hoursWorked: 0,
      deadline: deadline ? new Date(deadline) : undefined,
      totalRevenue: 0,
      profitMargin: 50, // 50% target margin
      clientSatisfaction: 8.0, // Default 8/10
    });

    return NextResponse.json({
      project,
      billingSetup: {
        model: billingModel,
        rate: finalHourlyRate || finalFixedPrice || finalRetainerAmount || finalPerformancePercent || 0,
        estimatedRevenue,
        targetMargin: 50,
      },
      timeline: {
        hoursEstimated: estimatedHours,
        deadline: project.deadline,
        estimatedWeeks: Math.ceil(estimatedHours / 40),
      },
      message: `Consulting project created successfully. Type: ${projectType}, Billing: ${billingModel}, Estimated revenue: $${estimatedRevenue.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Error creating consulting project:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consulting/projects
 * 
 * List consulting projects with filtering and aggregated metrics
 * 
 * Query Parameters:
 * - company: string (required) - Company ID to filter projects
 * - client?: string - Filter by client company
 * - projectType?: string - Filter by project type
 * - status?: string - Filter by status
 * - billingModel?: string - Filter by billing model
 * 
 * Response:
 * {
 *   projects: IConsultingProject[];
 *   company: {
 *     name: string;
 *     level: number;
 *   };
 *   aggregatedMetrics: {
 *     totalProjects: number;
 *     activeProjects: number;
 *     totalRevenue: number;
 *     avgMargin: number;
 *     avgSatisfaction: number;
 *     totalHoursWorked: number;
 *   };
 *   statusBreakdown: Array<{
 *     status: string;
 *     count: number;
 *     revenue: number;
 *   }>;
 *   recommendations: string[];
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const clientId = searchParams.get('client');
    const projectType = searchParams.get('projectType');
    const status = searchParams.get('status');
    const billingModel = searchParams.get('billingModel');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Build query filter
    const filter: any = { company: companyId };
    if (clientId) filter.client = clientId;
    if (projectType) filter.projectType = projectType;
    if (status) filter.status = status;
    if (billingModel) filter.billingModel = billingModel;

    // Fetch consulting projects
    const projects = await ConsultingProject.find(filter)
      .populate('client', 'name industry')
      .sort({ status: 1, deadline: 1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'Active').length,
      totalRevenue: projects.reduce((sum, p) => sum + p.totalRevenue, 0),
      avgMargin: 0,
      avgSatisfaction: 0,
      totalHoursWorked: projects.reduce((sum, p) => sum + p.hoursWorked, 0),
    };

    // Calculate weighted average profit margin
    if (projects.length > 0) {
      const totalMargin = projects.reduce((sum, p) => sum + p.profitMargin, 0);
      aggregatedMetrics.avgMargin = Math.round((totalMargin / projects.length) * 100) / 100;
    }

    // Calculate average client satisfaction
    if (projects.length > 0) {
      const totalSatisfaction = projects.reduce((sum, p) => sum + (p.clientSatisfaction || 0), 0);
      aggregatedMetrics.avgSatisfaction = Math.round((totalSatisfaction / projects.length) * 100) / 100;
    }

    // Generate status breakdown
    const statusBreakdown = projects.reduce((acc: any[], project) => {
      const existing = acc.find((item) => item.status === project.status);
      if (existing) {
        existing.count += 1;
        existing.revenue += project.totalRevenue;
      } else {
        acc.push({
          status: project.status,
          count: 1,
          revenue: project.totalRevenue,
        });
      }
      return acc;
    }, []);

    // Generate recommendations
    const recommendations: string[] = [];

    if (projects.length === 0) {
      recommendations.push('No consulting projects yet. Create projects to offer Strategy, Implementation, or Advisory services.');
    } else {
      // Check satisfaction
      if (aggregatedMetrics.avgSatisfaction < 7.0) {
        recommendations.push(
          `Low client satisfaction at ${aggregatedMetrics.avgSatisfaction.toFixed(1)}/10. Review project quality and communication.`
        );
      } else if (aggregatedMetrics.avgSatisfaction >= 9.0) {
        recommendations.push(
          `Excellent client satisfaction at ${aggregatedMetrics.avgSatisfaction.toFixed(1)}/10. Leverage for referrals and testimonials.`
        );
      }

      // Check profit margin
      if (aggregatedMetrics.avgMargin < 40) {
        recommendations.push(
          `Low profit margin at ${aggregatedMetrics.avgMargin.toFixed(0)}%. Increase rates or reduce consultant costs.`
        );
      } else if (aggregatedMetrics.avgMargin > 60) {
        recommendations.push(
          `Strong profit margin at ${aggregatedMetrics.avgMargin.toFixed(0)}%. Consider premium positioning or expanding team.`
        );
      }

      // Check overbudget projects
      const overbudgetProjects = projects.filter((p) => p.hoursWorked > p.hoursEstimated * 1.2);
      if (overbudgetProjects.length > 0) {
        recommendations.push(
          `${overbudgetProjects.length} project(s) over budget by 20%+. Improve scoping and time management.`
        );
      }

      // Check proposal conversion
      const proposalProjects = projects.filter((p) => p.status === 'Proposal');
      if (proposalProjects.length > aggregatedMetrics.activeProjects * 2) {
        recommendations.push(
          `${proposalProjects.length} proposals pending. Focus on closing deals or revise pricing strategy.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Consulting projects operating well. Monitor client satisfaction and margins.');
    }

    return NextResponse.json({
      projects,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      statusBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching consulting projects:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
