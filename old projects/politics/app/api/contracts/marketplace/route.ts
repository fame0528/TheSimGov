/**
 * @file app/api/contracts/marketplace/route.ts
 * @description Contract marketplace API endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Public marketplace for browsing available contracts with advanced filtering,
 * sorting, and pagination. Supports querying by contract type, industry, value range,
 * complexity, required skills, and timeline. Returns contracts in "Available" or
 * "Bidding" status only (excludes awarded/completed contracts).
 * 
 * ENDPOINTS:
 * GET /api/contracts/marketplace
 * - Query Parameters:
 *   - type: Filter by contract type (Government, Private, Retail, LongTerm, ProjectBased)
 *   - industry: Filter by industry (Construction, Technology, Healthcare, etc.)
 *   - minValue: Minimum contract value (number, >= 10000)
 *   - maxValue: Maximum contract value (number, <= 10000000)
 *   - minDuration: Minimum duration in days
 *   - maxDuration: Maximum duration in days
 *   - complexity: Filter by complexity score (1-100)
 *   - riskLevel: Filter by risk (Low, Medium, High, Critical)
 *   - requiredSkill: Filter by required skill (technical, sales, leadership, etc.)
 *   - minSkillLevel: Minimum skill level for requiredSkill filter
 *   - sortBy: Sort field (value, deadline, complexity, marketDemand, createdAt)
 *   - sortOrder: Sort direction (asc, desc) - default: desc
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 20, max: 100)
 * 
 * - Response 200:
 *   ```json
 *   {
 *     "success": true,
 *     "data": {
 *       "contracts": [...],
 *       "pagination": {
 *         "page": 1,
 *         "limit": 20,
 *         "total": 145,
 *         "pages": 8
 *       }
 *     }
 *   }
 *   ```
 * 
 * - Response 400: Invalid query parameters
 * - Response 500: Server error
 * 
 * USAGE:
 * ```typescript
 * // Fetch high-value government contracts
 * const response = await fetch('/api/contracts/marketplace?type=Government&minValue=1000000&sortBy=value&sortOrder=desc');
 * const { data } = await response.json();
 * 
 * // Fetch technology contracts requiring high technical skills
 * const response = await fetch('/api/contracts/marketplace?industry=Technology&requiredSkill=technical&minSkillLevel=80');
 * 
 * // Fetch low-risk retail contracts with pagination
 * const response = await fetch('/api/contracts/marketplace?type=Retail&riskLevel=Low&page=2&limit=50');
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Only returns contracts with status "Available" or "Bidding"
 * - Bidding deadline must be in the future (not expired)
 * - Skill filtering checks requiredSkills object for minimum level
 * - Default sort: Most recent contracts first (createdAt desc)
 * - Pagination prevents excessive data transfer
 * - Query performance optimized with indexes on status, type, industry, value
 * - Contract documents include basic info only (not full milestone/bid details)
 * - Compatible with Contract schema validation rules
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Contract, { type ContractType, type RiskLevel, type ContractTier } from '@/lib/db/models/Contract';
import Company from '@/lib/db/models/Company';
import { auth } from '@/lib/auth/config';
import { getAccessibleTiers } from '@/lib/utils/contractGeneration';
import type { CompanyLevel } from '@/types/companyLevels';

/**
 * GET /api/contracts/marketplace
 * Fetch available contracts with filtering and pagination
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} Paginated contract list
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    // Get authenticated user and their company level
    const session = await auth();
    let companyLevel: CompanyLevel | null = null;
    
    if (session?.user?.id) {
      const companyId = request.nextUrl.searchParams.get('companyId');
      if (companyId) {
        const company = await Company.findById(companyId);
        if (company && company.owner.toString() === session.user.id) {
          companyLevel = company.level as CompanyLevel;
        }
      }
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;

    // FILTERING PARAMETERS
    const type = searchParams.get('type') as ContractType | null;
    const tier = searchParams.get('tier') as ContractTier | null;
    const industry = searchParams.get('industry');
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    const minDuration = searchParams.get('minDuration');
    const maxDuration = searchParams.get('maxDuration');
    const complexity = searchParams.get('complexity');
    const riskLevel = searchParams.get('riskLevel') as RiskLevel | null;
    const requiredSkill = searchParams.get('requiredSkill');
    const minSkillLevel = searchParams.get('minSkillLevel');

    // SORTING & PAGINATION
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // BUILD FILTER QUERY
    const filter: any = {
      status: { $in: ['Available', 'Bidding'] },
      biddingDeadline: { $gt: new Date() }, // Only active bidding periods
    };

    // Filter by contract type
    if (type) {
      const validTypes: ContractType[] = ['Government', 'Private', 'Retail', 'LongTerm', 'ProjectBased'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid contract type. Must be one of: Government, Private, Retail, LongTerm, ProjectBased' 
          },
          { status: 400 }
        );
      }
      filter.type = type;
    }

    // Filter by tier (or use company level to filter accessible tiers)
    if (companyLevel) {
      const accessibleTiers = getAccessibleTiers(companyLevel);
      if (tier) {
        // If specific tier requested, check if accessible
        if (accessibleTiers.includes(tier)) {
          filter.tier = tier;
        } else {
          // Tier not accessible, filter to accessible tiers only
          filter.tier = { $in: accessibleTiers };
        }
      } else {
        // No specific tier, show all accessible
        filter.tier = { $in: accessibleTiers };
      }
    } else if (tier) {
      // No company level, but tier specified
      const validTiers: ContractTier[] = ['Local', 'Regional', 'State', 'National', 'Global'];
      if (!validTiers.includes(tier)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid contract tier. Must be one of: Local, Regional, State, National, Global' 
          },
          { status: 400 }
        );
      }
      filter.tier = tier;
    }

    // Filter by industry
    if (industry) {
      filter.industry = industry;
    }

    // Filter by value range
    if (minValue) {
      const minVal = parseFloat(minValue);
      if (isNaN(minVal) || minVal < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid minValue parameter' },
          { status: 400 }
        );
      }
      filter.value = { ...filter.value, $gte: minVal };
    }

    if (maxValue) {
      const maxVal = parseFloat(maxValue);
      if (isNaN(maxVal) || maxVal < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid maxValue parameter' },
          { status: 400 }
        );
      }
      filter.value = { ...filter.value, $lte: maxVal };
    }

    // Filter by duration range
    if (minDuration) {
      const minDur = parseInt(minDuration, 10);
      if (isNaN(minDur) || minDur < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid minDuration parameter' },
          { status: 400 }
        );
      }
      filter.duration = { ...filter.duration, $gte: minDur };
    }

    if (maxDuration) {
      const maxDur = parseInt(maxDuration, 10);
      if (isNaN(maxDur) || maxDur < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid maxDuration parameter' },
          { status: 400 }
        );
      }
      filter.duration = { ...filter.duration, $lte: maxDur };
    }

    // Filter by complexity score
    if (complexity) {
      const complexityScore = parseInt(complexity, 10);
      if (isNaN(complexityScore) || complexityScore < 1 || complexityScore > 100) {
        return NextResponse.json(
          { success: false, error: 'Invalid complexity parameter (must be 1-100)' },
          { status: 400 }
        );
      }
      filter.complexityScore = complexityScore;
    }

    // Filter by risk level
    if (riskLevel) {
      const validRisks: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];
      if (!validRisks.includes(riskLevel)) {
        return NextResponse.json(
          { success: false, error: 'Invalid riskLevel. Must be one of: Low, Medium, High, Critical' },
          { status: 400 }
        );
      }
      filter.riskLevel = riskLevel;
    }

    // Filter by required skill level
    if (requiredSkill && minSkillLevel) {
      const validSkills = [
        'technical', 'sales', 'leadership', 'finance', 'marketing', 'operations',
        'research', 'compliance', 'communication', 'creativity', 'analytical', 'customerService'
      ];

      if (!validSkills.includes(requiredSkill)) {
        return NextResponse.json(
          { success: false, error: `Invalid requiredSkill. Must be one of: ${validSkills.join(', ')}` },
          { status: 400 }
        );
      }

      const skillLevel = parseInt(minSkillLevel, 10);
      if (isNaN(skillLevel) || skillLevel < 0 || skillLevel > 100) {
        return NextResponse.json(
          { success: false, error: 'Invalid minSkillLevel (must be 0-100)' },
          { status: 400 }
        );
      }

      filter[`requiredSkills.${requiredSkill}`] = { $gte: skillLevel };
    }

    // VALIDATE SORT FIELD
    const validSortFields = ['value', 'deadline', 'complexity', 'marketDemand', 'createdAt', 'biddingDeadline'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // EXECUTE QUERY WITH PAGINATION
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .select('-assignedEmployees -milestones -reviewText -counterOfferReceived') // Exclude sensitive/large fields
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Contract.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        contracts,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error: any) {
    console.error('Contract marketplace API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contracts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Implementation Notes:
 * 
 * QUERY OPTIMIZATION:
 * - Uses lean() for faster queries (returns plain objects instead of Mongoose documents)
 * - Parallel execution of count + find queries with Promise.all
 * - Indexed fields (status, type, industry, value) for fast filtering
 * - Excludes large/sensitive fields from response (milestones, reviewText, etc.)
 * 
 * SECURITY:
 * - Input validation prevents injection attacks
 * - Maximum limit of 100 prevents resource exhaustion
 * - Only public contract data exposed (no internal metrics)
 * 
 * FUTURE ENHANCEMENTS:
 * - Full-text search on title/description
 * - Geographical filtering (location-based)
 * - Bookmarking/watchlist functionality
 * - Real-time availability updates (websocket)
 * - Advanced analytics (trending contracts, success rates)
 */
