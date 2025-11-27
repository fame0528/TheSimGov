/**
 * Polling Engine Tests
 * 
 * @fileoverview Comprehensive test suite for polling system including margin of error,
 * demographic breakdowns, volatility dampening, trend analysis, and state weighting.
 */

import {
  PollType,
  DemographicSegment,
  POLLING_INTERVAL_MINUTES,
  POLLING_INTERVAL_MS,
  SAMPLE_SIZES,
  BASE_MARGIN_OF_ERROR,
  OFFLINE_DAMPENING,
  calculateMarginOfError,
  generateDemographicBreakdown,
  calculateVolatilityDampening,
  applyVolatilityDampening,
  conductPoll,
  buildPollingTrend,
  calculateStateWeights,
  getNextPollTime,
  isPollDue,
} from '@/politics/engines/pollingEngine';

describe('Polling Engine', () => {
  const baseTime = 1700000000000;
  
  describe('calculateMarginOfError', () => {
    it('should return base MOE for standard sample sizes', () => {
      expect(calculateMarginOfError(PollType.NATIONAL)).toBeCloseTo(2.8, 1);
      expect(calculateMarginOfError(PollType.STATE)).toBeCloseTo(3.8, 1);
      expect(calculateMarginOfError(PollType.DISTRICT)).toBeCloseTo(4.9, 1);
    });
    
    it('should adjust MOE for custom sample sizes', () => {
      const customMOE = calculateMarginOfError(PollType.STATE, 1000);
      expect(customMOE).toBeLessThan(BASE_MARGIN_OF_ERROR[PollType.STATE]);
    });
    
    it('should apply methodology quality factor', () => {
      const lowQuality = calculateMarginOfError(PollType.NATIONAL, undefined, 1.2);
      const highQuality = calculateMarginOfError(PollType.NATIONAL, undefined, 0.8);
      
      expect(lowQuality).toBeGreaterThan(BASE_MARGIN_OF_ERROR[PollType.NATIONAL]);
      expect(highQuality).toBeLessThan(BASE_MARGIN_OF_ERROR[PollType.NATIONAL]);
    });
  });
  
  describe('generateDemographicBreakdown', () => {
    it('should generate demographics within reasonable range of overall support', () => {
      const overallSupport = 45;
      const demographics = generateDemographicBreakdown(
        overallSupport,
        { party: 'DEMOCRAT' },
        12345
      );
      
      // All demographics should be within ±15% of overall support
      Object.values(demographics).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(overallSupport - 15);
        expect(value).toBeLessThanOrEqual(overallSupport + 15);
      });
    });
    
    it('should be deterministic with same seed', () => {
      const demo1 = generateDemographicBreakdown(50, {}, 54321);
      const demo2 = generateDemographicBreakdown(50, {}, 54321);
      
      expect(demo1).toEqual(demo2);
    });
    
    it('should vary with different seeds', () => {
      const demo1 = generateDemographicBreakdown(50, {}, 11111);
      const demo2 = generateDemographicBreakdown(50, {}, 22222);
      
      expect(demo1).not.toEqual(demo2);
    });
    
    it('should include all major demographic segments', () => {
      const demographics = generateDemographicBreakdown(48, {}, 99999);
      
      expect(demographics[DemographicSegment.AGE_18_29]).toBeDefined();
      expect(demographics[DemographicSegment.MALE]).toBeDefined();
      expect(demographics[DemographicSegment.FEMALE]).toBeDefined();
      expect(demographics[DemographicSegment.COLLEGE_GRAD]).toBeDefined();
      expect(demographics[DemographicSegment.URBAN]).toBeDefined();
    });
  });
  
  describe('calculateVolatilityDampening', () => {
    it('should return full volatility for < 1 hour offline', () => {
      expect(calculateVolatilityDampening(0)).toBe(OFFLINE_DAMPENING.NONE);
      expect(calculateVolatilityDampening(0.5)).toBe(OFFLINE_DAMPENING.NONE);
    });
    
    it('should apply light dampening for 1-4 hours offline', () => {
      expect(calculateVolatilityDampening(1)).toBe(OFFLINE_DAMPENING.LIGHT);
      expect(calculateVolatilityDampening(2.5)).toBe(OFFLINE_DAMPENING.LIGHT);
      expect(calculateVolatilityDampening(3.9)).toBe(OFFLINE_DAMPENING.LIGHT);
    });
    
    it('should apply moderate dampening for 4-12 hours offline', () => {
      expect(calculateVolatilityDampening(4)).toBe(OFFLINE_DAMPENING.MODERATE);
      expect(calculateVolatilityDampening(8)).toBe(OFFLINE_DAMPENING.MODERATE);
      expect(calculateVolatilityDampening(11.9)).toBe(OFFLINE_DAMPENING.MODERATE);
    });
    
    it('should apply heavy dampening for 12+ hours offline', () => {
      expect(calculateVolatilityDampening(12)).toBe(OFFLINE_DAMPENING.HEAVY);
      expect(calculateVolatilityDampening(24)).toBe(OFFLINE_DAMPENING.HEAVY);
      expect(calculateVolatilityDampening(100)).toBe(OFFLINE_DAMPENING.HEAVY);
    });
  });
  
  describe('applyVolatilityDampening', () => {
    it('should not dampen for players online', () => {
      const dampened = applyVolatilityDampening(10, 0);
      expect(dampened).toBe(10);
    });
    
    it('should apply light dampening (25%)', () => {
      const dampened = applyVolatilityDampening(10, 2);
      expect(dampened).toBeCloseTo(7.5, 1); // 10 * 0.75
    });
    
    it('should apply moderate dampening (50%)', () => {
      const dampened = applyVolatilityDampening(10, 8);
      expect(dampened).toBeCloseTo(5, 1); // 10 * 0.5
    });
    
    it('should apply heavy dampening (75%)', () => {
      const dampened = applyVolatilityDampening(10, 15);
      expect(dampened).toBeCloseTo(2.5, 1); // 10 * 0.25
    });
    
    it('should work with negative deltas', () => {
      const dampened = applyVolatilityDampening(-8, 10);
      expect(dampened).toBeCloseTo(-4, 1); // -8 * 0.5
    });
  });
  
  describe('conductPoll', () => {
    it('should generate complete poll snapshot', () => {
      const poll = conductPoll(
        [
          {
            id: 'cand-1',
            name: 'Smith',
            baseSupport: 48,
            hoursOffline: 0,
          },
          {
            id: 'cand-2',
            name: 'Jones',
            baseSupport: 45,
            hoursOffline: 0,
          },
        ],
        PollType.NATIONAL,
        'NATIONAL',
        undefined,
        baseTime
      );
      
      expect(poll.pollId).toBeDefined();
      expect(poll.timestamp).toBe(baseTime);
      expect(poll.pollType).toBe(PollType.NATIONAL);
      expect(poll.geography).toBe('NATIONAL');
      expect(poll.sampleSize).toBe(SAMPLE_SIZES[PollType.NATIONAL]);
      expect(poll.marginOfError).toBeGreaterThan(0);
      expect(poll.candidates).toHaveLength(2);
      expect(poll.undecided).toBeGreaterThanOrEqual(0);
      expect(poll.volatility).toBeGreaterThanOrEqual(0);
      expect(poll.reliability).toBeGreaterThan(0);
    });
    
    it('should apply volatility dampening for offline players', () => {
      const previousPoll = conductPoll(
        [
          {
            id: 'cand-1',
            name: 'Smith',
            baseSupport: 45,
            hoursOffline: 0,
          },
        ],
        PollType.NATIONAL,
        'NATIONAL',
        undefined,
        baseTime
      );
      
      // Simulate 5% drop but player offline 10 hours (50% dampening)
      const newPoll = conductPoll(
        [
          {
            id: 'cand-1',
            name: 'Smith',
            baseSupport: 40, // 5% drop
            hoursOffline: 10, // Moderate dampening
          },
        ],
        PollType.NATIONAL,
        'NATIONAL',
        previousPoll,
        baseTime + 1000
      );
      
      const candidate = newPoll.candidates[0];
      // Delta should be dampened (~2.5% instead of 5%)
      expect(Math.abs(candidate.trendDelta)).toBeLessThan(3);
    });
    
    it('should include demographic breakdowns for all candidates', () => {
      const poll = conductPoll(
        [
          {
            id: 'cand-1',
            name: 'Smith',
            baseSupport: 50,
            hoursOffline: 0,
            profile: { party: 'DEMOCRAT' },
          },
        ],
        PollType.STATE,
        'PA',
        undefined,
        baseTime
      );
      
      const candidate = poll.candidates[0];
      expect(candidate.demographics).toBeDefined();
      expect(Object.keys(candidate.demographics).length).toBeGreaterThan(0);
    });
    
    it('should calculate undecided percentage correctly', () => {
      const poll = conductPoll(
        [
          {
            id: 'cand-1',
            name: 'Smith',
            baseSupport: 45,
            hoursOffline: 0,
          },
          {
            id: 'cand-2',
            name: 'Jones',
            baseSupport: 42,
            hoursOffline: 0,
          },
        ],
        PollType.NATIONAL,
        'NATIONAL',
        undefined,
        baseTime
      );
      
      const totalSupport = poll.candidates.reduce((sum, c) => sum + c.support, 0);
      expect(poll.undecided).toBeCloseTo(100 - totalSupport, 1);
    });
  });
  
  describe('buildPollingTrend', () => {
    it('should build trend from historical polls', () => {
      const polls = [
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 40, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 42, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 1000000
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 45, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 2000000
        ),
      ];
      
      const trend = buildPollingTrend('cand-1', 'Smith', 'NATIONAL', polls);
      
      expect(trend.candidateId).toBe('cand-1');
      expect(trend.geography).toBe('NATIONAL');
      expect(trend.snapshots).toHaveLength(3);
      expect(trend.trendDirection).toBe('RISING');
      expect(trend.momentum).toBeGreaterThan(0);
      expect(trend.peakSupport).toBeGreaterThanOrEqual(trend.lowSupport);
    });
    
    it('should identify falling trends', () => {
      const polls = [
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 50, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 47, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 1000000
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 44, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 2000000
        ),
      ];
      
      const trend = buildPollingTrend('cand-1', 'Smith', 'NATIONAL', polls);
      
      expect(trend.trendDirection).toBe('FALLING');
      expect(trend.momentum).toBeLessThan(0);
    });
    
    it('should identify stable trends', () => {
      const polls = [
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 48, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 48.2, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 1000000
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 47.9, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 2000000
        ),
      ];
      
      const trend = buildPollingTrend('cand-1', 'Smith', 'NATIONAL', polls);
      
      expect(trend.trendDirection).toBe('STABLE');
      expect(Math.abs(trend.momentum)).toBeLessThan(0.5);
    });
    
    it('should track peak and low support', () => {
      const polls = [
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 45, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 52, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 1000000
        ),
        conductPoll(
          [{ id: 'cand-1', name: 'Smith', baseSupport: 48, hoursOffline: 0 }],
          PollType.NATIONAL,
          'NATIONAL',
          undefined,
          baseTime + 2000000
        ),
      ];
      
      const trend = buildPollingTrend('cand-1', 'Smith', 'NATIONAL', polls);
      
      expect(trend.peakSupport).toBeGreaterThanOrEqual(52);
      expect(trend.lowSupport).toBeLessThanOrEqual(45);
    });
  });
  
  describe('calculateStateWeights', () => {
    it('should prioritize competitive swing states', () => {
      const weights = calculateStateWeights([
        { code: 'PA', electoralVotes: 19, competitiveness: 0.9 },
        { code: 'CA', electoralVotes: 54, competitiveness: 0.1 },
        { code: 'WY', electoralVotes: 3, competitiveness: 0.1 },
      ]);
      
      // PA should rank highest (competitive + moderate EV)
      expect(weights[0].stateCode).toBe('PA');
      
      // CA has more EV but low competitiveness
      expect(weights.find((w) => w.stateCode === 'CA')?.weight).toBeLessThan(
        weights.find((w) => w.stateCode === 'PA')?.weight ?? 0
      );
    });
    
    it('should calculate weight as electoral votes × competitiveness', () => {
      const weights = calculateStateWeights([
        { code: 'FL', electoralVotes: 30, competitiveness: 0.8 },
      ]);
      
      expect(weights[0].weight).toBeCloseTo(30 * 0.8, 1);
    });
    
    it('should sort by weight descending', () => {
      const weights = calculateStateWeights([
        { code: 'A', electoralVotes: 10, competitiveness: 0.5 },
        { code: 'B', electoralVotes: 20, competitiveness: 0.8 },
        { code: 'C', electoralVotes: 5, competitiveness: 0.9 },
      ]);
      
      expect(weights[0].stateCode).toBe('B'); // 20 * 0.8 = 16
      expect(weights[1].stateCode).toBe('A'); // 10 * 0.5 = 5
      expect(weights[2].stateCode).toBe('C'); // 5 * 0.9 = 4.5
    });
  });
  
  describe('getNextPollTime', () => {
    it('should add polling interval to last poll time', () => {
      const lastPoll = baseTime;
      const nextPoll = getNextPollTime(lastPoll);
      
      expect(nextPoll).toBe(lastPoll + POLLING_INTERVAL_MS);
    });
    
    it('should use 25-minute interval', () => {
      const interval = POLLING_INTERVAL_MS;
      expect(interval).toBe(25 * 60 * 1000);
    });
  });
  
  describe('isPollDue', () => {
    it('should return true when interval has passed', () => {
      const lastPoll = baseTime;
      const currentTime = baseTime + POLLING_INTERVAL_MS + 1000;
      
      expect(isPollDue(lastPoll, currentTime)).toBe(true);
    });
    
    it('should return false when interval has not passed', () => {
      const lastPoll = baseTime;
      const currentTime = baseTime + (POLLING_INTERVAL_MS / 2);
      
      expect(isPollDue(lastPoll, currentTime)).toBe(false);
    });
    
    it('should return true exactly at interval boundary', () => {
      const lastPoll = baseTime;
      const currentTime = baseTime + POLLING_INTERVAL_MS;
      
      expect(isPollDue(lastPoll, currentTime)).toBe(true);
    });
  });
  
  describe('Polling interval constants', () => {
    it('should have 25-minute interval', () => {
      expect(POLLING_INTERVAL_MINUTES).toBe(25);
    });
    
    it('should have correct sample sizes', () => {
      expect(SAMPLE_SIZES[PollType.NATIONAL]).toBe(1200);
      expect(SAMPLE_SIZES[PollType.STATE]).toBe(650);
      expect(SAMPLE_SIZES[PollType.DISTRICT]).toBe(400);
    });
    
    it('should have realistic margins of error', () => {
      expect(BASE_MARGIN_OF_ERROR[PollType.NATIONAL]).toBeGreaterThan(2);
      expect(BASE_MARGIN_OF_ERROR[PollType.NATIONAL]).toBeLessThan(4);
      expect(BASE_MARGIN_OF_ERROR[PollType.DISTRICT]).toBeGreaterThan(4);
    });
  });
});
