/**
 * @fileoverview Core Loop API - State & Advance Endpoints
 * @module app/api/core-loop
 *
 * OVERVIEW:
 * Handles core loop state retrieval and tick advancement for the simulation.
 * - GET: Returns current core loop state for the user
 * - POST: Advances the core loop tick (monthly/weekly/daily)
 * - Full authentication, Zod validation, error handling
 *
 * @created 2025-12-05
 * @author ECHO v1.3.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { CoreLoopState, CoreLoopActionRequest, CoreLoopActionType, CoreLoopResult, CoreLoopFrequency, CoreLoopActionResponse } from '@/lib/types/coreLoop';
import { CoreLoopStatus } from '@/lib/types/coreLoop';
import { advanceCoreLoopTick, getNextTickTime, formatCoreLoopError } from '@/lib/utils/coreLoopCalculators';

// In-memory store for demo (replace with DB in production)
const coreLoopStates: Record<string, CoreLoopState> = {};

/**
 * Zod schema for POST /api/core-loop
 */
const coreLoopActionSchema = z.object({
  action: z.nativeEnum(CoreLoopActionType),
  params: z.record(z.any()).optional(),
});

/**
 * GET /api/core-loop
 * Returns current core loop state for the authenticated user
 *
 * @returns CoreLoopState
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    let state = coreLoopStates[userId];
    if (!state) {
      // Initialize default state
      state = {
        userId,
        currentTick: 0,
        frequency: CoreLoopFrequency.MONTHLY,
        status: CoreLoopStatus.RUNNING,
        lastTickAt: null,
        nextTickAt: getNextTickTime({
          userId,
          currentTick: 0,
          frequency: CoreLoopFrequency.MONTHLY,
          status: CoreLoopStatus.RUNNING,
          lastTickAt: null,
          nextTickAt: null,
          ticksProcessed: 0,
        }),
        ticksProcessed: 0,
      };
      coreLoopStates[userId] = state;
    }
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ error: formatCoreLoopError(error) }, { status: 500 });
  }
}

/**
 * POST /api/core-loop
 * Advances the core loop tick for the authenticated user
 *
 * @body { action: CoreLoopActionType, params?: Record<string, unknown> }
 * @returns CoreLoopActionResponse
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const validation = coreLoopActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 });
    }
    const { action, params } = validation.data;
    let state = coreLoopStates[userId];
    if (!state) {
      // Initialize default state
      state = {
        userId,
        currentTick: 0,
        frequency: CoreLoopFrequency.MONTHLY,
        status: CoreLoopStatus.RUNNING,
        lastTickAt: null,
        nextTickAt: getNextTickTime({
          userId,
          currentTick: 0,
          frequency: CoreLoopFrequency.MONTHLY,
          status: CoreLoopStatus.RUNNING,
          lastTickAt: null,
          nextTickAt: null,
          ticksProcessed: 0,
        }),
        ticksProcessed: 0,
      };
      coreLoopStates[userId] = state;
    }
      if (action === CoreLoopActionType.ADVANCE_TICK) {
        const { newState, result } = advanceCoreLoopTick(state);
        coreLoopStates[userId] = newState;
        const response: CoreLoopActionResponse = {
          success: true,
          message: `Tick advanced to ${newState.currentTick}`,
          result,
        };
        return NextResponse.json(response);
      } else if (action === CoreLoopActionType.RESET) {
        state = {
          userId,
          currentTick: 0,
          frequency: CoreLoopFrequency.MONTHLY,
          status: CoreLoopStatus.RUNNING,
          lastTickAt: null,
          nextTickAt: getNextTickTime({
            userId,
            currentTick: 0,
            frequency: CoreLoopFrequency.MONTHLY,
            status: CoreLoopStatus.RUNNING,
            lastTickAt: null,
            nextTickAt: null,
            ticksProcessed: 0,
          }),
          ticksProcessed: 0,
        };
        coreLoopStates[userId] = state;
        return NextResponse.json({ success: true, message: 'Core loop reset.' });
      } else {
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
      }
  } catch (error) {
    return NextResponse.json({ error: formatCoreLoopError(error) }, { status: 500 });
  }
}
