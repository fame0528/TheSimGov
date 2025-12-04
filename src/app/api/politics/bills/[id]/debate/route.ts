import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/utils/apiResponse';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return createSuccessResponse({ status: 'ok', id: params.id, action: 'debate-started' });
}
