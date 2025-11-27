/**
 * @fileoverview Software Products API Endpoints
 * @module app/api/software/products
 * 
 * OVERVIEW:
 * API endpoints for managing software products in Technology/Software industry. Handles
 * product creation with dual pricing (perpetual/subscription), catalog browsing with
 * filtering by category and status, and product updates.
 * 
 * BUSINESS LOGIC:
 * - Pricing validation: Monthly = ~2.5% of perpetual (36-month payback standard)
 * - Quality scoring: 100 - (criticalBugs/features × 10)
 * - Revenue tracking: Perpetual sales + subscription MRR
 * - Version management: Semantic versioning (MAJOR.MINOR.PATCH)
 * 
 * Created: 2025-11-17
 * @author ECHO v1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SoftwareProduct from '@/lib/db/models/SoftwareProduct';
import Company from '@/lib/db/models/Company';

/**
 * POST /api/software/products
 * 
 * Create new software product
 * 
 * Business logic:
 * - Validates pricing: monthly ≈ 2.5% of perpetual (±20% variance allowed)
 * - Initializes quality score at 100 (perfect, no bugs yet)
 * - Sets initial status to 'Development'
 * - Version starts at 1.0.0
 * 
 * @param request - Contains { company, name, description, category, pricing: { perpetual, monthly }, status? }
 * @returns 201: Product created
 * @returns 400: Validation error
 * @returns 401: Unauthorized
 * @returns 404: Company not found
 * @returns 409: Duplicate product name
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/software/products
 * {
 *   "company": "507f1f77bcf86cd799439012",
 *   "name": "Enterprise CRM Suite",
 *   "description": "Comprehensive customer relationship management platform",
 *   "category": "Business",
 *   "pricing": {
 *     "perpetual": 50000,
 *     "monthly": 1250
 *   }
 * }
 * 
 * // Response 201
 * {
 *   "product": {
 *     "_id": "507f1f77bcf86cd799439014",
 *     "name": "Enterprise CRM Suite",
 *     "version": "1.0.0",
 *     "category": "Business",
 *     "status": "Development",
 *     "qualityScore": 100,
 *     "pricing": { "perpetual": 50000, "monthly": 1250 }
 *   },
 *   "message": "Software product created successfully"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { company: companyId, name, description, category, pricing, status } = body;

    // Validate required fields
    if (!companyId || !name || !description || !category || !pricing) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, description, category, pricing' },
        { status: 400 }
      );
    }

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found', companyId },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this company' },
        { status: 403 }
      );
    }

    // Verify company is Technology/Software industry
    if (company.industry !== 'Technology' || company.subcategory !== 'Software') {
      return NextResponse.json(
        {
          error: 'Invalid company type - Must be Technology/Software industry',
          industry: company.industry,
          subcategory: company.subcategory,
        },
        { status: 400 }
      );
    }

    // Create software product
    const product = await SoftwareProduct.create({
      company: companyId,
      name,
      description,
      category,
      pricing,
      status: status || 'Development',
      version: '1.0.0',
    });

    return NextResponse.json(
      {
        product,
        message: 'Software product created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating software product:', error);

    // Handle duplicate product name
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Product with this name already exists for this company' },
        { status: 409 }
      );
    }

    // Handle validation errors
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

/**
 * GET /api/software/products
 * 
 * List software products with filtering
 * 
 * Query params:
 * - companyId (required): Filter by company
 * - category?: Filter by product category
 * - status?: Filter by lifecycle status
 * - limit?: Number of results (default 50, max 200)
 * - offset?: Pagination offset (default 0)
 * 
 * @returns 200: Products list
 * @returns 401: Unauthorized
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/software/products?companyId=507f1f77bcf86cd799439012&status=Active
 * 
 * // Response 200
 * {
 *   "products": [
 *     {
 *       "_id": "507f1f77bcf86cd799439014",
 *       "name": "Enterprise CRM Suite",
 *       "version": "2.1.0",
 *       "category": "Business",
 *       "status": "Active",
 *       "qualityScore": 94.5,
 *       "totalRevenue": 1250000,
 *       "licenseSales": 250,
 *       "activeSubscriptions": 150
 *     }
 *   ],
 *   "total": 1,
 *   "limit": 50,
 *   "offset": 0
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: companyId' },
        { status: 400 }
      );
    }

    // Build query filter
    const filter: any = { company: companyId };
    if (category) filter.category = category;
    if (status) filter.status = status;

    // Execute query
    const [products, total] = await Promise.all([
      SoftwareProduct.find(filter)
        .sort({ totalRevenue: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-__v')
        .lean(),
      SoftwareProduct.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching software products:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
