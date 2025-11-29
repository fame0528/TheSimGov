/**
 * @fileoverview Manufacturing Facilities API Route
 * @module api/manufacturing/facilities
 * 
 * ENDPOINTS:
 * GET  /api/manufacturing/facilities - List facilities with filtering and pagination
 * POST /api/manufacturing/facilities - Create new manufacturing facility
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ManufacturingFacility } from '@/lib/db/models/manufacturing';
import { 
  facilityQuerySchema, 
  createFacilitySchema,
  type FacilityQueryInput 
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/facilities
 * List manufacturing facilities with filtering, pagination, and sorting
 * 
 * Query Parameters:
 * - facilityType: Filter by facility type
 * - automationLevel: Filter by automation level
 * - status: Filter by operational status
 * - active: Filter by active status (true/false)
 * - minOee/maxOee: Filter by OEE score range
 * - limit/skip: Pagination
 * - sortBy/sortOrder: Sorting
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

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Parse and validate query parameters
    let queryParams: FacilityQueryInput;
    try {
      const obj = Object.fromEntries(searchParams.entries());
      queryParams = facilityQuerySchema.parse(obj);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseError },
        { status: 400 }
      );
    }

    // Build MongoDB query
    const query: Record<string, unknown> = { company: companyId };

    // Type filters
    if (queryParams.facilityType) {
      query.facilityType = queryParams.facilityType;
    }
    if (queryParams.automationLevel) {
      query.automationLevel = queryParams.automationLevel;
    }
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    if (queryParams.active !== undefined) {
      query.active = queryParams.active;
    }
    if (queryParams.isoCompliant !== undefined) {
      query['compliance.isoCompliant'] = queryParams.isoCompliant;
    }

    // Range filters
    if (queryParams.minOee !== undefined || queryParams.maxOee !== undefined) {
      query['metrics.oeeScore'] = {};
      if (queryParams.minOee !== undefined) {
        (query['metrics.oeeScore'] as Record<string, number>)['$gte'] = queryParams.minOee;
      }
      if (queryParams.maxOee !== undefined) {
        (query['metrics.oeeScore'] as Record<string, number>)['$lte'] = queryParams.maxOee;
      }
    }

    if (queryParams.minCapacity !== undefined || queryParams.maxCapacity !== undefined) {
      query.maxCapacity = {};
      if (queryParams.minCapacity !== undefined) {
        (query.maxCapacity as Record<string, number>)['$gte'] = queryParams.minCapacity;
      }
      if (queryParams.maxCapacity !== undefined) {
        (query.maxCapacity as Record<string, number>)['$lte'] = queryParams.maxCapacity;
      }
    }

    if (queryParams.minUtilization !== undefined || queryParams.maxUtilization !== undefined) {
      query['metrics.capacityUtilization'] = {};
      if (queryParams.minUtilization !== undefined) {
        (query['metrics.capacityUtilization'] as Record<string, number>)['$gte'] = queryParams.minUtilization;
      }
      if (queryParams.maxUtilization !== undefined) {
        (query['metrics.capacityUtilization'] as Record<string, number>)['$lte'] = queryParams.maxUtilization;
      }
    }

    // Build sort object
    const sortField = queryParams.sortBy === 'oeeScore' ? 'metrics.oeeScore' :
                     queryParams.sortBy === 'capacityUtilization' ? 'metrics.capacityUtilization' :
                     queryParams.sortBy === 'totalEmployees' ? 'workforce.totalEmployees' :
                     queryParams.sortBy === 'monthlyRevenue' ? 'financials.monthlyRevenue' :
                     queryParams.sortBy === 'profitMargin' ? 'financials.profitMargin' :
                     queryParams.sortBy;
    
    const sort: Record<string, 1 | -1> = { 
      [sortField]: queryParams.sortOrder === 'asc' ? 1 : -1 
    };

    // Execute query with pagination
    const [facilities, totalCount] = await Promise.all([
      ManufacturingFacility.find(query)
        .sort(sort)
        .skip(queryParams.skip)
        .limit(queryParams.limit)
        .lean(),
      ManufacturingFacility.countDocuments(query),
    ]);

    // Calculate summary metrics
    const summary = await ManufacturingFacility.aggregate([
      { $match: { company: companyId, active: true } },
      {
        $group: {
          _id: null,
          totalFacilities: { $sum: 1 },
          avgOee: { $avg: '$metrics.oeeScore' },
          avgUtilization: { $avg: '$metrics.capacityUtilization' },
          totalCapacity: { $sum: '$maxCapacity' },
          totalEmployees: { $sum: '$workforce.totalEmployees' },
          totalMonthlyRevenue: { $sum: '$financials.monthlyRevenue' },
        },
      },
    ]);

    return NextResponse.json({
      facilities,
      pagination: {
        total: totalCount,
        limit: queryParams.limit,
        skip: queryParams.skip,
        pages: Math.ceil(totalCount / queryParams.limit),
      },
      summary: summary[0] || {
        totalFacilities: 0,
        avgOee: 0,
        avgUtilization: 0,
        totalCapacity: 0,
        totalEmployees: 0,
        totalMonthlyRevenue: 0,
      },
    });
  } catch (error) {
    console.error('GET /api/manufacturing/facilities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manufacturing/facilities
 * Create a new manufacturing facility
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { company } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = createFacilitySchema.parse(body);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseError },
        { status: 400 }
      );
    }

    // Check for duplicate facility code
    const existingFacility = await ManufacturingFacility.findOne({
      company,
      facilityCode: validatedData.facilityCode,
    });

    if (existingFacility) {
      return NextResponse.json(
        { error: 'Facility with this code already exists' },
        { status: 409 }
      );
    }

    // Create facility with validated data
    const facility = await ManufacturingFacility.create({
      company,
      ...validatedData,
      // Set initial metrics based on targets
      metrics: {
        oeeScore: validatedData.targetOee * 0.9, // Start at 90% of target
        availability: 95,
        performance: 90,
        quality: 98,
        capacityUtilization: 0,
        throughput: 0,
      },
      workforce: {
        totalEmployees: validatedData.productionLines * 5, // Estimate 5 per line
        directLabor: validatedData.productionLines * 4,
        indirectLabor: validatedData.productionLines,
        avgHourlyWage: 25,
        turnoverRate: 5,
        trainingHours: 40,
      },
      financials: {
        monthlyRevenue: 0,
        monthlyCost: 0,
        profitMargin: 0,
        costPerUnit: 0,
        inventoryValue: 0,
        capitalExpenditure: 0,
      },
      compliance: {
        isoCompliant: validatedData.isoCompliant,
        oshaCompliant: validatedData.oshaCompliant,
        epaCompliant: validatedData.epaCompliant,
        lastAuditDate: new Date(),
        nextAuditDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        auditScore: 85,
        violations: [],
      },
      status: 'Operational',
      active: true,
    });

    return NextResponse.json(
      { 
        message: 'Facility created successfully', 
        facility,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/manufacturing/facilities error:', error);
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}
