/**
 * @file app/api/ai/employees/candidates/route.ts
 * @description API endpoint for generating AI employee candidate pools
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Generates pools of AI employee candidates for hiring using the generateCandidatePool
 * utility. Supports filtering by role, skill tier, and company reputation. Returns
 * candidate profiles with academic credentials (PhD, publications, h-index), specialized
 * skills (researchAbility, codingSkill), domain expertise, and compensation expectations.
 * 
 * ENDPOINTS:
 * GET /api/ai/employees/candidates?role=MLEngineer&count=15&skillTier=Senior
 * 
 * QUERY PARAMETERS:
 * - role: AIRole (MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager)
 * - count: Number of candidates (1-50, default 10)
 * - companyReputation: Company reputation score (1-100, default 70)
 * - skillTier: Optional skill tier filter (Junior, Mid, Senior, PhD)
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   candidates: [
 *     {
 *       id: "candidate-MLEngineer-1-...",
 *       firstName: "Alice",
 *       lastName: "Chen",
 *       email: "alice.chen@email.com",
 *       role: "MLEngineer",
 *       hasPhD: true,
 *       university: "Stanford",
 *       publications: 18,
 *       hIndex: 15,
 *       researchAbility: 9,
 *       codingSkill: 8,
 *       domainExpertise: "NLP",
 *       technical: 88,
 *       analytical: 85,
 *       communication: 72,
 *       creativity: 80,
 *       yearsExperience: 6.5,
 *       currentSalary: 220000,
 *       expectedSalary: 242000,
 *       stockPreference: 75,
 *       loyalty: 68,
 *       learningRate: 85,
 *       productivity: 82,
 *       competingOffers: 2,
 *       interestLevel: 78,
 *       recruitmentDifficulty: 85
 *     },
 *     // ... more candidates
 *   ],
 *   metadata: {
 *     role: "MLEngineer",
 *     count: 15,
 *     skillTier: "Senior",
 *     companyReputation: 72,
 *     phdPercentage: 13.3,
 *     avgExpectedSalary: 228500
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Invalid query parameters (role required, count out of range, etc.)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (user does not own AI company)
 * - 500: Server error (database failure, utility error)
 * 
 * IMPLEMENTATION NOTES:
 * - Candidate generation is deterministic for session (same params = same candidates within session)
 * - Company reputation affects candidate quality and interest level
 * - PhD candidates are 10x rarer (5% of pool without tier filter)
 * - Expected salary includes 5-15% raise expectation above current
 * - Candidates are temporary (not stored in database until hired)
 * - Supports filtering by skill tier to focus search
 * - Competition level affects candidate interest and difficulty
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { generateCandidatePool, type AIRole, type SkillTier } from '@/lib/utils/ai/talentManagement';

/**
 * GET /api/ai/employees/candidates
 * Generate AI employee candidate pool for hiring
 * 
 * Query params:
 * - role: AIRole (required)
 * - count: number (1-50, default 10)
 * - companyReputation: number (1-100, optional - uses company's actual reputation if not provided)
 * - skillTier: SkillTier (optional - Junior|Mid|Senior|PhD)
 */
export async function GET(req: NextRequest) {
  try {
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
    const role = searchParams.get('role') as AIRole | null;
    const countParam = searchParams.get('count');
    const reputationParam = searchParams.get('companyReputation');
    const skillTier = searchParams.get('skillTier') as SkillTier | null | undefined;

    // 3. Validate role (required)
    if (!role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role is required. Valid values: MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager' 
        },
        { status: 400 }
      );
    }

    const validRoles: AIRole[] = ['MLEngineer', 'ResearchScientist', 'DataEngineer', 'MLOps', 'ProductManager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid role: ${role}. Valid values: ${validRoles.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // 4. Validate count (default 10, range 1-50)
    const count = countParam ? parseInt(countParam, 10) : 10;
    if (isNaN(count) || count < 1 || count > 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Count must be a number between 1 and 50' 
        },
        { status: 400 }
      );
    }

    // 5. Validate skillTier (optional)
    if (skillTier) {
      const validTiers: SkillTier[] = ['Junior', 'Mid', 'Senior', 'PhD'];
      if (!validTiers.includes(skillTier)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid skill tier: ${skillTier}. Valid values: ${validTiers.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    // 6. Connect to database
    await connectDB();

    // 7. Find user's AI company (must have industryType='Technology' or 'AI' to use this endpoint)
    const company = await Company.findOne({
      user: session.user.id,
      industryType: { $in: ['Technology', 'AI'] },
    }).lean();

    if (!company) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No AI/Technology company found for this user. Only AI companies can generate candidate pools.' 
        },
        { status: 403 }
      );
    }

    // 8. Determine company reputation (use provided value or company's actual reputation)
    const companyReputation = reputationParam 
      ? Math.min(100, Math.max(1, parseInt(reputationParam, 10))) 
      : company.reputation ?? 70;

    if (reputationParam && isNaN(companyReputation)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company reputation must be a number between 1 and 100' 
        },
        { status: 400 }
      );
    }

    // 9. Generate candidate pool using utility function
    const candidates = generateCandidatePool({
      role,
      count,
      companyReputation,
      skillTier: skillTier ?? undefined,
    });

    // 10. Calculate metadata statistics
    const phdCount = candidates.filter((c) => c.hasPhD).length;
    const phdPercentage = (phdCount / candidates.length) * 100;
    const avgExpectedSalary = Math.round(
      candidates.reduce((sum, c) => sum + c.expectedSalary, 0) / candidates.length
    );
    const avgInterestLevel = Math.round(
      candidates.reduce((sum, c) => sum + c.interestLevel, 0) / candidates.length
    );

    // 11. Return candidate pool with metadata
    return NextResponse.json({
      success: true,
      candidates,
      metadata: {
        role,
        count: candidates.length,
        skillTier: skillTier ?? 'Mixed',
        companyReputation,
        phdCount,
        phdPercentage: Math.round(phdPercentage * 10) / 10,
        avgExpectedSalary,
        avgInterestLevel,
        salaryRange: {
          min: Math.min(...candidates.map((c) => c.expectedSalary)),
          max: Math.max(...candidates.map((c) => c.expectedSalary)),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[API] /api/ai/employees/candidates - Error:', error);

    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate candidate pool', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
