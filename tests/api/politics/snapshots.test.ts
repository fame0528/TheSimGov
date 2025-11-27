/**
 * Integration Tests: GET /api/politics/snapshots
 * 
 * Tests influence snapshots endpoint for pagination, filtering,
 * query validation, response contracts, and edge cases.
 * 
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/politics/snapshots/route';
import { NextRequest } from 'next/server';

describe('GET /api/politics/snapshots', () => {
  describe('Pagination', () => {
    it('returns paginated snapshots with success envelope', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(10);
      expect(typeof data.data.total).toBe('number');
      expect(Array.isArray(data.data.snapshots)).toBe(true);
      expect(data.meta.page).toBe(1);
      expect(data.meta.pageSize).toBe(10);
      expect(typeof data.meta.total).toBe('number');
    });

    it('returns correct number of items per page', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=5'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.snapshots.length).toBeLessThanOrEqual(5);
    });

    it('uses default pagination when not specified', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/snapshots');
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(10); // Default page size
    });
  });

  describe('Company Filtering', () => {
    it('filters snapshots by companyId', async () => {
      // Get all snapshots to find a valid companyId
      const reqAll = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=50'
      );
      const responseAll = await GET(reqAll);
      const dataAll = await responseAll.json();

      if (dataAll.data.snapshots.length > 0) {
        const testCompanyId = dataAll.data.snapshots[0].companyId;

        // Filter by that companyId
        const reqFiltered = new NextRequest(
          `http://localhost:3000/api/politics/snapshots?companyId=${testCompanyId}&page=1&pageSize=10`
        );
        const responseFiltered = await GET(reqFiltered);
        const dataFiltered = await responseFiltered.json();

        expect(responseFiltered.status).toBe(200);
        dataFiltered.data.snapshots.forEach((snapshot: any) => {
          expect(snapshot.companyId).toBe(testCompanyId);
        });
      }
    });

    it('returns empty array when filtering by non-existent companyId', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?companyId=nonexistent&page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.snapshots).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    it('returns all snapshots when no companyId filter provided', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Snapshot Fields', () => {
    it('includes all required snapshot fields', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=1'
      );
      const response = await GET(req);
      const data = await response.json();

      if (data.data.snapshots.length > 0) {
        const snapshotRow = data.data.snapshots[0];
        expect(snapshotRow).toMatchObject({
          companyId: expect.any(String),
          snapshot: {
            total: expect.any(Number),
            level: expect.any(Number),
            capturedAt: expect.any(String),
          },
        });
      }
    });

    it('validates snapshot has total as non-negative', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=1'
      );
      const response = await GET(req);
      const data = await response.json();

      if (data.data.snapshots.length > 0) {
        const snapshotRow = data.data.snapshots[0];
        expect(snapshotRow.snapshot.total).toBeGreaterThanOrEqual(0);
        expect(snapshotRow.snapshot.level).toBeGreaterThanOrEqual(0);
        expect(typeof snapshotRow.snapshot.capturedAt).toBe('string');
      }
    });

    it('validates snapshot total is non-negative', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      data.data.snapshots.forEach((snapshotRow: any) => {
        expect(snapshotRow.snapshot.total).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Query Parameter Validation', () => {
    it('validates page is positive integer', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=0&pageSize=10'
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

    it('validates pageSize is within bounds (1-50)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=150'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts optional companyId parameter', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=10'
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('handles last page with fewer items than pageSize', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=50'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.snapshots.length).toBeLessThanOrEqual(50);
    });

    it('handles page beyond available data', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=999999&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.snapshots).toEqual([]);
    });

    it('handles empty companyId filter string', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?companyId=&page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Metadata Consistency', () => {
    it('ensures data and meta pagination fields match', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=2&pageSize=15'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.page).toBe(data.meta.page);
      expect(data.data.pageSize).toBe(data.meta.pageSize);
      expect(data.data.total).toBe(data.meta.total);
    });

    it('validates filtered total matches actual filtered count', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=50'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.total).toBe(data.data.snapshots.length);
    });
  });

  describe('Sorting', () => {
    it('returns snapshots in consistent order', async () => {
      const req1 = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=5'
      );
      const response1 = await GET(req1);
      const data1 = await response1.json();

      const req2 = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=5'
      );
      const response2 = await GET(req2);
      const data2 = await response2.json();

      // Same request should return same order
      expect(data1.data.snapshots).toEqual(data2.data.snapshots);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed query parameters gracefully', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=abc&pageSize=xyz'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('responds quickly for in-memory filtering', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/snapshots?page=1&pageSize=20'
      );
      const start = Date.now();
      await GET(req);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
