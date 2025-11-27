/**
 * @fileoverview Time Pause/Resume API
 * @module app/api/time/pause/route
 *
 * OVERVIEW:
 * Toggles paused state of the TimeEngine. When paused, game time does not advance
 * during ticks, allowing admin-controlled freezes.
 *
 * @created 2025-11-20
 */

import { NextRequest, NextResponse } from 'next/server';
import TimeEngine from '@/lib/time/timeEngine';
import { initTimeEvents } from '@/lib/time/events';

initTimeEvents();

export async function POST(req: NextRequest) {
  try {
    const engine = TimeEngine.getInstance();
    if (engine.isPaused()) {
      engine.resume();
    } else {
      engine.pause();
    }
    return NextResponse.json({ ok: true, paused: engine.isPaused() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - Simple toggle semantics for now; future improvement: separate /pause and /resume routes.
 */