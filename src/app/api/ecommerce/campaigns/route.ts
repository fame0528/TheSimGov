/**
 * @fileoverview E-Commerce Campaigns API - GET/POST endpoints
 * @module api/ecommerce/campaigns
 * 
 * ENDPOINTS:
 * GET  /api/ecommerce/campaigns - List SEO/PPC campaigns for company
 * POST /api/ecommerce/campaigns - Create new campaign
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SEOCampaign } from '@/lib/db/models/ecommerce';

/**
 * GET /api/ecommerce/campaigns
 * List all SEO/PPC campaigns for a company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Build query
    const query: Record<string, unknown> = { company: companyId };
    if (type) query.type = type;
    if (status) query.status = status;

    const campaigns = await SEOCampaign.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    
    const avgCTR = totalImpressions > 0 
      ? (totalClicks / totalImpressions) * 100 
      : 0;
    const avgConversionRate = totalClicks > 0 
      ? (totalConversions / totalClicks) * 100 
      : 0;
    const overallROI = totalSpent > 0 
      ? ((totalRevenue - totalSpent) / totalSpent) * 100 
      : 0;

    return NextResponse.json({
      campaigns,
      totalCampaigns,
      activeCampaigns,
      totalBudget,
      totalSpent,
      totalRevenue,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCTR: Math.round(avgCTR * 100) / 100,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      overallROI: Math.round(overallROI * 100) / 100,
    });
  } catch (error) {
    console.error('GET /api/ecommerce/campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/campaigns
 * Create a new SEO/PPC campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      company,
      name,
      type,
      keywords,
      budget,
      dailyBudget,
      startDate,
      endDate,
      targetProducts,
    } = body;

    if (!company || !name || !type || !keywords || !budget || !startDate) {
      return NextResponse.json(
        { error: 'Company, name, type, keywords, budget, and startDate are required' },
        { status: 400 }
      );
    }

    // Calculate average CPC based on keyword bids
    const avgCPC = keywords.length > 0
      ? keywords.reduce((sum: number, k: { bid: number }) => sum + k.bid, 0) / keywords.length
      : 0.5;

    const campaign = await SEOCampaign.create({
      company,
      name,
      type,
      keywords,
      budget,
      dailyBudget: dailyBudget || Math.ceil(budget / 30),
      spent: 0,
      costPerClick: avgCPC,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      status: 'Draft',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      targetProducts: targetProducts || [],
    });

    return NextResponse.json(
      { message: 'Campaign created', campaign },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/ecommerce/campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
