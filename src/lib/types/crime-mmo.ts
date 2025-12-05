/**
 * @fileoverview Crime MMO Types - Street Trading, Production, and Cartel Systems
 * @module lib/types/crime-mmo
 * 
 * OVERVIEW:
 * Type definitions for the Dope Wars MMO system including:
 * - Player stash (inventory, cash, location, progression)
 * - Dynamic state pricing with supply/demand
 * - Travel routes between states
 * - Trading transactions
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import type { StateCode, SubstanceName } from './crime';

// ============================================================
// ALL STATES CONSTANT
// ============================================================

/**
 * All US states and DC with codes and full names
 */
export const ALL_STATES: { code: StateCode; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// ============================================================
// PLAYER CRIME DATA (Now embedded in User.crime)
// ============================================================

/**
 * Individual drug item in player inventory
 */
export interface DrugInventoryItem {
  /** Substance type from catalog */
  substance: SubstanceName;
  /** Strain name for cannabis variants (optional) */
  strain?: string;
  /** Number of units held */
  quantity: number;
  /** Quality rating 0-100 (affects sale price) */
  quality: number;
  /** Average purchase price per unit (for P&L tracking) */
  avgPurchasePrice: number;
  /** When this batch was acquired */
  acquiredAt: Date;
}

/**
 * DTO for player crime data API responses
 * Maps from User model with embedded crime subdocument
 */
export interface CrimePlayerDTO {
  /** User ID */
  id: string;
  /** Current cash on hand */
  cash: number;
  /** Money stored in bank (safe from mugging) */
  bankBalance: number;
  /** Current state location (from User.state) */
  currentState: StateCode;
  /** Current city within state */
  currentCity: string;
  /** Law enforcement attention level 0-100 */
  heat: number;
  /** Street reputation 0-100 (affects prices, access) */
  reputation: number;
  /** Maximum units player can carry (upgradeable) */
  carryCapacity: number;
  /** Current drug inventory */
  inventory: DrugInventoryItem[];
  /** Street level 1-100 */
  level: number;
  /** Experience points toward next level */
  experience: number;
  /** Substances player has unlocked access to */
  unlockedSubstances: SubstanceName[];
  /** Lifetime profit from all deals */
  totalProfit: number;
  /** Total deals attempted */
  totalDeals: number;
  /** Successful deals completed */
  successfulDeals: number;
  /** Times arrested by law enforcement */
  timesArrested: number;
  /** Times mugged by NPCs or players */
  timesMugged: number;
  /** Timestamp of last activity */
  lastActiveAt: Date;
  /** Calculated: current inventory units used */
  inventoryUsed: number;
  /** Calculated: available carry capacity */
  inventoryAvailable: number;
}

/**
 * @deprecated Use CrimePlayerDTO instead - PlayerStash model removed
 */
export type PlayerStashDTO = CrimePlayerDTO;

// ============================================================
// DYNAMIC PRICING
// ============================================================

/**
 * Price trend direction
 */
export type PriceTrend = 'rising' | 'falling' | 'stable';

/**
 * Single substance price entry for a state
 */
export interface SubstancePriceEntry {
  /** Substance name */
  substance: SubstanceName;
  /** Base price before modifiers */
  basePrice: number;
  /** Current price after all modifiers */
  currentPrice: number;
  /** Price trend direction */
  trend: PriceTrend;
  /** Price volatility 0-100 (how much it fluctuates) */
  volatility: number;
  /** Demand level 0-100 */
  demand: number;
  /** Supply level 0-100 (affected by player production) */
  supply: number;
  /** Last price update timestamp */
  lastUpdate: Date;
}

/**
 * Legal status of a substance in a jurisdiction
 */
export type SubstanceLegalStatus = 'legal' | 'decriminalized' | 'illegal' | 'felony';

/**
 * Active market event affecting prices
 */
export interface MarketEvent {
  /** Event type identifier */
  type: 'drought' | 'bust' | 'festival' | 'legalization_vote' | 'surplus' | 'crackdown';
  /** Affected substance (or null for all) */
  substance?: SubstanceName;
  /** Price multiplier (0.5 = half, 2.0 = double) */
  priceModifier: number;
  /** When event expires */
  expiresAt: Date;
  /** Human-readable description */
  description: string;
}

/**
 * State-level pricing data for all substances
 */
export interface StatePricingBase {
  /** State code */
  state: StateCode;
  /** Full state name */
  stateName: string;
  /** Prices for all substances in this state */
  prices: SubstancePriceEntry[];
  /** Legal status per substance */
  legalStatus: Partial<Record<SubstanceName, SubstanceLegalStatus>>;
  /** Law enforcement intensity 0-100 */
  lawEnforcementIntensity: number;
  /** Total player production volume (affects supply) */
  playerProductionVolume: number;
  /** Currently active market events */
  activeEvents: MarketEvent[];
  /** Last full price update */
  lastUpdate: Date;
}

/**
 * DTO for state pricing API responses
 */
export interface StatePricingDTO extends StatePricingBase {
  id: string;
}

// ============================================================
// TRAVEL SYSTEM
// ============================================================

/**
 * Encounter types during travel
 */
export type TravelEncounterType = 
  | 'police_checkpoint'
  | 'rival_gang'
  | 'mugging'
  | 'random_deal'
  | 'informant'
  | 'safe_passage';

/**
 * Encounter chance configuration
 */
export interface EncounterChance {
  type: TravelEncounterType;
  /** Base chance 0-100 */
  chance: number;
}

/**
 * Travel route between two states
 */
export interface TravelRoute {
  /** Origin state */
  fromState: StateCode;
  /** Destination state */
  toState: StateCode;
  /** Distance in miles */
  distance: number;
  /** Base travel time in game hours */
  baseTravelTime: number;
  /** Base travel cost (gas, tickets) */
  baseCost: number;
  /** Base risk level 0-100 */
  baseRiskLevel: number;
  /** Encounter probabilities for this route */
  encounterTypes: EncounterChance[];
}

/**
 * Calculated travel info for player (with modifiers applied)
 */
export interface TravelInfo extends TravelRoute {
  /** Actual time after vehicle/upgrades */
  actualTime: number;
  /** Actual cost after discounts */
  actualCost: number;
  /** Actual risk after heat level applied */
  actualRisk: number;
  /** Can player afford this trip */
  canAfford: boolean;
  /** Warning messages (high heat, etc) */
  warnings: string[];
}

// ============================================================
// TRADING TRANSACTIONS
// ============================================================

/**
 * Trade action type
 */
export type TradeAction = 'buy' | 'sell';

/**
 * Trading request payload
 */
export interface TradeRequest {
  /** Buy or sell */
  action: TradeAction;
  /** Substance to trade */
  substance: SubstanceName;
  /** Number of units */
  quantity: number;
  /** State where trade occurs (must match player location) */
  state: StateCode;
}

/**
 * Trading result
 */
export interface TradeResult {
  /** Whether trade succeeded */
  success: boolean;
  /** Buy or sell */
  action: TradeAction;
  /** Substance traded */
  substance: SubstanceName;
  /** Units traded */
  quantity: number;
  /** Price per unit at time of trade */
  pricePerUnit: number;
  /** Total amount (quantity × price) */
  totalAmount: number;
  /** Heat change from this trade */
  heatChange: number;
  /** Experience gained */
  experienceGained: number;
  /** Error message if failed */
  error?: string;
  /** Updated player stash after trade */
  updatedStash?: PlayerStashDTO;
}

// ============================================================
// TRAVEL TRANSACTIONS
// ============================================================

/**
 * Travel request payload
 */
export interface TravelRequest {
  /** Destination state */
  toState: StateCode;
  /** Destination city (optional, defaults to capital) */
  toCity?: string;
}

/**
 * Travel result
 */
export interface TravelResult {
  /** Whether travel succeeded */
  success: boolean;
  /** Origin state */
  fromState: StateCode;
  /** Destination state */
  toState: StateCode;
  /** Travel cost paid */
  costPaid: number;
  /** Travel time in game hours */
  timeTaken: number;
  /** Encounter that occurred (if any) */
  encounter?: TravelEncounter;
  /** Error message if failed */
  error?: string;
  /** Updated player stash after travel */
  updatedStash?: PlayerStashDTO;
}

/**
 * Travel encounter result
 */
export interface TravelEncounter {
  /** Type of encounter */
  type: TravelEncounterType;
  /** What happened */
  description: string;
  /** Outcome of encounter */
  outcome: 'escaped' | 'caught' | 'fought' | 'bribed' | 'dealt';
  /** Cash lost/gained */
  cashChange: number;
  /** Inventory lost (substance → quantity) */
  inventoryLost: Partial<Record<SubstanceName, number>>;
  /** Heat change */
  heatChange: number;
  /** Health damage (if applicable) */
  healthDamage: number;
}

// ============================================================
// EXPERIENCE & LEVELING
// ============================================================

/**
 * Experience thresholds per level
 */
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  10: 5000,
  15: 15000,
  20: 35000,
  25: 75000,
  30: 150000,
  40: 400000,
  50: 1000000,
  75: 5000000,
  100: 25000000,
};

/**
 * Substances unlocked at each level
 */
export const SUBSTANCE_UNLOCK_LEVELS: Record<SubstanceName, number> = {
  Cannabis: 1,        // Start with weed
  Psilocybin: 5,     // Shrooms at level 5
  MDMA: 10,          // Ecstasy at level 10
  LSD: 15,           // Acid at level 15
  Cocaine: 20,       // Coke at level 20
  Methamphetamine: 30, // Meth at level 30
  Oxycodone: 40,     // Pills at level 40
  Heroin: 50,        // Heroin at level 50
  Fentanyl: 75,      // Fentanyl at level 75 (endgame)
};

/**
 * Base carry capacity increases per level
 */
export const CARRY_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 50,
  5: 75,
  10: 100,
  15: 150,
  20: 200,
  30: 300,
  40: 400,
  50: 500,
  75: 750,
  100: 1000,
};

/**
 * Calculate level from experience
 */
export function calculateLevelFromExperience(experience: number): number {
  const levels = Object.entries(LEVEL_THRESHOLDS)
    .map(([level, xp]) => ({ level: parseInt(level), xp }))
    .sort((a, b) => b.xp - a.xp);
  
  for (const { level, xp } of levels) {
    if (experience >= xp) {
      return level;
    }
  }
  return 1;
}

/**
 * Get unlocked substances for a level
 */
export function getUnlockedSubstances(level: number): SubstanceName[] {
  return Object.entries(SUBSTANCE_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => level >= unlockLevel)
    .map(([substance]) => substance as SubstanceName);
}

/**
 * Get carry capacity for a level
 */
export function getCarryCapacityForLevel(level: number): number {
  const capacities = Object.entries(CARRY_CAPACITY_BY_LEVEL)
    .map(([lvl, cap]) => ({ level: parseInt(lvl), capacity: cap }))
    .sort((a, b) => b.level - a.level);
  
  for (const { level: lvl, capacity } of capacities) {
    if (level >= lvl) {
      return capacity;
    }
  }
  return 50;
}
