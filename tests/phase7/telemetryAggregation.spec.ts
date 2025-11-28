import { aggregateWindow } from '@/lib/utils/politics/phase7/telemetryAggregation';
import { TelemetryEventType } from '@/lib/types/politicsPhase7';

const eventStore: any[] = [];
const aggregateUpserts: any[] = [];

jest.mock('@/lib/db/models/TelemetryEvent', () => ({
  __esModule: true,
  default: {
    find: jest.fn((query: any) => {
      const data = eventStore.filter(e => e.playerId === query.playerId.toString() && e.createdEpoch >= query.createdEpoch.$gte && e.createdEpoch < query.createdEpoch.$lt);
      return {
        _data: data,
        lean: async function() { return this._data; }
      };
    })
  }
}));

jest.mock('@/lib/db/models/TelemetryAggregate', () => ({
  __esModule: true,
  default: {
    updateOne: jest.fn(async (_filter: any, update: any) => {
      aggregateUpserts.push(update.$set);
    })
  }
}));

describe('aggregateWindow', () => {
  const playerId = '656e2f0d5f4e2a6b9c0a1c3a'; // 24-char hex
  beforeEach(() => {
    eventStore.length = 0;
    aggregateUpserts.length = 0;
    jest.clearAllMocks();
  });
  it('computes counts, influence, reputation, and momentum average', async () => {
    eventStore.push(
      { playerId, type: TelemetryEventType.ENDORSEMENT, createdEpoch: 1000, endorsementId: 'END1', tier: 'TIER1', influenceBonusPercent: 2 },
      { playerId, type: TelemetryEventType.POLL_INTERVAL, createdEpoch: 1001, finalSupportPercent: 51.2, volatilityAppliedPercent: 0.5, reputationScore: 5 },
      { playerId, type: TelemetryEventType.MOMENTUM_SHIFT, createdEpoch: 1002, previousMomentumIndex: 0.3, newMomentumIndex: 0.4, delta: 0.1 },
      { playerId, type: TelemetryEventType.MOMENTUM_SHIFT, createdEpoch: 1003, previousMomentumIndex: 0.5, newMomentumIndex: 0.6, delta: 0.1 },
    );
    await aggregateWindow(playerId, 'DAILY', 1000, 2000);
    expect(aggregateUpserts.length).toBe(1);
    const agg = aggregateUpserts[0];
    expect(agg.eventCounts[TelemetryEventType.ENDORSEMENT]).toBe(1);
    expect(agg.influenceNetPercent).toBe(2);
    expect(agg.reputationNetPercent).toBe(5);
    expect(agg.momentumAvgIndex).toBeCloseTo((0.4 + 0.6) / 2);
  });
});
