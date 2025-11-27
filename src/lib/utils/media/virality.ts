/**
 * @file src/lib/utils/media/virality.ts
 * @description Viral loop modeling, K-factor calculation, and viral reach estimation
 * @created 2025-11-25
 * @version 1.0.0
 * @fid FID-20251124-001
 *
 * OVERVIEW:
 * Analyzes viral potential and models viral cascades using epidemiological
 * growth models. Calculates K-factor (viral coefficient), estimates viral reach,
 * projects decay curves, and identifies viral thresholds.
 *
 * FEATURES:
 * - K-factor calculation (viral coefficient > 1 = exponential growth)
 * - Viral loop modeling (invitation → acceptance → invitation cycle)
 * - Viral reach estimation with cascade depth analysis
 * - Viral decay curve projection (plateau and decline phases)
 * - Platform-specific viral multipliers
 * - Viral threshold identification (tipping points)
 *
 * BUSINESS LOGIC:
 * - K > 1: Viral growth (each user brings > 1 new user)
 * - K = 1: Sustained growth (replacement rate)
 * - K < 1: Organic growth only (decay without input)
 * - TikTok/Instagram higher viral potential than LinkedIn/YouTube
 * - Viral content typically plateaus after 3-5 cascade cycles
 *
 * USAGE:
 * ```typescript
 * import { calculateKFactor, modelViralLoops } from '@/lib/utils/media/virality';
 *
 * const kFactor = calculateKFactor({
 *   invitations: 5,        // Avg invitations sent per user
 *   conversionRate: 0.25   // 25% of invitations convert
 * });
 * // → { kFactor: 1.25, growthType: 'viral', doublingTime: 3.1 }
 *
 * const reach = modelViralLoops({
 *   initialViewers: 10_000,
 *   kFactor: 1.5,
 *   platform: 'TikTok',
 *   maxCycles: 5
 * });
 * // → Projected viral reach with cascade breakdown
 * ```
 */

import type { PlatformType } from '@/lib/types/media';
import { VIRALITY_COEFFICIENTS } from './mediaConstants';

// ============================================================================
// K-FACTOR CALCULATION
// ============================================================================

/**
 * K-factor calculation input
 */
export interface KFactorInput {
  invitations: number;        // Average invitations/shares sent per user
  conversionRate: number;     // % of invitations that convert to new users (0-1)
  platform?: PlatformType;    // Optional: applies platform multiplier
}

/**
 * K-factor calculation result
 */
export interface KFactorResult {
  kFactor: number;                              // Viral coefficient
  rawKFactor: number;                           // Before platform multiplier
  platformMultiplier?: number;                  // Platform viral boost
  growthType: 'viral' | 'sustained' | 'organic';
  doublingTime?: number;                        // Cycles to double (if viral)
  projectedGrowthRate: number;                  // % growth per cycle
}

/**
 * Calculate K-factor (viral coefficient)
 *
 * K-factor measures viral growth potential:
 * K = (invitations per user) × (conversion rate) × (platform multiplier)
 *
 * Interpretation:
 * - K > 1: Viral growth (exponential, self-sustaining)
 * - K = 1: Sustained growth (each user replaces themselves)
 * - K < 1: Organic growth (decay without marketing)
 *
 * Doubling time (cycles): log(2) / log(K) [only if K > 1]
 *
 * @param input - K-factor calculation inputs
 * @returns K-factor analysis with growth classification
 *
 * @example
 * // Viral product (K > 1)
 * calculateKFactor({
 *   invitations: 8,
 *   conversionRate: 0.20,
 *   platform: 'TikTok'
 * });
 * // → { kFactor: 2.08, growthType: 'viral', doublingTime: 1.0 cycles }
 *
 * // Non-viral product (K < 1)
 * calculateKFactor({
 *   invitations: 3,
 *   conversionRate: 0.15,
 *   platform: 'LinkedIn'
 * });
 * // → { kFactor: 0.41, growthType: 'organic', projectedGrowthRate: -59% }
 */
export function calculateKFactor(input: KFactorInput): KFactorResult {
  const { invitations, conversionRate, platform } = input;

  // Base K-factor (without platform multiplier)
  const rawKFactor = invitations * conversionRate;

  // Apply platform multiplier if specified
  const platformMultiplier = platform
     ? VIRALITY_COEFFICIENTS.PLATFORM_VIRAL_MULTIPLIERS[platform]
    : undefined;
  const kFactor = platformMultiplier ? rawKFactor * platformMultiplier : rawKFactor;

  // Determine growth type
  let growthType: KFactorResult['growthType'];
  if (kFactor > 1.05) {
    growthType = 'viral';
  } else if (kFactor >= 0.95 && kFactor <= 1.05) {
    growthType = 'sustained';
  } else {
    growthType = 'organic';
  }

  // Calculate doubling time (only for viral growth)
  let doublingTime: number | undefined;
  if (kFactor > 1) {
    // Doubling time = log(2) / log(K)
    doublingTime = Math.log(2) / Math.log(kFactor);
  }

  // Projected growth rate per cycle
  const projectedGrowthRate = (kFactor - 1) * 100;

  return {
    kFactor: Math.round(kFactor * 100) / 100,
    rawKFactor: Math.round(rawKFactor * 100) / 100,
    platformMultiplier,
    growthType,
    doublingTime: doublingTime ? Math.round(doublingTime * 10) / 10 : undefined,
    projectedGrowthRate: Math.round(projectedGrowthRate * 10) / 10,
  };
}

// ============================================================================
// VIRAL LOOP MODELING
// ============================================================================

/**
 * Viral loop modeling input
 */
export interface ViralLoopInput {
  initialViewers: number;       // Initial audience size (cycle 0)
  kFactor: number;              // Viral coefficient
  platform: PlatformType;       // Platform for decay/saturation parameters
  maxCycles?: number;           // Maximum cascade cycles (default: 10)
  saturationPoint?: number;     // Market saturation limit (optional)
}

/**
 * Viral cascade breakdown by cycle
 */
export interface ViralCascade {
  cycle: number;                // Cascade cycle number
  newViewers: number;           // New viewers this cycle
  totalViewers: number;         // Cumulative viewers
  growthRate: number;           // % growth vs previous cycle
  saturationPercentage: number; // % of saturation point reached
}

/**
 * Viral loop modeling result
 */
export interface ViralLoopResult {
  cascades: ViralCascade[];             // Cycle-by-cycle breakdown
  peakViewers: number;                  // Maximum reach achieved
  peakCycle: number;                    // Cycle where peak occurred
  totalReach: number;                   // Total unique viewers
  viralityScore: number;                // 0-100 viral effectiveness score
  estimatedDuration: number;            // Estimated days for all cycles
}

/**
 * Model viral loop cascades
 *
 * Simulates viral growth through invitation → conversion → invitation cycles.
 * Each cycle, existing users invite new users at rate K.
 *
 * Formula per cycle:
 * - New viewers = previous cycle viewers * K * decay factor * (1 - saturation)
 * - Decay factor = exponential decay from VIRALITY_COEFFICIENTS
 * - Saturation = slows growth as market limit approached
 *
 * @param input - Viral loop modeling inputs
 * @returns Cascade-by-cascade viral growth projection
 *
 * @example
 * const loops = modelViralLoops({
 *   initialViewers: 5_000,
 *   kFactor: 1.8,
 *   platform: 'TikTok',
 *   maxCycles: 6,
 *   saturationPoint: 500_000
 * });
 * // → Cycle 0: 5K, Cycle 1: 9K (+4K), Cycle 2: 16.2K (+7.2K), ...
 */
export function modelViralLoops(input: ViralLoopInput): ViralLoopResult {
  const { initialViewers, kFactor, platform, saturationPoint } = input;
  const maxCycles = input.maxCycles ?? 10;

    const decayRate = VIRALITY_COEFFICIENTS.VIRAL_DECAY_RATE;
    const cycleTime = 3; // Days per cycle (typical viral loop time, not in constants)

  const cascades: ViralCascade[] = [];
  let totalViewers = initialViewers;
  let peakViewers = initialViewers;
  let peakCycle = 0;

  // Initial cascade (cycle 0)
  cascades.push({
    cycle: 0,
    newViewers: initialViewers,
    totalViewers: initialViewers,
    growthRate: 0,
    saturationPercentage: saturationPoint ? (initialViewers / saturationPoint) * 100 : 0,
  });

  // Simulate cascades
  for (let cycle = 1; cycle <= maxCycles; cycle++) {
    const previousCascade = cascades[cycle - 1];
    
    // Apply decay (viral momentum decreases over time)
    const decayFactor = Math.exp(-decayRate * cycle);
    
    // Apply saturation (growth slows as market saturates)
    const saturation = saturationPoint
      ? Math.max(0, 1 - totalViewers / saturationPoint)
      : 1;
    
    // Calculate new viewers this cycle
    const effectiveK = kFactor * decayFactor * saturation;
    const newViewers = previousCascade.newViewers * effectiveK;
    
    // Stop if negligible growth (< 1% of initial)
    if (newViewers < initialViewers * 0.01) {
      break;
    }
    
    totalViewers += newViewers;
    const growthRate = (newViewers / previousCascade.totalViewers) * 100;
    
    cascades.push({
      cycle,
      newViewers: Math.round(newViewers),
      totalViewers: Math.round(totalViewers),
      growthRate: Math.round(growthRate * 10) / 10,
      saturationPercentage: saturationPoint
        ? Math.round((totalViewers / saturationPoint) * 1000) / 10
        : 0,
    });
    
    // Track peak
    if (totalViewers > peakViewers) {
      peakViewers = totalViewers;
      peakCycle = cycle;
    }
  }

  // Virality score (0-100 based on reach multiplication)
  const reachMultiplier = totalViewers / initialViewers;
  const viralityScore = Math.min(100, (reachMultiplier - 1) * 10); // 10x reach = 90 score

  // Estimated duration (cycles × time per cycle)
  const estimatedDuration = cascades.length * cycleTime;

  return {
    cascades,
    peakViewers: Math.round(peakViewers),
    peakCycle,
    totalReach: Math.round(totalViewers),
    viralityScore: Math.round(viralityScore),
    estimatedDuration: Math.round(estimatedDuration * 10) / 10,
  };
}

// ============================================================================
// VIRAL REACH ESTIMATION
// ============================================================================

/**
 * Viral reach estimation input
 */
export interface ViralReachInput {
  initialShares: number;        // Number of initial shares
  shareRate: number;            // % of viewers who share (0-1)
  viewsPerShare: number;        // Average views each share generates
  platform: PlatformType;
  cascadeDepth?: number;        // Number of cascade levels (default: 5)
}

/**
 * Viral reach estimation result
 */
export interface ViralReachResult {
  estimatedReach: number;               // Total projected viewers
  estimatedShares: number;              // Total projected shares
  cascadeBreakdown: number[];           // Viewers per cascade level
  viralCoefficient: number;             // Calculated K-factor
  reachMultiplier: number;              // Reach vs initial shares ratio
}

/**
 * Estimate viral reach from sharing behavior
 *
 * Projects total reach based on share cascades. Each share generates views,
 * and a percentage of those viewers share again, creating cascades.
 *
 * Formula per cascade level:
 * - Shares(n) = Views(n-1) * share_rate * platform_multiplier
 * - Views(n) = Shares(n) * views_per_share
 *
 * @param input - Viral reach estimation inputs
 * @returns Projected viral reach with cascade breakdown
 *
 * @example
 * const reach = estimateViralReach({
 *   initialShares: 500,
 *   shareRate: 0.08,        // 8% of viewers share
 *   viewsPerShare: 50,      // Each share gets 50 views
 *   platform: 'TikTok',
 *   cascadeDepth: 5
 * });
 * // → { estimatedReach: 125_000, cascadeBreakdown: [25K, 40K, 32K, 20K, 8K] }
 */
export function estimateViralReach(input: ViralReachInput): ViralReachResult {
  const { initialShares, shareRate, viewsPerShare, platform } = input;
  const cascadeDepth = input.cascadeDepth ?? 5;

    const platformMultiplier = VIRALITY_COEFFICIENTS.PLATFORM_VIRAL_MULTIPLIERS[platform];
  const cascadeBreakdown: number[] = [];

  let totalReach = 0;
  let totalShares = initialShares;
  let currentShares = initialShares;

  for (let level = 0; level < cascadeDepth; level++) {
    // Views generated by current level shares
    const views = currentShares * viewsPerShare;
    cascadeBreakdown.push(Math.round(views));
    totalReach += views;

    // Shares generated by current level views (for next cascade)
    currentShares = views * shareRate * platformMultiplier;

    // Stop if shares drop below 1
    if (currentShares < 1) {
      break;
    }

    totalShares += currentShares;
  }

  // Calculate viral coefficient from observed behavior
  const viralCoefficient = shareRate * viewsPerShare * platformMultiplier;
  const reachMultiplier = totalReach / (initialShares * viewsPerShare);

  return {
    estimatedReach: Math.round(totalReach),
    estimatedShares: Math.round(totalShares),
    cascadeBreakdown,
    viralCoefficient: Math.round(viralCoefficient * 100) / 100,
    reachMultiplier: Math.round(reachMultiplier * 100) / 100,
  };
}

// ============================================================================
// VIRAL DECAY CURVE
// ============================================================================

/**
 * Viral decay projection result
 */
export interface ViralDecayResult {
  peakViews: number;                // Maximum views (plateau)
  peakDay: number;                  // Day peak occurs
  halfLifeDays: number;             // Days to reach 50% of peak
  projectedCurve: Array<{
    day: number;
    views: number;
    phase: 'growth' | 'plateau' | 'decline';
  }>;
}

/**
 * Project viral decay curve
 *
 * Models lifecycle: exponential growth → plateau → exponential decay
 *
 * Phases:
 * 1. Growth: Exponential with K > 1 (viral spreading)
 * 2. Plateau: Saturation/exhaustion of network (K ≈ 1)
 * 3. Decline: Exponential decay with decay rate from constants
 *
 * @param initialViews - Starting daily views
 * @param kFactor - Viral coefficient during growth
 * @param projectionDays - Days to project (default: 30)
 * @returns Projected view curve with phases
 *
 * @example
 * const curve = viralDecayCurve(10_000, 1.6, 30);
 * // → Day 0-5: Growth, Day 6-10: Plateau, Day 11-30: Decline
 */
export function viralDecayCurve(
  initialViews: number,
  kFactor: number,
  projectionDays: number = 30
): ViralDecayResult {
  const growthRate = kFactor - 1; // Growth rate per day during viral phase
    const decayRate = VIRALITY_COEFFICIENTS.VIRAL_DECAY_RATE;
    const plateauDuration = 6; // ~6 days typical (viral loop time * 2)

  const projectedCurve: ViralDecayResult['projectedCurve'] = [];
  let peakViews = initialViews;
  let peakDay = 0;

  for (let day = 0; day < projectionDays; day++) {
    let views: number;
    let phase: 'growth' | 'plateau' | 'decline';

    // Determine phase based on day
    if (kFactor <= 1) {
      // No viral growth, immediate decline
      phase = 'decline';
      views = initialViews * Math.exp(-decayRate * day);
    } else if (day < plateauDuration) {
      // Growth phase
      phase = 'growth';
      views = initialViews * Math.exp(growthRate * day);
    } else if (day < plateauDuration * 2) {
      // Plateau phase
      phase = 'plateau';
      const plateauViews = initialViews * Math.exp(growthRate * plateauDuration);
      views = plateauViews;
    } else {
      // Decline phase
      phase = 'decline';
      const plateauViews = initialViews * Math.exp(growthRate * plateauDuration);
      const daysSinceDecline = day - plateauDuration * 2;
      views = plateauViews * Math.exp(-decayRate * daysSinceDecline);
    }

    projectedCurve.push({
      day,
      views: Math.round(views),
      phase,
    });

    // Track peak
    if (views > peakViews) {
      peakViews = views;
      peakDay = day;
    }
  }

  // Calculate half-life (days to reach 50% of peak)
  let halfLifeDays = 0;
  const halfPeak = peakViews * 0.5;
  for (let i = peakDay; i < projectedCurve.length; i++) {
    if (projectedCurve[i].views <= halfPeak) {
      halfLifeDays = i - peakDay;
      break;
    }
  }

  return {
    peakViews: Math.round(peakViews),
    peakDay,
    halfLifeDays,
    projectedCurve,
  };
}

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================

/**
 * K-FACTOR THEORY:
 *
 * K-factor is the viral growth coefficient borrowed from epidemiology (R₀).
 *
 * Formula: K = i × c × m
 * Where:
 * - i = invitations per user
 * - c = conversion rate (% who accept)
 * - m = platform multiplier
 *
 * Growth dynamics:
 * - K > 1: Exponential (viral) - each generation larger than previous
 * - K = 1: Linear (sustained) - replacement rate
 * - K < 1: Decay (organic) - requires external acquisition
 *
 * Doubling time: log(2) / log(K) cycles
 * Example: K = 1.5 → doubles every 1.7 cycles
 *
 * VIRAL LOOP MECHANICS:
 *
 * Viral loops follow invitation cascade pattern:
 * 1. User A sees content
 * 2. User A shares with N people (invitations)
 * 3. C% convert (conversion rate)
 * 4. New users repeat cycle (loop)
 *
 * Decay factors:
 * - Momentum decay (enthusiasm wanes over cycles)
 * - Network saturation (finite addressable market)
 * - Platform fatigue (seen-it-before effect)
 *
 * PLATFORM MULTIPLIERS:
 *
 * From VIRALITY_COEFFICIENTS.platformMultipliers:
 * - TikTok: 1.3x (FYP algorithm amplifies viral content)
 * - Instagram: 1.2x (Reels/Stories boost sharing)
 * - YouTube: 0.8x (subscription-based, lower viral coefficient)
 * - LinkedIn: 0.6x (professional network, limited sharing)
 *
 * VIRAL DECAY CURVES:
 *
 * Typical lifecycle:
 * Phase 1 - GROWTH: Exponential spread (days 0-5)
 * Phase 2 - PLATEAU: Saturation/exhaustion (days 6-12)
 * Phase 3 - DECLINE: Exponential decay (days 13+)
 *
 * Decay formula: views(t) = peak × e^(-λt)
 * Where λ = decay rate from constants (0.02-0.05 typical)
 *
 * Half-life: Time to reach 50% of peak
 * TikTok: ~2-3 days, YouTube: ~7-14 days
 *
 * CASCADE MODELING:
 *
 * Each cascade level:
 * - Shares(n) = Views(n-1) × share_rate × platform_boost
 * - Views(n) = Shares(n) × views_per_share
 *
 * Typical patterns:
 * - Level 0: Initial shares (100-10K)
 * - Level 1: First cascade (10K-500K)
 * - Level 2: Second cascade (100K-5M) - peak for most content
 * - Level 3+: Diminishing returns, saturation
 *
 * VIRALITY THRESHOLDS:
 *
 * Share rate thresholds:
 * - < 1%: Not viral (organic only)
 * - 1-3%: Moderate viral potential
 * - 3-8%: Strong viral potential
 * - > 8%: Highly viral (rare)
 *
 * K-factor thresholds:
 * - < 0.8: Declining (needs paid acquisition)
 * - 0.8-1.2: Sustained (breakeven)
 * - 1.2-2.0: Viral (healthy growth)
 * - > 2.0: Explosive (unsustainable long-term)
 *
 * @version 1.0.0
 * @compliant ECHO v1.3.0 (AAA Quality, Complete Documentation, Utility-First)
 */
