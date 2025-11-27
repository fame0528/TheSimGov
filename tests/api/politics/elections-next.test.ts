/**
 * Integration Tests: GET /api/politics/elections/next
 * 
 * Tests election projection endpoint for query validation,
 * calculation correctness, response contracts, and error cases.
 * 
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/politics/elections/next/route';
import { NextRequest } from 'next/server';

describe('GET /api/politics/elections/next', () => {
  describe('Presidential Elections', () => {
    it('returns next presidential election with success envelope', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.input.kind).toBe('President');
      expect(data.data.input.fromWeek).toBe(0);
      expect(typeof data.data.result.nextWeek).toBe('number');
    });

    it('calculates presidential cycle correctly (208 weeks)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.result.nextWeek).toBe(208); // 4 years * 52 weeks
    });

    it('handles mid-term presidential projection', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President&fromWeek=100'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.result.nextWeek).toBe(208);
      expect(data.data.result.nextWeek).toBeGreaterThan(100);
    });
  });

  describe('House Elections', () => {
    it('returns next house election (2-year cycle)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=House&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.result.nextWeek).toBe(104); // 2 years * 52 weeks
    });

    it('handles house election after first cycle', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=House&fromWeek=105'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.result.nextWeek).toBe(208); // Next 2-year cycle
    });
  });

  describe('Senate Elections', () => {
    it('returns next senate election for Class 1', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=Senate&senateClass=1&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.input.senateClass).toBe(1);
      expect(data.data.result.nextWeek).toBeGreaterThan(0);
    });

    it('returns next senate election for Class 2', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=Senate&senateClass=2&fromWeek=104'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.input.senateClass).toBe(2);
    });

    it('validates senate class is required for senators', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=Senate&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('validates senate class is 1, 2, or 3', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=Senate&senateClass=5&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Governor Elections', () => {
    it('returns next governor election', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=Governor&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.input.kind).toBe('Governor');
    });
  });

  describe('Query Parameter Validation', () => {
    it('validates kind is required', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates kind is valid office type', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=invalid&fromWeek=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates fromWeek is non-negative', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President&fromWeek=-10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('uses default fromWeek of 0 when not provided', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.input.fromWeek).toBe(0);
    });
  });

  describe('Response Contract', () => {
    it('includes input echo in response', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=House&fromWeek=50'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.input).toMatchObject({
        kind: 'House',
        fromWeek: 50,
        termYears: 2,
      });
    });

    it('includes calculation result fields', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=House&fromWeek=50'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.result).toMatchObject({
        nextWeek: expect.any(Number),
      });
    });
  });

  describe('Error Handling', () => {
    it('handles malformed query parameters gracefully', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?fromWeek=abc'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('responds quickly for calculation-only endpoint', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/elections/next?kind=President&fromWeek=100'
      );
      const start = Date.now();
      await GET(req);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Pure calculation, should be fast
    });
  });
});
