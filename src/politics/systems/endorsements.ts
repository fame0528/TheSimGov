/**
 * @fileoverview Endorsements System - Political Influence Transfer with Diminishing Returns
 * 
 * Implements endorsement mechanics where politicians can transfer influence through public support
 * of other candidates. Features stacking diminishing returns, cooldown enforcement, reciprocal
 * bonuses for mutual endorsements, and credibility costs based on polling gaps.
 * 
 * **Core Features:**
 * - **Diminishing Returns**: First endorsement = 1.0x, second = 0.6x, third = 0.36x (power of 0.6)
 * - **Cooldown System**: 1 game-year minimum between endorsements (1 real hour at 168× acceleration)
 * - **Reciprocal Bonus**: Mutual endorsements provide +10% additional benefit to both parties
 * - **Credibility Impact**: Endorsing lower-polling candidate costs credibility proportional to gap
 * - **Offline Fair**: All calculations deterministic, no advantage for online vs offline players
 * 
 * **Time Model Integration:**
 * - Uses timeScaling.ts for 168× game-time to real-time conversion
 * - Cooldown = 1 game-year = 8,760 game hours = 52.14 real hours (rounds to 1 real hour)
 * - All timestamps in real-time (Date objects), converted for game-year checks
 * 
 * **Example Endorsement Stack:**
 * ```typescript
 * // Candidate A (60% polling) receives 3 endorsements:
 * const endorsements = [
 *   { endorser: 'Senator Smith', influence: 10.0, polling: 45 }, // 1st: 10.0 × 1.0 = 10.0pp
 *   { endorser: 'Governor Jones', influence: 8.0, polling: 40 }, // 2nd: 8.0 × 0.6 = 4.8pp
 *   { endorser: 'Rep. Lee', influence: 5.0, polling: 35 }        // 3rd: 5.0 × 0.36 = 1.8pp
 * ];
 * // Total boost = 10.0 + 4.8 + 1.8 = 16.6 polling points
 * ```
 * 
 * **Reciprocal Example:**
 * ```typescript
 * // A endorses B, B endorses A = mutual endorsement
 * const aBoost = calculateEndorsementBoost(endorsementsToA, 55); // Base: 12.0pp
 * const bBoost = calculateEndorsementBoost(endorsementsToB, 48); // Base: 9.5pp
 * // With reciprocal bonus:
 * const aFinal = aBoost * 1.10; // 13.2pp (10% bonus)
 * const bFinal = bBoost * 1.10; // 10.45pp (10% bonus)
 * ```
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1 (GUARDIAN Protocol)
 */

import { GAME_WEEKS_PER_YEAR } from '../utils/timeScaling';

/**
 * TUNABLE CONSTANTS - Endorsement System Parameters
 * 
 * Adjust these values to balance endorsement impact vs strategic depth.
 * All values tested for fairness and gameplay engagement.
 */

/**
 * Diminishing returns exponent for stacked endorsements.
 * 
 * Formula: influence × (DIMINISHING_RETURNS_FACTOR ^ endorsementCount)
 * - Value = 0.6: Each additional endorsement worth 60% of previous
 * - 1st endorsement: 1.0× (100%)
 * - 2nd endorsement: 0.6× (60%)
 * - 3rd endorsement: 0.36× (36%)
 * - 4th endorsement: 0.216× (21.6%)
 * 
 * **Rationale:**
 * - Prevents endorsement spamming (10 weak endorsements < 3 strong ones)
 * - Encourages quality over quantity
 * - Makes early endorsements more valuable (strategic timing matters)
 * 
 * **Balance Notes:**
 * - 0.5 = too steep (4th endorsement worth only 12.5%)
 * - 0.7 = too generous (4th endorsement worth 34%)
 * - 0.6 = sweet spot for strategic depth
 */
export const DIMINISHING_RETURNS_FACTOR = 0.6;

/**
 * Reciprocal endorsement bonus multiplier.
 * 
 * When two candidates endorse each other (A → B and B → A), both receive
 * an additional bonus multiplier on their total endorsement boost.
 * 
 * - Value = 1.10: +10% bonus to total endorsement influence
 * - Applied AFTER diminishing returns calculated
 * 
 * **Example:**
 * - Candidate receives 15pp from stacked endorsements
 * - Reciprocal bonus: 15pp × 1.10 = 16.5pp final
 * 
 * **Rationale:**
 * - Encourages coalition building and alliances
 * - Rewards strategic partnerships vs one-way endorsements
 * - 10% bonus meaningful but not game-breaking
 * 
 * **Balance Notes:**
 * - 1.05 (5%) = too weak, doesn't incentivize reciprocity
 * - 1.20 (20%) = too strong, forces all endorsements to be mutual
 * - 1.10 (10%) = encourages but doesn't mandate mutual support
 */
export const RECIPROCAL_BONUS_MULTIPLIER = 1.10;

/**
 * Credibility cost multiplier per polling point gap.
 * 
 * When endorsing a candidate with lower polling, the endorser pays a credibility
 * cost proportional to the polling gap. This simulates political risk of backing
 * underdogs vs frontrunners.
 * 
 * Formula: credibilityCost = (endorserPolling - endorseePolling) × CREDIBILITY_COST_FACTOR
 * 
 * **Examples:**
 * - Endorser at 50%, endorsee at 30%: (50 - 30) × 0.02 = 0.4% credibility lost
 * - Endorser at 60%, endorsee at 45%: (60 - 45) × 0.02 = 0.3% credibility lost
 * - Endorser at 40%, endorsee at 55%: (40 - 55) × 0.02 = -0.3% (credibility GAINED!)
 * 
 * **Rationale:**
 * - Endorsing frontrunners is safe (low/no cost)
 * - Endorsing underdogs carries political risk (credibility loss)
 * - Endorsing someone polling higher than you provides credibility BOOST
 * - Creates strategic tension: help underdog ally vs protect own credibility
 * 
 * **Balance Notes:**
 * - 0.01 (1%) = too safe, no meaningful risk for endorsing underdogs
 * - 0.05 (5%) = too punishing, discourages helping struggling allies
 * - 0.02 (2%) = meaningful but manageable risk
 */
export const CREDIBILITY_COST_FACTOR = 0.02;

/**
 * Cooldown period for endorsements in game-years.
 * 
 * After making an endorsement, candidate must wait 1 game-year before making another.
 * 
 * **Time Conversion (168× acceleration):**
 * - 1 game-year = 8,760 game hours
 * - 8,760 ÷ 168 = 52.14 real hours
 * - Rounds to 1 real hour minimum cooldown
 * 
 * **Rationale:**
 * - Prevents endorsement spam (can't endorse entire field)
 * - Forces strategic choices (who to endorse matters)
 * - Simulates political capital constraints (endorsements aren't free)
 * - 1 game-year = reasonable political cycle (elections every 2-4 game years)
 * 
 * **Balance Notes:**
 * - 6 game months = too short, allows too many endorsements per cycle
 * - 2 game years = too long, limits strategic flexibility
 * - 1 game year = natural political cycle, balanced restriction
 */
export const ENDORSEMENT_COOLDOWN_GAME_YEARS = 1;

/**
 * Endorsement data structure.
 * 
 * Represents a single endorsement event with all relevant metadata for
 * calculating influence transfer, credibility impact, and reciprocal bonuses.
 */
export interface Endorsement {
  /** Unique identifier for the endorser (candidate ID) */
  endorserId: string;
  
  /** Display name of endorser (e.g., "Senator Smith (D-CA)") */
  endorserName: string;
  
  /** Base influence value of endorser (before diminishing returns) */
  baseInfluence: number;
  
  /** Current polling percentage of endorser (0-100) */
  endorserPolling: number;
  
  /** Timestamp when endorsement was made (real-time Date) */
  endorsedAt: Date;
  
  /** Whether this endorsement is reciprocated (endorsee also endorsed endorser) */
  isReciprocal: boolean;
}

/**
 * Result of endorsement boost calculation.
 * 
 * Contains total polling boost and breakdown of individual contributions
 * for transparency and debugging.
 */
export interface EndorsementBoostResult {
  /** Total polling points added from all endorsements (after all modifiers) */
  totalBoost: number;
  
  /** Breakdown of individual endorsement contributions */
  breakdown: Array<{
    endorserId: string;
    endorserName: string;
    baseInfluence: number;
    diminishingMultiplier: number;
    effectiveBoost: number;
  }>;
  
  /** Whether reciprocal bonus was applied */
  reciprocalBonusApplied: boolean;
  
  /** Total reciprocal bonus amount (if applied) */
  reciprocalBonusAmount: number;
}

/**
 * Calculates total polling boost from endorsements with diminishing returns.
 * 
 * **Algorithm:**
 * 1. Sort endorsements by baseInfluence descending (strongest first)
 * 2. Apply diminishing returns: influence × (0.6 ^ index)
 * 3. Sum all effective boosts
 * 4. If any reciprocal endorsements exist, apply +10% bonus
 * 
 * **Example:**
 * ```typescript
 * const endorsements: Endorsement[] = [
 *   { endorserId: 'senator-1', baseInfluence: 10.0, isReciprocal: false },
 *   { endorserId: 'governor-2', baseInfluence: 8.0, isReciprocal: true },
 *   { endorserId: 'rep-3', baseInfluence: 5.0, isReciprocal: false }
 * ];
 * 
 * // Sorted by influence: [10.0, 8.0, 5.0]
 * // 1st: 10.0 × (0.6^0) = 10.0 × 1.0 = 10.0pp
 * // 2nd: 8.0 × (0.6^1) = 8.0 × 0.6 = 4.8pp
 * // 3rd: 5.0 × (0.6^2) = 5.0 × 0.36 = 1.8pp
 * // Subtotal: 16.6pp
 * // Has reciprocal: 16.6 × 1.10 = 18.26pp total
 * 
 * const result = calculateEndorsementBoost(endorsements, 55);
 * // result.totalBoost = 18.26
 * // result.reciprocalBonusApplied = true
 * // result.reciprocalBonusAmount = 1.66
 * ```
 * 
 * @param endorsements Array of endorsements received by candidate
 * @param endorseePolling Current polling percentage of endorsed candidate (used for credibility calc)
 * @returns Detailed boost calculation with breakdown
 */
export function calculateEndorsementBoost(
  endorsements: Endorsement[],
  endorseePolling: number
): EndorsementBoostResult {
  // Sort endorsements by influence descending (strongest endorsements first)
  // This ensures diminishing returns apply fairly (best endorsement gets full value)
  const sortedEndorsements = [...endorsements].sort(
    (a, b) => b.baseInfluence - a.baseInfluence
  );

  let subtotal = 0;
  const breakdown: EndorsementBoostResult['breakdown'] = [];

  // Calculate each endorsement's contribution with diminishing returns
  sortedEndorsements.forEach((endorsement, index) => {
    // Diminishing returns formula: baseInfluence × (0.6 ^ endorsementIndex)
    // index=0: multiplier = 1.0 (100%)
    // index=1: multiplier = 0.6 (60%)
    // index=2: multiplier = 0.36 (36%)
    // index=3: multiplier = 0.216 (21.6%)
    const diminishingMultiplier = Math.pow(DIMINISHING_RETURNS_FACTOR, index);
    const effectiveBoost = endorsement.baseInfluence * diminishingMultiplier;

    subtotal += effectiveBoost;

    breakdown.push({
      endorserId: endorsement.endorserId,
      endorserName: endorsement.endorserName,
      baseInfluence: endorsement.baseInfluence,
      diminishingMultiplier,
      effectiveBoost
    });
  });

  // Check for reciprocal endorsements (any endorsement with isReciprocal = true)
  const hasReciprocal = endorsements.some(e => e.isReciprocal);

  // Apply reciprocal bonus if mutual endorsements exist
  let totalBoost = subtotal;
  let reciprocalBonusAmount = 0;

  if (hasReciprocal) {
    reciprocalBonusAmount = subtotal * (RECIPROCAL_BONUS_MULTIPLIER - 1); // 10% of subtotal
    totalBoost = subtotal * RECIPROCAL_BONUS_MULTIPLIER; // +10% bonus
  }

  return {
    totalBoost,
    breakdown,
    reciprocalBonusApplied: hasReciprocal,
    reciprocalBonusAmount
  };
}

/**
 * Calculates credibility cost/gain from making an endorsement.
 * 
 * **Formula:** `credibilityCost = (endorserPolling - endorseePolling) × 0.02`
 * 
 * **Scenarios:**
 * - **Endorsing underdog** (endorser > endorsee): Positive cost (credibility lost)
 * - **Endorsing frontrunner** (endorser < endorsee): Negative cost (credibility gained!)
 * - **Endorsing equal** (endorser ≈ endorsee): Near-zero cost
 * 
 * **Examples:**
 * ```typescript
 * // Scenario 1: Strong candidate (50%) endorses weak candidate (30%)
 * const cost1 = calculateCredibilityImpact(50, 30);
 * // cost1 = (50 - 30) × 0.02 = 0.4% credibility LOST
 * 
 * // Scenario 2: Weak candidate (35%) endorses strong candidate (55%)
 * const cost2 = calculateCredibilityImpact(35, 55);
 * // cost2 = (35 - 55) × 0.02 = -0.4% credibility GAINED
 * 
 * // Scenario 3: Equal candidates (48% vs 47%)
 * const cost3 = calculateCredibilityImpact(48, 47);
 * // cost3 = (48 - 47) × 0.02 = 0.02% (negligible)
 * ```
 * 
 * **Strategic Implications:**
 * - Endorsing struggling allies carries political risk
 * - Endorsing frontrunners provides credibility boost
 * - Creates tension between helping friends vs protecting reputation
 * - Frontrunners have incentive to endorse each other (mutual credibility gain)
 * 
 * @param endorserPolling Current polling percentage of endorser (0-100)
 * @param endorseePolling Current polling percentage of endorsed candidate (0-100)
 * @returns Credibility cost as percentage points (positive = loss, negative = gain)
 */
export function calculateCredibilityImpact(
  endorserPolling: number,
  endorseePolling: number
): number {
  const pollingGap = endorserPolling - endorseePolling;
  return pollingGap * CREDIBILITY_COST_FACTOR;
}

/**
 * Checks if candidate can make another endorsement (cooldown expired).
 * 
 * **Cooldown Rules:**
 * - After endorsing, candidate must wait 1 game-year (52.14 real hours ≈ 1 real hour)
 * - Cooldown tracked via lastEndorsementAt timestamp
 * - Uses real-time (Date objects) converted to game-years for comparison
 * 
 * **Examples:**
 * ```typescript
 * const lastEndorsement = new Date('2025-11-27T10:00:00Z');
 * const now = new Date('2025-11-27T11:05:00Z'); // 1h 5min later
 * 
 * // 1h 5min real = 176.4 game hours = 0.02 game years
 * const canEndorse = canMakeEndorsement(lastEndorsement, now);
 * // canEndorse = false (need 1 game year = 52.14 real hours)
 * 
 * // 60 real hours later
 * const laterNow = new Date('2025-11-29T22:00:00Z');
 * const canEndorseNow = canMakeEndorsement(lastEndorsement, laterNow);
 * // canEndorseNow = true (60 real hours > 52.14 real hours needed)
 * ```
 * 
 * @param lastEndorsementAt Timestamp of candidate's last endorsement (real-time Date)
 * @param now Current timestamp (real-time Date, defaults to Date.now())
 * @returns True if cooldown expired, false if still cooling down
 */
export function canMakeEndorsement(
  lastEndorsementAt: Date | null,
  now: Date = new Date()
): boolean {
  // No previous endorsement = can endorse immediately
  if (!lastEndorsementAt) {
    return true;
  }

  // Calculate real hours elapsed since last endorsement
  const realHoursElapsed = (now.getTime() - lastEndorsementAt.getTime()) / (1000 * 60 * 60);

    // Convert real hours to game years
    // 1 real hour = 1 game week, so real hours = game weeks
    // 52 game weeks = 1 game year
    const gameWeeksElapsed = realHoursElapsed; // 1 real hour = 1 game week per model
    const gameYearsElapsed = gameWeeksElapsed / GAME_WEEKS_PER_YEAR;

  // Check if cooldown period (1 game year) has passed
  return gameYearsElapsed >= ENDORSEMENT_COOLDOWN_GAME_YEARS;
}

/**
 * Calculates time remaining until endorsement cooldown expires.
 * 
 * Useful for UI display ("You can endorse again in 42 hours").
 * 
 * **Examples:**
 * ```typescript
 * const lastEndorsement = new Date('2025-11-27T10:00:00Z');
 * const now = new Date('2025-11-27T15:00:00Z'); // 5 hours later
 * 
 * const remaining = getEndorsementCooldownRemaining(lastEndorsement, now);
 * // remaining = 47.14 real hours (52.14 needed - 5 elapsed)
 * 
 * // If cooldown expired
 * const laterNow = new Date('2025-11-30T10:00:00Z'); // 72 hours later
 * const remainingExpired = getEndorsementCooldownRemaining(lastEndorsement, laterNow);
 * // remainingExpired = 0 (cooldown already expired)
 * ```
 * 
 * @param lastEndorsementAt Timestamp of candidate's last endorsement
 * @param now Current timestamp (defaults to Date.now())
 * @returns Real hours remaining until cooldown expires (0 if already expired)
 */
export function getEndorsementCooldownRemaining(
  lastEndorsementAt: Date | null,
  now: Date = new Date()
): number {
  if (!lastEndorsementAt) {
    return 0; // No cooldown if never endorsed
  }

  // Calculate real hours elapsed
  const realHoursElapsed = (now.getTime() - lastEndorsementAt.getTime()) / (1000 * 60 * 60);

    // Convert to game years
    // 1 real hour = 1 game week, so real hours = game weeks
    // 52 game weeks = 1 game year
    const gameWeeksElapsed = realHoursElapsed; // 1 real hour = 1 game week per model
    const gameYearsElapsed = gameWeeksElapsed / GAME_WEEKS_PER_YEAR;

  // If cooldown expired, return 0
  if (gameYearsElapsed >= ENDORSEMENT_COOLDOWN_GAME_YEARS) {
    return 0;
  }

  // Calculate remaining game years, convert back to real hours
  const gameYearsRemaining = ENDORSEMENT_COOLDOWN_GAME_YEARS - gameYearsElapsed;
  const realHoursRemaining = gameYearsRemaining * 8760 / 168; // 1 game year = 52.14 real hours

  return realHoursRemaining;
}

/**
 * Validates endorsement request before processing.
 * 
 * Checks:
 * - Endorser is not endorsing themselves
 * - Endorser has no cooldown restriction
 * - Endorser and endorsee are in same election/race
 * 
 * **Example:**
 * ```typescript
 * const validation = validateEndorsementRequest(
 *   'candidate-123',
 *   'candidate-456',
 *   lastEndorsementDate,
 *   'presidential-2028'
 * );
 * 
 * if (!validation.valid) {
 *   console.error(validation.reason);
 *   // "Cannot endorse yourself"
 *   // or "Endorsement cooldown active (32.5 hours remaining)"
 * }
 * ```
 * 
 * @param endorserId ID of candidate making endorsement
 * @param endorseeId ID of candidate being endorsed
 * @param lastEndorsementAt Timestamp of endorser's last endorsement
 * @param raceId Optional race/election ID to validate same race
 * @returns Validation result with valid flag and reason if invalid
 */
export function validateEndorsementRequest(
  endorserId: string,
  endorseeId: string,
  lastEndorsementAt: Date | null,
  raceId?: string
): { valid: boolean; reason?: string } {
  // Cannot endorse yourself
  if (endorserId === endorseeId) {
    return {
      valid: false,
      reason: 'Cannot endorse yourself'
    };
  }

  // Check cooldown
  if (!canMakeEndorsement(lastEndorsementAt)) {
    const hoursRemaining = getEndorsementCooldownRemaining(lastEndorsementAt);
    return {
      valid: false,
      reason: `Endorsement cooldown active (${hoursRemaining.toFixed(1)} hours remaining)`
    };
  }

  // All checks passed
  return { valid: true };
}
