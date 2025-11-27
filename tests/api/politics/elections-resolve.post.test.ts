/**
 * Integration Tests: POST /api/politics/elections/resolve
 *
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { POST } from '@/app/api/politics/elections/resolve/route';

describe('POST /api/politics/elections/resolve', () => {
  it('returns success with resolution result for valid payload', async () => {
    const body = {
      candidateAId: 'A',
      candidateBId: 'B',
      states: [
        { stateCode: 'PA', electoralVotes: 19, turnout: 60, margin: 0.8 },
        { stateCode: 'FL', electoralVotes: 30, turnout: 58, margin: -1.0 },
      ],
      delegation: {
        senateVotesPerPlayer: 1,
        houseDelegationWeights: { PA: 17, FL: 28 },
      },
      stateMomentum: {
        PA: { aWeeklyChange: 0.2, bWeeklyChange: -0.1, volatility: 1.0 },
        FL: { aWeeklyChange: -0.1, bWeeklyChange: 0.3, volatility: 2.0 },
      },
    };

    const req = new Request('http://localhost:3000/api/politics/elections/resolve', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.result?.summary).toBeDefined();
    expect(data.data?.input?.mode).toBe('custom');
    expect(data.data?.input?.statesCount).toBe(2);
  });

  it('returns 400 for invalid payload', async () => {
    const badBody = { bad: 'payload' };
    const req = new Request('http://localhost:3000/api/politics/elections/resolve', {
      method: 'POST',
      body: JSON.stringify(badBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe('VALIDATION_ERROR');
  });
});
