/**
 * @fileoverview Futures Contracts API Routes
 * 
 * GET /api/energy/futures - List futures contracts with filtering
 * POST /api/energy/futures - Create new futures contract
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import FuturesContract, { CommodityType } from '@/src/lib/db/models/FuturesContract';
import Company from '@/src/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * GET /api/energy/futures
 * 
 * List futures contracts with optional filtering
 * 
 * Query Parameters:
 * - company?: string - Filter by company ID
 * - commodity?: CommodityType - Filter by commodity
 * - status?: ContractStatus - Filter by contract status
 * - positionType?: PositionType - Filter by Long/Short
 * 
 * @returns { contracts: IFuturesContract[], count: number }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const commodity = searchParams.get('commodity');
    const status = searchParams.get('status');
    const positionType = searchParams.get('positionType');

    // Build query
    const query: any = {};

    if (companyId) {
      // Verify company ownership
      const company = await Company.findById(companyId);
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      if (company.owner.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Not authorized to view this company\'s contracts' },
          { status: 403 }
        );
      }

      query.company = new Types.ObjectId(companyId);
    }

    if (commodity) {
      query.commodity = commodity;
    }

    if (status) {
      query.status = status;
    }

    if (positionType) {
      query.positionType = positionType;
    }

    const contracts = await FuturesContract.find(query)
      .populate('company', 'name industry')
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate total P&L for all contracts
    const totalUnrealizedPnL = contracts.reduce((sum, contract) => {
      return sum + contract.unrealizedPnL;
    }, 0);

    const totalRealizedPnL = contracts.reduce((sum, contract) => {
      return sum + contract.realizedPnL;
    }, 0);

    return NextResponse.json({
      contracts,
      count: contracts.length,
      summary: {
        totalUnrealizedPnL,
        totalRealizedPnL,
        totalPnL: totalUnrealizedPnL + totalRealizedPnL,
      },
    });

  } catch (error: unknown) {
    console.error('GET /api/energy/futures error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch futures contracts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/futures
 * 
 * Create new futures contract
 * 
 * Request Body:
 * - company: string - Company ID
 * - commodity: CommodityType - Commodity to trade
 * - positionType: PositionType - Long or Short
 * - contracts: number - Number of contracts
 * - strikePrice: number - Entry price
 * - expiryDate: string - Contract expiry date (ISO string)
 * 
 * @returns { contract: IFuturesContract }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { company: companyId, commodity, positionType, contracts, strikePrice, expiryDate } = body;

    // Validate required fields
    if (!companyId || !commodity || !positionType || !contracts || !strikePrice || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: company, commodity, positionType, contracts, strikePrice, expiryDate' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to create contracts for this company' },
        { status: 403 }
      );
    }

    // Validate commodity type
    const validCommodities: CommodityType[] = [
      'CrudeOil',
      'NaturalGas',
      'Electricity',
      'Gasoline',
      'Diesel',
      'Coal'
    ];

    if (!validCommodities.includes(commodity as CommodityType)) {
      return NextResponse.json(
        { error: `Invalid commodity. Must be one of: ${validCommodities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate position type
    if (!['Long', 'Short'].includes(positionType)) {
      return NextResponse.json(
        { error: 'Position type must be Long or Short' },
        { status: 400 }
      );
    }

    // Validate contracts count
    if (contracts < 1 || contracts > 10000) {
      return NextResponse.json(
        { error: 'Contracts must be between 1 and 10,000' },
        { status: 400 }
      );
    }

    // Validate expiry date is in future
    const expiryDateObj = new Date(expiryDate);
    if (expiryDateObj <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be in the future' },
        { status: 400 }
      );
    }

    // Create futures contract
    const contract = await FuturesContract.create({
      company: new Types.ObjectId(companyId),
      commodity,
      positionType,
      numberOfContracts: contracts,
      strikePrice,
      currentMarketPrice: strikePrice,
      expiryDate: expiryDateObj,
      status: 'Open',
      unrealizedPnL: 0,
      realizedPnL: 0,
      dailyPnL: 0,
      marginCallTriggered: false,
    });

    return NextResponse.json({
      contract,
      message: 'Futures contract created successfully',
      summary: contract.getPositionSummary(),
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/futures error:', error);
    return NextResponse.json(
      { error: 'Failed to create futures contract' },
      { status: 500 }
    );
  }
}
