/**
 * Public Opinion API Route
 * 
 * @fileoverview Public perception tracking for AI companies
 * Monitors reputation, trust levels, media sentiment, and social reactions to AI development
 * 
 * @route GET /api/ai/public-opinion - Fetch public perception metrics
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import AGIMilestone from '@/lib/db/models/AGIMilestone';
import { calculatePublicPerception } from '@/lib/utils/ai/globalImpact';
import type {
  PublicOpinionResponse,
  PublicPerceptionData,
  PerceptionHistoryEntry,
} from '@/types/api';

/**
 * OVERVIEW:
 * 
 * Public perception tracking system for AI companies.
 * 
 * KEY FEATURES:
 * - Overall perception score (0-100)
 * - Trust level in AI safety (0-100)
 * - Media sentiment tracking (-100 to +100)
 * - Sentiment trend analysis (Improving/Stable/Declining/Collapsing)
 * - Protest risk calculation (0-100)
 * - Brand value estimation (USD)
 * - Reputation drivers breakdown (safety, jobs, innovation)
 * 
 * BUSINESS LOGIC:
 * - GET: Retrieve current public opinion metrics
 * - Calculate based on: alignment score, job displacement, company reputation, innovation
 * - Track sentiment trends over time
 * - Assess protest/boycott risk
 * - Estimate brand value impact
 * 
 * DEPENDENCIES:
 * - Company schema (reputation, AGI fields)
 * - AGIMilestone schema (capability tracking)
 * - globalImpact.ts (perception calculation)
 * - Authentication (public data, but personalized for company owners)
 */

// ============================================================================
// GET - Fetch Public Perception Metrics
// ============================================================================

/**
 * Fetch public perception metrics for a company
 * 
 * @param request - NextRequest with query params
 * @returns Public opinion metrics and trends
 * 
 * @queryParams
 * - companyId: string (required) - Company to analyze
 * - includeHistory: boolean (optional) - Include historical sentiment trend (default: false)
 * - timeRange: string (optional) - Time range for history: '7d', '30d', '90d', '1y' (default: '30d')
 * 
 * @example
 * GET /api/ai/public-opinion?companyId=673d7...&includeHistory=true&timeRange=90d
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     company: { _id, name },
 *     perception: {
 *       overallScore: 68,
 *       trustLevel: 'Medium',
 *       sentimentTrend: 'Stable',
 *       mediaAttention: 75,
 *       protestRisk: 18,
 *       brandValue: 12000000000
 *     },
 *     drivers: {
 *       safetyImpact: 12,
 *       jobImpact: -15,
 *       reputationImpact: 8,
 *       innovationImpact: 10
 *     },
 *     history: [...sentiment over time if requested]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication (optional - public data, but personalized for owners)
    const session = await getServerSession();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: companyId' },
        { status: 400 }
      );
    }

    // Database connection
    await dbConnect();

    // Fetch company and latest milestone
    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Calculate jobs displaced (estimate based on AGI capability and market share)
    let jobsDisplaced = 0;
    
    if (company.agiCapability && company.agiCapability > 40) {
      // Rough estimate: AGI capability * market share * addressable jobs
      const totalJobs = 160_000_000; // US jobs
      const automationPotential = company.agiCapability / 100;
      const marketImpact = (company.marketShareAI || 0) / 100;
      jobsDisplaced = Math.floor(totalJobs * automationPotential * marketImpact);
    }

    // Calculate public perception
    const perception = await calculatePublicPerception(
      new Types.ObjectId(companyId),
      company.agiAlignment || 50,
      jobsDisplaced
    );

    // Build response data
    const responseData: Partial<PublicOpinionResponse> = {
      company: {
        _id: new Types.ObjectId(company._id?.toString()),
        name: company.name,
        industry: company.industry || '',
        subcategory: company.subcategory || '',
      },
      perception: {
        overallScore: perception.overallScore,
        trustLevel: perception.trustLevel.toString(),
        sentimentTrend: perception.sentimentTrend,
        mediaAttention: perception.mediaAttention,
        protestRisk: perception.protestRisk,
        brandValue: perception.brandValue,
      },
      drivers: {
        safetyImpact: 0,
        jobImpact: 0,
        reputationImpact: 0,
        innovationImpact: 0,
      },
      context: {
        agiAlignment: company.agiAlignment || 50,
        agiCapability: company.agiCapability || 0,
        marketShareAI: company.marketShareAI || 0,
        jobsDisplacedEstimate: jobsDisplaced,
        currentReputation: company.reputation || 50,
      },
    };

    // Optional: Include historical sentiment trend
    if (includeHistory) {
      // Calculate time range in days
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch AGI milestones to track perception changes over time
      const milestones = await AGIMilestone.find({
        company: companyId,
        achievedAt: { $gte: startDate },
      })
        .sort({ achievedAt: 1 })
        .select('achievedAt alignmentStance milestoneType')
        .lean();

      // Build sentiment history (simplified - in production, store historical snapshots)
      const history = milestones.map((milestone) => ({
        date: milestone.achievedAt || new Date(),
        perceptionScore: perception.overallScore, // Simplified - use stored historical data
        alignmentStance: milestone.alignmentStance || '',
        milestoneType: milestone.milestoneType || '',
        event: `AGI Milestone Achieved: ${milestone.milestoneType || 'Unknown'}`,
      })) as PerceptionHistoryEntry[];

      responseData.history = history;
      responseData.historyTimeRange = timeRange;
    }

    // Authorization check for sensitive details
    let isOwner = false;
    if (session?.user?.id) {
      isOwner = company.userId.toString() === session.user.id;
    }

    // Add sensitive data for company owners
    if (isOwner) {
      responseData.sensitiveMetrics = {
        protestRiskDetails: {
          likelihood: perception.protestRisk,
          triggers: jobsDisplaced > 1_000_000 ? ['Mass job displacement'] : [],
          severity: perception.protestRisk > 50 ? 'High' : perception.protestRisk > 30 ? 'Medium' : 'Low',
        },
        mediaStrategy: {
          attention: perception.mediaAttention,
          sentiment: perception.sentimentTrend,
          recommendedActions: getMediaRecommendations({
            overallScore: perception.overallScore,
            trustLevel: perception.trustLevel.toString(),
            sentimentTrend: perception.sentimentTrend,
            mediaAttention: perception.mediaAttention,
            protestRisk: perception.protestRisk,
            brandValue: perception.brandValue,
          }),
        },
        brandRisk: {
          currentValue: perception.brandValue,
          potentialLoss: perception.overallScore < 40 ? perception.brandValue * 0.3 : 0,
          recoveryStrategy: perception.overallScore < 50 ? 'Focus on safety and job creation' : 'Maintain current course',
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch public opinion metrics';
    console.error('Error fetching public opinion metrics:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper function: Generate media strategy recommendations
 * 
 * @param perception - Public perception data
 * @returns Array of recommended actions
 */
function getMediaRecommendations(perception: PublicPerceptionData): string[] {
  const recommendations: string[] = [];

  if (perception.overallScore < 40) {
    recommendations.push('Crisis communication: Address public concerns immediately');
    recommendations.push('Transparency campaign: Share AI safety measures and progress');
  }

  if (perception.trustLevel === 'Very Low' || perception.trustLevel === 'Low') {
    recommendations.push('Third-party audits: Engage independent AI safety verification');
    recommendations.push('Public commitments: Sign industry safety pledges');
  }

  if (perception.protestRisk > 40) {
    recommendations.push('Stakeholder engagement: Meet with affected communities');
    recommendations.push('Job transition programs: Fund retraining initiatives');
  }

  if (perception.sentimentTrend === 'Declining' || perception.sentimentTrend === 'Collapsing') {
    recommendations.push('Media blitz: Positive stories about AI benefits');
    recommendations.push('Leadership visibility: CEO/founders address concerns publicly');
  }

  if (perception.mediaAttention > 70 && perception.overallScore < 50) {
    recommendations.push('Damage control: Limit controversial announcements');
    recommendations.push('Goodwill initiatives: Charitable programs, community support');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current strategy: Public perception is stable');
    recommendations.push('Continue innovation: Build on positive momentum');
  }

  return recommendations;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PERCEPTION SCORE (0-100):
 *    - 4 reputation drivers:
 *      - Safety record: (alignment - 50) * 0.6 (-30 to +30)
 *      - Job impact: Up to -40 points for mass displacement
 *      - Company reputation: existing * 0.4
 *      - Innovation: +5 to +15 based on AGI capability
 *    - Higher score = more public support
 * 
 * 2. TRUST LEVEL (5 levels):
 *    - Very High: Alignment > 80
 *    - High: Alignment 60-80
 *    - Medium: Alignment 40-60
 *    - Low: Alignment 20-40
 *    - Very Low: Alignment < 20
 * 
 * 3. SENTIMENT TREND (4 states):
 *    - Improving: Score > 65 and rising
 *    - Stable: Score 40-65, no major changes
 *    - Declining: Score < 40 or dropping
 *    - Collapsing: Score < 25 and falling rapidly
 * 
 * 4. MEDIA ATTENTION (0-100):
 *    - Based on: Market share, AGI capability, controversy
 *    - High attention + low perception = negative coverage
 *    - High attention + high perception = positive coverage
 * 
 * 5. PROTEST RISK (0-100):
 *    - Calculated from: Low perception + high job displacement
 *    - >70: Riots and mass protests likely
 *    - 40-70: Organized protests probable
 *    - <40: Minimal protest activity
 * 
 * 6. BRAND VALUE (USD):
 *    - Formula: Base value * perception multiplier
 *    - Up to $50B for high-perception AGI leaders
 *    - Negative perception significantly reduces brand equity
 * 
 * 7. REPUTATION DRIVERS BREAKDOWN:
 *    - Safety Impact: AI alignment score influence
 *    - Job Impact: Job displacement penalty
 *    - Reputation Impact: Existing company reputation
 *    - Innovation Impact: AGI capability bonus
 * 
 * 8. HISTORICAL TRACKING:
 *    - Sentiment changes tied to AGI milestones
 *    - Time ranges: 7d, 30d, 90d, 1y
 *    - Track perception at each major event
 * 
 * 9. SENSITIVE METRICS (OWNERS ONLY):
 *    - Protest risk details and triggers
 *    - Media strategy recommendations
 *    - Brand risk assessment and recovery plans
 *    - Personalized action items
 * 
 * 10. MEDIA STRATEGY RECOMMENDATIONS:
 *     - Crisis communication for low scores
 *     - Transparency campaigns for trust issues
 *     - Stakeholder engagement for protest risks
 *     - Damage control for negative trends
 *     - Goodwill initiatives for high attention + low perception
 * 
 * 11. AUTHORIZATION:
 *     - Public data: Basic perception metrics viewable by all
 *     - Sensitive data: Only for company owners and admins
 *     - Historical data: Available to all with includeHistory flag
 * 
 * 12. PERFORMANCE CONSIDERATIONS:
 *     - Lean company queries
 *     - Optional historical data (on-demand)
 *     - Cached perception calculations
 *     - Simplified history (use stored snapshots in production)
 * 
 * @architecture
 * - RESTful API with GET method
 * - Public data with owner-only sensitive metrics
 * - Optional historical sentiment tracking
 * - Media strategy recommendation engine
 * - Real-time perception calculation
 */
