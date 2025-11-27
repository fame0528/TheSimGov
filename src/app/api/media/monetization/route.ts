/**
 * @file src/app/api/media/monetization/route.ts
 * @description Media monetization settings API endpoint
 * @created 2025-11-24
 *
 * OVERVIEW:
 * RESTful API endpoint for managing media company monetization settings.
 * Supports CRUD operations for revenue optimization configuration including
 * CPM multipliers, subscription tiers, affiliate settings, and platform partnerships.
 *
 * ENDPOINTS:
 * GET  /api/media/monetization - Get monetization settings
 * POST /api/media/monetization - Create/update monetization settings
 *
 * FEATURES:
 * - CPM rate optimization by demographics
 * - Subscription tier management
 * - Affiliate commission configuration
 * - Platform revenue sharing setup
 * - Revenue optimization recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db/mongoose';
import MonetizationSettings from '@/lib/db/models/media/MonetizationSettings';
import Company from '@/lib/db/models/Company';
import {
  calculateEngagementRate,
  calculateROAS,
  calculateCTR
} from '@/lib/utils/media';

/**
 * GET /api/media/monetization
 * Get monetization settings for the authenticated company
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

    // Get monetization settings
    let settings = await MonetizationSettings.findOne({ company: company._id });

    // Create default settings if none exist
    if (!settings) {
      settings = new MonetizationSettings({
        company: company._id,
        isActive: true,
        defaultCPM: 5.0,
        strategy: 'Hybrid'
      });
      await settings.save();
    }

    const doc = settings.toObject();

    // Calculate derived metrics
    const calculatedMetrics = {
      subscriptionRevenue: doc.subscriptionRevenue || 0,
      isProfitable: doc.isProfitable || false,
      totalRevenue: (doc.totalMRR || 0) + (doc.totalARR || 0) / 12,
      arpu: doc.avgRevenuePerUser || 0,
      churnRate: doc.churnRate || 0,
      subscriberRetention: Math.max(0, 100 - (doc.churnRate || 0)),

      // Revenue optimization insights
      topDemographic: getTopDemographic(doc.cpmByAge || {}, doc.cpmByIncome || {}),
      revenueDiversity: calculateRevenueDiversity(doc),
      optimizationPotential: calculateOptimizationPotential(doc)
    };

    // Generate optimization recommendations
    const recommendations = generateMonetizationRecommendations(doc, calculatedMetrics);

    return NextResponse.json({
      settings: {
        ...doc,
        calculatedMetrics,
        recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching monetization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/monetization
 * Create or update monetization settings
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
      isActive,
      defaultCPM,
      strategy,
      cpmByAge,
      cpmByIncome,
      cpmByLocation,
      cpmByDevice,
      subscriptionTiers,
      affiliateEnabled,
      affiliateCommissionRate,
      affiliateCategories,
      platformRevShares,
      minCPM,
      maxCPM,
      targetDemographics,
      excludedAdvertisers,
      preferredAdvertisers,
      totalSubscribers,
      totalMRR,
      totalARR,
      avgRevenuePerUser,
      churnRate
    } = body;

    // Find existing settings or create new
    let settings = await MonetizationSettings.findOne({ company: company._id });

    if (settings) {
      // Update existing settings
      if (isActive !== undefined) settings.isActive = isActive;
      if (defaultCPM !== undefined) settings.defaultCPM = defaultCPM;
      if (strategy !== undefined) settings.strategy = strategy;
      if (cpmByAge !== undefined) settings.cpmByAge = cpmByAge;
      if (cpmByIncome !== undefined) settings.cpmByIncome = cpmByIncome;
      if (cpmByLocation !== undefined) settings.cpmByLocation = cpmByLocation;
      if (cpmByDevice !== undefined) settings.cpmByDevice = cpmByDevice;
      if (subscriptionTiers !== undefined) settings.subscriptionTiers = subscriptionTiers;
      if (affiliateEnabled !== undefined) settings.affiliateEnabled = affiliateEnabled;
      if (affiliateCommissionRate !== undefined) settings.affiliateCommissionRate = affiliateCommissionRate;
      if (affiliateCategories !== undefined) settings.affiliateCategories = affiliateCategories;
      if (platformRevShares !== undefined) settings.platformRevShares = platformRevShares;
      if (minCPM !== undefined) settings.minCPM = minCPM;
      if (maxCPM !== undefined) settings.maxCPM = maxCPM;
      if (targetDemographics !== undefined) settings.targetDemographics = targetDemographics;
      if (excludedAdvertisers !== undefined) settings.excludedAdvertisers = excludedAdvertisers;
      if (preferredAdvertisers !== undefined) settings.preferredAdvertisers = preferredAdvertisers;
      if (totalSubscribers !== undefined) settings.totalSubscribers = totalSubscribers;
      if (totalMRR !== undefined) settings.totalMRR = totalMRR;
      if (totalARR !== undefined) settings.totalARR = totalARR;
      if (avgRevenuePerUser !== undefined) settings.avgRevenuePerUser = avgRevenuePerUser;
      if (churnRate !== undefined) settings.churnRate = churnRate;
    } else {
      // Create new settings
      settings = new MonetizationSettings({
        company: company._id,
        isActive: isActive !== undefined ? isActive : true,
        defaultCPM: defaultCPM || 5.0,
        strategy: strategy || 'Hybrid',
        cpmByAge: cpmByAge || {},
        cpmByIncome: cpmByIncome || {},
        cpmByLocation: cpmByLocation || {},
        cpmByDevice: cpmByDevice || {},
        subscriptionTiers: subscriptionTiers || [],
        affiliateEnabled: affiliateEnabled !== undefined ? affiliateEnabled : false,
        affiliateCommissionRate: affiliateCommissionRate || 5.0,
        affiliateCategories: affiliateCategories || {},
        platformRevShares: platformRevShares || {},
        minCPM: minCPM || 1.0,
        maxCPM: maxCPM || 50.0,
        targetDemographics: targetDemographics || [],
        excludedAdvertisers: excludedAdvertisers || [],
        preferredAdvertisers: preferredAdvertisers || [],
        totalSubscribers: totalSubscribers || 0,
        totalMRR: totalMRR || 0,
        totalARR: totalARR || 0,
        avgRevenuePerUser: avgRevenuePerUser || 0,
        churnRate: churnRate || 0
      });
    }

    await settings.save();

    const doc = settings.toObject();

    // Calculate response metrics
    const calculatedMetrics = {
      subscriptionRevenue: doc.subscriptionRevenue || 0,
      isProfitable: doc.isProfitable || false,
      totalRevenue: (doc.totalMRR || 0) + (doc.totalARR || 0) / 12,
      arpu: doc.avgRevenuePerUser || 0,
      churnRate: doc.churnRate || 0,
      subscriberRetention: Math.max(0, 100 - (doc.churnRate || 0)),
      topDemographic: getTopDemographic(doc.cpmByAge || {}, doc.cpmByIncome || {}),
      revenueDiversity: calculateRevenueDiversity(doc),
      optimizationPotential: calculateOptimizationPotential(doc)
    };

    const recommendations = generateMonetizationRecommendations(doc, calculatedMetrics);

    return NextResponse.json({
      settings: {
        ...doc,
        calculatedMetrics,
        recommendations
      },
      message: settings.isNew ? 'Monetization settings created successfully' : 'Monetization settings updated successfully'
    }, { status: settings.isNew ? 201 : 200 });

  } catch (error) {
    console.error('Error saving monetization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get the highest-value demographic combination
 */
function getTopDemographic(cpmByAge: any, cpmByIncome: any): string {
  let topDemo = '25-34';
  let topMultiplier = 1.0;

  // Check age groups
  for (const [ageGroup, multiplier] of Object.entries(cpmByAge)) {
    if (typeof multiplier === 'number' && multiplier > topMultiplier) {
      topMultiplier = multiplier;
      topDemo = ageGroup;
    }
  }

  // Check income groups
  for (const [incomeGroup, multiplier] of Object.entries(cpmByIncome)) {
    if (typeof multiplier === 'number' && multiplier > topMultiplier) {
      topMultiplier = multiplier;
      topDemo = incomeGroup;
    }
  }

  return topDemo;
}

/**
 * Calculate revenue diversity score (0-100)
 */
function calculateRevenueDiversity(settings: any): number {
  let diversityScore = 0;

  // Ad revenue diversity
  if (settings.strategy === 'AdRevenue' || settings.strategy === 'Hybrid') {
    diversityScore += 30;
  }

  // Subscription diversity
  if ((settings.subscriptionTiers || []).length > 0) {
    diversityScore += 25;
  }

  // Affiliate diversity
  if (settings.affiliateEnabled) {
    diversityScore += 20;
  }

  // Platform diversity
  const platformCount = Object.keys(settings.platformRevShares || {}).length;
  diversityScore += Math.min(platformCount * 5, 25);

  return Math.min(diversityScore, 100);
}

/**
 * Calculate optimization potential (0-100)
 */
function calculateOptimizationPotential(settings: any): number {
  let potential = 0;

  // CPM optimization potential
  const avgCPM = Object.values(settings.cpmByAge || {}).reduce((sum: number, val: any) =>
    sum + (typeof val === 'number' ? val : 1), 0) / Math.max(Object.keys(settings.cpmByAge || {}).length, 1);
  if (avgCPM > 1.5) potential += 25;

  // Subscription potential
  if ((settings.subscriptionTiers || []).length < 3) potential += 25;

  // Affiliate potential
  if (!settings.affiliateEnabled) potential += 25;

  // Platform optimization potential
  const platformCount = Object.keys(settings.platformRevShares || {}).length;
  if (platformCount < 3) potential += 25;

  return Math.min(potential, 100);
}

/**
 * Generate monetization optimization recommendations
 */
function generateMonetizationRecommendations(settings: any, metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.revenueDiversity < 50) {
    recommendations.push('Low revenue diversity detected - consider adding subscription tiers or affiliate programs');
  }

  if (metrics.churnRate > 10) {
    recommendations.push('High churn rate detected - review subscription tiers and content value proposition');
  }

  if (metrics.arpu < 5) {
    recommendations.push('Low ARPU detected - consider premium subscription tiers or upselling strategies');
  }

  if (metrics.optimizationPotential > 50) {
    recommendations.push('High optimization potential identified - focus on CPM multipliers and platform expansion');
  }

  if (settings.strategy === 'AdRevenue' && !settings.affiliateEnabled) {
    recommendations.push('Consider enabling affiliate marketing to diversify revenue streams');
  }

  if ((settings.subscriptionTiers || []).length === 0 && settings.strategy !== 'AdRevenue') {
    recommendations.push('No subscription tiers configured - consider adding paid membership options');
  }

  if (Object.keys(settings.platformRevShares || {}).length < 2) {
    recommendations.push('Limited platform presence - consider expanding to additional distribution channels');
  }

  if (recommendations.length === 0) {
    recommendations.push('Monetization strategy is well-balanced - continue monitoring performance metrics');
  }

  return recommendations;
}