import { describe, it, expect } from '@jest/globals';
import {
  computeDerivedMetrics,
  getDerivedMetricsForState,
  type StateMetrics,
  type DerivedMetrics,
} from '../../src/politics/utils/stateDerivedMetrics';

describe('stateDerivedMetrics', () => {
  const sampleStates: StateMetrics[] = [
    { stateCode: 'CA', population: 39_500_000, gdp: 3_600_000, houseSeats: 52, senateSeats: 2, crimeIndex: 450 },
    { stateCode: 'TX', population: 29_000_000, gdp: 2_100_000, houseSeats: 38, senateSeats: 2, crimeIndex: 380 },
    { stateCode: 'WY', population: 580_000, gdp: 40_000, houseSeats: 1, senateSeats: 2, crimeIndex: 210 },
  ];

  describe('computeDerivedMetrics', () => {
    it('computes normalized shares correctly', () => {
      const derived = computeDerivedMetrics(sampleStates);

      // CA should have highest shares
      const ca = derived.find((d: DerivedMetrics) => d.stateCode === 'CA')!;
      expect(ca.populationShare).toBeGreaterThan(0.5);
      expect(ca.gdpShare).toBeGreaterThan(0.6);

      // All shares should be [0, 1]
      derived.forEach((d: DerivedMetrics) => {
        expect(d.populationShare).toBeGreaterThanOrEqual(0);
        expect(d.populationShare).toBeLessThanOrEqual(1);
        expect(d.gdpShare).toBeGreaterThanOrEqual(0);
        expect(d.gdpShare).toBeLessThanOrEqual(1);
        expect(d.seatShare).toBeGreaterThanOrEqual(0);
        expect(d.seatShare).toBeLessThanOrEqual(1);
        expect(d.crimePercentile).toBeGreaterThanOrEqual(0);
        expect(d.crimePercentile).toBeLessThanOrEqual(1);
        expect(d.compositeInfluenceWeight).toBeGreaterThanOrEqual(0);
        expect(d.compositeInfluenceWeight).toBeLessThanOrEqual(1);
      });
    });

    it('assigns crime percentiles correctly', () => {
      const derived = computeDerivedMetrics(sampleStates);
      const wy = derived.find((d: DerivedMetrics) => d.stateCode === 'WY')!;
      const tx = derived.find((d: DerivedMetrics) => d.stateCode === 'TX')!;
      const ca = derived.find((d: DerivedMetrics) => d.stateCode === 'CA')!;

      // WY has lowest crime → 0 percentile
      expect(wy.crimePercentile).toBe(0);
      // CA has highest crime → 1 percentile
      expect(ca.crimePercentile).toBe(1);
      // TX in middle → 0.5 percentile
      expect(tx.crimePercentile).toBe(0.5);
    });

    it('handles single state edge case', () => {
      const single = computeDerivedMetrics([sampleStates[0]]);
      expect(single[0].populationShare).toBe(1);
      expect(single[0].gdpShare).toBe(1);
      expect(single[0].seatShare).toBe(1);
      expect(single[0].crimePercentile).toBe(0.5); // single state gets middle percentile
    });

    it('handles zero totals with epsilon', () => {
      const zeros: StateMetrics[] = [
        { stateCode: 'ZZ', population: 0, gdp: 0, houseSeats: 0, senateSeats: 0, crimeIndex: 0 },
      ];
      const derived = computeDerivedMetrics(zeros);
      expect(derived[0].populationShare).toBe(0);
      expect(derived[0].gdpShare).toBe(0);
      expect(derived[0].seatShare).toBe(0);
    });
  });

  describe('getDerivedMetricsForState', () => {
    it('retrieves metrics for existing state', () => {
      const derived = computeDerivedMetrics(sampleStates);
      const ca = getDerivedMetricsForState(derived, 'CA');
      expect(ca).not.toBeNull();
      expect(ca!.stateCode).toBe('CA');
    });

    it('returns null for non-existent state', () => {
      const derived = computeDerivedMetrics(sampleStates);
      const missing = getDerivedMetricsForState(derived, 'XX');
      expect(missing).toBeNull();
    });
  });
});
