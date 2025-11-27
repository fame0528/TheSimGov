/**
 * @fileoverview Software Product Update API
 * @module app/api/software/products/[id]
 * 
 * OVERVIEW:
 * API endpoint for updating software product details including pricing, status lifecycle
 * transitions, and version updates.
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SoftwareProduct from '@/lib/db/models/SoftwareProduct';

/**
 * PATCH /api/software/products/[id]
 * 
 * Update software product
 * 
 * @param request - Contains { pricing?, status?, version? }
 * @returns 200: Product updated
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 403: Forbidden
 * @returns 404: Product not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const productId = (await params).id;
    const body = await request.json();

    // Find product and verify ownership
    const product = await SoftwareProduct.findById(productId).populate<{ company: any }>('company');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', productId },
        { status: 404 }
      );
    }

    if (product.company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this product' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const { pricing, status, version } = body;

    if (pricing) product.pricing = pricing;
    if (status) product.status = status;
    if (version) {
      // Validate semantic versioning
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        return NextResponse.json(
          { error: 'Invalid version format - Must follow semantic versioning (e.g., 2.1.0)' },
          { status: 400 }
        );
      }
      product.version = version;
    }

    await product.save();

    return NextResponse.json({
      product,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating software product:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
