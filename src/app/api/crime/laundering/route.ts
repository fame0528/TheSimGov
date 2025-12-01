import { NextResponse } from "next/server";
import { launderingChannelCreateSchema } from "@/lib/validations/crime";
import { auth } from "@/auth";
import { connectDB, LaunderingChannel } from "@/lib/db";
import { mapLaunderingChannelDoc } from "@/lib/dto/crimeAdapters";

// GET /api/crime/laundering?method
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const url = new URL(request.url);
  const method = url.searchParams.get("method");
  try {
    await connectDB();
    const query: any = { ownerId: session.user.id };
    if (method) query.method = method;
    const channels = await LaunderingChannel.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: channels.map(mapLaunderingChannelDoc), error: null, meta: { count: channels.length, method } });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: true, data: [], error: null, meta: { warning: 'DB DNS error fallback', method } });
    }
    console.error('GET /crime/laundering error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}

// POST /api/crime/laundering
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, data: null, error: 'Unauthorized', meta: null }, { status: 401 });
  }
  const body = await request.json();
  const parsed = launderingChannelCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  try {
    await connectDB();
    const { ownerId: _ownerId, ...channelData } = parsed.data;
    const doc = await LaunderingChannel.create({ ownerId: session.user.id, ...channelData });
    return NextResponse.json({ success: true, data: mapLaunderingChannelDoc(doc), error: null, meta: {} }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || '';
    const isSrv = message.includes('querySrv');
    if (isSrv) {
      return NextResponse.json({ success: false, data: null, error: 'Service unavailable (DB DNS error)', meta: { fallback: true } }, { status: 503 });
    }
    console.error('POST /crime/laundering error', err);
    return NextResponse.json({ success: false, data: null, error: 'Internal server error', meta: null }, { status: 500 });
  }
}
