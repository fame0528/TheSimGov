import { rateLimitRequest } from '@/lib/utils/rateLimit';

function makeReq(headers: Record<string,string> = {}) {
  return new Request('http://localhost/x', { headers });
}

describe('rateLimitRequest', () => {
  it('applies limits and returns standard headers', async () => {
    const req = makeReq({ 'X-Forwarded-For': '1.2.3.4' });
    const windowMs = 200; // short window for test
    const limit = 2;
    const r1 = await rateLimitRequest(req, undefined, { limit, windowMs });
    const r2 = await rateLimitRequest(req, undefined, { limit, windowMs });
    const r3 = await rateLimitRequest(req, undefined, { limit, windowMs });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.headers['X-RateLimit-Limit']).toBe(String(limit));
    expect(r3.headers['X-RateLimit-Remaining']).toBe('0');
    expect(r3.headers['X-RateLimit-Reset']).toBeDefined();
    expect(r3.headers['Retry-After']).toBeDefined();
  });
});
