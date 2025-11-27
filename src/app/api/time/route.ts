/**
 * @fileoverview Time Control API (GET current time, PUT set time)
 * @module app/api/time/route
 *
 * OVERVIEW:
 * Provides read and administrative update access to the in-game time.
 * GET returns current game time & paused status. PUT sets absolute time (admin).
 * Integrates with TimeEngine singleton and ensures event system initialized.
 *
 * @created 2025-11-20
 */

import { NextRequest, NextResponse } from 'next/server';
import TimeEngine from '@/lib/time/timeEngine';
import { initTimeEvents } from '@/lib/time/events';
import { setTimeSchema } from '@/lib/time/validation';

initTimeEvents();

export async function GET() {
  const engine = TimeEngine.getInstance();
  return NextResponse.json({
    ok: true,
    time: engine.getGameTime().toISOString(),
    paused: engine.isPaused(),
  });
}

export async function PUT(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = setTimeSchema.parse(json);
    const date = new Date(parsed.time);
    const engine = TimeEngine.getInstance();
    engine.setGameTime(date);
    return NextResponse.json({ ok: true, time: engine.getGameTime().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Authentication/authorization omitted; integrate with NextAuth role check in future.
 * - Validation via Zod (setTimeSchema) prevents invalid date payloads.
 * - initTimeEvents() ensures engine started and listeners registered on first hit.
 */