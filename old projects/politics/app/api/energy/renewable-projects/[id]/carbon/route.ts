/**
 * @file app/api/energy/renewable-projects/[id]/carbon/route.ts
 * @description Generate carbon credits from renewable production
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import RenewableProject from '@/lib/db/models/RenewableProject';

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

    const { id: projectId } = await context.params;

    const project = await RenewableProject.findById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Renewable project not found' }, { status: 404 });
    }

    const creditsGenerated = await project.generateCarbonCredits();

    const lastCredit = project.carbonCreditsGenerated[project.carbonCreditsGenerated.length - 1];

    await project.save();

    const updatedProject = await RenewableProject.findById(projectId)
      .populate('company', 'name industry');

    const totalCredits = project.carbonCreditsGenerated.length;
    const totalCO2Avoided = project.carbonCreditsGenerated.reduce((sum, c) => sum + c.tonsCO2Avoided, 0);

    return NextResponse.json({
      project: updatedProject,
      carbonCredits: {
        generated: Math.round(creditsGenerated * 100) / 100,
        tonsCO2Avoided: lastCredit ? Math.round(lastCredit.tonsCO2Avoided * 100) / 100 : 0,
        creditPrice: lastCredit ? lastCredit.creditPrice : 0,
        totalCreditsLifetime: totalCredits,
        totalCO2AvoidedLifetime: Math.round(totalCO2Avoided * 100) / 100,
        creditCount: project.carbonCreditsGenerated.length,
      },
      message: 'Carbon credits generated successfully',
    });

  } catch (error: any) {
    console.error('POST /api/energy/renewable-projects/[id]/carbon error:', error);

    return NextResponse.json(
      { error: 'Failed to generate carbon credits', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
