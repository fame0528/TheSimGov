/**
 * Test Suite - Dynamic Balance Scaler
 *
 * Validates underdog buff, frontrunner penalty, systemic cap compression,
 * fair probability modulation and descriptive transparency.
 */

import {
  computeUnderdogBuff,
  computeFrontrunnerPenaltyMultiplier,
  applySystemicCap,
  computeBalanceAdjustments,
  computeFairProbability,
  describeBalanceAdjustments,
  getFairAdjustedPolling,
  UNDERDOG_GAP_THRESHOLD,
  FRONTRUNNER_LEAD_THRESHOLD,
  SYSTEMIC_CAP_THRESHOLD,
} from '../../src/politics/systems/dynamicBalanceScaler';

describe('Dynamic Balance Scaler', () => {
  describe('computeUnderdogBuff', () => {
    it('returns 0 when gap is at or below threshold', () => {
      expect(computeUnderdogBuff(UNDERDOG_GAP_THRESHOLD)).toBe(0);
      expect(computeUnderdogBuff(5)).toBe(0);
    });

    it('applies factor beyond threshold and caps at max', () => {
      // Gap 12 → (12 * 0.05) = 0.6
      expect(computeUnderdogBuff(12)).toBeCloseTo(0.6, 2);
      // Gap 100 → raw 5.0 but capped at 3.0
      expect(computeUnderdogBuff(100)).toBeCloseTo(3.0, 2);
    });
  });

  describe('computeFrontrunnerPenaltyMultiplier', () => {
    it('returns 1 when lead at or below threshold', () => {
      expect(computeFrontrunnerPenaltyMultiplier(FRONTRUNNER_LEAD_THRESHOLD)).toBe(1);
      expect(computeFrontrunnerPenaltyMultiplier(10)).toBe(1);
    });

    it('scales cost linearly above threshold', () => {
      // Lead 18 → 1 + (18 * 0.03) = 1.54
      expect(computeFrontrunnerPenaltyMultiplier(18)).toBeCloseTo(1.54, 2);
    });
  });

  describe('applySystemicCap', () => {
    it('returns polling unchanged when at or below cap threshold', () => {
      expect(applySystemicCap(SYSTEMIC_CAP_THRESHOLD)).toBe(SYSTEMIC_CAP_THRESHOLD);
      expect(applySystemicCap(45)).toBe(45);
    });

    it('compresses excess above threshold at 20%', () => {
      // 70% → 60 + (10 * 0.2) = 62
      expect(applySystemicCap(70)).toBeCloseTo(62, 2);
      // 90% → 60 + (30 * 0.2) = 66
      expect(applySystemicCap(90)).toBeCloseTo(66, 2);
    });
  });

  describe('computeBalanceAdjustments', () => {
    it('identifies underdog scenario correctly', () => {
      const result = computeBalanceAdjustments(35, [55, 48, 35]);
      expect(result.isUnderdog).toBe(true);
      expect(result.underdogBuff).toBeGreaterThan(0);
      expect(result.trailingGap).toBe(20); // leader 55 - candidate 35
    });

    it('identifies frontrunner scenario correctly', () => {
      const result = computeBalanceAdjustments(70, [70, 50, 48]);
      expect(result.isFrontrunner).toBe(true);
      expect(result.leadGap).toBe(20); // 70 - 50
      expect(result.penaltyMultiplier).toBeGreaterThan(1);
    });

    it('treats 15pp trailing mid-field candidate as underdog (threshold >10)', () => {
      const result = computeBalanceAdjustments(50, [65, 50, 40]);
      expect(result.isUnderdog).toBe(true);
      expect(result.underdogBuff).toBeGreaterThan(0);
      expect(result.isFrontrunner).toBe(false);
    });

    it('applies systemic cap before buff', () => {
      const result = computeBalanceAdjustments(75, [75, 40, 35]);
      // Capped: 60 + (15 * 0.2) = 63
      expect(result.cappedPolling).toBeCloseTo(63, 2);
    });

    it('adjusted polling increases only with underdog buff', () => {
      const underdog = computeBalanceAdjustments(30, [55, 48, 30]);
      expect(underdog.adjustedPolling).toBeGreaterThan(underdog.cappedPolling);

      const frontrunner = computeBalanceAdjustments(70, [70, 50, 45]);
      expect(frontrunner.adjustedPolling).toBeCloseTo(frontrunner.cappedPolling, 2); // No buff for frontrunner
    });

    it('reports thresholds tripped', () => {
      const result = computeBalanceAdjustments(30, [55, 48, 30]);
      expect(result.thresholdsTripped).toContain('UNDERDOG_BUFF');
      const leader = computeBalanceAdjustments(70, [70, 50, 45]);
      expect(leader.thresholdsTripped).toContain('FRONTRUNNER_PENALTY');
    });
  });

  describe('computeFairProbability', () => {
    it('guarantees underdog probability not below base probability', () => {
      const p = computeFairProbability(0.4, 35, [55, 48, 35]); // underdog scenario
      expect(p).toBeGreaterThanOrEqual(0.4);
      expect(p).toBeLessThanOrEqual(0.99);
    });

    it('reduces probability for strong frontrunner via penalty', () => {
      const p = computeFairProbability(0.6, 70, [70, 50, 45]);
      expect(p).toBeLessThan(0.6); // penalty reduces
      expect(p).toBeGreaterThanOrEqual(0.01);
    });

    it('clamps probability to safe bounds', () => {
      const low = computeFairProbability(0, 10, [60, 55, 10]);
      const high = computeFairProbability(1, 30, [60, 55, 30]);
      expect(low).toBeGreaterThanOrEqual(0.01);
      expect(high).toBeLessThanOrEqual(0.99);
    });
  });

  describe('describeBalanceAdjustments', () => {
    it('returns readable description for multiple thresholds', () => {
      const r = computeBalanceAdjustments(30, [55, 48, 30]);
      const desc = describeBalanceAdjustments(r);
      expect(desc).toContain('Underdog buff');
    });

    it('returns description with underdog buff for 15pp trailing candidate', () => {
      const r = computeBalanceAdjustments(50, [65, 50, 40]);
      const desc = describeBalanceAdjustments(r);
      expect(desc).toContain('Underdog buff');
    });
  });

  describe('getFairAdjustedPolling', () => {
    it('returns adjusted polling including underdog buff if applicable', () => {
      const r = getFairAdjustedPolling(35, [55, 48, 35]);
      expect(r).toBeGreaterThan(35);
    });

    it('returns capped polling unchanged for frontrunner without buff', () => {
      const r = getFairAdjustedPolling(70, [70, 50, 45]);
      // 70% → capped 60 + (10*0.2) = 62
      expect(r).toBeCloseTo(62, 2);
    });
  });
});
