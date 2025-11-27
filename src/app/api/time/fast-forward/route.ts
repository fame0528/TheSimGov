/**
 * @fileoverview Fast-Forward Time API
 * @module app/api/time/fast-forward/route
 *
 * OVERVIEW:
 * Advances in-game time by a specified number of hours (admin). Uses scaling rules
 * from TimeEngine configuration. Emits due events after advancement.
 *
 * @created 2025-11-20
 */

import { NextRequest, NextResponse } from 'next/server';
import TimeEngine from '@/lib/time/timeEngine';
import { initTimeEvents } from '@/lib/time/events';
import { fastForwardSchema } from '@/lib/time/validation';

initTimeEvents();

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { hours } = fastForwardSchema.parse(json);
    const engine = TimeEngine.getInstance();
    const current = engine.getGameTime();
    const advanced = new Date(current.getTime() + hours * 60 * 60 * 1000);
    engine.setGameTime(advanced);
    // Manually invoke tickOnce to process events whose scheduledFor <= advanced
    engine.tickOnce();
    return NextResponse.json({ ok: true, time: engine.getGameTime().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Single advancement applied directly; future enhancement: chunk advancement to avoid large skips.
 */