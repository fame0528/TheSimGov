/**
 * Smoke test for generatePollingSnapshot with mocked model
 */

jest.mock('@/lib/db/models/politics/PollingSnapshot', () => {
  const chain = () => ({
    sort: () => chain(),
    limit: () => chain(),
    lean: async () => [],
  });

  return {
    __esModule: true,
    default: {
      find: () => chain(),
      create: async (doc: any) => ({
        toJSON: () => ({ _id: 'mock-id', ...doc }),
      }),
    },
  };
});

import { generatePollingSnapshot } from '@/lib/utils/politics/polling';

describe('generatePollingSnapshot (smoke)', () => {
  it('creates a snapshot with expected fields and ranges', async () => {
    const campaignState: any = {
      // Fields used by calculateBaseSupport
      reputationScore: 70,
      endorsementsAcquired: 3,
      scandalsActive: 0,
      fundsRaisedThisCycle: 150_000,
      volatilityModifier: 1.0,
    };

    const playerId = 'player-test-1';
    const before = Math.floor(Date.now() / 1000) - 5;
    const snap = await generatePollingSnapshot(playerId, campaignState);
    const after = Math.floor(Date.now() / 1000) + 5;

    expect(snap.playerId).toBe(playerId);
    expect(typeof snap.sampleSize).toBe('number');
    expect(snap.sampleSize).toBeGreaterThanOrEqual(800);
    expect(snap.sampleSize).toBeLessThanOrEqual(3000);

    expect(snap.baseSupportPercent).toBeGreaterThanOrEqual(0);
    expect(snap.baseSupportPercent).toBeLessThanOrEqual(100);
    expect(snap.finalSupportPercent).toBeGreaterThanOrEqual(0);
    expect(snap.finalSupportPercent).toBeLessThanOrEqual(100);
    expect(snap.marginOfErrorPercent).toBeGreaterThanOrEqual(1);

    expect(typeof snap.seed).toBe('string');
    expect(snap.schemaVersion).toBe(1);

    expect(snap.timestampEpoch).toBeGreaterThanOrEqual(before);
    expect(snap.timestampEpoch).toBeLessThanOrEqual(after);
  });
});
