/**
 * @file src/app/api/politics/snapshots/route.ts
 * @description Influence snapshots API endpoint (GET, read-only placeholder)
 * @created 2025-11-25
 *
 * OVERVIEW:
 * Returns paginated influence snapshots optionally filtered by companyId. This Phase 001B
 * placeholder provides a stable contract leveraging `InfluenceSnapshot` until persistence is added.
 *
 * ENDPOINTS:
 * GET /api/politics/snapshots                     → Paginated snapshots
 * GET /api/politics/snapshots?companyId=...       → Filter by company
 * GET /api/politics/snapshots?page=2&pageSize=5   → Pagination
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import type { InfluenceSnapshot } from '@/lib/utils/politics/offlineProtection';
import {
  createErrorResponse,
  handleApiError,
} from '@/lib/utils/apiResponse';
import {
  SnapshotsResponseSchema,
  maybeValidateResponse,
} from '@/lib/utils/apiResponseSchemas';

const QuerySchema = z.object({
  companyId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

type SnapshotRow = { companyId: string; snapshot: InfluenceSnapshot };

// Placeholder dataset (read-only)
const SNAPSHOTS: SnapshotRow[] = [
  { companyId: 'comp:TX-0001', snapshot: { total: 120, level: 3, capturedAt: new Date().toISOString() } },
  { companyId: 'comp:CA-0002', snapshot: { total: 210, level: 4, capturedAt: new Date().toISOString() } },
  { companyId: 'comp:FL-0003', snapshot: { total: 95, level: 2, capturedAt: new Date().toISOString() } },
  { companyId: 'comp:NY-0004', snapshot: { total: 310, level: 5, capturedAt: new Date().toISOString() } },
  { companyId: 'comp:WA-0005', snapshot: { total: 180, level: 3, capturedAt: new Date().toISOString() } },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = {
      companyId: url.searchParams.get('companyId') ?? undefined,
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

    const { companyId, page, pageSize } = parsed.data;
    const filtered = companyId ? SNAPSHOTS.filter((r) => r.companyId === companyId) : SNAPSHOTS;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    const payload = {
      success: true as const,
      data: {
        page,
        pageSize,
        total: filtered.length,
        snapshots: items,
      },
      meta: { page, pageSize, total: filtered.length },
    };
    maybeValidateResponse(SnapshotsResponseSchema, payload, 'snapshots');
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch snapshots');
  }
}
