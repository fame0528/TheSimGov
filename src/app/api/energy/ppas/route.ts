import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError, ApiSuccess, PPA } from '@/types/energy';

const QuerySchema = z.object({
  companyId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return NextResponse.json<ApiError>({ success: false, error: `Invalid query: ${message}` }, { status: 400 });
  }

  const { companyId } = parse.data;
  const ppas: PPA[] = [
    {
      id: '99999999-9999-9999-9999-999999999999',
      buyerCompanyId: companyId ?? '00000000-0000-0000-0000-000000000000',
      sellerCompanyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      quantityMWh: 5000,
      pricePerMWh: 45.00,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    },
  ];

  return NextResponse.json<ApiSuccess<PPA[]>>({ success: true, data: ppas }, { status: 200 });
}
