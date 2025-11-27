/**
 * @file app/api/media/sponsorships/analytics/route.ts
 * @description Sponsorship analytics API for sponsor ROI dashboard
 * @created 2025-11-17
 * 
 * GET /api/media/sponsorships/analytics - Sponsor performance dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import SponsorshipDeal from '@/lib/db/models/SponsorshipDeal';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/sponsorships/analytics
 * Get sponsorship performance analytics
 * 
 * @query {
 *   role: 'sponsor' | 'recipient'
 * }
 * 
 * @returns {200} Sponsorship analytics data
 * @returns {401} Unauthorized
 * @returns {404} Company not found
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    await dbConnect();

    // Find user companies
    const companies = await Company.find({ owner: session.user.id });

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'No companies found - Create a company first' }, { status: 404 });
    }

    const companyIds = companies.map((c) => c._id);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'sponsor';

    // Build query
    const filter: any =
      role === 'sponsor'
        ? { sponsor: { $in: companyIds } }
        : { recipient: { $in: companyIds } };

    // Fetch all sponsorship deals
    const deals = await SponsorshipDeal.find(filter)
      .populate('sponsor', 'name')
      .populate('recipient', 'name')
      .populate('deliveredContent', 'title views likes shares')
      .lean();

    // Calculate analytics
    const totalDeals = deals.length;
    const activeDeals = deals.filter((d: any) => d.status === 'Active').length;
    const completedDeals = deals.filter((d: any) => d.status === 'Completed').length;

    // Financial metrics
    const totalSpend = deals.reduce((sum: number, d: any) => {
      if (role === 'sponsor') {
        return sum + (d.dealValue || 0);
      }
      return sum + (d.dealValue || 0);
    }, 0);

    const totalBonuses = deals.reduce((sum: number, d: any) => {
      const bonuses = d.performanceBonuses || [];
      return sum + bonuses.filter((b: any) => b.achieved).reduce((s: number, b: any) => s + b.bonus, 0);
    }, 0);

    // Fulfillment metrics
    const totalRequirements = deals.reduce(
      (sum: number, d: any) => sum + (d.contentRequirements?.length || 0),
      0
    );
    const deliveredRequirements = deals.reduce((sum: number, d: any) => {
      const reqs = d.contentRequirements || [];
      return sum + reqs.filter((r: any) => r.delivered).length;
    }, 0);
    const fulfillmentRate =
      totalRequirements > 0 ? Math.round((deliveredRequirements / totalRequirements) * 100) : 0;

    // Brand metrics
    const avgBrandLift =
      deals.length > 0
        ? Math.round(deals.reduce((sum: number, d: any) => sum + (d.brandLift || 0), 0) / deals.length)
        : 0;
    const avgBrandSentiment =
      deals.length > 0
        ? Math.round(deals.reduce((sum: number, d: any) => sum + (d.brandSentiment || 0), 0) / deals.length)
        : 0;
    const totalBrandMentions = deals.reduce((sum: number, d: any) => sum + (d.brandMentions || 0), 0);

    // Deal structure breakdown
    const dealStructures = deals.reduce((acc: any, d: any) => {
      acc[d.dealStructure] = (acc[d.dealStructure] || 0) + 1;
      return acc;
    }, {});

    // Performance bonuses breakdown
    const bonusesEarned = deals.reduce((acc: number, d: any) => {
      const bonuses = d.performanceBonuses || [];
      return acc + bonuses.filter((b: any) => b.achieved).length;
    }, 0);

    const bonusesTotal = deals.reduce((acc: number, d: any) => {
      return acc + (d.performanceBonuses?.length || 0);
    }, 0);

    const bonusAchievementRate = bonusesTotal > 0 ? Math.round((bonusesEarned / bonusesTotal) * 100) : 0;

    return NextResponse.json({
      summary: {
        totalDeals,
        activeDeals,
        completedDeals,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalBonuses: Math.round(totalBonuses * 100) / 100,
      },
      fulfillment: {
        totalRequirements,
        deliveredRequirements,
        fulfillmentRate,
      },
      brand: {
        avgBrandLift,
        avgBrandSentiment,
        totalBrandMentions,
      },
      dealStructures,
      bonuses: {
        earned: bonusesEarned,
        total: bonusesTotal,
        achievementRate: bonusAchievementRate,
      },
      deals: deals.map((d: any) => ({
        id: d._id,
        sponsor: d.sponsor?.name,
        recipient: d.recipient?.name,
        dealValue: d.dealValue,
        dealStructure: d.dealStructure,
        status: d.status,
        fulfillmentProgress: d.contentRequirements?.length
          ? Math.round(
              (d.contentRequirements.filter((r: any) => r.delivered).length / d.contentRequirements.length) * 100
            )
          : 0,
        brandLift: d.brandLift,
        bonusesAchieved: d.performanceBonuses?.filter((b: any) => b.achieved).length || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sponsorship analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
