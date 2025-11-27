/**
 * @file app/api/ai/employees/[id]/offer/route.ts
 * @description API endpoint for making salary offers and handling counter-offers
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Handles salary offer submission to candidates and employees, including counter-offer
 * mechanics for retention. Uses calculateCompetitiveSalary utility to validate offers
 * against market rates. Tracks offer history and updates employee records when offers
 * are accepted.
 * 
 * ENDPOINTS:
 * POST /api/ai/employees/:id/offer
 * 
 * REQUEST BODY:
 * {
 *   offerType: "hire" | "retention",
 *   baseSalary: 250000,
 *   equity: 0.5,                    // Optional, % stock options (0-10)
 *   computeBudget: 3000,             // Optional, monthly $ allocation
 *   bonus: 15,                       // Optional, annual bonus % (0-100)
 *   startDate: "2025-12-01",         // Optional, ISO date string
 *   message: "Excited to have you!" // Optional, personal message
 * }
 * 
 * RESPONSE FORMAT (Hire Offer):
 * {
 *   success: true,
 *   offerAccepted: true,             // Candidate decision
 *   employee: {                       // If accepted, created Employee document
 *     _id: "...",
 *     firstName: "Alice",
 *     lastName: "Chen",
 *     role: "MLEngineer",
 *     salary: 250000,
 *     equity: 0.5,
 *     hasPhD: true,
 *     // ... full employee record
 *   },
 *   decision: {
 *     accepted: true,
 *     reason: "Offer meets expectations and aligns with career goals"
 *   },
 *   marketAnalysis: {
 *     offerCompetitiveness: "AboveMarket",
 *     marketMedian: 220000,
 *     percentAboveMarket: 13.6
 *   }
 * }
 * 
 * RESPONSE FORMAT (Retention Offer):
 * {
 *   success: true,
 *   offerAccepted: true,             // Employee retention decision
 *   employee: {                       // Updated employee record
 *     _id: "...",
 *     salary: 280000,                 // Updated
 *     counterOfferCount: 2,           // Incremented
 *     retentionRisk: 25,              // Recalculated (lowered)
 *     // ... full employee record
 *   },
 *   decision: {
 *     accepted: true,
 *     reason: "Salary adjustment addresses retention concerns"
 *   }
 * }
 * 
 * DECISION LOGIC (Hire Offers):
 * - Offer >= expectedSalary + 10%: 95% acceptance
 * - Offer >= expectedSalary: 75% acceptance
 * - Offer < expectedSalary: 30% acceptance (likely to reject)
 * - BelowMarket competitiveness: -20% acceptance penalty
 * - TopTier competitiveness: +10% acceptance bonus
 * - Stock options: +5% per 1% equity offered
 * 
 * DECISION LOGIC (Retention Offers):
 * - Counter-offer closes salary gap: Acceptance based on gap closure %
 * - 100% gap closure: 90% acceptance
 * - 70-99% gap closure: 70% acceptance
 * - 50-69% gap closure: 45% acceptance
 * - <50% gap closure: 20% acceptance (likely to leave)
 * 
 * ERROR RESPONSES:
 * - 400: Invalid request body (missing fields, invalid values)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (user does not own company or employee)
 * - 404: Employee/candidate not found
 * - 500: Server error (database failure, utility error)
 * 
 * IMPLEMENTATION NOTES:
 * - Hire offers create Employee record if accepted (candidate → employee)
 * - Retention offers update existing Employee salary and reset retentionRisk
 * - All offers validated against market rates using calculateCompetitiveSalary
 * - Decision is probabilistic with market competitiveness and equity factors
 * - Counter-offer count incremented on retention offers (tracks poaching resistance)
 * - Failed offers do NOT create database records (candidates remain in pool)
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
 * Offer request body interface
 */
interface OfferRequest {
  offerType: 'hire' | 'retention';
  baseSalary: number;
  equity?: number;          // Stock options % (0-10)
  computeBudget?: number;   // Monthly $ (0-10000)
  bonus?: number;           // Annual bonus % (0-100)
  startDate?: string;       // ISO date string
  message?: string;         // Personal message
}

/**
 * Candidate profile (from generateCandidatePool, passed in request for hire offers)
 * Must be included in hire offers so we can create Employee record if accepted
 */
interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AIRole;
  hasPhD: boolean;
  university?: string;
  publications: number;
  hIndex: number;
  researchAbility: number;
  codingSkill: number;
  domainExpertise: string;
  technical: number;
  analytical: number;
  communication: number;
  creativity: number;
  yearsExperience: number;
  currentSalary: number;
  expectedSalary: number;
  stockPreference: number;
  loyalty: number;
  learningRate: number;
  productivity: number;
  competingOffers: number;
  interestLevel: number;
  recruitmentDifficulty: number;
}

/**
 * POST /api/ai/employees/:id/offer
 * Make salary offer to candidate (hire) or employee (retention)
 */
export async function POST(
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
    const body = await req.json() as OfferRequest & { candidate?: CandidateProfile };
    const {
      offerType,
      baseSalary,
      equity = 0,
      computeBudget = 0,
      bonus = 10,
      // startDate, // Future use: scheduled start date
      // message, // Future use: personal message to candidate
      candidate,
    } = body;

    // 3. Validate offer type
    if (!offerType || !['hire', 'retention'].includes(offerType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid offer type. Must be "hire" or "retention".' },
        { status: 400 }
      );
    }

    // 4. Validate salary
    if (!baseSalary || baseSalary < 20000 || baseSalary > 5000000) {
      return NextResponse.json(
        { success: false, error: 'Base salary must be between $20,000 and $5,000,000.' },
        { status: 400 }
      );
    }

    // 5. Validate optional fields
    if (equity !== undefined && (equity < 0 || equity > 10)) {
      return NextResponse.json(
        { success: false, error: 'Equity must be between 0% and 10%.' },
        { status: 400 }
      );
    }

    if (computeBudget !== undefined && (computeBudget < 0 || computeBudget > 10000)) {
      return NextResponse.json(
        { success: false, error: 'Compute budget must be between $0 and $10,000/month.' },
        { status: 400 }
      );
    }

    if (bonus !== undefined && (bonus < 0 || bonus > 100)) {
      return NextResponse.json(
        { success: false, error: 'Bonus must be between 0% and 100%.' },
        { status: 400 }
      );
    }

    // 6. Connect to database
    await connectDB();

    // 7. Find user's AI company
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

    // === HIRE OFFER PATH ===
    if (offerType === 'hire') {
      // 8. Validate candidate data provided
      if (!candidate) {
        return NextResponse.json(
          { success: false, error: 'Candidate profile required for hire offers.' },
          { status: 400 }
        );
      }

      // 9. Calculate market competitiveness
      const marketAnalysis = calculateCompetitiveSalary({
        role: candidate.role,
        skillLevel: candidate.technical,
        hasPhD: candidate.hasPhD,
        yearsExperience: candidate.yearsExperience,
      });

      // 10. Determine candidate decision (probabilistic)
      const baseAcceptanceProbability = baseSalary >= candidate.expectedSalary * 1.1 
        ? 0.95 
        : baseSalary >= candidate.expectedSalary 
          ? 0.75 
          : 0.30;

      // Adjust for market competitiveness
      let competitivenessBonus = 0;
      if (marketAnalysis.competitiveness === 'TopTier') competitivenessBonus = 0.10;
      else if (marketAnalysis.competitiveness === 'BelowMarket') competitivenessBonus = -0.20;

      // Adjust for equity (candidates value stock options)
      const equityBonus = equity * 0.05; // +5% per 1% equity

      // Final acceptance probability
      const acceptanceProbability = Math.min(
        0.98,
        Math.max(0.05, baseAcceptanceProbability + competitivenessBonus + equityBonus)
      );

      const offerAccepted = Math.random() < acceptanceProbability;

      if (!offerAccepted) {
        // Candidate rejected offer
        const rejectionReasons = [
          `Salary below expectations (expected $${candidate.expectedSalary.toLocaleString()})`,
          `Competing offer from another company was more attractive`,
          `Total compensation package not competitive with market`,
          `Stock options insufficient for risk tolerance`,
          `Better growth opportunities elsewhere`,
        ];
        return NextResponse.json({
          success: true,
          offerAccepted: false,
          decision: {
            accepted: false,
            reason: rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)],
          },
          marketAnalysis: {
            offerCompetitiveness: marketAnalysis.competitiveness,
            marketMedian: marketAnalysis.marketRange.median,
            percentAboveMarket: ((baseSalary - marketAnalysis.marketRange.median) / marketAnalysis.marketRange.median) * 100,
          },
        });
      }

      // 11. Offer accepted - Create employee record
      const newEmployee = await Employee.create({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        company: company._id,
        role: candidate.role,
        
        // AI-specific fields
        hasPhD: candidate.hasPhD,
        university: candidate.university,
        publications: candidate.publications,
        hIndex: candidate.hIndex,
        researchAbility: candidate.researchAbility,
        codingSkill: candidate.codingSkill,
        domainExpertise: candidate.domainExpertise as any,
        computeBudget,
        
        // Base skills
        technical: candidate.technical,
        analytical: candidate.analytical,
        communication: candidate.communication,
        creativity: candidate.creativity,
        sales: 50,
        leadership: 50,
        finance: 50,
        marketing: 50,
        operations: 50,
        research: candidate.researchAbility * 10, // Convert 1-10 to 1-100
        compliance: 50,
        customerService: 50,
        
        // Attributes
        experience: Math.min(100, candidate.yearsExperience * 2), // 50 years → 100 scale
        productivity: candidate.productivity,
        loyalty: candidate.loyalty,
        morale: 70,
        satisfaction: 75,
        learningRate: candidate.learningRate,
        
        // Compensation
        salary: baseSalary,
        bonus,
        equity,
        
        // Performance
        performanceRating: 3,
        contractsCompleted: 0,
        projectsCompleted: 0,
        revenueGenerated: 0,
        
        // Retention
        poachable: false, // Not poachable initially (6 month grace period typical)
        poachResistance: 70,
        retentionRisk: 20, // Low risk on hire
        counterOfferCount: 0,
        
        // Skill caps (based on talent/PhD)
        skillCaps: {
          technical: candidate.hasPhD ? 95 : 85,
          analytical: candidate.hasPhD ? 95 : 85,
          research: candidate.hasPhD ? 98 : 80,
          creativity: candidate.hasPhD ? 90 : 75,
          communication: 85,
          sales: 70,
          leadership: 75,
          finance: 70,
          marketing: 70,
          operations: 75,
          compliance: 80,
          customerService: 70,
        },
      });

      return NextResponse.json({
        success: true,
        offerAccepted: true,
        employee: newEmployee,
        decision: {
          accepted: true,
          reason: 'Offer meets expectations and aligns with career goals',
        },
        marketAnalysis: {
          offerCompetitiveness: marketAnalysis.competitiveness,
          marketMedian: marketAnalysis.marketRange.median,
          percentAboveMarket: Math.round(((baseSalary - marketAnalysis.marketRange.median) / marketAnalysis.marketRange.median) * 1000) / 10,
        },
      });
    }

    // === RETENTION OFFER PATH ===
    else {
      // 12. Find existing employee
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

      // 13. Calculate market rate for employee
      const marketAnalysis = calculateCompetitiveSalary({
        role: employee.role as AIRole,
        skillLevel: employee.technical,
        hasPhD: employee.hasPhD ?? false,
        yearsExperience: employee.yearsOfExperience,
      });

      // 14. Calculate retention risk BEFORE offer
      const currentRisk = calculateRetentionRisk({
        currentSalary: employee.salary,
        marketSalary: marketAnalysis.totalSalary,
        satisfaction: employee.satisfaction,
        competitorOffers: employee.counterOfferCount,
        yearsInRole: employee.yearsOfExperience,
      });

      // 15. Calculate salary gap closure
      const salaryGap = marketAnalysis.totalSalary - employee.salary;
      const offerIncrease = baseSalary - employee.salary;
      const gapClosurePercent = salaryGap > 0 ? (offerIncrease / salaryGap) * 100 : 100;

      // 16. Determine acceptance probability based on gap closure
      let acceptanceProbability: number;
      if (gapClosurePercent >= 100) acceptanceProbability = 0.90;
      else if (gapClosurePercent >= 70) acceptanceProbability = 0.70;
      else if (gapClosurePercent >= 50) acceptanceProbability = 0.45;
      else acceptanceProbability = 0.20;

      const offerAccepted = Math.random() < acceptanceProbability;

      if (!offerAccepted) {
        // Employee rejected retention offer (will likely leave)
        return NextResponse.json({
          success: true,
          offerAccepted: false,
          decision: {
            accepted: false,
            reason: `Retention offer insufficient. Market gap of $${salaryGap.toLocaleString()} only ${Math.round(gapClosurePercent)}% closed. Employee likely to leave for competitor.`,
          },
          currentRisk,
          marketAnalysis: {
            offerCompetitiveness: marketAnalysis.competitiveness,
            marketSalary: marketAnalysis.totalSalary,
            currentSalary: employee.salary,
            gapClosurePercent: Math.round(gapClosurePercent),
          },
        });
      }

      // 17. Offer accepted - Update employee record
      employee.salary = baseSalary;
      if (equity !== undefined) employee.equity = equity;
      if (computeBudget !== undefined) employee.computeBudget = computeBudget;
      if (bonus !== undefined) employee.bonus = bonus;
      employee.counterOfferCount += 1;
      employee.satisfaction = Math.min(100, employee.satisfaction + 15); // Boost satisfaction
      employee.morale = Math.min(100, employee.morale + 10); // Boost morale
      employee.lastRaise = new Date();

      await employee.save(); // Pre-save hook will recalculate retentionRisk

      return NextResponse.json({
        success: true,
        offerAccepted: true,
        employee,
        decision: {
          accepted: true,
          reason: `Salary adjustment addresses retention concerns. Gap closure: ${Math.round(gapClosurePercent)}%`,
        },
        marketAnalysis: {
          offerCompetitiveness: marketAnalysis.competitiveness,
          marketSalary: marketAnalysis.totalSalary,
          previousSalary: employee.salary - offerIncrease,
          newSalary: baseSalary,
          gapClosurePercent: Math.round(gapClosurePercent),
        },
      });
    }
  } catch (error: unknown) {
    console.error('[API] /api/ai/employees/[id]/offer - Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process salary offer', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
