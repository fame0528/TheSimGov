import { NextResponse } from "next/server";
import { productionFacilityCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, ProductionFacility } from "@/lib/db";
import { mapFacilityDoc } from "@/lib/dto/crimeAdapters";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") || session.user.id;
  const type = url.searchParams.get("type");
  const state = url.searchParams.get("state");
  try {
    await connectDB();
    const query: any = { ownerId };
    if (type) query.type = type;
    if (state) query['location.state'] = state;
    const facilities = await ProductionFacility.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: facilities.map(mapFacilityDoc), error: null, meta: { count: facilities.length } });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: true, data: [], error: null, meta: { warning: 'DB DNS error fallback', ownerId, type, state } });
    }
    console.error('GET /crime/facilities error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const body = await request.json();
  const parsed = productionFacilityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const { ownerId: _ownerId, ...facilityData } = parsed.data;
    const doc = await ProductionFacility.create({ ownerId: session.user.id, ...facilityData });
    return NextResponse.json({ success: true, data: mapFacilityDoc(doc), error: null, meta: {} }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: false, data: null, error: 'Service unavailable (DB DNS error)', meta: { fallback: true } }, { status: 503 });
    }
    console.error('POST /crime/facilities error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}
