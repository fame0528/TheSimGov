import {
  getOfflineDampeningMultiplier,
  getAdaptiveSmoothingFactor,
  computeStateWeightedSupport,
} from '@/lib/utils/politics/polling';

describe('polling helpers', () => {
  describe('getOfflineDampeningMultiplier', () => {
    it('returns 1.0 at or below 6 hours', () => {
      expect(getOfflineDampeningMultiplier(0)).toBeCloseTo(1.0);
      expect(getOfflineDampeningMultiplier(6 * 3600)).toBeCloseTo(1.0);
    });

    it('returns 0.75 over 6 hours', () => {
      expect(getOfflineDampeningMultiplier(7 * 3600)).toBeCloseTo(0.75);
    });

    it('returns 0.5 over 24 hours', () => {
      expect(getOfflineDampeningMultiplier(25 * 3600)).toBeCloseTo(0.5);
    });

    it('returns 0.25 over 72 hours', () => {
      expect(getOfflineDampeningMultiplier(73 * 3600)).toBeCloseTo(0.25);
    });
  });

  describe('getAdaptiveSmoothingFactor', () => {
    it('returns 0.3 at or below 6 hours', () => {
      expect(getAdaptiveSmoothingFactor(0)).toBeCloseTo(0.3);
      expect(getAdaptiveSmoothingFactor(6 * 3600)).toBeCloseTo(0.3);
    });

    it('returns 0.4 over 6 hours', () => {
      expect(getAdaptiveSmoothingFactor(7 * 3600)).toBeCloseTo(0.4);
    });

    it('returns 0.5 over 24 hours', () => {
      expect(getAdaptiveSmoothingFactor(25 * 3600)).toBeCloseTo(0.5);
    });

    it('returns 0.6 over 72 hours', () => {
      expect(getAdaptiveSmoothingFactor(73 * 3600)).toBeCloseTo(0.6);
    });
  });

  describe('computeStateWeightedSupport', () => {
    it('applies a 0.85x multiplier at weight 0', () => {
      expect(computeStateWeightedSupport(50, 0)).toBeCloseTo(42.5);
    });

    it('applies a 1.15x multiplier at weight 1', () => {
      expect(computeStateWeightedSupport(50, 1)).toBeCloseTo(57.5);
    });

    it('applies a ~1.0x multiplier at weight 0.5', () => {
      expect(computeStateWeightedSupport(50, 0.5)).toBeCloseTo(50, 1);
    });

    it('clamps output between 0 and 100', () => {
      expect(computeStateWeightedSupport(200, 1)).toBeLessThanOrEqual(100);
      expect(computeStateWeightedSupport(-10, 0)).toBeGreaterThanOrEqual(0);
    });
  });
});
