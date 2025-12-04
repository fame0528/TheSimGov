/**
 * @fileoverview Business By-Id API Route
 * @module api/business/[id]
 *
 * ENDPOINTS:
 * GET    /api/business/[id] - Fetch a single business by id
 * PATCH  /api/business/[id] - Update a business (partial)
 * DELETE /api/business/[id] - Delete a business
 */
import BusinessModel from '@/lib/db/models/business/Business';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
    // const awaitedParams = await params; // Removed unnecessary await
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();
      const business = await BusinessModel.findById(params.id).lean();
    if (!business) {
      return createErrorResponse('Not found', 'NOT_FOUND', 404);
    }
    return createSuccessResponse({ business });
  } catch (error) {
    console.error('GET /api/business/[id] error:', error);
    return createErrorResponse('Failed to fetch business', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
    // const awaitedParams = await params; // Removed unnecessary await
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();
    const body = await request.json();

    let validated: BusinessUpdateInput;
    try {
      validated = businessUpdateSchema.parse(body);
    } catch (parseError) {
      return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, parseError);
    }

    // Optimistic concurrency control
    const ifUnmodifiedSince = request.headers.get('if-unmodified-since') || validated.ifUnmodifiedSince;
    const version = validated.version;
    if (!ifUnmodifiedSince && typeof version !== 'number') {
      return createErrorResponse(
        'Precondition required: provide version or If-Unmodified-Since',
        'PRECONDITION_REQUIRED',
        428
      );
    }

    const filter: BusinessFilter = { _id: params.id };
    if (typeof version === 'number') {
      filter.__v = version;
    } else if (ifUnmodifiedSince) {
      const ts = new Date(ifUnmodifiedSince);
      if (isNaN(ts.getTime())) {
        return createErrorResponse('Invalid If-Unmodified-Since', 'VALIDATION_ERROR', 400);
      }
      filter.updatedAt = ts;
    }

    // Remove control fields from update payload - create clean update object
    const { ifUnmodifiedSince: _, version: __, ...updateData } = validated;

    const updated = await BusinessModel.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) {
      // Could be not found or version mismatch; return conflict for safety
      return createErrorResponse('Conflict: resource modified or not found', 'CONFLICT', 409);
    }
    const resp = createSuccessResponse({ business: updated });
    resp.headers.set('ETag', `W/"v${updated.__v ?? 0}"`);
    resp.headers.set('Last-Modified', new Date(updated.updatedAt).toUTCString());
    return resp;
  } catch (error) {
    console.error('PATCH /api/business/[id] error:', error);
    return createErrorResponse('Failed to update business', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
    // const awaitedParams = await params; // Removed unnecessary await
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();
    // Require concurrency token via headers for delete
    // Prefer If-Match-Version: <number> or If-Unmodified-Since: <RFC1123/ISO>
    const ifMatchVersion = _request.headers.get('if-match-version');
    const ifUnmodifiedSince = _request.headers.get('if-unmodified-since');

    if (!ifMatchVersion && !ifUnmodifiedSince) {
      return createErrorResponse(
        'Precondition required: provide If-Match-Version or If-Unmodified-Since',
        'PRECONDITION_REQUIRED',
        428
      );
    }

    const filter: BusinessFilter = { _id: params.id };
    if (ifMatchVersion) {
      const v = Number(ifMatchVersion);
      if (!Number.isFinite(v) || v < 0) {
        return createErrorResponse('Invalid If-Match-Version', 'VALIDATION_ERROR', 400);
      }
      filter.__v = v;
    } else if (ifUnmodifiedSince) {
      const ts = new Date(ifUnmodifiedSince);
      if (isNaN(ts.getTime())) {
        return createErrorResponse('Invalid If-Unmodified-Since', 'VALIDATION_ERROR', 400);
      }
      filter.updatedAt = ts;
    }

    const deleted = await BusinessModel.findOneAndDelete(filter).lean();
    if (!deleted) {
      return createErrorResponse('Conflict: resource modified or not found', 'CONFLICT', 409);
    }
    return createSuccessResponse({}, undefined, 204);
  } catch (error) {
    console.error('DELETE /api/business/[id] error:', error);
    return createErrorResponse('Failed to delete business', 'INTERNAL_ERROR', 500);
  }
}

// --- Required Imports ---
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { businessUpdateSchema } from '@/lib/validations/business';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Type inference from Zod schema
type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;

// Filter type for Mongoose queries with version control
interface BusinessFilter {
  _id: string;
  __v?: number;
  updatedAt?: Date;
}

// --- Fix params usage ---
// Remove 'awaitedParams = await params' and use 'params' directly in all handlers
