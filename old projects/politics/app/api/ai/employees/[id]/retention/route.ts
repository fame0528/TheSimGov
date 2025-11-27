/**
 * @file app/api/ai/employees/[id]/retention/route.ts
 * @description API endpoint for adjusting compensation to prevent employee turnover
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Proactive retention endpoint for adjusting AI employee compensation before they
 * become flight risks. Uses calculateRetentionRisk utility to assess current risk
 * and recommend counter-offer amounts. Supports salary, equity, and compute budget
 * adjustments to reduce retention risk.
 * 
 * ENDPOINTS:
 * PATCH /api/ai/employees/:id/retention
 * 
 * REQUEST BODY:
 * {
 *   salaryAdjustment: 25000,        // Salary increase ($)
 *   equityAdjustment: 0.5,          // Additional equity % (0-10)
 *   computeBudgetAdjustment: 1000,  // Additional monthly compute $
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
 *     retentionRisk: 22,             // Reduced from 68 (High → Low)
 *     satisfaction: 82,              // Increased from 65
 *     morale: 78,                    // Increased from 68
 *     counterOfferCount: 1,          // Incremented
 *     // ... full employee record
 *   },
 *   riskAnalysis: {
 *     before: {
 *       riskScore: 68,
 *       severity: "High",
 *       urgency: "Action",
 *       factors: {
 *         salaryGap: 72,
 *         satisfactionScore: 35,
 *         tenureRisk: 80,
 *         externalPressure: 50
 *       }
 *     },
 *     after: {
 *       riskScore: 22,
 *       severity: "Low",
 *       urgency: "Monitor",
 *       factors: {
 *         salaryGap: 15,
 *         satisfactionScore: 18,
 *         tenureRisk: 80,
 *         externalPressure: 50
 *       }
 *     },
 *     improvement: {
 *       riskReduction: 46,           // Points reduced
 *       percentImprovement: 67.6     // % improvement
 *     }
 *   },
 *   recommendations: [
 *     "Retention risk successfully reduced to Low severity",
 *     "Continue regular check-ins to maintain satisfaction",
 *     "Monitor for external poaching attempts"
 *   ]
 * }
 * 
 * RISK REDUCTION FORMULA:
 * - Salary adjustment: Reduces salaryGap factor (40% weight in retention risk)
 * - Equity adjustment: Increases perceived value (+5% satisfaction per 0.5% equity)
 * - Compute budget: Enables better work (+10% satisfaction per $1k budget)
 * - Bonus adjustment: Increases perceived value (+2% satisfaction per 5% bonus)
 * - All adjustments boost satisfaction and morale
 * 
 * EFFECTIVENESS THRESHOLDS:
 * - Salary adjustment closes 70%+ of market gap: Risk → Low (effective)
 * - Salary adjustment closes 50-69% of gap: Risk → Medium (moderate)
 * - Salary adjustment closes <50% of gap: Risk → High (ineffective)
 * - Equity/compute/bonus alone without salary: Limited effectiveness (max 15% reduction)
 * 
 * ERROR RESPONSES:
 * - 400: Invalid request body (negative values, exceeds limits)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (user does not own company or employee)
 * - 404: Employee not found
 * - 500: Server error (database failure, utility error)
 * 
 * IMPLEMENTATION NOTES:
 * - All adjustments are additive (increase from current values, never decrease)
 * - Counter-offer count incremented to track retention interventions
 * - Satisfaction and morale boosted based on adjustment magnitude
 * - Pre-save hook recalculates retention risk automatically
 * - Effective for proactive retention (before employee actively job hunting)
 * - Less effective if employee already has competing offers (acceptance probability lower)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import Employee from '@/lib/db/models/Employee';
import { 
  calculateCompetitiveSalary, 
  calculateRetentionRisk,
  type AIRole 
} from '@/lib/utils/ai/talentManagement';

/**
 * Retention adjustment request body
 */
interface RetentionRequest {
  salaryAdjustment?: number;        // Salary increase (positive only)
  equityAdjustment?: number;        // Additional equity % (0-10)
  computeBudgetAdjustment?: number; // Additional monthly compute $ (0-10000)
  bonusAdjustment?: number;         // Additional bonus % (0-100)
  reason?: string;                  // Optional reason for adjustment
}

/**
 * PATCH /api/ai/employees/:id/retention
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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

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
    if (salaryAdjustment < 0) {
      return NextResponse.json(
        { success: false, error: 'Salary adjustment cannot be negative (use positive values for increases).' },
        { status: 400 }
      );
    }

    if (equityAdjustment < 0) {
      return NextResponse.json(
        { success: false, error: 'Equity adjustment cannot be negative.' },
        { status: 400 }
      );
    }

    if (computeBudgetAdjustment < 0) {
      return NextResponse.json(
        { success: false, error: 'Compute budget adjustment cannot be negative.' },
        { status: 400 }
      );
    }

    if (bonusAdjustment < 0) {
      return NextResponse.json(
        { success: false, error: 'Bonus adjustment cannot be negative.' },
        { status: 400 }
      );
    }

    // 4. Validate at least one adjustment provided
    if (salaryAdjustment === 0 && equityAdjustment === 0 && computeBudgetAdjustment === 0 && bonusAdjustment === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one compensation adjustment required (salary, equity, compute budget, or bonus).' 
        },
        { status: 400 }
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Find user's AI company
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

    // 7. Find employee
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

    // 8. Calculate current market rate
    const marketAnalysis = calculateCompetitiveSalary({
      role: employee.role as AIRole,
      skillLevel: employee.technical,
      hasPhD: employee.hasPhD ?? false,
      yearsExperience: employee.yearsOfExperience,
    });

    // 9. Calculate retention risk BEFORE adjustments
    const riskBefore = calculateRetentionRisk({
      currentSalary: employee.salary,
      marketSalary: marketAnalysis.totalSalary,
      satisfaction: employee.satisfaction,
      competitorOffers: employee.counterOfferCount,
      yearsInRole: employee.yearsOfExperience,
    });

    // 10. Apply compensation adjustments
    const previousSalary = employee.salary;
    const previousEquity = employee.equity;
    const previousComputeBudget = employee.computeBudget ?? 0;
    const previousBonus = employee.bonus;

    employee.salary += salaryAdjustment;
    employee.equity = Math.min(10, employee.equity + equityAdjustment); // Cap at 10%
    employee.computeBudget = Math.min(10000, (employee.computeBudget ?? 0) + computeBudgetAdjustment); // Cap at $10k/mo
    employee.bonus = Math.min(100, employee.bonus + bonusAdjustment); // Cap at 100%

    // 11. Validate new values don't exceed limits
    if (employee.salary > 5000000) {
      return NextResponse.json(
        { success: false, error: 'Salary adjustment would exceed $5,000,000 maximum.' },
        { status: 400 }
      );
    }

    // 12. Boost satisfaction and morale based on adjustments
    let satisfactionBoost = 0;
    let moraleBoost = 0;

    // Salary boost (primary driver)
    if (salaryAdjustment > 0) {
      const salaryIncreasePercent = (salaryAdjustment / previousSalary) * 100;
      satisfactionBoost += Math.min(20, salaryIncreasePercent); // Up to +20 satisfaction for 20%+ raise
      moraleBoost += Math.min(15, salaryIncreasePercent * 0.75); // Up to +15 morale
    }

    // Equity boost
    if (equityAdjustment > 0) {
      satisfactionBoost += equityAdjustment * 2; // +2 per 1% equity (e.g., 0.5% → +1 satisfaction)
      moraleBoost += equityAdjustment; // +1 per 1% equity
    }

    // Compute budget boost
    if (computeBudgetAdjustment > 0) {
      satisfactionBoost += (computeBudgetAdjustment / 1000) * 3; // +3 per $1k budget
      moraleBoost += (computeBudgetAdjustment / 1000) * 2; // +2 per $1k budget
    }

    // Bonus boost
    if (bonusAdjustment > 0) {
      satisfactionBoost += bonusAdjustment / 5; // +1 per 5% bonus
      moraleBoost += bonusAdjustment / 10; // +0.5 per 5% bonus
    }

    employee.satisfaction = Math.min(100, employee.satisfaction + Math.round(satisfactionBoost));
    employee.morale = Math.min(100, employee.morale + Math.round(moraleBoost));
    employee.counterOfferCount += 1;
    employee.lastRaise = new Date();

    await employee.save(); // Pre-save hook will recalculate retentionRisk

    // 13. Calculate retention risk AFTER adjustments
    const riskAfter = calculateRetentionRisk({
      currentSalary: employee.salary,
      marketSalary: marketAnalysis.totalSalary,
      satisfaction: employee.satisfaction,
      competitorOffers: employee.counterOfferCount,
      yearsInRole: employee.yearsOfExperience,
    });

    // 14. Calculate improvement metrics
    const riskReduction = riskBefore.riskScore - riskAfter.riskScore;
    const percentImprovement = (riskReduction / riskBefore.riskScore) * 100;

    // 15. Generate recommendations
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

    // 16. Return updated employee with risk analysis
    return NextResponse.json({
      success: true,
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
        reason: reason ?? 'Retention adjustment',
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
    console.error('[API] /api/ai/employees/[id]/retention - Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process retention adjustment', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
