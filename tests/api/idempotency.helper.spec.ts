import { handleIdempotent } from '@/lib/utils/idempotency';
import { NextResponse } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: async () => ({}),
}));

const createMockModel = () => {
  let doc: any = null;
  return {
    findOne: jest.fn(async ({ key }: any) => (doc && doc.key === key ? doc : null)),
    create: jest.fn(async (payload: any) => { doc = { _id: '1', ...payload }; return doc; }),
    updateOne: jest.fn(async ({ key }: any, update: any) => {
      if (doc && doc.key === key) {
        doc = { ...doc, ...(update.$set || {}) };
      }
      return { acknowledged: true } as any;
    }),
    _get: () => doc,
  };
};

jest.mock('@/lib/db/models/system/IdempotencyKey', () => {
  const model = createMockModel();
  return ({ __esModule: true, default: model });
});

function makeRequest(method: string, url: string, body?: any, headers?: Record<string, string>) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('handleIdempotent', () => {
  it('passes through when no Idempotency-Key header', async () => {
    const req = makeRequest('POST', 'http://localhost/x', { a: 1 });
    const res = await handleIdempotent(req, 'u1', async () => NextResponse.json({ ok: true }, { status: 201 }), { scope: 'test' });
    expect(res.status).toBe(201);
  });

  it('stores first request and replays subsequent with same key+payload', async () => {
    const key = 'abc-123';
    const req1 = makeRequest('POST', 'http://localhost/x', { a: 1 }, { 'Idempotency-Key': key });
    const created = await handleIdempotent(req1, 'u1', async () => NextResponse.json({ ok: true }, { status: 201 }), { scope: 'test' });
    expect(created.headers.get('Idempotency-Status')).toBe('stored');

    const req2 = makeRequest('POST', 'http://localhost/x', { a: 1 }, { 'Idempotency-Key': key });
    const replay = await handleIdempotent(req2, 'u1', async () => NextResponse.json({ ok: false }, { status: 201 }), { scope: 'test' });
    expect(replay.headers.get('Idempotency-Status')).toBe('replayed');
    expect(replay.status).toBe(201);
  });

  it('returns 409 when same key used with different payload', async () => {
    const key = 'xyz-999';
    const req1 = makeRequest('POST', 'http://localhost/x', { a: 1 }, { 'Idempotency-Key': key });
    await handleIdempotent(req1, 'u1', async () => NextResponse.json({ ok: true }, { status: 201 }), { scope: 'test' });

    const req2 = makeRequest('POST', 'http://localhost/x', { a: 2 }, { 'Idempotency-Key': key });
    const res = await handleIdempotent(req2, 'u1', async () => NextResponse.json({ ok: true }, { status: 201 }), { scope: 'test' });
    expect(res.status).toBe(409);
  });
});
