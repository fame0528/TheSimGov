/**
 * @fileoverview Individual Medical Device API endpoint
 * @description CRUD operations for specific medical device company management
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const medicalDevice = await MedicalDevice
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!medicalDevice) {
      return NextResponse.json({ error: 'Medical device company not found' }, { status: 404 });
    }

    // Check ownership
    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Medical device company not owned by user' }, { status: 403 });
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

    const licenseValid = validateHealthcareLicenseFromAccreditations((medicalDevice as any).accreditations || []);

    const metricsValid = validateHealthcareMetrics({
      totalPortfolioValue,
      productCount: portfolioMetrics.length
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const validatedData = updateMedicalDeviceSchema.parse(body);

    // Find and verify ownership
    const medicalDevice = await MedicalDevice.findById(id);
    if (!medicalDevice) {
      return NextResponse.json({ error: 'Medical device company not found' }, { status: 404 });
    }

    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Medical device company not owned by user' }, { status: 403 });
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

      // Recalculate license validation
      if (validatedData.regulatory) {
        const licenseValid = validateHealthcareLicenseFromAccreditations((medicalDevice as any).accreditations || []);
        // Note: Model doesn't have regulatory.licenseValid field, so we skip setting it
      }

      // Validate updated metrics
      const metricsValid = validateHealthcareMetrics({
        totalPortfolioValue: medicalDevice.products?.reduce((sum: number, product: any) => sum + (product.averageSellingPrice * product.annualUnits), 0) || 0,
        productCount: medicalDevice.products?.length || 0
      });

      if (!metricsValid.isValid) {
        return NextResponse.json({
          error: 'Updated medical device company metrics validation failed',
          details: metricsValid.errors
        }, { status: 400 });
      }
    }

    await medicalDevice.save();
    await medicalDevice.populate('company', 'name industry');

    return NextResponse.json({
      device: medicalDevice,
      message: 'Medical device company updated successfully'
    });

  } catch (error) {
    console.error('Error updating medical device company:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find and verify ownership
    const medicalDevice = await MedicalDevice.findById(id);
    if (!medicalDevice) {
      return NextResponse.json({ error: 'Medical device company not found' }, { status: 404 });
    }

    const company = await Company.findById(medicalDevice.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - Medical device company not owned by user' }, { status: 403 });
    }

    // Delete medical device company
    await MedicalDevice.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Medical device company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medical device company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}