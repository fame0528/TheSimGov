/**
 * @fileoverview Crime Pricing Seed Data - Initial state pricing for all 50 states + DC
 * @module lib/seed/crime-pricing
 * 
 * OVERVIEW:
 * Generates initial pricing data for all substances across all states.
 * Prices vary by region based on:
 * - Proximity to production/import centers
 * - State population and demand
 * - Legal status affecting supply
 * - Law enforcement intensity
 * 
 * @created 2025-12-04
 * @author ECHO v1.4.0 FLAWLESS PROTOCOL
 */

import type { StateCode, SubstanceName } from '@/lib/types/crime';
import type { SubstanceLegalStatus, PriceTrend } from '@/lib/types/crime-mmo';

/**
 * State data with name and regional modifiers
 */
interface StateData {
  code: StateCode;
  name: string;
  /** Price modifier (1.0 = baseline, <1 = cheaper, >1 = more expensive) */
  priceModifier: number;
  /** Law enforcement intensity 0-100 */
  lawEnforcement: number;
  /** Cannabis legal status */
  cannabisStatus: SubstanceLegalStatus;
}

/**
 * Base prices for each substance (per unit in dollars)
 */
export const BASE_SUBSTANCE_PRICES: Record<SubstanceName, number> = {
  Cannabis: 15,           // Weed: $15/gram baseline
  Psilocybin: 25,        // Shrooms: $25/gram
  MDMA: 30,              // Ecstasy: $30/pill
  LSD: 15,               // Acid: $15/tab
  Cocaine: 80,           // Coke: $80/gram
  Methamphetamine: 50,   // Meth: $50/gram
  Oxycodone: 25,         // Pills: $25/pill
  Heroin: 60,            // Heroin: $60/gram
  Fentanyl: 100,         // Fentanyl: $100/gram (high risk, high reward)
};

/**
 * Default legal status (most substances are illegal federally)
 */
export const DEFAULT_LEGAL_STATUS: Record<SubstanceName, SubstanceLegalStatus> = {
  Cannabis: 'illegal',
  Psilocybin: 'illegal',
  MDMA: 'illegal',
  LSD: 'illegal',
  Cocaine: 'felony',
  Methamphetamine: 'felony',
  Oxycodone: 'illegal', // Controlled substance
  Heroin: 'felony',
  Fentanyl: 'felony',
};

/**
 * All 50 states + DC with regional price modifiers and cannabis status
 */
export const STATE_DATA: StateData[] = [
  // West Coast - Cannabis cheap, production hub
  { code: 'CA', name: 'California', priceModifier: 0.8, lawEnforcement: 40, cannabisStatus: 'legal' },
  { code: 'OR', name: 'Oregon', priceModifier: 0.75, lawEnforcement: 35, cannabisStatus: 'legal' },
  { code: 'WA', name: 'Washington', priceModifier: 0.8, lawEnforcement: 40, cannabisStatus: 'legal' },
  { code: 'NV', name: 'Nevada', priceModifier: 0.9, lawEnforcement: 50, cannabisStatus: 'legal' },
  { code: 'AZ', name: 'Arizona', priceModifier: 0.95, lawEnforcement: 60, cannabisStatus: 'legal' },
  { code: 'AK', name: 'Alaska', priceModifier: 1.3, lawEnforcement: 30, cannabisStatus: 'legal' },
  { code: 'HI', name: 'Hawaii', priceModifier: 1.4, lawEnforcement: 45, cannabisStatus: 'decriminalized' },
  
  // Mountain West
  { code: 'CO', name: 'Colorado', priceModifier: 0.7, lawEnforcement: 35, cannabisStatus: 'legal' },
  { code: 'NM', name: 'New Mexico', priceModifier: 0.9, lawEnforcement: 55, cannabisStatus: 'legal' },
  { code: 'UT', name: 'Utah', priceModifier: 1.2, lawEnforcement: 75, cannabisStatus: 'illegal' },
  { code: 'ID', name: 'Idaho', priceModifier: 1.15, lawEnforcement: 70, cannabisStatus: 'illegal' },
  { code: 'MT', name: 'Montana', priceModifier: 1.1, lawEnforcement: 45, cannabisStatus: 'legal' },
  { code: 'WY', name: 'Wyoming', priceModifier: 1.2, lawEnforcement: 55, cannabisStatus: 'illegal' },
  
  // Southwest - Border states, different dynamics
  { code: 'TX', name: 'Texas', priceModifier: 0.85, lawEnforcement: 80, cannabisStatus: 'illegal' },
  
  // Midwest
  { code: 'IL', name: 'Illinois', priceModifier: 1.0, lawEnforcement: 60, cannabisStatus: 'legal' },
  { code: 'MI', name: 'Michigan', priceModifier: 0.9, lawEnforcement: 50, cannabisStatus: 'legal' },
  { code: 'MN', name: 'Minnesota', priceModifier: 1.05, lawEnforcement: 50, cannabisStatus: 'legal' },
  { code: 'WI', name: 'Wisconsin', priceModifier: 1.1, lawEnforcement: 55, cannabisStatus: 'illegal' },
  { code: 'IA', name: 'Iowa', priceModifier: 1.15, lawEnforcement: 60, cannabisStatus: 'illegal' },
  { code: 'MO', name: 'Missouri', priceModifier: 1.0, lawEnforcement: 65, cannabisStatus: 'legal' },
  { code: 'KS', name: 'Kansas', priceModifier: 1.2, lawEnforcement: 70, cannabisStatus: 'illegal' },
  { code: 'NE', name: 'Nebraska', priceModifier: 1.2, lawEnforcement: 65, cannabisStatus: 'illegal' },
  { code: 'SD', name: 'South Dakota', priceModifier: 1.25, lawEnforcement: 60, cannabisStatus: 'illegal' },
  { code: 'ND', name: 'North Dakota', priceModifier: 1.25, lawEnforcement: 55, cannabisStatus: 'illegal' },
  { code: 'OH', name: 'Ohio', priceModifier: 1.05, lawEnforcement: 60, cannabisStatus: 'legal' },
  { code: 'IN', name: 'Indiana', priceModifier: 1.1, lawEnforcement: 70, cannabisStatus: 'illegal' },
  
  // South
  { code: 'FL', name: 'Florida', priceModifier: 1.1, lawEnforcement: 70, cannabisStatus: 'decriminalized' },
  { code: 'GA', name: 'Georgia', priceModifier: 1.05, lawEnforcement: 75, cannabisStatus: 'decriminalized' },
  { code: 'NC', name: 'North Carolina', priceModifier: 1.1, lawEnforcement: 65, cannabisStatus: 'decriminalized' },
  { code: 'SC', name: 'South Carolina', priceModifier: 1.15, lawEnforcement: 75, cannabisStatus: 'illegal' },
  { code: 'VA', name: 'Virginia', priceModifier: 1.1, lawEnforcement: 60, cannabisStatus: 'legal' },
  { code: 'WV', name: 'West Virginia', priceModifier: 1.15, lawEnforcement: 55, cannabisStatus: 'decriminalized' },
  { code: 'KY', name: 'Kentucky', priceModifier: 1.1, lawEnforcement: 65, cannabisStatus: 'illegal' },
  { code: 'TN', name: 'Tennessee', priceModifier: 1.1, lawEnforcement: 70, cannabisStatus: 'illegal' },
  { code: 'AL', name: 'Alabama', priceModifier: 1.15, lawEnforcement: 75, cannabisStatus: 'illegal' },
  { code: 'MS', name: 'Mississippi', priceModifier: 1.1, lawEnforcement: 65, cannabisStatus: 'decriminalized' },
  { code: 'LA', name: 'Louisiana', priceModifier: 1.0, lawEnforcement: 70, cannabisStatus: 'decriminalized' },
  { code: 'AR', name: 'Arkansas', priceModifier: 1.1, lawEnforcement: 65, cannabisStatus: 'decriminalized' },
  { code: 'OK', name: 'Oklahoma', priceModifier: 1.0, lawEnforcement: 60, cannabisStatus: 'decriminalized' },
  
  // Northeast - High prices, high demand
  { code: 'NY', name: 'New York', priceModifier: 1.3, lawEnforcement: 55, cannabisStatus: 'legal' },
  { code: 'NJ', name: 'New Jersey', priceModifier: 1.25, lawEnforcement: 60, cannabisStatus: 'legal' },
  { code: 'PA', name: 'Pennsylvania', priceModifier: 1.15, lawEnforcement: 60, cannabisStatus: 'decriminalized' },
  { code: 'MA', name: 'Massachusetts', priceModifier: 1.2, lawEnforcement: 45, cannabisStatus: 'legal' },
  { code: 'CT', name: 'Connecticut', priceModifier: 1.2, lawEnforcement: 50, cannabisStatus: 'legal' },
  { code: 'RI', name: 'Rhode Island', priceModifier: 1.15, lawEnforcement: 45, cannabisStatus: 'legal' },
  { code: 'VT', name: 'Vermont', priceModifier: 1.1, lawEnforcement: 35, cannabisStatus: 'legal' },
  { code: 'NH', name: 'New Hampshire', priceModifier: 1.15, lawEnforcement: 50, cannabisStatus: 'decriminalized' },
  { code: 'ME', name: 'Maine', priceModifier: 1.1, lawEnforcement: 40, cannabisStatus: 'legal' },
  { code: 'MD', name: 'Maryland', priceModifier: 1.2, lawEnforcement: 55, cannabisStatus: 'legal' },
  { code: 'DE', name: 'Delaware', priceModifier: 1.15, lawEnforcement: 55, cannabisStatus: 'legal' },
  { code: 'DC', name: 'District of Columbia', priceModifier: 1.25, lawEnforcement: 50, cannabisStatus: 'legal' },
];

/**
 * Generate initial pricing for a single state
 */
export function generateStatePricing(stateData: StateData): {
  state: StateCode;
  stateName: string;
  prices: Array<{
    substance: SubstanceName;
    basePrice: number;
    currentPrice: number;
    trend: PriceTrend;
    volatility: number;
    demand: number;
    supply: number;
    lastUpdate: Date;
  }>;
  legalStatus: Record<string, SubstanceLegalStatus>;
  lawEnforcementIntensity: number;
  playerProductionVolume: number;
  activeEvents: never[];
  lastUpdate: Date;
} {
  const now = new Date();
  
  // Generate prices for each substance
  const prices = (Object.entries(BASE_SUBSTANCE_PRICES) as [SubstanceName, number][]).map(
    ([substance, basePrice]) => {
      // Apply state modifier
      let adjustedPrice = basePrice * stateData.priceModifier;
      
      // Cannabis gets extra discount in legal states
      if (substance === 'Cannabis' && stateData.cannabisStatus === 'legal') {
        adjustedPrice *= 0.7;
      } else if (substance === 'Cannabis' && stateData.cannabisStatus === 'decriminalized') {
        adjustedPrice *= 0.85;
      }
      
      // Add some randomness (±10%)
      const variance = 0.9 + Math.random() * 0.2;
      const currentPrice = Math.round(adjustedPrice * variance * 100) / 100;
      
      // Determine trend based on variance
      let trend: PriceTrend = 'stable';
      if (variance > 1.05) trend = 'rising';
      else if (variance < 0.95) trend = 'falling';
      
      return {
        substance,
        basePrice: Math.round(adjustedPrice * 100) / 100,
        currentPrice,
        trend,
        volatility: 15 + Math.floor(Math.random() * 30), // 15-45%
        demand: 40 + Math.floor(Math.random() * 30), // 40-70%
        supply: 40 + Math.floor(Math.random() * 30), // 40-70%
        lastUpdate: now,
      };
    }
  );
  
  // Build legal status map
  const legalStatus: Record<string, SubstanceLegalStatus> = {};
  for (const substance of Object.keys(DEFAULT_LEGAL_STATUS) as SubstanceName[]) {
    if (substance === 'Cannabis') {
      legalStatus[substance] = stateData.cannabisStatus;
    } else {
      legalStatus[substance] = DEFAULT_LEGAL_STATUS[substance];
    }
  }
  
  return {
    state: stateData.code,
    stateName: stateData.name,
    prices,
    legalStatus,
    lawEnforcementIntensity: stateData.lawEnforcement,
    playerProductionVolume: 0,
    activeEvents: [],
    lastUpdate: now,
  };
}

/**
 * Generate all state pricing data
 */
export function generateAllStatePricing() {
  return STATE_DATA.map(generateStatePricing);
}

/**
 * Seed function to insert all pricing data
 */
export async function seedCrimePricing() {
  // Dynamic import to avoid circular dependencies
  const { StatePricing } = await import('@/lib/db/models/crime/StatePricing');
  
  const pricingData = generateAllStatePricing();
  
  // Upsert each state's pricing
  const results = await Promise.all(
    pricingData.map(data =>
      StatePricing.findOneAndUpdate(
        { state: data.state },
        { $set: data },
        { upsert: true, new: true }
      )
    )
  );
  
  console.log(`[seedCrimePricing] Seeded pricing for ${results.length} states`);
  return results;
}

export default seedCrimePricing;
