/**
 * @fileoverview Manual Tick Endpoint
 * @module app/api/time/tick/route
 *
 * OVERVIEW:
 * Allows serverless cron or admin action to force a single tick cycle. Advances
 * time respecting pause state (no advancement if paused) while processing any
 * events whose scheduledFor <= current time.
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
    engine.tickOnce();
    return NextResponse.json({
      ok: true,
      time: engine.getGameTime().toISOString(),
      paused: engine.isPaused(),
      events: engine.getEvents().length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * IMPLEMENTATION NOTES:
 * - tickOnce processes events even if paused (time not advanced) enabling overdue handling.
 */