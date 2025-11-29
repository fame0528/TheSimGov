/**
 * @fileoverview E-Commerce Products API - GET/POST endpoints
 * @module api/ecommerce/products
 * 
 * ENDPOINTS:
 * GET  /api/ecommerce/products - List product listings for company
 * POST /api/ecommerce/products - Create new product listing
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ProductListing } from '@/lib/db/models/ecommerce';

/**
 * GET /api/ecommerce/products
 * List all product listings for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = { company: companyId };
    if (category) query.category = category;
    if (isActive !== null) query.isActive = isActive === 'true';
    if (isFeatured !== null) query.isFeatured = isFeatured === 'true';

    const products = await ProductListing.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    const totalSold = products.reduce((sum, p) => sum + (p.totalSold || 0), 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;
    const avgRating = totalProducts > 0
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts
      : 0;

    return NextResponse.json({
      products,
      totalProducts,
      activeProducts,
      totalRevenue,
      totalSold,
      lowStockCount,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error('GET /api/ecommerce/products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/products
 * Create a new product listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      company,
      name,
      description,
      category,
      basePrice,
      costPerUnit,
      stockQuantity,
      variants,
      tags,
    } = body;

    if (!company || !name || !description || !category || !basePrice || !costPerUnit) {
      return NextResponse.json(
        { error: 'Company, name, description, category, basePrice, and costPerUnit are required' },
        { status: 400 }
      );
    }

    const product = await ProductListing.create({
      company,
      name,
      description,
      category,
      basePrice,
      costPerUnit,
      stockQuantity: stockQuantity || 0,
      lowStockThreshold: 10,
      variants: variants || [],
      images: [],
      tags: tags || [],
      isActive: true,
      isFeatured: false,
      totalSold: 0,
      totalRevenue: 0,
      rating: 0,
      reviewCount: 0,
    });

    return NextResponse.json(
      { message: 'Product listing created', product },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/ecommerce/products error:', error);
    return NextResponse.json(
      { error: 'Failed to create product listing' },
      { status: 500 }
    );
  }
}
