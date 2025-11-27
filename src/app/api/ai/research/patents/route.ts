/**
 * @fileoverview Patent Filing and Management API Endpoint
 * @module app/api/ai/research/patents
 * 
 * OVERVIEW:
 * POST endpoint for filing patents from breakthrough discoveries with cost calculation
 * and international jurisdiction support. Includes patent status tracking and licensing.
 * 
 * BUSINESS LOGIC:
 * - Domestic filing: $5,000-$15,000 base cost (varies by area)
 * - International filing: $50,000-$150,000 (PCT + jurisdictions)
 * - Patent value: $140,000-$3,000,000 (based on novelty, impact, commercial potential)
 * - Status flow: Filed → UnderReview → Approved/Rejected
 * - Timeline: 18-36 months for approval
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import AIResearchProject from '@/lib/db/models/AIResearchProject';
import { calculatePatentFilingCost } from '@/lib/utils/ai/researchLab';

/**
 * POST /api/ai/research/patents
 * 
 * File patent from breakthrough discovery
 * 
 * @security Requires authentication, company ownership verification
 * 
 * @body {
 *   projectId: string,              // Research project ID
 *   breakthroughIndex: number,      // Index in project.breakthroughs array
 *   international?: boolean,        // File internationally via PCT (default: false)
 *   jurisdictions?: string[]        // Countries for international filing
 * }
 * 
 * @returns {
 *   success: boolean,
 *   message: string,
 *   patent: {
 *     patentId: string,              // PAT-<timestamp>-<random>
 *     title: string,
 *     area: string,
 *     filedAt: Date,
 *     status: 'Filed',
 *     filingCost: number,
 *     estimatedValue: number,
 *     licensingRevenue: number,      // Initially 0
 *     citations: number              // Initially 0
 *   },
 *   costs: {
 *     baseCost: number,              // Domestic filing
 *     internationalCost: number,     // PCT + jurisdictions
 *     totalCost: number
 *   },
 *   timeline: {
 *     filing: Date,
 *     expectedReview: Date,          // +6 months
 *     expectedApproval: Date         // +18-36 months
 *   },
 *   companyRemainingCash: number
 * }
 * 
 * @example
 * POST /api/ai/research/patents
 * {
 *   "projectId": "673f5e8b1a2b3c4d5e6f7890",
 *   "breakthroughIndex": 0,
 *   "international": true,
 *   "jurisdictions": ["US", "EU", "CN", "JP"]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { companyId, userId } = session!;

    // 2. Parse request body
    const body = await req.json();
    const { projectId, breakthroughIndex, international, jurisdictions } = body;

    // 3. Validate required fields
    if (!projectId || breakthroughIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, breakthroughIndex' },
        { status: 400 }
      );
    }

    // 4. Validate breakthrough index
    if (breakthroughIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid breakthrough index (must be >= 0)' },
        { status: 400 }
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Find company and verify ownership
    const company = await Company.findById(companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this company' },
        { status: 403 }
      );
    }

    // 7. Find research project
    const project = await AIResearchProject.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Research project not found' },
        { status: 404 }
      );
    }

    // 8. Verify project belongs to user's company
    if (project.company.toString() !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Research project does not belong to your company' },
        { status: 403 }
      );
    }

    // 9. Validate breakthrough exists
    if (breakthroughIndex >= project.breakthroughs.length) {
      return NextResponse.json(
        { success: false, error: `Invalid breakthrough index (project has ${project.breakthroughs.length} breakthroughs)` },
        { status: 400 }
      );
    }

    const breakthrough = project.breakthroughs[breakthroughIndex];

    // 10. Check if breakthrough is patentable
    if (!breakthrough.patentable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Breakthrough is not patentable',
          details: 'Insufficient novelty or impact for patent filing. Consider publishing as research paper instead.',
        },
        { status: 400 }
      );
    }

    // 11. Check if patent already filed for this breakthrough
    const existingPatent = project.patents.find(
      p => p.title === `${breakthrough.name} Patent`
    );

    if (existingPatent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patent already filed for this breakthrough',
          existingPatentId: existingPatent.patentId,
        },
        { status: 400 }
      );
    }

    // 12. Calculate filing cost
    const costResult = calculatePatentFilingCost(
      breakthrough.area as any,
      international || false,
      jurisdictions || []
    );

    // 13. Check if company has sufficient funds
    if (company.revenue < costResult.totalCost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient funds for patent filing',
          required: costResult.totalCost,
          available: company.revenue,
          shortfall: costResult.totalCost - company.revenue,
        },
        { status: 400 }
      );
    }

    // 14. Deduct filing cost
    company.revenue -= costResult.totalCost;
    company.expenses += costResult.totalCost;
    await company.save();

    // 15. Create patent record
    const patentId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const patent = {
      patentId,
      title: `${breakthrough.name} Patent`,
      area: breakthrough.area,
      filedAt: new Date(),
      status: 'Filed' as const,
      filingCost: costResult.totalCost,
      estimatedValue: breakthrough.estimatedPatentValue || 0,
      licensingRevenue: 0,
      citations: 0,
    };

    // 16. Add patent to project
    project.patents.push(patent);
    await project.save();

    // 17. Log patent filing
    console.log(`[POST /api/ai/research/patents] Patent filed: ${patentId} for company ${company.industry} (cost: $${costResult.totalCost})`);

    // 18. Return success response
    return NextResponse.json({
      success: true,
      message: 'Patent filed successfully',
      patent,
      costs: costResult,
      timeline: costResult.timeline,
      companyRemainingCash: company.revenue,
    });
  } catch (error) {
    return handleAPIError('[POST /api/ai/research/patents]', error, 'Failed to file patent');
  }
}
