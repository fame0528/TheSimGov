/**
 * @file src/app/api/media/platforms/route.ts
 * @description Media platforms API endpoint for distribution channel management
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing media distribution platforms.
 * Supports CRUD operations for platform configuration including algorithm optimization,
 * content distribution settings, and monetization parameters.
 *
 * ENDPOINTS:
 * GET  /api/media/platforms - List platforms with performance metrics
 * POST /api/media/platforms - Create new platform configuration
 *
 * FEATURES:
 * - Platform performance tracking
 * - Algorithm optimization recommendations
 * - Content distribution analytics
 * - Monetization tier management
 * - Cross-platform strategy insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import Platform from '@/lib/db/models/media/Platform';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  ContentMetrics
} from '@/lib/utils/media/content';
import {
  calculateROAS,
  calculateCTR
} from '@/lib/utils/media/advertising';

/**
 * GET /api/media/platforms
 * List platforms for the authenticated company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const platformType = searchParams.get('platformType');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const filter: any = { company: company._id };
    if (platformType) filter.platformType = platformType;
    if (isActive !== null) filter.isActive = isActive === 'true';

    // Get platforms with sorting by performance
    const platforms = await Platform.find(filter)
      .sort({ 'metrics.totalFollowers': -1, 'metrics.monthlyRevenue': -1 })
      .limit(limit)
      .skip(offset);

    // Calculate real-time metrics for each platform
    const platformsWithMetrics = platforms.map(platform => {
      const doc = platform.toObject();

      // Calculate performance metrics
      const metrics = doc.metrics || {};
      const engagementRate = metrics.engagementRate || 0;

      const ctr = calculateCTR(
        (metrics.engagementRate || 0) * (metrics.totalImpressions || 100) / 100,
        metrics.totalImpressions || 100
      );

      // Calculate growth metrics
      const growthMetrics = {
        followerGrowth: ((doc.totalFollowers || 0) - (doc.previousFollowers || 0)) / (doc.previousFollowers || 1) * 100,
        revenueGrowth: calculateGrowthRate(doc, 'monthlyRevenue'),
        engagementGrowth: calculateGrowthRate(doc, 'engagementRate')
      };

      // Calculate platform efficiency
      const efficiency = {
        contentPerformance: doc.contentDistribution?.contentPerformanceAvg || 0,
        algorithmScore: doc.algorithmOptimization?.algorithmScore || 50,
        monetizationEfficiency: calculateMonetizationEfficiency(doc.monetization || {})
      };

      return {
        ...doc,
        calculatedMetrics: {
          engagementRate,
          ctr,
          growthMetrics,
          efficiency,
          overallHealth: calculateOverallHealth(growthMetrics, efficiency)
        }
      };
    });

    // Get total count for pagination
    const total = await Platform.countDocuments(filter);

    // Calculate portfolio insights
    const portfolioInsights = calculatePortfolioInsights(platformsWithMetrics);

    return NextResponse.json({
      platforms: platformsWithMetrics,
      portfolioInsights,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/platforms
 * Create a new platform configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get company for the user
    const company = await Company.findOne({ owner: session.user.id });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      platformType,
      platformName,
      isActive,
      config,
      metrics,
      algorithmOptimization,
      contentDistribution,
      monetization
    } = body;

    // Validate required fields
    if (!platformType || !platformName) {
      return NextResponse.json(
        { error: 'Missing required fields: platformType, platformName' },
        { status: 400 }
      );
    }

    // Check for duplicate platform names
    const existingPlatform = await Platform.findOne({
      company: company._id,
      platformName: platformName
    });

    if (existingPlatform) {
      return NextResponse.json(
        { error: 'Platform with this name already exists' },
        { status: 409 }
      );
    }

    // Create the platform
    const platform = new Platform({
      company: company._id,
      ownedBy: session.user.id,
      platformType,
      platformName,
      isActive: isActive !== undefined ? isActive : true,
      config: config || {
        platformUrl: '',
        apiConnected: false,
        autoPublish: false,
        contentTypes: [],
        customSettings: {}
      },
      metrics: metrics || {
        totalFollowers: 0,
        monthlyReach: 0,
        engagementRate: 0,
        avgCPM: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
      },
      algorithmOptimization: algorithmOptimization || {
        algorithmScore: 50,
        preferredContentLength: 300,
        preferredPostingTimes: [],
        hashtagStrategy: [],
        trendingTopics: [],
        contentFormatPreferences: {}
      },
      contentDistribution: contentDistribution || {
        publishedContent: 0,
        scheduledContent: 0,
        contentPerformanceAvg: 0,
        bestPerformingContent: []
      },
      monetization: monetization || {
        monetizationEnabled: false,
        monetizationTier: 'None',
        revenueShare: 0,
        adFormats: [],
        sponsorshipOpportunities: 0,
        brandDeals: 0
      }
    });

    await platform.save();

    // Calculate initial metrics
    const platformMetrics: ContentMetrics = {
      views: platform.metrics.totalReach || 100,
      likes: Math.floor((platform.metrics.engagementRate || 0) * (platform.metrics.totalReach || 100) * 0.4),
      shares: Math.floor((platform.metrics.engagementRate || 0) * (platform.metrics.totalReach || 100) * 0.1),
      comments: Math.floor((platform.metrics.engagementRate || 0) * (platform.metrics.totalReach || 100) * 0.2),
      watchTime: (platform.metrics.engagementRate || 0) * (platform.metrics.totalReach || 100) * 0.5
    };

    const calculatedMetrics = {
      engagementRate: (platformMetrics.likes + platformMetrics.shares + platformMetrics.comments) / Math.max(1, platformMetrics.views) * 100,
      growthMetrics: {
        followerGrowth: 0,
        revenueGrowth: 0,
        engagementGrowth: 0
      },
      efficiency: {
        contentPerformance: platform.contentDistribution?.contentPerformanceAvg || 0,
        algorithmScore: platform.algorithmOptimization?.algorithmScore || 50,
        monetizationEfficiency: platform.monetization?.efficiency || 0
      },
      overallHealth: 50 // Default for new platforms
    };

    return NextResponse.json({
      platform: {
        ...platform.toObject(),
        calculatedMetrics
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating platform:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate growth rate for a metric
 */
function calculateGrowthRate(platform: any, metric: string): number {
  // This would typically use historical data
  // For now, return a placeholder calculation
  return 0; // Placeholder - would need historical data tracking
}

/**
 * Calculate monetization efficiency score
 */
function calculateMonetizationEfficiency(monetization: any): number {
  if (!monetization.monetizationEnabled) return 0;

  let efficiency = 20; // Base score for having monetization enabled

  // Add points for tier
  const tierScores: Record<string, number> = { 'None': 0, 'Partner': 20, 'Premium': 40, 'Elite': 60 };
  efficiency += tierScores[monetization.monetizationTier as string] || 0;

  // Add points for revenue share (lower is better for creator)
  if (monetization.revenueShare < 30) efficiency += 20;
  else if (monetization.revenueShare < 50) efficiency += 10;

  // Add points for opportunities
  efficiency += Math.min((monetization.sponsorshipOpportunities || 0) + (monetization.brandDeals || 0), 20);

  return Math.min(efficiency, 100);
}

/**
 * Calculate overall platform health score
 */
function calculateOverallHealth(growthMetrics: any, efficiency: any): number {
  const growthScore = (growthMetrics.followerGrowth + growthMetrics.revenueGrowth + growthMetrics.engagementGrowth) / 3;
  const efficiencyScore = (efficiency.contentPerformance + efficiency.algorithmScore + efficiency.monetizationEfficiency) / 3;

  return Math.round((growthScore + efficiencyScore) / 2);
}

/**
 * Calculate portfolio-level insights
 */
function calculatePortfolioInsights(platforms: any[]): any {
  if (platforms.length === 0) {
    return {
      totalPlatforms: 0,
      totalFollowers: 0,
      totalRevenue: 0,
      avgEngagementRate: 0,
      platformDiversity: 0,
      topPerformingPlatform: null,
      recommendations: ['Add your first platform to start building your media presence']
    };
  }

  const totalFollowers = platforms.reduce((sum, p) => sum + (p.metrics?.totalFollowers || 0), 0);
  const totalRevenue = platforms.reduce((sum, p) => sum + (p.metrics?.monthlyRevenue || 0), 0);
  const avgEngagementRate = platforms.reduce((sum, p) => sum + (p.calculatedMetrics?.engagementRate || 0), 0) / platforms.length;

  const platformTypes = [...new Set(platforms.map(p => p.platformType))];
  const platformDiversity = (platformTypes.length / 8) * 100; // 8 total platform types

  const topPerforming = platforms.reduce((top, current) =>
    (current.calculatedMetrics?.overallHealth || 0) > (top.calculatedMetrics?.overallHealth || 0) ? current : top
  );

  const recommendations = generatePortfolioRecommendations(platforms, {
    totalFollowers,
    totalRevenue,
    avgEngagementRate,
    platformDiversity
  });

  return {
    totalPlatforms: platforms.length,
    totalFollowers,
    totalRevenue,
    avgEngagementRate,
    platformDiversity,
    topPerformingPlatform: topPerforming.platformName,
    recommendations
  };
}

/**
 * Generate portfolio-level recommendations
 */
function generatePortfolioRecommendations(platforms: any[], metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.platformDiversity < 50) {
    recommendations.push('Low platform diversity - consider expanding to additional social media platforms');
  }

  if (metrics.avgEngagementRate < 2) {
    recommendations.push('Below-average engagement across platforms - review content strategy and posting times');
  }

  if (metrics.totalRevenue < 1000) {
    recommendations.push('Low revenue generation - consider enabling monetization on high-performing platforms');
  }

  const inactivePlatforms = platforms.filter(p => !p.isActive);
  if (inactivePlatforms.length > 0) {
    recommendations.push(`${inactivePlatforms.length} inactive platforms detected - review and optimize or deactivate`);
  }

  const lowPerformingPlatforms = platforms.filter(p => (p.calculatedMetrics?.overallHealth || 0) < 30);
  if (lowPerformingPlatforms.length > 0) {
    recommendations.push(`${lowPerformingPlatforms.length} underperforming platforms - focus optimization efforts or consider pausing`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Portfolio is well-balanced - continue monitoring performance and expanding reach');
  }

  return recommendations;
}