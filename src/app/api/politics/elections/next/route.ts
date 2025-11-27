/**
 * @file src/app/api/politics/elections/next/route.ts
 * @description Next election projection API endpoint (GET)
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Computes the next election week for a given political office using the
 * accelerated time model helpers. Supports House, Senate (with class),
 * Governor (term years), President, Legislature, Mayor.
 *
 * ENDPOINTS:
 * GET /api/politics/elections/next?kind=Senate&senateClass=2&fromWeek=0
 * GET /api/politics/elections/next?kind=Governor&termYears=4&fromWeek=52
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { PoliticalOfficeKind, type PoliticalOffice, type SenateClass } from '@/politics/types/politicsTypes';
import { nextElectionWeekForOffice, describeNextElection } from '@/politics/utils/timeScaling';
import {
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  ElectionProjectionResponseSchema,
  maybeValidateResponse,
} from '@/lib/utils/apiResponseSchemas';

const QuerySchema = z.object({
  kind: z.enum([
    PoliticalOfficeKind.House,
    PoliticalOfficeKind.Senate,
    PoliticalOfficeKind.Governor,
    PoliticalOfficeKind.President,
    PoliticalOfficeKind.Legislature,
    PoliticalOfficeKind.Mayor,
  ] as [string, ...string[]]),
  fromWeek: z.coerce.number().int().min(0).default(0),
  senateClass: z.coerce.number().int().min(1).max(3).optional(),
  termYears: z.coerce.number().int().refine((v) => v === 2 || v === 4, {
    message: 'termYears must be 2 or 4',
  }).optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = {
      kind: url.searchParams.get('kind') ?? undefined,
      fromWeek: url.searchParams.get('fromWeek') ?? undefined,
      senateClass: url.searchParams.get('senateClass') ?? undefined,
      termYears: url.searchParams.get('termYears') ?? undefined,
    };

    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      return createErrorResponse(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsed.error.issues
      );
    }

    const { kind, fromWeek, senateClass, termYears } = parsed.data as {
      kind: PoliticalOfficeKind;
      fromWeek: number;
      senateClass?: SenateClass;
      termYears?: 2 | 4;
    };

    const office: PoliticalOffice = {
      level: kind === PoliticalOfficeKind.Mayor || kind === PoliticalOfficeKind.Legislature
        ?  PoliticalOfficeKind.Mayor === kind ?  PoliticalOfficeKind.Mayor as any : PoliticalOfficeKind.Legislature as any
        : kind === PoliticalOfficeKind.Governor ? ("State" as any) : (kind === PoliticalOfficeKind.House || kind === PoliticalOfficeKind.Senate || kind === PoliticalOfficeKind.President ? ("Federal" as any) : ("Local" as any)),
      // Level assignment above is a placeholder mapping to satisfy type; actual level value is not used by scheduler.
      kind,
      termYears: kind === PoliticalOfficeKind.Senate ? 6 : kind === PoliticalOfficeKind.President ? 4 : kind === PoliticalOfficeKind.Governor ? (termYears ?? 2) : 2,
      senateClass: kind === PoliticalOfficeKind.Senate ? (senateClass as SenateClass | undefined) : undefined,
    } as PoliticalOffice;

    // Validate senate requirements
    if (kind === PoliticalOfficeKind.Senate && !office.senateClass) {
      return createErrorResponse(
        'Senate requires senateClass (1, 2, or 3)',
        'VALIDATION_ERROR',
        400
      );
    }

    const projection = describeNextElection(fromWeek, office);
    // Also expose raw next week calculation for parity
    const nextWeek = nextElectionWeekForOffice(fromWeek, office);

    const payload = {
      success: true as const,
      data: {
        input: { kind, fromWeek, senateClass, termYears: office.termYears },
        result: { ...projection, nextWeek },
      },
    };
    maybeValidateResponse(ElectionProjectionResponseSchema, payload, 'elections/next');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to compute next election');
  }
}
