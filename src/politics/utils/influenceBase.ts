/**
 * OVERVIEW
 * Baseline influence calculation using compositeInfluenceWeight.
 * Pure function with diminishing returns curve. No random elements.
 */

import type { DerivedMetrics } from './stateDerivedMetrics';

/**
 * Compute base influence score from composite weight.
 * Uses logarithmic diminishing returns to avoid extreme outliers.
 * @param compositeWeight - [0, 1] from stateDerivedMetrics
 * @param baseMultiplier - scaling factor (default 100)
 * @returns influence score (uncapped, typically [0, ~100])
 */
export function computeBaseInfluence(
  compositeWeight: number,
  baseMultiplier = 100
): number {
  // Clamp input
  const w = Math.max(0, Math.min(1, compositeWeight));
  
  // Logarithmic diminishing returns: influence = baseMultiplier * log(1 + 9*w) / log(10)
  // This maps w=0 → 0, w=1 → baseMultiplier, with smooth curve
  const influence = baseMultiplier * (Math.log(1 + 9 * w) / Math.log(10));
  
  return influence;
}

/**
 * Get influence score for a specific state given derived metrics.
 */
export function getStateInfluence(
  derived: DerivedMetrics | null,
  baseMultiplier = 100
): number {
  if (!derived) return 0;
  return computeBaseInfluence(derived.compositeInfluenceWeight, baseMultiplier);
}

/**
 * Notes
 * - No offline decay in baseline (handled separately by offlineProtection)
 * - Advanced modifiers (endorsements, events) apply on top in Phase 2
 * - Deterministic: same inputs → same output always
 */
