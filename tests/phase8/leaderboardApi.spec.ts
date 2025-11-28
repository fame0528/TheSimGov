/**
 * @file tests/phase8/leaderboardApi.spec.ts
 * @description Integration tests for extended leaderboard API
 * @created 2025-11-27
 * @author ECHO v1.3.1
 *
 * OVERVIEW:
 * Tests leaderboard API endpoints with multi-metric support,
 * trend calculation, and history retrieval.
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/politics/leaderboard/route';
import { GET as GET_HISTORY } from '@/app/api/politics/leaderboard/history/route';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import CompanyModel from '@/lib/db/models/Company';
import LeaderboardSnapshot from '@/lib/db/models/LeaderboardSnapshot';
import { LeaderboardMetricType, TrendDirection } from '@/lib/types/politics';

let mongoServer: MongoMemoryServer;

describe('Leaderboard API Endpoints', () => {
  let testCompany1: any;
  let testCompany2: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Seed test companies
    testCompany1 = await CompanyModel.create({
      name: 'Alpha Corp',
      industry: 'Technology',
      ownerId: new mongoose.Types.ObjectId(),
      cash: 1000000,
    });

    testCompany2 = await CompanyModel.create({
      name: 'Beta Industries',
      industry: 'Finance',
      ownerId: new mongoose.Types.ObjectId(),
      cash: 500000,
    });

    // Seed contributions
    await PoliticalContribution.create([
      {
        company: testCompany1._id,
        candidateName: 'Candidate A',
        officeType: 'President',
        amount: 100000,
        influencePoints: 500,
        electionYear: 2028,
        donatedAt: new Date(),
      },
      {
        company: testCompany1._id,
        candidateName: 'Candidate B',
        officeType: 'Senate',
        amount: 50000,
        influencePoints: 250,
        electionYear: 2028,
        donatedAt: new Date(),
      },
      {
        company: testCompany2._id,
        candidateName: 'Candidate C',
        officeType: 'Governor',
        amount: 75000,
        influencePoints: 375,
        electionYear: 2028,
        donatedAt: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await LeaderboardSnapshot.deleteMany({});
  });

  describe('GET /api/politics/leaderboard', () => {
    it('returns default INFLUENCE leaderboard', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.metric).toBe(LeaderboardMetricType.INFLUENCE);
      expect(Array.isArray(data.data.leaderboard)).toBe(true);
    });

    it('filters by metric parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?metric=FUNDRAISING'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.metric).toBe(LeaderboardMetricType.FUNDRAISING);
    });

    it('respects limit parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?limit=1'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.leaderboard).toHaveLength(1);
    });

    it('includes seasonId in response', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.seasonId).toBeDefined();
      expect(data.data.seasonId).toMatch(/^S\d+-\d{4}$/);
    });

    it('includes trend data when requested', async () => {
      // Create historical snapshot for trend calculation
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await LeaderboardSnapshot.create([
        {
          playerId: testCompany1._id,
          playerName: testCompany1.name,
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 500,
          rank: 2,
          totalParticipants: 2,
          percentile: 50,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
        {
          playerId: testCompany1._id,
          playerName: testCompany1.name,
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 750,
          rank: 1,
          totalParticipants: 2,
          percentile: 100,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
      ]);

      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?trends=true'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.includeTrends).toBe(true);

      // First entry should have trend data
      const firstEntry = data.data.leaderboard[0];
      expect(firstEntry.trend).toBeDefined();
    });

    it('maintains backward compatibility with totalInfluence field', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?metric=INFLUENCE'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Legacy clients expect totalInfluence field
      const firstEntry = data.data.leaderboard[0];
      expect(firstEntry.totalInfluence).toBeDefined();
      expect(firstEntry.totalInfluence).toBe(firstEntry.metricValue);
    });

    it('returns empty array for unimplemented metrics', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?metric=REPUTATION'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.leaderboard).toHaveLength(0);
      expect(data.meta.message).toContain('not yet implemented');
    });

    it('validates metric parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard?metric=INVALID_METRIC'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/politics/leaderboard/history', () => {
    it('requires playerId parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/leaderboard/history'
      );
      const response = await GET_HISTORY(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns empty history for new player', async () => {
      const playerId = new mongoose.Types.ObjectId();

      const req = new NextRequest(
        `http://localhost:3000/api/politics/leaderboard/history?playerId=${playerId}`
      );
      const response = await GET_HISTORY(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.history).toHaveLength(0);
      expect(data.data.trend).toBe(TrendDirection.STABLE);
    });

    it('returns history with statistics', async () => {
      const playerId = new mongoose.Types.ObjectId();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Create history
      await LeaderboardSnapshot.create([
        {
          playerId,
          playerName: 'Test Player',
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
          playerName: 'Test Player',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 150,
          rank: 3,
          totalParticipants: 10,
          percentile: 70,
          seasonId: 'S1-2025',
          capturedAt: yesterday,
        },
        {
          playerId,
          playerName: 'Test Player',
          metricType: LeaderboardMetricType.INFLUENCE,
          metricValue: 200,
          rank: 2,
          totalParticipants: 10,
          percentile: 80,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
      ]);

      const req = new NextRequest(
        `http://localhost:3000/api/politics/leaderboard/history?playerId=${playerId}`
      );
      const response = await GET_HISTORY(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.history).toHaveLength(3);
      expect(data.data.trend).toBe(TrendDirection.UP);
      expect(data.data.rankChange).toBe(1); // 3 -> 2 = +1

      // Check statistics
      expect(data.data.stats.currentRank).toBe(2);
      expect(data.data.stats.bestRank).toBe(2);
      expect(data.data.stats.worstRank).toBe(5);
      expect(data.data.stats.dataPoints).toBe(3);
    });

    it('respects days parameter', async () => {
      const playerId = new mongoose.Types.ObjectId();
      const now = new Date();
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

      // Request only 7 days
      const req = new NextRequest(
        `http://localhost:3000/api/politics/leaderboard/history?playerId=${playerId}&days=7`
      );
      const response = await GET_HISTORY(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.history).toHaveLength(1); // Only today's entry
    });

    it('filters by metric parameter', async () => {
      const playerId = new mongoose.Types.ObjectId();
      const now = new Date();

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
          metricType: LeaderboardMetricType.FUNDRAISING,
          metricValue: 50000,
          rank: 3,
          totalParticipants: 10,
          percentile: 70,
          seasonId: 'S1-2025',
          capturedAt: now,
        },
      ]);

      const req = new NextRequest(
        `http://localhost:3000/api/politics/leaderboard/history?playerId=${playerId}&metric=FUNDRAISING`
      );
      const response = await GET_HISTORY(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.metric).toBe(LeaderboardMetricType.FUNDRAISING);
      expect(data.data.history).toHaveLength(1);
      expect(data.data.history[0].metricValue).toBe(50000);
    });
  });
});
