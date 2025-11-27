/**
 * @fileoverview OPEC Events API Routes
 * 
 * POST /api/energy/commodity-prices/opec-events - Apply OPEC event to commodity
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import CommodityPrice, { OpecEventType } from '@/src/lib/db/models/CommodityPrice';

/**
 * POST /api/energy/commodity-prices/opec-events
 * 
 * Apply OPEC event to commodity price
 * 
 * Request Body:
 * - commodity: string - Commodity to affect
 * - eventType: OpecEventType - Type of OPEC event
 * - duration: number - Duration in days
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
    const { commodity, eventType, duration } = body;

    // Validate required fields
    if (!commodity || !eventType || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: commodity, eventType, duration' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes: OpecEventType[] = [
      'ProductionCut',
      'ProductionIncrease',
      'Embargo',
      'PriceWar',
      'StabilityPact'
    ];

    if (!validEventTypes.includes(eventType as OpecEventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration < 1 || duration > 365) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Find commodity price
    const commodityPrice = await CommodityPrice.findOne({ commodity });

    if (!commodityPrice) {
      return NextResponse.json(
        { error: `Commodity price not found for: ${commodity}` },
        { status: 404 }
      );
    }

    // Check if event already active
    if (commodityPrice.activeOpecEvent) {
      return NextResponse.json(
        { error: `OPEC event already active for ${commodity}. Resolve existing event first.` },
        { status: 409 }
      );
    }

    // Apply OPEC event
    await commodityPrice.applyOpecEvent(eventType as OpecEventType, duration);
    await commodityPrice.save();

    return NextResponse.json({
      price: commodityPrice,
      message: `OPEC ${eventType} event applied to ${commodity} for ${duration} days`,
      eventDetails: {
        type: eventType,
        startDate: commodityPrice.opecEventStartDate,
        endDate: new Date(commodityPrice.opecEventStartDate!.getTime() + duration * 24 * 60 * 60 * 1000),
        priceImpact: `${commodityPrice.currentPrice > commodityPrice.previousClose ? '+' : ''}${commodityPrice.getPriceChangePercent().toFixed(2)}%`,
      },
    });

  } catch (error: unknown) {
    console.error('POST /api/energy/commodity-prices/opec-events error:', error);
    return NextResponse.json(
      { error: 'Failed to apply OPEC event' },
      { status: 500 }
    );
  }
}
