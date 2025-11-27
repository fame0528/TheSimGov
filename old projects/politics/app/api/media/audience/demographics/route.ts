/**
 * @file app/api/media/audience/demographics/route.ts
 * @description Audience demographics breakdown API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Retrieve detailed demographic breakdowns for Media company audiences. Includes
 * age groups, income levels, geographic distribution, political alignment, and
 * gender breakdowns. Enables targeted content strategy and advertising appeals.
 * 
 * ENDPOINT:
 * GET /api/media/audience/demographics
 * - Get demographic breakdowns
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0
 * - Response: { success: true, demographics: {} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Audience from '@/lib/db/models/Audience';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/audience/demographics
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Database connection
    await dbConnect();

    // Parse query
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Verify ownership
    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Get audience
    const audience = await Audience.findOne({ company: companyId }).lean();
    if (!audience) {
      return NextResponse.json(
        { success: false, error: 'Audience data not found' },
        { status: 404 }
      );
    }

    // Extract demographics
    const demographics = {
      ageGroups: audience.ageGroups,
      incomeGroups: audience.incomeGroups,
      geographic: audience.geographicBreakdown,
      political: audience.politicalAlignment,
      gender: audience.genderBreakdown,
      summary: {
        dominantAge: Object.entries(audience.ageGroups || {}).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0]?.[0],
        dominantIncome: Object.entries(audience.incomeGroups || {}).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0]?.[0],
        dominantRegion: Object.entries(audience.geographicBreakdown || {}).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0]?.[0],
        dominantPolitical: Object.entries(audience.politicalAlignment || {}).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0]?.[0],
      },
    };

    return NextResponse.json({
      success: true,
      demographics,
    });
  } catch (error: any) {
    console.error('Error fetching audience demographics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch demographics' },
      { status: 500 }
    );
  }
}
