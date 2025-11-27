/**
 * Momentum Tracking System - Test Suite
 * 
 * @fileoverview Comprehensive tests for political campaign momentum analysis including
 * direction classification, swing state analysis, volatility calculations, and
 * outcome predictions.
 */

import {
  MomentumDirection,
  SwingStateCategory,
  MOMENTUM_THRESHOLDS,
  SWING_STATE_THRESHOLDS,
  calculateMomentumDirection,
  calculateSwingStateCategory,
  calculateVolatility,
  calculateCandidateMomentum,
  analyzeSwingState,
  calculateCampaignMomentumSummary,
  type CandidateMomentum,
  type SwingStateAnalysis,
} from '@/politics/systems/momentumTracking';
import type { PollSnapshot, PollingTrend } from '@/politics/engines/pollingEngine';

// Test helper to create poll snapshot
function createSnapshot(timestamp: number, candidates: Array<{ id: string; support: number }>): PollSnapshot {
  return {
    pollId: `poll-${timestamp}`,
    timestamp,
    gameWeek: 1,
    pollType: 'STATE' as any,
    geography: 'NATIONAL',
    sampleSize: 1000,
    marginOfError: 3.0,
    candidates: candidates.map((c) => ({
      candidateId: c.id,
      candidateName: `Candidate ${c.id}`,
      support: c.support,
      marginOfError: 3.0,
      trendDelta: 0,
      demographics: {},
    })),
    undecided: 0,
    volatility: 0.5,
    reliability: 0.95,
  };
}

// Test helper to create polling trend
function createTrend(snapshots: PollSnapshot[]): PollingTrend {
  return {
    candidateId: 'cand-1',
    candidateName: 'Candidate 1',
    geography: 'NATIONAL',
    snapshots: snapshots.map((s) => ({
      timestamp: s.timestamp,
      candidates: s.candidates,
    })),
    trendDirection: 'STABLE',
    momentum: 0,
    peakSupport: 0,
    lowSupport: 0,
  };
}

describe('Momentum Tracking - Constants', () => {
  it('should define momentum thresholds', () => {
    expect(MOMENTUM_THRESHOLDS.SURGING).toBe(2.0);
    expect(MOMENTUM_THRESHOLDS.RISING).toBe(0.5);
    expect(MOMENTUM_THRESHOLDS.STABLE).toBe(0.5);
    expect(MOMENTUM_THRESHOLDS.DECLINING).toBe(-0.5);
    expect(MOMENTUM_THRESHOLDS.COLLAPSING).toBe(-2.0);
  });

  it('should define swing state thresholds', () => {
    expect(SWING_STATE_THRESHOLDS.TOSS_UP).toBe(3.0);
    expect(SWING_STATE_THRESHOLDS.LEAN).toBe(7.0);
    expect(SWING_STATE_THRESHOLDS.LIKELY).toBe(15.0);
  });
});

describe('calculateMomentumDirection', () => {
  it('should classify SURGING momentum', () => {
    expect(calculateMomentumDirection(3.5)).toBe(MomentumDirection.SURGING);
    expect(calculateMomentumDirection(2.0)).toBe(MomentumDirection.SURGING);
  });

  it('should classify RISING momentum', () => {
    expect(calculateMomentumDirection(1.5)).toBe(MomentumDirection.RISING);
    expect(calculateMomentumDirection(0.5)).toBe(MomentumDirection.RISING);
  });

  it('should classify STABLE momentum', () => {
    expect(calculateMomentumDirection(0.3)).toBe(MomentumDirection.STABLE);
    expect(calculateMomentumDirection(0.0)).toBe(MomentumDirection.STABLE);
    expect(calculateMomentumDirection(-0.3)).toBe(MomentumDirection.STABLE);
  });

  it('should classify DECLINING momentum', () => {
    expect(calculateMomentumDirection(-1.5)).toBe(MomentumDirection.DECLINING);
    expect(calculateMomentumDirection(-0.5)).toBe(MomentumDirection.DECLINING);
  });

  it('should classify COLLAPSING momentum', () => {
    expect(calculateMomentumDirection(-3.5)).toBe(MomentumDirection.COLLAPSING);
    expect(calculateMomentumDirection(-2.0)).toBe(MomentumDirection.COLLAPSING);
  });
});

describe('calculateSwingStateCategory', () => {
  it('should classify TOSS_UP states', () => {
    expect(calculateSwingStateCategory(2.5)).toBe(SwingStateCategory.TOSS_UP);
    expect(calculateSwingStateCategory(-2.5)).toBe(SwingStateCategory.TOSS_UP);
    expect(calculateSwingStateCategory(0.0)).toBe(SwingStateCategory.TOSS_UP);
  });

  it('should classify LEAN states', () => {
    expect(calculateSwingStateCategory(5.0)).toBe(SwingStateCategory.LEAN_DEMOCRATIC);
    expect(calculateSwingStateCategory(-5.0)).toBe(SwingStateCategory.LEAN_REPUBLICAN);
  });

  it('should classify LIKELY states', () => {
    expect(calculateSwingStateCategory(10.0)).toBe(SwingStateCategory.LIKELY_DEMOCRATIC);
    expect(calculateSwingStateCategory(-10.0)).toBe(SwingStateCategory.LIKELY_REPUBLICAN);
  });

  it('should classify SAFE states', () => {
    expect(calculateSwingStateCategory(20.0)).toBe(SwingStateCategory.SAFE_DEMOCRATIC);
    expect(calculateSwingStateCategory(-20.0)).toBe(SwingStateCategory.SAFE_REPUBLICAN);
  });

  it('should handle boundary cases correctly', () => {
    expect(calculateSwingStateCategory(2.99)).toBe(SwingStateCategory.TOSS_UP);
    expect(calculateSwingStateCategory(3.01)).toBe(SwingStateCategory.LEAN_DEMOCRATIC);
    expect(calculateSwingStateCategory(6.99)).toBe(SwingStateCategory.LEAN_DEMOCRATIC);
    expect(calculateSwingStateCategory(7.01)).toBe(SwingStateCategory.LIKELY_DEMOCRATIC);
  });
});

describe('calculateVolatility', () => {
  it('should return 0 for single data point', () => {
    const trend = createTrend( [createSnapshot(Date.now(), [{ id: 'cand-1', support: 50 }])]);
    expect(calculateVolatility(trend, 'cand-1')).toBe(0);
  });

  it('should calculate standard deviation for stable support', () => {
    const trend = createTrend( [
        createSnapshot(Date.now() - 3000, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(Date.now() - 2000, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(Date.now() - 1000, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(Date.now(), [{ id: 'cand-1', support: 50 }]),
      ]);
    expect(calculateVolatility(trend, 'cand-1')).toBe(0);
  });

  it('should calculate standard deviation for varying support', () => {
    const trend = createTrend( [
        createSnapshot(Date.now() - 3000, [{ id: 'cand-1', support: 48 }]),
        createSnapshot(Date.now() - 2000, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(Date.now() - 1000, [{ id: 'cand-1', support: 52 }]),
        createSnapshot(Date.now(), [{ id: 'cand-1', support: 50 }]),
      ]);
    const volatility = calculateVolatility(trend, 'cand-1');
    expect(volatility).toBeGreaterThan(0);
    expect(volatility).toBeCloseTo(1.41, 1); // std dev of [48,50,52,50] ≈ 1.41
  });

  it('should handle missing candidate data', () => {
    const trend = createTrend( [
        createSnapshot(Date.now() - 2000, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(Date.now(), [{ id: 'cand-1', support: 52 }]),
      ]);
    // Requesting volatility for non-existent candidate
    expect(calculateVolatility(trend, 'cand-999')).toBe(0);
  });
});

describe('calculateCandidateMomentum', () => {
  const currentTime = Date.now();
  const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = currentTime - 14 * 24 * 60 * 60 * 1000;

  it('should return empty momentum for no data', () => {
    const trend = createTrend([]);
    const momentum = calculateCandidateMomentum(trend, 'cand-1', currentTime);

    expect(momentum.candidateId).toBe('cand-1');
    expect(momentum.currentSupport).toBe(0);
    expect(momentum.weeklyChange).toBe(0);
    expect(momentum.direction).toBe(MomentumDirection.STABLE);
  });

  it('should calculate current support from latest snapshot', () => {
    const trend = createTrend([
      createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 45 }]),
      createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }]),
    ]);
    const momentum = calculateCandidateMomentum(trend, 'cand-1', currentTime);

    expect(momentum.currentSupport).toBe(48);
  });

  it('should calculate weekly change correctly', () => {
    const trend = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 45 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }]),
      ]);
    const momentum = calculateCandidateMomentum(trend, 'cand-1', currentTime);

    expect(momentum.weeklyChange).toBe(3);
  });

  it('should classify momentum direction from weekly change', () => {
    const trendRising = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 45 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 46.5 }]),
      ]);
    const momentumRising = calculateCandidateMomentum(trendRising, 'cand-1', currentTime);
    expect(momentumRising.direction).toBe(MomentumDirection.RISING);

    const trendDeclining = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 50 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 49 }]),
      ]);
    const momentumDeclining = calculateCandidateMomentum(trendDeclining, 'cand-1', currentTime);
    expect(momentumDeclining.direction).toBe(MomentumDirection.DECLINING);
  });

  it('should track peak and low support', () => {
    const trend = createTrend( [
        createSnapshot(twoWeeksAgo, [{ id: 'cand-1', support: 45 }]),
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 52 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }]),
      ]);
    const momentum = calculateCandidateMomentum(trend, 'cand-1', currentTime);

    expect(momentum.peakSupport).toBe(52);
    expect(momentum.lowSupport).toBe(45);
    expect(momentum.daysFromPeak).toBe(7);
  });

  it('should calculate projected support', () => {
    const trend = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 45 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }]),
      ]);
    const momentum = calculateCandidateMomentum(trend, 'cand-1', currentTime);

    // Weekly change = +3, so projected = 48 + 3 = 51
    expect(momentum.projectedSupport).toBe(51);
  });

  it('should cap projected support at 0-100', () => {
    const trendHigh = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 95 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 98 }]),
      ]);
    const momentumHigh = calculateCandidateMomentum(trendHigh, 'cand-1', currentTime);
    expect(momentumHigh.projectedSupport).toBeLessThanOrEqual(100);

    const trendLow = createTrend( [
        createSnapshot(oneWeekAgo, [{ id: 'cand-1', support: 3 }]),
        createSnapshot(currentTime, [{ id: 'cand-1', support: 1 }]),
      ]);
    const momentumLow = calculateCandidateMomentum(trendLow, 'cand-1', currentTime);
    expect(momentumLow.projectedSupport).toBeGreaterThanOrEqual(0);
  });

  it('should calculate confidence based on data quality and volatility', () => {
    const trendStable = createTrend(Array.from({ length: 10 }, (_, i) =>
      createSnapshot(currentTime - i * 100000, [{ id: 'cand-1', support: 50 }])
    ));
    const momentumStable = calculateCandidateMomentum(trendStable, 'cand-1', currentTime);
    expect(momentumStable.confidence).toBeGreaterThan(0.8);

    const trendVolatile = createTrend([
      createSnapshot(currentTime - 300000, [{ id: 'cand-1', support: 40 }]),
      createSnapshot(currentTime - 200000, [{ id: 'cand-1', support: 60 }]),
      createSnapshot(currentTime - 100000, [{ id: 'cand-1', support: 45 }]),
      createSnapshot(currentTime, [{ id: 'cand-1', support: 55 }]),
    ]);
    const momentumVolatile = calculateCandidateMomentum(trendVolatile, 'cand-1', currentTime);
    expect(momentumVolatile.confidence).toBeLessThan(0.6);
  });
});

describe('analyzeSwingState', () => {
  const currentTime = Date.now();

  it('should return default analysis for insufficient data', () => {
    const trend = createTrend([]);
    const analysis = analyzeSwingState('PA', 'Pennsylvania', 19, trend, currentTime);

    expect(analysis.stateCode).toBe('PA');
    expect(analysis.electoralVotes).toBe(19);
    expect(analysis.category).toBe(SwingStateCategory.TOSS_UP);
  });

  it('should identify leading candidate and margin', () => {
    const trend = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 48 },
          { id: 'cand-2', support: 45 },
        ]),
      ]);
    const analysis = analyzeSwingState('PA', 'Pennsylvania', 19, trend, currentTime);

    expect(analysis.leadingCandidate).toBe('cand-1');
    expect(analysis.margin).toBe(3);
  });

  it('should classify state competitiveness correctly', () => {
    const trendTossUp = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 48.5 },
          { id: 'cand-2', support: 47.0 },
        ]),
      ]);
    const analysisTossUp = analyzeSwingState('PA', 'Pennsylvania', 19, trendTossUp, currentTime);
    expect(analysisTossUp.category).toBe(SwingStateCategory.TOSS_UP);

    const trendLean = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 52 },
          { id: 'cand-2', support: 47 },
        ]),
      ]);
    const analysisLean = analyzeSwingState('FL', 'Florida', 29, trendLean, currentTime);
    expect(analysisLean.category).toBe(SwingStateCategory.LEAN_DEMOCRATIC);
  });

  it('should calculate competitiveness score inverse to margin', () => {
    const trendClose = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 48.5 },
          { id: 'cand-2', support: 47.5 },
        ]),
      ]);
    const analysisClose = analyzeSwingState('PA', 'Pennsylvania', 19, trendClose, currentTime);
    expect(analysisClose.competitivenessScore).toBeGreaterThan(0.9);

    const trendSafe = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 60 },
          { id: 'cand-2', support: 35 },
        ]),
      ]);
    const analysisSafe = analyzeSwingState('CA', 'California', 54, trendSafe, currentTime);
    expect(analysisSafe.competitivenessScore).toBeLessThan(0.2);
  });

  it('should calculate electoral weight from votes and competitiveness', () => {
    const trend = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 48.5 },
          { id: 'cand-2', support: 47.5 },
        ]),
      ]);
    const analysis = analyzeSwingState('PA', 'Pennsylvania', 19, trend, currentTime);

    // High competitiveness (~0.95) × 19 EVs ≈ 18
    expect(analysis.electoralWeight).toBeGreaterThan(17);
    expect(analysis.electoralWeight).toBeLessThanOrEqual(19);
  });

  it('should analyze margin trend from historical data', () => {
    const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;

    const trendNarrowing = createTrend( [
        createSnapshot(oneWeekAgo, [
          { id: 'cand-1', support: 50 },
          { id: 'cand-2', support: 45 },
        ]),
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 49 },
          { id: 'cand-2', support: 47 },
        ]),
      ]);
    const analysisNarrowing = analyzeSwingState('PA', 'Pennsylvania', 19, trendNarrowing, currentTime);
    expect(analysisNarrowing.marginTrend).toBe('NARROWING');
    expect(analysisNarrowing.recentShift).toBe(-3); // From 5% to 2%
  });

  it('should calculate win probability for candidates', () => {
    const trend = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 52 },
          { id: 'cand-2', support: 45 },
        ]),
      ]);
    const analysis = analyzeSwingState('PA', 'Pennsylvania', 19, trend, currentTime);

    expect(analysis.winProbability['cand-1']).toBeGreaterThan(0.5);
    expect(analysis.winProbability['cand-2']).toBeLessThan(0.5);
    
    // Probabilities should sum to ~1.0 for top 2 candidates
    const total = analysis.winProbability['cand-1'] + analysis.winProbability['cand-2'];
    expect(total).toBeCloseTo(1.0, 1);
  });
});

describe('calculateCampaignMomentumSummary', () => {
  const currentTime = Date.now();

  it('should calculate national momentum for all candidates', () => {
    const nationalTrend = createTrend( [
        createSnapshot(currentTime, [
          { id: 'cand-1', support: 48 },
          { id: 'cand-2', support: 45 },
        ]),
      ]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      new Map(),
      new Map(),
      new Map(),
      currentTime
    );

    expect(summary.nationalMomentum.length).toBe(2);
    expect(summary.nationalMomentum[0].candidateId).toBe('cand-1');
    expect(summary.nationalMomentum[1].candidateId).toBe('cand-2');
  });

  it('should analyze all swing states', () => {
    const nationalTrend = createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }])]);

    const stateTrends = new Map([
      ['PA', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }, { id: 'cand-2', support: 46 }])])],
      ['FL', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 50 }, { id: 'cand-2', support: 47 }])])],
    ]);

    const electoralVotes = new Map([['PA', 19], ['FL', 29]]);
    const stateNames = new Map([['PA', 'Pennsylvania'], ['FL', 'Florida']]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      stateTrends,
      electoralVotes,
      stateNames,
      currentTime
    );

    expect(summary.swingStates.length).toBe(2);
    expect(summary.swingStates[0].stateCode).toBeDefined();
  });

  it('should rank swing states by electoral weight', () => {
    const nationalTrend = createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }])]);

    const stateTrends = new Map([
      ['NH', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48.5 }, { id: 'cand-2', support: 47.5 }])])], // 4 EVs, toss-up
      ['PA', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48.5 }, { id: 'cand-2', support: 47.5 }])])], // 19 EVs, toss-up
    ]);

    const electoralVotes = new Map([['NH', 4], ['PA', 19]]);
    const stateNames = new Map([['NH', 'New Hampshire'], ['PA', 'Pennsylvania']]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      stateTrends,
      electoralVotes,
      stateNames,
      currentTime
    );

    // PA should rank higher (more EVs with same competitiveness)
    expect(summary.swingStates[0].stateCode).toBe('PA');
    expect(summary.swingStates[0].priorityRank).toBe(1);
    expect(summary.swingStates[1].stateCode).toBe('NH');
    expect(summary.swingStates[1].priorityRank).toBe(2);
  });

  it('should filter toss-up states correctly', () => {
    const nationalTrend = createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }])]);

    const stateTrends = new Map([
      ['PA', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48.5 }, { id: 'cand-2', support: 47.0 }])])], // Toss-up
      ['FL', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 55 }, { id: 'cand-2', support: 44 }])])], // Safe
    ]);

    const electoralVotes = new Map([['PA', 19], ['TX', 40]]);
    const stateNames = new Map([['PA', 'Pennsylvania'], ['TX', 'Texas']]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      stateTrends,
      electoralVotes,
      stateNames,
      currentTime
    );

    expect(summary.tossUpStates.length).toBe(1);
    expect(summary.tossUpStates[0].stateCode).toBe('PA');
  });

  it('should calculate electoral vote projection', () => {
    const nationalTrend = createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }])]);

    const stateTrends = new Map([
      ['PA', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 52 }, { id: 'cand-2', support: 45 }])])],
      ['FL', createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 48 }, { id: 'cand-2', support: 50 }])])],
    ]);

    const electoralVotes = new Map([['PA', 19], ['FL', 29]]);
    const stateNames = new Map([['PA', 'Pennsylvania'], ['FL', 'Florida']]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      stateTrends,
      electoralVotes,
      stateNames,
      currentTime
    );

    expect(summary.electoralVoteProjection['cand-1']).toBe(19);
    expect(summary.electoralVoteProjection['cand-2']).toBe(29);
  });

  it('should determine overall trend from electoral vote projection', () => {
    const nationalTrend = createTrend([createSnapshot(currentTime, [{ id: 'cand-1', support: 52 }, { id: 'cand-2', support: 45 }])]);

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      new Map(),
      new Map(),
      new Map(),
      currentTime
    );

    // With no state data, should be toss-up
    expect(summary.overallTrend).toBe('TOSS_UP');
  });

  it('should calculate overall confidence from national momentum', () => {
    const nationalTrend = createTrend(Array.from({ length: 10 }, (_, i) =>
      createSnapshot(currentTime - i * 100000, [{ id: 'cand-1', support: 50 }])
    ));

    const summary = calculateCampaignMomentumSummary(
      'camp-001',
      nationalTrend,
      new Map(),
      new Map(),
      new Map(),
      currentTime
    );

    // High confidence due to stable data
    expect(summary.confidence).toBeGreaterThan(0.8);
  });
});
