/**
 * @file tests/phase8/leaderboardSnapshot.spec.ts
 * @description Unit tests for LeaderboardSnapshot model
 * @created 2025-11-27
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Tests LeaderboardSnapshot model functionality including snapshot capture,
 * history retrieval, trend calculation, and leaderboard generation.
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';
import { LeaderboardMetricType, TrendDirection } from '@/lib/types/politics';

let mongoServer: MongoMemoryServer;

describe('LeaderboardSnapshot Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await LeaderboardSnapshot.deleteMany({});
  });

  describe('captureSnapshot', () => {
    it('creates snapshot entries with correct ranks', async () => {
      const player1 = new Types.ObjectId();
      const player2 = new Types.ObjectId();
      const player3 = new Types.ObjectId();

      const dataProvider = async () => [
        { playerId: player1, playerName: 'Alice', metricValue: 1000 },
        { playerId: player2, playerName: 'Bob', metricValue: 500 },
        { playerId: player3, playerName: 'Charlie', metricValue: 750 },
      ];

      const snapshots = await LeaderboardSnapshot.captureSnapshot(
        LeaderboardMetricType.INFLUENCE,
        'S1-2025',
        dataProvider
      );

      expect(snapshots).toHaveLength(3);

      // Should be sorted by metricValue descending
      expect(snapshots[0].playerName).toBe('Alice');
      expect(snapshots[0].rank).toBe(1);
      expect(snapshots[0].metricValue).toBe(1000);

      expect(snapshots[1].playerName).toBe('Charlie');
      expect(snapshots[1].rank).toBe(2);
      expect(snapshots[1].metricValue).toBe(750);

      expect(snapshots[2].playerName).toBe('Bob');
      expect(snapshots[2].rank).toBe(3);
      expect(snapshots[2].metricValue).toBe(500);
    });

    it('calculates percentiles correctly', async () => {
      const player1 = new Types.ObjectId();
      const player2 = new Types.ObjectId();

      const dataProvider = async () => [
        { playerId: player1, playerName: 'First', metricValue: 100 },
        { playerId: player2, playerName: 'Second', metricValue: 50 },
      ];

      const snapshots = await LeaderboardSnapshot.captureSnapshot(
        LeaderboardMetricType.FUNDRAISING,
        'S1-2025',
        dataProvider
      );

      // Rank 1 of 2 = 100% percentile
      expect(snapshots[0].percentile).toBe(100);
      // Rank 2 of 2 = 50% percentile
      expect(snapshots[1].percentile).toBe(50);
    });

    it('returns empty array for empty data', async () => {
      const dataProvider = async () => [];

      const snapshots = await LeaderboardSnapshot.captureSnapshot(
        LeaderboardMetricType.INFLUENCE,
        'S1-2025',
        dataProvider
      );

      expect(snapshots).toHaveLength(0);
    });
  });

  describe('getPlayerHistory', () => {
    it('returns chronological history for a player', async () => {
      const playerId = new Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Insert snapshots in non-chronological order
      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 200,
          rank: 2,
          totalParticipants: 10,
          percentile: 80,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 5,
          totalParticipants: 10,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: twoDaysAgo,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 150,
          rank: 3,
          totalParticipants: 10,
          percentile: 70,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
      ]);

      const history = await LeaderboardSnapshot.getPlayerHistory(
        playerId,
        LeaderboardMetricType.INFLUENCE,
        7
      );

      expect(history).toHaveLength(3);
      // Should be chronologically sorted (oldest first)
      expect(history[0].rank).toBe(5); // twoDaysAgo
      expect(history[1].rank).toBe(3); // yesterday
      expect(history[2].rank).toBe(2); // now
    });

    it('filters by days parameter', async () => {
      const playerId = new Types.ObjectId();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 1,
          totalParticipants: 10,
          percentile: 100,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 50,
          rank: 5,
          totalParticipants: 10,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: tenDaysAgo,
        },
      ]);

      // Should only return entries within last 7 days
      const history = await LeaderboardSnapshot.getPlayerHistory(
        playerId,
        LeaderboardMetricType.INFLUENCE,
        7
      );

      expect(history).toHaveLength(1);
      expect(history[0].rank).toBe(1);
    });
  });

  describe('calculateTrend', () => {
    it('returns UP when rank improved', async () => {
      const playerId = new Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 3, // Current (better)
          totalParticipants: 10,
          percentile: 70,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 50,
          rank: 7, // Previous (worse)
          totalParticipants: 10,
          percentile: 30,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
      ]);

      const { trend, rankChange } = await LeaderboardSnapshot.calculateTrend(
        playerId,
        LeaderboardMetricType.INFLUENCE
      );

      expect(trend).toBe(TrendDirection.UP);
      expect(rankChange).toBe(4); // 7 - 3 = moved up 4 positions
    });

    it('returns DOWN when rank dropped', async () => {
      const playerId = new Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 50,
          rank: 8, // Current (worse)
          totalParticipants: 10,
          percentile: 20,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 2, // Previous (better)
          totalParticipants: 10,
          percentile: 80,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
      ]);

      const { trend, rankChange } = await LeaderboardSnapshot.calculateTrend(
        playerId,
        LeaderboardMetricType.INFLUENCE
      );

      expect(trend).toBe(TrendDirection.DOWN);
      expect(rankChange).toBe(-6); // 2 - 8 = dropped 6 positions
    });

    it('returns STABLE when rank unchanged', async () => {
      const playerId = new Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 5,
          totalParticipants: 10,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId,
          playerName: 'Test',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 5,
          totalParticipants: 10,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
      ]);

      const { trend, rankChange } = await LeaderboardSnapshot.calculateTrend(
        playerId,
        LeaderboardMetricType.INFLUENCE
      );

      expect(trend).toBe(TrendDirection.STABLE);
      expect(rankChange).toBe(0);
    });

    it('returns STABLE when no historical data', async () => {
      const playerId = new Types.ObjectId();

      const { trend, rankChange } = await LeaderboardSnapshot.calculateTrend(
        playerId,
        LeaderboardMetricType.INFLUENCE
      );

      expect(trend).toBe(TrendDirection.STABLE);
      expect(rankChange).toBe(0);
    });
  });

  describe('getCurrentLeaderboard', () => {
    it('returns entries with calculated trends', async () => {
      const player1 = new Types.ObjectId();
      const player2 = new Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Yesterday's snapshot
      await LeaderboardSnapshot.create([
        {
          playerId: player1,
          playerName: 'Alice',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 100,
          rank: 2,
          totalParticipants: 2,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
        {
          playerId: player2,
          playerName: 'Bob',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 200,
          rank: 1,
          totalParticipants: 2,
          percentile: 100,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
      ]);

      // Today's snapshot (Alice improved, Bob dropped)
      await LeaderboardSnapshot.create([
        {
          playerId: player1,
          playerName: 'Alice',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 300,
          rank: 1,
          totalParticipants: 2,
          percentile: 100,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
        {
          playerId: player2,
          playerName: 'Bob',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 200,
          rank: 2,
          totalParticipants: 2,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
      ]);

      const leaderboard = await LeaderboardSnapshot.getCurrentLeaderboard(
        LeaderboardMetricType.INFLUENCE,
        10
      );

      expect(leaderboard).toHaveLength(2);

      // Alice: was 2, now 1 = UP +1
      const alice = leaderboard.find((e) => e.playerName === 'Alice');
      expect(alice?.rank).toBe(1);
      expect(alice?.trend).toBe(TrendDirection.UP);
      expect(alice?.rankChange).toBe(1);

      // Bob: was 1, now 2 = DOWN -1
      const bob = leaderboard.find((e) => e.playerName === 'Bob');
      expect(bob?.rank).toBe(2);
      expect(bob?.trend).toBe(TrendDirection.DOWN);
      expect(bob?.rankChange).toBe(-1);
    });

    it('respects limit parameter', async () => {
      const now = new Date();

      // Create 5 players
      for (let i = 1; i <= 5; i++) {
        await LeaderboardSnapshot.create({
          playerId: new Types.ObjectId(),
          playerName: `Player${i}`,
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: i * 100,
          rank: 6 - i, // Rank inversely related to value
          totalParticipants: 5,
          percentile: (6 - i) / 5 * 100,
          seasonId: 'S1-2025',
          capturedAt: now,
        });
      }

      const leaderboard = await LeaderboardSnapshot.getCurrentLeaderboard(
        LeaderboardMetricType.INFLUENCE,
        3
      );

      expect(leaderboard).toHaveLength(3);
      // Should return top 3 by rank
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].rank).toBe(3);
    });

    it('returns empty array when no snapshots exist', async () => {
      const leaderboard = await LeaderboardSnapshot.getCurrentLeaderboard(
        LeaderboardMetricType.INFLUENCE,
        10
      );

      expect(leaderboard).toHaveLength(0);
    });
  });
});
