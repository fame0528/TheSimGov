/**
 * @fileoverview Individual Hospital API endpoint
 * @description CRUD operations for specific hospital management with real-time metrics
 * @version 1.0.0
 * @created 2025-11-23
 * @lastModified 2025-11-23
 * @author ECHO v1.3.0 Healthcare Implementation
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import { connectDB } from '@/lib/db/mongoose';
import { Hospital, Company } from '@/lib/db/models';
import {
  calculateHospitalQualityScore,
  calculateHospitalCapacityUtilization,
  calculateHospitalFinancialProjection,
  calculateHospitalPatientSatisfaction,
  validateHospitalLicense,
  calculateHospitalInflationAdjustment,
  validateHospitalMetrics
} from '@/lib/utils/healthcare';
import { z } from 'zod';

// Validation schema for updates
const updateHospitalSchema = z.object({
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
  capacity: z.object({
    beds: z.number().min(1).max(5000).optional(),
    icuBeds: z.number().min(0).optional(),
    emergencyRooms: z.number().min(0).optional(),
    operatingRooms: z.number().min(0).optional()
  }).optional(),
  specialties: z.array(z.string()).min(1).optional(),
  services: z.array(z.string()).optional(),
  qualityMetrics: z.object({
    patientSatisfaction: z.number().min(0).max(100).optional(),
    infectionRate: z.number().min(0).max(100).optional(),
    readmissionRate: z.number().min(0).max(100).optional(),
    averageStay: z.number().min(0).optional()
  }).optional(),
  financials: z.object({
    annualRevenue: z.number().min(0).optional(),
    annualCosts: z.number().min(0).optional(),
    insuranceMix: z.object({
      medicare: z.number().min(0).max(100).optional(),
      medicaid: z.number().min(0).max(100).optional(),
      private: z.number().min(0).max(100).optional(),
      selfPay: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  staffing: z.object({
    physicians: z.number().min(0).optional(),
    nurses: z.number().min(0).optional(),
    supportStaff: z.number().min(0).optional()
  }).optional(),
  technology: z.object({
    electronicHealthRecords: z.boolean().optional(),
    telemedicine: z.boolean().optional(),
    roboticSurgery: z.boolean().optional(),
    aiDiagnostics: z.boolean().optional()
  }).optional(),
  accreditations: z.array(z.string()).optional(),
  occupancyRate: z.number().min(0).max(100).optional()
});

/**
 * GET /api/healthcare/hospitals/[id]
 * Get detailed hospital information with real-time metrics
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

    const hospital = await Hospital
      .findById(id)
      .populate('ownedBy', 'name industry owner')
      .lean();

    if (!hospital) {
      return createErrorResponse('Hospital not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check if user owns the company that owns the hospital
    const company = await Company.findById(hospital.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Hospital not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Calculate comprehensive metrics using correct utility signatures
    const capacityUtilization = calculateHospitalCapacityUtilization(
      hospital.capacity?.occupiedBeds || 0,
      hospital.capacity?.beds || 100,
      hospital.qualityMetrics?.averageStay || 5
    );

    const qualityScore = calculateHospitalQualityScore(
      hospital.qualityMetrics?.patientSatisfaction || 75,
      hospital.qualityMetrics?.mortalityRate || 2.5,
      hospital.qualityMetrics?.readmissionRate || 15,
      hospital.accreditations?.status || 'None'
    );

    const financialProjection = calculateHospitalFinancialProjection(
      hospital.financials?.annualRevenue || 0,
      hospital.financials?.annualCosts || 0,
      hospital.financials?.projectedGrowth || 0.05,
      5 // years
    );

    const patientSatisfaction = calculateHospitalPatientSatisfaction(
      hospital.qualityMetrics?.waitTime || 30,
      hospital.qualityMetrics?.staffRating || 80,
      hospital.qualityMetrics?.facilityRating || 75,
      hospital.qualityMetrics?.communicationRating || 85
    );

    const licenseValid = validateHospitalLicense(
      hospital.accreditations?.licenseNumber || '',
      hospital.location?.state || '',
      hospital.accreditations?.status || 'None'
    );

    // Calculate inflation-adjusted projections
    const inflationAdjusted = calculateHospitalInflationAdjustment(
      hospital.financials?.annualRevenue || 0,
      3 // 3-year projection
    );

    return createSuccessResponse({
      hospital: {
        ...hospital,
        metrics: {
          capacityUtilization,
          qualityScore,
          financialProjection,
          patientSatisfaction,
          licenseValid,
          inflationAdjusted
        }
      }
    });

  } catch (error) {
    console.error('Error fetching hospital:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PUT /api/healthcare/hospitals/[id]
 * Update hospital information
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
    const validatedData = updateHospitalSchema.parse(body);

    // Find and verify ownership
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return createErrorResponse('Hospital not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(hospital.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Hospital not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Update hospital
    Object.assign(hospital, validatedData);
    hospital.updatedAt = new Date();

    // Recalculate metrics if relevant data changed
    if (validatedData.qualityMetrics || validatedData.staffing || validatedData.technology ||
        validatedData.capacity || validatedData.financials || validatedData.services) {

      const qualityScore = calculateHospitalQualityScore(
        hospital.qualityMetrics?.patientSatisfaction || 75,
        hospital.qualityMetrics?.mortalityRate || 2.5,
        hospital.qualityMetrics?.readmissionRate || 15,
        hospital.accreditations?.status || 'None'
      );

      const capacityUtilization = calculateHospitalCapacityUtilization(
        hospital.capacity?.occupiedBeds || 0,
        hospital.capacity?.beds || 100,
        hospital.qualityMetrics?.averageStay || 5
      );

      const financialProjection = calculateHospitalFinancialProjection(
        hospital.financials?.annualRevenue || 0,
        hospital.financials?.annualCosts || 0,
        hospital.financials?.projectedGrowth || 0.05,
        5 // years
      );

      const patientSatisfaction = calculateHospitalPatientSatisfaction(
        hospital.qualityMetrics?.waitTime || 30,
        hospital.qualityMetrics?.staffRating || 80,
        hospital.qualityMetrics?.facilityRating || 75,
        hospital.qualityMetrics?.communicationRating || 85
      );

      // Validate updated metrics
      const metricsValidation = validateHospitalMetrics({
        qualityScore,
        capacityUtilization,
        patientSatisfaction,
        financialHealth: financialProjection[0] > 0
      });

      if (!metricsValidation.isValid) {
        return createErrorResponse('Updated hospital metrics validation failed', ErrorCode.BAD_REQUEST, 400);
      }

      hospital.qualityScore = qualityScore;
    }

    await hospital.save();
    await hospital.populate('ownedBy', 'name industry');

    return createSuccessResponse({
      hospital,
      message: 'Hospital updated successfully'
    });

  } catch (error) {
    console.error('Error updating hospital:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid update data', ErrorCode.BAD_REQUEST, 400);
    }
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/healthcare/hospitals/[id]
 * Delete a hospital
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
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return createErrorResponse('Hospital not found', ErrorCode.NOT_FOUND, 404);
    }

    const company = await Company.findById(hospital.ownedBy);
    if (!company || company.owner?.toString() !== session.user.id) {
      return createErrorResponse('Unauthorized - Hospital not owned by user', ErrorCode.FORBIDDEN, 403);
    }

    // Delete hospital
    await Hospital.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Hospital deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hospital:', error);
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500);
  }
}