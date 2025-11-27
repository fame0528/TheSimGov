/**
 * @file app/api/media/content/[id]/performance/route.ts
 * @description Content performance analytics API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Retrieve performance analytics for specific content piece. Returns historical
 * snapshots, trend analysis, and viral metrics across all periods.
 * 
 * ENDPOINT:
 * GET /api/media/content/[id]/performance
 * - Get performance history for content
 * - Query: ?period=Daily&limit=30 (optional)
 * - Response: { success: true, performance: ContentPerformance[], trends: {} }
 * 
 * IMPLEMENTATION NOTES:
 * - Returns snapshots in reverse chronological order
 * - Calculates growth trends from historical data
 * - Includes virality indicators and revenue analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MediaContent from '@/lib/db/models/MediaContent';
import ContentPerformance from '@/lib/db/models/ContentPerformance';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/content/[id]/performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = (await params);
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Find content
    const content = await MediaContent.findById(id);
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(content.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Build query
    const query: any = { content: id };
    if (period) query.period = period;

    // Get performance snapshots
    const performance = await ContentPerformance.find(query)
      .sort({ snapshotDate: -1 })
      .limit(limit)
      .lean();

    // Calculate trends (if multiple snapshots)
    let trends = {};
    if (performance.length >= 2) {
      const latest = performance[0];
      const previous = performance[1];

      trends = {
        viewsGrowth: previous.views > 0 ? ((latest.views - previous.views) / previous.views) * 100 : 0,
        revenueGrowth:
          previous.totalRevenue > 0
            ? ((latest.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
            : 0,
        engagementGrowth:
          previous.engagementRate > 0
            ? ((latest.engagementRate - previous.engagementRate) / previous.engagementRate) * 100
            : 0,
        isViral: latest.viralCoefficient > 0.05 && latest.views > 10000,
        isTrending: latest.viewsGrowth > 50,
      };
    }

    return NextResponse.json({
      success: true,
      performance,
      trends,
      totalSnapshots: performance.length,
    });
  } catch (error: any) {
    console.error('Error fetching content performance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
