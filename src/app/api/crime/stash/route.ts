/**
 * @fileoverview Player Crime Data API - GET/POST for street trading
 * @module app/api/crime/stash/route
 * 
 * OVERVIEW:
 * Manages player's crime/drug trading data (embedded in User.crime):
 * - GET: Retrieve current crime data (auto-initializes if needed)
 * - POST: Reset crime data to defaults
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models';
import { rateLimitRequest } from '@/lib/utils/rateLimit';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { getUnlockedSubstances, getCarryCapacityForLevel, ALL_STATES } from '@/lib/types/crime-mmo';
import type { CrimePlayerDTO } from '@/lib/types/crime-mmo';
import type { StateCode } from '@/lib/types/crime';

/**
 * Map of state codes to their major city
 */
const STATE_CITIES: Record<string, string> = {
  AL: 'Birmingham', AK: 'Anchorage', AZ: 'Phoenix', AR: 'Little Rock', CA: 'Los Angeles',
  CO: 'Denver', CT: 'Hartford', DE: 'Wilmington', DC: 'Washington', FL: 'Miami',
  GA: 'Atlanta', HI: 'Honolulu', ID: 'Boise', IL: 'Chicago', IN: 'Indianapolis',
  IA: 'Des Moines', KS: 'Kansas City', KY: 'Louisville', LA: 'New Orleans', ME: 'Portland',
  MD: 'Baltimore', MA: 'Boston', MI: 'Detroit', MN: 'Minneapolis', MS: 'Jackson',
  MO: 'Kansas City', MT: 'Billings', NE: 'Omaha', NV: 'Las Vegas', NH: 'Manchester',
  NJ: 'Newark', NM: 'Albuquerque', NY: 'New York City', NC: 'Charlotte', ND: 'Fargo',
  OH: 'Columbus', OK: 'Oklahoma City', OR: 'Portland', PA: 'Philadelphia', RI: 'Providence',
  SC: 'Charleston', SD: 'Sioux Falls', TN: 'Nashville', TX: 'Houston', UT: 'Salt Lake City',
  VT: 'Burlington', VA: 'Virginia Beach', WA: 'Seattle', WV: 'Charleston', WI: 'Milwaukee',
  WY: 'Cheyenne',
};

/**
 * Get default crime data for a new player
 */
function getDefaultCrimeData(state: StateCode) {
  return {
    currentCity: STATE_CITIES[state] || 'Unknown',
    heat: 0,
    reputation: 0,
    carryCapacity: getCarryCapacityForLevel(1),
    inventory: [],
    level: 1,
    experience: 0,
    unlockedSubstances: getUnlockedSubstances(1),
    totalProfit: 0,
    totalDeals: 0,
    successfulDeals: 0,
    timesArrested: 0,
    timesMugged: 0,
    lastActiveAt: new Date(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserDoc = any;

/**
 * Map User document to CrimePlayerDTO
 */
function mapUserToCrimeDTO(user: UserDoc): CrimePlayerDTO {
  const crime = user.crime || {};
  const inventory = crime.inventory || [];
  const inventoryUsed = inventory.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const carryCapacity = crime.carryCapacity ?? 50;
  
  return {
    id: String(user._id),
    cash: user.cash ?? 0,
    bankBalance: user.bankBalance ?? 0,
    currentState: user.state as StateCode,
    currentCity: crime.currentCity ?? STATE_CITIES[user.state] ?? 'Unknown',
    heat: crime.heat ?? 0,
    reputation: crime.reputation ?? 0,
    carryCapacity,
    inventory: inventory,
    level: crime.level ?? 1,
    experience: crime.experience ?? 0,
    unlockedSubstances: crime.unlockedSubstances ?? ['Cannabis'],
    totalProfit: crime.totalProfit ?? 0,
    totalDeals: crime.totalDeals ?? 0,
    successfulDeals: crime.successfulDeals ?? 0,
    timesArrested: crime.timesArrested ?? 0,
    timesMugged: crime.timesMugged ?? 0,
    lastActiveAt: crime.lastActiveAt ?? new Date(),
    inventoryUsed,
    inventoryAvailable: Math.max(0, carryCapacity - inventoryUsed),
  };
}

/**
 * GET /api/crime/stash - Get player's crime data (auto-initializes)
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  try {
    await connectDB();

    // Get user with crime data
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return createErrorResponse('User not found', ErrorCode.NOT_FOUND, 404);
    }

    // Auto-initialize crime data if not present
    if (!user.crime) {
      const validStateCodes = ALL_STATES.map(s => s.code);
      const userState = (validStateCodes.includes(user.state as StateCode) 
        ? user.state 
        : 'CA') as StateCode;
      
      const crimeData = getDefaultCrimeData(userState);
      
      await User.findByIdAndUpdate(session.user.id, {
        $set: { crime: crimeData }
      });
      
      // Return with initialized data
      return createSuccessResponse(mapUserToCrimeDTO({ ...user, crime: crimeData }));
    }

    return createSuccessResponse(mapUserToCrimeDTO(user));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createSuccessResponse(null, { warning: 'DB DNS error fallback' });
    }
    console.error('GET /crime/stash error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/crime/stash - Reset player crime data to defaults
 * 
 * Body: { reset?: boolean } - If reset=true, wipes crime data to defaults
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const rl = await rateLimitRequest(request, session.user.id, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const shouldReset = body?.reset === true;

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return createErrorResponse('User not found', ErrorCode.NOT_FOUND, 404, rl.headers);
    }

    const validStateCodes = ALL_STATES.map(s => s.code);
    const userState = (validStateCodes.includes(user.state as StateCode) 
      ? user.state 
      : 'CA') as StateCode;

    if (shouldReset || !user.crime) {
      const crimeData = getDefaultCrimeData(userState);
      user.crime = crimeData;
      await user.save();
      
      return createSuccessResponse(mapUserToCrimeDTO(user.toObject()), {
        action: shouldReset ? 'reset' : 'initialized',
      }, shouldReset ? 200 : 201);
    }

    // Already initialized, just return current data
    return createSuccessResponse(mapUserToCrimeDTO(user.toObject()));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/stash error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
