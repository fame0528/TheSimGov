/**
 * @fileoverview Individual Healthcare Insurance API endpoint
 * @description CRUD operations for specific health insurance company management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import HealthcareInsurance from '@/lib/db/models/healthcare/HealthcareInsurance';
import Company from '@/lib/db/models/Company';
import {
  validateHealthcareLicense,
  validateHealthcareMetrics,
  calculateHealthcareInflation,
  validateInsuranceMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updateHealthcareInsuranceSchema = z.object({
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
  insuranceType: z.enum(['hmo', 'ppo', 'epo', 'pos', 'medicare_advantage', 'medicaid_managed', 'aca_compliant']).optional(),
  marketSegment: z.enum(['individual', 'small_group', 'large_group', 'medicare', 'medicaid', 'dual_eligible']).optional(),
  serviceArea: z.array(z.string()).optional(),
  network: z.object({
    hospitals: z.number().min(0).optional(),
    physicians: z.number().min(0).optional(),
    specialists: z.number().min(0).optional(),
    urgentCare: z.number().min(0).optional(),
    pharmacies: z.number().min(0).optional(),
    networkAdequacy: z.object({
      primaryCare: z.number().min(0).max(100).optional(),
      specialists: z.number().min(0).max(100).optional(),
      hospitals: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  enrollment: z.object({
    totalMembers: z.number().min(0).optional(),
    individualMembers: z.number().min(0).optional(),
    groupMembers: z.number().min(0).optional(),
    medicareMembers: z.number().min(0).optional(),
    medicaidMembers: z.number().min(0).optional(),
    monthlyGrowth: z.number().optional(),
    churnRate: z.number().min(0).max(100).optional()
  }).optional(),
  financials: z.object({
    annualPremiumRevenue: z.number().min(0).optional(),
    annualClaimsPaid: z.number().min(0).optional(),
    annualAdministrativeCosts: z.number().min(0).optional(),
    investmentIncome: z.number().min(0).optional(),
    reserves: z.number().min(0).optional(),
    reinsuranceCosts: z.number().min(0).optional(),
    riskAdjustmentPayments: z.number().min(0).optional(),
    qualityIncentivePayments: z.number().min(0).optional()
  }).optional(),
  underwriting: z.object({
    riskScore: z.number().min(0).max(100).optional(),
    morbidityIndex: z.number().min(0).optional(),
    geographicRisk: z.number().min(0).max(100).optional(),
    demographicRisk: z.number().min(0).max(100).optional(),
    utilizationManagement: z.object({
      priorAuthorization: z.boolean().optional(),
      stepTherapy: z.boolean().optional(),
      caseManagement: z.boolean().optional(),
      diseaseManagement: z.boolean().optional()
    }).optional()
  }).optional(),
  claims: z.object({
    totalClaims: z.number().min(0).optional(),
    averageClaimCost: z.number().min(0).optional(),
    claimsProcessingTime: z.number().min(0).optional(),
    denialRate: z.number().min(0).max(100).optional(),
    appealRate: z.number().min(0).max(100).optional(),
    appealSuccessRate: z.number().min(0).max(100).optional(),
    fraudDetection: z.object({
      claimsReviewed: z.number().min(0).optional(),
      fraudDetected: z.number().min(0).optional(),
      recoveryAmount: z.number().min(0).optional()
    }).optional()
  }).optional(),
  quality: z.object({
    ncqaRating: z.enum(['1', '2', '3', '4', '5', 'not_rated']).optional(),
    hcahpsScore: z.number().min(0).max(100).optional(),
    starRating: z.number().min(1).max(5).optional(),
    readmissionRate: z.number().min(0).max(100).optional(),
    preventiveCareRate: z.number().min(0).max(100).optional(),
    chronicDiseaseManagement: z.number().min(0).max(100).optional()
  }).optional(),
  regulatory: z.object({
    stateLicenses: z.array(z.string()).optional(),
    federalCompliance: z.boolean().optional(),
    acaCompliant: z.boolean().optional(),
    medicareContract: z.boolean().optional(),
    medicaidContract: z.boolean().optional(),
    lastAuditDate: z.date().optional(),
    complianceViolations: z.number().min(0).optional(),
    regulatoryFines: z.number().min(0).optional()
  }).optional(),
  products: z.array(z.object({
    productName: z.string().optional(),
    productType: z.enum(['hmo', 'ppo', 'epo', 'pos', 'medicare', 'medicaid']).optional(),
    metalLevel: z.enum(['bronze', 'silver', 'gold', 'platinum', 'catastrophic']).optional(),
    premium: z.number().min(0).optional(),
    deductible: z.number().min(0).optional(),
    outOfPocketMax: z.number().min(0).optional(),
    enrollment: z.number().min(0).optional(),
    marketShare: z.number().min(0).max(100).optional()
  })).optional()
});

/**
 * GET /api/healthcare/insurance/[id]
 * Get detailed healthcare insurance company information with real-time metrics
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

    const insuranceCompany = await HealthcareInsurance
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!insuranceCompany) {
      return NextResponse.json({ error: 'Healthcare insurance company not found' }, { status: 404 });
    }

    // Check ownership
    const company = await Company.findById(insuranceCompany.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Healthcare insurance company not owned by user' }, { status: 403 });
    }

    // Calculate comprehensive metrics
    const premiums = insuranceCompany.products?.reduce((sum, product) => sum + (product.premium || 0), 0) || 0;

    const claimRatios = insuranceCompany.financials?.annualClaimsPaid ? (insuranceCompany.financials.annualClaimsPaid / (insuranceCompany.financials?.annualPremiumRevenue || 1)) * 100 : 0;

    const underwritingProfit = (insuranceCompany.financials?.annualPremiumRevenue || 0) - (insuranceCompany.financials?.annualAdministrativeCosts || 0) - (insuranceCompany.financials?.annualClaimsPaid || 0);

    const riskPoolStability = insuranceCompany.enrollment?.totalMembers ? (insuranceCompany.financials?.annualClaimsPaid || 0) / insuranceCompany.enrollment.totalMembers : 0;

    const networkAdequacy = insuranceCompany.enrollment?.totalMembers ? (insuranceCompany.network?.hospitals || 0 + insuranceCompany.network?.physicians || 0) / insuranceCompany.enrollment.totalMembers : 0;

    const memberSatisfaction = insuranceCompany.quality?.satisfactionScore || 75;

    const demandProjection = insuranceCompany.enrollment?.monthlyGrowth ? insuranceCompany.enrollment.monthlyGrowth * 12 : 0;

    return NextResponse.json({
      insurance: {
        ...insuranceCompany,
        metrics: {
          premiums,
          claimRatios,
          underwritingProfit,
          riskPoolStability,
          networkAdequacy,
          memberSatisfaction,
          demandProjection
        }
      }
    });

  } catch (error) {
    console.error('Error fetching healthcare insurance company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/healthcare/insurance/[id]
 * Update healthcare insurance company information
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
    const validatedData = updateHealthcareInsuranceSchema.parse(body);

    // Find and verify ownership
    const insuranceCompany = await HealthcareInsurance.findById(id);
    if (!insuranceCompany) {
      return NextResponse.json({ error: 'Healthcare insurance company not found' }, { status: 404 });
    }

    const company = await Company.findById(insuranceCompany.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Healthcare insurance company not owned by user' }, { status: 403 });
    }

    // Update insurance company
    Object.assign(insuranceCompany, validatedData);
    insuranceCompany.updatedAt = new Date();

    // Recalculate metrics if key data changed
    if (validatedData.products || validatedData.enrollment || validatedData.financials || validatedData.claims) {
      // Recalculate all metrics
      const premiums = insuranceCompany.products?.reduce((sum, product) => sum + (product.premium || 0), 0) || 0;

      const claimRatios = insuranceCompany.financials?.annualClaimsPaid ? (insuranceCompany.financials.annualClaimsPaid / (insuranceCompany.financials?.annualPremiumRevenue || 1)) * 100 : 0;

      const underwritingProfit = (insuranceCompany.financials?.annualPremiumRevenue || 0) - (insuranceCompany.financials?.annualAdministrativeCosts || 0) - (insuranceCompany.financials?.annualClaimsPaid || 0);

      // Validate updated metrics
      const metricsValidation = validateInsuranceMetrics({
        claimRatio: claimRatios,
        underwritingProfit: underwritingProfit,
        riskPoolStability: underwritingProfit,
        networkAdequacy: insuranceCompany.network?.networkAdequacy?.primaryCare || 0
      });

      if (!metricsValidation.isValid) {
        return NextResponse.json({
          error: 'Updated healthcare insurance company metrics validation failed',
          details: metricsValidation.errors
        }, { status: 400 });
      }
    }

    await insuranceCompany.save();
    await insuranceCompany.populate('ownedBy', 'name industry');

    return NextResponse.json({
      insurance: insuranceCompany,
      message: 'Healthcare insurance company updated successfully'
    });

  } catch (error) {
    console.error('Error updating healthcare insurance company:', error);
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
 * DELETE /api/healthcare/insurance/[id]
 * Delete a healthcare insurance company
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
    const insuranceCompany = await HealthcareInsurance.findById(id);
    if (!insuranceCompany) {
      return NextResponse.json({ error: 'Healthcare insurance company not found' }, { status: 404 });
    }

    const company = await Company.findById(insuranceCompany.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Healthcare insurance company not owned by user' }, { status: 403 });
    }

    // Delete healthcare insurance company
    await HealthcareInsurance.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Healthcare insurance company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting healthcare insurance company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}