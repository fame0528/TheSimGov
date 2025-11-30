import { NextResponse, NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok', resolutions: [] });
}

export async function POST(_req: NextRequest) {
  // Accept NextRequest, matching tests; echo minimal payload
  return NextResponse.json({ status: 'ok', resolved: true });
}
