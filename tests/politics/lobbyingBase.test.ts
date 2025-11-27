import { computeLobbyingProbability } from '@/lib/utils/politics/lobbyingBase';
import { LOBBY_MIN_PROBABILITY, LOBBY_MAX_PROBABILITY, LOBBY_SOFT_MAX, LOBBY_JITTER_SPEND_THRESHOLD } from '@/lib/utils/politics/influenceConstants';

function makeInputs(overrides: Partial<Parameters<typeof computeLobbyingProbability>[0]> = {}) {
  return {
    officeLevel: 'LOCAL',
    donationAmount: 0,
    playerInfluenceScore: 0,
    reputation: 50,
    compositeInfluenceWeight: 0,
    weeksUntilElection: 30,
    seed: undefined,
    ...overrides,
  } as Parameters<typeof computeLobbyingProbability>[0];
}

describe('computeLobbyingProbability', () => {
  test('deterministic with same seed and varies with different seed (above jitter threshold)', () => {
    const a = computeLobbyingProbability(makeInputs({ donationAmount: LOBBY_JITTER_SPEND_THRESHOLD + 100, seed: 'SEED_X' }));
    const b = computeLobbyingProbability(makeInputs({ donationAmount: LOBBY_JITTER_SPEND_THRESHOLD + 100, seed: 'SEED_X' }));
    const c = computeLobbyingProbability(makeInputs({ donationAmount: LOBBY_JITTER_SPEND_THRESHOLD + 100, seed: 'DIFF' }));
    expect(a.probability).toBeCloseTo(b.probability, 10);
    expect(a.breakdown.jitter).toBe(b.breakdown.jitter);
    expect(c.breakdown.jitter).not.toBe(a.breakdown.jitter);
  });

  test('probability respects min clamp at extremely poor inputs', () => {
    const poor = computeLobbyingProbability(makeInputs({ donationAmount: 0, playerInfluenceScore: 0, reputation: 0, weeksUntilElection: 200, compositeInfluenceWeight: 0 }));
    expect(poor.probability).toBeGreaterThanOrEqual(LOBBY_MIN_PROBABILITY);
  });

  test('probability respects max clamp under extreme favorable inputs', () => {
    const strong = computeLobbyingProbability(makeInputs({ officeLevel: 'LOCAL', donationAmount: 2_000_000, playerInfluenceScore: 500, reputation: 100, compositeInfluenceWeight: 1, weeksUntilElection: 1, seed: 'MAX' }));
    expect(strong.probability).toBeLessThanOrEqual(LOBBY_MAX_PROBABILITY);
  });

  test('soft easing reduces raw value above soft max', () => {
    const extreme = computeLobbyingProbability(makeInputs({ donationAmount: 1_000_000, playerInfluenceScore: 400, reputation: 100, compositeInfluenceWeight: 1, weeksUntilElection: 1, seed: 'SOFT' }));
    const { rawUnclamped, softened } = extreme.breakdown;
    if (rawUnclamped > LOBBY_SOFT_MAX) {
      expect(softened).toBeLessThan(rawUnclamped);
      expect(softened).toBeGreaterThan(LOBBY_SOFT_MAX); // still above threshold but eased
    }
  });

  test('proximity multiplier larger when closer to election', () => {
    const far = computeLobbyingProbability(makeInputs({ weeksUntilElection: 60, donationAmount: 50000 }));
    const near = computeLobbyingProbability(makeInputs({ weeksUntilElection: 2, donationAmount: 50000 }));
    expect(near.breakdown.proximityMultiplier).toBeGreaterThan(far.breakdown.proximityMultiplier);
    expect(near.probability).toBeGreaterThan(far.probability);
  });

  test('jitter only applied above spend threshold', () => {
    const below = computeLobbyingProbability(makeInputs({ donationAmount: LOBBY_JITTER_SPEND_THRESHOLD - 1, seed: 'JT' }));
    const above = computeLobbyingProbability(makeInputs({ donationAmount: LOBBY_JITTER_SPEND_THRESHOLD + 1, seed: 'JT' }));
    expect(below.breakdown.jitter).toBe(0);
    expect(above.breakdown.jitter).not.toBe(0);
  });
});
