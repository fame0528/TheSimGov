/**
 * @fileoverview SaaS Subscriptions API - GET/POST endpoints
 * @module api/software/saas
 * 
 * ENDPOINTS:
 * GET  /api/software/saas - List subscription tiers for a company
 * POST /api/software/saas - Create new subscription tier
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { SaaSSubscription } from '@/lib/db/models';

/**
 * GET /api/software/saas
 * List all SaaS subscription tiers for a company
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
    const tier = searchParams.get('tier');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    const query: Record<string, unknown> = { company: companyId };
    if (tier) query.tier = tier;

    const subscriptions = await SaaSSubscription.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate SaaS metrics from model fields
    const activeSubscriptions = subscriptions.filter(s => s.active);
    const totalMRR = subscriptions.reduce((sum, s) => sum + (s.monthlyRecurringRevenue || 0), 0);
    const totalARR = subscriptions.reduce((sum, s) => sum + (s.annualRecurringRevenue || 0), 0);
    const totalSubscribers = subscriptions.reduce((sum, s) => sum + (s.activeSubscribers || 0), 0);
    const avgChurn = subscriptions.length > 0
      ? subscriptions.reduce((sum, s) => sum + (s.churnRate || 0), 0) / subscriptions.length
      : 0;
    const avgLTV = subscriptions.length > 0
      ? subscriptions.reduce((sum, s) => sum + (s.customerLifetimeValue || 0), 0) / subscriptions.length
      : 0;

    return NextResponse.json({
      subscriptions,
      activeCount: activeSubscriptions.length,
      totalSubscribers,
      mrr: Math.round(totalMRR),
      arr: Math.round(totalARR),
      churnRate: Math.round(avgChurn * 10) / 10,
      avgLTV: Math.round(avgLTV),
      count: subscriptions.length,
    });
  } catch (error) {
    console.error('GET /api/software/saas error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/software/saas
 * Create a new SaaS subscription tier
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
      tier,
      monthlyPrice,
      annualPrice,
    } = body;

    if (!company || !name || !tier) {
      return NextResponse.json(
        { error: 'Company, name, and tier are required' },
        { status: 400 }
      );
    }

    const subscription = await SaaSSubscription.create({
      company,
      name,
      tier,
      active: true,
      launchedAt: new Date(),
      monthlyPrice: monthlyPrice || 19,
      annualPrice: annualPrice || 190,
      trialDays: 14,
      includedFeatures: [],
      apiCallsLimit: 10000,
      storageLimit: 10,
      supportTier: 'Basic',
      maxUsers: 5,
      customBranding: false,
      totalSubscribers: 0,
      activeSubscribers: 0,
      monthlyNewSubscribers: 0,
      monthlyChurnedSubscribers: 0,
      churnRate: 0,
      avgApiCallsPerSubscriber: 0,
      avgStorageUsed: 0,
      avgActiveUsers: 0,
      featureUtilization: 0,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      customerLifetimeValue: 0,
      operatingCost: 0,
      profitMargin: 0.85,
    });

    return NextResponse.json(
      { message: 'Subscription tier created', subscription },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/software/saas error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription tier' },
      { status: 500 }
    );
  }
}
