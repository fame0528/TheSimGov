import { NextRequest } from 'next/server';
import { z } from 'zod';
import { resolveElection, type ResolutionInputs } from '@/politics/engines/electionResolution';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/apiResponse';

// Zod schema for POST payload
const resolutionSchema = z.object({
  candidateAId: z.string().min(1),
  candidateBId: z.string().min(1),
  states: z
    .array(
      z.object({
        stateCode: z.string().min(2),
        electoralVotes: z.number().int().min(1),
        turnout: z.number().min(0).max(100),
        margin: z.number(),
      })
    )
    .min(1),
  delegation: z.object({
    senateVotesPerPlayer: z.number().int().min(1),
    houseDelegationWeights: z.record(z.number().int().min(0)),
  }),
  stateMomentum: z
    .record(
      z.object({
        aWeeklyChange: z.number(),
        bWeeklyChange: z.number(),
        volatility: z.number().optional(),
      })
    )
    .optional(),
});

// Demo/default dataset for GET (and fallback)
function demoInputs(): ResolutionInputs {
  return buildMutableDemoInputs();
}

function buildMutableDemoInputs(): ResolutionInputs {
  return {
    candidateAId: 'A',
    candidateBId: 'B',
    states: [
      { stateCode: 'PA', electoralVotes: 19, turnout: 60, margin: 0.8 },
      { stateCode: 'FL', electoralVotes: 30, turnout: 58, margin: -1.0 },
      { stateCode: 'WI', electoralVotes: 10, turnout: 62, margin: 0.2 },
      { stateCode: 'AZ', electoralVotes: 11, turnout: 59, margin: -0.3 },
    ],
    delegation: {
      senateVotesPerPlayer: 1,
      houseDelegationWeights: { PA: 17, FL: 28, WI: 8, AZ: 9 },
    },
    stateMomentum: {
      PA: { aWeeklyChange: 0.2, bWeeklyChange: -0.1, volatility: 1.0 },
      FL: { aWeeklyChange: -0.1, bWeeklyChange: 0.3, volatility: 2.0 },
      WI: { aWeeklyChange: 0.05, bWeeklyChange: 0.0, volatility: 0.5 },
      AZ: { aWeeklyChange: -0.05, bWeeklyChange: 0.1, volatility: 0.8 },
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const preset = url.searchParams.get('preset');
    const input = demoInputs();
    const result = resolveElection(input);
    return createSuccessResponse({
      input: { mode: preset === 'demo' ? 'demo' : 'default', statesCount: input.states.length },
      result,
    });
  } catch (err) {
    return createErrorResponse('Failed to resolve election', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => undefined);
    const parsed = resolutionSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('Invalid payload', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }
    const input = parsed.data;
    const result = resolveElection(input);
    return createSuccessResponse({
      input: { mode: 'custom', statesCount: input.states.length },
      result,
    });
  } catch (err) {
    return createErrorResponse('Failed to resolve election', 'INTERNAL_ERROR', 500);
  }
}
