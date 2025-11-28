import { GET as eventsGET } from '@/app/api/politics/telemetry/events/route';
import { GET as statsGET } from '@/app/api/politics/telemetry/stats/route';
import { NextRequest } from 'next/server';

jest.mock('@/auth', () => ({ auth: jest.fn(async () => ({ user: { id: '656e2f0d5f4e2a6b9c0a1c5' } })) }));
jest.mock('@/lib/db', () => ({ connectDB: jest.fn(async () => {}) }));

const eventsStore: any[] = [];
jest.mock('@/lib/db/models/TelemetryEvent', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(async (filter: any) => eventsStore.filter(e => e.playerId === filter.playerId && (!filter.type || filter.type.$in.includes(e.type)) && (!filter.createdEpoch || e.createdEpoch >= filter.createdEpoch.$gte)).length),
    find: jest.fn((filter: any) => {
      const data = eventsStore
        .filter(e => e.playerId === filter.playerId && (!filter.type || filter.type.$in.includes(e.type)) && (!filter.createdEpoch || e.createdEpoch >= filter.createdEpoch.$gte))
        .sort((a,b) => b.createdEpoch - a.createdEpoch);
      return {
        _data: data,
        sort: function(_s: any) { return this; },
        limit: function(n: number) { this._data = this._data.slice(0, n); return this; },
        skip: function(n: number) { this._data = this._data.slice(n); return this; },
        lean: function() { return this._data; }
      };
    })
  }
}));

const aggregatesStore: any[] = [];
jest.mock('@/lib/db/models/TelemetryAggregate', () => ({
  __esModule: true,
  default: {
    find: jest.fn((filter: any) => {
      const data = aggregatesStore.filter(a => a.playerId === filter.playerId && a.granularity === filter.granularity && a.periodStartEpoch >= (filter.periodStartEpoch.$gte || 0));
      return {
        _data: data,
        sort: function(_s: any) { return this; },
        lean: function() { return this._data; }
      };
    }),
  }
}));

jest.mock('@/lib/utils/politics/phase7/telemetryAggregation', () => ({
  aggregateWindow: jest.fn(async (_playerId: string) => {})
}));

describe('Telemetry Events API', () => {
  beforeEach(() => { eventsStore.length = 0; jest.clearAllMocks(); });
  it('returns paginated events with filters', async () => {
    // Seed events
    for (let i = 0; i < 10; i++) {
      eventsStore.push({ playerId: '656e2f0d5f4e2a6b9c0a1c5', type: 'ENDORSEMENT', endorsementId: `E${i}`, tier: 'LOCAL', influenceBonusPercent: 1, createdEpoch: 1000 + i });
    }
    const req = new NextRequest('http://localhost/api/politics/telemetry/events?limit=5&offset=0');
    const res = await eventsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events.length).toBe(5);
    expect(body.pagination.total).toBe(10);
  });
  it('enforces max limit', async () => {
    const req = new NextRequest('http://localhost/api/politics/telemetry/events?limit=9999');
    const res = await eventsGET(req);
    expect(res.status).toBe(429);
  });
});

describe('Telemetry Stats API', () => {
  beforeEach(() => { aggregatesStore.length = 0; jest.clearAllMocks(); });
  it('returns recent daily/weekly aggregates', async () => {
    // Seed some aggregates
    const now = Math.floor(Date.now() / 1000);
    const dailyStart = now - 2 * 24 * 60 * 60;
    aggregatesStore.push({ playerId: '656e2f0d5f4e2a6b9c0a1c5', granularity: 'DAILY', periodStartEpoch: dailyStart });
    const weeklyStart = now - 2 * 7 * 24 * 60 * 60; // 2 weeks ago
    aggregatesStore.push({ playerId: '656e2f0d5f4e2a6b9c0a1c5', granularity: 'WEEKLY', periodStartEpoch: weeklyStart });
    const req = new NextRequest('http://localhost/api/politics/telemetry/stats');
    const res = await statsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.daily)).toBe(true);
    expect(Array.isArray(body.weekly)).toBe(true);
  });
});
