/**
 * @fileoverview AI Talent Candidates API Route
 * @module app/api/ai/talent/candidates/route
 * 
 * OVERVIEW:
 * GET endpoint for generating AI talent candidate pools for hiring.
 * Uses generateCandidatePool utility from talentManagement.ts.
 * Returns PhD-level candidates with research profiles, skills, and compensation.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import { authenticateRequest, authorizeCompany, handleAPIError } from '@/lib/utils/api-helpers';
import { generateCandidatePool, type AIRole, type SkillTier } from '@/lib/utils/ai/talentManagement';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/ai/talent/candidates
 * 
 * Generates AI talent candidate pool for hiring.
 * Returns candidates with PhD credentials, research profiles, skills, and salary expectations.
 * 
 * AUTHENTICATION: Required (NextAuth session)
 * AUTHORIZATION: Technology industry only
 * 
 * QUERY PARAMETERS:
 * - role: AIRole (required) - MLEngineer | ResearchScientist | DataEngineer | MLOps | ProductManager
 * - count: number (optional, 1-50, default 10) - Number of candidates to generate
 * - skillTier: SkillTier (optional) - Junior | Mid | Senior | PhD (filter by expertise level)
 * 
 * RESPONSE:
 * - 200: Candidate pool with metadata
 * ```ts
 * {
 *   candidates: Array<{
 *     id: string; // Temporary ID
 *     firstName: string;
 *     lastName: string;
 *     email: string;
 *     role: AIRole;
 *     hasPhD: boolean;
 *     university: string;
 *     publications: number;
 *     hIndex: number;
 *     researchAbility: number; // 1-10
 *     codingSkill: number; // 1-10
 *     domainExpertise: string;
 *     technical: number; // 0-100
 *     analytical: number; // 0-100
 *     communication: number; // 0-100
 *     creativity: number; // 0-100
 *     yearsExperience: number;
 *     currentSalary: number;
 *     expectedSalary: number;
 *     stockPreference: number; // 0-100
 *     loyalty: number; // 0-100
 *     learningRate: number; // 0-100
 *     productivity: number; // 0-100
 *     competingOffers: number;
 *     interestLevel: number; // 0-100
 *     recruitmentDifficulty: number; // 0-100
 *   }>;
 *   metadata: {
 *     role: string;
 *     count: number;
 *     skillTier: string;
 *     companyReputation: number;
 *     phdCount: number;
 *     phdPercentage: number;
 *     avgExpectedSalary: number;
 *     avgInterestLevel: number;
 *     salaryRange: { min: number; max: number };
 *   };
 * }
 * ```
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 403: Not Technology industry
 * - 500: Server error
 * 
 * @example
 * ```ts
 * // Generate 15 Senior-level ML Engineer candidates
 * const response = await fetch('/api/ai/talent/candidates?role=MLEngineer&count=15&skillTier=Senior');
 * const { candidates, metadata } = await response.json();
 * console.log(`Generated ${metadata.phdCount} PhD candidates with avg salary $${metadata.avgExpectedSalary}`);
 * ```
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // Authorize company access (Technology industry only)
    const { company, error: companyError } = await authorizeCompany(
      companyId,
      IndustryType.Technology,
      userId
    );
    if (companyError) return companyError;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as AIRole | null;
    const countParam = searchParams.get('count');
    const skillTier = searchParams.get('skillTier') as SkillTier | null;

    // Validate role (required)
    const validRoles: AIRole[] = ['MLEngineer', 'ResearchScientist', 'DataEngineer', 'MLOps', 'ProductManager'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: 'Invalid or missing role parameter',
          validRoles,
        },
        { status: 400 }
      );
    }

    // Validate count (1-50, default 10)
    const count = countParam ? parseInt(countParam, 10) : 10;
    if (isNaN(count) || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate skillTier (optional)
    if (skillTier) {
      const validTiers: SkillTier[] = ['Junior', 'Mid', 'Senior', 'PhD'];
      if (!validTiers.includes(skillTier)) {
        return NextResponse.json(
          {
            error: 'Invalid skill tier',
            validTiers,
          },
          { status: 400 }
        );
      }
    }

    // Connect to database
    await connectDB();

    // Get company reputation for candidate quality
    const fullCompany = await Company.findById(companyId).select('reputation');
    const companyReputation = fullCompany?.reputation ?? 70;

    // Generate candidate pool using utility (MAXIMUM REUSE!)
    const candidates = generateCandidatePool({
      role,
      count,
      companyReputation,
      skillTier: skillTier ?? undefined,
    });

    // Calculate metadata statistics
    const phdCount = candidates.filter((c) => c.hasPhD).length;
    const phdPercentage = (phdCount / candidates.length) * 100;
    const avgExpectedSalary = Math.round(
      candidates.reduce((sum, c) => sum + c.expectedSalary, 0) / candidates.length
    );
    const avgInterestLevel = Math.round(
      candidates.reduce((sum, c) => sum + c.interestLevel, 0) / candidates.length
    );

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error) {
    return handleAPIError('[GET /api/ai/talent/candidates]', error, 'Failed to generate candidate pool');
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Maximum Code Reuse**: Uses utilities throughout
 *    - authenticateRequest() for auth (api-helpers)
 *    - authorizeCompany() for industry check (api-helpers)
 *    - handleAPIError() for error handling (api-helpers)
 *    - generateCandidatePool() for candidate generation (talentManagement.ts)
 *    - ZERO embedded logic, ZERO duplication
 * 
 * 2. **Candidate Generation**: Utility-first
 *    - Uses generateCandidatePool from talentManagement.ts
 *    - Deterministic within session (same params = same candidates)
 *    - PhD candidates 10x rarer (5% without tier filter)
 *    - Quality scales with company reputation
 * 
 * 3. **Validation**: Query parameter checks
 *    - role: required (MLEngineer, ResearchScientist, DataEngineer, MLOps, ProductManager)
 *    - count: optional 1-50 (default 10)
 *    - skillTier: optional filter (Junior, Mid, Senior, PhD)
 * 
 * 4. **Metadata**: Rich statistics
 *    - PhD percentage
 *    - Average expected salary
 *    - Average interest level
 *    - Salary range (min/max)
 * 
 * 5. **Temporary Candidates**: Not stored in DB
 *    - Generated on-demand for each request
 *    - Only stored when hired via POST /api/employees
 *    - Reduces database bloat
 * 
 * PREVENTS:
 * - Non-Technology companies using AI talent features
 * - Invalid role/tier parameters
 * - Excessive candidate generation (max 50)
 * - Code duplication (all logic in talentManagement.ts)
 */
