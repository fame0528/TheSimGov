/**
 * @file app/api/manufacturing/suppliers/route.ts
 * @description Manufacturing Suppliers API (GET list, POST create)
 * @created 2025-11-13
 *
 * OVERVIEW:
 * RESTful API for managing supplier vendor relationships. Secured via NextAuth.
 * Supports filtering by tier, category, status, performance tier, preferred status,
 * minimum score, and country. Enables supplier scorecarding and risk assessment.
 *
 * CONTRACT:
 * GET /api/manufacturing/suppliers
 *   Query: tier?, category?, status?, performanceTier?, preferredOnly?=true|false,
 *          minScore?=0..100, country?, limit?=1..100, skip?=0..,
 *          sortBy?, sortOrder?=asc|desc
 *   200: { suppliers, total, limit, skip }
 *   401: { error }
 *   404: { error }
 *
 * POST /api/manufacturing/suppliers
 *   Body: { name, supplierCode, tier, category, contactPerson, email, phone,
 *           address, city, state, country, ...optional }
 *   201: { supplier, message }
 *   400/401/404/409/500: { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import Supplier from '@/lib/db/models/Supplier';
import { supplierQuerySchema, createSupplierSchema } from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/suppliers
 * 
 * Retrieve suppliers for the authenticated user's company.
 * Supports filtering by tier, category, status, performance metrics, etc.
 * 
 * @param request - Next.js request object with query parameters
 * @returns JSON response with suppliers array and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user's company
    const company = await Company.findOne({ owner: session.user.id }).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const qp = {
      tier: searchParams.get('tier') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      performanceTier: searchParams.get('performanceTier') || undefined,
      preferredOnly: searchParams.get('preferredOnly') || undefined,
      minScore: searchParams.get('minScore')
        ? parseFloat(searchParams.get('minScore')!)
        : undefined,
      country: searchParams.get('country') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      skip: searchParams.get('skip') ? parseInt(searchParams.get('skip')!, 10) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    } as any;

    const params = supplierQuerySchema.parse(qp);

    // Build filter
    const filter: Record<string, unknown> = { company: company._id };
    if (params.tier) filter['tier'] = params.tier;
    if (params.category) filter['category'] = params.category;
    if (params.status) filter['status'] = params.status;
    if (params.performanceTier) filter['performanceTier'] = params.performanceTier;
    if (params.preferredOnly === true) filter['preferredSupplier'] = true;
    if (typeof params.minScore === 'number') {
      filter['overallScore'] = { $gte: params.minScore };
    }
    if (params.country) filter['country'] = params.country;

    // Sort
    const sort: Record<string, 1 | -1> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort(sort)
        .limit(params.limit)
        .skip(params.skip)
        .lean(),
      Supplier.countDocuments(filter),
    ]);

    return NextResponse.json({
      suppliers,
      total,
      limit: params.limit,
      skip: params.skip,
    });
  } catch (error) {
    console.error('GET /api/manufacturing/suppliers error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/suppliers
 * 
 * Create a new supplier for the authenticated user's company.
 * Validates supplier code uniqueness per company.
 * 
 * @param request - Next.js request object with JSON body
 * @returns JSON response with created supplier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Company must exist
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createSupplierSchema.parse(body);

    // Create supplier (model provides defaults for performance metrics)
    const supplier = await Supplier.create({
      company: company._id,
      name: data.name,
      supplierCode: data.supplierCode,
      tier: data.tier,
      category: data.category,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      website: data.website ?? undefined,
      // Performance metrics (optional overrides)
      onTimeDeliveryRate: data.onTimeDeliveryRate ?? 90,
      qualityRating: data.qualityRating ?? 80,
      priceCompetitiveness: data.priceCompetitiveness ?? 75,
      responsiveness: data.responsiveness ?? 80,
      averageLeadTime: data.averageLeadTime ?? 14,
      paymentTerms: data.paymentTerms ?? 'Net30',
      currency: data.currency ?? 'USD',
      preferredSupplier: data.preferredSupplier ?? false,
      certifications: data.certifications ?? [],
    });

    const supplierObj = supplier.toObject({ virtuals: true });

    return NextResponse.json(
      { supplier: supplierObj, message: 'Supplier created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/manufacturing/suppliers error:', error);

    // Zod validation
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }

    // Mongoose validation / duplicate supplier code
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Supplier code already exists for this company' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
