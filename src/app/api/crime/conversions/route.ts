/**
 * @fileoverview Crime Conversions API - GET /api/crime/conversions
 * @module api/crime/conversions
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db';
import ConversionHistory from '@/lib/db/models/crime/ConversionHistory';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();
    const { searchParams } = new URL(request.url);

    const facilityId = searchParams.get('facilityId') || undefined;
    const businessId = searchParams.get('businessId') || undefined;
    const substance = searchParams.get('substance') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const state = searchParams.get('state') || undefined; // from snapshot

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, unknown> = {};
    if (facilityId) query.facilityId = facilityId;
    if (businessId) query.businessId = businessId;
    if (substance) query.substance = substance;
    if (actorId) query.actorId = actorId;
    if (state) query['preSnapshot.location.state'] = state;

    const [items, total] = await Promise.all([
      ConversionHistory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ConversionHistory.countDocuments(query),
    ]);

    return createSuccessResponse(items, {
      pagination: {
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('GET /api/crime/conversions error:', error);
    return createErrorResponse('Failed to fetch conversion history', 'INTERNAL_ERROR', 500);
  }
}
