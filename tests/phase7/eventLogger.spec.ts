import { TelemetryEventLogger, flushTelemetry } from '@/lib/utils/politics/phase7/eventLogger';
import { TelemetryEventType } from '@/lib/types/politicsPhase7';

const insertedDocs: any[] = [];

jest.mock('@/lib/db/models/TelemetryEvent', () => ({
  __esModule: true,
  default: {
    insertMany: jest.fn(async (docs: any[]) => {
      insertedDocs.push(...docs);
      return docs; // mimic inserted documents
    })
  }
}));

describe('TelemetryEventLogger enqueue & flush', () => {
  beforeEach(() => {
    insertedDocs.length = 0;
    jest.clearAllMocks();
  });

  it('validates and flushes when batch size reached', async () => {
    const logger = new TelemetryEventLogger({ batchSize: 3 });
    // Provide all required discriminated variant fields per schema
    logger.enqueue({ playerId: '656e2f0d5f4e2a6b9c0a1c1', type: TelemetryEventType.ENDORSEMENT, endorsementId: 'E1', tier: 'LOCAL', influenceBonusPercent: 1 });
    logger.enqueue({ playerId: '656e2f0d5f4e2a6b9c0a1c1', type: TelemetryEventType.DEBATE_RESULT, debateId: 'D1', performanceScore: 88, pollShiftImmediatePercent: 0 });
    // Third should trigger auto flush
    logger.enqueue({ playerId: '656e2f0d5f4e2a6b9c0a1c1', type: TelemetryEventType.MOMENTUM_SHIFT, previousMomentumIndex: 0.6, newMomentumIndex: 0.7, delta: 0.1 });
    // Allow flush promise microtasks
    await new Promise(r => setTimeout(r, 10));
    expect(insertedDocs.length).toBe(3);
  });

  it('manual flush persists queued events', async () => {
    const logger = new TelemetryEventLogger({ batchSize: 50 });
    for (let i = 0; i < 5; i++) {
      logger.enqueue({ playerId: '656e2f0d5f4e2a6b9c0a1c2', type: TelemetryEventType.POLL_INTERVAL, finalSupportPercent: 51.2, volatilityAppliedPercent: 0.5, reputationScore: 5 });
    }
    const res = await logger.flush();
    expect(res.insertedCount).toBe(5);
    expect(insertedDocs.length).toBe(5);
  });
});

describe('flushTelemetry singleton helper', () => {
  it('returns structured result even with empty queue', async () => {
    const res = await flushTelemetry();
    expect(res.attemptedCount).toBe(0);
    expect(res.insertedCount).toBe(0);
  });
});
