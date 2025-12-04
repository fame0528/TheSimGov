/**
 * @fileoverview Manufacturing Suppliers API Route
 * @module api/manufacturing/suppliers
 * 
 * ENDPOINTS:
 * GET  /api/manufacturing/suppliers - List suppliers with filtering and pagination
 * POST /api/manufacturing/suppliers - Create new supplier
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ManufacturingSupplier } from '@/lib/db/models/manufacturing';
import { 
  supplierQuerySchema, 
  createSupplierSchema,
  type SupplierQueryInput 
} from '@/lib/validations/manufacturing';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

/**
 * GET /api/manufacturing/suppliers
 * List suppliers with filtering, pagination, and sorting
 * 
 * Query Parameters:
 * - type: Filter by supplier type
 * - tier: Filter by supplier tier
 * - status: Filter by status
 * - riskLevel: Filter by risk level
 * - active: Filter by active status
 * - minScore/maxScore: Filter by overall score range
 * - limit/skip: Pagination
 * - sortBy/sortOrder: Sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (!companyId) {
      return createErrorResponse('Company ID required', 'BAD_REQUEST', 400);
    }

    // Parse and validate query parameters
    let queryParams: SupplierQueryInput;
    try {
      const obj = Object.fromEntries(searchParams.entries());
      queryParams = supplierQuerySchema.parse(obj);
    } catch (parseError) {
      return createErrorResponse('Invalid query parameters', 'BAD_REQUEST', 400);
    }

    // Build MongoDB query
    const query: Record<string, unknown> = { company: companyId };

    // Type filters
    if (queryParams.type) {
      query.type = queryParams.type;
    }
    if (queryParams.tier) {
      query.tier = queryParams.tier;
    }
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    if (queryParams.riskLevel) {
      query['risk.level'] = queryParams.riskLevel;
    }
    if (queryParams.active !== undefined) {
      query.active = queryParams.active;
    }
    if (queryParams.strategicPartner !== undefined) {
      query.strategicPartner = queryParams.strategicPartner;
    }

    // Range filters
    if (queryParams.minScore !== undefined || queryParams.maxScore !== undefined) {
      query['scorecard.overallScore'] = {};
      if (queryParams.minScore !== undefined) {
        (query['scorecard.overallScore'] as Record<string, number>)['$gte'] = queryParams.minScore;
      }
      if (queryParams.maxScore !== undefined) {
        (query['scorecard.overallScore'] as Record<string, number>)['$lte'] = queryParams.maxScore;
      }
    }

    if (queryParams.minDeliveryRate !== undefined) {
      query['performance.onTimeDeliveryRate'] = { $gte: queryParams.minDeliveryRate };
    }

    // Location filters
    if (queryParams.region) {
      query.region = { $regex: queryParams.region, $options: 'i' };
    }
    if (queryParams.country) {
      query['contact.address.country'] = { $regex: queryParams.country, $options: 'i' };
    }

    // Build sort object
    const sortField = queryParams.sortBy === 'overallScore' ? 'scorecard.overallScore' :
                     queryParams.sortBy === 'qualityScore' ? 'scorecard.qualityScore' :
                     queryParams.sortBy === 'deliveryScore' ? 'scorecard.deliveryScore' :
                     queryParams.sortBy === 'onTimeDeliveryRate' ? 'performance.onTimeDeliveryRate' :
                     queryParams.sortBy === 'annualSpend' ? 'financials.annualSpend' :
                     queryParams.sortBy === 'riskLevel' ? 'risk.level' :
                     queryParams.sortBy;
    
    const sort: Record<string, 1 | -1> = { 
      [sortField]: queryParams.sortOrder === 'asc' ? 1 : -1 
    };

    // Execute query with pagination
    const [suppliers, totalCount] = await Promise.all([
      ManufacturingSupplier.find(query)
        .sort(sort)
        .skip(queryParams.skip)
        .limit(queryParams.limit)
        .lean(),
      ManufacturingSupplier.countDocuments(query),
    ]);

    // Calculate summary metrics
    const summary = await ManufacturingSupplier.aggregate([
      { $match: { company: companyId, active: true } },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          avgOverallScore: { $avg: '$scorecard.overallScore' },
          avgQualityScore: { $avg: '$scorecard.qualityScore' },
          avgDeliveryScore: { $avg: '$scorecard.deliveryScore' },
          avgOnTimeRate: { $avg: '$performance.onTimeDeliveryRate' },
          totalAnnualSpend: { $sum: '$financials.annualSpend' },
          strategicPartners: { $sum: { $cond: ['$strategicPartner', 1, 0] } },
        },
      },
    ]);

    // Count by tier
    const tierBreakdown = await ManufacturingSupplier.aggregate([
      { $match: { company: companyId, active: true } },
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]);

    return createSuccessResponse({
      suppliers,
      pagination: {
        total: totalCount,
        limit: queryParams.limit,
        skip: queryParams.skip,
        pages: Math.ceil(totalCount / queryParams.limit),
      },
      summary: {
        ...(summary[0] || {
          totalSuppliers: 0,
          avgOverallScore: 0,
          avgQualityScore: 0,
          avgDeliveryScore: 0,
          avgOnTimeRate: 0,
          totalAnnualSpend: 0,
          strategicPartners: 0,
        }),
        tierBreakdown: tierBreakdown.reduce(
          (acc: Record<string, number>, t: { _id: string; count: number }) => {
            acc[t._id] = t.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error('GET /api/manufacturing/suppliers error:', error);
    return createErrorResponse('Failed to fetch suppliers', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/manufacturing/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await connectDB();

    const body = await request.json();
    const { company } = body;

    if (!company) {
      return createErrorResponse('Company ID required', 'BAD_REQUEST', 400);
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = createSupplierSchema.parse(body);
    } catch (parseError) {
      return createErrorResponse('Validation failed', 'BAD_REQUEST', 400);
    }

    // Check for duplicate supplier code
    const existingSupplier = await ManufacturingSupplier.findOne({
      company,
      code: validatedData.code,
    });

    if (existingSupplier) {
      return createErrorResponse('Supplier with this code already exists', 'CONFLICT', 409);
    }

    // Create supplier with validated data
    const supplier = await ManufacturingSupplier.create({
      company,
      name: validatedData.name,
      code: validatedData.code,
      type: validatedData.type,
      tier: validatedData.tier,
      region: validatedData.region || validatedData.address.country,
      timezone: validatedData.timezone || 'UTC',
      contact: {
        name: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
      },
      performance: {
        onTimeDeliveryRate: 85, // Default starting performance
        orderFillRate: 90,
        defectRate: 2,
        averageLeadTime: validatedData.leadTime,
        leadTimeVariability: 10,
        responseTime: 24,
      },
      scorecard: {
        qualityScore: 75,
        deliveryScore: 80,
        costScore: 70,
        responseScore: 75,
        flexibilityScore: 70,
        overallScore: 74, // Weighted average
        trend: 'Stable',
        lastEvaluation: new Date(),
      },
      financials: {
        annualSpend: 0,
        averageOrderValue: 0,
        paymentTerms: validatedData.paymentTerms,
        discountRate: 0,
        creditLimit: validatedData.creditLimit,
        currentBalance: 0,
      },
      contract: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenewal: true,
        minOrderQuantity: validatedData.minOrderQuantity,
        minOrderValue: validatedData.minOrderValue,
        exclusiveAgreement: false,
        priceAdjustmentClause: false,
      },
      risk: {
        level: 'Medium',
        factors: [],
        mitigationPlan: '',
        lastAssessment: new Date(),
        financialHealth: 70,
        geopoliticalRisk: 30,
        singleSourceRisk: false,
        complianceRisk: 20,
      },
      certifications: validatedData.certifications,
      status: 'Active',
      active: true,
      strategicPartner: false,
    });

    return createSuccessResponse({ 
      message: 'Supplier created successfully', 
      supplier,
    }, undefined, 201);
  } catch (error) {
    console.error('POST /api/manufacturing/suppliers error:', error);
    return createErrorResponse('Failed to create supplier', 'INTERNAL_ERROR', 500);
  }
}
