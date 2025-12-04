import { launderingChannelCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, LaunderingChannel } from "@/lib/db";
import { mapLaunderingChannelDoc } from "@/lib/dto/crimeAdapters";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { handleIdempotent } from "@/lib/utils/idempotency";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";
import { z } from 'zod';

// Type inference from Zod schema
type LaunderingChannelCreateInput = z.infer<typeof launderingChannelCreateSchema>;

// Query filter type for MongoDB
interface LaunderingQuery {
  ownerId: string;
  method?: string;
}

// GET /api/crime/laundering?method
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const url = new URL(request.url);
  const method = url.searchParams.get("method");
  try {
    await connectDB();
    const query: LaunderingQuery = { ownerId: session.user.id };
    if (method) query.method = method;
    const channels = await LaunderingChannel.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return createSuccessResponse(channels.map(mapLaunderingChannelDoc), { count: channels.length, method });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', method });
    }
    console.error('GET /crime/laundering error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

// POST /api/crime/laundering
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const rl = await rateLimitRequest(request, session.user.id, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }
  try {
    return handleIdempotent(request, session.user.id, async () => {
      const body = await request.json();
      const parsed = launderingChannelCreateSchema.safeParse(body);
      if (!parsed.success) {
        return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
      }
      await connectDB();
      // Extract ownerId from validated data and replace with session user
      const { ownerId: _ownerId, ...channelData }: LaunderingChannelCreateInput = parsed.data;
      const doc = await LaunderingChannel.create({ ownerId: session.user.id, ...channelData });
      return createSuccessResponse(mapLaunderingChannelDoc(doc), {}, 201);
    }, { scope: 'crime:laundering:create' });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/laundering error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
