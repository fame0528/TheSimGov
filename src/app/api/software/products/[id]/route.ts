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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SoftwareProduct } from '@/lib/db/models';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await SoftwareProduct.findById(id)
      .populate('features')
      .populate('bugs')
      .lean();
      
    if (!product) {
      return NextResponse.json({ error: 'Software product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('GET /api/software/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch software product' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Software product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Software product updated', product });
  } catch (error) {
    console.error('PATCH /api/software/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update software product' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const product = await SoftwareProduct.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: 'Software product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Software product deleted' });
  } catch (error) {
    console.error('DELETE /api/software/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete software product' },
      { status: 500 }
    );
  }
}
