/**
 * @file src/app/api/ecommerce/products/route.ts
 * @description Product listing API endpoints for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * RESTful API for product catalog management with comprehensive filtering,
 * search, sorting, and pagination capabilities. Supports CRUD operations
 * with company ownership validation and full-text search on name/tags.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/products - List/filter/search products
 * - POST /api/ecommerce/products - Create new product
 * - PUT /api/ecommerce/products - Update existing product
 * - DELETE /api/ecommerce/products - Delete product
 * 
 * QUERY PARAMETERS (GET):
 * - companyId: Filter by company (required)
 * - category: Filter by category
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - minRating: Minimum rating filter
 * - inStock: Filter by stock availability (true/false)
 * - isActive: Filter by active status (true/false)
 * - isFeatured: Filter by featured status (true/false)
 * - search: Full-text search on name/tags
 * - sortBy: Sort field (price, rating, createdAt, totalSold)
 * - sortOrder: Sort direction (asc, desc)
 * - limit: Results per page (default 20, max 100)
 * - skip: Pagination offset (default 0)
 * 
 * USAGE:
 * ```typescript
 * // List all active products in Electronics category
 * GET /api/ecommerce/products?companyId=123&category=Electronics&isActive=true
 * 
 * // Search for "laptop" sorted by rating
 * GET /api/ecommerce/products?companyId=123&search=laptop&sortBy=rating&sortOrder=desc
 * 
 * // Create new product
 * POST /api/ecommerce/products
 * Body: { companyId, name, description, category, basePrice, costPerUnit, ... }
 * 
 * // Update product
 * PUT /api/ecommerce/products
 * Body: { productId, updates: { basePrice: 99.99, salePrice: 79.99 } }
 * 
 * // Delete product
 * DELETE /api/ecommerce/products?productId=456
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import ProductListing from '@/lib/db/models/ProductListing';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/ecommerce/products
 * List and filter products with pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: { [key: string]: unknown } = { company: companyId };

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      filter.category = category;
    }

    // Price range filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      const priceFilter: { $gte?: number; $lte?: number } = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      filter.basePrice = priceFilter;
    }

    // Rating filter
    const minRating = searchParams.get('minRating');
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Stock filter
    const inStock = searchParams.get('inStock');
    if (inStock === 'true') {
      filter.stockQuantity = { $gt: 0 };
    } else if (inStock === 'false') {
      filter.stockQuantity = 0;
    }

    // Active status filter
    const isActive = searchParams.get('isActive');
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    // Featured filter
    const isFeatured = searchParams.get('isFeatured');
    if (isFeatured === 'true') {
      filter.isFeatured = true;
    }

    // Full-text search
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder };

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    // Execute query
    const products = await ProductListing.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('company', 'name');

    // Get total count for pagination
    const total = await ProductListing.countDocuments(filter);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/products
 * Create new product listing
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const {
      companyId,
      name,
      description,
      category,
      basePrice,
      salePrice,
      costPerUnit,
      stockQuantity,
      lowStockThreshold,
      variants,
      images,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      isActive,
      isFeatured,
    } = body;

    // Validate required fields
    if (!companyId || !name || !description || !category || !basePrice || costPerUnit === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, name, description, category, basePrice, costPerUnit' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create product
    const product = await ProductListing.create({
      company: companyId,
      name,
      description,
      category,
      basePrice,
      salePrice,
      costPerUnit,
      stockQuantity: stockQuantity || 0,
      lowStockThreshold: lowStockThreshold || 10,
      variants: variants || [],
      images: images || [],
      tags: tags || [],
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywords || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
    });

    return NextResponse.json({
      success: true,
      product,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ecommerce/products
 * Update existing product
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const body = await request.json();
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json(
        { error: 'Product ID and updates are required' },
        { status: 400 }
      );
    }

    // Find product
    const product = await ProductListing.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(product.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Update product
    Object.assign(product, updates);
    await product.save();

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/products
 * Delete product listing
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production

    const { searchParams } = request.nextUrl;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Find and delete product
    const product = await ProductListing.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(product.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await ProductListing.findByIdAndDelete(productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
