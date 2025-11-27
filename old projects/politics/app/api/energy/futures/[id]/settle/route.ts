/**
 * @fileoverview Futures Contract Settlement API
 * 
 * POST /api/energy/futures/[id]/settle - Settle futures contract at expiry
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import FuturesContract from '@/src/lib/db/models/FuturesContract';
import Company from '@/src/lib/db/models/Company';

/**
 * POST /api/energy/futures/[id]/settle
 * 
 * Settle futures contract at expiry
 * 
 * Request Body:
 * - settlementPrice: number - Final settlement price
 * 
 * @returns { contract: IFuturesContract }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { settlementPrice } = body;

    // Validate settlement price
    if (settlementPrice === undefined || settlementPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid settlement price' },
        { status: 400 }
      );
    }

    // Find contract
    const contract = await FuturesContract.findById(id).populate('company');

    if (!contract) {
      return NextResponse.json(
        { error: 'Futures contract not found' },
        { status: 404 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(contract.company);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to settle this contract' },
        { status: 403 }
      );
    }

    // Check if contract already settled
    if (contract.status === 'Settled') {
      return NextResponse.json(
        { error: 'Contract already settled' },
        { status: 409 }
      );
    }

    // Check if contract is closed
    if (contract.status === 'Closed') {
      return NextResponse.json(
        { error: 'Contract already closed. Cannot settle closed contract.' },
        { status: 409 }
      );
    }

    // Check if contract is liquidated
    if (contract.status === 'Liquidated') {
      return NextResponse.json(
        { error: 'Contract already liquidated. Cannot settle liquidated contract.' },
        { status: 409 }
      );
    }

    // Settle contract
    await contract.settleContract(settlementPrice);
    await contract.save();

    // Update company cash with realized P&L
    company.cash += contract.realizedPnL;
    await company.save();

    return NextResponse.json({
      contract,
      message: 'Futures contract settled successfully',
      settlement: {
        settlementPrice,
        realizedPnL: contract.realizedPnL,
        pnlPercent: contract.totalContractValue > 0 ? ((contract.realizedPnL / contract.totalContractValue) * 100).toFixed(2) + '%' : '0%',
        marginReleased: contract.currentMarginBalance,
      },
      companyBalance: {
        previousCash: company.cash - contract.realizedPnL,
        realizedPnL: contract.realizedPnL,
        newCash: company.cash,
      },
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/futures/[id]/settle error:', error);
    return NextResponse.json(
      { error: 'Failed to settle futures contract' },
      { status: 500 }
    );
  }
}
