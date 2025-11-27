/**
 * @fileoverview AI Patent Filing & Management API Routes
 * @module app/api/ai/patents
 * 
 * OVERVIEW:
 * REST API for filing patents from breakthroughs and managing patent lifecycle.
 * Handles patent filing, status updates, and portfolio tracking.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Patent from '@/lib/db/models/Patent';
import Breakthrough from '@/lib/db/models/Breakthrough';
import Company from '@/lib/db/models/Company';
import { calculatePatentFilingCost, estimatePatentGrantProbability } from '@/lib/utils/ai';
import type { PatentJurisdiction } from '@/lib/utils/ai/patentCalculations';
import type { BreakthroughArea } from '@/lib/utils/ai/breakthroughCalculations';

/**
 * POST /api/ai/patents
 * 
 * File patent from breakthrough
 * 
 * Request Body:
 * - breakthroughId: Breakthrough to patent
 * - international: Whether to file internationally (default: false)
 * - jurisdictions: Additional jurisdictions beyond US (default: [])
 * 
 * Response:
 * - patent: Created patent object
 * - filingCost: Total filing cost breakdown
 * - timeline: Estimated grant timeline
 * - remainingCash: Company cash after filing
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      breakthroughId,
      international = false,
      jurisdictions = [],
    } = body;

    // Validation
    if (!breakthroughId) {
      return NextResponse.json({ error: 'Breakthrough ID required' }, { status: 400 });
    }

    await connectDB();

    // Load breakthrough
    const breakthrough = await Breakthrough.findById(breakthroughId);
    if (!breakthrough) {
      return NextResponse.json({ error: 'Breakthrough not found' }, { status: 404 });
    }

    // Check patentability
    if (!breakthrough.patentable) {
      return NextResponse.json(
        { error: 'Breakthrough is not patentable (insufficient novelty or impact)' },
        { status: 400 }
      );
    }

    // Check if already filed
    if (breakthrough.patentFiled) {
      return NextResponse.json(
        { error: 'Patent already filed for this breakthrough' },
        { status: 400 }
      );
    }

    // Load company
    const company = await Company.findById(breakthrough.company);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Ownership check
    if (company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this company' },
        { status: 403 }
      );
    }

    // Calculate filing cost
    const {
      totalCost,
      breakdown,
      timeline,
      jurisdictions: allJurisdictions,
    } = calculatePatentFilingCost(
      breakthrough.area as BreakthroughArea,
      international,
      jurisdictions as PatentJurisdiction[]
    );

    // Check if company can afford filing
    if (company.cash < totalCost) {
      return NextResponse.json(
        {
          error: 'Insufficient funds for patent filing',
          required: totalCost,
          available: company.cash,
          shortfall: totalCost - company.cash,
        },
        { status: 400 }
      );
    }

    // Generate patent ID (USPTO-style: US-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const patentId = `US-${year}-${randomId}`;

    // Calculate grant probability (for simulation purposes)
    const grantProbability = estimatePatentGrantProbability(
      breakthrough.noveltyScore || 50,
      breakthrough.area as BreakthroughArea
    );

    // Create patent
    const patent = await Patent.create({
      companyId: company.id,
      breakthroughId: breakthrough.id,
      projectId: breakthrough.project,
      patentId,
      title: `${breakthrough.name} - ${breakthrough.area} Innovation`,
      area: breakthrough.area,
      description: breakthrough.description,
      inventors: breakthrough.discoveredBy,
      filedAt: new Date(),
      status: 'Filed',
      international,
      jurisdictions: allJurisdictions,
      filingCost: totalCost,
      estimatedValue: breakthrough.estimatedPatentValue,
    });

    // Deduct filing cost from company cash
    company.cash -= totalCost;
    await company.save();

    // Mark breakthrough as patent filed
    breakthrough.patentFiled = true;
    breakthrough.patentId = patent.id;
    await breakthrough.save();

    return NextResponse.json({
      patent,
      filingCost: {
        total: totalCost,
        breakdown,
      },
      timeline,
      grantProbability,
      remainingCash: company.cash,
      message: `Patent ${patentId} filed successfully. Estimated timeline: ${timeline}`,
    });
  } catch (error) {
    console.error('Patent filing error:', error);
    return NextResponse.json(
      { error: 'Internal server error during patent filing' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/patents?companyId=xxx&status=xxx
 * 
 * List patents for company
 * 
 * Query Params:
 * - companyId: Company ID (required)
 * - status: Filter by status (optional: Filed/Pending/Granted/Rejected)
 * 
 * Response:
 * - patents: Array of patent objects
 * - totalCount: Total patent count
 * - byStatus: Count by status (Filed/Pending/Granted/Rejected)
 * - totalValue: Total current value of granted patents
 * - totalRevenue: Total licensing revenue earned
 * - totalCitations: Total citations across all patents
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const statusFilter = searchParams.get('status');

    // Validation
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    await connectDB();

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    if (company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build query filter
    const filter: any = { companyId };
    if (statusFilter) {
      filter.status = statusFilter;
    }

    // Get patents
    const patents = await Patent.find(filter).sort({ filedAt: -1 });

    // Calculate aggregations
    const totalCount = patents.length;
    
    const byStatus = {
      Filed: patents.filter(p => p.status === 'Filed').length,
      Pending: patents.filter(p => p.status === 'Pending').length,
      Granted: patents.filter(p => p.status === 'Granted').length,
      Rejected: patents.filter(p => p.status === 'Rejected').length,
    };

    const grantedPatents = patents.filter(p => p.status === 'Granted');
    const totalValue = grantedPatents.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalRevenue = grantedPatents.reduce((sum, p) => sum + (p.licensingRevenue || 0), 0);
    const totalCitations = patents.reduce((sum, p) => sum + (p.citations || 0), 0);

    return NextResponse.json({
      patents,
      totalCount,
      byStatus,
      totalValue,
      totalRevenue,
      totalCitations,
    });
  } catch (error) {
    console.error('List patents error:', error);
    return NextResponse.json(
      { error: 'Internal server error listing patents' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/patents/:patentId
 * 
 * Update patent status (simulation of USPTO approval process)
 * 
 * Request Body:
 * - status: New status (Pending/Granted/Rejected)
 * 
 * Response:
 * - patent: Updated patent object
 * - message: Status update message
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { patentId, status } = body;

    // Validation
    if (!patentId || !status) {
      return NextResponse.json(
        { error: 'Patent ID and status required' },
        { status: 400 }
      );
    }

    if (!['Pending', 'Granted', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status (must be Pending/Granted/Rejected)' },
        { status: 400 }
      );
    }

    await connectDB();

    // Load patent
    const patent = await Patent.findById(patentId);
    if (!patent) {
      return NextResponse.json({ error: 'Patent not found' }, { status: 404 });
    }

    // Verify ownership
    const company = await Company.findById(patent.company);
    if (!company || company.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update status
    patent.status = status as 'Pending' | 'Granted' | 'Rejected';

    // Set timestamp based on status
    if (status === 'Granted') {
      patent.grantedAt = new Date();
    } else if (status === 'Rejected') {
      patent.rejectedAt = new Date();
    }

    await patent.save();

    return NextResponse.json({
      patent,
      message: `Patent ${patentId} status updated to ${status}`,
    });
  } catch (error) {
    console.error('Patent status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error updating patent status' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Filing Cost Calculation**: Uses calculatePatentFilingCost utility (NOT embedded)
 * 2. **Grant Probability**: Uses estimatePatentGrantProbability for simulation
 * 3. **Patent ID Generation**: USPTO-style format (US-YYYY-XXXXXX)
 * 4. **Ownership Validation**: Checks company owner === session.user.id
 * 5. **Patentability Check**: Verifies breakthrough.patentable before filing
 * 6. **Duplicate Prevention**: Checks breakthrough.patentFiled before creating patent
 * 7. **Cost Deduction**: Deducts filing cost from company.cash
 * 8. **Bidirectional Link**: Updates breakthrough.patentFiled and breakthrough.patentId
 * 
 * STATUS LIFECYCLE:
 * - Filed: Initial filing (POST creates with this status)
 * - Pending: Under USPTO review (PATCH update)
 * - Granted: USPTO approved (PATCH update, sets grantedAt)
 * - Rejected: USPTO denied (PATCH update, sets rejectedAt)
 * 
 * PREVENTS:
 * - Filing non-patentable breakthroughs (novelty/impact check)
 * - Duplicate patent filing (patentFiled check)
 * - Insufficient funds (cash check before filing)
 * - Unauthorized filing (ownership check)
 * 
 * REUSE:
 * - Follows legacy patents/route.ts pattern (filing, status lifecycle, aggregations)
 * - Uses calculatePatentFilingCost utility (NOT embedded logic)
 * - Uses estimatePatentGrantProbability utility (NOT embedded logic)
 * - Follows existing API patterns (auth check, ownership check, error handling)
 */
