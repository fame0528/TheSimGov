import { heatQuerySchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, HeatLevel } from "@/lib/db";
import { mapHeatLevelDoc } from "@/lib/dto/crimeAdapters";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";

// GET /api/crime/heat?scope&scopeId
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const scopeId = url.searchParams.get("scopeId");
  const parsed = heatQuerySchema.safeParse({ scope, scopeId });
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422);
  }
  try {
    await connectDB();
    const doc = await HeatLevel.findOne({ scope: parsed.data.scope, scopeId: parsed.data.scopeId }).lean();
    return createSuccessResponse(doc ? mapHeatLevelDoc(doc) : null, { scope: parsed.data.scope, scopeId: parsed.data.scopeId });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createSuccessResponse(null, { warning: 'DB DNS error fallback', scope: parsed.data.scope, scopeId: parsed.data.scopeId });
    }
    console.error('GET /crime/heat error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

// POST /api/crime/heat (upsert)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const body = await request.json();
  // Inline validation since schema extension with dynamic import causes type errors
  const { scope, scopeId, current } = body || {};
  const baseParsed = heatQuerySchema.safeParse({ scope, scopeId });
  if (!baseParsed.success || typeof current !== 'number' || current < 0 || current > 100) {
    return createErrorResponse('Invalid heat upsert payload', ErrorCode.VALIDATION_ERROR, 422);
  }
  try {
    await connectDB();
    const doc = await HeatLevel.findOneAndUpdate(
      { scope: baseParsed.data.scope, scopeId: baseParsed.data.scopeId },
      { $set: { current } },
      { new: true, upsert: true }
    );
    return createSuccessResponse(mapHeatLevelDoc(doc), {}, 201);
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503);
    }
    console.error('POST /crime/heat error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}
