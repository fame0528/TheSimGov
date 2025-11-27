/**
 * @file Canonical re-export for state derived metrics utilities.
 * 
 * Provides a stable lib/ path aligned with Political Core Framework planning
 * while reusing the existing implementation under `src/politics/utils/stateDerivedMetrics.ts`.
 * This preserves DRY principles and existing test coverage without relocating legacy code.
 */

export type { StateMetrics, DerivedMetrics } from '../../../politics/utils/stateDerivedMetrics';
export { computeDerivedMetrics, getDerivedMetricsForState } from '../../../politics/utils/stateDerivedMetrics';
