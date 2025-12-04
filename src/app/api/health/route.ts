/**
 * @fileoverview Health Check API
 * @module app/api/health
 *
 * GET /api/health - Check system health including database
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'unknown',
    auth: {
      secretConfigured: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
      urlConfigured: !!process.env.NEXTAUTH_URL,
    },
  };

  // Test database connection
  try {
    await connectDB();
    checks.database = 'connected';
  } catch (error) {
    checks.database = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    checks.status = 'degraded';
  }

  return NextResponse.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
  });
}
