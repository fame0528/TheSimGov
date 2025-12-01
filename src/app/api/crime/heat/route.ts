import { NextResponse } from "next/server";
import { heatQuerySchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, HeatLevel } from "@/lib/db";
import { mapHeatLevelDoc } from "@/lib/dto/crimeAdapters";

// GET /api/crime/heat?scope&scopeId
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const scopeId = url.searchParams.get("scopeId");
  const parsed = heatQuerySchema.safeParse({ scope, scopeId });
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const doc = await HeatLevel.findOne({ scope: parsed.data.scope, scopeId: parsed.data.scopeId }).lean();
    return NextResponse.json({ success: true, data: doc ? mapHeatLevelDoc(doc) : null, error: null, meta: { scope: parsed.data.scope, scopeId: parsed.data.scopeId } });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: true, data: null, error: null, meta: { warning: 'DB DNS error fallback', scope: parsed.data.scope, scopeId: parsed.data.scopeId } });
    }
    console.error('GET /crime/heat error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}

// POST /api/crime/heat (upsert)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const body = await request.json();
  // Inline validation since schema extension with dynamic import causes type errors
  const { scope, scopeId, current } = body || {};
  const baseParsed = heatQuerySchema.safeParse({ scope, scopeId });
  if (!baseParsed.success || typeof current !== 'number' || current < 0 || current > 100) {
    return NextResponse.json({ success: false, data: null, error: 'Invalid heat upsert payload', meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const doc = await HeatLevel.findOneAndUpdate(
      { scope: baseParsed.data.scope, scopeId: baseParsed.data.scopeId },
      { $set: { current } },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, data: mapHeatLevelDoc(doc), error: null, meta: {} }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: false, data: null, error: 'Service unavailable (DB DNS error)', meta: { fallback: true } }, { status: 503 });
    }
    console.error('POST /crime/heat error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}
