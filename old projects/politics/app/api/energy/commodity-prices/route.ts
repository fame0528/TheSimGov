/**
 * @fileoverview Commodity Prices API Routes
 * 
 * GET /api/energy/commodity-prices - List commodity prices with filtering
 * POST /api/energy/commodity-prices - Create/update commodity price tick
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CommodityPrice, { CommodityType } from '@/src/lib/db/models/CommodityPrice';

/**
 * GET /api/energy/commodity-prices
 * 
 * List commodity prices with optional filtering
 * 
 * Query Parameters:
 * - commodity?: CommodityType - Filter by commodity type
 * - startDate?: string - Filter prices after this date (ISO string)
 * - endDate?: string - Filter prices before this date (ISO string)
 * - opecEventActive?: boolean - Filter by active OPEC events
 * 
 * @returns { prices: ICommodityPrice[] }
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
    const commodity = searchParams.get('commodity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const opecEventActive = searchParams.get('opecEventActive');

    // Build query
    const query: any = {};

    if (commodity) {
      query.commodity = commodity;
    }

    if (startDate || endDate) {
      query.lastUpdated = {};
      if (startDate) {
        query.lastUpdated.$gte = new Date(startDate);
      }
      if (endDate) {
        query.lastUpdated.$lte = new Date(endDate);
      }
    }

    if (opecEventActive === 'true') {
      query.activeOpecEvent = true;
    } else if (opecEventActive === 'false') {
      query.activeOpecEvent = false;
    }

    const prices = await CommodityPrice.find(query)
      .sort({ lastUpdated: -1 })
      .limit(100);

    return NextResponse.json({
      prices,
      count: prices.length,
    });

  } catch (error: unknown) {
    console.error('GET /api/energy/commodity-prices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commodity prices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy/commodity-prices
 * 
 * Create or update commodity price tick
 * 
 * Request Body:
 * - commodity: CommodityType - Commodity to update
 * - price: number - New price
 * - volume: number - Trading volume
 * 
 * @returns { price: ICommodityPrice }
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
    const { commodity, price, volume } = body;

    // Validate required fields
    if (!commodity || price === undefined || volume === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: commodity, price, volume' },
        { status: 400 }
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

    // Find existing price record for this commodity
    let commodityPrice = await CommodityPrice.findOne({ commodity });

    if (commodityPrice) {
      // Update existing price
      await commodityPrice.updatePrice(price, volume);
      await commodityPrice.save();
    } else {
      // Create new price record
      commodityPrice = await CommodityPrice.create({
        commodity,
        currentPrice: price,
        previousClose: price, // First entry, same as current
        volume,
        priceHistory: [{ price, timestamp: new Date(), volume }],
        volatility7d: 0,
        volatility30d: 0,
        volatility90d: 0,
        marketSentiment: 'Neutral',
        sentimentConfidence: 50,
        activeOpecEvent: false,
      });
    }

    return NextResponse.json({
      price: commodityPrice,
      message: 'Commodity price updated successfully',
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/commodity-prices error:', error);
    return NextResponse.json(
      { error: 'Failed to update commodity price' },
      { status: 500 }
    );
  }
}
