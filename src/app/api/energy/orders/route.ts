import { z } from 'zod';
import type { TradeOrder } from '@/types/energy';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

const QuerySchema = z.object({
  companyId: z.string().uuid().optional(),
});

const CreateOrderSchema = z.object({
  companyId: z.string().uuid(),
  commodity: z.enum(['CrudeOil', 'NaturalGas', 'Electricity', 'RenewableCredit']),
  side: z.enum(['buy', 'sell']),
  quantity: z.number().positive(),
  limitPrice: z.number().positive().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return createErrorResponse(`Invalid query: ${message}`, 'BAD_REQUEST', 400);
  }

  const { companyId } = parse.data;
  const orders: TradeOrder[] = [
    {
      id: '88888888-8888-8888-8888-888888888888',
      companyId: companyId ?? '00000000-0000-0000-0000-000000000000',
      commodity: 'CrudeOil',
      side: 'buy',
      quantity: 1000,
      limitPrice: 80.00,
      status: 'open',
    },
  ];

  return createSuccessResponse(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parse = CreateOrderSchema.safeParse(body);
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return createErrorResponse(`Invalid body: ${message}`, 'BAD_REQUEST', 400);
  }

  const order: TradeOrder = {
    id: crypto.randomUUID(),
    ...parse.data,
    status: 'open',
  };

  return createSuccessResponse(order, undefined, 201);
}
