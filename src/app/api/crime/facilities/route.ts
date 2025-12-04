import { productionFacilityCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, ProductionFacility } from "@/lib/db";
import { mapFacilityDoc } from "@/lib/dto/crimeAdapters";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { handleIdempotent } from "@/lib/utils/idempotency";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";
import { z } from 'zod';

// Type inference from Zod schema
type FacilityCreateInput = z.infer<typeof productionFacilityCreateSchema>;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") || session.user.id;
  const type = url.searchParams.get("type");
  const state = url.searchParams.get("state");
  const limitParam = url.searchParams.get("limit");
  const skipParam = url.searchParams.get("skip");
  const limit = Math.min(parseInt(limitParam || '50', 10), 200);
  const skip = Math.max(parseInt(skipParam || '0', 10), 0);
  try {
    await connectDB();
    const query: any = { ownerId };
    if (type) query.type = type;
    if (state) query['location.state'] = state;
    const [items, total] = await Promise.all([
      ProductionFacility.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductionFacility.countDocuments(query),
    ]);
    return createSuccessResponse(items.map(mapFacilityDoc), {
      count: items.length,
      pagination: { total, limit, skip, pages: Math.ceil(total / limit) },
      ownerId,
      type,
      state,
    });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', ownerId, type, state });
    }
    console.error('GET /crime/facilities error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const rl = await rateLimitRequest(request, session.user.id, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }
  try {
    return handleIdempotent(request, session.user.id, async () => {
      const body = await request.json();
      const parsed = productionFacilityCreateSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
      }
      await connectDB();
      // Extract ownerId from validated data and replace with session user
      const { ownerId: _ownerId, ...facilityData }: FacilityCreateInput = parsed.data;
      const doc = await ProductionFacility.create({ ownerId: session.user.id, ...facilityData });
      return createSuccessResponse(mapFacilityDoc(doc), {}, 201);
    }, { scope: 'crime:facility:create' });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/facilities error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
