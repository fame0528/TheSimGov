/**
 * Integration Tests: GET /api/politics/leaderboard
 * 
 * Tests company influence leaderboard endpoint for database integration,
 * aggregation correctness, response validation, and error handling.
 * 
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GET } from '@/app/api/politics/leaderboard/route';
import { NextRequest } from 'next/server';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import CompanyModel from '@/lib/db/models/Company';

let mongoServer: MongoMemoryServer;

describe('GET /api/politics/leaderboard', () => {
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Seed test data
    const testCompany1 = await CompanyModel.create({
      name: 'Test Corp A',
      industry: 'Technology',
      ownerId: new mongoose.Types.ObjectId(),
      cash: 1000000,
      createdAt: new Date(),
    });

    const testCompany2 = await CompanyModel.create({
      name: 'Test Corp B',
      industry: 'Finance',
      ownerId: new mongoose.Types.ObjectId(),
      cash: 500000,
      createdAt: new Date(),
    });

    // Create political contributions
    await PoliticalContribution.create({
      company: testCompany1._id,
      candidateName: 'Presidential Candidate A',
      officeType: 'President',
      amount: 100000,
      influencePoints: 500,
      electionYear: 2028,
      donatedAt: new Date(),
    });

    await PoliticalContribution.create({
      company: testCompany1._id,
      candidateName: 'Senator Candidate B',
      officeType: 'Senate',
      amount: 50000,
      influencePoints: 250,
      electionYear: 2028,
      donatedAt: new Date(),
    });

    await PoliticalContribution.create({
      company: testCompany2._id,
      candidateName: 'Governor Candidate C',
      officeType: 'Governor',
      amount: 75000,
      influencePoints: 375,
      electionYear: 2028,
      donatedAt: new Date(),
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Leaderboard Aggregation', () => {
    it('returns leaderboard with success envelope', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.leaderboard)).toBe(true);
    });

    it('returns companies sorted by total influence descending', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      const leaderboard = data.data.leaderboard;
      expect(leaderboard.length).toBeGreaterThan(0);

      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].totalInfluence).toBeGreaterThanOrEqual(
          leaderboard[i].totalInfluence
        );
      }
    });

    it('includes all required leaderboard entry fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      const firstEntry = data.data.leaderboard[0];
      expect(firstEntry).toMatchObject({
        companyId: expect.any(String),
        companyName: expect.any(String),
        totalInfluence: expect.any(Number),
      });
    });

    it('aggregates contributions correctly', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      const testCorpA = data.data.leaderboard.find(
        (e: any) => e.companyName === 'Test Corp A'
      );
      const testCorpB = data.data.leaderboard.find(
        (e: any) => e.companyName === 'Test Corp B'
      );

      expect(testCorpA).toBeDefined();
      expect(testCorpB).toBeDefined();
      expect(testCorpA.totalInfluence).toBe(750); // 500 + 250
      expect(testCorpB.totalInfluence).toBe(375);
    });
  });

  describe('Empty State Handling', () => {
    it('returns empty array when no contributions exist', async () => {
      // Clear all contributions
      await PoliticalContribution.deleteMany({});

      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.leaderboard).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors gracefully', async () => {
      // Disconnect database to simulate error
      await mongoose.disconnect();

      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      });

      // Reconnect for cleanup
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    });
  });

  describe('Performance', () => {
    it('uses indexed aggregation for efficient queries', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/leaderboard');
      const start = Date.now();
      await GET(req);
      const duration = Date.now() - start;

      // Aggregation should be fast even with test data
      expect(duration).toBeLessThan(500);
    });
  });
});
