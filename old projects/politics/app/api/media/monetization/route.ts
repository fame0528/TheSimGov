/**
 * @file app/api/media/monetization/route.ts
 * @description API endpoints for Media company monetization configuration
 * @created 2025-11-17
 * 
 * GET /api/media/monetization - Fetch company monetization settings
 * PATCH /api/media/monetization - Update monetization configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MonetizationSettings from '@/lib/db/models/MonetizationSettings';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/monetization
 * Fetch company monetization settings
 * 
 * @returns {200} Monetization settings
 * @returns {401} Unauthorized
 * @returns {404} Company or settings not found
 */
export async function GET() {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Find monetization settings
    let settings = await MonetizationSettings.findOne({ company: company._id });

    // Create default settings if not exist
    if (!settings) {
      settings = await MonetizationSettings.create({
        company: company._id,
        defaultCPM: 5.0,
        strategy: 'Hybrid',
      });
    }

    return NextResponse.json({
      settings,
      effectiveCPMRange: settings.effectiveCPMRange,
      subscriptionRevenue: settings.subscriptionRevenue,
      isProfitable: settings.isProfitable,
    });
  } catch (error: any) {
    console.error('Error fetching monetization settings:', error);
    return NextResponse.json({ error: 'Failed to fetch monetization settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/media/monetization
 * Update company monetization configuration
 * 
 * @body {
 *   defaultCPM?: number,
 *   strategy?: 'AdRevenue' | 'Subscriptions' | 'Affiliates' | 'Hybrid',
 *   cpmByAge?: { [ageGroup: string]: number },
 *   cpmByIncome?: { [incomeGroup: string]: number },
 *   cpmByLocation?: { [location: string]: number },
 *   cpmByDevice?: { [device: string]: number },
 *   subscriptionTiers?: [...],
 *   affiliateCommissionRate?: number,
 *   affiliateCategories?: { [category: string]: number },
 *   platformRevShares?: { [platform: string]: number },
 *   minCPM?: number,
 *   maxCPM?: number,
 *   targetDemographics?: string[],
 *   totalSubscribers?: number,
 *   totalMRR?: number,
 *   churnRate?: number
 * }
 * 
 * @returns {200} Updated settings
 * @returns {400} Validation error
 * @returns {401} Unauthorized
 * @returns {404} Company not found
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user's Media company
    const company = await Company.findOne({
      owner: session.user.id,
      industry: 'Media',
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Media company not found - Create a Media company first' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Find or create settings
    let settings = await MonetizationSettings.findOne({ company: company._id });

    if (!settings) {
      // Create new settings with defaults
      settings = new MonetizationSettings({
        company: company._id,
        defaultCPM: body.defaultCPM || 5.0,
        strategy: body.strategy || 'Hybrid',
      });
    }

    // Update fields
    const allowedFields = [
      'defaultCPM',
      'strategy',
      'cpmByAge',
      'cpmByIncome',
      'cpmByLocation',
      'cpmByDevice',
      'subscriptionTiers',
      'affiliateEnabled',
      'affiliateCommissionRate',
      'affiliateCategories',
      'platformRevShares',
      'minCPM',
      'maxCPM',
      'targetDemographics',
      'excludedAdvertisers',
      'preferredAdvertisers',
      'totalSubscribers',
      'totalMRR',
      'totalARR',
      'avgRevenuePerUser',
      'churnRate',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (settings as any)[field] = body[field];
      }
    });

    await settings.save();

    return NextResponse.json({
      message: 'Monetization settings updated successfully',
      settings,
      effectiveCPMRange: settings.effectiveCPMRange,
      subscriptionRevenue: settings.subscriptionRevenue,
      isProfitable: settings.isProfitable,
    });
  } catch (error: any) {
    console.error('Error updating monetization settings:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update monetization settings' }, { status: 500 });
  }
}
