import { PHASE7_ACHIEVEMENTS, evaluateAchievements, applyAchievementReward, AchievementMetricsProvider } from '@/lib/utils/politics/phase7/achievementEngine';

// In-memory store to simulate Mongo persistence
const unlockStore: Array<{ playerId: string; achievementId: string; repeatIndex?: number; rewardApplied: boolean; status: string; _id: string; unlockedEpoch: number; }> = [];

// Mock AchievementUnlock model methods
jest.mock('@/lib/db/models/AchievementUnlock', () => ({
  __esModule: true,
  default: {
    find: jest.fn((query: any) => {
      const data = unlockStore.filter(u => u.playerId === query.playerId && (!query.achievementId || u.achievementId === query.achievementId));
      return {
        _data: data,
        select: function(_sel: string) { return this; },
        lean: async function() { return this._data; }
      };
    }),
    countDocuments: jest.fn(async (query: any) => unlockStore.filter(u => u.playerId === query.playerId && u.achievementId === query.achievementId).length),
    create: jest.fn(async (doc: any) => {
      if (unlockStore.some(u => u.playerId === doc.playerId.toString() && u.achievementId === doc.achievementId && (u.repeatIndex || 0) === (doc.repeatIndex || 0))) {
        const err: any = new Error('duplicate');
        err.code = 11000;
        throw err;
      }
      const created = { ...doc, playerId: doc.playerId.toString(), _id: `${doc.achievementId}:${doc.repeatIndex || 0}`, status: 'UNLOCKED', rewardApplied: false };
      unlockStore.push(created);
      return created;
    }),
    findOneAndUpdate: jest.fn(async (query: any, update: any) => {
      const idx = unlockStore.findIndex(u => u.playerId === query.playerId && u.achievementId === query.achievementId && (u.repeatIndex || 0) === (query.repeatIndex || 0) && u.rewardApplied === false);
      if (idx === -1) return null;
      unlockStore[idx].rewardApplied = true;
      unlockStore[idx].status = update.$set.status;
      return unlockStore[idx];
    }),
    findOne: jest.fn(async (query: any) => unlockStore.find(u => u.playerId === query.playerId && u.achievementId === query.achievementId && (u.repeatIndex || 0) === (query.repeatIndex || 0)) || null),
  }
}));

// Simple metrics provider stub configurable per test
class StubMetrics implements AchievementMetricsProvider {
  constructor(private metrics: Record<string, number>) {}
  async getMetric(_playerId: string, metric: string): Promise<number> {
    return this.metrics[metric] ?? 0;
  }
}

describe('achievementEngine evaluateAchievements', () => {
  // Use valid 24-char hex ObjectId strings to satisfy new Types.ObjectId(...) casting in engine
  const playerId = '656e2f0d5f4e2a6b9c0a1b2a'; // 24-char hex

  beforeEach(() => {
    unlockStore.length = 0;
    jest.clearAllMocks();
  });

  it('unlocks non-repeatable achievements when criteria met', async () => {
    const metrics = new StubMetrics({ cyclesCompleted: 5, bestDebateScore: 95, endorsementsThisCycle: 0, peakReputation: 96 });
    const unlocked = await evaluateAchievements(playerId, metrics);
    const ids = unlocked.map(u => u.achievementId).sort();
    expect(ids).toEqual(expect.arrayContaining(['ACH_FIRST_CAMPAIGN', 'ACH_DEBATE_MASTER', 'ACH_REPUTATION_PEAK']));
    // Ensure they are persisted
    expect(unlockStore.length).toBe(3);
  });

  it('supports repeatable achievement up to maxRepeats', async () => {
    const metrics = new StubMetrics({ endorsementsThisCycle: 999 });
    // Unlock multiple times until cap
    for (let i = 0; i < 6; i++) {
      const unlocked = await evaluateAchievements(playerId, metrics);
      if (i < 5) {
        expect(unlocked.length).toBe(1);
      } else {
        // Sixth attempt should yield none (maxRepeats=5)
        expect(unlocked.length).toBe(0);
      }
    }
    expect(unlockStore.filter(u => u.achievementId === 'ACH_ENDORSEMENT_COLLECTOR').length).toBe(5);
  });

  it('is idempotent for non-repeatable achievements (duplicate prevented)', async () => {
    const metrics = new StubMetrics({ cyclesCompleted: 2 });
    const first = await evaluateAchievements(playerId, metrics);
    const second = await evaluateAchievements(playerId, metrics);
    expect(first.length).toBe(1);
    expect(second.length).toBe(0); // Already unlocked
    expect(unlockStore.length).toBe(1);
  });
});

describe('applyAchievementReward', () => {
  const playerId = '656e2f0d5f4e2a6b9c0a1b3a'; // 24-char hex
  beforeEach(() => {
    unlockStore.length = 0;
    jest.clearAllMocks();
  });
  it('applies reward once and becomes idempotent', async () => {
    // Pre-seed an unlocked achievement
    unlockStore.push({ playerId, achievementId: 'ACH_FIRST_CAMPAIGN', repeatIndex: 0, rewardApplied: false, status: 'UNLOCKED', _id: 'seed', unlockedEpoch: Date.now() / 1000 });
    const appliedFirst = await applyAchievementReward(playerId, 'ACH_FIRST_CAMPAIGN', 0);
    expect(appliedFirst).toBe(true);
    const appliedSecond = await applyAchievementReward(playerId, 'ACH_FIRST_CAMPAIGN', 0);
    expect(appliedSecond).toBe(false);
  });
});
