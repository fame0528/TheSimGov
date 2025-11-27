/**
 * @fileoverview Medical Devices API endpoint for healthcare industry simulation
 * @description CRUD operations for medical device company management with FDA classifications,
 * product portfolios, regulatory compliance, and reimbursement calculations
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import { MedicalDevice } from '@/lib/db/models';
import {
  calculateDeviceReimbursementSimple,
  determineDeviceClassFromApproval,
  validateHealthcareLicenseFromAccreditations,
  validateHealthcareMetrics
} from '@/lib/utils/healthcare';
import { Company } from '@/lib/db/models';
import { z } from 'zod';

// Validation schemas
const createMedicalDeviceSchema = z.object({
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
  companyType: z.enum(['orthopedic', 'cardiovascular', 'neurological', 'diagnostic', 'surgical', 'implantable']),
  products: z.array(z.object({
    name: z.string(),
    deviceClass: z.enum(['Class I', 'Class II', 'Class III']),
    fdaApproval: z.enum(['510(k)', 'PMA', 'De Novo', 'HDE']),
    approvalDate: z.date(),
    reimbursementCode: z.string(),
    averageSellingPrice: z.number().min(0),
    annualUnits: z.number().min(0),
    marketShare: z.number().min(0).max(100)
  })),
  manufacturing: z.object({
    facilities: z.number().min(0),
    certifications: z.array(z.string()),
    qualitySystems: z.array(z.string())
  }),
  regulatory: z.object({
    fdaClearances: z.number().min(0),
    recalls: z.number().min(0),
    warningLetters: z.number().min(0),
    complianceScore: z.number().min(0).max(100).optional()
  }),
  financials: z.object({
    annualRevenue: z.number().min(0),
    annualCosts: z.number().min(0),
    rAndBudget: z.number().min(0),
    revenueBySegment: z.object({
      hospitals: z.number().min(0).max(100),
      clinics: z.number().min(0).max(100),
      physicians: z.number().min(0).max(100),
      international: z.number().min(0).max(100)
    })
  }),
  marketPosition: z.object({
    marketShare: z.number().min(0).max(100),
    competitiveAdvantages: z.array(z.string()),
    targetMarkets: z.array(z.string())
  }),
  company: z.string() // Company ID
});

const updateMedicalDeviceSchema = createMedicalDeviceSchema.partial();

const querySchema = z.object({
  company: z.string().optional(),
  companyType: z.enum(['orthopedic', 'cardiovascular', 'neurological', 'diagnostic', 'surgical', 'implantable']).optional(),
  deviceClass: z.enum(['class1', 'class2', 'class3']).optional(),
  regulatoryStatus: z.enum(['510k_cleared', 'premarket_approval', 'de_novo', 'investigational']).optional(),
  minMarketShare: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'revenue', 'marketShare', 'complianceScore', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
});

/**
 * GET /api/healthcare/devices
 * List medical device companies with advanced filtering and sorting
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

    if (query.companyType) {
      mongoQuery.companyType = query.companyType;
    }

    if (query.deviceClass) {
      mongoQuery['products.deviceClass'] = query.deviceClass;
    }

    if (query.regulatoryStatus) {
      mongoQuery['products.fdaApproval'] = query.regulatoryStatus;
    }

    if (query.minMarketShare) {
      mongoQuery['products.marketShare'] = { $gte: query.minMarketShare };
    }

    // Build sort options
    const sortOptions: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortOrder;

    // Execute query with pagination
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const devices = await MedicalDevice
      .find(mongoQuery)
      .populate('company', 'name industry')
      .sort(sortOptions)
      .limit(limit)
      .skip(offset)
      .lean();

    // Calculate real-time metrics for each medical device company
    const devicesWithMetrics = await Promise.all(
      devices.map(async (device: any) => {
        // Calculate product portfolio metrics
        const portfolioMetrics = await Promise.all(
          (device.products || []).map(async (product: any) => {
            const reimbursement = calculateDeviceReimbursementSimple(
              product.reimbursementCode,
              product.averageSellingPrice,
              product.deviceClass
            );

            const deviceClass = determineDeviceClassFromApproval(product.fdaApproval || product.deviceClass);

            return {
              ...product,
              reimbursement,
              deviceClass
            };
          })
        );

        const totalPortfolioValue = portfolioMetrics.reduce((sum, product) => sum + (product.averageSellingPrice * product.annualUnits), 0);

        const licenseValid = validateHealthcareLicenseFromAccreditations((device as any).accreditations || []);

        const metricsValid = validateHealthcareMetrics({
          totalPortfolioValue,
          productCount: portfolioMetrics.length
        });
      })
    );

    // Get total count for pagination
    const totalCount = await MedicalDevice.countDocuments(mongoQuery);

    return NextResponse.json({
      devices: devicesWithMetrics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: query
    });

  } catch (error) {
    console.error('Error fetching medical devices:', error);
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
 * POST /api/healthcare/devices
 * Create a new medical device company
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMedicalDeviceSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Company not owned by user' }, { status: 403 });
    }

    // Calculate initial portfolio metrics
    const portfolioWithMetrics = await Promise.all(
      validatedData.products.map(async (product: any) => {
        const reimbursement = calculateDeviceReimbursementSimple(
          product.reimbursementCode,
          product.averageSellingPrice,
          product.deviceClass
        );

        const deviceClass = determineDeviceClassFromApproval(product.fdaApproval || product.deviceClass);

        return {
          ...product,
          reimbursement,
          deviceClass
        };
      })
    );

    const totalPortfolioValue = portfolioWithMetrics.reduce((sum: number, product: any) => sum + (product.averageSellingPrice * product.annualUnits), 0);

    const licenseValid = validateHealthcareLicenseFromAccreditations((validatedData as any).accreditations || []);

    const metricsValid = validateHealthcareMetrics({
      totalPortfolioValue,
      productCount: portfolioWithMetrics.length
    });

    // Create medical device company
    const medicalDevice = new MedicalDevice({
      ...validatedData,
      products: portfolioWithMetrics,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await medicalDevice.save();
    await medicalDevice.populate('company', 'name industry');

    return NextResponse.json({
      device: {
        ...medicalDevice.toObject(),
        metrics: {
          totalPortfolioValue,
          licenseValid,
          metricsValid: metricsValid.isValid
        }
      },
      message: 'Medical device company created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating medical device company:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid medical device data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}