/**
 * @file app/api/energy/subsidies/[id]/compliance/route.ts
 * @description Check subsidy compliance status
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Subsidy from '@/lib/db/models/Subsidy';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    let session = await auth();

    if (!session?.user?.id && (process.env.NODE_ENV === 'test' || process.env.TEST_SKIP_AUTH === 'true')) {
      const testUserId = request.headers.get('x-test-user-id');
      if (testUserId) session = { user: { id: testUserId } } as any;
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    await connectDB();

    const { id: subsidyId } = await context.params;

    const subsidy = await Subsidy.findById(subsidyId)
      .populate('renewableProject', 'name projectType installedCapacity');

    if (!subsidy) {
      return NextResponse.json({ error: 'Subsidy not found' }, { status: 404 });
    }

    // Check compliance
    const isCompliant = await subsidy.checkCompliance();

    const complianceIssues = [];
    
    if (subsidy.status === 'Expired') {
      complianceIssues.push('Subsidy has expired');
    }

    // Technology check would require inspecting project assets (solar/wind)
    // Skip detailed technology validation for now

    if (subsidy.eligibilityCriteria.minCapacity && subsidy.renewableProject) {
      const project = subsidy.renewableProject as any;
      if (project.installedCapacity < subsidy.eligibilityCriteria.minCapacity) {
        complianceIssues.push(`Capacity below minimum: ${project.installedCapacity}kW < ${subsidy.eligibilityCriteria.minCapacity}kW`);
      }
    }

    const recaptureRisk = subsidy.recaptureRisk > 50 ? 'High' : 'Low';
    const estimatedRecaptureAmount = subsidy.calculateRecaptureAmount();

    const updatedSubsidy = await Subsidy.findById(subsidyId)
      .populate('company', 'name industry')
      .populate('renewableProject', 'name projectType installedCapacity');

    return NextResponse.json({
      subsidy: updatedSubsidy,
      compliance: {
        isCompliant,
        complianceIssues,
        lastChecked: new Date(),
        recaptureRisk,
        estimatedRecaptureAmount: Math.round(estimatedRecaptureAmount),
        daysUntilExpiration: subsidy.daysUntilExpiration,
        isExpired: subsidy.isExpired,
      },
      message: isCompliant ? 'Subsidy is compliant' : 'Compliance issues detected',
    });

  } catch (error: any) {
    console.error('POST /api/energy/subsidies/[id]/compliance error:', error);

    return NextResponse.json(
      { error: 'Failed to check compliance', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
