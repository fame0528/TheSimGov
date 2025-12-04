/**
 * @fileoverview Company Name Check API
 * @module app/api/companies/check-name
 * 
 * OVERVIEW:
 * Validates a proposed company name and checks for duplicates
 * within the authenticated user's companies.
 * 
 * Query: `?name=Acme%20Corp`
 * Response: `{ valid: true, exists: false }`
 * 
 * @created 2025-11-26
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Company } from '@/lib/db';
import { validateCompanyName } from '@/lib/utils/profanityFilter';

/**
 * GET /api/companies/check-name?name=...
 * 
 * Validates length and profanity, then checks for duplicates
 * scoped to the authenticated user's companies.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get('name') || '';
    const name = rawName.trim();

    // Basic length checks
    if (name.length < 3 || name.length > 50) {
      return NextResponse.json({
        valid: false,
        exists: false,
        error: 'Company name must be between 3 and 50 characters',
      });
    }

    // Profanity check
    const prof = validateCompanyName(name);
    if (!prof.isValid) {
      return NextResponse.json({
        valid: false,
        exists: false,
        error: prof.error || 'Company name contains inappropriate language',
        detected: prof.detectedWords || [],
      }, { status: 400 });
    }

    await connectDB();

    const existing = await Company.findOne({ userId: session.user.id, name }).lean();
    const exists = !!existing;

    return NextResponse.json({ valid: true, exists });
  } catch (error: any) {
    console.error('GET /api/companies/check-name error:', error);

    // Enhanced error handling for DNS/Connection issues
    if (
      error?.message?.includes('DNS SRV') ||
      error?.message?.includes('ESERVFAIL') ||
      error?.code === 'ESERVFAIL' ||
      error?.name === 'MongooseServerSelectionError'
    ) {
      return NextResponse.json({
        error: 'Database connection error. Please try again later.',
        code: 'DB_CONNECTION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
