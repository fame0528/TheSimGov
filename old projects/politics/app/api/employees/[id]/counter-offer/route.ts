/**
 * @file app/api/employees/[id]/counter-offer/route.ts
 * @description API endpoint for employee retention counter-offers
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * POST endpoint for making counter-offers to retain employees who have received
 * external job offers or are at high risk of leaving. Evaluates retention risk,
 * calculates optimal counter-offer amount, validates company budget, and updates
 * employee compensation/loyalty. Integrates with employeeRetention utilities for
 * market analysis and Company/Transaction models for financial tracking.
 * 
 * ENDPOINT: POST /api/employees/[id]/counter-offer
 * 
 * REQUEST BODY:
 * ```json
 * {
 *   "externalOfferAmount": number,    // Competing offer salary
 *   "externalOfferBonus": number,     // Competing offer bonus
 *   "externalOfferEquity": number,    // Competing offer equity %
 *   "externalCompanyName": "string",  // Competing company
 *   "externalCompanyIndustry": "string",
 *   "externalOfferRole": "string",    // Role in competing offer
 *   "urgency": "Low" | "Medium" | "High", // Response urgency
 *   "applyCounterOffer": boolean      // Auto-apply if accepted
 * }
 * ```
 * 
 * RESPONSE (200 - Success):
 * ```json
 * {
 *   "success": true,
 *   "message": "Counter-offer evaluation complete",
 *   "counterOffer": {
 *     "recommendedSalary": number,
 *     "recommendedBonus": number,
 *     "recommendedEquity": number,
 *     "totalValue": number,
 *     "acceptanceProbability": number,  // 0-100%
 *     "effectiveness": "Poor" | "Fair" | "Good" | "Excellent",
 *     "reasoning": "string"
 *   },
 *   "retentionAnalysis": {
 *     "retentionRisk": number,          // 0-100
 *     "riskLevel": "string",
 *     "factorsIncreasingRisk": ["string"],
 *     "factorsDecreasingRisk": ["string"]
 *   },
 *   "financialImpact": {
 *     "counterOfferCost": number,
 *     "replacementCost": number,        // ~1.8x salary
 *     "costSavings": number,
 *     "budgetAvailable": number,
 *     "canAfford": boolean
 *   },
 *   "outcome": {
 *     "applied": boolean,
 *     "accepted": boolean,              // Simulated based on probability
 *     "newSalary": number,
 *     "newBonus": number,
 *     "newEquity": number
 *   }
 * }
 * ```
 * 
 * BUSINESS LOGIC:
 * 1. Validate employee exists and is active
 * 2. Evaluate current retention risk using employeeRetention utilities
 * 3. Calculate optimal counter-offer (typically 5-10% above external offer)
 * 4. Estimate acceptance probability based on:
 *    - Counter-offer competitiveness (40%)
 *    - Employee loyalty/satisfaction (30%)
 *    - Career growth opportunities (20%)
 *    - Company reputation (10%)
 * 5. Calculate replacement cost (recruiting, hiring, training, lost productivity)
 * 6. Validate company budget for counter-offer
 * 7. Simulate acceptance/rejection based on probability
 * 8. Apply counter-offer if requested and accepted
 * 9. Update employee loyalty/satisfaction
 * 10. Track counter-offer in employee history
 * 11. Create expense transactions
 * 12. Increment counter-offer fatigue (multiple counter-offers reduce effectiveness)
 * 
 * IMPLEMENTATION NOTES:
 * - Replacement cost = 1.5-2.0x annual salary (recruiting 15%, training 10%, lost productivity)
 * - Counter-offers should be 5-10% above external offer to be competitive
 * - Multiple counter-offers increase fatigue and reduce future acceptance probability
 * - High performers (rating > 4.0) warrant more aggressive counter-offers
 * - Poor performers (rating < 2.5) may not be worth retaining
 * - Counter-offers boost short-term loyalty but don't fix root dissatisfaction
 * - Accepted counter-offers trigger 6-month retention monitoring period
 * - Equity grants vest over 4 years to encourage long-term retention
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import Company from '@/lib/db/models/Company';
import Transaction from '@/lib/db/models/Transaction';
// TODO: Implement proper authentication
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth/authOptions';
import {
  calculateRetentionRisk,
  evaluateCounterOffer,
  getMarketSalary,
  getRetentionStatus,
} from '@/lib/utils/employeeRetention';

/**
 * Calculate replacement cost for losing an employee
 * 
 * @param {Object} params - Replacement cost parameters
 * @returns {Object} Detailed cost breakdown
 */
function calculateReplacementCost(params: {
  salary: number;
  role: string;
  performanceRating: number;
  yearsOfExperience: number;
}): {
  totalCost: number;
  breakdown: {
    recruitingFees: number;
    onboardingCost: number;
    trainingCost: number;
    lostProductivity: number;
    knowledgeLoss: number;
  };
} {
  const annualSalary = params.salary;

  // Recruiting fees (15% of salary for external hire)
  const recruitingFees = Math.round(annualSalary * 0.15);

  // Onboarding cost (1-2 months of salary equivalent in HR/admin time)
  const onboardingCost = Math.round(annualSalary * 0.12);

  // Training cost (2-3 months for full productivity)
  const trainingCost = Math.round(annualSalary * 0.2);

  // Lost productivity during vacancy (2-4 months at reduced output)
  const vacancyMonths = 3;
  const lostProductivity = Math.round((annualSalary / 12) * vacancyMonths * 0.7);

  // Knowledge/relationship loss (higher for senior roles)
  const experienceMultiplier = Math.min(2.0, 1 + params.yearsOfExperience / 20);
  const knowledgeLoss = Math.round(annualSalary * 0.15 * experienceMultiplier);

  const totalCost =
    recruitingFees + onboardingCost + trainingCost + lostProductivity + knowledgeLoss;

  return {
    totalCost,
    breakdown: {
      recruitingFees,
      onboardingCost,
      trainingCost,
      lostProductivity,
      knowledgeLoss,
    },
  };
}

/**
 * Simulate counter-offer acceptance based on probability
 * 
 * @param {number} probability - Acceptance probability (0-100)
 * @returns {boolean} Accepted or rejected
 */
function simulateAcceptance(probability: number): boolean {
  return Math.random() * 100 <= probability;
}

/**
 * POST /api/employees/[id]/counter-offer
 * Make retention counter-offer to employee
 * 
 * @param {NextRequest} req - Request with external offer details
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Counter-offer evaluation and outcome
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
      externalOfferAmount,
      externalOfferBonus = 0,
      externalOfferEquity = 0,
      externalCompanyName = 'Unknown Company',
      externalCompanyIndustry = 'Technology',
      externalOfferRole,
      // urgency = 'Medium', // Not currently used
      applyCounterOffer = true,
    } = body;

    if (!externalOfferAmount) {
      return NextResponse.json(
        { success: false, error: 'External offer amount is required' },
        { status: 400 }
      );
    }

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
        { success: false, error: 'Cannot make counter-offer to fired employee' },
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

    // 7. Calculate retention risk
    const marketSalary = getMarketSalary(
      employee.role,
      employee.yearsOfExperience,
      company.industry
    );

    const retentionRiskScore = calculateRetentionRisk({
      satisfaction: employee.satisfaction,
      loyalty: employee.loyalty,
      externalOffers: 1,
      marketDemand: company.industry === 'Technology' ? 85 : 65,
    });

    const retentionStatus = getRetentionStatus(retentionRiskScore);

    // 8. Identify risk factors
    const factorsIncreasingRisk: string[] = [];
    const factorsDecreasingRisk: string[] = [];

    if (employee.satisfaction < 50) factorsIncreasingRisk.push('Low satisfaction');
    if (employee.loyalty < 50) factorsIncreasingRisk.push('Low loyalty');
    if (employee.salary < marketSalary * 0.9) factorsIncreasingRisk.push('Below-market salary');
    if (employee.counterOfferCount > 2) factorsIncreasingRisk.push('Multiple previous counter-offers');
    if (employee.performanceRating >= 4.0) factorsIncreasingRisk.push('High performer (valuable to competitors)');
    if (externalOfferAmount > employee.salary * 1.2) factorsIncreasingRisk.push('Significantly higher external offer');

    if (employee.satisfaction >= 70) factorsDecreasingRisk.push('High satisfaction');
    if (employee.loyalty >= 70) factorsDecreasingRisk.push('High loyalty');
    if (employee.yearsOfExperience > 3) factorsDecreasingRisk.push('Long tenure with company');
    if (company.reputation >= 70) factorsDecreasingRisk.push('Strong company reputation');
    if (employee.morale >= 70) factorsDecreasingRisk.push('High morale');

    // 9. Evaluate counter-offer using utility function
    const counterOfferEvaluation = evaluateCounterOffer({
      currentSalary: employee.salary,
      offerSalary: externalOfferAmount,
      currentBonus: employee.bonus,
      offerBonus: externalOfferBonus,
      currentEquity: employee.equity,
      offerEquity: externalOfferEquity,
      employeeRetentionRisk: retentionRiskScore,
      employeeLoyalty: employee.loyalty,
      counterOfferCount: employee.counterOfferCount,
    });

    // 10. Calculate replacement cost
    const replacementCost = calculateReplacementCost({
      salary: employee.salary,
      role: employee.role,
      performanceRating: employee.performanceRating,
      yearsOfExperience: employee.yearsOfExperience,
    });

    // 11. Calculate counter-offer financial impact
    const counterOfferCost =
      counterOfferEvaluation.recommendedSalary - employee.salary +
      counterOfferEvaluation.recommendedBonus +
      (counterOfferEvaluation.recommendedEquity || 0) * 10000; // Equity valued roughly

    const costSavings = replacementCost.totalCost - counterOfferCost;
    const canAfford = company.cash >= counterOfferCost;

    // 12. Simulate acceptance
    let accepted = false;
    let applied = false;
    let newSalary = employee.salary;
    let newBonus = employee.bonus;
    let newEquity = employee.equity;

    if (applyCounterOffer && canAfford) {
      accepted = simulateAcceptance(counterOfferEvaluation.acceptanceProbability);
      applied = true;

      if (accepted) {
        newSalary = counterOfferEvaluation.recommendedSalary;
        newBonus = counterOfferEvaluation.recommendedBonus;
        newEquity = counterOfferEvaluation.recommendedEquity || employee.equity;

        // 13. Update employee
        await employee.updateOne({
          $set: {
            salary: newSalary,
            bonus: newBonus,
            equity: newEquity,
            lastRaise: new Date(),
          },
          $inc: {
            counterOfferCount: 1,
            loyalty: 15, // Short-term loyalty boost
            satisfaction: 10, // Short-term satisfaction boost
            morale: 5,
          },
          $push: {
            performanceHistory: {
              date: new Date(),
              rating: employee.performanceRating,
              raiseGiven: newSalary - employee.salary,
              bonusGiven: newBonus - employee.bonus,
              reviewerNotes: `Counter-offer accepted: Competing offer from ${externalCompanyName} (${externalOfferAmount})`,
              reviewerId: session.user.id,
            },
          },
        });

        // 14. Debit company cash
        const totalCost = newSalary - employee.salary + newBonus - employee.bonus;
        await company.updateOne({
          $inc: {
            cash: -totalCost,
            expenses: totalCost,
          },
        });

        // 15. Create transaction for salary increase
        if (newSalary > employee.salary) {
          await Transaction.create({
            type: 'expense',
            amount: newSalary - employee.salary,
            description: `Counter-offer salary increase for ${employee.fullName}`,
            company: company._id as any,
            relatedUser: session.user.id,
            metadata: {
              employeeId: (employee._id as any).toString(),
              employeeName: employee.fullName,
              oldSalary: employee.salary,
              newSalary,
              externalOffer: externalOfferAmount,
              externalCompany: externalCompanyName,
              acceptanceProbability: counterOfferEvaluation.acceptanceProbability,
            },
          });
        }

        // 16. Create transaction for bonus
        if (newBonus > employee.bonus) {
          await Transaction.create({
            type: 'expense',
            amount: newBonus - employee.bonus,
            description: `Counter-offer bonus for ${employee.fullName}`,
            company: company._id as any,
            relatedUser: session.user.id,
            metadata: {
              employeeId: (employee._id as any).toString(),
              employeeName: employee.fullName,
              externalOffer: externalOfferBonus,
              externalCompany: externalCompanyName,
            },
          });
        }
      } else {
        // Counter-offer rejected - employee will likely leave
        // Update loyalty/morale negatively
        await employee.updateOne({
          $inc: {
            counterOfferCount: 1,
            loyalty: -10,
            satisfaction: -5,
            morale: -10,
          },
        });
      }
    }

    // 17. Return response
    return NextResponse.json(
      {
        success: true,
        message: applied
          ? accepted
            ? `Counter-offer accepted by ${employee.fullName}`
            : `Counter-offer rejected by ${employee.fullName}`
          : 'Counter-offer evaluation complete (not applied)',
        counterOffer: {
          recommendedSalary: counterOfferEvaluation.recommendedSalary,
          recommendedBonus: counterOfferEvaluation.recommendedBonus,
          recommendedEquity: counterOfferEvaluation.recommendedEquity || 0,
          totalValue:
            counterOfferEvaluation.recommendedSalary +
            counterOfferEvaluation.recommendedBonus +
            (counterOfferEvaluation.recommendedEquity || 0) * 10000,
          acceptanceProbability: Math.round(counterOfferEvaluation.acceptanceProbability),
          effectiveness: counterOfferEvaluation.effectiveness,
          reasoning: counterOfferEvaluation.reasoning,
        },
        retentionAnalysis: {
          retentionRisk: Math.round(retentionRiskScore),
          riskLevel: retentionStatus.level,
          riskDescription: retentionStatus.description,
          factorsIncreasingRisk,
          factorsDecreasingRisk,
        },
        financialImpact: {
          counterOfferCost: Math.round(counterOfferCost),
          replacementCost: replacementCost.totalCost,
          replacementBreakdown: replacementCost.breakdown,
          costSavings: Math.round(costSavings),
          budgetAvailable: company.cash,
          canAfford,
        },
        externalOffer: {
          company: externalCompanyName,
          industry: externalCompanyIndustry,
          role: externalOfferRole || employee.role,
          salary: externalOfferAmount,
          bonus: externalOfferBonus,
          equity: externalOfferEquity,
          totalValue: externalOfferAmount + externalOfferBonus + externalOfferEquity * 10000,
        },
        outcome: {
          applied,
          accepted,
          newSalary,
          newBonus,
          newEquity,
          salaryIncrease: newSalary - employee.salary,
          bonusIncrease: newBonus - employee.bonus,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Counter-offer error:', error);
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
 * GET /api/employees/[id]/counter-offer
 * Get employee's counter-offer history and retention analysis
 * 
 * @param {NextRequest} req - Request object
 * @param {Object} context - Route context with employee ID
 * @returns {NextResponse} Retention risk and counter-offer history
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

    // 5. Calculate retention metrics
    const marketSalary = getMarketSalary(
      employee.role,
      employee.yearsOfExperience,
      company.industry
    );

    const retentionRiskScore = calculateRetentionRisk({
      satisfaction: employee.satisfaction,
      loyalty: employee.loyalty,
      externalOffers: 0,
      marketDemand: company.industry === 'Technology' ? 85 : 65,
    });

    const retentionStatus = getRetentionStatus(retentionRiskScore);

    const replacementCost = calculateReplacementCost({
      salary: employee.salary,
      role: employee.role,
      performanceRating: employee.performanceRating,
      yearsOfExperience: employee.yearsOfExperience,
    });

    // 6. Get counter-offer history from performance history
    const counterOfferHistory = employee.performanceHistory
      .filter((review) => review.feedback?.includes('Counter-offer'))
      .slice(-5)
      .reverse();

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
          bonus: employee.bonus,
          equity: employee.equity,
          satisfaction: employee.satisfaction,
          loyalty: employee.loyalty,
          morale: employee.morale,
          performanceRating: employee.performanceRating,
          counterOfferCount: employee.counterOfferCount,
        },
        retentionAnalysis: {
          retentionRisk: Math.round(retentionRiskScore),
          riskLevel: retentionStatus.level,
          riskDescription: retentionStatus.description,
          recommendedAction: retentionStatus.action,
        },
        financialAnalysis: {
          currentCompensation: employee.salary + employee.bonus,
          marketCompensation: Math.round(marketSalary * 1.15), // Includes typical bonus
          replacementCost: replacementCost.totalCost,
          replacementBreakdown: replacementCost.breakdown,
        },
        counterOfferHistory,
        companyBudget: company.cash,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Counter-offer history error:', error);
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
