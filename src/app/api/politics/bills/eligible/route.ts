import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/utils/apiResponse';

export async function GET(_req: NextRequest) {
  return createSuccessResponse({ bills: [] });
}
