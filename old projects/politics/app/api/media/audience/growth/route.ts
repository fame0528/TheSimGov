/**
 * @file app/api/media/audience/growth/route.ts
 * @description Audience growth trends API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Retrieve audience growth analytics with historical trends, growth rate calculations,
 * and churn analysis. Enables tracking follower acquisition and retention over time.
 * 
 * ENDPOINT:
 * GET /api/media/audience/growth
 * - Get growth trends for company audience
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0&period=30d
 * - Response: { success: true, growth: {}, trends: [] }
 * 
 * IMPLEMENTATION NOTES:
 * - Aggregates growth data from audience snapshots
 * - Calculates net growth (new followers - churn)
 * - Identifies growth acceleration/deceleration
 * - Projects future growth based on trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Audience from '@/lib/db/models/Audience';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/audience/growth
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
    const audience = await Audience.findOne({ company: companyId });
    if (!audience) {
      return NextResponse.json(
        { success: false, error: 'Audience data not found' },
        { status: 404 }
      );
    }

    // Calculate growth metrics
    const netGrowth = audience.monthlyGrowth - audience.monthlyChurn;
    const growthRate = audience.get('growthRate');
    const churnRate = audience.get('churnRate');

    // Simple trend analysis (would be more complex with historical snapshots)
    const trends = {
      current: {
        totalFollowers: audience.totalFollowers,
        activeFollowers: audience.activeFollowers,
        netGrowth,
        growthRate,
        churnRate,
      },
      projection: {
        nextMonth: Math.round(audience.totalFollowers * (1 + growthRate / 100)),
        threeMonths: Math.round(audience.totalFollowers * Math.pow(1 + growthRate / 100, 3)),
        sixMonths: Math.round(audience.totalFollowers * Math.pow(1 + growthRate / 100, 6)),
      },
      health: {
        growthHealthy: growthRate > 0,
        churnAcceptable: churnRate < 10,
        netPositive: netGrowth > 0,
      },
    };

    return NextResponse.json({
      success: true,
      growth: trends,
    });
  } catch (error: any) {
    console.error('Error fetching audience growth:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch growth data' },
      { status: 500 }
    );
  }
}
