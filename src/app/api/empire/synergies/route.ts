/**
 * @file src/app/api/empire/synergies/route.ts
 * @description API endpoints for empire synergies
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Manages synergy calculations and retrieval for player's empire.
 * Synergies are bonuses granted when player owns companies in multiple industries.
 *
 * Endpoints:
 * - GET: Calculate and return active synergies with bonuses
 * - POST: Recalculate synergies (useful after company acquisition)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
// Import directly from model files to preserve static method types
import PlayerEmpire from '@/lib/db/models/empire/PlayerEmpire';
import Synergy from '@/lib/db/models/empire/Synergy';
import type { ISynergy } from '@/lib/db/models/empire/Synergy';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCode,
} from '@/lib/utils/apiResponse';
import {
  calculateSynergies,
  updateEmpireSynergies,
  getEmpireBonusSummary,
} from '@/lib/game/empire/synergyEngine';

// ============================================================================
// GET /api/empire/synergies
// ============================================================================

/**
 * Get active synergies for the authenticated user's empire
 * 
 * Query params:
 * - includeProjections: boolean - Include potential synergies player could unlock
 * - includeSummary: boolean - Include empire bonus summary
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
    const includeProjections = searchParams.get('includeProjections') === 'true';
    const includeSummary = searchParams.get('includeSummary') === 'true';

    // Connect to database
    await connectDB();

    // Calculate synergies
    const result = await calculateSynergies(userId, includeProjections);

    // Get empire for additional data
    const empire = await PlayerEmpire.findByUserId(userId);

    // Build response
    const response: {
      activeSynergies: typeof result.activeSynergies;
      totalBonusPercentage: number;
      bonusesByTarget: typeof result.bonusesByTarget;
      potentialSynergies?: typeof result.potentialSynergies;
      empire?: {
        level: number;
        xp: number;
        multiplier: number;
        companyCount: number;
        industryCount: number;
      };
      summary?: Awaited<ReturnType<typeof getEmpireBonusSummary>>;
    } = {
      activeSynergies: result.activeSynergies,
      totalBonusPercentage: result.totalBonusPercentage,
      bonusesByTarget: result.bonusesByTarget,
    };

    // Add potential synergies if requested
    if (includeProjections && result.potentialSynergies) {
      response.potentialSynergies = result.potentialSynergies;
    }

    // Add empire data if available
    if (empire) {
      response.empire = {
        level: empire.empireLevel,
        xp: empire.empireXp,
        multiplier: empire.synergyMultiplier,
        companyCount: empire.companies.length,
        industryCount: empire.industryCount,
      };
    }

    // Add summary if requested
    if (includeSummary) {
      response.summary = await getEmpireBonusSummary(userId);
    }

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error fetching synergies:', error);
    return createErrorResponse(
      'Failed to fetch synergies',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// POST /api/empire/synergies
// ============================================================================

/**
 * Recalculate and update synergies for the user's empire
 * Call this after acquiring a new company
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const userId = session.user.id;

    // Connect to database
    await connectDB();

    // Update synergies
    const updateResult = await updateEmpireSynergies(userId);

    // Get updated synergies
    const synergies = await calculateSynergies(userId, true);

    return createSuccessResponse(
      {
        synergiesActivated: updateResult.synergiesActivated,
        xpAwarded: updateResult.xpAwarded,
        activeSynergies: synergies.activeSynergies,
        totalBonusPercentage: synergies.totalBonusPercentage,
        potentialSynergies: synergies.potentialSynergies,
      },
      undefined,
      200
    );
  } catch (error) {
    console.error('Error updating synergies:', error);
    return createErrorResponse(
      'Failed to update synergies',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}

// ============================================================================
// GET /api/empire/synergies/definitions
// ============================================================================

/**
 * Get all available synergy definitions (for UI display)
 * This is a separate export for the /definitions route if needed
 */
export async function getDefinitions() {
  try {
    await connectDB();
    const synergies = await Synergy.getActiveSynergies();
    return createSuccessResponse({
      synergies: synergies.map((s) => ({
        id: s.synergyId,
        name: s.name,
        description: s.description,
        requiredIndustries: s.requiredIndustries,
        tier: s.tier,
        unlockLevel: s.unlockLevel,
        bonuses: s.bonuses,
        icon: s.icon,
        color: s.color,
      })),
    });
  } catch (error) {
    console.error('Error fetching synergy definitions:', error);
    return createErrorResponse(
      'Failed to fetch synergy definitions',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}
