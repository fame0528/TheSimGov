/**
 * @fileoverview Political Influence & Lobbying Type Contracts (Baseline Phase 4)
 * @module lib/types/politicsInfluence
 *
 * OVERVIEW:
 * Canonical TypeScript interfaces for baseline influence scoring and lobbying probability
 * breakdown outputs. These contracts reflect the approved specifications documented in:
 * - INFLUENCE_BASELINE_SPEC_FID-20251125-001A_20251125.md
 * - LOBBYING_PROBABILITY_SPEC_FID-20251125-001A_20251125.md
 *
 * DESIGN PRINCIPLES:
 * - Pure Data: No methods; utilities consume and produce these shapes.
 * - Deterministic: Optional seed field enables reproducible micro-jitter.
 * - Transparency: Component breakdown surfaces every contribution for UI & QA.
 * - Extensibility: Fields ordered to allow additive Phase 001B mechanics (logistic reputation, crisis modifiers, momentum).
 * - DRY: Reuses existing domain types (CompanyLevel) without redefining primitives.
 *
 * @created 2025-11-25
 * @author ECHO v1.3.0
 */
import type { CompanyLevel } from './game';

/** Inputs required to compute baseline political influence for a player. */
export interface BaseInfluenceInputs {
  donationAmount: number;              // Raw latest donation amount (currency units)
  totalDonations: number;              // Historical aggregate donations (legacy continuity)
  companyLevel: CompanyLevel;          // Player company level 1..5 (maps to level multiplier & minimum floor)
  compositeInfluenceWeight: number;    // Derived state metric (0..1 normalized composite)
  weeksToElection: number;             // Non-negative weeks until next election for targeted office
  reputation: number;                  // 0..100 reputation (linear baseline; logistic deferred)
  successfulLobbies: number;           // Count of successful lobbying actions (legacy synergy placeholder)
  seed?: string | number;              // Optional deterministic seed for micro-jitter
  previousSnapshotInfluence?: number;  // Prior offline snapshot influence for fairness retention floor
}

/** Detailed component breakdown produced during influence calculation. */
export interface InfluenceComponentBreakdown {
  donationLog: number;                 // log10 scaled donation segment before level multiplier
  levelMultiplierFactor: number;       // Multiplier applied based on companyLevel (>=1)
  stateComposite: number;              // Contribution from compositeInfluenceWeight * STATE_SCALE
  electionProximity: number;           // Quadratic weeks-to-election bonus
  reputationFactor: number;            // Linear reputation additive factor (>0 only if reputation > 50)
  diminishingReturnsApplied: number;   // Value after soft cap compression function
  fairnessClampApplied: number;        // Floor applied (level minimum vs retention floor)
  seedJitter?: number;                 // Deterministic micro variance (±MICRO_JITTER_MAX) if seed supplied
}

/** Final influence result including total (rounded) and full breakdown. */
export interface InfluenceResult {
  total: number;                       // Rounded final influence score (post clamp + jitter)
  components: InfluenceComponentBreakdown; // Component contributions for transparency
  seed?: string | number;              // Echoed seed if provided
}

/** Inputs for lobbying probability computation (subset + influence score). */
export interface LobbyingProbabilityInputs {
  officeLevel: 'LOCAL' | 'STATE' | 'FEDERAL' | 'NATIONAL'; // Difficulty base discriminator
  donationAmount: number;                 // Current lobbying spend for this attempt
  playerInfluenceScore: number;           // Baseline influence (may be pre or post clamp depending on spec usage)
  reputation: number;                     // 0..100 reputation
  compositeInfluenceWeight: number;       // State composite (0..1)
  weeksUntilElection: number;             // Non-negative weeks until election
  seed?: string;                          // Seed for deterministic jitter
}

/** Breakdown for lobbying probability showing each component and clamps. */
export interface LobbyingProbabilityBreakdown {
  base: number;                           // Difficulty base probability
  spendTerm: number;                      // Log-scaled donation spending contribution (pre multiplicative wrapping)
  influencePlateau: number;               // Influence saturation (0..1)
  influenceWeightApplied: number;         // influencePlateau * influenceWeight constant
  stateCompositeWeight: number;           // Raw compositeInfluenceWeight input (0..1)
  stateCompositeContribution: number;     // 1 + stateCompositeWeight * stateCompositeFactor
  proximityMultiplier: number;            // 1 + proximityWeight * exp(-weeksUntilElection / decayHalfLife)
  reputationTerm: number;                 // Linear reputation term (reputation/100 * reputationWeight)
  jitter: number;                         // Deterministic micro jitter (0 if suppressed)
  rawUnclamped: number;                   // Probability before soft easing & final clamp
  softened: number;                       // Probability after softMax easing (if triggered)
  final: number;                          // Final probability after 5–95 clamp
  seed?: string;                          // Echoed seed when provided
}

/** Result wrapper for lobbying probability including breakdown. */
export interface LobbyingProbabilityResult {
  probability: number;                    // Final clamped probability (0.05..0.95 expressed as decimal 0..1 or percent as per implementation)
  breakdown: LobbyingProbabilityBreakdown;// Detailed component listing
}

// IMPLEMENTATION NOTES:
// 1. Utilities will ensure numeric invariants (e.g., clamp compositeInfluenceWeight into [0,1]).
// 2. All percent-like final outputs should standardize representation (choose decimal 0..1 internally, convert to whole % at presentation layer).
// 3. Micro-jitter must never push final below floor or above ceiling; apply jitter before clamp then clamp.
// 4. successfulLobbies currently informational; future phases may convert to momentum term.
// 5. previousSnapshotInfluence fairness floor uses retention factor (e.g., 0.9) defined in constants.
// 6. playerInfluenceScore may be provided pre or post clamp; caller must be explicit to avoid double compression.
// 7. Lobbying difficulty base values sourced from spec parity mapping; constants file centralizes tunables.
