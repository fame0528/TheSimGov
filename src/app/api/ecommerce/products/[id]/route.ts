/**
 * @fileoverview E-Commerce Product API - GET/PATCH/DELETE by ID
 * @module api/ecommerce/products/[id]
 * 
 * ENDPOINTS:
 * GET    /api/ecommerce/products/[id] - Get single product listing
 * PATCH  /api/ecommerce/products/[id] - Update product listing
 * DELETE /api/ecommerce/products/[id] - Delete product listing
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ProductListing } from '@/lib/db/models/ecommerce';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ecommerce/products/[id]
 * Get single product listing details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await ProductListing.findById(id).lean();
      
    if (!product) {
      return NextResponse.json({ error: 'Product listing not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('GET /api/ecommerce/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product listing' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ecommerce/products/[id]
 * Update product listing
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await request.json();
    
    const product = await ProductListing.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product listing not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product listing updated', product });
  } catch (error) {
    console.error('PATCH /api/ecommerce/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update product listing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/products/[id]
 * Delete product listing
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await ProductListing.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product listing not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product listing deleted' });
  } catch (error) {
    console.error('DELETE /api/ecommerce/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product listing' },
      { status: 500 }
    );
  }
}
