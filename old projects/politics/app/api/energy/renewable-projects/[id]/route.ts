/**
 * @file app/api/energy/renewable-projects/[id]/route.ts
 * @description Renewable Project detail and modification endpoints
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import RenewableProject from '@/lib/db/models/RenewableProject';

const updateRenewableProjectSchema = z.object({
  status: z.enum(['Planning', 'Construction', 'Operational', 'Partial Operation', 'Underperforming', 'Decommissioned']).optional(),
  currentCapacity: z.number().min(0).optional(),
  operatingCost: z.number().min(0).optional(),
  solarFarms: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  windTurbines: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  subsidies: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  ppas: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export async function GET(
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

    const project = await RenewableProject.findById(projectId)
      .populate('company', 'name industry reputation')
      .populate('solarFarms', 'name installedCapacity dailyProduction status')
      .populate('windTurbines', 'name ratedCapacity dailyProduction status')
      .populate('subsidies', 'subsidyType amount status')
      .populate('ppas', 'buyer contractType pricePerKWh status')
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Renewable project not found' }, { status: 404 });
    }

    const projectDoc = await RenewableProject.findById(projectId);
    const forecastProduction = projectDoc ? projectDoc.forecastProduction(12) : 0; // 12 months
    const annualRevenue = projectDoc ? projectDoc.calculateAnnualRevenue(0.10, 35) : 0; // $0.10/kWh, $35/ton CO2

    const responseData: any = {
      project,
      metrics: {
        completionPercent: projectDoc?.completionPercent || 0,
        portfolioDiversification: projectDoc?.portfolioDiversification || 0,
        forecastProduction12Mo: forecastProduction,
        estimatedAnnualRevenue: annualRevenue,
        totalCO2Avoided: project.totalCO2Avoided,
        performanceRatio: project.performanceMetrics.performanceRatio,
      },
      assetCounts: {
        solarFarms: project.solarFarms?.length || 0,
        windTurbines: project.windTurbines?.length || 0,
        subsidies: project.subsidies?.length || 0,
        ppas: project.ppas?.length || 0,
      },
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('GET /api/energy/renewable-projects/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renewable project', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const validatedData = updateRenewableProjectSchema.parse(body);

    const existingProject = await RenewableProject.findById(projectId);

    if (!existingProject) {
      return NextResponse.json({ error: 'Renewable project not found' }, { status: 404 });
    }

    const updatedProject = await RenewableProject.findByIdAndUpdate(
      projectId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('company', 'name industry');

    return NextResponse.json({
      project: updatedProject,
      message: 'Renewable project updated successfully',
    });

  } catch (error: any) {
    console.error('PATCH /api/energy/renewable-projects/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update renewable project', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (project.status === 'Operational' || project.status === 'Construction') {
      return NextResponse.json(
        { error: `Cannot delete ${project.status.toLowerCase()} project. Change status to Decommissioned first.` },
        { status: 409 }
      );
    }

    await RenewableProject.findByIdAndDelete(projectId);

    return NextResponse.json({
      success: true,
      message: 'Renewable project deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE /api/energy/renewable-projects/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete renewable project', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
