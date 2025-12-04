/**
 * @file src/app/api/ai/talent/[id]/offer/route.ts
 * @description API endpoint for making salary offers to AI talent candidates
 * @created 2025-11-22
 * 
 * OVERVIEW:
 * Handles salary offer submission to PhD candidates for AI company hiring.
 * Uses calculateCompetitiveSalary and talentManagement utilities to validate
 * offers against market rates. Implements probabilistic acceptance with market
 * competitiveness, equity, and offer gap factors. Creates Employee record on
 * acceptance.
 * 
 * ENDPOINTS:
 * POST /api/ai/talent/:id/offer
 * 
 * REQUEST BODY:
 * {
 *   candidate: {                      // REQUIRED: Full candidate profile from /candidates
 *     id: "uuid",
 *     firstName: "Alice",
 *     lastName: "Chen",
 *     role: "ResearchScientist",
 *     hasPhD: true,
 *     university: "Stanford",
 *     publications: 12,
 *     hIndex: 8,
 *     researchAbility: 9,
 *     codingSkill: 7,
 *     domainExpertise: "NLP",
 *     technical: 85,
 *     analytical: 88,
 *     communication: 72,
 *     creativity: 80,
 *     yearsExperience: 8,
 *     currentSalary: 240000,
 *     expectedSalary: 280000,
 *     stockPreference: 70,
 *     loyalty: 65,
 *     learningRate: 8,
 *     productivity: 82,
 *     competingOffers: 2,
 *     interestLevel: 75,
 *     recruitmentDifficulty: 55
 *   },
 *   baseSalary: 300000,               // Offer amount ($20k-$5M)
 *   equity?: 1.5,                     // Stock options % (0-10)
 *   computeBudget?: 4000,             // Monthly $ allocation (0-10000)
 *   bonus?: 15,                       // Annual bonus % (0-100)
 *   startDate?: "2025-12-01",         // ISO date string
 *   message?: "Excited to have you!"  // Personal message
 * }
 * 
 * RESPONSE FORMAT (Success):
 * {
 *   success: true,
 *   offerAccepted: true,
 *   employee: {                        // Created Employee document
 *     _id: "...",
 *     firstName: "Alice",
 *     lastName: "Chen",
 *     fullName: "Alice Chen",
 *     role: "ResearchScientist",
 *     salary: 300000,
 *     equity: 1.5,
 *     computeBudget: 4000,
 *     hasPhD: true,
 *     researchAbility: 9,
 *     codingSkill: 7,
 *     // ... full employee record
 *   },
 *   decision: {
 *     accepted: true,
 *     reason: "Offer exceeds expectations and aligns with career goals",
 *     acceptanceProbability: 0.95
 *   },
 *   marketAnalysis: {
 *     offerCompetitiveness: "TopTier",  // TopTier | Competitive | BelowMarket
 *     marketMedian: 270000,
 *     percentAboveMarket: 11.1,
 *     salaryRange: { min: 200000, median: 270000, max: 350000 }
 *   }
 * }
 * 
 * RESPONSE FORMAT (Rejection):
 * {
 *   success: true,
 *   offerAccepted: false,
 *   decision: {
 *     accepted: false,
 *     reason: "Salary below expectations (expected $280,000)",
 *     acceptanceProbability: 0.32
 *   },
 *   marketAnalysis: { ... }
 * }
 * 
 * DECISION LOGIC (Probabilistic Acceptance):
 * Base acceptance probability:
 * - Offer >= expected + 10%: 95% acceptance
 * - Offer >= expected: 75% acceptance
 * - Offer < expected: 30% acceptance
 * 
 * Competitiveness adjustments:
 * - TopTier (top 10%): +10% acceptance bonus
 * - Competitive (50-90%): No adjustment
 * - BelowMarket (<50%): -20% acceptance penalty
 * 
 * Equity bonus:
 * - +5% acceptance per 1% equity offered (e.g., 2% equity → +10% acceptance)
 * 
 * Final probability capped: 5% min, 98% max (no guarantees)
 * 
 * ERROR RESPONSES:
 * - 400: Invalid request body (missing candidate, invalid salary range)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (no AI company found)
 * - 500: Server error (database failure)
 * 
 * IMPLEMENTATION NOTES:
 * - Only creates Employee record if candidate accepts offer
 * - Rejected offers return analysis but no database changes
 * - All offers validated against calculateCompetitiveSalary utility
 * - Decision is probabilistic (Math.random() < acceptanceProbability)
 * - Equity and compute budget optional (default 0)
 * - Stock options capped at 10%, compute budget capped at $10k/mo
 * - Candidates with competing offers harder to recruit (lower acceptance)
 * - Interest level and loyalty affect decision (future enhancement)
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import Employee, { type DomainExpertise } from '@/lib/db/models/Employee';
import { 
  calculateCompetitiveSalary,
  type AIRole 
} from '@/lib/utils/ai/talentManagement';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';

/**
 * Candidate profile from /api/ai/talent/candidates
 */
interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
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
  expectedSalary: number;
  stockPreference: number;
  loyalty: number;
  learningRate: number;
  productivity: number;
  competingOffers: number;
  interestLevel: number;
}

/**
 * Offer request body
 */
interface OfferRequest {
  candidate: CandidateProfile;
  baseSalary: number;
  equity?: number;
  computeBudget?: number;
  bonus?: number;
  startDate?: string;
  message?: string;
}

/**
 * POST /api/ai/talent/:id/offer
 * Make salary offer to AI talent candidate
 */
export async function POST(
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
    const body = await req.json() as OfferRequest;
    const {
      candidate,
      baseSalary,
      equity = 0,
      computeBudget = 0,
      bonus = 10,
    } = body;

    // 3. Validate candidate data
    if (!candidate) {
      return createErrorResponse('Candidate profile required. Include full candidate object from /api/ai/talent/candidates.', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (candidate.id !== id) {
      return createErrorResponse('Candidate ID mismatch. URL parameter must match candidate.id in body.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 4. Validate salary range
    if (!baseSalary || baseSalary < 20000 || baseSalary > 5000000) {
      return createErrorResponse('Base salary must be between $20,000 and $5,000,000.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 5. Validate optional fields
    if (equity < 0 || equity > 10) {
      return createErrorResponse('Equity must be between 0% and 10%.', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (computeBudget < 0 || computeBudget > 10000) {
      return createErrorResponse('Compute budget must be between $0 and $10,000/month.', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (bonus < 0 || bonus > 100) {
      return createErrorResponse('Bonus must be between 0% and 100%.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // 6. Connect to database
    await connectDB();

    // 7. Find user's AI company
    const company = await Company.findById(companyId);

    if (!company || !['Technology', 'AI'].includes(company.industry)) {
      return createErrorResponse('No AI/Technology company found for this user.', ErrorCode.FORBIDDEN, 403);
    }

    // 8. Calculate market competitiveness
    const marketAnalysis = calculateCompetitiveSalary({
      role: candidate.role,
      skillLevel: candidate.technical,
      hasPhD: candidate.hasPhD,
      yearsExperience: candidate.yearsExperience,
    });

    // 9. Determine candidate acceptance probability
    
    // Base probability (offer vs expectation)
    let baseAcceptanceProbability: number;
    if (baseSalary >= candidate.expectedSalary * 1.1) {
      baseAcceptanceProbability = 0.95; // Offer 10%+ above expectations
    } else if (baseSalary >= candidate.expectedSalary) {
      baseAcceptanceProbability = 0.75; // Offer meets expectations
    } else {
      baseAcceptanceProbability = 0.30; // Offer below expectations
    }

    // Competitiveness adjustment
    let competitivenessBonus = 0;
    if (marketAnalysis.competitiveness === 'TopTier') {
      competitivenessBonus = 0.10; // Top 10% offers boost acceptance
    } else if (marketAnalysis.competitiveness === 'BelowMarket') {
      competitivenessBonus = -0.20; // Below market hurts acceptance
    }

    // Equity adjustment (candidates value stock options)
    const equityBonus = equity * 0.05; // +5% per 1% equity

    // Competing offers penalty (harder to recruit if candidate has options)
    const competingOffersPenalty = candidate.competingOffers * -0.05; // -5% per competing offer

    // Final acceptance probability (capped 5%-98%)
    const acceptanceProbability = Math.min(
      0.98,
      Math.max(0.05, baseAcceptanceProbability + competitivenessBonus + equityBonus + competingOffersPenalty)
    );

    // Probabilistic decision (Math.random() < probability)
    const offerAccepted = Math.random() < acceptanceProbability;

    // 10. Generate decision reason
    let decisionReason: string;
    if (!offerAccepted) {
      // Rejection reasons
      const rejectionReasons = [
        `Salary below expectations (expected $${candidate.expectedSalary.toLocaleString()})`,
        `Competing offer from another company was more attractive`,
        `Total compensation package not competitive with ${candidate.competingOffers} other offers`,
        `Stock options insufficient for risk tolerance (preference: ${candidate.stockPreference}%)`,
        `Better growth opportunities and research funding elsewhere`,
      ];
      decisionReason = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
    } else {
      // Acceptance reasons
      if (baseSalary >= candidate.expectedSalary * 1.1) {
        decisionReason = 'Offer exceeds expectations and aligns with career goals';
      } else if (marketAnalysis.competitiveness === 'TopTier') {
        decisionReason = 'Competitive compensation package with strong market positioning';
      } else if (equity >= 1.5) {
        decisionReason = 'Stock options provide attractive long-term upside';
      } else {
        decisionReason = 'Offer meets expectations and company mission aligns with research interests';
      }
    }

    // 11. If rejected, return analysis without creating employee
    if (!offerAccepted) {
      return createSuccessResponse({
        offerAccepted: false,
        decision: {
          accepted: false,
          reason: decisionReason,
          acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
        },
        marketAnalysis: {
          offerCompetitiveness: marketAnalysis.competitiveness,
          marketMedian: marketAnalysis.marketRange.median,
          percentAboveMarket: Math.round(((baseSalary - marketAnalysis.marketRange.median) / marketAnalysis.marketRange.median) * 1000) / 10,
          salaryRange: marketAnalysis.marketRange,
        },
      });
    }

    // 12. Offer accepted - Create Employee record
    const newEmployee = await Employee.create({
      companyId: company._id.toString(),
      userId,
      name: `${candidate.firstName} ${candidate.lastName}`,
      role: candidate.role,
      salary: baseSalary,
      
      // 12 Skills (mapped from candidate profile)
      skills: {
        technical: candidate.technical,
        leadership: 50,
        industry: 50,
        sales: 50,
        marketing: 50,
        finance: 50,
        operations: 50,
        hr: 50,
        legal: 50,
        rd: candidate.researchAbility * 10, // 1-10 → 10-100 scale
        quality: 50,
        customer: 50,
      },
      
      // Performance defaults
      performance: {
        productivity: candidate.productivity / 100, // 0-100 → 0.5-2.0 scale
        quality: 75,
        attendance: 1.0,
      },
      
      // Morale & Retention
      morale: 75, // Good starting morale (accepted offer)
      
      // AI-specific fields
      hasPhD: candidate.hasPhD,
      publications: 0, // Will grow over time
      hIndex: 0,
      researchAbility: candidate.researchAbility,
      codingSkill: candidate.codingSkill,
      domainExpertise: candidate.domainExpertise as DomainExpertise,
      computeBudget,
      
      // Compensation & Performance
      performanceRating: 3, // Average starting rating
      satisfaction: 80, // High satisfaction (offer met expectations)
      equity,
      bonus,
      counterOfferCount: 0,
    });

    // 13. Return success with employee record
    return createSuccessResponse({
      offerAccepted: true,
      employee: newEmployee,
      decision: {
        accepted: true,
        reason: decisionReason,
        acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
      },
      marketAnalysis: {
        offerCompetitiveness: marketAnalysis.competitiveness,
        marketMedian: marketAnalysis.marketRange.median,
        percentAboveMarket: Math.round(((baseSalary - marketAnalysis.marketRange.median) / marketAnalysis.marketRange.median) * 1000) / 10,
        salaryRange: marketAnalysis.marketRange,
      },
    });
  } catch (error: unknown) {
    return handleAPIError('[POST /api/ai/talent/:id/offer]', error, 'Failed to process salary offer');
  }
}
