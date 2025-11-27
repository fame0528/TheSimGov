/**
 * @file app/api/employees/[id]/review/route.ts
 * @description API endpoint for employee performance reviews
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * POST endpoint for conducting employee performance reviews. Evaluates performance
 * across multiple dimensions (contracts completed, revenue generated, skill growth,
 * attendance, teamwork), calculates overall rating, determines raise/bonus recommendations,
 * updates employee compensation, and tracks review history. Integrates with Company
 * model for budget validation and Transaction model for financial tracking.
 * 
 * ENDPOINT: POST /api/employees/[id]/review
 * 
 * REQUEST BODY:
 * ```json
 * {
 *   "contractsCompleted": number,      // Since last review
 *   "revenueGenerated": number,        // Since last review
 *   "attendanceScore": number,         // 0-100
 *   "teamworkScore": number,           // 0-100
 *   "reviewerNotes": "string",         // Optional feedback
 *   "applyRaise": boolean,             // Auto-apply recommended raise
 *   "applyBonus": boolean              // Auto-apply recommended bonus
 * }
 * ```
 * 
 * RESPONSE (200 - Success):
 * ```json
 * {
 *   "success": true,
 *   "message": "Performance review completed",
 *   "review": {
 *     "overallRating": number,         // 1-5 stars
 *     "performanceScore": number,      // 0-100
 *     "strengths": ["string"],
 *     "areasForImprovement": ["string"],
 *     "recommendedRaise": number,
 *     "recommendedBonus": number,
 *     "raiseApplied": boolean,
 *     "bonusApplied": boolean
 *   },
 *   "employee": {
 *     "id": "string",
 *     "salary": number,
 *     "bonus": number,
 *     "performanceRating": number,
 *     "nextReviewDate": "string"
 *   }
 * }
 * ```
 * 
 * BUSINESS LOGIC:
 * 1. Validate employee exists and is active
 * 2. Calculate performance score across 5 dimensions:
 *    - Contract completion (20%)
 *    - Revenue generation (25%)
 *    - Skill growth (20%)
 *    - Attendance (15%)
 *    - Teamwork (20%)
 * 3. Convert score to 1-5 star rating
 * 4. Identify strengths (metrics > 80) and improvement areas (metrics < 60)
 * 5. Calculate raise recommendation based on performance and market rates
 * 6. Calculate bonus recommendation based on revenue contribution
 * 7. Validate company budget for compensation changes
 * 8. Apply raise/bonus if requested and budget allows
 * 9. Update employee performance rating and review history
 * 10. Schedule next review date (6-12 months based on performance)
 * 11. Create transaction records for compensation changes
 * 12. Update morale/satisfaction based on review outcome
 * 
 * IMPLEMENTATION NOTES:
 * - Performance rating directly affects retention risk
 * - Poor reviews (< 2.5 stars) increase turnover probability
 * - Excellent reviews (> 4.0 stars) boost loyalty and morale
 * - Market-competitive raises are 3-8% annually
 * - High performers get 10-20% raises, low performers 0-3%
 * - Bonuses range from 0-50% of annual salary
 * - Review frequency: Poor performers every 6 months, good performers annually
 * - Denied raises significantly increase retention risk
 * - Company budget constraints can override recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
// TODO: Implement proper authentication
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth/authOptions';
import { getMarketSalary } from '@/lib/utils/employeeRetention';

/**
 * Calculate performance score across multiple dimensions
 * 
 * @param {Object} metrics - Performance metrics
 * @returns {Object} Detailed performance breakdown
 */
function calculatePerformanceScore(metrics: {
  contractsCompleted: number;
  revenueGenerated: number;
  skillGrowth: number;
  attendanceScore: number;
  teamworkScore: number;
  expectedContracts: number;
  expectedRevenue: number;
}): {
  overallScore: number;
  breakdown: Record<string, number>;
  strengths: string[];
  areasForImprovement: string[];
} {
  // Contract completion score (0-100)
  const contractScore = Math.min(
    100,
    (metrics.contractsCompleted / Math.max(1, metrics.expectedContracts)) * 100
  );

  // Revenue generation score (0-100)
  const revenueScore = Math.min(
    100,
    (metrics.revenueGenerated / Math.max(1, metrics.expectedRevenue)) * 100
  );

  // Skill growth score (0-100)
  const skillScore = Math.min(100, metrics.skillGrowth * 2); // 0-50 growth → 0-100 score

  // Weighted overall score
  const overallScore =
    contractScore * 0.2 +
    revenueScore * 0.25 +
    skillScore * 0.2 +
    metrics.attendanceScore * 0.15 +
    metrics.teamworkScore * 0.2;

  // Identify strengths (> 80)
  const strengths: string[] = [];
  if (contractScore > 80) strengths.push('Contract Completion');
  if (revenueScore > 80) strengths.push('Revenue Generation');
  if (skillScore > 80) strengths.push('Skill Development');
  if (metrics.attendanceScore > 80) strengths.push('Attendance');
  if (metrics.teamworkScore > 80) strengths.push('Teamwork');

  // Identify improvement areas (< 60)
  const areasForImprovement: string[] = [];
  if (contractScore < 60) areasForImprovement.push('Contract Completion');
  if (revenueScore < 60) areasForImprovement.push('Revenue Generation');
  if (skillScore < 60) areasForImprovement.push('Skill Development');
  if (metrics.attendanceScore < 60) areasForImprovement.push('Attendance');
  if (metrics.teamworkScore < 60) areasForImprovement.push('Teamwork');

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    breakdown: {
      contractCompletion: Math.round(contractScore * 10) / 10,
      revenueGeneration: Math.round(revenueScore * 10) / 10,
      skillGrowth: Math.round(skillScore * 10) / 10,
      attendance: Math.round(metrics.attendanceScore * 10) / 10,
      teamwork: Math.round(metrics.teamworkScore * 10) / 10,
    },
    strengths,
    areasForImprovement,
  };
}

/**
 * Convert performance score to star rating (1-5)
 * 
 * @param {number} score - Performance score (0-100)
 * @returns {number} Star rating (1-5)
 */
function scoreToRating(score: number): number {
  if (score >= 90) return 5.0;
  if (score >= 80) return 4.5;
  if (score >= 70) return 4.0;
  if (score >= 60) return 3.5;
  if (score >= 50) return 3.0;
  if (score >= 40) return 2.5;
  if (score >= 30) return 2.0;
  if (score >= 20) return 1.5;
  return 1.0;
}

/**
 * Calculate recommended raise based on performance and market rates
 * 
 * @param {Object} params - Raise calculation parameters
 * @returns {Object} Raise recommendation
 */
function calculateRaiseRecommendation(params: {
  currentSalary: number;
  performanceRating: number;
  marketSalary: number;
  lastRaiseDays: number;
  companyPerformance: number;
}): {
  recommendedRaise: number;
  raisePercentage: number;
  reasoning: string;
} {
  let raisePercentage = 0;

  // Base raise by performance rating
  if (params.performanceRating >= 4.5) {
    raisePercentage = 15; // Exceptional: 15-20%
  } else if (params.performanceRating >= 4.0) {
    raisePercentage = 10; // Excellent: 10-15%
  } else if (params.performanceRating >= 3.5) {
    raisePercentage = 6; // Good: 6-10%
  } else if (params.performanceRating >= 3.0) {
    raisePercentage = 3; // Satisfactory: 3-5%
  } else if (params.performanceRating >= 2.5) {
    raisePercentage = 1; // Below Average: 0-2%
  } else {
    raisePercentage = 0; // Poor: No raise
  }

  // Adjust for market competitiveness
  const salaryRatio = params.currentSalary / params.marketSalary;
  if (salaryRatio < 0.85) {
    // Severely underpaid: +5%
    raisePercentage += 5;
  } else if (salaryRatio < 0.95) {
    // Underpaid: +3%
    raisePercentage += 3;
  } else if (salaryRatio > 1.15) {
    // Overpaid: -3%
    raisePercentage -= 3;
  }

  // Adjust for time since last raise
  const yearsSinceRaise = params.lastRaiseDays / 365;
  if (yearsSinceRaise > 2) {
    // Long overdue: +3%
    raisePercentage += 3;
  } else if (yearsSinceRaise > 1.5) {
    // Overdue: +2%
    raisePercentage += 2;
  }

  // Adjust for company performance
  if (params.companyPerformance < 0.7) {
    // Struggling company: -2%
    raisePercentage -= 2;
  } else if (params.companyPerformance > 1.3) {
    // Thriving company: +2%
    raisePercentage += 2;
  }

  // Cap raise percentage (0-25%)
  raisePercentage = Math.max(0, Math.min(25, raisePercentage));

  const recommendedRaise = Math.round(params.currentSalary * (raisePercentage / 100));

  // Generate reasoning
  let reasoning = '';
  if (raisePercentage === 0) {
    reasoning = 'Performance does not warrant a raise at this time';
  } else if (raisePercentage < 5) {
    reasoning = 'Modest raise reflecting satisfactory performance';
  } else if (raisePercentage < 10) {
    reasoning = 'Competitive raise for good performance';
  } else if (raisePercentage < 15) {
    reasoning = 'Strong raise for excellent performance';
  } else {
    reasoning = 'Exceptional raise for outstanding performance and market adjustment';
  }

  return {
    recommendedRaise,
    raisePercentage: Math.round(raisePercentage * 10) / 10,
    reasoning,
  };
}

/**
 * Calculate recommended bonus based on revenue contribution
 * 
 * @param {Object} params - Bonus calculation parameters
 * @returns {Object} Bonus recommendation
 */
function calculateBonusRecommendation(params: {
  salary: number;
  revenueGenerated: number;
  performanceRating: number;
  companyProfitMargin: number;
}): {
  recommendedBonus: number;
  bonusPercentage: number;
  reasoning: string;
} {
  let bonusPercentage = 0;

  // Base bonus by performance rating
  if (params.performanceRating >= 4.5) {
    bonusPercentage = 40; // Exceptional: 40-50%
  } else if (params.performanceRating >= 4.0) {
    bonusPercentage = 25; // Excellent: 25-35%
  } else if (params.performanceRating >= 3.5) {
    bonusPercentage = 15; // Good: 15-20%
  } else if (params.performanceRating >= 3.0) {
    bonusPercentage = 10; // Satisfactory: 10-12%
  } else if (params.performanceRating >= 2.5) {
    bonusPercentage = 5; // Below Average: 5%
  } else {
    bonusPercentage = 0; // Poor: No bonus
  }

  // Adjust for revenue contribution
  const revenueRatio = params.revenueGenerated / params.salary;
  if (revenueRatio > 10) {
    // Exceptional revenue: +15%
    bonusPercentage += 15;
  } else if (revenueRatio > 5) {
    // Strong revenue: +10%
    bonusPercentage += 10;
  } else if (revenueRatio > 3) {
    // Good revenue: +5%
    bonusPercentage += 5;
  } else if (revenueRatio < 1) {
    // Weak revenue: -5%
    bonusPercentage -= 5;
  }

  // Adjust for company profitability
  if (params.companyProfitMargin < 0.1) {
    // Low profit: -10%
    bonusPercentage -= 10;
  } else if (params.companyProfitMargin > 0.3) {
    // High profit: +10%
    bonusPercentage += 10;
  }

  // Cap bonus percentage (0-60%)
  bonusPercentage = Math.max(0, Math.min(60, bonusPercentage));

  const recommendedBonus = Math.round(params.salary * (bonusPercentage / 100));

  // Generate reasoning
  let reasoning = '';
  if (bonusPercentage === 0) {
    reasoning = 'Performance does not warrant a bonus';
  } else if (bonusPercentage < 15) {
    reasoning = 'Modest bonus for satisfactory performance';
  } else if (bonusPercentage < 30) {
    reasoning = 'Strong bonus for excellent performance';
  } else {
    reasoning = 'Exceptional bonus for outstanding revenue contribution';
  }

  return {
    recommendedBonus,
    bonusPercentage: Math.round(bonusPercentage * 10) / 10,
    reasoning,
  };
}

/**
 * POST /api/employees/[id]/review
 * Conduct employee performance review
 * 
 * @param {NextRequest} req - Request with review data
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Review results and compensation changes
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authenticate user (TODO: Implement proper authentication)
    const session = { user: { id: 'dev-user-id' } }; // Stub for development
    // const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const {
      contractsCompleted = 0,
      revenueGenerated = 0,
      attendanceScore = 75,
      teamworkScore = 75,
      reviewerNotes = '',
      applyRaise = true,
      applyBonus = true,
    } = body;

    // 3. Connect to database
    await dbConnect();

    // 4. Fetch employee
    const { id } = await context.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 5. Verify employee is active
    if (employee.firedAt) {
      return NextResponse.json(
        { success: false, error: 'Cannot review fired employee' },
        { status: 400 }
      );
    }

    // 6. Verify ownership
    const company = await Company.findOne({
      _id: employee.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 7. Calculate skill growth since last review
    const lastReview = employee.performanceHistory[employee.performanceHistory.length - 1];
    const previousAverageSkill = lastReview?.rating ? (lastReview.rating * 20) : (employee.averageSkill - 5);
    const skillGrowth = employee.averageSkill - previousAverageSkill;

    // 8. Calculate expected performance metrics
    const monthsSinceReview = lastReview
      ? Math.max(1, (Date.now() - new Date(lastReview.date).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 6;

    const expectedContracts = Math.max(1, Math.round(monthsSinceReview * 2)); // ~2 contracts/month
    const expectedRevenue = employee.salary * 3 * (monthsSinceReview / 12); // 3x salary annually

    // 9. Calculate performance score
    const performanceAnalysis = calculatePerformanceScore({
      contractsCompleted,
      revenueGenerated,
      skillGrowth,
      attendanceScore,
      teamworkScore,
      expectedContracts,
      expectedRevenue,
    });

    const performanceRating = scoreToRating(performanceAnalysis.overallScore);

    // 10. Calculate market salary
    const marketSalary = getMarketSalary(
      employee.role,
      employee.experience || 0,
      company.industry || 'Technology'
    );

    // 11. Calculate days since last raise
    const lastRaiseDate = employee.lastRaise || employee.hiredAt;
    const daysSinceRaise = Math.max(
      0,
      (Date.now() - new Date(lastRaiseDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // 12. Calculate company performance (revenue vs expenses ratio)
    const companyPerformance = company.revenue > 0 ? company.revenue / Math.max(1, company.expenses) : 0.5;
    const companyProfitMargin = company.revenue > 0 ? (company.revenue - company.expenses) / company.revenue : 0;

    // 13. Calculate raise recommendation
    const raiseRecommendation = calculateRaiseRecommendation({
      currentSalary: employee.salary,
      performanceRating,
      marketSalary,
      lastRaiseDays: daysSinceRaise,
      companyPerformance,
    });

    // 14. Calculate bonus recommendation
    const bonusRecommendation = calculateBonusRecommendation({
      salary: employee.salary,
      revenueGenerated,
      performanceRating,
      companyProfitMargin,
    });

    // 15. Validate company budget
    const totalCompensationCost = raiseRecommendation.recommendedRaise + bonusRecommendation.recommendedBonus;
    const budgetSufficient = company.cash >= totalCompensationCost;

    let raiseApplied = false;
    let bonusApplied = false;
    let actualRaise = 0;
    let actualBonus = 0;

    if (applyRaise && raiseRecommendation.recommendedRaise > 0 && company.cash >= raiseRecommendation.recommendedRaise) {
      actualRaise = raiseRecommendation.recommendedRaise;
      raiseApplied = true;
    }

    if (applyBonus && bonusRecommendation.recommendedBonus > 0 && company.cash >= (actualRaise + bonusRecommendation.recommendedBonus)) {
      actualBonus = bonusRecommendation.recommendedBonus;
      bonusApplied = true;
    }

    // 16. Create review record
    const reviewRecord = {
      date: new Date(),
      rating: performanceRating,
      performanceScore: performanceAnalysis.overallScore,
      breakdown: performanceAnalysis.breakdown,
      strengths: performanceAnalysis.strengths,
      areasForImprovement: performanceAnalysis.areasForImprovement,
      contractsCompleted,
      revenueGenerated,
      skillGrowth,
      attendanceScore,
      teamworkScore,
      raiseGiven: actualRaise,
      bonusGiven: actualBonus,
      reviewerNotes,
      reviewerId: session.user.id,
      averageSkill: employee.averageSkill,
    };

    // 17. Calculate next review date (6-12 months based on performance)
    const nextReviewDate = new Date();
    if (performanceRating < 2.5) {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); // Poor: 6 months
    } else if (performanceRating < 3.5) {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 9); // Average: 9 months
    } else {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 12); // Good: 12 months
    }

    // 18. Calculate morale/satisfaction changes
    const moraleChange =
      performanceRating >= 4.0 ? 10 : performanceRating >= 3.0 ? 5 : performanceRating >= 2.5 ? 0 : -10;
    const satisfactionChange =
      raiseApplied && bonusApplied ? 15 : raiseApplied || bonusApplied ? 8 : raiseRecommendation.recommendedRaise > 0 ? -10 : 0;

    // 19. Update employee
    const updateData: any = {
      $push: { performanceHistory: reviewRecord },
      $set: {
        performanceRating,
        nextReviewDate,
        contractsCompleted: employee.contractsCompleted + contractsCompleted,
        revenueGenerated: employee.revenueGenerated + revenueGenerated,
      },
      $inc: {
        morale: moraleChange,
        satisfaction: satisfactionChange,
      },
    };

    if (raiseApplied) {
      updateData.$inc.salary = actualRaise;
      updateData.$set.lastRaise = new Date();
    }

    if (bonusApplied) {
      updateData.$inc.bonus = actualBonus;
    }

    await employee.updateOne(updateData);

    // 20. Debit company for compensation changes
    if (raiseApplied || bonusApplied) {
      await company.updateOne({
        $inc: {
          cash: -(actualRaise + actualBonus),
          expenses: actualRaise + actualBonus,
        },
      });

      // 21. Create transaction for raise
      if (raiseApplied) {
        await Transaction.create({
          type: 'expense',
          amount: actualRaise,
          description: `Salary raise for ${employee.fullName} (${raiseRecommendation.raisePercentage}%)`,
          company: company._id,
          relatedUser: session.user.id,
          metadata: {
            employeeId: (employee._id as any).toString(),
            employeeName: employee.fullName,
            oldSalary: employee.salary,
            newSalary: employee.salary + actualRaise,
            raisePercentage: raiseRecommendation.raisePercentage,
            performanceRating,
          },
        });
      }

      // 22. Create transaction for bonus
      if (bonusApplied) {
        await Transaction.create({
          type: 'expense',
          amount: actualBonus,
          description: `Performance bonus for ${employee.fullName}`,
          company: company._id,
          relatedUser: session.user.id,
          metadata: {
            employeeId: (employee._id as any).toString(),
            employeeName: employee.fullName,
            bonusPercentage: bonusRecommendation.bonusPercentage,
            performanceRating,
            revenueGenerated,
          },
        });
      }
    }

    // 23. Fetch updated employee
    const updatedEmployee = await Employee.findById(id);

    // 24. Return response
    return NextResponse.json(
      {
        success: true,
        message: `Performance review completed for ${employee.fullName}`,
        review: {
          overallRating: performanceRating,
          performanceScore: performanceAnalysis.overallScore,
          breakdown: performanceAnalysis.breakdown,
          strengths: performanceAnalysis.strengths,
          areasForImprovement: performanceAnalysis.areasForImprovement,
          recommendedRaise: raiseRecommendation.recommendedRaise,
          recommendedRaisePercentage: raiseRecommendation.raisePercentage,
          raiseReasoning: raiseRecommendation.reasoning,
          recommendedBonus: bonusRecommendation.recommendedBonus,
          recommendedBonusPercentage: bonusRecommendation.bonusPercentage,
          bonusReasoning: bonusRecommendation.reasoning,
          raiseApplied,
          bonusApplied,
          actualRaise,
          actualBonus,
          budgetSufficient,
          nextReviewDate: nextReviewDate.toISOString(),
        },
        employee: {
          id: (updatedEmployee!._id as any).toString(),
          fullName: updatedEmployee!.fullName,
          salary: updatedEmployee!.salary,
          bonus: updatedEmployee!.bonus,
          performanceRating: updatedEmployee!.performanceRating,
          morale: updatedEmployee!.morale,
          satisfaction: updatedEmployee!.satisfaction,
          nextReviewDate: updatedEmployee!.nextReviewDate.toISOString(),
        },
        companyBudget: {
          cashBefore: company.cash,
          cashAfter: company.cash - (actualRaise + actualBonus),
          totalCost: actualRaise + actualBonus,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Performance review error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/employees/[id]/review
 * Get employee's review history and next review information
 * 
 * @param {NextRequest} req - Request object
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Review history and metrics
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authenticate user (TODO: Implement proper authentication)
    const session = { user: { id: 'dev-user-id' } }; // Stub for development
    // const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Connect to database
    await dbConnect();

    // 3. Fetch employee
    const { id } = await context.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 4. Verify ownership
    const company = await Company.findOne({
      _id: employee.company,
      owner: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 5. Get market salary
    const marketSalary = getMarketSalary(
      employee.role,
      employee.experience || 0,
      company.industry || 'Technology'
    );

    // 6. Calculate days until next review
    const daysUntilReview = employee.nextReviewDate
      ? Math.max(0, Math.round((new Date(employee.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    const reviewOverdue = employee.nextReviewDate && new Date(employee.nextReviewDate) < new Date();

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        employee: {
          id: (employee._id as any).toString(),
          fullName: employee.fullName,
          role: employee.role,
          salary: employee.salary,
          marketSalary,
          salaryCompetitiveness: Math.round((employee.salary / marketSalary) * 100),
          performanceRating: employee.performanceRating,
          nextReviewDate: employee.nextReviewDate?.toISOString(),
          daysUntilReview,
          reviewOverdue,
          contractsCompleted: employee.contractsCompleted,
          revenueGenerated: employee.revenueGenerated,
        },
        reviewHistory: employee.performanceHistory.slice(-10).reverse(), // Last 10 reviews
        companyBudget: company.cash,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Review history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
