/**
 * @file src/app/api/ai/talent/[id]/productivity/route.ts
 * @description API endpoint for calculating AI employee productivity metrics
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Calculates comprehensive productivity metrics for AI employees using the
 * calculateProductivity utility from talentManagement.ts. Analyzes research
 * output, code output, project impact, efficiency, collaboration, and identifies
 * bottlenecks. Useful for performance reviews, resource allocation, and team
 * optimization decisions.
 * 
 * ENDPOINTS:
 * GET /api/ai/talent/:id/productivity?projectComplexity=8&teamSize=12
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
 *     fullName: "Alice Chen",
 *     role: "ResearchScientist",
 *     researchAbility: 9,
 *     codingSkill: 7,
 *     computeBudget: 3000,
 *     hasPhD: true,
 *     publications: 12,
 *     hIndex: 8,
 *     domainExpertise: "NLP",
 *     yearsOfExperience: 8
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
 *     idealComputeBudget: 4500,
 *     computeUtilization: "67% of ideal ($4,500)"
 *   },
 *   performanceRating: {
 *     current: 4,                   // 1-5 scale
 *     expectedFromProductivity: 4,  // Based on productivity score
 *     alignment: "On Track",        // On Track | Above Expectations | Below Expectations
 *     gap: 0
 *   },
 *   insights: {
 *     strengths: [
 *       "🌟 Exceptional overall productivity - top performer",
 *       "📄 Strong research output (1.8 papers/month)",
 *       "🎯 Significant project impact - critical contributor"
 *     ],
 *     opportunities: [
 *       "💰 Increase compute budget by $1,500/mo to improve efficiency",
 *       "✅ Operating at optimal productivity - maintain trajectory"
 *     ]
 *   }
 * }
 * 
 * PRODUCTIVITY FORMULA (from talentManagement.ts):
 * outputScore = (researchAbility × codingSkill × computeResources) / projectComplexity
 * 
 * Research output = (researchAbility/10) × (1 + resourceBonus) × (10/complexity)
 * Code output = (codingSkill × 10) × (1 + resourceBonus × 0.5) / complexity
 * Project impact = (avgSkill × 10) × (computeScore/100) × 0.9
 * Efficiency = 100 - (resourceGap / idealResource) × 50
 * Collaboration = teamSynergy based on team size (sweet spot: 6-15)
 * 
 * BOTTLENECK DETECTION:
 * - Compute < $1,500/mo: "Insufficient compute resources"
 * - Research ability < 5 && complexity > 7: "Research ability insufficient for complexity"
 * - Coding skill < 5 && complexity > 7: "Coding skill insufficient for complexity"
 * - Team size > 20: "Large team coordination overhead"
 * - Efficiency < 50: "Resource allocation mismatch"
 * 
 * ERROR RESPONSES:
 * - 400: Invalid query parameters (projectComplexity/teamSize out of range)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (no AI company found)
 * - 404: Employee not found or not AI role
 * - 500: Server error (database failure)
 * 
 * IMPLEMENTATION NOTES:
 * - Only works for AI roles (MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager)
 * - Non-AI roles return 400 error (use different productivity metrics)
 * - Research output only meaningful for PhD researchers (0 for non-PhDs)
 * - Ideal compute budget = (researchAbility + codingSkill) / 2 × $500
 * - Team size affects collaboration (sweet spot: 6-15 people)
 * - Recommendations are actionable (specific budget amounts, role changes)
 * - Performance rating alignment maps productivity 0-100 to 1-5 scale
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import { 
  calculateProductivity,
  type AIRole 
} from '@/lib/utils/ai/talentManagement';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';

/**
 * Valid AI roles for productivity calculation
 */
const AI_ROLES: AIRole[] = [
  'MLEngineer',
  'ResearchScientist',
  'DataEngineer',
  'MLOps',
  'ProductManager'
];

/**
 * GET /api/ai/talent/:id/productivity
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
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;
    
    const { userId, companyId } = session!;

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const complexityParam = searchParams.get('projectComplexity');
    const teamSizeParam = searchParams.get('teamSize');

    // 3. Validate and default parameters
    const projectComplexity = complexityParam ? parseInt(complexityParam, 10) : 5;
    const teamSize = teamSizeParam ? parseInt(teamSizeParam, 10) : 5;

    if (isNaN(projectComplexity) || projectComplexity < 1 || projectComplexity > 10) {
      return createErrorResponse('Project complexity must be between 1 and 10.', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (isNaN(teamSize) || teamSize < 1 || teamSize > 50) {
      return createErrorResponse('Team size must be between 1 and 50.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 4. Connect to database
    await connectDB();

    // 5. Find user's AI company
    const company = await Company.findById(companyId);

    if (!company || !['Technology', 'AI'].includes(company.industry)) {
      return createErrorResponse('No AI/Technology company found for this user.', ErrorCode.FORBIDDEN, 403);
    }

    // 6. Find employee
    const employee = await Employee.findOne({
      _id: id,
      company: company._id,
      firedAt: null, // Must be currently employed
    });

    if (!employee) {
      return createErrorResponse('Employee not found or not employed at your company.', ErrorCode.NOT_FOUND, 404);
    }

    // 7. Validate employee has AI role
    if (!AI_ROLES.includes(employee.role as AIRole)) {
      return createErrorResponse(
        `Productivity calculation only available for AI roles (${AI_ROLES.join(', ')}). Employee role: ${employee.role}`,
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // 8. Validate employee has AI-specific fields
    if (employee.researchAbility === undefined || employee.codingSkill === undefined) {
      return createErrorResponse(
        'Employee missing AI-specific fields (researchAbility, codingSkill). Cannot calculate productivity.',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // 9. Calculate productivity metrics using utility
    const productivity = calculateProductivity({
      researchAbility: employee.researchAbility,
      codingSkill: employee.codingSkill,
      computeResources: employee.computeBudget ?? 0,
      projectComplexity,
      teamSize,
    });

    // 10. Calculate ideal compute budget
    const averageSkill = (employee.researchAbility + employee.codingSkill) / 2;
    const idealComputeBudget = averageSkill * 500; // $500 per skill point (1-10 scale)

    // 11. Map productivity score (0-100) to performance rating (1-5)
    let expectedRating: number;
    if (productivity.outputScore >= 90) expectedRating = 5; // Exceptional
    else if (productivity.outputScore >= 75) expectedRating = 4; // Strong
    else if (productivity.outputScore >= 60) expectedRating = 3; // Average
    else if (productivity.outputScore >= 40) expectedRating = 2; // Below average
    else expectedRating = 1; // Poor

    // 12. Determine performance alignment
    const currentRating = employee.performanceRating;
    let alignment: 'On Track' | 'Above Expectations' | 'Below Expectations';
    if (currentRating >= expectedRating) {
      alignment = 'On Track';
    } else if (currentRating === expectedRating + 1) {
      alignment = 'Above Expectations';
    } else {
      alignment = 'Below Expectations';
    }

    // 13. Generate insights
    const insights = {
      strengths: generateStrengths(employee, productivity),
      opportunities: generateOpportunities(employee, productivity, idealComputeBudget),
    };

    // 14. Return comprehensive productivity analysis
    return createSuccessResponse({
      employee: {
        _id: employee._id,
        name: employee.name,
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
      insights,
    });
  } catch (error: unknown) {
    return handleAPIError('[GET /api/ai/talent/:id/productivity]', error, 'Failed to calculate productivity metrics');
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
    strengths.push(`📄 Strong research output (${productivity.researchOutput.toFixed(1)} papers/month)`);
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
 * Generate improvement opportunities
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
