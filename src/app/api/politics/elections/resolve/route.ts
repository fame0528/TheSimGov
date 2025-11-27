/**
 * @file src/app/api/politics/elections/resolve/route.ts
 * @description Election resolution API endpoint (GET demo)
 * @created 2025-11-26
 *
 * OVERVIEW:
 * Exposes the election resolution engine with momentum-aware adjustments
 * and volatility-aware probabilities. For now, provides a demo dataset via GET
 * to exercise contracts and broadcasting. Extendable to accept custom inputs.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { maybeValidateResponse, ElectionResolutionResponseSchema } from '@/lib/utils/apiResponseSchemas';
import { handleApiError, createErrorResponse } from '@/lib/utils/apiResponse';
import { resolveElection } from '@/politics/engines/electionResolution';

export async function GET(request: Request) {
  try {
    // Dev-only helper: block in production per ECHO (no demo data in prod)
    if (process.env.NODE_ENV === 'production') {
      return createErrorResponse('Not Found', 'NOT_FOUND', 404);
    }
    const url = new URL(request.url);
    const mode = (url.searchParams.get('preset') ?? 'demo') as 'demo' | 'custom';

    // Demo dataset showcasing summary fields and momentum volatility usage
    const candidateAId = 'CAND_A';
    const candidateBId = 'CAND_B';

    const states = [
      { stateCode: 'PA', electoralVotes: 19, turnout: 62, margin: 0.8 },
      { stateCode: 'FL', electoralVotes: 30, turnout: 59, margin: -1.2 },
      { stateCode: 'OH', electoralVotes: 17, turnout: 57, margin: 3.4 },
      { stateCode: 'AZ', electoralVotes: 11, turnout: 61, margin: -0.3 },
      { stateCode: 'WI', electoralVotes: 10, turnout: 64, margin: 0.1 },
    ];

    const delegation = {
      senateVotesPerPlayer: 1,
      houseDelegationWeights: {
        PA: 17,
        FL: 28,
        OH: 15,
        AZ: 9,
        WI: 8,
      },
    };

    // Include volatility to exercise advanced probability mapping
    const stateMomentum = {
      PA: { aWeeklyChange: 0.3, bWeeklyChange: -0.1, volatility: 1.2 },
      FL: { aWeeklyChange: -0.2, bWeeklyChange: 0.4, volatility: 2.8 },
      OH: { aWeeklyChange: 0.1, bWeeklyChange: 0.0, volatility: 0.6 },
      AZ: { aWeeklyChange: 0.2, bWeeklyChange: 0.3, volatility: 3.5 },
      WI: { aWeeklyChange: 0.4, bWeeklyChange: 0.4, volatility: 0.9 },
    } as Record<string, { aWeeklyChange: number; bWeeklyChange: number; volatility?: number }>;

    const result = resolveElection({
      candidateAId,
      candidateBId,
      states,
      delegation,
      stateMomentum,
    });

    // Broadcast resolution to elections namespace if Socket.io available
    try {
      // @ts-ignore - global io is set by server.js
      const io = global.io as import('socket.io').Server | undefined;
      if (io) {
        io.of('/elections').emit('resolution', {
          type: 'resolution',
          timestamp: new Date().toISOString(),
          payload: { candidateAId, candidateBId, result },
        });
      }
    } catch (_) {
      // Non-fatal if broadcasting unavailable
    }

    const payload = {
      success: true as const,
      data: {
        input: {
          candidateAId,
          candidateBId,
          mode,
          statesCount: states.length,
        },
        result,
      },
    };

    maybeValidateResponse(ElectionResolutionResponseSchema, payload, 'elections/resolve');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to resolve election');
  }
}

// POST /api/politics/elections/resolve
// Production-safe: requires explicit payload and returns computed resolution
const StateInputSchema = z.object({
  stateCode: z.string().min(2).max(2),
  electoralVotes: z.number().int().positive(),
  turnout: z.number().min(0).max(100),
  margin: z.number(),
});

const DelegationSchema = z.object({
  senateVotesPerPlayer: z.number().int().positive().default(1),
  houseDelegationWeights: z.record(z.string(), z.number().int().nonnegative()),
});

const MomentumEntrySchema = z.object({
  aWeeklyChange: z.number(),
  bWeeklyChange: z.number(),
  volatility: z.number().optional(),
});

const ResolveBodySchema = z.object({
  candidateAId: z.string().min(1),
  candidateBId: z.string().min(1),
  states: z.array(StateInputSchema).min(1),
  delegation: DelegationSchema,
  stateMomentum: z.record(z.string(), MomentumEntrySchema).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => undefined);
    const parsed = ResolveBodySchema.safeParse(raw);
    if (!parsed.success) {
      return createErrorResponse(
        'Invalid request body',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }

    const { candidateAId, candidateBId, states, delegation, stateMomentum } = parsed.data;

    const result = resolveElection({
      candidateAId,
      candidateBId,
      states,
      delegation,
      stateMomentum,
    });

    // Broadcast to elections namespace if available
    try {
      // @ts-ignore - global io is set by server.js
      const io = global.io as import('socket.io').Server | undefined;
      if (io) {
        io.of('/elections').emit('resolution', {
          type: 'resolution',
          timestamp: new Date().toISOString(),
          payload: { candidateAId, candidateBId, result },
        });
      }
    } catch (_) {}

    const payload = {
      success: true as const,
      data: {
        input: {
          candidateAId,
          candidateBId,
          mode: 'custom' as const,
          statesCount: states.length,
        },
        result,
      },
    };
    maybeValidateResponse(ElectionResolutionResponseSchema, payload, 'elections/resolve');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to resolve election');
  }
}
