/**
 * @file app/api/energy/renewable-projects/[id]/forecast/route.ts
 * @description Forecast future renewable energy production
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import RenewableProject from '@/lib/db/models/RenewableProject';

const forecastSchema = z.object({
  months: z.number().int().min(1).max(60).default(12),
});

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
    const body = await request.json();
    const validatedData = forecastSchema.parse(body);

    const project = await RenewableProject.findById(projectId)
      .populate('solarFarms')
      .populate('windTurbines')
      .populate('company', 'name industry');

    if (!project) {
      return NextResponse.json({ error: 'Renewable project not found' }, { status: 404 });
    }

    const forecastedProduction = project.forecastProduction(validatedData.months);

    const monthlyAverage = forecastedProduction / validatedData.months;
    const annualForecast = monthlyAverage * 12;

    const degradationRate = 0.5; // 0.5% per year for renewables
    const yearsAhead = validatedData.months / 12;
    const degradationFactor = Math.pow(1 - (degradationRate / 100), yearsAhead);
    const degradedForecast = forecastedProduction * degradationFactor;

    const currentCapacity = project.currentCapacity || 1;
    const capacityFactor = (monthlyAverage / (currentCapacity * 730)) * 100;

    return NextResponse.json({
      project: {
        id: project._id,
        name: project.name,
        projectType: project.projectType,
        currentCapacity: currentCapacity,
        solarAssets: project.solarFarms.length,
        windAssets: project.windTurbines.length,
      },
      forecast: {
        months: validatedData.months,
        totalProduction: Math.round(forecastedProduction),
        monthlyAverage: Math.round(monthlyAverage),
        annualForecast: Math.round(annualForecast),
        degradedForecast: Math.round(degradedForecast),
        capacityFactor: Math.round(capacityFactor * 10) / 10,
        degradationRate: `${degradationRate}% per year`,
      },
      message: 'Production forecast generated successfully',
    });

  } catch (error: any) {
    console.error('POST /api/energy/renewable-projects/[id]/forecast error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to generate forecast', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
