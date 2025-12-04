import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import IdempotencyKey from '@/lib/db/models/system/IdempotencyKey';

export interface IdempotencyOptions {
  scope: string;
  ttlSeconds?: number; // default 3 days
  hashBody?: boolean; // default true
}

function hashString(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function handleIdempotent(
  request: Request,
  userId: string | undefined,
  execute: () => Promise<NextResponse>,
  opts: IdempotencyOptions
): Promise<NextResponse> {
  const key = request.headers.get('Idempotency-Key');
  if (!key) {
    // No idempotency header provided; run as normal
    return execute();
  }

  const ttlSeconds = opts.ttlSeconds ?? 60 * 60 * 24 * 3; // 3 days
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  await connectDB();

  const bodyText = opts.hashBody !== false ? await request.clone().text() : '';
  const requestHash = opts.hashBody !== false ? hashString(bodyText) : undefined;

  // Create or find existing key
  const existing = await IdempotencyKey.findOne({ key });
  if (existing) {
    // Same request hash → treat as replay
    if (!requestHash || existing.requestHash === requestHash) {
      const status = existing.statusCode ?? 200;
      const resp = NextResponse.json(
        { success: true, data: null, error: null, meta: { idempotent: true, replay: true, scope: existing.scope } },
        { status }
      );
      resp.headers.set('Idempotency-Key', key);
      resp.headers.set('Idempotency-Status', 'replayed');
      return resp;
    }
    // Different payload with same key → conflict
    return NextResponse.json(
      { success: false, data: null, error: 'Idempotency conflict: key reused with different payload' },
      { status: 409 }
    );
  }

  // Insert pending record (acts as a coarse lock)
  await IdempotencyKey.create({
    key,
    scope: opts.scope,
    userId,
    requestHash,
    status: 'pending',
    expiresAt,
    lockedAt: new Date(),
  });

  try {
    const response = await execute();
    // Persist success (store minimal summary and status)
    const statusCode = response.status;
    const summary = { statusCode, url: response.url || undefined };
    await IdempotencyKey.updateOne({ key }, { $set: { status: 'succeeded', statusCode, summary } });

    response.headers.set('Idempotency-Key', key);
    response.headers.set('Idempotency-Status', 'stored');
    return response;
  } catch (err) {
    await IdempotencyKey.updateOne({ key }, { $set: { status: 'failed' } });
    throw err;
  }
}
