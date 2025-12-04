/**
 * @fileoverview Individual Research Project API endpoint
 * @description CRUD operations for specific clinical trial and research project management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import ResearchProject from '@/lib/db/models/healthcare/ResearchProject';
import Company from '@/lib/db/models/Company';
import {
  calculateTrialTimeline,
  calculateResearchRisk,
  calculateFundingEfficiency,
  calculatePatentValue,
  calculateTrialSuccessProbability,
  calculateRegulatoryTimeline,
  projectResearchOutcomes,
  validateResearchMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updateResearchProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }).optional(),
  researchType: z.enum(['clinical_trial', 'basic_research', 'translational', 'drug_discovery', 'device_development', 'biomarker_research']).optional(),
  therapeuticArea: z.string().min(1).max(100).optional(),
  phase: z.enum(['preclinical', 'phase1', 'phase2', 'phase3', 'phase4', 'post_market']).optional(),
  status: z.enum(['planning', 'recruiting', 'active', 'completed', 'terminated', 'on_hold']).optional(),
  funding: z.object({
    totalBudget: z.number().min(0).optional(),
    fundingSource: z.enum(['government', 'private', 'venture_capital', 'pharma', 'foundation', 'internal']).optional(),
    grantNumber: z.string().optional(),
    sponsors: z.array(z.string()).optional(),
    milestones: z.array(z.object({
      milestone: z.string().optional(),
      amount: z.number().min(0).optional(),
      completed: z.boolean().optional(),
      completionDate: z.date().optional()
    })).optional()
  }).optional(),
  timeline: z.object({
    startDate: z.date().optional(),
    estimatedCompletion: z.date().optional(),
    actualCompletion: z.date().optional(),
    milestones: z.array(z.object({
      milestone: z.string().optional(),
      targetDate: z.date().optional(),
      completed: z.boolean().optional(),
      actualDate: z.date().optional()
    })).optional()
  }).optional(),
  participants: z.object({
    targetCount: z.number().min(0).optional(),
    enrolledCount: z.number().min(0).optional(),
    inclusionCriteria: z.array(z.string()).optional(),
    exclusionCriteria: z.array(z.string()).optional(),
    demographics: z.object({
      ageRange: z.object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional()
      }).optional(),
      gender: z.object({
        male: z.number().min(0).max(100).optional(),
        female: z.number().min(0).max(100).optional(),
        other: z.number().min(0).max(100).optional()
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
    irbApproval: z.boolean().optional(),
    fdaApproval: z.boolean().optional(),
    ethicsCommittee: z.string().optional(),
    protocolNumber: z.string().optional(),
    adverseEvents: z.number().min(0).optional(),
    seriousAdverseEvents: z.number().min(0).optional()
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
    patentsFiled: z.number().min(0).optional(),
    patentsGranted: z.number().min(0).optional(),
    patentApplications: z.array(z.object({
      patentNumber: z.string().optional(),
      title: z.string().optional(),
      filingDate: z.date().optional(),
      grantDate: z.date().optional(),
      expirationDate: z.date().optional()
    })).optional()
  }).optional()
});

/**
 * GET /api/healthcare/research/[id]
 * Get detailed research project information with real-time metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;

    const researchProject = await ResearchProject
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!researchProject) {
      return createErrorResponse('Research project not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check ownership
    const company = await Company.findById(researchProject.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Research project not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate comprehensive metrics
    const trialTimeline = calculateTrialTimeline(
      researchProject.phase,
      researchProject.participants?.targetCount || 100
    );

    const researchRisk = calculateResearchRisk(
      researchProject.researchType,
      researchProject.phase,
      researchProject.regulatory || {}
    );

    const fundingEfficiency = calculateFundingEfficiency(
      researchProject.funding || {},
      researchProject.timeline || {},
      researchProject.status
    );

    const successProbability = calculateTrialSuccessProbability(
      researchProject.phase,
      researchProject.therapeuticArea,
      researchProject.participants || {},
      researchProject.regulatory || {}
    );

    const regulatoryTimeline = calculateRegulatoryTimeline(
      researchProject.phase,
      researchProject.researchType,
      researchProject.regulatory || {}
    );

    const patentValue = calculatePatentValue(
      researchProject.funding?.totalBudget || 1000000,
      researchProject.intellectualProperty?.patentApplications?.[0]?.expirationDate || new Date(Date.now() + 20*365*24*60*60*1000),
      researchProject.phase || 'preclinical'
    );

    const projectedOutcomes = projectResearchOutcomes(
      researchProject.therapeuticArea || 'Other',
      researchProject.researchType || 'Basic',
      researchProject.funding?.totalBudget || 1000000,
      researchProject.timeline?.startDate
    );

    return createSuccessResponse({
      research: {
        ...researchProject,
        metrics: {
          trialTimeline,
          researchRisk,
          fundingEfficiency,
          successProbability,
          regulatoryTimeline,
          patentValue,
          projectedOutcomes
        }
      }
    });

  } catch (error) {
    console.error('Error fetching research project:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT /api/healthcare/research/[id]
 * Update research project information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;

    const body = await request.json();
    const validatedData = updateResearchProjectSchema.parse(body);

    // Find and verify ownership
    const researchProject = await ResearchProject.findById(id);
    if (!researchProject) {
      return createErrorResponse('Research project not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(researchProject.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Research project not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Update research project
    Object.assign(researchProject, validatedData);
    researchProject.updatedAt = new Date();

    // Recalculate metrics if key data changed
    if (validatedData.phase || validatedData.timeline || validatedData.funding || validatedData.regulatory) {
      // Recalculate all metrics
      const trialTimeline = calculateTrialTimeline(
        researchProject.phase,
        researchProject.participants?.targetCount || 100
      );

      const researchRisk = calculateResearchRisk(
        researchProject.researchType,
        researchProject.phase,
        researchProject.regulatory || {}
      );

      const successProbability = calculateTrialSuccessProbability(
        researchProject.phase,
        researchProject.therapeuticArea,
        researchProject.participants || {},
        researchProject.regulatory || {}
      );

      // Validate updated metrics
      const metricsValidation = validateResearchMetrics({
        timeline: trialTimeline,
        risk: researchRisk,
        successProbability,
        funding: researchProject.funding?.totalBudget || 0
      });

      if (!metricsValidation.isValid) {
        return createErrorResponse('Updated research project metrics validation failed', ErrorCode.BAD_REQUEST, 400);
      }
    }

    await researchProject.save();
    await researchProject.populate('ownedBy', 'name industry');

    return createSuccessResponse({
      research: researchProject,
      message: 'Research project updated successfully'
    });

  } catch (error) {
    console.error('Error updating research project:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/healthcare/research/[id]
 * Delete a research project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const { id } = await params;

    // Find and verify ownership
    const researchProject = await ResearchProject.findById(id);
    if (!researchProject) {
      return createErrorResponse('Research project not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(researchProject.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Research project not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Delete research project
    await ResearchProject.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Research project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting research project:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}