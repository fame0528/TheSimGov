import { describe, it, expect } from '@jest/globals';
import {
  clampOfflineDrift,
  getAutopilotConfig,
  computeCatchUpBuff,
  computeOfflineAdjustment,
  type OfflineClampConfig,
  type OfflineSnapshotData,
} from '../../src/politics/utils/offlineProtection';
// Fairness floor / retention utilities (DRY extracted version)
import {
  computeFairnessFloor,
  applyRetentionFloor,
  createInfluenceSnapshot,
  type InfluenceSnapshot
} from '../../src/lib/utils/politics/offlineProtection';
import { LEVEL_MINIMUMS, RETENTION_FLOOR_FACTOR } from '../../src/lib/utils/politics/influenceConstants';
import { computeBaselineInfluence } from '../../src/lib/utils/politics/influenceBase';

// Minimal mock to satisfy baseline influence input typing for parity tests
function buildBaselineInputs(overrides: Partial<any> = {}) {
  return {
    donationAmount: 8000,
    totalDonations: 8000,
    companyLevel: 4,
    compositeInfluenceWeight: 0.62,
    weeksToElection: 30,
    reputation: 58,
    successfulLobbies: 2,
    seed: 'retention-seed',
    previousSnapshotInfluence: overrides.previousSnapshotInfluence,
    ...overrides
  };
}

describe('offlineProtection', () => {
  describe('clampOfflineDrift', () => {
    const config: OfflineClampConfig = {
      maxNegativeDriftPerWeek: 5,
      gracePeriodWeeks: 10,
    };

    it('does not clamp within grace period', () => {
      expect(clampOfflineDrift(-100, 5, config)).toBe(-100);
      expect(clampOfflineDrift(-100, 10, config)).toBe(-100);
    });

    it('clamps after grace period', () => {
      const clamped = clampOfflineDrift(-100, 15, config);
      // 15 weeks - 10 grace = 5 weeks subject to clamp
      // Max loss = -5 * 5 = -25
      expect(clamped).toBe(-25);
    });

    it('does not clamp positive deltas', () => {
      expect(clampOfflineDrift(50, 20, config)).toBe(50);
    });

    it('does not clamp small negative deltas', () => {
      expect(clampOfflineDrift(-10, 12, config)).toBe(-10);
    });
  });

  describe('getAutopilotConfig', () => {
    it('returns defensive config', () => {
      const cfg = getAutopilotConfig('defensive');
      expect(cfg.strategy).toBe('defensive');
      expect(cfg.resourceEfficiencyMultiplier).toBe(0.7);
      expect(cfg.scandalProbabilityReduction).toBe(0.5);
    });

    it('returns balanced config', () => {
      const cfg = getAutopilotConfig('balanced');
      expect(cfg.strategy).toBe('balanced');
      expect(cfg.resourceEfficiencyMultiplier).toBe(1.0);
      expect(cfg.scandalProbabilityReduction).toBe(0.8);
    });

    it('returns growth config', () => {
      const cfg = getAutopilotConfig('growth');
      expect(cfg.strategy).toBe('growth');
      expect(cfg.resourceEfficiencyMultiplier).toBe(1.2);
      expect(cfg.scandalProbabilityReduction).toBe(1.0);
    });
  });

  describe('computeCatchUpBuff', () => {
    it('returns 1.0 for zero offline', () => {
      expect(computeCatchUpBuff(0)).toBe(1.0);
    });

    it('increases with offline time', () => {
      const b10 = computeCatchUpBuff(10);
      const b52 = computeCatchUpBuff(52);
      const b100 = computeCatchUpBuff(100);

      expect(b10).toBeGreaterThan(1.0);
      expect(b52).toBeGreaterThan(b10);
      expect(b100).toBeGreaterThan(b52);
    });

    it('caps at maxBuff', () => {
      const buff = computeCatchUpBuff(1000, 1.5);
      expect(buff).toBeLessThanOrEqual(1.5);
    });

    it('approaches maxBuff asymptotically', () => {
      const b1000 = computeCatchUpBuff(1000, 1.5, 52);
      expect(b1000).toBeCloseTo(1.5, 1);
    });
  });

  describe('computeOfflineAdjustment', () => {
    const config: OfflineClampConfig = {
      maxNegativeDriftPerWeek: 5,
      gracePeriodWeeks: 10,
    };

    const snapshot: OfflineSnapshotData = {
      playerId: 'player1',
      capturedAtWeek: 100,
      influence: 50,
      approvalRating: 60,
      autopilotStrategy: 'balanced',
    };

    it('applies clamp and catch-up buff', () => {
      const result = computeOfflineAdjustment(snapshot, 120, -100, config);
      // 20 weeks offline - 10 grace = 10 weeks subject
      // Max loss = -5 * 10 = -50
      expect(result.adjustedDelta).toBe(-50);
      expect(result.catchUpBuff).toBeGreaterThan(1.0);
    });

    it('does not clamp within grace', () => {
      const result = computeOfflineAdjustment(snapshot, 105, -20, config);
      // 5 weeks offline < 10 grace
      expect(result.adjustedDelta).toBe(-20);
      expect(result.catchUpBuff).toBeGreaterThan(1.0);
    });

    it('handles zero offline time', () => {
      const result = computeOfflineAdjustment(snapshot, 100, -50, config);
      expect(result.adjustedDelta).toBe(-50);
      expect(result.catchUpBuff).toBe(1.0);
    });
  });

  // ---------------- Fairness Floor & Retention Tests ----------------
  describe('computeFairnessFloor', () => {
    it('selects higher of level minimum vs retention fraction', () => {
      for (let level = 1; level <= 5; level++) {
        const prevVals = [undefined, 50, 300, 1000];
        prevVals.forEach(prev => {
          const expected = Math.max(LEVEL_MINIMUMS[level] ?? 0, prev ? prev * RETENTION_FLOOR_FACTOR : 0);
          expect(computeFairnessFloor(level, prev)).toBe(expected);
        });
      }
    });
  });

  describe('applyRetentionFloor', () => {
    it('applies retention when below retained floor', () => {
      const level = 4;
      const previousTotal = 500; // retention floor 500 * factor
      const snapshot: InfluenceSnapshot = { total: previousTotal, level, capturedAt: new Date().toISOString() };
      const raw = 200; // below both level minimum (150) and retention floor (450 if factor=0.9)
      const { adjusted, floorApplied, reason } = applyRetentionFloor(raw, snapshot, level);
      expect(adjusted).toBe(floorApplied);
      const retentionFloor = previousTotal * RETENTION_FLOOR_FACTOR;
      expect(floorApplied).toBe(Math.max(LEVEL_MINIMUMS[level], retentionFloor));
      expect(reason).toBe(floorApplied === retentionFloor ? 'retention' : 'level-minimum');
    });

    it('applies level minimum when no snapshot and raw below minimum', () => {
      const level = 3;
      const raw = 10; // below level minimum (60)
      const { adjusted, floorApplied, reason } = applyRetentionFloor(raw, undefined, level);
      expect(adjusted).toBe(LEVEL_MINIMUMS[level]);
      expect(floorApplied).toBe(LEVEL_MINIMUMS[level]);
      expect(reason).toBe('level-minimum');
    });

    it('leaves raw unchanged when above floor', () => {
      const level = 2;
      const previousTotal = 40; // retention 36 vs level min 25
      const snapshot: InfluenceSnapshot = { total: previousTotal, level, capturedAt: new Date().toISOString() };
      const raw = 120; // above both floors
      const { adjusted, floorApplied } = applyRetentionFloor(raw, snapshot, level);
      expect(floorApplied).toBe(Math.max(LEVEL_MINIMUMS[level], previousTotal * RETENTION_FLOOR_FACTOR));
      expect(adjusted).toBe(raw);
    });
  });

  describe('createInfluenceSnapshot', () => {
    it('captures total and level with timestamp', () => {
      const inputs = buildBaselineInputs({ companyLevel: 5 });
      const baseline = computeBaselineInfluence(inputs as any);
      const snap = createInfluenceSnapshot(baseline, inputs.companyLevel);
      expect(snap.total).toBe(baseline.total);
      expect(snap.level).toBe(inputs.companyLevel);
      expect(typeof snap.capturedAt).toBe('string');
    });
  });

  describe('baseline integration fairness clamp parity', () => {
    it('never returns total below fairness floor', () => {
      const previousSnapshotInfluence = 620;
      const inputs = buildBaselineInputs({ previousSnapshotInfluence, companyLevel: 4 });
      const floor = computeFairnessFloor(inputs.companyLevel, previousSnapshotInfluence);
      const result = computeBaselineInfluence(inputs as any);
      expect(result.total).toBeGreaterThanOrEqual(Math.round(floor));
    });
  });
});
