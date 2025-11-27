/**
 * @fileoverview Clinics API endpoint for healthcare industry simulation
 * @description CRUD operations for clinic management with efficiency metrics,
 * patient flow calculations, and service optimization
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { Clinic, Company } from '@/lib/db/models';
import {
  calculateClinicEfficiencyFromObjects,
  validateHealthcareLicenseFromAccreditations,
  projectPatientVolume,
  validateHealthcareMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schemas
const createClinicSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['primary_care', 'specialty', 'urgent_care', 'dental', 'mental_health', 'surgical']),
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
    examRooms: z.number().min(1).max(50),
    dailyCapacity: z.number().min(10).max(500),
    parkingSpaces: z.number().min(0).optional()
  }),
  specialties: z.array(z.string()).min(1),
  services: z.array(z.string()),
  hours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }),
    tuesday: z.object({ open: z.string(), close: z.string() }),
    wednesday: z.object({ open: z.string(), close: z.string() }),
    thursday: z.object({ open: z.string(), close: z.string() }),
    friday: z.object({ open: z.string(), close: z.string() }),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional()
  }),
  staffing: z.object({
    physicians: z.number().min(0),
    nursePractitioners: z.number().min(0),
    nurses: z.number().min(0),
    medicalAssistants: z.number().min(0),
    administrative: z.number().min(0)
  }),
  technology: z.object({
    electronicHealthRecords: z.boolean(),
    telemedicine: z.boolean(),
    appointmentScheduling: z.boolean(),
    patientPortal: z.boolean()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0),
    annualCosts: z.number().min(0),
    payerMix: z.object({
      insurance: z.number().min(0).max(100),
      selfPay: z.number().min(0).max(100),
      medicare: z.number().min(0).max(100),
      medicaid: z.number().min(0).max(100)
    })
  }),
  performance: z.object({
    averageWaitTime: z.number().min(0).optional(), // minutes
    patientSatisfaction: z.number().min(0).max(100).optional(),
    noShowRate: z.number().min(0).max(100).optional()
  }).optional(),
  accreditations: z.array(z.string()).optional(),
  company: z.string() // Company ID
});

const updateClinicSchema = createClinicSchema.partial().extend({
  company: z.string().optional()
});

const querySchema = z.object({
  company: z.string().optional(),
  type: z.enum(['primary_care', 'specialty', 'urgent_care', 'dental', 'mental_health', 'surgical']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  specialties: z.string().optional(), // comma-separated
  minEfficiency: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'efficiency', 'revenue', 'patientVolume', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
});

/**
 * GET /api/healthcare/clinics
 * List clinics with advanced filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build MongoDB query
    const mongoQuery: any = {};

    if (query.company) {
      mongoQuery.company = query.company;
    }

    if (query.type) {
      mongoQuery.type = query.type;
    }

    if (query.city || query.state) {
      mongoQuery['location.city'] = query.city;
      if (query.state) {
        mongoQuery['location.state'] = query.state;
      }
    }

    if (query.specialties) {
      const specialties = query.specialties.split(',').map(s => s.trim());
      mongoQuery.specialties = { $in: specialties };
    }

    if (query.minEfficiency) {
      mongoQuery.efficiency = { $gte: query.minEfficiency };
    }

    // Build sort options
    const sortOptions: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortOrder;

    // Execute query with pagination
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const clinics = await Clinic
      .find(mongoQuery)
      .populate('company', 'name industry')
      .sort(sortOptions)
      .limit(limit)
      .skip(offset)
      .lean();

    // Calculate real-time metrics for each clinic
    const clinicsWithMetrics = await Promise.all(
      clinics.map(async (clinic: any) => {
        const efficiency = calculateClinicEfficiencyFromObjects(
          clinic.capacity || {},
          clinic.staffing || {},
          clinic.performance || {}
        );

        // Calculate basic metrics using available functions
        const revenue = clinic.financials?.annualRevenue || 0;
        const costs = clinic.financials?.annualCosts || 0;

        const metricsValidation = validateHealthcareMetrics({
          efficiency,
          revenue,
          costs
        });

        return {
          ...clinic,
          metrics: {
            efficiency,
            revenue,
            costs,
            licenseValid: validateHealthcareLicenseFromAccreditations(clinic.accreditations || [])
          }
        };
      })
    );

    // Get total count for pagination
    const totalCount = await Clinic.countDocuments(mongoQuery);

    return NextResponse.json({
      clinics: clinicsWithMetrics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: query
    });

  } catch (error) {
    console.error('Error fetching clinics:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/healthcare/clinics
 * Create a new clinic
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createClinicSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (!company.owner || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Company not owned by user' }, { status: 403 });
    }

    // Calculate initial metrics
    const efficiency = calculateClinicEfficiencyFromObjects(
      validatedData.capacity,
      validatedData.staffing,
      validatedData.performance || {}
    );

    // Validate metrics
    const metricsValidation = validateHealthcareMetrics({
      efficiency,
      revenue: validatedData.financials.annualRevenue,
      costs: validatedData.financials.annualCosts
    });

    if (Object.keys(metricsValidation).length > 0) {
      return NextResponse.json({
        error: 'Clinic metrics validation failed',
        details: metricsValidation
      }, { status: 400 });
    }

    // Create clinic
    const clinic = new Clinic({
      ...validatedData,
      efficiency,
      patientVolume: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await clinic.save();
    await clinic.populate('company', 'name industry');

    return NextResponse.json({
      clinic: {
        ...clinic.toObject(),
        metrics: {
          efficiency,
          licenseValid: validateHealthcareLicenseFromAccreditations(validatedData.accreditations || [])
        }
      },
      message: 'Clinic created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating clinic:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid clinic data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}