/**
 * @fileoverview Market Data Analytics API
 * 
 * GET /api/energy/market-data/analytics - Calculate technical indicators
 * 
 * @created 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import MarketData, { CommodityType } from '@/src/lib/db/models/MarketData';

/**
 * GET /api/energy/market-data/analytics
 * 
 * Calculate technical indicators for a commodity
 * 
 * Query Parameters:
 * - commodity: CommodityType - Commodity to analyze (required)
 * - period?: number - Analysis period in days (default: 30)
 * 
 * @returns Technical indicators and analytics
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
    const period = parseInt(searchParams.get('period') || '30', 10);

    // Validate required parameters
    if (!commodity) {
      return NextResponse.json(
        { error: 'Missing required parameter: commodity' },
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

    // Validate period
    if (period < 1 || period > 365) {
      return NextResponse.json(
        { error: 'Period must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Get most recent market data point for this commodity
    const latestData = await MarketData.findOne({
      commodity,
      granularity: '1day',
    }).sort({ timestamp: -1 });

    if (!latestData) {
      return NextResponse.json(
        { error: `No market data found for ${commodity}` },
        { status: 404 }
      );
    }

    // Calculate technical indicators
    const [
      sma7,
      sma30,
      sma90,
      sma200,
      ema7,
      ema30,
      volatility7d,
      volatility30d,
      volatility90d,
      rsi,
      bollingerBands20,
      bollingerBands50,
    ] = await Promise.all([
      latestData.calculateSMA(7),
      latestData.calculateSMA(30),
      latestData.calculateSMA(90),
      latestData.calculateSMA(200),
      latestData.calculateEMA(7),
      latestData.calculateEMA(30),
      latestData.calculateVolatility(7),
      latestData.calculateVolatility(30),
      latestData.calculateVolatility(90),
      latestData.calculateRSI(14),
      latestData.getBollingerBands(20, 2),
      latestData.getBollingerBands(50, 2),
    ]);

    // Get price correlation with other commodities
    const otherCommodities = validCommodities.filter(c => c !== commodity);
    const correlations: { [key: string]: number } = {};

    for (const otherCommodity of otherCommodities) {
      const correlation = await MarketData.calculateCorrelation(
        commodity as CommodityType,
        otherCommodity,
        period
      );
      correlations[otherCommodity] = correlation;
    }

    // Determine trend based on moving averages
    let trend = 'Neutral';
    if (latestData.close > sma7 && sma7 > sma30 && sma30 > sma90) {
      trend = 'Strong Uptrend';
    } else if (latestData.close > sma7 && sma7 > sma30) {
      trend = 'Uptrend';
    } else if (latestData.close < sma7 && sma7 < sma30 && sma30 < sma90) {
      trend = 'Strong Downtrend';
    } else if (latestData.close < sma7 && sma7 < sma30) {
      trend = 'Downtrend';
    }

    // Determine RSI signal
    let rsiSignal = 'Neutral';
    if (rsi > 70) {
      rsiSignal = 'Overbought';
    } else if (rsi < 30) {
      rsiSignal = 'Oversold';
    }

    // Determine Bollinger Band position
    let bollingerPosition = 'Middle';
    if (latestData.close > bollingerBands20.upper) {
      bollingerPosition = 'Above Upper Band (Overbought)';
    } else if (latestData.close < bollingerBands20.lower) {
      bollingerPosition = 'Below Lower Band (Oversold)';
    } else if (latestData.close > bollingerBands20.middle) {
      bollingerPosition = 'Upper Half (Bullish)';
    } else {
      bollingerPosition = 'Lower Half (Bearish)';
    }

    return NextResponse.json({
      commodity,
      period,
      timestamp: latestData.timestamp,
      currentPrice: latestData.close,
      
      movingAverages: {
        sma7,
        sma30,
        sma90,
        sma200,
        ema7,
        ema30,
      },
      
      volatility: {
        sevenDay: volatility7d,
        thirtyDay: volatility30d,
        ninetyDay: volatility90d,
        status: volatility30d > 30 ? 'High' : volatility30d > 15 ? 'Moderate' : 'Low',
      },
      
      momentum: {
        rsi,
        signal: rsiSignal,
        interpretation: rsi > 70 ? 'Consider selling' : rsi < 30 ? 'Consider buying' : 'Hold',
      },
      
      bollingerBands: {
        period20: bollingerBands20,
        period50: bollingerBands50,
        currentPosition: bollingerPosition,
      },
      
      correlations,
      
      analysis: {
        trend,
        volatilityStatus: volatility30d > 30 ? 'High volatility environment' : 'Normal volatility',
        tradingSignals: {
          trend: trend.includes('Uptrend') ? 'Bullish' : trend.includes('Downtrend') ? 'Bearish' : 'Neutral',
          momentum: rsiSignal,
          volatility: volatility30d > 30 ? 'High risk' : 'Normal risk',
        },
      },
    });

  } catch (error: unknown) {
    console.error('GET /api/energy/market-data/analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate market analytics' },
      { status: 500 }
    );
  }
}
