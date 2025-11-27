/**
 * @fileoverview Market Data API Routes
 * 
 * GET /api/energy/market-data - Retrieve historical market data
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MarketData, { CommodityType, TimeGranularity } from '@/src/lib/db/models/MarketData';

/**
 * GET /api/energy/market-data
 * 
 * Retrieve historical market data with filtering
 * 
 * Query Parameters:
 * - commodity: CommodityType - Commodity to retrieve (required)
 * - granularity: TimeGranularity - Time granularity (required)
 * - startDate: string - Start date (ISO string, required)
 * - endDate: string - End date (ISO string, required)
 * 
 * @returns { data: IMarketData[], count: number }
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
    const granularity = searchParams.get('granularity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!commodity || !granularity || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: commodity, granularity, startDate, endDate' },
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

    // Validate granularity
    const validGranularities: TimeGranularity[] = [
      '1min',
      '5min',
      '15min',
      '1hour',
      '1day'
    ];

    if (!validGranularities.includes(granularity as TimeGranularity)) {
      return NextResponse.json(
        { error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    if (startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Retrieve historical data
    const data = await MarketData.find({
      commodity,
      granularity,
      timestamp: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    }).sort({ timestamp: 1 });

    // Calculate summary statistics
    if (data.length > 0) {
      const prices = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      
      const highestPrice = Math.max(...prices);
      const lowestPrice = Math.min(...prices);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
      const avgVolume = totalVolume / volumes.length;

      return NextResponse.json({
        data,
        count: data.length,
        summary: {
          commodity,
          granularity,
          period: {
            start: startDate,
            end: endDate,
            dataPoints: data.length,
          },
          priceStats: {
            highest: highestPrice,
            lowest: lowestPrice,
            average: avgPrice,
            range: highestPrice - lowestPrice,
            rangePercent: ((highestPrice - lowestPrice) / lowestPrice * 100).toFixed(2) + '%',
          },
          volumeStats: {
            total: totalVolume,
            average: avgVolume,
          },
        },
      });
    }

    return NextResponse.json({
      data: [],
      count: 0,
      message: 'No market data found for the specified period',
    });

  } catch (error: unknown) {
    console.error('GET /api/energy/market-data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
