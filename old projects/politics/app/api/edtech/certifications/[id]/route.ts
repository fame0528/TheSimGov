/**
 * @file app/api/edtech/certifications/[id]/route.ts
 * @description Individual certification program detail, update, and delete endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles individual certification program operations including fetching details,
 * updating exam metrics (pass rates, enrollment), and program deletion.
 * 
 * ENDPOINTS:
 * - GET /api/edtech/certifications/[id] - Get certification details
 * - PATCH /api/edtech/certifications/[id] - Update certification metrics
 * - DELETE /api/edtech/certifications/[id] - Remove certification
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/databases/[id] route (auth, update patterns)
 * - Certification-specific validation for pass rates and market metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Certification from '@/lib/db/models/Certification';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/edtech/certifications/[id]
 * 
 * Get certification details with calculated metrics
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Fetch certification
    const certification = await Certification.findById(id);
    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(certification.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this certification' }, { status: 403 });
    }

    // Calculate metrics using virtual properties
    const metrics = {
      revenuePerCertified: certification.revenuePerCertified,
      renewalRevenue: certification.renewalRevenue,
      retakeRevenue: certification.retakeRevenue,
      totalExamTakers: certification.totalExamTakers,
      retakeFee: certification.retakeFee,
      renewalFee: certification.renewalFee,
    };

    return NextResponse.json({
      certification,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching certification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/edtech/certifications/[id]
 * 
 * Update certification (pass rates, enrollment, market metrics)
 * 
 * Request Body:
 * {
 *   totalEnrolled?: number;
 *   passed?: number;
 *   failed?: number;
 *   totalRevenue?: number;
 *   employerRecognition?: number;  // 0-100
 *   marketDemand?: number;          // 0-100
 *   active?: boolean;
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      totalEnrolled,
      passed,
      failed,
      totalRevenue,
      employerRecognition,
      marketDemand,
      active,
    } = body;

    await dbConnect();

    // Fetch certification
    const certification = await Certification.findById(id);
    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(certification.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this certification' }, { status: 403 });
    }

    // Track updated fields
    const updatedFields: string[] = [];

    // Update enrollment metrics
    if (totalEnrolled !== undefined) {
      certification.totalEnrolled = totalEnrolled;
      updatedFields.push('totalEnrolled');
    }

    if (passed !== undefined) {
      certification.passed = passed;
      updatedFields.push('passed');
    }

    if (failed !== undefined) {
      certification.failed = failed;
      updatedFields.push('failed');
    }

    // Update revenue
    if (totalRevenue !== undefined) {
      certification.totalRevenue = totalRevenue;
      updatedFields.push('totalRevenue');
    }

    // Update market metrics
    if (employerRecognition !== undefined) {
      if (employerRecognition < 0 || employerRecognition > 100) {
        return NextResponse.json(
          { error: 'Employer recognition must be between 0 and 100' },
          { status: 400 }
        );
      }
      certification.employerRecognition = employerRecognition;
      updatedFields.push('employerRecognition');
    }

    if (marketDemand !== undefined) {
      if (marketDemand < 0 || marketDemand > 100) {
        return NextResponse.json(
          { error: 'Market demand must be between 0 and 100' },
          { status: 400 }
        );
      }
      certification.marketDemand = marketDemand;
      updatedFields.push('marketDemand');
    }

    // Update active status
    if (active !== undefined) {
      certification.active = active;
      updatedFields.push('active');
    }

    // Save updates (triggers pre-save hooks for pass rate calculation)
    await certification.save();

    // Calculate metrics
    const metrics = {
      revenuePerCertified: certification.revenuePerCertified,
      renewalRevenue: certification.renewalRevenue,
      retakeRevenue: certification.retakeRevenue,
      totalExamTakers: certification.totalExamTakers,
      passRate: certification.passRate,
    };

    return NextResponse.json({
      certification,
      updated: updatedFields,
      metrics,
      message: `Certification updated successfully. Updated fields: ${updatedFields.join(', ')}`,
    });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/edtech/certifications/[id]
 * 
 * Delete certification program
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Fetch certification
    const certification = await Certification.findById(id);
    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(certification.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this certification' }, { status: 403 });
    }

    // Store info before deletion
    const deletedInfo = {
      id: (certification._id as any).toString(),
      name: certification.name,
      code: certification.code,
    };

    // Delete certification
    await Certification.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Certification program deleted successfully',
      deleted: deletedInfo,
    });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
