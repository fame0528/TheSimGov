/**
 * @file app/api/media/audience/retention/route.ts
 * @description Audience retention analytics API endpoint
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Retrieve audience retention metrics including retention rates, average follower
 * lifetime, churn analysis, and lifetime value calculations. Critical for
 * understanding audience loyalty and long-term revenue potential.
 * 
 * ENDPOINT:
 * GET /api/media/audience/retention
 * - Get retention analytics
 * - Query: ?companyId=64f7a1b2c3d4e5f6g7h8i9j0
 * - Response: { success: true, retention: {} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Audience from '@/lib/db/models/Audience';
import Company from '@/lib/db/models/Company';

/**
 * GET /api/media/audience/retention
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

    // Extract retention metrics
    const retention = {
      retentionRate: audience.retentionRate,
      churnRate: audience.get('churnRate'),
      avgFollowerLifetime: audience.get('avgFollowerLifetime'),
      lifetimeValuePerFollower: audience.get('lifetimeValuePerFollower'),
      loyalFollowerPercent: audience.loyalFollowerPercent,
      repeatVisitorRate: audience.repeatVisitorRate,
      cohortAnalysis: {
        current: {
          totalFollowers: audience.totalFollowers,
          activeFollowers: audience.activeFollowers,
          inactiveFollowers: audience.totalFollowers - audience.activeFollowers,
        },
        churn: {
          monthlyChurn: audience.monthlyChurn,
          churnRate: audience.get('churnRate'),
          projectedAnnualChurn: Math.round(audience.monthlyChurn * 12),
        },
        value: {
          avgLifetime: audience.get('avgFollowerLifetime'),
          ltv: audience.get('lifetimeValuePerFollower'),
          totalLTV: Math.round(
            audience.totalFollowers * audience.get('lifetimeValuePerFollower')
          ),
        },
      },
    };

    return NextResponse.json({
      success: true,
      retention,
    });
  } catch (error: any) {
    console.error('Error fetching audience retention:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch retention data' },
      { status: 500 }
    );
  }
}
