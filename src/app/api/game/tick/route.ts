/**
 * @file src/app/api/game/tick/route.ts
 * @description API endpoint for game tick operations
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Provides endpoints for triggering and monitoring game ticks.
 * Ticks can be triggered manually (admin), or via cron job.
 *
 * Endpoints:
 * - GET: Get current tick status and history
 * - POST: Trigger a new tick
 *
 * @author ECHO v1.4.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { tickEngine, formatGameTime } from '@/lib/game/tick';
import { GameTick, IGameTickModel } from '@/lib/db/models/system/GameTick';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/utils/apiResponse';
import { TriggerTickRequest, TickStatusResponse } from '@/lib/types/gameTick';

// ============================================================================
// Validation Schemas
// ============================================================================

const triggerTickSchema = z.object({
  playerId: z.string().optional(),
  count: z.number().min(1).max(12).optional().default(1),
  dryRun: z.boolean().optional().default(false),
  force: z.boolean().optional().default(false),
});

// ============================================================================
// GET - Get tick status
// ============================================================================

/**
 * GET /api/game/tick
 * Get current tick status, game time, and recent history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Get current state
    const engineState = tickEngine.getState();
    const currentTime = await tickEngine.getCurrentGameTime();
    const history = await tickEngine.getHistory(10);

    // Build response
    const response: TickStatusResponse = {
      engineState,
      schedule: {
        cronExpression: '0 0 * * *', // Midnight daily (example)
        enabled: false, // Manual for now
        timezone: 'UTC',
        gameMonthsPerTick: 1,
      },
      lastResult: history[0],
      nextScheduledTick: undefined, // No auto-scheduling yet
    };

    return createSuccessResponse({
      status: response,
      currentGameTime: currentTime,
      formattedTime: formatGameTime(currentTime),
      history: history.slice(0, 5).map(h => ({
        tickId: h.tickId,
        gameTime: h.gameTime,
        formattedTime: formatGameTime(h.gameTime),
        success: h.success,
        itemsProcessed: h.totalItemsProcessed,
        durationMs: h.durationMs,
        completedAt: h.completedAt,
      })),
    });

  } catch (error) {
    console.error('GET /api/game/tick error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get tick status',
      'TICK_STATUS_ERROR',
      500
    );
  }
}

// ============================================================================
// POST - Trigger tick
// ============================================================================

/**
 * POST /api/game/tick
 * Trigger a new game tick (manual)
 * 
 * Body:
 * - playerId?: string - Only process specific player
 * - count?: number - Number of ticks to run (1-12)
 * - dryRun?: boolean - Don't save changes
 * - force?: boolean - Force even if recently processed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    // Parse body
    let body: TriggerTickRequest = {};
    try {
      const rawBody = await request.json();
      const validated = triggerTickSchema.parse(rawBody);
      body = validated;
    } catch (e) {
      // Empty body is fine for simple tick
      if (e instanceof z.ZodError) {
        return createErrorResponse(`Validation error: ${e.errors[0].message}`, 'VALIDATION_ERROR', 400);
      }
    }

    // Check if engine is busy
    if (tickEngine.getState().isProcessing) {
      return createErrorResponse('Tick already in progress', 'TICK_IN_PROGRESS', 409);
    }

    // If playerId specified, verify it's the current user or admin
    if (body.playerId && body.playerId !== session.user.id) {
      // TODO: Check if user is admin
      // For now, only allow processing own data
      return createErrorResponse('Can only trigger ticks for your own data', 'FORBIDDEN', 403);
    }

    // Default to current user if not specified
    const triggerOptions: TriggerTickRequest = {
      playerId: body.playerId ?? session.user.id,
      dryRun: body.dryRun,
      force: body.force,
    };

    // Run tick(s)
    const count = body.count ?? 1;
    let results;

    if (count === 1) {
      const result = await tickEngine.runTick(triggerOptions);
      results = [result];
    } else {
      results = await tickEngine.runCatchupTicks(count, triggerOptions);
    }

    // Get updated game time
    const newTime = await tickEngine.getCurrentGameTime();

    // Build response
    const lastResult = results[results.length - 1];
    
    return createSuccessResponse({
      success: results.every(r => r.success),
      message: `Processed ${results.length} tick(s)`,
      ticksProcessed: results.length,
      
      currentGameTime: newTime,
      formattedTime: formatGameTime(newTime),
      
      lastTick: {
        tickId: lastResult.tickId,
        gameTime: lastResult.gameTime,
        success: lastResult.success,
        itemsProcessed: lastResult.totalItemsProcessed,
        errors: lastResult.totalErrors,
        durationMs: lastResult.durationMs,
        
        // Include banking summary if available
        bankingSummary: lastResult.processors.find(p => p.processor === 'banking')?.summary,
      },
      
      allResults: body.dryRun ? results : undefined, // Only include full results for dry runs
    });

  } catch (error) {
    console.error('POST /api/game/tick error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to run tick',
      'TICK_ERROR',
      500
    );
  }
}

// ============================================================================
// Cron Support (Vercel Cron or similar)
// ============================================================================

/**
 * This endpoint can be called by a cron job to process ticks automatically.
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/game/tick/cron",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
