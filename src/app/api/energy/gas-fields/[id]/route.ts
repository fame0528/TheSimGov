/**
 * @fileoverview Gas Field Operations API - Get/Update/Delete
 * @module api/energy/gas-fields/[id]
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { GasField } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const field = await GasField.findById(id).lean();
    if (!field) {
      return createErrorResponse('Gas field not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ field });
  } catch (error) {
    console.error('GET /api/energy/gas-fields/[id] error:', error);
    return createErrorResponse('Failed to fetch gas field', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const field = await GasField.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!field) {
      return createErrorResponse('Gas field not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Gas field updated', field });
  } catch (error) {
    console.error('PATCH /api/energy/gas-fields/[id] error:', error);
    return createErrorResponse('Failed to update gas field', ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const field = await GasField.findByIdAndDelete(id);
    if (!field) {
      return createErrorResponse('Gas field not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Gas field deleted' });
  } catch (error) {
    console.error('DELETE /api/energy/gas-fields/[id] error:', error);
    return createErrorResponse('Failed to delete gas field', ErrorCode.INTERNAL_ERROR, 500);
  }
}
