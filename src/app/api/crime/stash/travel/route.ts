/**
 * @fileoverview Travel API - Interstate movement for Street Trading MMO
 * @module app/api/crime/stash/travel
 * 
 * OVERVIEW:
 * Handles player travel between US states:
 * - POST: Travel to a new state (updates User.state, User.crime)
 * 
 * Travel mechanics:
 * - Distance-based cost (gas, time)
 * - Heat decay during travel
 * - Random encounters (police, gangs, dealers)
 * - Inventory risk during transit
 * 
 * All data stored on User model (User.state, User.cash, User.crime subdocument)
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models';
import { rateLimitRequest } from '@/lib/utils/rateLimit';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { z } from 'zod';
import type { StateCode } from '@/lib/types/crime';
import type { TravelResult, TravelEncounter, TravelEncounterType, CrimePlayerDTO } from '@/lib/types/crime-mmo';
import { getCarryCapacityForLevel, getUnlockedSubstances } from '@/lib/types/crime-mmo';

// Valid US state codes (includes DC)
const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

// State capital cities for default city
const STATE_CAPITALS: Record<StateCode, string> = {
  AL: 'Montgomery', AK: 'Juneau', AZ: 'Phoenix', AR: 'Little Rock', CA: 'Sacramento',
  CO: 'Denver', CT: 'Hartford', DC: 'Washington', DE: 'Dover', FL: 'Tallahassee', GA: 'Atlanta',
  HI: 'Honolulu', ID: 'Boise', IL: 'Springfield', IN: 'Indianapolis', IA: 'Des Moines',
  KS: 'Topeka', KY: 'Frankfort', LA: 'Baton Rouge', ME: 'Augusta', MD: 'Annapolis',
  MA: 'Boston', MI: 'Lansing', MN: 'Saint Paul', MS: 'Jackson', MO: 'Jefferson City',
  MT: 'Helena', NE: 'Lincoln', NV: 'Carson City', NH: 'Concord', NJ: 'Trenton',
  NM: 'Santa Fe', NY: 'Albany', NC: 'Raleigh', ND: 'Bismarck', OH: 'Columbus',
  OK: 'Oklahoma City', OR: 'Salem', PA: 'Harrisburg', RI: 'Providence', SC: 'Columbia',
  SD: 'Pierre', TN: 'Nashville', TX: 'Austin', UT: 'Salt Lake City', VT: 'Montpelier',
  VA: 'Richmond', WA: 'Olympia', WV: 'Charleston', WI: 'Madison', WY: 'Cheyenne'
};

// Major cities by state (for city selection)
const MAJOR_CITIES: Record<string, string[]> = {
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland'],
  NY: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Springfield'],
  PA: ['Philadelphia', 'Pittsburgh', 'Harrisburg', 'Allentown'],
  // Add more as needed
};

/**
 * Travel request validation schema
 */
const travelRequestSchema = z.object({
  toState: z.enum(STATE_CODES),
  toCity: z.string().min(1).max(50).optional(),
});

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
    currentCity: crime.currentCity ?? 'Unknown',
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
 * Initialize crime data on user if not present
 */
function ensureCrimeData(user: UserDoc): void {
  if (!user.crime) {
    user.crime = {
      currentCity: STATE_CAPITALS[user.state as StateCode] || 'Unknown',
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
}

/**
 * Calculate travel cost based on origin and destination
 * Uses a simplified distance estimate
 */
function calculateTravelCost(fromState: StateCode, toState: StateCode): number {
  // Base cost + distance factor
  const BASE_COST = 50;
  const PER_STATE_COST = 25;
  
  // Simple distance approximation using state code index difference
  const fromIdx = STATE_CODES.indexOf(fromState);
  const toIdx = STATE_CODES.indexOf(toState);
  const distance = Math.abs(fromIdx - toIdx);
  
  // More realistic cost: base + distance-based
  const cost = BASE_COST + (distance * PER_STATE_COST);
  
  // Cap at reasonable amount
  return Math.min(cost, 500);
}

/**
 * Calculate travel time in game hours
 */
function calculateTravelTime(fromState: StateCode, toState: StateCode): number {
  const fromIdx = STATE_CODES.indexOf(fromState);
  const toIdx = STATE_CODES.indexOf(toState);
  const distance = Math.abs(fromIdx - toIdx);
  
  // Base 2 hours + 1 hour per "state distance"
  return Math.max(2, Math.min(24, 2 + distance));
}

/**
 * Calculate heat decay during travel (heat decreases while traveling)
 */
function calculateHeatDecay(currentHeat: number, travelTime: number): number {
  // Decay 5% of heat per hour of travel
  const decayRate = 0.05;
  const decay = currentHeat * decayRate * travelTime;
  return Math.max(0, currentHeat - decay);
}

/**
 * Determine if a travel encounter occurs and what type
 */
function rollEncounter(heat: number, reputation: number): TravelEncounter | null {
  // Base 10% chance of encounter, increases with heat
  const baseChance = 0.10;
  const heatBonus = (heat / 100) * 0.30; // Up to 30% more from heat
  const encounterChance = baseChance + heatBonus;
  
  if (Math.random() > encounterChance) {
    return null; // No encounter
  }
  
  // Determine encounter type based on reputation and luck
  const roll = Math.random();
  let type: TravelEncounterType;
  
  if (roll < 0.4) {
    type = 'police_checkpoint';
  } else if (roll < 0.6) {
    type = 'rival_gang';
  } else if (roll < 0.8) {
    type = 'random_deal';
  } else {
    type = 'safe_passage';
  }
  
  // Determine outcome
  const escapeChance = 0.6 + (reputation / 100) * 0.2; // Higher rep = better odds
  const escaped = Math.random() < escapeChance;
  
  // Calculate losses if caught
  const cashLoss = escaped ? 0 : Math.floor(Math.random() * 200 + 50);
  const heatChange = type === 'police_checkpoint' && !escaped ? 15 : (escaped ? -5 : 5);
  
  return {
    type,
    description: getEncounterDescription(type, escaped),
    outcome: escaped ? 'escaped' : (type === 'police_checkpoint' ? 'caught' : 'fought'),
    cashChange: -cashLoss,
    inventoryLost: {}, // For now, no inventory loss - could be expanded
    heatChange,
    healthDamage: escaped ? 0 : Math.floor(Math.random() * 10),
  };
}

/**
 * Get description for encounter
 */
function getEncounterDescription(type: TravelEncounterType, escaped: boolean): string {
  const descriptions: Record<TravelEncounterType, { escaped: string; caught: string }> = {
    police_checkpoint: {
      escaped: 'You spotted a police checkpoint ahead and took a detour.',
      caught: 'You were stopped at a police checkpoint. They found nothing but took some cash as a "donation".',
    },
    rival_gang: {
      escaped: 'Some thugs tried to jump you but you outran them.',
      caught: 'A gang caught you on the road and demanded tribute.',
    },
    random_deal: {
      escaped: 'You met a friendly dealer who shared some tips about the market.',
      caught: 'A rival dealer confronted you about moving in on their territory.',
    },
    informant: {
      escaped: 'You overheard some useful information at a rest stop.',
      caught: 'Someone was asking questions about you. You laid low.',
    },
    mugging: {
      escaped: 'Some muggers tried to rob you but you escaped.',
      caught: 'You got mugged on the road.',
    },
    safe_passage: {
      escaped: 'You found a shortcut that saved time.',
      caught: 'You took a detour that cost extra time and gas.',
    },
  };
  
  return descriptions[type]?.[escaped ? 'escaped' : 'caught'] || 'Something happened on the road.';
}

/**
 * POST /api/crime/stash/travel - Travel to a new state
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }

  const rl = await rateLimitRequest(request, session.user.id, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }

  try {
    const body = await request.json();
    const parsed = travelRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
    }

    const { toState, toCity } = parsed.data;

    await connectDB();

    // Get user with all data
    const user = await User.findById(session.user.id);
    if (!user) {
      return createErrorResponse('User not found', ErrorCode.NOT_FOUND, 404, rl.headers);
    }

    // Ensure crime data exists
    ensureCrimeData(user);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const crime = user.crime!;

    const fromState = user.state as StateCode;
    
    // Check if already in destination
    if (fromState === toState) {
      const result: TravelResult = {
        success: false,
        fromState,
        toState,
        costPaid: 0,
        timeTaken: 0,
        error: 'You are already in this state.',
      };
      return createSuccessResponse(result, {}, 200);
    }

    // Calculate travel cost and time
    const travelCost = calculateTravelCost(fromState, toState);
    const travelTime = calculateTravelTime(fromState, toState);

    // Check if player can afford travel
    if (user.cash < travelCost) {
      const result: TravelResult = {
        success: false,
        fromState,
        toState,
        costPaid: 0,
        timeTaken: 0,
        error: `Insufficient funds. Travel costs $${travelCost}, you have $${user.cash.toFixed(2)}.`,
      };
      return createSuccessResponse(result, {}, 200);
    }

    // Deduct travel cost
    user.cash -= travelCost;

    // Update location
    user.state = toState;
    
    // Determine destination city
    const destinationCity = toCity || STATE_CAPITALS[toState] || 'Unknown';
    crime.currentCity = destinationCity;

    // Apply heat decay
    const oldHeat = crime.heat;
    crime.heat = calculateHeatDecay(oldHeat, travelTime);

    // Roll for encounter
    const encounter = rollEncounter(oldHeat, crime.reputation);
    
    if (encounter) {
      // Apply encounter effects
      user.cash = Math.max(0, user.cash + encounter.cashChange);
      crime.heat = Math.max(0, Math.min(100, crime.heat + encounter.heatChange));
      
      if (encounter.outcome === 'caught' && encounter.type === 'police_checkpoint') {
        crime.timesArrested += 1;
      }
    }

    // Update last active
    crime.lastActiveAt = new Date();

    await user.save();

    const result: TravelResult = {
      success: true,
      fromState,
      toState,
      costPaid: travelCost,
      timeTaken: travelTime,
      encounter: encounter || undefined,
      updatedStash: mapUserToCrimeDTO(user),
    };

    return createSuccessResponse(result, { traveledAt: new Date().toISOString() }, 200);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('querySrv')) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/stash/travel error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
