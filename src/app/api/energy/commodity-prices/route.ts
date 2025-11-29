import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError, ApiSuccess, CommodityPrice } from '@/types/energy';

const QuerySchema = z.object({
  commodity: z.enum(['CrudeOil', 'NaturalGas', 'Electricity', 'RenewableCredit']).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return NextResponse.json<ApiError>({ success: false, error: `Invalid query: ${message}` }, { status: 400 });
  }

  const { commodity } = parse.data;
  const prices: CommodityPrice[] = [
    {
      id: '77777777-7777-7777-7777-777777777777',
      commodity: commodity ?? 'CrudeOil',
      currency: 'USD',
      price: 82.50,
      timestamp: new Date().toISOString(),
    },
  ];

  return NextResponse.json<ApiSuccess<CommodityPrice[]>>({ success: true, data: prices }, { status: 200 });
}
