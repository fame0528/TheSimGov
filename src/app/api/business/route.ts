/**
 * @fileoverview Business API Route
 * @module api/business
 *
 * ENDPOINTS:
 * GET  /api/business   - List businesses with filtering and pagination
 * POST /api/business   - Create a new business
 *
 * Pattern: Uses auth(), connectDB(), Zod validation, and consistent JSON errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Business } from '@/lib/db/models';
import { businessCreateSchema } from '@/lib/validations/business';
import { handleIdempotent } from '@/lib/utils/idempotency';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const ownerId = searchParams.get('ownerId') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, unknown> = {};
    if (ownerId) query.ownerId = ownerId;
    if (companyId) query.companyId = companyId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (state) query['address.state'] = state;
    if (city) query['address.city'] = city;

    const [items, total] = await Promise.all([
      Business.find(query).skip(skip).limit(limit).lean(),
      Business.countDocuments(query),
    ]);

    return createSuccessResponse(
      { businesses: items },
      {
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    console.error('GET /api/business error:', error);
    return createErrorResponse('Failed to fetch businesses', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    return handleIdempotent(request, session.user.id, async () => {
      await connectDB();

      const body = await request.json();

      let validated;
      try {
        validated = businessCreateSchema.parse(body);
      } catch (parseError) {
        return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, parseError);
      }

      // Prevent duplicate by (name, ownerId) per index
      const existing = await Business.findOne({ name: validated.name, ownerId: validated.ownerId });
      if (existing) {
        return createErrorResponse('Business already exists for owner', 'DUPLICATE_ERROR', 409);
      }

      const created = await Business.create(validated);
      const resp = createSuccessResponse({ message: 'Business created', business: created }, undefined, 201);
      resp.headers.set('ETag', `W/"v${created.__v ?? 0}"`);
      resp.headers.set('Last-Modified', new Date(created.updatedAt || created.createdAt).toUTCString());
      return resp;
    }, { scope: 'business:create' });
  } catch (error) {
    console.error('POST /api/business error:', error);
    return createErrorResponse('Failed to create business', 'INTERNAL_ERROR', 500);
  }
}
