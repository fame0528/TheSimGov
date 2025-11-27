// Disabled legacy middleware - replaced by proxy.ts per Next.js 16 guidance
// This file preserves the previous middleware implementation for reference.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };

// NOTE: Do not re-enable this file. Use `proxy.ts` instead.
