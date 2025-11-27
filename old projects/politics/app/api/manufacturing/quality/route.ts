/**
 * @file app/api/manufacturing/quality/route.ts
 * @description REST API for quality metrics management with Six Sigma analytics
 * @created 2025-01-13
 * 
 * OVERVIEW:
 * Manages quality control metrics including DPMO, sigma levels, SPC control charts,
 * and cost of quality tracking. Supports Six Sigma methodology with defect tracking,
 * process capability analysis, and ISO 9001 compliance monitoring.
 * 
 * CONTRACT:
 * GET  /api/manufacturing/quality
 *  - Auth: Required (NextAuth session)
 *  - Query: facility, productionLine, product, measurementPeriod, minSigmaLevel, maxSigmaLevel, needsImprovement, limit, skip, sortBy, sortOrder
 *  - Returns: { metrics: QualityMetric[], total: number }
 * 
 * POST /api/manufacturing/quality
 *  - Auth: Required (NextAuth session)
 *  - Body: { metricId, facility, productionLine, product, unitsProduced, unitsInspected, defectsFound, defectiveUnits, opportunities, measurementPeriod, targetSigmaLevel, ... }
 *  - Returns: { metric: QualityMetric }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import QualityMetric from '@/lib/db/models/QualityMetric';
import ManufacturingFacility from '@/lib/db/models/ManufacturingFacility';
import ProductionLine from '@/lib/db/models/ProductionLine';
import {
  qualityMetricQuerySchema,
  createQualityMetricSchema,
  QualityMetricQueryInput,
} from '@/lib/validations/manufacturing';

/**
 * GET /api/manufacturing/quality
 * List quality metrics with filtering and Six Sigma analytics
 */
export async function GET(request: NextRequest) {
  try {
    const toBool = (v: string | null): boolean | undefined =>
      v === null ? undefined : v === 'true' ? true : v === 'false' ? false : undefined;
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Partial<QualityMetricQueryInput> = {
      facility: searchParams.get('facility') || undefined,
      productionLine: searchParams.get('productionLine') || undefined,
      product: searchParams.get('product') || undefined,
      measurementPeriod: (searchParams.get('measurementPeriod') as any) || undefined,
      minSigmaLevel: searchParams.get('minSigmaLevel') ? Number(searchParams.get('minSigmaLevel')) : undefined,
      maxSigmaLevel: searchParams.get('maxSigmaLevel') ? Number(searchParams.get('maxSigmaLevel')) : undefined,
      needsImprovement: toBool(searchParams.get('needsImprovement')),
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      skip: searchParams.get('skip') ? Number(searchParams.get('skip')) : 0,
      sortBy: (searchParams.get('sortBy') as any) || 'measurementDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const validated = qualityMetricQuerySchema.parse(queryParams);

    // Build query filter
    const filter: any = { company: company._id };

    if (validated.facility) filter.facility = validated.facility;
    if (validated.productionLine) filter.productionLine = validated.productionLine;
    if (validated.product) filter.product = { $regex: validated.product, $options: 'i' };
    if (validated.measurementPeriod) filter.measurementPeriod = validated.measurementPeriod;
    
    // Sigma level range filtering
    if (validated.minSigmaLevel !== undefined || validated.maxSigmaLevel !== undefined) {
      filter.sigmaLevel = {};
      if (validated.minSigmaLevel !== undefined) filter.sigmaLevel.$gte = validated.minSigmaLevel;
      if (validated.maxSigmaLevel !== undefined) filter.sigmaLevel.$lte = validated.maxSigmaLevel;
    }

    // Needs improvement: sigmaLevel < targetSigmaLevel
    if (validated.needsImprovement !== undefined) {
      filter.$expr = validated.needsImprovement
        ? { $lt: ['$sigmaLevel', '$targetSigmaLevel'] }
        : { $gte: ['$sigmaLevel', '$targetSigmaLevel'] };
    }

    // Execute query with pagination and sorting
    const [metrics, total] = await Promise.all([
      QualityMetric.find(filter)
        .populate('facility', 'name facilityCode')
        .populate('productionLine', 'name lineNumber')
        .limit(validated.limit)
        .skip(validated.skip)
        .sort({ [validated.sortBy]: validated.sortOrder === 'asc' ? 1 : -1 })
        .lean(),
      QualityMetric.countDocuments(filter),
    ]);

    return NextResponse.json({ metrics, total }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('Quality metrics GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve quality metrics' }, { status: 500 });
  }
}

/**
 * POST /api/manufacturing/quality
 * Create new quality metric with Six Sigma calculations
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find company
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createQualityMetricSchema.parse(body);

    // Check for duplicate metricId
    const existing = await QualityMetric.findOne({
      company: company._id,
      metricId: validated.metricId,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Quality metric with this ID already exists for your company' },
        { status: 409 }
      );
    }

    // Validate facility ownership if provided
    if (validated.facility) {
      const facility = await ManufacturingFacility.findOne({
        _id: validated.facility,
        company: company._id,
      });

      if (!facility) {
        return NextResponse.json(
          { error: 'Facility not found or not owned by your company' },
          { status: 404 }
        );
      }
    }

    // Validate production line ownership if provided
    if (validated.productionLine) {
      const line = await ProductionLine.findOne({
        _id: validated.productionLine,
        company: company._id,
      });

      if (!line) {
        return NextResponse.json(
          { error: 'Production line not found or not owned by your company' },
          { status: 404 }
        );
      }
    }

    // Create quality metric (pre-save hook calculates DPMO, sigma level, etc.)
    const metric = await QualityMetric.create({
      ...validated,
      company: company._id,
      measurementDate: new Date(),
    });

    // Populate references for response
    await metric.populate('facility', 'name facilityCode');
    await metric.populate('productionLine', 'name lineNumber');

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    console.error('Quality metric creation error:', error);
    return NextResponse.json({ error: 'Failed to create quality metric' }, { status: 500 });
  }
}
