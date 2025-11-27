/**
 * @file app/api/media/platforms/analytics/route.ts
 * @description Platform performance analytics API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Retrieve aggregated performance analytics across all platforms for a Media company.
 * Enables cross-platform comparison, identifies best-performing channels, and
 * optimizes multi-platform distribution strategy.
 * 
 * ENDPOINT:
 * GET /api/media/platforms/analytics
 * - Get platform performance analytics
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0
 * - Response: { success: true, analytics: {}, platformComparison: [] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Platform from '@/lib/db/models/Platform';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/platforms/analytics
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

    // Get all active platforms
    const platforms = await Platform.find({ company: companyId, isActive: true });

    if (platforms.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalPlatforms: 0,
          totalFollowers: 0,
          totalRevenue: 0,
          avgEngagement: 0,
        },
        platformComparison: [],
      });
    }

    // Aggregate metrics
    const totalFollowers = platforms.reduce((sum, p) => sum + p.totalFollowers, 0);
    const totalRevenue = platforms.reduce((sum, p) => sum + p.monthlyRevenue, 0);
    const avgEngagement =
      platforms.reduce((sum, p) => sum + p.engagementRate, 0) / platforms.length;
    const avgCPM = platforms.reduce((sum, p) => sum + p.avgCPM, 0) / platforms.length;

    // Platform comparison
    const platformComparison = platforms
      .map((p) => ({
        platformType: p.platformType,
        platformName: p.platformName,
        followers: p.totalFollowers,
        monthlyRevenue: p.monthlyRevenue,
        engagementRate: p.engagementRate,
        revenuePerFollower: p.get('revenuePerFollower'),
        publishedContent: p.publishedContent,
        algorithmScore: p.algorithmScore,
        monetizationTier: p.monetizationTier,
      }))
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

    // Best performers
    const bestRevenue = platformComparison[0];
    const bestEngagement = [...platformComparison].sort(
      (a, b) => b.engagementRate - a.engagementRate
    )[0];
    const bestROI = [...platformComparison].sort(
      (a, b) => b.revenuePerFollower - a.revenuePerFollower
    )[0];

    return NextResponse.json({
      success: true,
      analytics: {
        totalPlatforms: platforms.length,
        totalFollowers,
        totalRevenue,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        avgCPM: Math.round(avgCPM * 100) / 100,
      },
      platformComparison,
      bestPerformers: {
        revenue: bestRevenue,
        engagement: bestEngagement,
        roi: bestROI,
      },
    });
  } catch (error: any) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
