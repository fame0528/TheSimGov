/**
 * @fileoverview Individual Pharmaceutical API endpoint
 * @description CRUD operations for specific pharmaceutical company management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Pharmaceutical from '@/lib/db/models/healthcare/Pharmaceutical';
import Company from '@/lib/db/models/Company';
import {
  calculateDrugSuccessProbability,
  calculatePatentValue,
  calculateClinicalTrialTimeline,
  calculateRegulatoryCompliance,
  calculateDrugDevelopmentCosts,
  validatePharmaceuticalLicense,
  calculateMarketPotential,
  validatePharmaceuticalMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updatePharmaceuticalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }).optional(),
  companyType: z.enum(['big_pharma', 'biotech', 'generic', 'specialty']).optional(),
  therapeuticAreas: z.array(z.string()).min(1).optional(),
  pipeline: z.array(z.object({
    drugName: z.string().optional(),
    therapeuticArea: z.string().optional(),
    developmentStage: z.enum(['discovery', 'preclinical', 'phase1', 'phase2', 'phase3', 'filing', 'approved']).optional(),
    targetIndication: z.string().optional(),
    mechanismOfAction: z.string().optional(),
    estimatedMarketSize: z.number().min(0).optional(),
    patentExpiration: z.date().optional(),
    clinicalTrials: z.array(z.object({
      phase: z.enum(['phase1', 'phase2', 'phase3']).optional(),
      status: z.enum(['recruiting', 'active', 'completed', 'terminated']).optional(),
      patientCount: z.number().min(0).optional(),
      startDate: z.date().optional(),
      estimatedCompletion: z.date().optional(),
      successProbability: z.number().min(0).max(100).optional()
    })).optional()
  })).optional(),
  manufacturing: z.object({
    facilities: z.number().min(0).optional(),
    capacity: z.number().min(0).optional(),
    certifications: z.array(z.string()).optional()
  }).optional(),
  regulatory: z.object({
    fdaApprovals: z.number().min(0).optional(),
    euApprovals: z.number().min(0).optional(),
    warningLetters: z.number().min(0).optional(),
    complianceScore: z.number().min(0).max(100).optional()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0).optional(),
    rAndBudget: z.number().min(0).optional(),
    annualCosts: z.number().min(0).optional(),
    revenueBySegment: z.object({
      branded: z.number().min(0).max(100).optional(),
      generic: z.number().min(0).max(100).optional(),
      biosimilars: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  partnerships: z.array(z.object({
    partnerName: z.string().optional(),
    partnershipType: z.enum(['research', 'licensing', 'manufacturing', 'distribution']).optional(),
    startDate: z.date().optional(),
    revenueShare: z.number().min(0).max(100).optional()
  })).optional(),
  pipelineValue: z.number().min(0).optional()
});

/**
 * GET /api/healthcare/pharmaceuticals/[id]
 * Get detailed pharmaceutical company information with real-time metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const pharmaceutical = await Pharmaceutical
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!pharmaceutical) {
      return NextResponse.json({ error: 'Pharmaceutical company not found' }, { status: 404 });
    }

    // Check ownership
    const company = await Company.findById(pharmaceutical.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Pharmaceutical company not owned by user' }, { status: 403 });
    }

    // Calculate comprehensive metrics
    const pipelineMetrics = await Promise.all(
      (pharmaceutical.pipeline || []).map(async (drug: any) => {
        const successProb = calculateDrugSuccessProbability(
          drug.developmentStage,
          drug.clinicalTrials || [],
          drug.targetIndication
        );

        const patentValue = drug.patentExpiration ?
          calculatePatentValue(drug.estimatedMarketSize, drug.patentExpiration, drug.developmentStage) : 0;

        const trialTimeline = calculateClinicalTrialTimeline(
          drug.developmentStage,
          drug.clinicalTrials || []
        );

        return {
          ...drug,
          successProbability: successProb,
          patentValue,
          trialTimeline
        };
      })
    );

    const totalPipelineValue = pipelineMetrics.reduce((sum, drug) => sum + drug.patentValue, 0);

    const regulatoryCompliance = calculateRegulatoryCompliance(
      pharmaceutical.regulatory?.complianceScore || 80,
      pharmaceutical.fdaApprovals || 0,
      pharmaceutical.regulatory?.warnings || 0
    );

    const developmentCosts = calculateDrugDevelopmentCosts(
      pharmaceutical.pipeline?.[0]?.stage || 'Preclinical',
      pharmaceutical.pipeline?.[0]?.therapeuticArea || 'Other',
      pharmaceutical.pipeline?.[0]?.developmentCost || 100000000
    );

    const marketPotential = calculateMarketPotential(
      pharmaceutical.marketShare || 0.01,
      pharmaceutical.annualRevenue || 1000000,
      pharmaceutical.rdInvestment || 500000,
      pharmaceutical.patentPortfolio || 10
    );

    return NextResponse.json({
      pharmaceutical: {
        ...pharmaceutical,
        pipeline: pipelineMetrics,
        metrics: {
          totalPipelineValue,
          regulatoryCompliance,
          developmentCosts,
          marketPotential,
          licenseValid: validatePharmaceuticalLicense(pharmaceutical.name || '', 'FDA', pharmaceutical.pipeline?.[0]?.patentExpiry || new Date(Date.now() + 365*24*60*60*1000))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pharmaceutical company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/healthcare/pharmaceuticals/[id]
 * Update pharmaceutical company information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const validatedData = updatePharmaceuticalSchema.parse(body);

    // Find and verify ownership
    const pharmaceutical = await Pharmaceutical.findById(id);
    if (!pharmaceutical) {
      return NextResponse.json({ error: 'Pharmaceutical company not found' }, { status: 404 });
    }

    const company = await Company.findById(pharmaceutical.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Pharmaceutical company not owned by user' }, { status: 403 });
    }

    // Update pharmaceutical company
    Object.assign(pharmaceutical, validatedData);
    pharmaceutical.updatedAt = new Date();

    // Recalculate metrics if pipeline or regulatory data changed
    if (validatedData.pipeline || validatedData.regulatory || validatedData.financials) {
      // Recalculate pipeline metrics
      if (validatedData.pipeline) {
        const pipelineWithMetrics = await Promise.all(
          pharmaceutical.pipeline.map(async (drug: any) => {
            const successProb = calculateDrugSuccessProbability(
              drug.developmentStage,
              drug.clinicalTrials || [],
              drug.targetIndication
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

        pharmaceutical.pipeline = pipelineWithMetrics;
        pharmaceutical.pipelineValue = pipelineWithMetrics.reduce((sum, drug) => sum + drug.patentValue, 0);
      }

      // Recalculate regulatory compliance
      if (validatedData.regulatory) {
        const regulatoryCompliance = calculateRegulatoryCompliance(
          pharmaceutical.regulatory?.complianceScore || 80,
          pharmaceutical.fdaApprovals || 0,
          pharmaceutical.regulatory?.warnings || 0
        );
        pharmaceutical.regulatory.complianceScore = regulatoryCompliance;
      }

      // Validate updated metrics
      const metricsValidation = validatePharmaceuticalMetrics({
        pipelineValue: pharmaceutical.pipelineValue,
        regulatoryCompliance: pharmaceutical.regulatory?.complianceScore || 0,
        financialHealth: ((pharmaceutical.financials?.annualRevenue || 0) - (pharmaceutical.financials?.annualCosts || 0)) > 0
      });

      if (!metricsValidation.isValid) {
        return NextResponse.json({
          error: 'Updated pharmaceutical company metrics validation failed',
          details: metricsValidation.errors
        }, { status: 400 });
      }
    }

    await pharmaceutical.save();
    await pharmaceutical.populate('ownedBy', 'name industry');

    return NextResponse.json({
      pharmaceutical,
      message: 'Pharmaceutical company updated successfully'
    });

  } catch (error) {
    console.error('Error updating pharmaceutical company:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
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
 * DELETE /api/healthcare/pharmaceuticals/[id]
 * Delete a pharmaceutical company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find and verify ownership
    const pharmaceutical = await Pharmaceutical.findById(id);
    if (!pharmaceutical) {
      return NextResponse.json({ error: 'Pharmaceutical company not found' }, { status: 404 });
    }

    const company = await Company.findById(pharmaceutical.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Pharmaceutical company not owned by user' }, { status: 403 });
    }

    // Delete pharmaceutical company
    await Pharmaceutical.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Pharmaceutical company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pharmaceutical company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}