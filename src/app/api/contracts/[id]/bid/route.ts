/**
 * @fileoverview Contract Bidding API
 * @module app/api/contracts/[id]/bid
 * 
 * OVERVIEW:
 * Submit bid for marketplace contract.
 * Deducts 10% upfront cost from company cash.
 * Changes contract status to 'bidding'.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Contract, Company } from '@/lib/db';
import { z } from 'zod';

/**
 * Bid Request Schema
 */
const bidSchema = z.object({
  companyId: z.string().min(1),
  bidAmount: z.number().positive().optional(), // Optional: bid higher than base
});

/**
 * POST /api/contracts/[id]/bid
 * 
 * Submit bid for marketplace contract
 * 
 * Body:
 * - companyId: Company placing bid (required)
 * - bidAmount: Bid amount (optional, defaults to baseValue)
 * 
 * @returns Updated contract with bidding status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const validation = bidSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { companyId, bidAmount } = validation.data;

    await connectDB();

    // Get contract
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify contract is in marketplace
    if (contract.status !== 'marketplace') {
      return NextResponse.json(
        { error: 'Contract not available for bidding' },
        { status: 400 }
      );
    }

    // Check if expired
    if (contract.isExpired) {
      return NextResponse.json(
        { error: 'Contract has expired' },
        { status: 400 }
      );
    }

    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify ownership
    if (company.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate final bid (use bidAmount or baseValue)
    const finalBid = bidAmount || contract.baseValue;
    
    // Validate bid is not lower than base
    if (bidAmount && bidAmount < contract.baseValue) {
      return NextResponse.json(
        { error: 'Bid must be at least base value' },
        { status: 400 }
      );
    }

    // Check company has enough cash for upfront cost
    if (company.cash < contract.upfrontCost) {
      return NextResponse.json(
        { error: 'Insufficient funds for upfront cost' },
        { status: 400 }
      );
    }

    // Deduct upfront cost from company
    company.cash -= contract.upfrontCost;
    await company.save();

    // Update contract status
    contract.status = 'bidding';
    contract.bidAmount = finalBid;
    await contract.save();

    return NextResponse.json({
      contract,
      company: {
        id: company._id,
        cash: company.cash,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Bid submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit bid', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Upfront Cost**: 10% required to prevent spam bids
 * 2. **Cash Validation**: Ensures company can afford bid
 * 3. **Status Transition**: marketplace → bidding
 * 4. **Expiration Check**: Prevents bids on expired contracts
 * 5. **Bid Amount**: Optional higher bid (competitive bidding)
 * 
 * PREVENTS:
 * - Bidding on non-marketplace contracts
 * - Bidding without sufficient funds
 * - Bidding on expired contracts
 * - Lowball bids below base value
 */
