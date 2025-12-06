/**
 * @file src/app/api/empire/companies/route.ts
 * @description API endpoints for managing empire companies
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Manages the companies in a player's empire. This is the hub for:
 * - Viewing all owned companies with synergy contributions
 * - Adding new companies to the empire
 * - Updating company statistics
 * - Removing companies from the empire
 *
 * Endpoints:
 * - GET: List all companies in the empire
 * - POST: Add a company to the empire
 * - PATCH: Update company in empire (stats sync)
 * - DELETE: Remove company from empire
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
// Import directly from model files to preserve static method types
import PlayerEmpire from '@/lib/db/models/empire/PlayerEmpire';
import ResourceFlow from '@/lib/db/models/empire/ResourceFlow';
import type { IPlayerEmpire, IEmpireCompany, IActiveSynergy } from '@/lib/db/models/empire/PlayerEmpire';
import type { IResourceFlow } from '@/lib/db/models/empire/ResourceFlow';
import Company from '@/lib/db/models/Company';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCode,
} from '@/lib/utils/apiResponse';
import { updateEmpireSynergies } from '@/lib/game/empire/synergyEngine';
import { EmpireIndustry } from '@/lib/types/empire';
import { IndustryType } from '@/lib/types';

// ============================================================================
// Validation Schemas
// ============================================================================

const addCompanySchema = z.object({
  companyId: z.string().min(1),
  setAsHeadquarters: z.boolean().optional().default(false),
});

const updateCompanySchema = z.object({
  companyId: z.string().min(1),
  level: z.number().min(1).max(5).optional(),
  revenue: z.number().min(0).optional(),
  value: z.number().min(0).optional(),
  name: z.string().min(1).max(100).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map IndustryType to EmpireIndustry
 */
function mapIndustryToEmpire(industry: string): EmpireIndustry {
  const mapping: Record<string, EmpireIndustry> = {
    [IndustryType.TECH]: EmpireIndustry.TECH,
    [IndustryType.Technology]: EmpireIndustry.TECH,
    [IndustryType.FINANCE]: EmpireIndustry.BANKING,
    [IndustryType.HEALTHCARE]: EmpireIndustry.HEALTHCARE,
    [IndustryType.ENERGY]: EmpireIndustry.ENERGY,
    [IndustryType.MANUFACTURING]: EmpireIndustry.MANUFACTURING,
    [IndustryType.RETAIL]: EmpireIndustry.RETAIL,
    // Additional mappings
    BANKING: EmpireIndustry.BANKING,
    MEDIA: EmpireIndustry.MEDIA,
    REAL_ESTATE: EmpireIndustry.REAL_ESTATE,
    LOGISTICS: EmpireIndustry.LOGISTICS,
    POLITICS: EmpireIndustry.POLITICS,
    CONSULTING: EmpireIndustry.CONSULTING,
    CRIME: EmpireIndustry.CRIME,
  };
  return mapping[industry] || EmpireIndustry.RETAIL;
}

/**
 * Calculate company value based on level and revenue
 */
function calculateCompanyValue(level: number, revenue: number): number {
  // Simple valuation: 5x revenue multiplied by level factor
  const levelMultiplier = 1 + (level - 1) * 0.5; // 1.0, 1.5, 2.0, 2.5, 3.0
  return Math.round(revenue * 5 * levelMultiplier);
}

// ============================================================================
// GET /api/empire/companies
// ============================================================================

/**
 * Get all companies in the player's empire
 * 
 * Query params:
 * - includeFlows: boolean - Include resource flows for each company
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const includeFlows = searchParams.get('includeFlows') === 'true';

    // Connect to database
    await connectDB();

    // Get or create empire
    const empire = await PlayerEmpire.getOrCreate(userId);

    // Get resource flows if requested
    let resourceFlows: Awaited<ReturnType<typeof ResourceFlow.findByUserId>> = [];
    if (includeFlows) {
      resourceFlows = await ResourceFlow.findActiveFlows(userId);
    }

    // Build response
    const companiesWithFlows = empire.companies.map((company) => {
      const flows = includeFlows
        ? {
            incoming: resourceFlows.filter(
              (f) => f.toCompanyId === company.companyId
            ),
            outgoing: resourceFlows.filter(
              (f) => f.fromCompanyId === company.companyId
            ),
          }
        : undefined;

      // Find synergies this company contributes to
      const contributingTo = empire.activeSynergies
        .filter((s) => s.contributingCompanyIds.includes(company.companyId))
        .map((s) => s.synergyName);

      return {
        ...company,
        synergyContributions: contributingTo,
        resourceFlows: flows,
      };
    });

    return createSuccessResponse({
      companies: companiesWithFlows,
      stats: empire.getStats(),
      empireLevel: empire.empireLevel,
      empireXp: empire.empireXp,
      synergyMultiplier: empire.synergyMultiplier,
    });
  } catch (error) {
    console.error('Error fetching empire companies:', error);
    return createErrorResponse(
      'Failed to fetch empire companies',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// POST /api/empire/companies
// ============================================================================

/**
 * Add a company to the player's empire
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = addCompanySchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid request body',
        ErrorCode.VALIDATION_ERROR,
        400,
        validation.error.issues
      );
    }

    const { companyId, setAsHeadquarters } = validation.data;

    // Connect to database
    await connectDB();

    // Get the company from database
    const company = await Company.findById(companyId);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Verify ownership
    const companyUserId = company.userId || company.ownerId?.toString() || company.owner?.toString();
    if (companyUserId !== userId) {
      return createErrorResponse(
        'You do not own this company',
        ErrorCode.FORBIDDEN,
        403
      );
    }

    // Get or create empire
    const empire = await PlayerEmpire.getOrCreate(userId);

    // Map industry
    const empireIndustry = mapIndustryToEmpire(company.industry);

    // Calculate value
    const companyValue = calculateCompanyValue(company.level, company.revenue);

    // Add company to empire
    await empire.addCompany(
      companyId,
      company.name,
      empireIndustry,
      company.level,
      company.monthlyRevenue || company.revenue,
      companyValue
    );

    // Set as headquarters if requested
    if (setAsHeadquarters) {
      await empire.setHeadquarters(companyId);
    }

    // Recalculate synergies
    const synergyResult = await updateEmpireSynergies(userId);

    return createSuccessResponse(
      {
        message: 'Company added to empire',
        company: {
          companyId,
          name: company.name,
          industry: empireIndustry,
          level: company.level,
          value: companyValue,
        },
        synergiesActivated: synergyResult.synergiesActivated,
        xpAwarded: synergyResult.xpAwarded,
        empireLevel: empire.empireLevel,
        industryCount: empire.industryCount,
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('Error adding company to empire:', error);
    
    // Handle duplicate company error
    if (error instanceof Error && error.message === 'Company already in empire') {
      return createErrorResponse(
        'Company is already in your empire',
        ErrorCode.CONFLICT,
        409
      );
    }
    
    return createErrorResponse(
      'Failed to add company to empire',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// PATCH /api/empire/companies
// ============================================================================

/**
 * Update company statistics in the empire
 * Used to sync company data when it changes
 */
export async function PATCH(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = updateCompanySchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid request body',
        ErrorCode.VALIDATION_ERROR,
        400,
        validation.error.issues
      );
    }

    const { companyId, ...updates } = validation.data;

    // Connect to database
    await connectDB();

    // Get empire
    const empire = await PlayerEmpire.findByUserId(userId);
    if (!empire) {
      return createErrorResponse('Empire not found', ErrorCode.NOT_FOUND, 404);
    }

    // Update company stats
    await empire.updateCompanyStats(companyId, updates);

    return createSuccessResponse({
      message: 'Company updated',
      companyId,
      updates,
      newTotalValue: empire.totalValue,
    });
  } catch (error) {
    console.error('Error updating company in empire:', error);
    
    if (error instanceof Error && error.message === 'Company not found in empire') {
      return createErrorResponse(
        'Company not found in your empire',
        ErrorCode.NOT_FOUND,
        404
      );
    }
    
    return createErrorResponse(
      'Failed to update company',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// DELETE /api/empire/companies
// ============================================================================

/**
 * Remove a company from the empire
 * This does NOT delete the company, just removes it from empire tracking
 */
export async function DELETE(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const userId = session.user.id;

    // Get company ID from query params
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return createErrorResponse(
        'companyId query parameter required',
        ErrorCode.BAD_REQUEST,
        400
      );
    }

    // Connect to database
    await connectDB();

    // Get empire
    const empire = await PlayerEmpire.findByUserId(userId);
    if (!empire) {
      return createErrorResponse('Empire not found', ErrorCode.NOT_FOUND, 404);
    }

    // Remove company
    await empire.removeCompany(companyId);

    // Cancel any resource flows involving this company
    const flows = await ResourceFlow.findByCompanyId(companyId);
    for (const flow of flows) {
      if (flow.userId === userId) {
        await flow.cancel();
      }
    }

    // Recalculate synergies
    const synergyResult = await updateEmpireSynergies(userId);

    return createSuccessResponse({
      message: 'Company removed from empire',
      companyId,
      remainingCompanies: empire.companies.length,
      remainingIndustries: empire.industryCount,
      synergiesLost: synergyResult.synergiesActivated < 0 
        ? Math.abs(synergyResult.synergiesActivated) 
        : 0,
    });
  } catch (error) {
    console.error('Error removing company from empire:', error);
    
    if (error instanceof Error && error.message === 'Company not found in empire') {
      return createErrorResponse(
        'Company not found in your empire',
        ErrorCode.NOT_FOUND,
        404
      );
    }
    
    return createErrorResponse(
      'Failed to remove company from empire',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}
