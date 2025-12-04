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

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import Donor from '@/lib/db/models/politics/Donor';
import type { IDonor } from '@/lib/db/models/politics/Donor';
import type { DonorLean, DonorContributionLean } from '@/lib/types/politics-lean';
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
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid donor ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const donor = await Donor.findById(id).lean() as DonorLean | null;

    if (!donor) {
      return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    }

    // Get last contribution date
    const lastContribution = (donor.contributions && donor.contributions.length > 0)
      ? donor.contributions[donor.contributions.length - 1]
      : null;

    // Format address from contact sub-document
    const formatAddress = (contact: typeof donor.contact) => {
      if (!contact) return undefined;
      const parts = [contact.address, contact.city, contact.state, contact.zip].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : undefined;
    };

    return createSuccessResponse({
      _id: donor._id.toString(),
      name: donor.donorName,
      donorType: donor.donorType,
      tier: donor.tier,
      occupation: donor.occupation,
      employer: donor.employer,
      email: donor.contact?.email,
      phone: donor.contact?.phone,
      address: formatAddress(donor.contact),
      maxContribution: donor.maxContribution ?? donor.complianceLimit,
      remainingCapacity: donor.remainingCapacity,
      totalContributed: donor.totalContributed,
      thisElectionCycle: donor.thisElectionCycle ?? 0,
      contributionCount: donor.contributionCount ?? 0,
      averageContribution: donor.averageContribution ?? 0,
      lastContributionDate: lastContribution?.date,
      contributions: (donor.contributions ?? []).slice(-20).map((c: DonorContributionLean) => ({
        amount: c.amount,
        date: c.date,
        type: c.type,
        campaignId: c.campaignId?.toString(),
        electionType: c.electionType,
        receiptId: c.receiptId,
      })),
      isBundler: donor.isBundler,
      bundledAmount: donor.bundledAmount,
      bundlerNetwork: Array.isArray(donor.bundlerNetwork) ? donor.bundlerNetwork.length : 0,
      preferredParty: donor.preferredParty,
      issueInterests: donor.issueInterests ?? [],
      preferredContact: donor.preferredContact,
      optedOut: donor.optedOut ?? false,
    });
  } catch (error) {
    console.error('GET /api/politics/fundraising/[id] error:', error);
    return createErrorResponse('Failed to fetch donor', 'INTERNAL_ERROR', 500);
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
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid donor ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const donor = await Donor.findById(id) as IDonor | null;

    if (!donor) {
      return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    }

    const body = await req.json();

    // Record a contribution
    if (body.action === 'recordContribution') {
      const data = recordContributionSchema.parse(body);

      // Check contribution limits
      const remainingCapacity = donor.remainingCapacity ?? (donor.maxContribution ?? donor.complianceLimit) - (donor.thisElectionCycle ?? 0);
      if (data.amount > remainingCapacity) {
        return createErrorResponse(
          `Amount exceeds remaining capacity of $${remainingCapacity}`,
          'VALIDATION_ERROR',
          400
        );
      }

      // Add contribution
      if (!Array.isArray(donor.contributions)) donor.contributions = [];
      donor.contributions.push({
        amount: data.amount,
        type: data.type,
        date: new Date(),
      });

      // Update aggregates
      donor.totalContributed = (donor.totalContributed ?? 0) + data.amount;
      donor.thisElectionCycle = (donor.thisElectionCycle ?? 0) + data.amount;
      donor.contributionCount = (donor.contributionCount ?? 0) + 1;
      donor.averageContribution = donor.totalContributed / donor.contributionCount;
      donor.remainingCapacity = Math.max(0, (donor.maxContribution ?? donor.complianceLimit) - donor.thisElectionCycle);

      await donor.save();

      return createSuccessResponse({
        message: `Contribution of $${data.amount} recorded`,
        totalContributed: donor.totalContributed,
        remainingCapacity: donor.remainingCapacity,
      });
    }

    // Update details
    if (body.action === 'updateDetails') {
      const data = updateDetailsSchema.parse(body);

      // Model has occupation/employer as direct string fields
      if (data.occupation !== undefined) donor.occupation = data.occupation;
      if (data.employer !== undefined) donor.employer = data.employer;
      
      // Contact is a sub-document
      if (!donor.contact) donor.contact = {};
      if (data.email !== undefined) donor.contact.email = data.email;
      if (data.phone !== undefined) donor.contact.phone = data.phone;
      if (data.issueInterests !== undefined)
        donor.issueInterests = data.issueInterests;

      await donor.save();

      return createSuccessResponse({
        message: 'Donor details updated',
      });
    }

    return createErrorResponse('Unknown action', 'VALIDATION_ERROR', 400);
  } catch (error) {
    console.error('PATCH /api/politics/fundraising/[id] error:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid data', 'VALIDATION_ERROR', 400, error.errors);
    }

    return createErrorResponse('Failed to update donor', 'INTERNAL_ERROR', 500);
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
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse('Invalid donor ID', 'VALIDATION_ERROR', 400);
    }

    await connectDB();

    const donor = await Donor.findById(id) as IDonor | null;

    if (!donor) {
      return createErrorResponse('Donor not found', 'NOT_FOUND', 404);
    }

    // Don't allow deleting donors with contributions (legal records)
    if ((donor.contributionCount ?? 0) > 0) {
      return createErrorResponse(
        'Cannot delete donors with contribution history',
        'VALIDATION_ERROR',
        400
      );
    }

    await Donor.findByIdAndDelete(id);

    return createSuccessResponse({
      message: 'Donor deleted',
    });
  } catch (error) {
    console.error('DELETE /api/politics/fundraising/[id] error:', error);
    return createErrorResponse('Failed to delete donor', 'INTERNAL_ERROR', 500);
  }
}
