import { computeBaselineInfluence } from '@/lib/utils/politics/influenceBase';
import { LEVEL_MULTIPLIER_MAP, MICRO_JITTER_MAX, RETENTION_FLOOR_FACTOR, SOFT_CAP_TARGET, STATE_SCALE } from '@/lib/utils/politics/influenceConstants';

function makeInputs(overrides: Partial<Parameters<typeof computeBaselineInfluence>[0]> = {}) {
  return {
    donationAmount: 0,
    totalDonations: 0,
    companyLevel: 3,
    compositeInfluenceWeight: 0.5,
    weeksToElection: 40,
    reputation: 50,
    successfulLobbies: 0,
    seed: undefined,
    previousSnapshotInfluence: undefined,
    ...overrides,
  } as Parameters<typeof computeBaselineInfluence>[0];
}

describe('computeBaselineInfluence', () => {
  test('deterministic with same seed and varies with different seed', () => {
    const a = computeBaselineInfluence(makeInputs({ donationAmount: 1000, seed: 'SEED_X' }));
    const b = computeBaselineInfluence(makeInputs({ donationAmount: 1000, seed: 'SEED_X' }));
    const c = computeBaselineInfluence(makeInputs({ donationAmount: 1000, seed: 'SEED_Y' }));
    expect(a.total).toBe(b.total);
    expect(a.components.seedJitter).toBeDefined();
    expect(a.components.seedJitter).toBe(b.components.seedJitter);
    expect(c.components.seedJitter).not.toBe(a.components.seedJitter);
  });

  test('monotonic donation scaling (higher donation increases total)', () => {
    // Use level 1 to remove fairness floor interference
    const low = computeBaselineInfluence(makeInputs({ donationAmount: 200, seed: 'S1', companyLevel: 1, compositeInfluenceWeight: 0 }));
    const high = computeBaselineInfluence(makeInputs({ donationAmount: 50000, seed: 'S1', companyLevel: 1, compositeInfluenceWeight: 0 }));
    expect(high.total).toBeGreaterThan(low.total);
  });

  test('soft cap compression lowers large aggregate', () => {
    const inputs = makeInputs({ donationAmount: 1000000, companyLevel: 5, compositeInfluenceWeight: 1, reputation: 100, weeksToElection: 1, seed: 'CAP' });
    const result = computeBaselineInfluence(inputs);
    const { donationLog, levelMultiplierFactor, stateComposite, electionProximity, reputationFactor, diminishingReturnsApplied } = result.components;
    const donationSegment = Math.floor(donationLog * levelMultiplierFactor);
    const preCompressed = donationSegment + stateComposite + electionProximity + reputationFactor;
    expect(diminishingReturnsApplied).toBeLessThan(preCompressed);
    expect(diminishingReturnsApplied).toBeLessThanOrEqual(SOFT_CAP_TARGET + 5);
  });

  test('fairness floor uses previous snapshot retention when higher than compressed', () => {
    const previous = 800;
    const inputs = makeInputs({ donationAmount: 0, reputation: 0, compositeInfluenceWeight: 0, previousSnapshotInfluence: previous, seed: 'FLOOR' });
    const result = computeBaselineInfluence(inputs);
    const expectedRetentionFloor = previous * RETENTION_FLOOR_FACTOR;
    expect(result.components.fairnessClampApplied).toBe(expectedRetentionFloor);
    expect(result.total).toBeGreaterThanOrEqual(Math.round(expectedRetentionFloor));
  });

  test('jitter magnitude within MICRO_JITTER_MAX and cannot reduce below fairness floor', () => {
    const inputs = makeInputs({ donationAmount: 5000, seed: 'JITTER', previousSnapshotInfluence: 50 });
    const result = computeBaselineInfluence(inputs);
    const { seedJitter, fairnessClampApplied } = result.components;
    if (seedJitter !== undefined) {
      expect(Math.abs(seedJitter)).toBeLessThanOrEqual(MICRO_JITTER_MAX + 1e-6);
      expect(result.total).toBeGreaterThanOrEqual(Math.round(fairnessClampApplied));
    }
  });

  test('election proximity bonus increases influence when closer to election', () => {
    // Level 1 removes clamp interference
    const far = computeBaselineInfluence(makeInputs({ weeksToElection: 50, seed: 'EP', donationAmount: 5000, companyLevel: 1, compositeInfluenceWeight: 0 }));
    const near = computeBaselineInfluence(makeInputs({ weeksToElection: 2, seed: 'EP', donationAmount: 5000, companyLevel: 1, compositeInfluenceWeight: 0 }));
    expect(near.total).toBeGreaterThan(far.total);
  });

  test('state composite scaling contributes expected magnitude', () => {
    const none = computeBaselineInfluence(makeInputs({ compositeInfluenceWeight: 0, donationAmount: 5000, seed: 'STATE', companyLevel: 1 }));
    const half = computeBaselineInfluence(makeInputs({ compositeInfluenceWeight: 0.5, donationAmount: 5000, seed: 'STATE', companyLevel: 1 }));
    expect(half.total).toBeGreaterThan(none.total);
  });
});
