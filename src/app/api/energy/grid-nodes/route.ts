import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError, ApiSuccess, GridNode } from '@/types/energy';

const QuerySchema = z.object({
  region: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return NextResponse.json<ApiError>({ success: false, error: `Invalid query: ${message}` }, { status: 400 });
  }

  const { region } = parse.data;
  const nodes: GridNode[] = [
    {
      id: '66666666-6666-6666-6666-666666666666',
      region: region ?? 'Central',
      demandMWh: 1200,
      supplyMWh: 1150,
    },
  ];

  return NextResponse.json<ApiSuccess<GridNode[]>>({ success: true, data: nodes }, { status: 200 });
}
