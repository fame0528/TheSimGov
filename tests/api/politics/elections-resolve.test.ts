/**
 * Integration Tests: GET /api/politics/elections/resolve
 * 
 * Tests resolution endpoint for contract compliance, summary presence,
 * and volatility-aware probabilities within [0,1].
 * 
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '@/app/api/politics/elections/resolve/route';
import { NextRequest } from 'next/server';

describe('GET /api/politics/elections/resolve', () => {
  it('returns success envelope with result and summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/politics/elections/resolve?preset=demo');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.result).toBeDefined();
    expect(data.data.result.summary).toBeDefined();
    expect(typeof data.data.result.summary.nationalPopularLeader === 'string' || data.data.result.summary.nationalPopularLeader === null).toBe(true);
    expect(typeof data.data.result.summary.evLead.difference).toBe('number');
  });

  it('includes adjusted margins and probabilities in summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/politics/elections/resolve');
    const response = await GET(req);
    const data = await response.json();

    const adjusted = data.data.result.summary.adjustedMargins;
    const probs = data.data.result.summary.stateWinProbability;
    const states = Object.keys(adjusted);
    expect(states.length).toBeGreaterThan(0);

    states.forEach((s: string) => {
      expect(typeof adjusted[s]).toBe('number');
      const p = probs[s];
      expect(p).toBeDefined();
      const vals = Object.values(p);
      vals.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
      // probabilities should sum ~ 1 for two-candidate races
      const sum = vals.reduce((a: number, b) => a + (b as number), 0);
      expect(sum).toBeCloseTo(1, 2);
    });
  });
});
