/**
 * @fileoverview Legislation Status API - Query legalization status
 * @module api/crime/legislation
 *
 * GET /api/crime/legislation - Query by substance/jurisdiction/status
 */

import { auth } from "@/auth";
import { connectDB, LegislationStatus } from "@/lib/db";
import { legislationStatusQuerySchema } from "@/lib/validations/crime";
import { mapLegislationStatusList } from "@/lib/dto/crimeAdapters";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parsed = legislationStatusQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 422);
  }

  try {
    await connectDB();

    const query: Record<string, unknown> = {};
    const { substance, jurisdiction, jurisdictionId, status } = parsed.data;

    if (substance) query.substance = substance;
    if (jurisdiction) query.jurisdiction = jurisdiction;
    if (jurisdictionId) query.jurisdictionId = jurisdictionId;
    if (status) query.status = status;

    const docs = await LegislationStatus.find(query)
      .sort({ effectiveDate: -1 })
      .limit(200)
      .lean();

    return createSuccessResponse(mapLegislationStatusList(docs), { count: docs.length });

  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');

    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', ...parsed.success ? parsed.data : {} });
    }

    console.error('GET /api/crime/legislation error', err);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
