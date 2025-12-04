import { z } from 'zod';
import type { CommodityPrice } from '@/types/energy';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

const QuerySchema = z.object({
  commodity: z.enum(['CrudeOil', 'NaturalGas', 'Electricity', 'RenewableCredit']).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return createErrorResponse(`Invalid query: ${message}`, 'BAD_REQUEST', 400);
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

  return createSuccessResponse(prices);
}
