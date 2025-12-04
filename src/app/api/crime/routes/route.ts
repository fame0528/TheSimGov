import { distributionRouteCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, DistributionRoute } from "@/lib/db";
import { mapRouteDoc } from "@/lib/dto/crimeAdapters";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") || session.user.id;
  const originState = url.searchParams.get("origin");
  const destinationState = url.searchParams.get("destination");
  const limitParam = url.searchParams.get("limit");
  const skipParam = url.searchParams.get("skip");
  const limit = Math.min(parseInt(limitParam || '50', 10), 200);
  const skip = Math.max(parseInt(skipParam || '0', 10), 0);
  try {
    await connectDB();
    const query: any = { ownerId };
    if (originState) query['origin.state'] = originState;
    if (destinationState) query['destination.state'] = destinationState;
    const [items, total] = await Promise.all([
      DistributionRoute.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DistributionRoute.countDocuments(query),
    ]);
    return createSuccessResponse(items.map(mapRouteDoc), {
      count: items.length,
      pagination: { total, limit, skip, pages: Math.ceil(total / limit) },
      ownerId,
      originState,
      destinationState,
    });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', ownerId, originState, destinationState });
    }
    console.error('GET /crime/routes error', err);
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
  const body = await request.json();
  const parsed = distributionRouteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
  }
  try {
    await connectDB();
    const { ownerId: _ownerId, ...routeData } = parsed.data;
    const doc = await DistributionRoute.create({ ownerId: session.user.id, ...routeData });
    return createSuccessResponse(mapRouteDoc(doc), {}, 201);
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/routes error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
