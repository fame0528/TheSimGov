/**
 * @file src/app/api/politics/endorsements/route.ts
 * @description Endorsements API endpoint (GET, read-only placeholder)
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Returns a paginated list of political endorsements. This Phase 001B placeholder
 * provides a stable contract until persistence is introduced. Payload aligns with
 * `EndorsementStub` from political types.
 *
 * ENDPOINTS:
 * GET /api/politics/endorsements               → Paginated endorsements (default page=1, pageSize=10)
 * GET /api/politics/endorsements?page=2&pageSize=5
 */

import { z } from 'zod';
import type { EndorsementStub } from '@/politics/types/politicsTypes';
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  EndorsementsResponseSchema,
  maybeValidateResponse,
} from '@/lib/utils/apiResponseSchemas';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

// Placeholder dataset (read-only). Replace with DB integration in later phase.
const ENDORSEMENTS: EndorsementStub[] = [
  { id: 'endorse-001', fromEntityId: 'org:ChamberOfCommerce', toCandidateId: 'cand:US-Senate-CA-2026-001', week: 12 },
  { id: 'endorse-002', fromEntityId: 'org:TeachersUnion', toCandidateId: 'cand:Governor-NY-2026-003', week: 18 },
  { id: 'endorse-003', fromEntityId: 'org:EnergyAssociation', toCandidateId: 'cand:US-House-TX-2026-014', week: 9 },
  { id: 'endorse-004', fromEntityId: 'org:HealthcareConsortium', toCandidateId: 'cand:US-House-FL-2026-008', week: 15 },
  { id: 'endorse-005', fromEntityId: 'org:AerospaceGuild', toCandidateId: 'cand:US-Senate-WA-2026-002', week: 20 },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = {
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
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

    const { page, pageSize } = parsed.data;
    const start = (page - 1) * pageSize;
    const items = ENDORSEMENTS.slice(start, start + pageSize);

    const payload = {
      success: true as const,
      data: {
        page,
        pageSize,
        total: ENDORSEMENTS.length,
        endorsements: items,
      },
      meta: { page, pageSize, total: ENDORSEMENTS.length },
    };
    maybeValidateResponse(EndorsementsResponseSchema, payload, 'endorsements');
    return createSuccessResponse(
      {
        page,
        pageSize,
        total: ENDORSEMENTS.length,
        endorsements: items,
      },
      { page, pageSize, total: ENDORSEMENTS.length }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to fetch endorsements');
  }
}
