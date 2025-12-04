import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  PoliticalOfficeKind,
  PoliticalOfficeLevel,
  type PoliticalOffice,
} from '@/politics/types/politicsTypes';
import {
  nextElectionWeekForOffice,
  GAME_WEEKS_PER_YEAR,
} from '@/politics/utils/timeScaling';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/apiResponse';

// Validation schema for query parameters
const querySchema = z.object({
  kind: z.enum(['President', 'House', 'Senate', 'Governor'], {
    required_error: 'kind is required',
    invalid_type_error: 'kind must be a valid office type',
  }),
  fromWeek: z
    .string()
    .optional()
    .transform((v) => (v == null ? '0' : v))
    .refine((v) => /^-?\d+$/.test(v as string), {
      message: 'fromWeek must be an integer',
    })
    .transform((v) => parseInt(v as string, 10))
    .refine((n) => n >= 0, { message: 'fromWeek must be non-negative' }),
  senateClass: z
    .string()
    .optional()
    .refine((v) => v == null || ['1', '2', '3'].includes(v), {
      message: 'senateClass must be 1, 2, or 3',
    })
    .transform((v) => (v == null ? undefined : (parseInt(v, 10) as 1 | 2 | 3))),
  termYears: z
    .string()
    .optional()
    .refine((v) => v == null || ['2', '4'].includes(v), {
      message: 'termYears must be 2 or 4',
    })
    .transform((v) => (v == null ? undefined : (parseInt(v, 10) as 2 | 4))),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }

    const { kind, fromWeek, senateClass, termYears } = parsed.data;

    // Build PoliticalOffice based on kind
    let office: PoliticalOffice;
    switch (kind) {
      case 'President':
        office = {
          level: PoliticalOfficeLevel.Federal,
          // We only need kind/termYears/senateClass for helpers
          kind: PoliticalOfficeKind.President,
          termYears: 4,
        } satisfies Partial<PoliticalOffice> as PoliticalOffice;
        break;
      case 'House':
        office = {
          level: PoliticalOfficeLevel.Federal,
          kind: PoliticalOfficeKind.House,
          termYears: 2,
        } satisfies Partial<PoliticalOffice> as PoliticalOffice;
        break;
      case 'Senate': {
        if (!senateClass) {
          return createErrorResponse('senateClass is required for Senate', 'VALIDATION_ERROR', 400);
        }
        office = {
          level: PoliticalOfficeLevel.Federal,
          kind: PoliticalOfficeKind.Senate,
          senateClass,
          termYears: 6,
        } satisfies Partial<PoliticalOffice> as PoliticalOffice;
        break;
      }
      case 'Governor':
        office = {
          level: PoliticalOfficeLevel.State,
          kind: PoliticalOfficeKind.Governor,
          termYears: termYears ?? 4,
        } satisfies Partial<PoliticalOffice> as PoliticalOffice;
        break;
      default:
        return createErrorResponse('Unsupported kind', 'VALIDATION_ERROR', 400);
    }

    const start = fromWeek ?? 0;
    const nextWeek = nextElectionWeekForOffice(start, office);

    // Input echo for contract expectations
    const inputEcho: Record<string, unknown> = {
      kind,
      fromWeek: start,
    };
    if (office.kind === PoliticalOfficeKind.Senate) {
      inputEcho.senateClass = office.senateClass;
      inputEcho.termYears = 6;
    } else if (office.kind === PoliticalOfficeKind.House) {
      inputEcho.termYears = 2;
    } else if (office.kind === PoliticalOfficeKind.Governor) {
      inputEcho.termYears = office.termYears;
    } else if (office.kind === PoliticalOfficeKind.President) {
      inputEcho.termYears = 4;
    }

    return createSuccessResponse({
      input: inputEcho,
      result: {
        nextWeek,
        cycleWeeks:
          office.kind === PoliticalOfficeKind.President
            ? 4 * GAME_WEEKS_PER_YEAR
            : office.kind === PoliticalOfficeKind.House
            ? 2 * GAME_WEEKS_PER_YEAR
            : office.kind === PoliticalOfficeKind.Senate
            ? 6 * GAME_WEEKS_PER_YEAR
            : (office.termYears as number) * GAME_WEEKS_PER_YEAR,
      },
    });
  } catch (err) {
    return createErrorResponse('Failed to compute next election', 'INTERNAL_ERROR', 500);
  }
}
