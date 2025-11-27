/**
 * @file app/api/health/route.ts
 * @description Health check endpoint
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Simple health check to verify API is running
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
