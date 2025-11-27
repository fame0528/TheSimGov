/**
 * @file app/api/companies/[id]/add-experience/route.ts
 * @description API endpoint for awarding experience points to company
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * POST endpoint that awards XP to company from various sources
 * (contract completion, milestones, achievements, admin grants).
 * Validates amount and source, then updates company experience.
 * 
 * USAGE:
 * ```typescript
 * // POST /api/companies/[id]/add-experience
 * const response = await fetch(`/api/companies/${companyId}/add-experience`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     amount: 100,
 *     source: 'contract_completion',
 *     description: 'Completed Government Project #123'
 *   })
 * });
 * ```
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import dbConnect from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import { awardExperience, type XPSource } from '@/lib/utils/levelProgression';

/**
 * Request body schema
 */
interface AddExperienceRequest {
  amount: number;
  source: XPSource;
  description?: string;
}

/**
 * POST /api/companies/[id]/add-experience
 * Award experience points to company
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    // Find company and verify ownership
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this company' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as AddExperienceRequest;
    const { amount, source, description } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate source
    const validSources: XPSource[] = [
      'contract_completion',
      'revenue_milestone',
      'employee_milestone',
      'reputation_gain',
      'achievement',
      'admin_grant',
    ];
    
    if (!source || !validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Award XP (unused params will be used in future for XP history logging)
    const updated = await awardExperience(company, amount, source, description);

    return NextResponse.json(
      {
        company: updated,
        message: `Awarded ${amount} XP to ${company.name}`,
        experienceGained: amount,
        totalExperience: updated.experience,
        experienceToNextLevel: updated.experienceToNextLevel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error awarding experience:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to award experience',
      },
      { status: 500 }
    );
  }
}
