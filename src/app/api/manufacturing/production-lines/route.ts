/**
 * @fileoverview Manufacturing Production Lines API Route
 * @module api/manufacturing/production-lines
 * 
 * ENDPOINTS:
 * GET  /api/manufacturing/production-lines - List production lines with filtering and pagination
 * POST /api/manufacturing/production-lines - Create new production line
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { ManufacturingProductionLine, ManufacturingFacility } from '@/lib/db/models/manufacturing';
import { 
  productionLineQuerySchema, 
  createProductionLineSchema,
  type ProductionLineQueryInput 
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/production-lines
 * List production lines with filtering, pagination, and sorting
 * 
 * Query Parameters:
 * - facilityId: Filter by facility ID
 * - lineType: Filter by line type
 * - status: Filter by operational status
 * - active: Filter by active status
 * - minOee/maxOee: Filter by OEE range
 * - minThroughput: Filter by minimum throughput
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
    const facilityId = searchParams.get('facilityId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Parse and validate query parameters
    let queryParams: ProductionLineQueryInput;
    try {
      const obj = Object.fromEntries(searchParams.entries());
      queryParams = productionLineQuerySchema.parse(obj);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseError },
        { status: 400 }
      );
    }

    // Build MongoDB query
    const query: Record<string, unknown> = { company: companyId };

    // Facility filter
    if (facilityId || queryParams.facilityId) {
      query.facility = facilityId || queryParams.facilityId;
    }

    // Type filters
    if (queryParams.lineType) {
      query.lineType = queryParams.lineType;
    }
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    if (queryParams.shift) {
      query.shift = queryParams.shift;
    }
    if (queryParams.active !== undefined) {
      query.active = queryParams.active;
    }

    // Range filters - OEE (using lowercase field names from validation schema)
    if (queryParams.minOee !== undefined || queryParams.maxOee !== undefined) {
      query['performance.oee'] = {};
      if (queryParams.minOee !== undefined) {
        (query['performance.oee'] as Record<string, number>)['$gte'] = queryParams.minOee;
      }
      if (queryParams.maxOee !== undefined) {
        (query['performance.oee'] as Record<string, number>)['$lte'] = queryParams.maxOee;
      }
    }

    // Range filters - Throughput
    if (queryParams.minThroughput !== undefined) {
      query['performance.throughput.actual'] = { $gte: queryParams.minThroughput };
    }

    // Build sort object
    const sortField = queryParams.sortBy === 'oee' ? 'performance.oee' :
                     queryParams.sortBy === 'availability' ? 'performance.availability' :
                     queryParams.sortBy === 'performance' ? 'performance.performance' :
                     queryParams.sortBy === 'quality' ? 'performance.quality' :
                     queryParams.sortBy === 'throughput' ? 'performance.throughput.actual' :
                     queryParams.sortBy;
    
    const sort: Record<string, 1 | -1> = { 
      [sortField]: queryParams.sortOrder === 'asc' ? 1 : -1 
    };

    // Execute query with pagination
    const [productionLines, totalCount] = await Promise.all([
      ManufacturingProductionLine.find(query)
        .sort(sort)
        .skip(queryParams.skip)
        .limit(queryParams.limit)
        .populate('facility', 'name location')
        .lean(),
      ManufacturingProductionLine.countDocuments(query),
    ]);

    // Calculate summary metrics
    const summary = await ManufacturingProductionLine.aggregate([
      { $match: { company: companyId, active: true } },
      {
        $group: {
          _id: null,
          totalLines: { $sum: 1 },
          avgOEE: { $avg: '$performance.oee' },
          avgAvailability: { $avg: '$performance.availability' },
          avgPerformance: { $avg: '$performance.performance' },
          avgQuality: { $avg: '$performance.quality' },
          avgUtilization: { $avg: '$capacity.utilizationRate' },
          totalCapacity: { $sum: '$capacity.designedCapacity' },
          totalActualOutput: { $sum: '$performance.throughput.actual' },
          totalDefects: { $sum: '$quality.defects.total' },
        },
      },
    ]);

    // Count by status
    const statusBreakdown = await ManufacturingProductionLine.aggregate([
      { $match: { company: companyId, active: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Count by type
    const typeBreakdown = await ManufacturingProductionLine.aggregate([
      { $match: { company: companyId, active: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      productionLines,
      pagination: {
        total: totalCount,
        limit: queryParams.limit,
        skip: queryParams.skip,
        pages: Math.ceil(totalCount / queryParams.limit),
      },
      summary: {
        ...(summary[0] || {
          totalLines: 0,
          avgOEE: 0,
          avgAvailability: 0,
          avgPerformance: 0,
          avgQuality: 0,
          avgUtilization: 0,
          totalCapacity: 0,
          totalActualOutput: 0,
          totalDefects: 0,
        }),
        statusBreakdown: statusBreakdown.reduce(
          (acc: Record<string, number>, s: { _id: string; count: number }) => {
            acc[s._id] = s.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        typeBreakdown: typeBreakdown.reduce(
          (acc: Record<string, number>, t: { _id: string; count: number }) => {
            acc[t._id] = t.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error('GET /api/manufacturing/production-lines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production lines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manufacturing/production-lines
 * Create a new production line
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { company, facility } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    if (!facility) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    // Verify facility exists and belongs to company
    const facilityDoc = await ManufacturingFacility.findOne({
      _id: facility,
      company,
    });

    if (!facilityDoc) {
      return NextResponse.json(
        { error: 'Facility not found or does not belong to company' },
        { status: 404 }
      );
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = createProductionLineSchema.parse(body);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseError },
        { status: 400 }
      );
    }

    // Check for duplicate line number within facility
    const existingLine = await ManufacturingProductionLine.findOne({
      facility,
      lineNumber: validatedData.lineNumber,
    });

    if (existingLine) {
      return NextResponse.json(
        { error: 'Production line with this line number already exists in facility' },
        { status: 409 }
      );
    }

    // Create production line with validated data
    // Map from validation schema fields to model fields
    const productionLine = await ManufacturingProductionLine.create({
      company,
      facility,
      name: validatedData.name,
      lineNumber: validatedData.lineNumber,
      lineType: validatedData.lineType,
      status: 'Idle',
      
      // Performance - use ratedSpeed and targetCycleTime from validation
      ratedSpeed: validatedData.ratedSpeed,
      targetCycleTime: validatedData.targetCycleTime,
      throughputTarget: validatedData.throughputTarget || validatedData.ratedSpeed,
      
      // OEE Metrics - initialized to baseline values
      availability: 100,
      performance: 0,
      quality: 100,
      oee: 0,
      
      // Staffing from validation
      operatorsRequired: validatedData.operatorsRequired,
      shift: validatedData.shift,
      equipmentAge: validatedData.equipmentAge,
      
      active: true,
    });

    // Increment line count on facility
    await ManufacturingFacility.findByIdAndUpdate(facility, {
      $inc: { 'lines.total': 1 },
    });

    return NextResponse.json(
      { 
        message: 'Production line created successfully', 
        productionLine,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/manufacturing/production-lines error:', error);
    return NextResponse.json(
      { error: 'Failed to create production line' },
      { status: 500 }
    );
  }
}
