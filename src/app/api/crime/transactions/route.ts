import { NextResponse } from "next/server";
import { transactionPurchaseSchema, responseEnvelope } from "@/lib/validations/crime";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const status = url.searchParams.get("status");
  return NextResponse.json({ success: true, data: [], error: null, meta: { userId, status } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = transactionPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: parsed.error.message, meta: null }, { status: 422 });
  }
  const created = {
    id: "mock-transaction-id",
    deliveryStatus: "Scheduled",
    escrowStatus: "Pending",
    totalPrice: 0,
    ...parsed.data,
  };
  return NextResponse.json(responseEnvelope<any>(transactionPurchaseSchema).parse({ success: true, data: created, error: null, meta: {} }));
}
