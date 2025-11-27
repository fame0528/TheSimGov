/**
 * @file src/lib/utils/politicalInfluence.ts
 * @description Political influence calculation and management utilities
 * @created 2025-11-24
 *
 * OVERVIEW:
 * Core logic for political system mechanics including influence point calculations,
 * lobbying success probability, government contract access, and donation caps.
 * Integrates with company level system for progressive political power.
 *
 * FEATURES:
 * - Influence points from donations (logarithmic scaling)
 * - Lobbying success probability calculation
 * - Government contract access determination
 * - "Run for Office" eligibility (Level 5 only)
 * - Political power by company level
 *
 * USAGE:
 * ```typescript
 * import { calculateInfluencePoints, canLobby, getLobbyingSuccessProbability } from '@/lib/utils/politicalInfluence';
 *
 * // Calculate influence from donation
 * const influence = calculateInfluencePoints(50000, 3);
 *
 * // Check lobbying eligibility
 * const eligible = canLobby(company);
 *
 * // Calculate lobbying success
 * const probability = getLobbyingSuccessProbability(company, 'Tax', 25);
 * ```
 */

import { CompanyLevel } from '@/lib/types/game';
import { LegislationType } from '@/lib/db/models/LobbyingAction';

/**
 * Political influence capabilities by level
 */
interface PoliticalInfluence {
  canDonateToCampaigns: boolean;
  maxDonationAmount: number;
  canLobby: boolean;
  lobbyingPowerPoints: number;
  canInfluenceTradePolicy: boolean;
  canInfluenceTaxPolicy: boolean;
  governmentContractAccess: boolean;
  canRunForOffice: boolean;
}

/**
 * Political influence by company level
 */
export const POLITICAL_INFLUENCE: Record<CompanyLevel, PoliticalInfluence> = {
  1: {
    canDonateToCampaigns: false,
    maxDonationAmount: 0,
    canLobby: false,
    lobbyingPowerPoints: 0,
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true,
    canRunForOffice: false,
  },
  2: {
    canDonateToCampaigns: true,
    maxDonationAmount: 5000,
    canLobby: false,
    lobbyingPowerPoints: 0,
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true,
    canRunForOffice: false,
  },
  3: {
    canDonateToCampaigns: true,
    maxDonationAmount: 50000,
    canLobby: true,
    lobbyingPowerPoints: 10,
    canInfluenceTradePolicy: false,
    canInfluenceTaxPolicy: false,
    governmentContractAccess: true,
    canRunForOffice: true,
  },
  4: {
    canDonateToCampaigns: true,
    maxDonationAmount: 500000,
    canLobby: true,
    lobbyingPowerPoints: 50,
    canInfluenceTradePolicy: true,
    canInfluenceTaxPolicy: true,
    governmentContractAccess: true,
    canRunForOffice: true,
  },
  5: {
    canDonateToCampaigns: true,
    maxDonationAmount: 10000000,
    canLobby: true,
    lobbyingPowerPoints: 200,
    canInfluenceTradePolicy: true,
    canInfluenceTaxPolicy: true,
    governmentContractAccess: true,
    canRunForOffice: true,
  },
};

/**
 * Calculate influence points from a campaign donation
 *
 * Uses logarithmic scaling to prevent runaway influence from mega-donations.
 * Higher company levels get bonus influence multipliers.
 *
 * Formula: baseInfluence = log10(amount / 100) * 10 * levelMultiplier
 *
 * @param amount - Donation amount in dollars
 * @param level - Company level (1-5)
 * @returns Influence points gained
 *
 * @example
 * calculateInfluencePoints(10000, 3)   // $10k at L3 → ~25 influence
 * calculateInfluencePoints(100000, 4)  // $100k at L4 → ~48 influence
 * calculateInfluencePoints(1000000, 5) // $1M at L5 → ~80 influence
 */
export function calculateInfluencePoints(amount: number, level: CompanyLevel): number {
  if (amount < 100) return 0;

  // Logarithmic base influence (prevents exponential scaling)
  const baseInfluence = Math.log10(amount / 100) * 10;

  // Level multipliers for political power
  const levelMultipliers: Record<CompanyLevel, number> = {
    1: 1.0,
    2: 1.2,
    3: 1.5,
    4: 2.0,
    5: 3.0,
  };

  const multiplier = levelMultipliers[level] || 1.0;

  return Math.floor(baseInfluence * multiplier);
}

/**
 * Check if company can make campaign donations
 *
 * Level 2+ can donate (with increasing caps by level)
 *
 * @param level - Company level
 * @returns True if company can donate
 */
export function canDonate(level: CompanyLevel): boolean {
  return POLITICAL_INFLUENCE[level].canDonateToCampaigns;
}

/**
 * Get maximum donation amount for company level
 *
 * @param level - Company level
 * @returns Maximum donation amount in dollars
 *
 * @example
 * getMaxDonation(2) // $5,000
 * getMaxDonation(3) // $50,000
 * getMaxDonation(5) // $10,000,000
 */
export function getMaxDonation(level: CompanyLevel): number {
  return POLITICAL_INFLUENCE[level].maxDonationAmount;
}

/**
 * Check if company can lobby for legislation
 *
 * Level 3+ can lobby (with increasing power by level)
 *
 * @param level - Company level
 * @returns True if company can lobby
 */
export function canLobby(level: CompanyLevel): boolean {
  return POLITICAL_INFLUENCE[level].canLobby;
}

/**
 * Get lobbying power points for company level
 *
 * @param level - Company level
 * @returns Lobbying power points available
 *
 * @example
 * getLobbyingPower(3) // 10 points
 * getLobbyingPower(4) // 50 points
 * getLobbyingPower(5) // 200 points
 */
export function getLobbyingPower(level: CompanyLevel): number {
  return POLITICAL_INFLUENCE[level].lobbyingPowerPoints;
}

/**
 * Calculate lobbying success probability
 *
 * Factors:
 * - Company level (higher = more influence)
 * - Influence points spent (more spending = higher chance)
 * - Legislation type (some easier than others)
 * - Company influence history (total accumulated influence)
 *
 * @param company - Company document
 * @param legislationType - Type of legislation being lobbied
 * @param influencePointsCost - Influence points being spent
 * @param totalInfluence - Total accumulated influence points (from donations + previous lobbying)
 * @returns Success probability (0-100)
 *
 * @example
 * getLobbyingSuccessProbability(company, 'Tax', 25, 150) // ~72% chance
 */
export function getLobbyingSuccessProbability(
  company: { level: CompanyLevel; reputation: number },
  legislationType: LegislationType,
  influencePointsCost: number,
  totalInfluence: number
): number {
  // Base probability by legislation type (difficulty)
  const legislationDifficulty: Record<LegislationType, number> = {
    Tax: 50,        // Moderate difficulty
    Subsidy: 60,    // Easier (direct benefit)
    Regulation: 45, // Harder (affects many)
    Trade: 40,      // Harder (geopolitical)
    Labor: 55,      // Moderate
    Environment: 35, // Hardest (public scrutiny)
  };

  const baseProbability = legislationDifficulty[legislationType] || 50;

  // Level bonus (+5% per level above 3)
  const levelBonus = (company.level - 3) * 5;

  // Influence spending bonus (logarithmic, +10% per 10 points)
  const spendingBonus = Math.log10(influencePointsCost + 1) * 10;

  // Total influence bonus (+1% per 50 total influence)
  const influenceBonus = Math.floor(totalInfluence / 50);

  // Reputation bonus (+0.5% per reputation point above 50)
  const reputationBonus = Math.max(0, company.reputation - 50) * 0.5;

  // Total probability (capped at 95%, minimum 5%)
  const totalProbability = Math.min(
    95,
    Math.max(
      5,
      baseProbability + levelBonus + spendingBonus + influenceBonus + reputationBonus
    )
  );

  return Math.round(totalProbability);
}

/**
 * Get political capabilities for a company level
 *
 * @param level - Company level
 * @returns Complete political influence object
 */
export function getPoliticalCapabilities(level: CompanyLevel): PoliticalInfluence {
  return POLITICAL_INFLUENCE[level];
}

/**
 * Calculate total accumulated influence for a company
 *
 * Combines influence from donations, successful lobbying, and base level power
 *
 * @param totalDonations - Total donation amount in dollars
 * @param successfulLobbies - Count of successful lobbying actions
 * @param level - Company level
 * @returns Total political influence score
 */
export function calculateTotalInfluence(
  totalDonations: number,
  successfulLobbies: number,
  level: CompanyLevel
): number {
  // Influence from donations (logarithmic)
  const donationInfluence = calculateInfluencePoints(totalDonations, level);

  // Influence from lobbying (25 points per successful action)
  const lobbyingInfluence = successfulLobbies * 25;

  // Base influence from level
  const baseInfluence = getLobbyingPower(level);

  return donationInfluence + lobbyingInfluence + baseInfluence;
}

/**
 * Check if company can run for political office
 *
 * Only Level 5 companies can run for office
 *
 * @param level - Company level
 * @returns True if company can run for office
 */
export function canRunForOffice(level: CompanyLevel): boolean {
  return POLITICAL_INFLUENCE[level].canRunForOffice;
}

/**
 * Get allowed political actions for company level
 *
 * @param level - Company level
 * @returns Array of allowed action strings
 */
export function getAllowedPoliticalActions(level: CompanyLevel): string[] {
  const influence = POLITICAL_INFLUENCE[level];
  const actions: string[] = [];

  if (influence.canDonateToCampaigns) actions.push('donate');
  if (influence.canLobby) actions.push('lobby');
  if (influence.canInfluenceTradePolicy) actions.push('trade-policy');
  if (influence.canInfluenceTaxPolicy) actions.push('tax-policy');
  if (influence.canRunForOffice) actions.push('run-for-office');

  return actions;
}