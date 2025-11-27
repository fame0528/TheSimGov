/**
 * Integration Tests: GET /api/politics/states
 * 
 * Tests state influence metrics endpoint for contract compliance,
 * response validation, query parameter handling, and error cases.
 * 
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { GET } from '@/app/api/politics/states/route';
import { NextRequest } from 'next/server';

describe('GET /api/politics/states', () => {
  describe('Query All States', () => {
    it('returns all state metrics with success envelope', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.states)).toBe(true);
      expect(data.data.states.length).toBeGreaterThan(0);
    });

    it('includes all required state metric fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      const firstState = data.data.states[0];
      expect(firstState).toMatchObject({
        stateCode: expect.any(String),
        populationShare: expect.any(Number),
        gdpShare: expect.any(Number),
        seatShare: expect.any(Number),
        crimePercentile: expect.any(Number),
        compositeInfluenceWeight: expect.any(Number),
      });
    });

    it('returns states sorted by composite influence descending', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      const states = data.data.states;
      for (let i = 1; i < states.length; i++) {
        expect(states[i - 1].compositeInfluenceWeight).toBeGreaterThanOrEqual(
          states[i].compositeInfluenceWeight
        );
      }
    });

    it('returns exactly 50 states plus DC (51 total)', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.states).toHaveLength(51);
    });
  });

  describe('Query Single State', () => {
    it('returns single state when stateCode provided', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/states?stateCode=CA'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          state: expect.objectContaining({
            stateCode: 'CA',
            compositeInfluenceWeight: expect.any(Number),
          }),
        },
      });
    });

    it('returns 404 for invalid state code', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/states?stateCode=ZZ'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('State not found'),
          code: 'NOT_FOUND',
        }),
      });
    });

    it('handles lowercase state codes correctly', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/states?stateCode=tx'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.state.stateCode).toBe('TX');
    });
  });

  describe('Response Validation', () => {
    it('validates composite influence is weighted sum of components', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      const state = data.data.states[0];
      // Default weights: population 0.35, gdp 0.35, seats 0.20, crime 0.10
      const expectedComposite = 
        state.populationShare * 0.35 +
        state.gdpShare * 0.35 +
        state.seatShare * 0.20 +
        state.crimePercentile * 0.10;
      expect(state.compositeInfluenceWeight).toBeCloseTo(expectedComposite, 5);
    });

    it('validates all normalized values are between 0 and 1', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      data.data.states.forEach((state: any) => {
        expect(state.populationShare).toBeGreaterThanOrEqual(0);
        expect(state.populationShare).toBeLessThanOrEqual(1);
        expect(state.gdpShare).toBeGreaterThanOrEqual(0);
        expect(state.gdpShare).toBeLessThanOrEqual(1);
        expect(state.seatShare).toBeGreaterThanOrEqual(0);
        expect(state.seatShare).toBeLessThanOrEqual(1);
        expect(state.crimePercentile).toBeGreaterThanOrEqual(0);
        expect(state.crimePercentile).toBeLessThanOrEqual(1);
        expect(state.compositeInfluenceWeight).toBeGreaterThanOrEqual(0);
        expect(state.compositeInfluenceWeight).toBeLessThanOrEqual(1);
      });
    });

    it('validates shares sum to approximately 1.0 across all states', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const response = await GET(req);
      const data = await response.json();

      const totalPopShare = data.data.states.reduce((sum: number, s: any) => sum + s.populationShare, 0);
      const totalGdpShare = data.data.states.reduce((sum: number, s: any) => sum + s.gdpShare, 0);
      const totalSeatShare = data.data.states.reduce((sum: number, s: any) => sum + s.seatShare, 0);

      expect(totalPopShare).toBeCloseTo(1.0, 5);
      expect(totalGdpShare).toBeCloseTo(1.0, 5);
      expect(totalSeatShare).toBeCloseTo(1.0, 5);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed query parameters gracefully', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/states?stateCode='
      );
      const response = await GET(req);
      const data = await response.json();

      // Empty string should either return all states or error gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
      expect(data.success).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('responds within acceptable time (< 100ms for cached data)', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/states');
      const start = Date.now();
      await GET(req);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
