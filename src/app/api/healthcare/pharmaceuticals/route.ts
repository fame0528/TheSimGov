/**
 * @fileoverview Pharmaceuticals API endpoint for healthcare industry simulation
 * @description CRUD operations for pharmaceutical company management with drug pipeline,
 * clinical trials, regulatory compliance, and patent valuation
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import Pharmaceutical from '@/lib/db/models/healthcare/Pharmaceutical';
import Company from '@/lib/db/models/Company';
import {
  calculateDrugSuccessProbability,
  calculatePatentValue,
  calculateTrialTimeline,
  calculateHealthcareInflation,
  validateHealthcareLicense,
  projectPatientVolume,
  validateHealthcareMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schemas
const createPharmaceuticalSchema = z.object({
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
  companyType: z.enum(['big_pharma', 'biotech', 'generic', 'specialty']),
  therapeuticAreas: z.array(z.string()).min(1),
  pipeline: z.array(z.object({
    drugName: z.string(),
    therapeuticArea: z.string(),
    developmentStage: z.enum(['discovery', 'preclinical', 'phase1', 'phase2', 'phase3', 'filing', 'approved']),
    targetIndication: z.string(),
    mechanismOfAction: z.string(),
    estimatedMarketSize: z.number().min(0),
    patentExpiration: z.date().optional(),
    clinicalTrials: z.array(z.object({
      phase: z.enum(['phase1', 'phase2', 'phase3']),
      status: z.enum(['recruiting', 'active', 'completed', 'terminated']),
      patientCount: z.number().min(0),
      startDate: z.date(),
      estimatedCompletion: z.date().optional(),
      successProbability: z.number().min(0).max(100).optional()
    })).optional()
  })),
  manufacturing: z.object({
    facilities: z.number().min(0),
    capacity: z.number().min(0), // kg/year
    certifications: z.array(z.string())
  }),
  regulatory: z.object({
    fdaApprovals: z.number().min(0),
    euApprovals: z.number().min(0),
    warningLetters: z.number().min(0),
    complianceScore: z.number().min(0).max(100).optional()
  }),
  financials: z.object({
    annualRevenue: z.number().min(0),
    rAndBudget: z.number().min(0),
    annualCosts: z.number().min(0),
    revenueBySegment: z.object({
      branded: z.number().min(0).max(100),
      generic: z.number().min(0).max(100),
      biosimilars: z.number().min(0).max(100)
    })
  }),
  partnerships: z.array(z.object({
    partnerName: z.string(),
    partnershipType: z.enum(['research', 'licensing', 'manufacturing', 'distribution']),
    startDate: z.date(),
    revenueShare: z.number().min(0).max(100).optional()
  })).optional(),
  company: z.string() // Company ID
});

const updatePharmaceuticalSchema = createPharmaceuticalSchema.partial().extend({
  company: z.string().optional()
});

const querySchema = z.object({
  company: z.string().optional(),
  companyType: z.enum(['big_pharma', 'biotech', 'generic', 'specialty']).optional(),
  therapeuticAreas: z.string().optional(), // comma-separated
  minPipelineValue: z.string().transform(Number).optional(),
  developmentStage: z.enum(['discovery', 'preclinical', 'phase1', 'phase2', 'phase3', 'filing', 'approved']).optional(),
  sortBy: z.enum(['name', 'pipelineValue', 'revenue', 'complianceScore', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
});

/**
 * GET /api/healthcare/pharmaceuticals
 * List pharmaceutical companies with advanced filtering and sorting
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

    if (query.company) {
      mongoQuery.company = query.company;
    }

    if (query.companyType) {
      mongoQuery.companyType = query.companyType;
    }

    if (query.therapeuticAreas) {
      const areas = query.therapeuticAreas.split(',').map(a => a.trim());
      mongoQuery.therapeuticAreas = { $in: areas };
    }

    if (query.developmentStage) {
      mongoQuery['pipeline.developmentStage'] = query.developmentStage;
    }

    if (query.minPipelineValue) {
      mongoQuery.pipelineValue = { $gte: query.minPipelineValue };
    }

    // Build sort options
    const sortOptions: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortOrder;

    // Execute query with pagination
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const pharmaceuticals = await Pharmaceutical
      .find(mongoQuery)
      .populate('company', 'name industry')
      .sort(sortOptions)
      .limit(limit)
      .skip(offset)
      .lean();

    // Calculate real-time metrics for each pharmaceutical company
    const pharmaceuticalsWithMetrics = await Promise.all(
      pharmaceuticals.map(async (pharma: any) => {
        // Calculate pipeline value and success probabilities
        const pipelineMetrics = await Promise.all(
          (pharma.pipeline || []).map(async (drug: any) => {
            const successProb = calculateDrugSuccessProbability(
              drug.developmentStage,
              drug.clinicalTrials || [],
              drug.targetIndication
            );

            const patentValue = drug.patentExpiration ?
              calculatePatentValue(drug.estimatedMarketSize, drug.patentExpiration, drug.developmentStage) : 0;

            const trialTimeline = calculateTrialTimeline(
              drug.developmentStage,
              drug.clinicalTrials?.reduce((sum: number, trial: any) => sum + trial.patientCount, 0) || 0
            );

            return {
              ...drug,
              successProbability: successProb,
              patentValue,
              trialTimeline
            };
          })
        );

        const totalPipelineValue = pipelineMetrics.reduce((sum: number, drug: any) => sum + drug.patentValue, 0);

        // Calculate basic metrics using available functions
        const complianceScore = pharma.regulatory?.complianceScore || 0;
        const revenue = pharma.financials?.annualRevenue || 0;
        const costs = pharma.financials?.annualCosts || 0;

        const metricsValidation = validateHealthcareMetrics({
          pipelineValue: totalPipelineValue,
          regulatoryScore: complianceScore,
          revenue,
          costs
        });

        return {
          ...pharma,
          pipeline: pipelineMetrics,
          metrics: {
            totalPipelineValue,
            complianceScore,
            revenue,
            costs,
            licenseValid: validateHealthcareLicense('Pharmacy', pharma.regulatory?.licenseNumber || '', pharma.location?.state || '')
          }
        };
      })
    );

    // Get total count for pagination
    const totalCount = await Pharmaceutical.countDocuments(mongoQuery);

    return createSuccessResponse({
      pharmaceuticals: pharmaceuticalsWithMetrics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: query
    });

  } catch (error) {
    console.error('Error fetching pharmaceuticals:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/healthcare/pharmaceuticals
 * Create a new pharmaceutical company
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json();
    const validatedData = createPharmaceuticalSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.company);
    if (!company) {
      return createErrorResponse('Company not found', ErrorCode.NOT_FOUND, 404);
    }

    if (!company.owner || company.owner.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate initial pipeline metrics
    const pipelineWithMetrics = await Promise.all(
      validatedData.pipeline.map(async (drug) => {
        const successProb = calculateDrugSuccessProbability(
          drug.developmentStage,
          drug.targetIndication,
          0 // Initial company experience
        );

        const patentValue = drug.patentExpiration ?
          calculatePatentValue(drug.estimatedMarketSize, drug.patentExpiration, drug.developmentStage) : 0;

        return {
          ...drug,
          successProbability: successProb,
          patentValue
        };
      })
    );

    const totalPipelineValue = pipelineWithMetrics.reduce((sum, drug) => sum + drug.patentValue, 0);

    // Validate healthcare metrics
    const metricsValidation = validateHealthcareMetrics({
      pipelineValue: totalPipelineValue,
      regulatoryScore: validatedData.regulatory.complianceScore || 0,
      revenue: validatedData.financials.annualRevenue,
      costs: validatedData.financials.annualCosts
    });

    if (Object.keys(metricsValidation).length > 0) {
      return createErrorResponse('Pharmaceutical company metrics validation failed', ErrorCode.BAD_REQUEST, 400);
    }

    // Create pharmaceutical company
    const pharmaceutical = new Pharmaceutical({
      ...validatedData,
      pipeline: pipelineWithMetrics,
      pipelineValue: totalPipelineValue,
      regulatory: {
        ...validatedData.regulatory
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await pharmaceutical.save();
    await pharmaceutical.populate('company', 'name industry');

    return createSuccessResponse({
      pharmaceutical: {
        ...pharmaceutical.toObject(),
        metrics: {
          totalPipelineValue,
          licenseValid: validateHealthcareLicense('Pharmacy', '', validatedData.location?.state || '')
        }
      },
      message: 'Pharmaceutical company created successfully'
    }, undefined, 201);

  } catch (error) {
    console.error('Error creating pharmaceutical company:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid pharmaceutical data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}