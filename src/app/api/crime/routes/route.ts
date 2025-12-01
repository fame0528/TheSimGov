import { NextResponse } from "next/server";
import { distributionRouteCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, DistributionRoute } from "@/lib/db";
import { mapRouteDoc } from "@/lib/dto/crimeAdapters";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") || session.user.id;
  const originState = url.searchParams.get("origin");
  const destinationState = url.searchParams.get("destination");
  try {
    await connectDB();
    const query: any = { ownerId };
    if (originState) query['origin.state'] = originState;
    if (destinationState) query['destination.state'] = destinationState;
    const routes = await DistributionRoute.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: routes.map(mapRouteDoc), error: null, meta: { count: routes.length } });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: true, data: [], error: null, meta: { warning: 'DB DNS error fallback', ownerId, originState, destinationState } });
    }
    console.error('GET /crime/routes error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const body = await request.json();
  const parsed = distributionRouteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const { ownerId: _ownerId, ...routeData } = parsed.data;
    const doc = await DistributionRoute.create({ ownerId: session.user.id, ...routeData });
    return NextResponse.json({ success: true, data: mapRouteDoc(doc), error: null, meta: {} }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: false, data: null, error: 'Service unavailable (DB DNS error)', meta: { fallback: true } }, { status: 503 });
    }
    console.error('POST /crime/routes error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}
