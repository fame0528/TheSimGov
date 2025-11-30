import { NextResponse, NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ elections: [] });
}
