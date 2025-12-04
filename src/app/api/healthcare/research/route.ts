/**
 * @fileoverview Research Projects API endpoint
 * @description CRUD operations for clinical trials and research funding management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import ResearchProject from '@/lib/db/models/healthcare/ResearchProject';
import Company from '@/lib/db/models/Company';
import {
  calculateTrialTimeline,
  calculateResearchRisk,
  calculatePatentValue,
  validateHealthcareLicense,
  validateHealthcareMetrics,
  calculateDrugSuccessProbability
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for creating research projects
const createResearchProjectSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.object({
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  researchType: z.enum(['clinical_trial', 'basic_research', 'translational', 'drug_discovery', 'device_development', 'biomarker_research']),
  therapeuticArea: z.string().min(1).max(100),
  phase: z.enum(['preclinical', 'phase1', 'phase2', 'phase3', 'phase4', 'post_market']).optional(),
  status: z.enum(['planning', 'recruiting', 'active', 'completed', 'terminated', 'on_hold']).default('planning'),
  funding: z.object({
    totalBudget: z.number().min(0),
    fundingSource: z.enum(['government', 'private', 'venture_capital', 'pharma', 'foundation', 'internal']),
    grantNumber: z.string().optional(),
    sponsors: z.array(z.string()).optional(),
    milestones: z.array(z.object({
      milestone: z.string(),
      amount: z.number().min(0),
      completed: z.boolean().default(false),
      completionDate: z.date().optional()
    })).optional()
  }),
  timeline: z.object({
    startDate: z.date(),
    estimatedCompletion: z.date(),
    actualCompletion: z.date().optional(),
    milestones: z.array(z.object({
      milestone: z.string(),
      targetDate: z.date(),
      completed: z.boolean().default(false),
      actualDate: z.date().optional()
    })).optional()
  }),
  participants: z.object({
    targetCount: z.number().min(0),
    enrolledCount: z.number().min(0).default(0),
    inclusionCriteria: z.array(z.string()).optional(),
    exclusionCriteria: z.array(z.string()).optional(),
    demographics: z.object({
      ageRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0)
      }).optional(),
      gender: z.object({
        male: z.number().min(0).max(100),
        female: z.number().min(0).max(100),
        other: z.number().min(0).max(100)
      }).optional(),
      ethnicity: z.object({
        caucasian: z.number().min(0).max(100).optional(),
        african_american: z.number().min(0).max(100).optional(),
        asian: z.number().min(0).max(100).optional(),
        hispanic: z.number().min(0).max(100).optional(),
        other: z.number().min(0).max(100).optional()
      }).optional()
    }).optional()
  }).optional(),
  regulatory: z.object({
    irbApproval: z.boolean().default(false),
    fdaApproval: z.boolean().default(false),
    ethicsCommittee: z.string().optional(),
    protocolNumber: z.string().optional(),
    adverseEvents: z.number().min(0).default(0),
    seriousAdverseEvents: z.number().min(0).default(0)
  }).optional(),
  outcomes: z.object({
    primaryEndpoint: z.string().optional(),
    secondaryEndpoints: z.array(z.string()).optional(),
    results: z.object({
      success: z.boolean().optional(),
      statisticalSignificance: z.boolean().optional(),
      effectSize: z.number().optional(),
      confidenceInterval: z.object({
        lower: z.number().optional(),
        upper: z.number().optional()
      }).optional()
    }).optional(),
    publications: z.array(z.object({
      title: z.string().optional(),
      journal: z.string().optional(),
      publicationDate: z.date().optional(),
      doi: z.string().optional(),
      impactFactor: z.number().min(0).optional()
    })).optional()
  }).optional(),
  intellectualProperty: z.object({
    patentsFiled: z.number().min(0).default(0),
    patentsGranted: z.number().min(0).default(0),
    patentApplications: z.array(z.object({
      patentNumber: z.string().optional(),
      title: z.string().optional(),
      filingDate: z.date().optional(),
      grantDate: z.date().optional(),
      expirationDate: z.date().optional()
    })).optional()
  }).optional(),
  company: z.string() // Company ID
});

const updateResearchProjectSchema = createResearchProjectSchema.partial().extend({
  company: z.string().optional()
});

/**
 * GET /api/healthcare/research
 * Get all research projects for the authenticated user's companies
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    // Get user's companies
    const userCompanies = await Company.find({ owner: session.user.id }).select('_id');
    const companyIds = userCompanies.map(company => company._id);

    const researchProjects = await ResearchProject
      .find({ company: { $in: companyIds } })
      .populate('company', 'name industry')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate comprehensive metrics for each project
    const projectsWithMetrics = await Promise.all(
      researchProjects.map(async (project: any) => {
        const trialTimeline = calculateTrialTimeline(
          project.phase,
          project.participants?.targetCount || 100
        );

        const researchRisk = calculateResearchRisk(
          project.researchType,
          project.phase,
          project.regulatory || {}
        );

        const fundingEfficiency = (project.funding?.totalBudget || 0) / Math.max(project.timeline?.estimatedCompletion?.getTime() - project.timeline?.startDate?.getTime() || 1, 1) * 1000; // Simple efficiency calculation

        const successProbability = calculateDrugSuccessProbability(
          project.therapeuticArea,
          project.phase,
          project.participants?.total || 0
        );

        const regulatoryTimeline = calculateTrialTimeline(project.phase, project.participants?.total || 0); // Use available timeline function

        const patentValue = calculatePatentValue(
          project.intellectualProperty || {},
          project.therapeuticArea,
          project.outcomes?.results?.success || false
        );

        const projectedOutcomes = { estimatedValue: calculatePatentValue(project.outcomes?.marketPotential || 1000000, project.intellectualProperty?.patentExpiration || new Date(Date.now() + 20*365*24*60*60*1000), project.phase || 'preclinical') }; // Simple projection

        return {
          ...project,
          metrics: {
            trialTimeline,
            researchRisk,
            fundingEfficiency,
            successProbability,
            regulatoryTimeline,
            patentValue,
            projectedOutcomes
          }
        };
      })
    );

    // Calculate aggregate metrics
    const totalProjects = projectsWithMetrics.length;
    const activeProjects = projectsWithMetrics.filter(p => ['planning', 'recruiting', 'active'].includes(p.status)).length;
    const completedProjects = projectsWithMetrics.filter(p => p.status === 'completed').length;
    const totalFunding = projectsWithMetrics.reduce((sum, p) => sum + (p.funding?.totalBudget || 0), 0);
    const averageSuccessProbability = projectsWithMetrics.reduce((sum, p) => sum + p.metrics.successProbability, 0) / totalProjects || 0;
    const totalPatentValue = projectsWithMetrics.reduce((sum, p) => sum + p.metrics.patentValue, 0);

    return createSuccessResponse({
      research: projectsWithMetrics,
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalFunding,
        averageSuccessProbability: Math.round(averageSuccessProbability * 100) / 100,
        totalPatentValue: Math.round(totalPatentValue)
      }
    });

  } catch (error) {
    console.error('Error fetching research projects:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/healthcare/research
 * Create a new research project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json();
    const validatedData = createResearchProjectSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate initial metrics
    const trialTimeline = calculateTrialTimeline(validatedData.phase || 'phase1', validatedData.participants?.targetCount || 0);

    const researchRisk = calculateResearchRisk(
      validatedData.researchType,
      validatedData.phase || 'preclinical',
      validatedData.regulatory || {}
    );

    const successProbability = calculateDrugSuccessProbability(
      validatedData.phase || 'preclinical',
      validatedData.therapeuticArea || 'General',
      1 // Default company experience
    );

    // Validate research project metrics
    const metricsValidation = validateHealthcareMetrics({
      timeline: trialTimeline,
      risk: researchRisk,
      successProbability,
      funding: validatedData.funding.totalBudget
    });

    if (!metricsValidation.isValid) {
      return createErrorResponse('Research project metrics validation failed', ErrorCode.BAD_REQUEST, 400);
    }

    // Create research project
    const researchProject = new ResearchProject({
      ...validatedData,
      company: validatedData.company,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await researchProject.save();
    await researchProject.populate('company', 'name industry');

    return createSuccessResponse({
      research: researchProject,
      message: 'Research project created successfully'
    }, undefined, 201);

  } catch (error) {
    console.error('Error creating research project:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid research project data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}