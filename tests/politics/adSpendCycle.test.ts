/**
 * Ad Spend Effectiveness Cycle - Test Suite
 * 
 * @fileoverview Comprehensive tests for campaign advertising system including
 * CPM calculations, impressions, diminishing returns, polling impact, budget
 * optimization, and cycle scheduling.
 */

import {
  AdMediaType,
  AD_CYCLE_INTERVAL_MINUTES,
  AD_CYCLE_INTERVAL_MS,
  BASE_CPM,
  BASE_EFFECTIVENESS,
  DIMINISHING_RETURNS,
  calculateCPM,
  calculateImpressions,
  calculateEffectiveness,
  calculatePollingImpact,
  executeAdBuy,
  aggregateAdPerformance,
  optimizeBudgetAllocation,
  getNextAdCycleTime,
  isAdCycleDue,
  type AdBuy,
  type AdCampaignSummary,
} from '@/politics/engines/adSpendCycle';

describe('Ad Spend Cycle - Constants', () => {
  it('should define 8.5 minute cycle interval', () => {
    expect(AD_CYCLE_INTERVAL_MINUTES).toBe(8.5);
    expect(AD_CYCLE_INTERVAL_MS).toBe(8.5 * 60 * 1000);
    expect(AD_CYCLE_INTERVAL_MS).toBe(510000);
  });

  it('should define CPM for all media types', () => {
    expect(BASE_CPM[AdMediaType.TELEVISION]).toBe(35);
    expect(BASE_CPM[AdMediaType.CABLE]).toBe(18);
    expect(BASE_CPM[AdMediaType.RADIO]).toBe(8);
    expect(BASE_CPM[AdMediaType.DIGITAL]).toBe(12);
    expect(BASE_CPM[AdMediaType.PRINT]).toBe(15);
    expect(BASE_CPM[AdMediaType.OUTDOOR]).toBe(10);
    expect(BASE_CPM[AdMediaType.DIRECT_MAIL]).toBe(500);
  });

  it('should define effectiveness for all media types', () => {
    expect(BASE_EFFECTIVENESS[AdMediaType.TELEVISION]).toBe(0.75);
    expect(BASE_EFFECTIVENESS[AdMediaType.CABLE]).toBe(0.65);
    expect(BASE_EFFECTIVENESS[AdMediaType.RADIO]).toBe(0.45);
    expect(BASE_EFFECTIVENESS[AdMediaType.DIGITAL]).toBe(0.60);
    expect(BASE_EFFECTIVENESS[AdMediaType.PRINT]).toBe(0.40);
    expect(BASE_EFFECTIVENESS[AdMediaType.OUTDOOR]).toBe(0.35);
    expect(BASE_EFFECTIVENESS[AdMediaType.DIRECT_MAIL]).toBe(0.70);
  });

  it('should define diminishing returns parameters', () => {
    expect(DIMINISHING_RETURNS.SCALE_FACTOR).toBe(0.15);
    expect(DIMINISHING_RETURNS.MIN_EFFECTIVENESS).toBe(0.1);
    expect(DIMINISHING_RETURNS.SATURATION_THRESHOLD).toBe(1000000);
  });
});

describe('calculateCPM', () => {
  it('should return base CPM for average market with no competition', () => {
    const cpm = calculateCPM(AdMediaType.TELEVISION, 1000000, 0);
    expect(cpm).toBeCloseTo(35, 1);
  });

  it('should increase CPM for larger markets', () => {
    const smallMarket = calculateCPM(AdMediaType.TELEVISION, 1000000, 0.5);
    const largeMarket = calculateCPM(AdMediaType.TELEVISION, 10000000, 0.5);
    expect(largeMarket).toBeGreaterThan(smallMarket);
  });

  it('should increase CPM with higher competition', () => {
    const lowCompetition = calculateCPM(AdMediaType.TELEVISION, 5000000, 0.2);
    const highCompetition = calculateCPM(AdMediaType.TELEVISION, 5000000, 0.9);
    expect(highCompetition).toBeGreaterThan(lowCompetition);
  });

  it('should scale CPM reasonably for different media types', () => {
    const tvCPM = calculateCPM(AdMediaType.TELEVISION, 5000000, 0.5);
    const radioCPM = calculateCPM(AdMediaType.RADIO, 5000000, 0.5);
    const directMailCPM = calculateCPM(AdMediaType.DIRECT_MAIL, 5000000, 0.5);

    // TV should be more expensive than radio, but less than direct mail
    expect(tvCPM).toBeGreaterThan(radioCPM);
    expect(directMailCPM).toBeGreaterThan(tvCPM);
  });
});

describe('calculateImpressions', () => {
  it('should calculate impressions correctly from budget and CPM', () => {
    const impressions = calculateImpressions(10000, 35);
    // 10000 / 35 * 1000 = ~285,714
    expect(impressions).toBeCloseTo(285714, 0);
  });

  it('should return 0 impressions for zero CPM', () => {
    const impressions = calculateImpressions(10000, 0);
    expect(impressions).toBe(0);
  });

  it('should scale impressions proportionally to budget', () => {
    const impressions1 = calculateImpressions(5000, 20);
    const impressions2 = calculateImpressions(10000, 20);
    expect(impressions2).toBeCloseTo(impressions1 * 2, 0);
  });

  it('should provide more impressions for lower CPM', () => {
    const highCPM = calculateImpressions(10000, 50);
    const lowCPM = calculateImpressions(10000, 10);
    expect(lowCPM).toBeGreaterThan(highCPM);
  });
});

describe('calculateEffectiveness', () => {
  it('should return base effectiveness for zero previous spend', () => {
    const effectiveness = calculateEffectiveness(AdMediaType.TELEVISION, 0);
    expect(effectiveness).toBe(0.75);
  });

  it('should apply diminishing returns for increasing spend', () => {
    const eff0 = calculateEffectiveness(AdMediaType.TELEVISION, 0);
    const eff100k = calculateEffectiveness(AdMediaType.TELEVISION, 100000);
    const eff500k = calculateEffectiveness(AdMediaType.TELEVISION, 500000);
    const eff1m = calculateEffectiveness(AdMediaType.TELEVISION, 1000000);

    // Each should be less effective than previous
    expect(eff100k).toBeLessThan(eff0);
    expect(eff500k).toBeLessThan(eff100k);
    expect(eff1m).toBeLessThan(eff500k);
  });

  it('should enforce minimum effectiveness floor', () => {
    // Even with massive spending, effectiveness should not fall below min
    const effectiveness = calculateEffectiveness(AdMediaType.TELEVISION, 10000000);
    const minAllowed = BASE_EFFECTIVENESS[AdMediaType.TELEVISION] * DIMINISHING_RETURNS.MIN_EFFECTIVENESS;
    expect(effectiveness).toBeGreaterThanOrEqual(minAllowed * 0.99); // Allow tiny rounding
  });

  it('should apply diminishing returns differently by media type', () => {
    const tvEff = calculateEffectiveness(AdMediaType.TELEVISION, 500000);
    const radioEff = calculateEffectiveness(AdMediaType.RADIO, 500000);

    // Both should diminish, but preserve relative base effectiveness
    expect(tvEff).toBeGreaterThan(radioEff);
  });
});

describe('calculatePollingImpact', () => {
  it('should calculate impact from impressions and effectiveness', () => {
    const impact = calculatePollingImpact(500000, 0.75, 10000000);
    // (500000 / 10000000) * 0.75 * 100 = 3.75%
    expect(impact).toBeCloseTo(3.75, 2);
  });

  it('should return 0 for zero market size', () => {
    const impact = calculatePollingImpact(500000, 0.75, 0);
    expect(impact).toBe(0);
  });

  it('should cap impact at 10% max per ad buy', () => {
    // Huge impressions in small market should still cap at 10%
    const impact = calculatePollingImpact(50000000, 1.0, 10000000);
    expect(impact).toBeLessThanOrEqual(10);
  });

  it('should scale impact proportionally to penetration', () => {
    const impact1 = calculatePollingImpact(250000, 0.75, 10000000);
    const impact2 = calculatePollingImpact(500000, 0.75, 10000000);
    expect(impact2).toBeCloseTo(impact1 * 2, 2);
  });

  it('should scale impact proportionally to effectiveness', () => {
    const impact1 = calculatePollingImpact(500000, 0.5, 10000000);
    const impact2 = calculatePollingImpact(500000, 1.0, 10000000);
    expect(impact2).toBeCloseTo(impact1 * 2, 2);
  });
});

describe('executeAdBuy', () => {
  const timestamp = Date.now();

  it('should create complete ad buy with all metrics', () => {
    const adBuy = executeAdBuy(
      'camp-001',
      AdMediaType.TELEVISION,
      'NATIONAL',
      50000,
      100000000,
      0,
      0,
      timestamp
    );

    expect(adBuy.campaignId).toBe('camp-001');
    expect(adBuy.mediaType).toBe(AdMediaType.TELEVISION);
    expect(adBuy.geography).toBe('NATIONAL');
    expect(adBuy.budget).toBe(50000);
    expect(adBuy.timestamp).toBe(timestamp);
    expect(adBuy.adBuyId).toContain('camp-001');
    expect(adBuy.marketSize).toBe(100000000);
  });

  it('should calculate impressions from budget and CPM', () => {
    const adBuy = executeAdBuy(
      'camp-001',
      AdMediaType.RADIO,
      'PA',
      10000,
      13000000,
      0,
      0,
      timestamp
    );

    // CPM for radio ~8, so impressions should be ~1.25M
    expect(adBuy.impressions).toBeGreaterThan(1000000);
    expect(adBuy.cpm).toBeGreaterThan(0);
  });

  it('should apply diminishing returns based on previous spend', () => {
    const adBuy1 = executeAdBuy(
      'camp-001',
      AdMediaType.TELEVISION,
      'NATIONAL',
      50000,
      100000000,
      0, // No previous spend
      0,
      timestamp
    );

    const adBuy2 = executeAdBuy(
      'camp-001',
      AdMediaType.TELEVISION,
      'NATIONAL',
      50000,
      100000000,
      500000, // $500K previous spend
      0,
      timestamp
    );

    // Second ad should be less effective due to diminishing returns
    expect(adBuy2.effectiveness).toBeLessThan(adBuy1.effectiveness);
    expect(adBuy2.pollingImpact).toBeLessThan(adBuy1.pollingImpact);
  });

  it('should calculate polling impact correctly', () => {
    const adBuy = executeAdBuy(
      'camp-001',
      AdMediaType.DIGITAL,
      'FL',
      25000,
      21500000,
      0,
      0,
      timestamp
    );

    expect(adBuy.pollingImpact).toBeGreaterThan(0);
    expect(adBuy.pollingImpact).toBeLessThanOrEqual(10);
  });

  it('should increase CPM with competitor spend', () => {
    const adBuyNoCompetition = executeAdBuy(
      'camp-001',
      AdMediaType.TELEVISION,
      'PA',
      50000,
      13000000,
      0,
      0, // No competitor spend
      timestamp
    );

    const adBuyHighCompetition = executeAdBuy(
      'camp-001',
      AdMediaType.TELEVISION,
      'PA',
      50000,
      13000000,
      0,
      40000, // High competitor spend
      timestamp
    );

    expect(adBuyHighCompetition.cpm).toBeGreaterThan(adBuyNoCompetition.cpm);
  });
});

describe('aggregateAdPerformance', () => {
  const timestamp = Date.now();

  it('should return empty summary for no ad buys', () => {
    const summary = aggregateAdPerformance('camp-001', []);

    expect(summary.campaignId).toBe('camp-001');
    expect(summary.totalSpent).toBe(0);
    expect(summary.totalImpressions).toBe(0);
    expect(summary.estimatedPollingGain).toBe(0);
  });

  it('should aggregate total spending and impressions', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
      executeAdBuy('camp-001', AdMediaType.DIGITAL, 'PA', 25000, 13000000, 50000, 0, timestamp + 1000),
      executeAdBuy('camp-001', AdMediaType.RADIO, 'FL', 10000, 21500000, 75000, 0, timestamp + 2000),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    expect(summary.totalSpent).toBe(85000);
    expect(summary.totalImpressions).toBeGreaterThan(0);
    expect(summary.estimatedPollingGain).toBeGreaterThan(0);
  });

  it('should calculate average CPM correctly', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 50000, 0, timestamp + 1000),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    // Average CPM should be (totalSpent / totalImpressions) * 1000
    const expectedCPM = (summary.totalSpent / summary.totalImpressions) * 1000;
    expect(summary.averageCPM).toBeCloseTo(expectedCPM, 2);
  });

  it('should break down spending by media type', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
      executeAdBuy('camp-001', AdMediaType.DIGITAL, 'PA', 25000, 13000000, 50000, 0, timestamp + 1000),
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'FL', 30000, 21500000, 75000, 0, timestamp + 2000),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    expect(summary.spendByMedia[AdMediaType.TELEVISION]).toBe(80000);
    expect(summary.spendByMedia[AdMediaType.DIGITAL]).toBe(25000);
    expect(summary.impressionsByMedia[AdMediaType.TELEVISION]).toBeGreaterThan(0);
  });

  it('should calculate cost per polling point', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    // Cost per point = total spent / polling gain
    const expectedCostPerPoint = summary.totalSpent / summary.estimatedPollingGain;
    expect(summary.costPerPoint).toBeCloseTo(expectedCostPerPoint, 2);
  });

  it('should calculate efficiency score', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    // Efficiency should be 0-1, higher is better
    expect(summary.efficiency).toBeGreaterThanOrEqual(0);
    expect(summary.efficiency).toBeLessThanOrEqual(1);
  });

  it('should filter ad buys by campaign ID', () => {
    const adBuys: AdBuy[] = [
      executeAdBuy('camp-001', AdMediaType.TELEVISION, 'NATIONAL', 50000, 100000000, 0, 0, timestamp),
      executeAdBuy('camp-002', AdMediaType.DIGITAL, 'PA', 25000, 13000000, 0, 0, timestamp + 1000),
      executeAdBuy('camp-001', AdMediaType.RADIO, 'FL', 10000, 21500000, 0, 0, timestamp + 2000),
    ];

    const summary = aggregateAdPerformance('camp-001', adBuys);

    // Should only include camp-001 ads ($60K total)
    expect(summary.totalSpent).toBe(60000);
  });
});

describe('optimizeBudgetAllocation', () => {
  it('should allocate budget across all media types', () => {
    const allocation = optimizeBudgetAllocation(100000, 10000000, {});

    // Should have allocation for each media type
    const mediaTypes = Object.keys(allocation);
    expect(mediaTypes.length).toBe(7);

    // Total allocation should equal budget
    const total = Object.values(allocation).reduce((sum, amount) => sum + amount, 0);
    expect(total).toBeCloseTo(100000, 0);
  });

  it('should favor more efficient media types', () => {
    const allocation = optimizeBudgetAllocation(100000, 10000000, {});

    // Digital should get more budget than print (better efficiency: lower CPM, good effectiveness)
    expect(allocation[AdMediaType.DIGITAL]).toBeGreaterThan(allocation[AdMediaType.PRINT]);
    
    // Radio should get more than print (very cheap CPM despite lower effectiveness)
    expect(allocation[AdMediaType.RADIO]).toBeGreaterThan(allocation[AdMediaType.PRINT]);
  });

  it('should account for previous spending diminishing returns', () => {
    const previousSpend = {
      [AdMediaType.TELEVISION]: 500000, // Heavy previous TV spending
    };

    const allocation = optimizeBudgetAllocation(100000, 10000000, previousSpend);

    // Should reduce TV allocation due to diminishing returns
    const freshAllocation = optimizeBudgetAllocation(100000, 10000000, {});
    expect(allocation[AdMediaType.TELEVISION]).toBeLessThan(freshAllocation[AdMediaType.TELEVISION]);
  });

  it('should return positive allocations for all media types', () => {
    const allocation = optimizeBudgetAllocation(100000, 10000000, {});

    Object.values(allocation).forEach((amount) => {
      expect(amount).toBeGreaterThan(0);
    });
  });
});

describe('getNextAdCycleTime', () => {
  it('should add 8.5 minutes to last cycle time', () => {
    const lastCycle = Date.now();
    const nextCycle = getNextAdCycleTime(lastCycle);

    expect(nextCycle).toBe(lastCycle + AD_CYCLE_INTERVAL_MS);
    expect(nextCycle).toBe(lastCycle + 510000);
  });

  it('should calculate next cycle correctly for multiple cycles', () => {
    const cycle1 = Date.now();
    const cycle2 = getNextAdCycleTime(cycle1);
    const cycle3 = getNextAdCycleTime(cycle2);

    expect(cycle3 - cycle1).toBe(AD_CYCLE_INTERVAL_MS * 2);
  });
});

describe('isAdCycleDue', () => {
  it('should return false if cycle not yet due', () => {
    const lastCycle = Date.now();
    const currentTime = lastCycle + 100000; // Only 1.67 minutes later

    expect(isAdCycleDue(lastCycle, currentTime)).toBe(false);
  });

  it('should return true if cycle time has passed', () => {
    const lastCycle = Date.now() - AD_CYCLE_INTERVAL_MS - 1000;
    const currentTime = Date.now();

    expect(isAdCycleDue(lastCycle, currentTime)).toBe(true);
  });

  it('should return true exactly at cycle boundary', () => {
    const lastCycle = Date.now() - AD_CYCLE_INTERVAL_MS;
    const currentTime = Date.now();

    expect(isAdCycleDue(lastCycle, currentTime)).toBe(true);
  });

  it('should use current time if not provided', () => {
    const lastCycle = Date.now() - AD_CYCLE_INTERVAL_MS - 1000;

    // Should default to Date.now() and return true
    expect(isAdCycleDue(lastCycle)).toBe(true);
  });
});
