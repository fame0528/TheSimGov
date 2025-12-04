/**
 * @fileoverview Hospitals API endpoint for healthcare industry simulation
 * @description Comprehensive CRUD operations for hospital management with quality metrics,
 * financial projections, and regulatory compliance calculations
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import { Hospital, Company } from '@/lib/db/models';
import {
  calculateHospitalQualityScore,
  calculateHospitalCapacityUtilization,
  calculateHospitalFinancialProjection,
  calculateHospitalPatientSatisfaction,
  validateHospitalLicense,
  validateHospitalMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schemas
const createHospitalSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.object({
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  capacity: z.object({
    beds: z.number().min(1).max(5000),
    icuBeds: z.number().min(0),
    emergencyRooms: z.number().min(0),
    operatingRooms: z.number().min(0)
  }),
  specialties: z.array(z.string()).min(1),
  services: z.array(z.string()),
  qualityMetrics: z.object({
    patientSatisfaction: z.number().min(0).max(100).optional(),
    mortalityRate: z.number().min(0).max(100).optional(),
    infectionRate: z.number().min(0).max(100).optional(),
    readmissionRate: z.number().min(0).max(100).optional(),
    averageStay: z.number().min(0).optional()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0),
    annualCosts: z.number().min(0),
    insuranceMix: z.object({
      medicare: z.number().min(0).max(100),
      medicaid: z.number().min(0).max(100),
      private: z.number().min(0).max(100),
      selfPay: z.number().min(0).max(100)
    })
  }),
  staffing: z.object({
    physicians: z.number().min(0),
    nurses: z.number().min(0),
    supportStaff: z.number().min(0)
  }),
  technology: z.object({
    electronicHealthRecords: z.boolean(),
    telemedicine: z.boolean(),
    roboticSurgery: z.boolean(),
    aiDiagnostics: z.boolean()
  }).optional(),
  accreditations: z.array(z.string()).optional(),
  ownedBy: z.string() // Company ID
});

const updateHospitalSchema = createHospitalSchema.partial().extend({
  ownedBy: z.string().optional()
});

const querySchema = z.object({
  ownedBy: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minBeds: z.string().transform(Number).optional(),
  maxBeds: z.string().transform(Number).optional(),
  specialties: z.string().optional(), // comma-separated
  minQualityScore: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'qualityScore', 'capacity', 'revenue', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
});

/**
 * GET /api/healthcare/hospitals
 * List hospitals with advanced filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build MongoDB query
    const mongoQuery: any = {};

    if (query.ownedBy) {
      mongoQuery.ownedBy = query.ownedBy;
    }

    if (query.city || query.state) {
      mongoQuery['location.city'] = query.city;
      if (query.state) {
        mongoQuery['location.state'] = query.state;
      }
    }

    if (query.minBeds || query.maxBeds) {
      mongoQuery['capacity.beds'] = {};
      if (query.minBeds) mongoQuery['capacity.beds'].$gte = query.minBeds;
      if (query.maxBeds) mongoQuery['capacity.beds'].$lte = query.maxBeds;
    }

    if (query.specialties) {
      const specialties = query.specialties.split(',').map(s => s.trim());
      mongoQuery.specialties = { $in: specialties };
    }

    if (query.minQualityScore) {
      mongoQuery.qualityScore = { $gte: query.minQualityScore };
    }

    // Build sort options
    const sortOptions: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortOrder;

    // Execute query with pagination
    const limit = Math.min(query.limit || 50, 100); // Max 100 per page
    const offset = query.offset || 0;

    const hospitals = await Hospital
      .find(mongoQuery)
      .populate('ownedBy', 'name industry')
      .sort(sortOptions)
      .limit(limit)
      .skip(offset)
      .lean();

    // Calculate real-time metrics for each hospital
    const hospitalsWithMetrics = await Promise.all(
      hospitals.map(async (hospital: any) => {
        const capacityUtilization = calculateHospitalCapacityUtilization(
          hospital.capacity?.occupiedBeds || 0,
          hospital.capacity?.totalBeds || 100,
          hospital.qualityMetrics?.averageLengthOfStay || 5
        );

        const qualityScore = calculateHospitalQualityScore(
          hospital.qualityMetrics?.patientSatisfaction || 75,
          hospital.qualityMetrics?.mortalityRate || 2.5,
          hospital.qualityMetrics?.readmissionRate || 15,
          hospital.accreditations?.status || 'None'
        );

        const financialProjection = calculateHospitalFinancialProjection(
          hospital.financials?.annualRevenue || 10000000,
          hospital.financials?.annualCosts || 8000000,
          hospital.financials?.projectedGrowth || 0.05,
          5 // years
        );

        const patientSatisfaction = calculateHospitalPatientSatisfaction(
          hospital.qualityMetrics?.waitTime || 30,
          hospital.qualityMetrics?.staffRating || 80,
          hospital.qualityMetrics?.facilityRating || 75,
          hospital.qualityMetrics?.communicationRating || 85
        );

        return {
          ...hospital,
          metrics: {
            capacityUtilization,
            qualityScore,
            financialProjection,
            patientSatisfaction,
            licenseValid: validateHospitalLicense(hospital.accreditations?.licenseNumber || '', hospital.location?.state || '', hospital.accreditations?.status || 'None')
          }
        };
      })
    );

    // Get total count for pagination
    const totalCount = await Hospital.countDocuments(mongoQuery);

    return createSuccessResponse({
      hospitals: hospitalsWithMetrics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: query
    });

  } catch (error) {
    console.error('Error fetching hospitals:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/healthcare/hospitals
 * Create a new hospital
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json();
    const validatedData = createHospitalSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.ownedBy);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check if user owns the company
    if (company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate initial metrics
    const qualityScore = calculateHospitalQualityScore(
      validatedData.qualityMetrics?.patientSatisfaction || 75,
      validatedData.qualityMetrics?.mortalityRate || 2.5,
      validatedData.qualityMetrics?.readmissionRate || 15,
      validatedData.accreditations?.[0] || 'None'
    );

    const capacityUtilization = calculateHospitalCapacityUtilization(
      0, // occupiedBeds starts at 0
      validatedData.capacity?.beds || 100,
      validatedData.qualityMetrics?.averageStay || 5
    );

    const financialProjection = calculateHospitalFinancialProjection(
      validatedData.financials?.annualRevenue || 10000000,
      validatedData.financials?.annualCosts || 8000000,
      0.05, // default growth rate
      5 // years
    );

    const patientSatisfaction = calculateHospitalPatientSatisfaction(
      30, // default wait time
      80, // default staff rating
      75, // default facility rating
      85  // default communication rating
    );

    // Validate metrics
    const metricsValidation = validateHospitalMetrics({
      qualityScore,
      capacityUtilization,
      patientSatisfaction,
      financialHealth: financialProjection[0] > 0
    });

    if (!metricsValidation.isValid) {
      return createErrorResponse('Hospital metrics validation failed', ErrorCode.BAD_REQUEST, 400);
    }

    // Create hospital
    const hospital = new Hospital({
      ...validatedData,
      qualityScore,
      occupancyRate: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await hospital.save();

    // Populate company info for response
    await hospital.populate('ownedBy', 'name industry');

    return createSuccessResponse({
      hospital: {
        ...hospital.toObject(),
        metrics: {
          capacityUtilization,
          qualityScore,
          financialProjection,
          patientSatisfaction,
          licenseValid: validateHospitalLicense('', validatedData.location?.state || '', 'None')
        }
      },
      message: 'Hospital created successfully'
    }, undefined, 201);

  } catch (error) {
    console.error('Error creating hospital:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid hospital data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}