/**
 * @fileoverview Individual Medical Device API endpoint
 * @description CRUD operations for specific medical device company management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import MedicalDevice from '@/lib/db/models/healthcare/MedicalDevice';
import Company from '@/lib/db/models/Company';
import {
  calculateDeviceReimbursementSimple,
  determineDeviceClassFromApproval,
  validateHealthcareLicenseFromAccreditations,
  validateHealthcareMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updateMedicalDeviceSchema = z.object({
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
  companyType: z.enum(['orthopedic', 'cardiovascular', 'neurological', 'diagnostic', 'surgical', 'implantable']).optional(),
  products: z.array(z.object({
    name: z.string().optional(),
    deviceClass: z.enum(['Class I', 'Class II', 'Class III']).optional(),
    fdaApproval: z.enum(['510(k)', 'PMA', 'De Novo', 'HDE']).optional(),
    approvalDate: z.date().optional(),
    reimbursementCode: z.string().optional(),
    averageSellingPrice: z.number().min(0).optional(),
    annualUnits: z.number().min(0).optional(),
    marketShare: z.number().min(0).max(100).optional()
  })).optional(),
  manufacturing: z.object({
    facilities: z.number().min(0).optional(),
    certifications: z.array(z.string()).optional(),
    qualitySystems: z.array(z.string()).optional()
  }).optional(),
  regulatory: z.object({
    fdaClearances: z.number().min(0).optional(),
    recalls: z.number().min(0).optional(),
    warningLetters: z.number().min(0).optional(),
    complianceScore: z.number().min(0).max(100).optional()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0).optional(),
    annualCosts: z.number().min(0).optional(),
    rAndBudget: z.number().min(0).optional(),
    revenueBySegment: z.object({
      hospitals: z.number().min(0).max(100).optional(),
      clinics: z.number().min(0).max(100).optional(),
      physicians: z.number().min(0).max(100).optional(),
      international: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  marketPosition: z.object({
    marketShare: z.number().min(0).max(100).optional(),
    competitiveAdvantages: z.array(z.string()).optional(),
    targetMarkets: z.array(z.string()).optional()
  }).optional(),
  portfolioValue: z.number().min(0).optional()
});

/**
 * GET /api/healthcare/devices/[id]
 * Get detailed medical device company information with real-time metrics
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

    const medicalDevice = await MedicalDevice
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!medicalDevice) {
      return createErrorResponse('Medical device company not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check ownership
    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Medical device company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate comprehensive metrics
    const portfolioMetrics = await Promise.all(
      (medicalDevice.products || []).map(async (product: any) => {
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

    const totalPortfolioValue = portfolioMetrics.reduce((sum: number, product: any) => sum + (product.averageSellingPrice * product.annualUnits), 0);

    // Use qualityCertifications for device license validation (accreditations doesn't exist on MedicalDevice)
    const licenseValid = validateHealthcareLicenseFromAccreditations(medicalDevice.qualityCertifications || []);

    const metricsValid = validateHealthcareMetrics({
      totalPortfolioValue,
      productCount: portfolioMetrics.length
    });

    return createSuccessResponse({
      device: {
        ...medicalDevice,
        products: portfolioMetrics,
        metrics: {
          totalPortfolioValue,
          licenseValid,
          metricsValid: metricsValid.isValid
        }
      }
    });

  } catch (error) {
    console.error('Error fetching medical device company:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT /api/healthcare/devices/[id]
 * Update medical device company information
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
    const validatedData = updateMedicalDeviceSchema.parse(body);

    // Find and verify ownership
    const medicalDevice = await MedicalDevice.findById(id);
    if (!medicalDevice) {
      return createErrorResponse('Medical device company not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Medical device company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Update medical device company
    Object.assign(medicalDevice, validatedData);
    medicalDevice.updatedAt = new Date();

    // Recalculate metrics if portfolio or regulatory data changed
    if (validatedData.products) {
      // Recalculate portfolio metrics
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

      medicalDevice.products = portfolioWithMetrics;

      // Recalculate license validation using qualityCertifications
      if (validatedData.regulatory) {
        const licenseValid = validateHealthcareLicenseFromAccreditations(medicalDevice.qualityCertifications || []);
        // Note: Model doesn't have regulatory.licenseValid field, so we skip setting it
      }

      // Validate updated metrics
      const metricsValid = validateHealthcareMetrics({
        totalPortfolioValue: medicalDevice.products?.reduce((sum: number, product: any) => sum + (product.averageSellingPrice * product.annualUnits), 0) || 0,
        productCount: medicalDevice.products?.length || 0
      });

      if (!metricsValid.isValid) {
        return createErrorResponse('Updated medical device company metrics validation failed', ErrorCode.BAD_REQUEST, 400);
      }
    }

    await medicalDevice.save();
    await medicalDevice.populate('company', 'name industry');

    return createSuccessResponse({
      device: medicalDevice,
      message: 'Medical device company updated successfully'
    });

  } catch (error) {
    console.error('Error updating medical device company:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/healthcare/devices/[id]
 * Delete a medical device company
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
    const medicalDevice = await MedicalDevice.findById(id);
    if (!medicalDevice) {
      return createErrorResponse('Medical device company not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Medical device company not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Delete medical device company
    await MedicalDevice.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Medical device company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medical device company:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}