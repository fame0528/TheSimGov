import { marketplaceListingCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, MarketplaceListing } from "@/lib/db";
import { mapMarketplaceListingDoc } from "@/lib/dto/crimeAdapters";
import { rateLimitRequest } from "@/lib/utils/rateLimit";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";

// GET /api/crime/marketplace?substance&state&minPurity&maxPrice
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const url = new URL(request.url);
  const substance = url.searchParams.get("substance");
  const state = url.searchParams.get("state");
  const minPurity = url.searchParams.get("minPurity");
  const maxPrice = url.searchParams.get("maxPrice");
  const limitParam = url.searchParams.get("limit");
  const skipParam = url.searchParams.get("skip");
  const limit = Math.min(parseInt(limitParam || '50', 10), 200);
  const skip = Math.max(parseInt(skipParam || '0', 10), 0);
  try {
    await connectDB();
    const query: any = { status: 'Active' };
    if (substance) query.substance = substance;
    if (state) query['location.state'] = state;
    if (minPurity) {
      const mp = parseInt(minPurity, 10); if (!Number.isNaN(mp)) query.purity = { ...(query.purity||{}), $gte: mp };
    }
    if (maxPrice) {
      const mx = parseFloat(maxPrice); if (!Number.isNaN(mx)) query.pricePerUnit = { ...(query.pricePerUnit||{}), $lte: mx };
    }
    const [items, total] = await Promise.all([
      MarketplaceListing.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MarketplaceListing.countDocuments(query),
    ]);
    return createSuccessResponse(items.map(mapMarketplaceListingDoc), {
      count: items.length,
      pagination: { total, limit, skip, pages: Math.ceil(total / limit) },
      substance,
      state,
    });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createSuccessResponse([], { warning: 'DB DNS error fallback', substance, state });
    }
    console.error('GET /crime/marketplace error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

// POST /api/crime/marketplace
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
  }
  const rl = await rateLimitRequest(request, session.user.id, { limit: 40, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse('Too Many Requests', ErrorCode.RATE_LIMIT, 429, rl.headers);
  }
  const body = await request.json();
  const parsed = marketplaceListingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422, rl.headers);
  }
  try {
    await connectDB();
    const { sellerId: _sellerId, ...listingData } = parsed.data;
    const doc = await MarketplaceListing.create({ sellerId: session.user.id, ...listingData });
    return createSuccessResponse(mapMarketplaceListingDoc(doc), {}, 201);
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return createErrorResponse('Service unavailable (DB DNS error)', ErrorCode.INTERNAL_ERROR, 503, rl.headers);
    }
    console.error('POST /crime/marketplace error', err);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, rl.headers);
  }
}
