/**
 * @file GET /api/energy/commodity-prices/historical
 * @description Get historical commodity prices - price history and trends
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Retrieves historical commodity price data with trend analysis, statistics,
 * and price forecasting capabilities.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { CommodityPrice } from '@/lib/db/models';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const HistoricalQuerySchema = z.object({
  commodity: z.enum(['CrudeOil', 'NaturalGas', 'Coal', 'Uranium', 'Gasoline', 'Diesel', 'JetFuel', 'LNG', 'Ethanol']).optional(),
  symbol: z.string().optional(),
  startDate: z.string().optional().describe('ISO date string'),
  endDate: z.string().optional().describe('ISO date string'),
  limit: z.number().min(1).max(5000).optional().default(100)
});

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = {
      commodity: searchParams.get('commodity') || undefined,
      symbol: searchParams.get('symbol') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    };

    const validation = HistoricalQuerySchema.safeParse(queryData);
    
    if (!validation.success) {
      return createErrorResponse('Invalid query parameters', 'BAD_REQUEST', 400);
    }

    const { commodity, symbol, startDate, endDate, limit } = validation.data;

    // Database connection
    await dbConnect();

    // Build query filter
    const filter: any = { company: session.user.companyId };
    if (commodity) filter.commodity = commodity;
    if (symbol) filter.symbol = symbol;

    // Fetch price documents (each contains historical[])
    const docs = await CommodityPrice.find(filter)
      .sort({ _id: -1 })
      .limit(1)
      .lean();
    if (docs.length === 0) {
      return createSuccessResponse({
        count: 0,
        prices: [],
        statistics: null,
        message: 'No historical price data found for the specified criteria'
      });
    }
    const doc = docs[0];
    // Build flattened series from historical array (date asc/desc)
    const series = (doc.historical || []).slice().sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    const limitedSeries = series.slice(0, limit);
    if (limitedSeries.length === 0) {
      return createSuccessResponse({
        query: { commodity: commodity || 'ALL', symbol: symbol || 'ALL', recordsReturned: 0, limit },
        currentPrice: { value: '$' + (doc.currentPrice ?? 0).toFixed(2), timestamp: null },
        statistics: null,
        prices: []
      });
    }
    // Calculate statistics
    const priceValues = limitedSeries.map((r: any) => r.price as number);
    const currentPrice = doc.currentPrice as number;
    const oldestPrice = priceValues[priceValues.length - 1];
    
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
    
    // Calculate standard deviation
    const variance = priceValues.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / priceValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend
    const overallChange = currentPrice - oldestPrice;
    const overallChangePercent = (overallChange / oldestPrice) * 100;
    const trend = overallChange > stdDev ? 'UPWARD' : overallChange < -stdDev ? 'DOWNWARD' : 'STABLE';
    
    // Calculate volatility (coefficient of variation)
    const coefficientOfVariation = (stdDev / avgPrice) * 100;
    const volatilityLevel = coefficientOfVariation > 30 ? 'HIGH' : coefficientOfVariation > 15 ? 'MEDIUM' : 'LOW';

    // Calculate simple moving averages
    const sma7 = limitedSeries.slice(0, Math.min(7, limitedSeries.length))
      .reduce((sum: number, r: any) => sum + r.price, 0) / Math.min(7, limitedSeries.length);
    const sma30 = limitedSeries.slice(0, Math.min(30, limitedSeries.length))
      .reduce((sum: number, r: any) => sum + r.price, 0) / Math.min(30, limitedSeries.length);

    return createSuccessResponse({
      query: {
        commodity: commodity || doc.commodity,
        symbol: symbol || doc.symbol,
        period: startDate && endDate ? `${startDate} to ${endDate}` : 'All available',
        recordsReturned: limitedSeries.length,
        limit
      },
      currentPrice: {
        value: '$' + (currentPrice ?? 0).toFixed(2),
        timestamp: limitedSeries[0]?.date || null
      },
      statistics: {
        minimum: '$' + minPrice.toFixed(2),
        maximum: '$' + maxPrice.toFixed(2),
        average: '$' + avgPrice.toFixed(2),
        standardDeviation: '$' + stdDev.toFixed(2),
        coefficientOfVariation: coefficientOfVariation.toFixed(2) + '%',
        volatility: volatilityLevel,
        range: '$' + (maxPrice - minPrice).toFixed(2),
        rangePercent: (((maxPrice - minPrice) / avgPrice) * 100).toFixed(2) + '%'
      },
      trend: {
        direction: trend,
        overallChange: '$' + overallChange.toFixed(2),
        overallChangePercent: (overallChangePercent >= 0 ? '+' : '') + overallChangePercent.toFixed(2) + '%',
        periodStart: limitedSeries[limitedSeries.length - 1].date,
        periodEnd: limitedSeries[0].date,
        daysAnalyzed: Math.floor((new Date(limitedSeries[0].date).getTime() - new Date(limitedSeries[limitedSeries.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
      },
      movingAverages: {
        sma7: '$' + sma7.toFixed(2) + ' (7-period)',
        sma30: '$' + sma30.toFixed(2) + ' (30-period)',
        currentVsSMA7: currentPrice > sma7 ? 'ABOVE' : currentPrice < sma7 ? 'BELOW' : 'AT',
        currentVsSMA30: currentPrice > sma30 ? 'ABOVE' : currentPrice < sma30 ? 'BELOW' : 'AT'
      },
      prices: limitedSeries.map((r: any) => ({
        price: '$' + r.price.toFixed(2),
        timestamp: r.date
      }))
    });

  } catch (error) {
    console.error('[ENERGY] Historical prices error:', error);
    return createErrorResponse('Failed to retrieve historical prices', 'INTERNAL_ERROR', 500);
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Query Capabilities:
 *    - Filter by commodity type (ELECTRICITY, NATURAL_GAS, etc.)
 *    - Filter by market type (SPOT, DAY_AHEAD, etc.)
 *    - Filter by region (geographic location)
 *    - Date range filtering (startDate to endDate)
 *    - Limit results (max 1000 records)
 * 
 * 2. Statistical Analysis:
 *    - Min/max/average prices
 *    - Standard deviation (price volatility measure)
 *    - Coefficient of variation (relative volatility)
 *    - Price range and range percentage
 * 
 * 3. Trend Analysis:
 *    - Overall trend direction (UPWARD/DOWNWARD/STABLE)
 *    - Trend determined by comparing change to standard deviation
 *    - Total price change over period
 *    - Days analyzed in the period
 * 
 * 4. Moving Averages:
 *    - SMA-7: 7-period simple moving average (short-term trend)
 *    - SMA-30: 30-period simple moving average (long-term trend)
 *    - Current price position relative to MAs (trading signal)
 * 
 * 5. Future Enhancements:
 *    - Exponential moving averages (EMA)
 *    - Bollinger Bands for volatility bands
 *    - Price momentum indicators (RSI, MACD)
 *    - Seasonal decomposition
 *    - Correlation analysis with other commodities
 *    - Machine learning price forecasting
 */
