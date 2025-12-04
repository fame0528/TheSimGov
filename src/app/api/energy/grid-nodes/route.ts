import { z } from 'zod';
import type { GridNode } from '@/types/energy';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

const QuerySchema = z.object({
  region: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parse.success) {
    const message = parse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return createErrorResponse(`Invalid query: ${message}`, ErrorCode.BAD_REQUEST, 400);
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

  return createSuccessResponse(nodes);
}
