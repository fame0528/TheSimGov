import { NextResponse, NextRequest } from 'next/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return NextResponse.json({ status: 'ok', id: params.id, action: 'lobby' });
}
