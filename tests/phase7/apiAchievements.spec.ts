import { GET as achievementsGET } from '@/app/api/politics/achievements/route';
import { POST as redeemPOST } from '@/app/api/politics/achievements/redeem/route';
import { NextRequest } from 'next/server';

jest.mock('@/auth', () => ({ auth: jest.fn(async () => ({ user: { id: '656e2f0d5f4e2a6b9c0a1c4a' } })) }));
jest.mock('@/lib/db', () => ({ connectDB: jest.fn(async () => {}) }));

const unlockDocs: any[] = [];
jest.mock('@/lib/db/models/AchievementUnlock', () => ({
  __esModule: true,
  default: {
    find: jest.fn((q: any) => {
      const data = unlockDocs.filter(u => u.playerId === q.playerId);
      return {
        _data: data,
        select: function(_sel: string) { return this; },
        lean: async function() { return this._data; }
      };
    }),
    countDocuments: jest.fn(async (q: any) => unlockDocs.filter(u => u.playerId === q.playerId && u.achievementId === q.achievementId).length),
    create: jest.fn(async (doc: any) => { const created = { ...doc, playerId: doc.playerId.toString(), _id: `${doc.achievementId}:${doc.repeatIndex||0}`, rewardApplied: false, status: 'UNLOCKED' }; unlockDocs.push(created); return created; }),
    findOne: jest.fn((q: any) => {
      const doc = unlockDocs.find(u => u.playerId === q.playerId && u.achievementId === q.achievementId && (u.repeatIndex || 0) === (q.repeatIndex || 0)) || null;
      return {
        _doc: doc,
        lean: async function() { return this._doc; }
      };
    }),
    findOneAndUpdate: jest.fn(async (q: any, update: any) => { const idx = unlockDocs.findIndex(u => u.playerId === q.playerId && u.achievementId === q.achievementId && (u.repeatIndex || 0) === (q.repeatIndex || 0) && !u.rewardApplied); if (idx === -1) return null; unlockDocs[idx].rewardApplied = true; unlockDocs[idx].status = update.$set.status; return unlockDocs[idx]; }),
  }
}));

// Telemetry event/aggregate mocks (used by metrics provider)
// Telemetry model mocks supplying metrics for achievement evaluation
const telemetryEvents: any[] = [
  { playerId: '656e2f0d5f4e2a6b9c0a1c4a', reputationScore: 97, influenceBonusPercent: 2, createdEpoch: 1000 },
  { playerId: '656e2f0d5f4e2a6b9c0a1c4a', reputationScore: 95, createdEpoch: 1001 },
  { playerId: '656e2f0d5f4e2a6b9c0a1c4a', reputationScore: 92, createdEpoch: 1002 },
];
jest.mock('@/lib/db/models/TelemetryEvent', () => ({
  default: {
    find: jest.fn((q: any) => {
      // Only handle reputationScore queries used in provider (sort + limit chain expected)
      const data = telemetryEvents.filter(e => e.playerId === q.playerId && (!q.reputationScore || q.reputationScore.$exists) );
      return {
        _data: data.sort((a,b) => (b.reputationScore||0) - (a.reputationScore||0)),
        sort: function(_s: any) { return this; },
        limit: function(n: number) { this._data = this._data.slice(0, n); return this; },
        lean: async function() { return this._data; }
      };
    }),
    countDocuments: jest.fn(async (q: any) => telemetryEvents.filter(e => e.playerId === q.playerId && (!q.createdEpoch || e.createdEpoch >= q.createdEpoch.$gte) && (!!e.influenceBonusPercent)).length)
  }
}));
jest.mock('@/lib/db/models/TelemetryAggregate', () => ({
  default: {
    countDocuments: jest.fn(async (q: any) => {
      // Provide cyclesCompleted proxy as number of daily aggregates
      if (q.granularity === 'DAILY') return 7; // pretend 7 completed cycles
      return 0;
    })
  }
}));

describe('Achievements API', () => {
  const playerId = '656e2f0d5f4e2a6b9c0a1c4a';
  beforeEach(() => { unlockDocs.length = 0; jest.clearAllMocks(); });
  it('lists achievements and existing unlocks (pre-seeded)', async () => {
    // Pre-seed an unlocked achievement (simulate prior evaluation) to avoid evaluation path complexity
    unlockDocs.push({ playerId, achievementId: 'ACH_FIRST_CAMPAIGN', repeatIndex: 0, rewardApplied: false, status: 'UNLOCKED' });
    const req = new NextRequest('http://localhost/api/politics/achievements');
    const res = await achievementsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.achievements.length).toBeGreaterThan(0);
    expect(body.unlocks.length).toBe(1);
    expect(body.unlocks[0].achievementId).toBe('ACH_FIRST_CAMPAIGN');
  });
  it('redeems an unlocked achievement idempotently', async () => {
    unlockDocs.push({ playerId, achievementId: 'ACH_FIRST_CAMPAIGN', repeatIndex: 0, rewardApplied: false, status: 'UNLOCKED' });
    const reqRedeem = { json: async () => ({ achievementId: 'ACH_FIRST_CAMPAIGN', repeatIndex: 0 }) } as any; // Minimal NextRequest-like
    const res1 = await redeemPOST(reqRedeem);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.applied).toBe(true);
    const res2 = await redeemPOST(reqRedeem);
    const body2 = await res2.json();
    expect(body2.applied).toBe(false);
  });
});
