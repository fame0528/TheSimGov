/**
 * Integration Tests: GET /api/politics/endorsements
 * 
 * Tests endorsements pagination endpoint for query handling,
 * pagination correctness, response validation, and edge cases.
 * 
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/politics/endorsements/route';
import { NextRequest } from 'next/server';

describe('GET /api/politics/endorsements', () => {
  describe('Pagination', () => {
    it('returns paginated endorsements with success envelope', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(10);
      expect(typeof data.data.total).toBe('number');
      expect(Array.isArray(data.data.endorsements)).toBe(true);
      expect(data.meta.page).toBe(1);
      expect(data.meta.pageSize).toBe(10);
      expect(typeof data.meta.total).toBe('number');
    });

    it('returns correct number of items per page', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=5'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.endorsements.length).toBeLessThanOrEqual(5);
    });

    it('uses default pagination when not specified', async () => {
      const req = new NextRequest('http://localhost:3000/api/politics/endorsements');
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.page).toBe(1);
      expect(data.data.pageSize).toBe(10); // Default page size
    });

    it('navigates to second page correctly', async () => {
      // Get first page
      const req1 = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=3'
      );
      const response1 = await GET(req1);
      const data1 = await response1.json();
      const firstPageIds = data1.data.endorsements.map((e: any) => e.id);

      // Get second page
      const req2 = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=2&pageSize=3'
      );
      const response2 = await GET(req2);
      const data2 = await response2.json();
      const secondPageIds = data2.data.endorsements.map((e: any) => e.id);

      // Pages should not overlap
      expect(firstPageIds).not.toEqual(secondPageIds);
    });
  });

  describe('Endorsement Fields', () => {
    it('includes all required endorsement stub fields', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=1'
      );
      const response = await GET(req);
      const data = await response.json();

      if (data.data.endorsements.length > 0) {
        const endorsement = data.data.endorsements[0];
        expect(endorsement).toMatchObject({
          id: expect.any(String),
          fromEntityId: expect.any(String),
          toCandidateId: expect.any(String),
          week: expect.any(Number),
        });
      }
    });

    it('validates fromEntityId format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      data.data.endorsements.forEach((e: any) => {
        expect(typeof e.fromEntityId).toBe('string');
        expect(e.fromEntityId.length).toBeGreaterThan(0);
      });
    });

    it('validates toCandidateId format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      data.data.endorsements.forEach((e: any) => {
        expect(typeof e.toCandidateId).toBe('string');
        expect(e.toCandidateId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Query Parameter Validation', () => {
    it('validates page is positive integer', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=0&pageSize=10'
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

    it('validates page is not negative', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=-1&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates pageSize is within bounds (1-50)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=101'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates pageSize is positive', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=0'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Edge Cases', () => {
    it('handles last page with fewer items than pageSize', async () => {
      // Request more items than exist (using max allowed pageSize)
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=50'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.endorsements.length).toBeLessThanOrEqual(50);
      expect(data.data.endorsements.length).toBe(
        Math.min(data.data.total, 50)
      );
    });

    it('handles page beyond available data', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=999999&pageSize=10'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.endorsements).toEqual([]);
    });
  });

  describe('Metadata Consistency', () => {
    it('ensures data and meta pagination fields match', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=2&pageSize=15'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.page).toBe(data.meta.page);
      expect(data.data.pageSize).toBe(data.meta.pageSize);
      expect(data.data.total).toBe(data.meta.total);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed query parameters gracefully', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=abc&pageSize=xyz'
      );
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('responds quickly for in-memory data slicing', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/politics/endorsements?page=1&pageSize=20'
      );
      const start = Date.now();
      await GET(req);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
