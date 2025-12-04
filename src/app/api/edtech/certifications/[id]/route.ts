/**
 * @file src/app/api/edtech/certifications/[id]/route.ts
 * @description API endpoints for individual certification operations
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing individual professional certifications. Supports getting certification
 * details, updating certification metrics (enrollments, pass rates, market demand), and
 * deleting certifications.
 * 
 * ENDPOINTS:
 * GET /api/edtech/certifications/:id - Get certification details
 * PATCH /api/edtech/certifications/:id - Update certification
 * DELETE /api/edtech/certifications/:id - Delete certification
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import Certification from '@/lib/db/models/edtech/Certification';

/**
 * GET /api/edtech/certifications/:id
 * 
 * @description Get certification details by ID
 * 
 * @param {string} id - Certification ID
 * 
 * @returns {Object} Certification document with company details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;

    const certification = await Certification.findById(id)
      .populate('company', 'name industry')
      .lean();

    if (!certification) {
      return createErrorResponse('Certification not found', ErrorCode.NOT_FOUND, 404);
    }

    return createSuccessResponse(certification);
  } catch (error) {
    console.error('GET /api/edtech/certifications/:id error:', error);
    return createErrorResponse('Failed to fetch certification', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH /api/edtech/certifications/:id
 * 
 * @description Update certification properties
 * 
 * @param {string} id - Certification ID
 * @body {number} totalEnrolled - Updated total enrolled
 * @body {number} currentCertified - Updated current certified
 * @body {number} passed - Updated passed count
 * @body {number} failed - Updated failed count
 * @body {number} averageScore - Updated average score
 * @body {number} employerRecognition - Updated employer recognition
 * @body {number} salaryIncrease - Updated salary increase
 * @body {number} jobPostings - Updated job postings count
 * @body {number} totalRevenue - Updated total revenue
 * @body {number} monthlyRevenue - Updated monthly revenue
 * @body {boolean} active - Updated active status
 * 
 * @returns {Object} Updated certification document
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const certification = await Certification.findById(id);
    if (!certification) {
      return createErrorResponse('Certification not found', ErrorCode.NOT_FOUND, 404);
    }

    // Update allowed fields
    const allowedUpdates = [
      'name',
      'description',
      'prerequisites',
      'examDuration',
      'questionCount',
      'passingScore',
      'examFormat',
      'handsOnLabs',
      'validityPeriod',
      'renewalRequired',
      'renewalFee',
      'continuingEducation',
      'examFee',
      'retakeFee',
      'trainingMaterialsFee',
      'membershipFee',
      'totalEnrolled',
      'currentCertified',
      'passed',
      'failed',
      'averageScore',
      'employerRecognition',
      'salaryIncrease',
      'jobPostings',
      'marketDemand',
      'totalRevenue',
      'monthlyRevenue',
      'operatingCost',
      'active',
    ];

    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        (certification as unknown as Record<string, unknown>)[key] = body[key];
      }
    });

    await certification.save();

    return createSuccessResponse(certification);
  } catch (error) {
    console.error('PATCH /api/edtech/certifications/:id error:', error);
    
    if ((error as { name?: string }).name === 'ValidationError') {
      return createErrorResponse('Validation error', ErrorCode.VALIDATION_ERROR, 400, (error as { errors?: unknown }).errors);
    }

    return createErrorResponse('Failed to update certification', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * DELETE /api/edtech/certifications/:id
 * 
 * @description Delete certification (soft delete by setting active=false)
 * 
 * @param {string} id - Certification ID
 * 
 * @returns {Object} Success message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { id } = await params;

    const certification = await Certification.findById(id);
    if (!certification) {
      return createErrorResponse('Certification not found', ErrorCode.NOT_FOUND, 404);
    }

    // Soft delete
    certification.active = false;
    await certification.save();

    return createSuccessResponse({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/edtech/certifications/:id error:', error);
    return createErrorResponse('Failed to delete certification', ErrorCode.INTERNAL_ERROR, 500);
  }
}
