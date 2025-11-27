/**
 * @file app/api/ai/employees/[id]/productivity/route.ts
 * @description API endpoint for calculating AI employee productivity metrics
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Calculates comprehensive productivity metrics for AI employees using the
 * calculateProductivity utility. Analyzes research output, code output, project
 * impact, efficiency, and identifies bottlenecks. Useful for performance reviews,
 * resource allocation decisions, and team optimization.
 * 
 * ENDPOINTS:
 * GET /api/ai/employees/:id/productivity?projectComplexity=8&teamSize=12
 * 
 * QUERY PARAMETERS:
 * - projectComplexity: Project difficulty (1-10 scale, default 5)
 * - teamSize: Size of team employee works with (1-50, default 5)
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   employee: {
 *     _id: "...",
 *     firstName: "Alice",
 *     lastName: "Chen",
 *     role: "ResearchScientist",
 *     researchAbility: 9,
 *     codingSkill: 7,
 *     computeBudget: 3000,
 *     // ... other fields
 *   },
 *   productivity: {
 *     outputScore: 82,              // Overall productivity (0-100)
 *     researchOutput: 1.8,          // Papers per month (PhD researchers)
 *     codeOutput: 85,               // Features/implementations per sprint (0-100)
 *     projectImpact: 88,            // Contribution to project success (0-100)
 *     efficiency: 75,               // Resource utilization (0-100)
 *     collaboration: 87,            // Team synergy factor (0-100)
 *     bottlenecks: [
 *       "Insufficient compute resources (< $1,500/mo allocated)"
 *     ],
 *     recommendations: [
 *       "Increase compute budget to $4,500/mo for optimal productivity",
 *       "High research ability detected. Allocate time for paper writing"
 *     ]
 *   },
 *   context: {
 *     projectComplexity: 8,
 *     teamSize: 12,
 *     computeAllocation: 3000,
 *     computeUtilization: "67% of ideal ($4,500)"
 *   },
 *   performanceRating: {
 *     current: 4,                   // 1-5 scale
 *     expectedFromProductivity: 4,  // Based on productivity score
 *     alignment: "On Track"         // On Track, Above Expectations, Below Expectations
 *   }
 * }
 * 
 * PRODUCTIVITY FORMULA:
 * outputScore = (researchAbility × codingSkill × computeResources) / projectComplexity
 * 
 * Research output = (researchAbility/10) × (1 + resourceBonus) × (10/complexity)
 * Code output = (codingSkill × 10) × (1 + resourceBonus × 0.5) / complexity
 * Project impact = (avgSkill × 10) × (computeScore/100) × 0.9
 * Efficiency = 100 - (resourceGap / idealResource) × 50
 * 
 * BOTTLENECK DETECTION:
 * - Compute < $1,500/mo: "Insufficient compute resources"
 * - Research ability < 5 && complexity > 7: "Research ability insufficient"
 * - Coding skill < 5 && complexity > 7: "Coding skill insufficient"
 * - Team size > 20: "Large team coordination overhead"
 * - Efficiency < 50: "Resource allocation mismatch"
 * 
 * ERROR RESPONSES:
 * - 400: Invalid query parameters (projectComplexity/teamSize out of range)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (user does not own company or employee)
 * - 404: Employee not found
 * - 500: Server error (database failure, utility error)
 * 
 * IMPLEMENTATION NOTES:
 * - Only calculates productivity for AI roles (MLEngineer, ResearchScientist, etc.)
 * - Non-AI roles return error (use different productivity metrics)
 * - Research output only meaningful for PhD researchers (returns 0 for non-PhDs)
 * - Ideal compute budget calculated as: (researchAbility + codingSkill) / 2 × $500
 * - Team size affects collaboration score (sweet spot: 6-15 people)
 * - Recommendations actionable (specific budget amounts, role changes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import { 
  calculateProductivity,
  type AIRole 
} from '@/lib/utils/ai/talentManagement';

/**
 * GET /api/ai/employees/:id/productivity
 * Calculate productivity metrics for AI employee
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Unwrap params (Next.js 15 Promise-based params)
    const { id } = await params;
    
    // 1. Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const complexityParam = searchParams.get('projectComplexity');
    const teamSizeParam = searchParams.get('teamSize');

    // 3. Validate and default parameters
    const projectComplexity = complexityParam ? parseInt(complexityParam, 10) : 5;
    const teamSize = teamSizeParam ? parseInt(teamSizeParam, 10) : 5;

    if (isNaN(projectComplexity) || projectComplexity < 1 || projectComplexity > 10) {
      return NextResponse.json(
        { success: false, error: 'Project complexity must be between 1 and 10.' },
        { status: 400 }
      );
    }

    if (isNaN(teamSize) || teamSize < 1 || teamSize > 50) {
      return NextResponse.json(
        { success: false, error: 'Team size must be between 1 and 50.' },
        { status: 400 }
      );
    }

    // 4. Connect to database
    await connectDB();

    // 5. Find user's AI company
    const company = await Company.findOne({
      user: session.user.id,
      industryType: { $in: ['Technology', 'AI'] },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'No AI/Technology company found for this user.' },
        { status: 403 }
      );
    }

    // 6. Find employee
    const employee = await Employee.findOne({
      _id: id,
      company: company._id,
      firedAt: null, // Must be currently employed
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found or not employed at your company.' },
        { status: 404 }
      );
    }

    // 7. Validate employee has AI role
    const aiRoles: AIRole[] = ['MLEngineer', 'ResearchScientist', 'DataEngineer', 'MLOps', 'ProductManager'];
    if (!aiRoles.includes(employee.role as AIRole)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Productivity calculation only available for AI roles (${aiRoles.join(', ')}). Employee role: ${employee.role}` 
        },
        { status: 400 }
      );
    }

    // 8. Validate employee has AI-specific fields
    if (employee.researchAbility === undefined || employee.codingSkill === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Employee missing AI-specific fields (researchAbility, codingSkill). Cannot calculate productivity.' 
        },
        { status: 400 }
      );
    }

    // 9. Calculate productivity metrics
    const productivity = calculateProductivity({
      researchAbility: employee.researchAbility,
      codingSkill: employee.codingSkill,
      computeResources: employee.computeBudget ?? 0,
      projectComplexity,
      teamSize,
    });

    // 10. Calculate ideal compute budget
    const averageSkill = (employee.researchAbility + employee.codingSkill) / 2;
    const idealComputeBudget = averageSkill * 500; // $500 per skill point on 1-10 scale

    // 11. Determine performance alignment
    // Map productivity score (0-100) to performance rating (1-5)
    let expectedRating: number;
    if (productivity.outputScore >= 90) expectedRating = 5;
    else if (productivity.outputScore >= 75) expectedRating = 4;
    else if (productivity.outputScore >= 60) expectedRating = 3;
    else if (productivity.outputScore >= 40) expectedRating = 2;
    else expectedRating = 1;

    const currentRating = employee.performanceRating;
    let alignment: 'On Track' | 'Above Expectations' | 'Below Expectations';
    if (currentRating >= expectedRating) alignment = 'On Track';
    else if (currentRating === expectedRating + 1) alignment = 'Above Expectations';
    else alignment = 'Below Expectations';

    // 12. Return comprehensive productivity analysis
    return NextResponse.json({
      success: true,
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        role: employee.role,
        researchAbility: employee.researchAbility,
        codingSkill: employee.codingSkill,
        computeBudget: employee.computeBudget ?? 0,
        hasPhD: employee.hasPhD ?? false,
        publications: employee.publications ?? 0,
        hIndex: employee.hIndex ?? 0,
        domainExpertise: employee.domainExpertise,
        yearsOfExperience: employee.yearsOfExperience,
      },
      productivity,
      context: {
        projectComplexity,
        teamSize,
        computeAllocation: employee.computeBudget ?? 0,
        idealComputeBudget: Math.round(idealComputeBudget),
        computeUtilization: employee.computeBudget 
          ? `${Math.round((employee.computeBudget / idealComputeBudget) * 100)}% of ideal ($${Math.round(idealComputeBudget).toLocaleString()})`
          : '0% (no compute allocated)',
      },
      performanceRating: {
        current: currentRating,
        expectedFromProductivity: expectedRating,
        alignment,
        gap: currentRating - expectedRating,
      },
      insights: {
        strengths: generateStrengths(employee, productivity),
        opportunities: generateOpportunities(employee, productivity, idealComputeBudget),
      },
    });
  } catch (error: unknown) {
    console.error('[API] /api/ai/employees/[id]/productivity - Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate productivity metrics', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate strengths based on productivity analysis
 */
function generateStrengths(employee: any, productivity: any): string[] {
  const strengths: string[] = [];

  if (productivity.outputScore >= 80) {
    strengths.push('🌟 Exceptional overall productivity - top performer');
  }

  if (productivity.researchOutput >= 1.5) {
    strengths.push(`📄 Strong research output (${productivity.researchOutput} papers/month)`);
  }

  if (productivity.codeOutput >= 80) {
    strengths.push('💻 High code output - efficient implementation');
  }

  if (productivity.projectImpact >= 85) {
    strengths.push('🎯 Significant project impact - critical contributor');
  }

  if (productivity.efficiency >= 80) {
    strengths.push('⚡ Excellent resource utilization - high efficiency');
  }

  if (productivity.collaboration >= 85) {
    strengths.push('🤝 Strong team collaboration - synergy driver');
  }

  if (employee.hasPhD && employee.publications >= 10) {
    strengths.push(`🎓 Experienced researcher (${employee.publications} publications, h-index: ${employee.hIndex})`);
  }

  if (strengths.length === 0) {
    strengths.push('Solid contributor with room for growth');
  }

  return strengths;
}

/**
 * Generate improvement opportunities based on productivity analysis
 */
function generateOpportunities(employee: any, productivity: any, idealComputeBudget: number): string[] {
  const opportunities: string[] = [];

  if (productivity.efficiency < 60) {
    const currentBudget = employee.computeBudget ?? 0;
    const gap = idealComputeBudget - currentBudget;
    if (gap > 0) {
      opportunities.push(`💰 Increase compute budget by $${Math.round(gap).toLocaleString()}/mo to improve efficiency`);
    } else {
      opportunities.push('🎯 Review workload allocation - resources underutilized');
    }
  }

  if (productivity.researchOutput > 0 && productivity.researchOutput < 1.0 && employee.hasPhD) {
    opportunities.push('📚 Allocate more time for research/paper writing (current: <1 paper/month)');
  }

  if (productivity.codeOutput < 60) {
    opportunities.push('🔧 Pair programming or code review focus to improve implementation velocity');
  }

  if (productivity.collaboration < 70) {
    opportunities.push('👥 Improve team coordination - communication overhead detected');
  }

  if (productivity.bottlenecks.length > 0) {
    opportunities.push(`🚧 Address bottlenecks: ${productivity.bottlenecks[0]}`);
  }

  if (employee.researchAbility >= 8 && productivity.projectImpact < 70) {
    opportunities.push('🚀 Assign to more complex projects to better utilize research skills');
  }

  if (opportunities.length === 0) {
    opportunities.push('✅ Operating at optimal productivity - maintain current trajectory');
  }

  return opportunities;
}
