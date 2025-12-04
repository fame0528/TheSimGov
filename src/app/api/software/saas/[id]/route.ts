/**
 * @fileoverview SaaS Subscription API - GET/PATCH/DELETE by ID
 * @module api/software/saas/[id]
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SaaSSubscription } from '@/lib/db/models';
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

    const subscription = await SaaSSubscription.findById(id)
      .populate('product')
      .lean();
      
    if (!subscription) {
      return createErrorResponse('Subscription not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ subscription });
  } catch (error) {
    console.error('GET /api/software/saas/[id] error:', error);
    return createErrorResponse('Failed to fetch subscription', ErrorCode.INTERNAL_ERROR, 500);
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
    
    // Handle deactivation
    if (body.active === false) {
      body.updatedAt = new Date();
    }
    
    const subscription = await SaaSSubscription.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return createErrorResponse('Subscription not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Subscription updated', subscription });
  } catch (error) {
    console.error('PATCH /api/software/saas/[id] error:', error);
    return createErrorResponse('Failed to update subscription', ErrorCode.INTERNAL_ERROR, 500);
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

    const subscription = await SaaSSubscription.findByIdAndDelete(id);
    if (!subscription) {
      return createErrorResponse('Subscription not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Subscription deleted' });
  } catch (error) {
    console.error('DELETE /api/software/saas/[id] error:', error);
    return createErrorResponse('Failed to delete subscription', ErrorCode.INTERNAL_ERROR, 500);
  }
}
