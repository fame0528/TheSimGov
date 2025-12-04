/**
 * @fileoverview Individual Clinic API endpoint
 * @description CRUD operations for specific clinic management with efficiency metrics
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import { Clinic, Company } from '@/lib/db/models';
import {
  validateHealthcareLicenseFromAccreditations,
  validateHealthcareMetrics,
  calculateHealthcareInflation,
  calculateClinicEfficiencyFromObjects,
  calculateClinicPatientFlow,
  validateClinicLicense,
  validateClinicMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updateClinicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['primary_care', 'specialty', 'urgent_care', 'dental', 'mental_health', 'surgical']).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }).optional(),
  capacity: z.object({
    examRooms: z.number().min(1).max(50).optional(),
    dailyCapacity: z.number().min(10).max(500).optional(),
    parkingSpaces: z.number().min(0).optional()
  }).optional(),
  specialties: z.array(z.string()).min(1).optional(),
  services: z.array(z.string()).optional(),
  hours: z.object({
    monday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    tuesday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    wednesday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    thursday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    friday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    saturday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    sunday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional()
  }).optional(),
  staffing: z.object({
    physicians: z.number().min(0).optional(),
    nursePractitioners: z.number().min(0).optional(),
    nurses: z.number().min(0).optional(),
    medicalAssistants: z.number().min(0).optional(),
    administrative: z.number().min(0).optional()
  }).optional(),
  technology: z.object({
    electronicHealthRecords: z.boolean().optional(),
    telemedicine: z.boolean().optional(),
    appointmentScheduling: z.boolean().optional(),
    patientPortal: z.boolean().optional()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0).optional(),
    annualCosts: z.number().min(0).optional(),
    payerMix: z.object({
      insurance: z.number().min(0).max(100).optional(),
      selfPay: z.number().min(0).max(100).optional(),
      medicare: z.number().min(0).max(100).optional(),
      medicaid: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  performance: z.object({
    averageWaitTime: z.number().min(0).optional(),
    patientSatisfaction: z.number().min(0).max(100).optional(),
    noShowRate: z.number().min(0).max(100).optional()
  }).optional(),
  accreditations: z.array(z.string()).optional(),
  patientVolume: z.number().min(0).optional()
});

/**
 * GET /api/healthcare/clinics/[id]
 * Get detailed clinic information with real-time metrics
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

    const clinic = await Clinic
      .findById(id)
      .populate('company', 'name industry owner')
      .lean();

    if (!clinic) {
      return createErrorResponse('Clinic not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check ownership
    const company = await Company.findById(clinic.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Clinic not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate comprehensive metrics
    const efficiency = calculateClinicEfficiencyFromObjects(
      clinic.capacity || {},
      clinic.staffing || {},
      clinic.performance || {}
    );

    const patientFlow = calculateClinicPatientFlow(
      clinic.capacity?.dailyCapacity || 100,
      clinic.staffing || {},
      clinic.performance?.averageWaitTime || 0
    );

    // Calculate basic financial metrics
    const financials = clinic.financials || { annualRevenue: 0, annualCosts: 0 };
    const profitability = financials.annualRevenue - financials.annualCosts;
    const profitMargin = financials.annualRevenue > 0 
      ? (profitability / financials.annualRevenue) * 100 
      : 0;

    return createSuccessResponse({
      clinic: {
        ...clinic,
        metrics: {
          efficiency,
          patientFlow,
          financials: {
            profitability,
            profitMargin,
            annualRevenue: financials.annualRevenue,
            annualCosts: financials.annualCosts
          },
          licenseValid: validateClinicLicense(clinic.accreditations || [])
        }
      }
    });

  } catch (error) {
    console.error('Error fetching clinic:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT /api/healthcare/clinics/[id]
 * Update clinic information
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
    const validatedData = updateClinicSchema.parse(body);

    // Find and verify ownership
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return createErrorResponse('Clinic not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(clinic.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Clinic not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Update clinic
    Object.assign(clinic, validatedData);
    clinic.updatedAt = new Date();

    // Recalculate metrics if relevant data changed
    if (validatedData.capacity || validatedData.staffing || validatedData.performance ||
        validatedData.financials || validatedData.services) {

      const efficiency = calculateClinicEfficiencyFromObjects(
        clinic.capacity || {},
        clinic.staffing || {},
        clinic.performance || {}
      );

      const patientFlow = calculateClinicPatientFlow(
        clinic.capacity?.dailyCapacity || 100,
        clinic.staffing || {},
        clinic.performance?.averageWaitTime || 0
      );

      // Calculate basic financial metrics
      const financials = clinic.financials || { annualRevenue: 0, annualCosts: 0 };
      const profitability = (financials.annualRevenue || 0) - (financials.annualCosts || 0);

      // Validate updated metrics
      const metricsValidation = validateClinicMetrics({
        efficiency,
        patientFlow: patientFlow.capacityUtilization,
        financialHealth: profitability > 0
      });

      if (!metricsValidation.isValid) {
        return createErrorResponse('Updated clinic metrics validation failed', ErrorCode.BAD_REQUEST, 400);
      }

      clinic.efficiency = efficiency;
    }

    await clinic.save();
    await clinic.populate('company', 'name industry');

    return createSuccessResponse({
      clinic,
      message: 'Clinic updated successfully'
    });

  } catch (error) {
    console.error('Error updating clinic:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/healthcare/clinics/[id]
 * Delete a clinic
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
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return createErrorResponse('Clinic not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(clinic.company);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Clinic not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Delete clinic
    await Clinic.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Clinic deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting clinic:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}