/**
 * @file src/app/api/ai/talent/[id]/retention/route.ts
 * @description API endpoint for proactive employee retention via compensation adjustment
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Proactive retention endpoint for adjusting AI employee compensation before they
 * become flight risks. Uses calculateRetentionRisk and calculateCompetitiveSalary
 * utilities to assess current risk and recommend counter-offer amounts. Supports
 * salary, equity, compute budget, and bonus adjustments to reduce retention risk.
 * 
 * ENDPOINTS:
 * - PATCH /api/ai/talent/:id/retention
 * 
 * REQUEST BODY:
 * {
 *   salaryAdjustment: 25000,        // Salary increase ($, positive values only)
 *   equityAdjustment: 0.5,          // Additional equity % (0-10)
 *   computeBudgetAdjustment: 1000,  // Additional monthly compute $ (0-10000)
 *   bonusAdjustment: 5,             // Additional bonus % (0-100)
 *   reason: "Market adjustment"     // Optional reason for adjustment
 * }
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   employee: {
 *     _id: "...",
 *     salary: 255000,                // Updated from 230000
 *     equity: 1.5,                   // Updated from 1.0
 *     computeBudget: 4000,           // Updated from 3000
 *     bonus: 15,                     // Updated from 10
 *     retentionRisk: 22,             // Reduced from 68 (High → Low)
 *     satisfaction: 82,              // Increased from 65
 *     morale: 78,                    // Increased from 68
 *     counterOfferCount: 1,          // Incremented (tracks interventions)
 *     lastRaise: "2025-11-22T...",   // Updated timestamp
 *     // ... full employee record
 *   },
 *   adjustments: {
 *     salary: { previous: 230000, new: 255000, increase: 25000 },
 *     equity: { previous: 1.0, new: 1.5, increase: 0.5 },
 *     computeBudget: { previous: 3000, new: 4000, increase: 1000 },
 *     bonus: { previous: 10, new: 15, increase: 5 },
 *     reason: "Market adjustment"
 *   },
 *   riskAnalysis: {
 *     before: {
 *       riskScore: 68,
 *       severity: "High",
 *       urgency: "Action",
 *       factors: {
 *         salaryGap: 72,              // 40% weight
 *         satisfactionScore: 35,      // 30% weight
 *         tenureRisk: 80,             // 20% weight
 *         externalPressure: 50        // 10% weight
 *       }
 *     },
 *     after: {
 *       riskScore: 22,
 *       severity: "Low",
 *       urgency: "Monitor",
 *       factors: {
 *         salaryGap: 15,              // Improved
 *         satisfactionScore: 18,      // Improved
 *         tenureRisk: 80,             // No change (tenure-based)
 *         externalPressure: 50        // No change (market-based)
 *       }
 *     },
 *     improvement: {
 *       riskReduction: 46,            // Points reduced (68 → 22)
 *       percentImprovement: 67.6      // % improvement
 *     }
 *   },
 *   marketAnalysis: {
 *     marketSalary: 270000,
 *     currentSalary: 255000,
 *     salaryGap: 15000,               // Reduced from 40000
 *     competitiveness: "Competitive"  // Improved from "BelowMarket"
 *   },
 *   recommendations: [
 *     "✅ Retention risk successfully reduced to Low severity",
 *     "Continue regular check-ins to maintain satisfaction",
 *     "Strong improvement: 46 point risk reduction",
 *     "Monitor for external poaching attempts"
 *   ]
 * }
 * 
 * RISK REDUCTION FORMULA:
 * Salary adjustment: Reduces salaryGap factor (40% weight in retention risk)
 * - Closes 70%+ of market gap → Risk severity: High/Critical → Low
 * - Closes 50-69% of gap → Risk severity: High → Medium
 * - Closes <50% of gap → Risk severity: High → High (ineffective)
 * 
 * Satisfaction/Morale boosts:
 * - Salary: +1 satisfaction per 1% raise (max +20), +0.75 morale per 1% raise (max +15)
 * - Equity: +2 satisfaction per 1% equity (e.g., 0.5% → +1), +1 morale per 1% equity
 * - Compute: +3 satisfaction per $1k budget, +2 morale per $1k budget
 * - Bonus: +0.2 satisfaction per 1% bonus, +0.1 morale per 1% bonus
 * 
 * EFFECTIVENESS THRESHOLDS:
 * - Salary closes 70%+ gap: Risk → Low (highly effective)
 * - Salary closes 50-69% gap: Risk → Medium (moderately effective)
 * - Salary closes <50% gap: Risk → High (ineffective, employee likely to leave)
 * - Equity/compute/bonus alone (no salary): Limited effectiveness (max 15% risk reduction)
 * 
 * ERROR RESPONSES:
 * - 400: Invalid request (negative values, no adjustments, exceeds limits)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (no AI company found)
 * - 404: Employee not found
 * - 500: Server error (database failure)
 * 
 * IMPLEMENTATION NOTES:
 * - All adjustments are additive (increase from current, never decrease)
 * - Counter-offer count incremented to track retention interventions
 * - Satisfaction and morale boosted based on adjustment magnitude
 * - Pre-save hook recalculates retentionRisk automatically based on new values
 * - Most effective for proactive retention (before employee actively job hunting)
 * - Less effective if employee already has competing offers (use /offer endpoint instead)
 * - Salary adjustment is primary lever (40% weight in retention formula)
 * - Equity/compute/bonus are secondary (boost satisfaction but don't close salary gap)
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import { 
  calculateCompetitiveSalary,
  calculateRetentionRisk,
  type AIRole 
} from '@/lib/utils/ai/talentManagement';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';

/**
 * Retention adjustment request body
 */
interface RetentionRequest {
  salaryAdjustment?: number;
  equityAdjustment?: number;
  computeBudgetAdjustment?: number;
  bonusAdjustment?: number;
  reason?: string;
}

/**
 * PATCH /api/ai/talent/:id/retention
 * Adjust compensation to reduce employee retention risk
 */
export async function PATCH(
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

    // 2. Parse request body
    const body = await req.json() as RetentionRequest;
    const {
      salaryAdjustment = 0,
      equityAdjustment = 0,
      computeBudgetAdjustment = 0,
      bonusAdjustment = 0,
      reason,
    } = body;

    // 3. Validate adjustments (all must be non-negative)
    if (salaryAdjustment < 0 || equityAdjustment < 0 || computeBudgetAdjustment < 0 || bonusAdjustment < 0) {
      return createErrorResponse('All adjustments must be non-negative (use positive values for increases only).', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 4. Validate at least one adjustment provided
    if (salaryAdjustment === 0 && equityAdjustment === 0 && computeBudgetAdjustment === 0 && bonusAdjustment === 0) {
      return createErrorResponse(
        'At least one compensation adjustment required (salary, equity, compute budget, or bonus).',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Find user's AI company
    const company = await Company.findById(companyId);

    if (!company || !['Technology', 'AI'].includes(company.industry)) {
      return createErrorResponse('No AI/Technology company found for this user.', ErrorCode.FORBIDDEN, 403);
    }

    // 7. Find employee
    const employee = await Employee.findOne({
      _id: id,
      company: company._id,
      firedAt: null, // Must be currently employed
    });

    if (!employee) {
      return createErrorResponse('Employee not found or not employed at your company.', ErrorCode.NOT_FOUND, 404);
    }

    // 8. Calculate current market rate
    const marketAnalysis = calculateCompetitiveSalary({
      role: employee.role as AIRole,
      skillLevel: employee.skills.technical,
      hasPhD: employee.hasPhD ?? false,
      yearsExperience: Math.floor(employee.performance.productivity * 10), // Proxy for years
    });

    // 9. Calculate retention risk BEFORE adjustments
    const riskBefore = calculateRetentionRisk({
      currentSalary: employee.salary,
      marketSalary: marketAnalysis.totalSalary,
      satisfaction: employee.satisfaction,
      competitorOffers: employee.counterOfferCount,
      yearsInRole: Math.floor(employee.performance.productivity * 10),
    });

    // 10. Capture previous values
    const previousSalary = employee.salary;
    const previousEquity = employee.equity;
    const previousComputeBudget = employee.computeBudget ?? 0;
    const previousBonus = employee.bonus;

    // 11. Apply compensation adjustments
    employee.salary += salaryAdjustment;
    employee.equity = Math.min(10, employee.equity + equityAdjustment); // Cap at 10%
    employee.computeBudget = Math.min(10000, (employee.computeBudget ?? 0) + computeBudgetAdjustment); // Cap at $10k/mo
    employee.bonus = Math.min(100, employee.bonus + bonusAdjustment); // Cap at 100%

    // 12. Validate new values don't exceed limits
    if (employee.salary > 5000000) {
      return createErrorResponse('Salary adjustment would exceed $5,000,000 maximum.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 13. Calculate satisfaction and morale boosts
    let satisfactionBoost = 0;
    let moraleBoost = 0;

    // Salary boost (primary driver)
    if (salaryAdjustment > 0) {
      const salaryIncreasePercent = (salaryAdjustment / previousSalary) * 100;
      satisfactionBoost += Math.min(20, salaryIncreasePercent); // Up to +20 for 20%+ raise
      moraleBoost += Math.min(15, salaryIncreasePercent * 0.75); // Up to +15 morale
    }

    // Equity boost
    if (equityAdjustment > 0) {
      satisfactionBoost += equityAdjustment * 2; // +2 per 1% equity
      moraleBoost += equityAdjustment; // +1 per 1% equity
    }

    // Compute budget boost
    if (computeBudgetAdjustment > 0) {
      satisfactionBoost += (computeBudgetAdjustment / 1000) * 3; // +3 per $1k
      moraleBoost += (computeBudgetAdjustment / 1000) * 2; // +2 per $1k
    }

    // Bonus boost
    if (bonusAdjustment > 0) {
      satisfactionBoost += bonusAdjustment / 5; // +1 per 5% bonus
      moraleBoost += bonusAdjustment / 10; // +0.5 per 5% bonus
    }

    // 14. Apply boosts (capped at 100)
    employee.satisfaction = Math.min(100, employee.satisfaction + Math.round(satisfactionBoost));
    employee.morale = Math.min(100, employee.morale + Math.round(moraleBoost));
    employee.counterOfferCount += 1; // Track retention interventions
    employee.lastRaise = new Date();

    // 15. Save employee (pre-save hook will recalculate retentionRisk)
    await employee.save();

    // 16. Calculate retention risk AFTER adjustments
    const riskAfter = calculateRetentionRisk({
      currentSalary: employee.salary,
      marketSalary: marketAnalysis.totalSalary,
      satisfaction: employee.satisfaction,
      competitorOffers: employee.counterOfferCount,
      yearsInRole: Math.floor(employee.performance.productivity * 10),
    });

    // 17. Calculate improvement metrics
    const riskReduction = riskBefore.riskScore - riskAfter.riskScore;
    const percentImprovement = (riskReduction / riskBefore.riskScore) * 100;

    // 18. Generate recommendations
    const recommendations: string[] = [];

    if (riskAfter.severity === 'Low') {
      recommendations.push('✅ Retention risk successfully reduced to Low severity');
      recommendations.push('Continue regular check-ins to maintain satisfaction');
    } else if (riskAfter.severity === 'Medium') {
      recommendations.push('⚠️ Retention risk reduced to Medium severity');
      recommendations.push('Consider additional salary adjustment to reach Low risk');
    } else if (riskAfter.severity === 'High' || riskAfter.severity === 'Critical') {
      recommendations.push('🚨 Retention risk remains High/Critical despite adjustment');
      recommendations.push(`Salary gap still significant: $${(marketAnalysis.totalSalary - employee.salary).toLocaleString()}`);
      recommendations.push('Employee may still be actively job hunting - expedite further action');
    }

    if (riskReduction > 30) {
      recommendations.push(`Strong improvement: ${Math.round(riskReduction)} point risk reduction`);
    } else if (riskReduction > 0) {
      recommendations.push(`Moderate improvement: ${Math.round(riskReduction)} point risk reduction`);
    } else {
      recommendations.push('⚠️ Minimal risk improvement detected - adjustments may be insufficient');
    }

    recommendations.push('Monitor for external poaching attempts');

    // 19. Return updated employee with comprehensive analysis
    return createSuccessResponse({
      employee,
      adjustments: {
        salary: {
          previous: previousSalary,
          new: employee.salary,
          increase: salaryAdjustment,
        },
        equity: {
          previous: previousEquity,
          new: employee.equity,
          increase: equityAdjustment,
        },
        computeBudget: {
          previous: previousComputeBudget,
          new: employee.computeBudget,
          increase: computeBudgetAdjustment,
        },
        bonus: {
          previous: previousBonus,
          new: employee.bonus,
          increase: bonusAdjustment,
        },
        reason: reason ?? 'Proactive retention adjustment',
      },
      riskAnalysis: {
        before: riskBefore,
        after: riskAfter,
        improvement: {
          riskReduction: Math.round(riskReduction),
          percentImprovement: Math.round(percentImprovement * 10) / 10,
        },
      },
      marketAnalysis: {
        marketSalary: marketAnalysis.totalSalary,
        currentSalary: employee.salary,
        salaryGap: marketAnalysis.totalSalary - employee.salary,
        competitiveness: marketAnalysis.competitiveness,
      },
      recommendations,
    });
  } catch (error: unknown) {
    return handleAPIError('[PATCH /api/ai/talent/:id/retention]', error, 'Failed to process retention adjustment');
  }
}
