/**
 * @file src/app/api/politics/fundraising/[id]/route.ts
 * @description Donor CRUD and contribution operations
 * @created 2025-11-29
 * @author ECHO v1.3.3
 *
 * ENDPOINTS:
 * GET /api/politics/fundraising/:id - Get donor details
 * PATCH /api/politics/fundraising/:id - Update donor or record contribution
 * DELETE /api/politics/fundraising/:id - Delete donor
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Donor from '@/lib/db/models/politics/Donor';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const recordContributionSchema = z.object({
  action: z.literal('recordContribution'),
  amount: z.number().min(0.01),
  type: z.string(),
  campaignId: z.string().optional(),
  electionType: z.enum(['Primary', 'General', 'Special', 'Runoff']),
  earmarked: z.string().optional(),
});

const updateDetailsSchema = z.object({
  action: z.literal('updateDetails'),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  issueInterests: z.array(z.string()).optional(),
});

// ============================================================================
// GET - Get Donor Details
// ============================================================================

/**
 * GET /api/politics/fundraising/:id
 * Get full donor details with contribution history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid donor ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const donor = await Donor.findById(id).lean();

    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Get last contribution date
    const lastContribution = (donor.contributions && donor.contributions.length > 0)
      ? donor.contributions[donor.contributions.length - 1]
      : null;

    return NextResponse.json({
      success: true,
      data: {
        _id: donor._id.toString(),
        name: (donor as any).name,
        donorType: donor.donorType,
        tier: (donor as any).tier,
        occupation: typeof (donor as any).occupation === 'string' ? undefined : (donor as any).occupation?.occupation,
        employer: typeof (donor as any).occupation === 'string' ? undefined : (donor as any).occupation?.employer,
        email: (donor as any).contact?.email,
        phone: (donor as any).contact?.phone,
        address: (donor as any).contact ? `${(donor as any).contact.address}, ${(donor as any).contact.city}, ${(donor as any).contact.state} ${(donor as any).contact.zip}` : undefined,
        maxContribution: donor.maxContribution,
        remainingCapacity: (donor as any).remainingCapacity,
        totalContributed: donor.totalContributed,
        thisElectionCycle: (donor as any).thisElectionCycle ?? 0,
        contributionCount: (donor as any).contributionCount ?? 0,
        averageContribution: (donor as any).averageContribution ?? 0,
        lastContributionDate: lastContribution?.date,
        contributions: ((donor as any).contributions ?? []).slice(-20).map((c: any) => ({
          amount: c.amount,
          date: c.date,
          type: c.type,
          campaignId: c.campaignId?.toString(),
          electionType: c.electionType,
          receiptId: c.receiptId,
        })),
        isBundler: donor.isBundler,
        bundledAmount: donor.bundledAmount,
        bundlerNetwork: Array.isArray((donor as any).bundlerNetwork) ? (donor as any).bundlerNetwork.length : 0,
        preferredParty: (donor as any).preferredParty,
        issueInterests: (donor as any).issueInterests ?? [],
        preferredContact: (donor as any).preferredContact,
        optedOut: (donor as any).optedOut ?? false,
      },
    });
  } catch (error) {
    console.error('GET /api/politics/fundraising/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Donor / Record Contributions
// ============================================================================

/**
 * PATCH /api/politics/fundraising/:id
 * Update donor, record contributions, pledges, solicitations
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid donor ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const donor = await Donor.findById(id);

    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Record a contribution
    if (body.action === 'recordContribution') {
      const data = recordContributionSchema.parse(body);

      // Check contribution limits
      const remainingCapacity = (donor as any).remainingCapacity ?? ((donor as any).maxContribution ?? 0) - ((donor as any).thisElectionCycle ?? 0);
      if (data.amount > remainingCapacity) {
        return NextResponse.json(
          {
            success: false,
            error: `Amount exceeds remaining capacity of $${donor.remainingCapacity}`,
          },
          { status: 400 }
        );
      }

      // Add contribution
      if (!Array.isArray((donor as any).contributions)) (donor as any).contributions = [];
      (donor as any).contributions.push({
        campaignId: data.campaignId as unknown as import('mongoose').Types.ObjectId,
        amount: data.amount,
        type: data.type as any,
        date: new Date(),
        electionType: data.electionType,
        receiptId: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        earmarked: data.earmarked,
        isRefund: false,
        filedWithFEC: false,
      });

      // Update aggregates
      (donor as any).totalContributed = ((donor as any).totalContributed ?? 0) + data.amount;
      (donor as any).thisElectionCycle = ((donor as any).thisElectionCycle ?? 0) + data.amount;
      (donor as any).contributionCount = ((donor as any).contributionCount ?? 0) + 1;
      (donor as any).averageContribution = (donor as any).totalContributed / (donor as any).contributionCount;
      (donor as any).remainingCapacity = Math.max(0, ((donor as any).maxContribution ?? 0) - (donor as any).thisElectionCycle);

      await donor.save();

      return NextResponse.json({
        success: true,
        message: `Contribution of $${data.amount} recorded`,
        totalContributed: donor.totalContributed,
        remainingCapacity: (donor as any).remainingCapacity,
      });
    }

    // Update details
    if (body.action === 'updateDetails') {
      const data = updateDetailsSchema.parse(body);

      if (data.occupation !== undefined || data.employer !== undefined) {
        if (!(donor as any).occupation || typeof (donor as any).occupation === 'string') {
          (donor as any).occupation = { occupation: '', employer: '' };
        }
        if (data.occupation !== undefined) (donor as any).occupation.occupation = data.occupation;
        if (data.employer !== undefined) (donor as any).occupation.employer = data.employer;
      }
      if (!(donor as any).contact) (donor as any).contact = {};
      if (data.email !== undefined) (donor as any).contact.email = data.email;
      if (data.phone !== undefined) (donor as any).contact.phone = data.phone;
      if (data.issueInterests !== undefined)
        donor.issueInterests = data.issueInterests;

      await donor.save();

      return NextResponse.json({
        success: true,
        message: 'Donor details updated',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PATCH /api/politics/fundraising/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update donor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Donor
// ============================================================================

/**
 * DELETE /api/politics/fundraising/:id
 * Delete a donor (only prospects with no contributions)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid donor ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const donor = await Donor.findById(id);

    if (!donor) {
      return NextResponse.json(
        { success: false, error: 'Donor not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting donors with contributions (legal records)
    if (((donor as any).contributionCount ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete donors with contribution history',
        },
        { status: 400 }
      );
    }

    await Donor.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Donor deleted',
    });
  } catch (error) {
    console.error('DELETE /api/politics/fundraising/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete donor' },
      { status: 500 }
    );
  }
}
