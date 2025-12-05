/**
 * @fileoverview Pricing API - Get drug prices by state
 * @module app/api/crime/pricing/route
 * 
 * OVERVIEW:
 * Provides market pricing data for street trading:
 * - GET: Fetch prices for a specific state or all states
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { StatePricing } from '@/lib/db/models/crime/StatePricing';
import { seedCrimePricing } from '@/lib/seed/crime-pricing';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import type { StatePricingDTO, SubstanceLegalStatus } from '@/lib/types/crime-mmo';

/**
 * Map pricing document to DTO
 */
function mapPricingToDTO(doc: ReturnType<typeof StatePricing.prototype.toJSON>): StatePricingDTO {
  // Convert Map to object if needed
  let legalStatusObj: Partial<Record<string, SubstanceLegalStatus>> = {};
  if (doc.legalStatus instanceof Map) {
    legalStatusObj = Object.fromEntries(doc.legalStatus);
  } else if (doc.legalStatus && typeof doc.legalStatus === 'object') {
    legalStatusObj = doc.legalStatus as Partial<Record<string, SubstanceLegalStatus>>;
  }

  return {
    id: doc.id || String(doc._id),
    state: doc.state,
    stateName: doc.stateName,
    prices: doc.prices ?? [],
    legalStatus: legalStatusObj,
    lawEnforcementIntensity: doc.lawEnforcementIntensity ?? 50,
    playerProductionVolume: doc.playerProductionVolume ?? 0,
    activeEvents: doc.activeEvents ?? [],
    lastUpdate: doc.lastUpdate ?? new Date(),
  };
}

/**
 * GET /api/crime/pricing - Get market prices
 * 
 * Query params:
 * - state: StateCode to get pricing for (optional, returns all if not specified)
 * - substance: Filter to specific substance (optional)
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  try {
    const url = new URL(request.url);
    const stateParam = url.searchParams.get('state');
    const substanceParam = url.searchParams.get('substance');

    await connectDB();

    // Check if pricing data exists, seed if not
    const count = await StatePricing.countDocuments();
    if (count === 0) {
      console.log('[GET /crime/pricing] No pricing data found, seeding...');
      await seedCrimePricing();
    }

    if (stateParam) {
      // Get single state pricing
      const pricing = await StatePricing.findOne({ state: stateParam.toUpperCase() }).lean();
      
      if (!pricing) {
        return createErrorResponse(`Pricing not found for state: ${stateParam}`, ErrorCode.NOT_FOUND, 404);
      }

      let result = mapPricingToDTO(pricing);
      
      // Filter by substance if specified
      if (substanceParam) {
        result = {
          ...result,
          prices: result.prices.filter(p => p.substance === substanceParam),
        };
      }

      return createSuccessResponse(result);
    } else {
      // Get all states pricing (summary view)
      const pricings = await StatePricing.find({})
        .select('state stateName prices lawEnforcementIntensity lastUpdate')
        .lean();

      let results = pricings.map(p => {
        const dto = mapPricingToDTO(p);
        // Filter by substance if specified
        if (substanceParam) {
          return {
            ...dto,
            prices: dto.prices.filter(price => price.substance === substanceParam),
          };
        }
        return dto;
      });

      return createSuccessResponse(results, {
        count: results.length,
        substance: substanceParam || 'all',
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback' });
    }
    console.error('GET /crime/pricing error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/crime/pricing/seed - Force reseed pricing data (admin only)
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  // TODO: Add admin check
  // For now, allow any authenticated user to seed (development mode)

  try {
    await connectDB();
    
    const results = await seedCrimePricing();
    
    return createSuccessResponse({
      message: 'Pricing data seeded successfully',
      statesSeeded: results.length,
    }, {}, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503);
    }
    console.error('POST /crime/pricing error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}
