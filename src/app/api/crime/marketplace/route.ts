import { NextResponse } from "next/server";
import { marketplaceListingCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, MarketplaceListing } from "@/lib/db";
import { mapMarketplaceListingDoc } from "@/lib/dto/crimeAdapters";

// GET /api/crime/marketplace?substance&state&minPurity&maxPrice
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const url = new URL(request.url);
  const substance = url.searchParams.get("substance");
  const state = url.searchParams.get("state");
  const minPurity = url.searchParams.get("minPurity");
  const maxPrice = url.searchParams.get("maxPrice");
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
    const listings = await MarketplaceListing.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: listings.map(mapMarketplaceListingDoc), error: null, meta: { count: listings.length, substance, state } });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: true, data: [], error: null, meta: { warning: 'DB DNS error fallback', substance, state } });
    }
    console.error('GET /crime/marketplace error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}

// POST /api/crime/marketplace
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const body = await request.json();
  const parsed = marketplaceListingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const { sellerId: _sellerId, ...listingData } = parsed.data;
    const doc = await MarketplaceListing.create({ sellerId: session.user.id, ...listingData });
    return NextResponse.json({ success: true, data: mapMarketplaceListingDoc(doc), error: null, meta: {} }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: false, data: null, error: 'Service unavailable (DB DNS error)', meta: { fallback: true } }, { status: 503 });
    }
    console.error('POST /crime/marketplace error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}
