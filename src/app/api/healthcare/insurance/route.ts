/**
 * @fileoverview Healthcare Insurance API endpoint
 * @description CRUD operations for health insurance company management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import HealthcareInsurance from '@/lib/db/models/healthcare/HealthcareInsurance';
import Company from '@/lib/db/models/Company';
import {
  validateHealthcareLicense,
  validateHealthcareMetrics,
  calculateHealthcareInflation
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for creating healthcare insurance companies
const createHealthcareInsuranceSchema = z.object({
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
  insuranceType: z.enum(['hmo', 'ppo', 'epo', 'pos', 'medicare_advantage', 'medicaid_managed', 'aca_compliant']),
  marketSegment: z.enum(['individual', 'small_group', 'large_group', 'medicare', 'medicaid', 'dual_eligible']),
  serviceArea: z.array(z.string()).min(1), // States/counties served
  network: z.object({
    hospitals: z.number().min(0),
    physicians: z.number().min(0),
    specialists: z.number().min(0),
    urgentCare: z.number().min(0),
    pharmacies: z.number().min(0),
    networkAdequacy: z.object({
      primaryCare: z.number().min(0).max(100), // % of PCPs accessible within time/distance
      specialists: z.number().min(0).max(100),
      hospitals: z.number().min(0).max(100)
    })
  }),
  company: z.string(), // Company ID that owns this insurance company
  enrollment: z.object({
    totalMembers: z.number().min(0),
    individualMembers: z.number().min(0),
    groupMembers: z.number().min(0),
    medicareMembers: z.number().min(0),
    medicaidMembers: z.number().min(0),
    monthlyGrowth: z.number(), // % monthly growth rate
    churnRate: z.number().min(0).max(100) // % annual churn
  }),
  financials: z.object({
    annualPremiumRevenue: z.number().min(0),
    annualClaimsPaid: z.number().min(0),
    annualAdministrativeCosts: z.number().min(0),
    investmentIncome: z.number().min(0),
    reserves: z.number().min(0),
    reinsuranceCosts: z.number().min(0),
    riskAdjustmentPayments: z.number().min(0),
    qualityIncentivePayments: z.number().min(0)
  }),
  underwriting: z.object({
    riskScore: z.number().min(0).max(100), // Overall risk assessment
    morbidityIndex: z.number().min(0), // Expected vs actual health costs
    geographicRisk: z.number().min(0).max(100), // Regional health risk factors
    demographicRisk: z.number().min(0).max(100), // Age/gender/health risk profile
    utilizationManagement: z.object({
      priorAuthorization: z.boolean(),
      stepTherapy: z.boolean(),
      caseManagement: z.boolean(),
      diseaseManagement: z.boolean()
    })
  }),
  claims: z.object({
    totalClaims: z.number().min(0),
    averageClaimCost: z.number().min(0),
    claimsProcessingTime: z.number().min(0), // Days
    denialRate: z.number().min(0).max(100), // % of claims denied
    appealRate: z.number().min(0).max(100), // % of denials appealed
    appealSuccessRate: z.number().min(0).max(100), // % of appeals won
    fraudDetection: z.object({
      claimsReviewed: z.number().min(0),
      fraudDetected: z.number().min(0),
      recoveryAmount: z.number().min(0)
    })
  }),
  quality: z.object({
    ncqaRating: z.enum(['1', '2', '3', '4', '5', 'not_rated']),
    hcahpsScore: z.number().min(0).max(100), // Hospital Consumer Assessment
    starRating: z.number().min(1).max(5), // Medicare Star Rating
    readmissionRate: z.number().min(0).max(100),
    preventiveCareRate: z.number().min(0).max(100),
    chronicDiseaseManagement: z.number().min(0).max(100)
  }),
  regulatory: z.object({
    stateLicenses: z.array(z.string()),
    federalCompliance: z.boolean(),
    acaCompliant: z.boolean(),
    medicareContract: z.boolean(),
    medicaidContract: z.boolean(),
    lastAuditDate: z.date().optional(),
    complianceViolations: z.number().min(0),
    regulatoryFines: z.number().min(0)
  }),
  products: z.array(z.object({
    productName: z.string(),
    productType: z.enum(['hmo', 'ppo', 'epo', 'pos', 'medicare', 'medicaid']),
    metalLevel: z.enum(['bronze', 'silver', 'gold', 'platinum', 'catastrophic']).optional(),
    premium: z.number().min(0),
    deductible: z.number().min(0),
    outOfPocketMax: z.number().min(0),
    enrollment: z.number().min(0),
    marketShare: z.number().min(0).max(100)
  })).optional()
});

/**
 * GET /api/healthcare/insurance
 * Get all healthcare insurance companies for the authenticated user's companies
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

    const insuranceCompanies = await HealthcareInsurance
      .find({ ownedBy: { $in: companyIds } })
      .populate('ownedBy', 'name industry')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate comprehensive metrics for each insurance company
    const companiesWithMetrics = await Promise.all(
      insuranceCompanies.map(async (company: any) => {
        // Calculate basic metrics using available functions
        const licenseValid = validateHealthcareLicense('Medical', company.regulatory?.licenseNumber || '', company.location?.state || '');

        const totalEnrollment = company.enrollment?.totalMembers || 0;
        const totalPremiums = company.financials?.annualPremiums || 0;
        const totalClaims = company.claims?.totalPaid || 0;

        const premiums = totalPremiums / Math.max(totalEnrollment, 1); // Premium per member
        const claimRatios = totalClaims / Math.max(totalPremiums, 1); // Loss ratio
        const underwritingProfit = totalPremiums - totalClaims; // Simple profit calculation
        const riskPoolStability = totalEnrollment > 1000 ? 'Stable' : 'Developing'; // Simple stability
        const networkAdequacy = company.network?.providers?.length || 0; // Provider count
        const memberSatisfaction = company.quality?.satisfactionScore || 75; // Default satisfaction
        const demandProjection = calculateHealthcareInflation(totalEnrollment, 1); // Simple projection

        return {
          ...company,
          metrics: {
            premiums,
            claimRatios,
            underwritingProfit,
            riskPoolStability,
            networkAdequacy,
            memberSatisfaction,
            demandProjection
          }
        };
      })
    );

    // Calculate aggregate metrics
    const totalCompanies = companiesWithMetrics.length;
    const totalMembers = companiesWithMetrics.reduce((sum: number, c: any) => sum + (c.enrollment?.totalMembers || 0), 0);
    const totalPremiumRevenue = companiesWithMetrics.reduce((sum: number, c: any) => sum + (c.financials?.annualPremiumRevenue || 0), 0);
    const totalClaimsPaid = companiesWithMetrics.reduce((sum: number, c: any) => sum + (c.financials?.annualClaimsPaid || 0), 0);
    const averageClaimRatio = totalClaimsPaid / totalPremiumRevenue || 0;
    const averageStarRating = companiesWithMetrics.reduce((sum: number, c: any) => sum + (c.quality?.starRating || 0), 0) / totalCompanies || 0;

    return createSuccessResponse({
      insurance: companiesWithMetrics,
      summary: {
        totalCompanies,
        totalMembers,
        totalPremiumRevenue,
        totalClaimsPaid,
        averageClaimRatio: Math.round(averageClaimRatio * 10000) / 100, // Convert to percentage with 2 decimals
        averageStarRating: Math.round(averageStarRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('Error fetching healthcare insurance companies:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/healthcare/insurance
 * Create a new healthcare insurance company
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json();
    const validatedData = createHealthcareInsuranceSchema.parse(body);

    // Verify company ownership
    const company = await Company.findById(validatedData.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate initial metrics using available functions
    const licenseValid = validateHealthcareLicense('Medical', '', validatedData.location?.state || '');

    const totalEnrollment = validatedData.enrollment?.totalMembers || 0;
    const totalPremiums = validatedData.financials?.annualPremiumRevenue || 0;
    const totalClaims = validatedData.financials?.annualClaimsPaid || 0;

    const premiums = totalPremiums / Math.max(totalEnrollment, 1); // Premium per member
    const claimRatios = totalClaims / Math.max(totalPremiums, 1); // Loss ratio
    const underwritingProfit = totalPremiums - totalClaims; // Simple profit calculation
    const riskPoolStability = totalEnrollment > 1000 ? 100 : 50; // Numeric stability score
    const networkAdequacy = validatedData.network?.hospitals || 0; // Provider count
    const memberSatisfaction = validatedData.quality?.hcahpsScore || 75; // Use HCAHPS score
    const demandProjection = totalEnrollment * 1.05; // 5% annual growth projection

    // Validate insurance company metrics
    const metricsValidation = validateHealthcareMetrics({
      premiums,
      claimRatios,
      underwritingProfit,
      networkAdequacy,
      memberSatisfaction,
      demandProjection
    });

    if (!metricsValidation.isValid) {
      return createErrorResponse('Healthcare insurance company metrics validation failed', ErrorCode.BAD_REQUEST, 400);
    }

    // Create healthcare insurance company
    const insuranceCompany = new HealthcareInsurance({
      ...validatedData,
      ownedBy: validatedData.company,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await insuranceCompany.save();
    await insuranceCompany.populate('ownedBy', 'name industry');

    return createSuccessResponse({
      insurance: insuranceCompany,
      message: 'Healthcare insurance company created successfully'
    }, undefined, 201);

  } catch (error) {
    console.error('Error creating healthcare insurance company:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid healthcare insurance company data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}