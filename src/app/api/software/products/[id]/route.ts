/**
 * @fileoverview Software Product API - GET/PATCH/DELETE by ID
 * @module api/software/products/[id]
 * 
 * ENDPOINTS:
 * GET    /api/software/products/[id] - Get single product
 * PATCH  /api/software/products/[id] - Update product
 * DELETE /api/software/products/[id] - Delete product
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SoftwareProduct } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/software/products/[id]
 * Get single software product details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const product = await SoftwareProduct.findById(id)
      .populate('features')
      .populate('bugs')
      .lean();
      
    if (!product) {
      return createErrorResponse('Software product not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ product });
  } catch (error) {
    console.error('GET /api/software/products/[id] error:', error);
    return createErrorResponse('Failed to fetch software product', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/software/products/[id]
 * Update software product
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const product = await SoftwareProduct.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return createErrorResponse('Software product not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Software product updated', product });
  } catch (error) {
    console.error('PATCH /api/software/products/[id] error:', error);
    return createErrorResponse('Failed to update software product', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/software/products/[id]
 * Delete software product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;
    await connectDB();

    const product = await SoftwareProduct.findByIdAndDelete(id);
    if (!product) {
      return createErrorResponse('Software product not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: 'Software product deleted' });
  } catch (error) {
    console.error('DELETE /api/software/products/[id] error:', error);
    return createErrorResponse('Failed to delete software product', ErrorCode.INTERNAL_ERROR, 500);
  }
}
