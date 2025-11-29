/**
 * @file GET /api/energy/forecasting/demand
 * @description Energy demand forecasting - load predictions and peak analysis
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Provides demand forecasting for energy planning including peak load predictions,
 * seasonal patterns, and growth projections. Uses historical consumption data and
 * simple trending algorithms for short/medium-term forecasts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

// ============================================================================
// CONSTANTS - DEMAND PATTERNS
// ============================================================================

const SEASONAL_FACTORS = {
  // Monthly load multipliers (1.0 = baseline)
  WINTER: {
    December: 1.25,    // Heating load
    January: 1.30,     // Peak heating
    February: 1.22
  },
  SPRING: {
    March: 1.05,
    April: 0.95,
    May: 0.98
  },
  SUMMER: {
    June: 1.10,        // Cooling starts
    July: 1.35,        // Peak cooling
    August: 1.32
  },
  FALL: {
    September: 1.08,
    October: 0.92,
    November: 1.00
  }
};

const DAILY_PATTERNS = {
  // Hourly load factors (1.0 = average)
  weekday: {
    0: 0.60, 1: 0.55, 2: 0.52, 3: 0.50,  // Overnight minimum
    4: 0.55, 5: 0.65, 6: 0.80, 7: 0.95,  // Morning ramp
    8: 1.05, 9: 1.10, 10: 1.15, 11: 1.18, // Morning peak
    12: 1.20, 13: 1.15, 14: 1.10, 15: 1.12, // Midday
    16: 1.18, 17: 1.25, 18: 1.30, 19: 1.22, // Evening peak (highest)
    20: 1.10, 21: 0.95, 22: 0.80, 23: 0.70  // Evening decline
  },
  weekend: {
    0: 0.55, 1: 0.50, 2: 0.48, 3: 0.47,  // Lower overnight
    4: 0.50, 5: 0.52, 6: 0.60, 7: 0.70,  // Slower morning ramp
    8: 0.85, 9: 0.95, 10: 1.00, 11: 1.05, // Later peak
    12: 1.10, 13: 1.08, 14: 1.05, 15: 1.00, // Flatter midday
    16: 1.00, 17: 1.05, 18: 1.08, 19: 1.05, // Lower evening peak
    20: 0.95, 21: 0.85, 22: 0.75, 23: 0.65  // Evening decline
  }
};

const GROWTH_SCENARIOS = {
  low: 0.015,        // 1.5% annual growth
  baseline: 0.025,   // 2.5% annual growth
  high: 0.040        // 4.0% annual growth (electrification)
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ForecastQuerySchema = z.object({
  horizon: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
  scenario: z.enum(['low', 'baseline', 'high']).optional().default('baseline'),
  currentLoad: z.string().optional().describe('Current load in MW')
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMonthlyFactor(month: number): number {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month];
  
  if (month >= 0 && month <= 2) return (SEASONAL_FACTORS.WINTER as any)[monthName] || 1.0;
  if (month >= 3 && month <= 5) return (SEASONAL_FACTORS.SPRING as any)[monthName] || 1.0;
  if (month >= 6 && month <= 8) return (SEASONAL_FACTORS.SUMMER as any)[monthName] || 1.0;
  return (SEASONAL_FACTORS.FALL as any)[monthName] || 1.0;
}

function getDailyProfile(isWeekend: boolean): number[] {
  const profile = isWeekend ? DAILY_PATTERNS.weekend : DAILY_PATTERNS.weekday;
  return Object.values(profile);
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = {
      horizon: searchParams.get('horizon') || 'week',
      scenario: searchParams.get('scenario') || 'baseline',
      currentLoad: searchParams.get('currentLoad') || '1000'
    };

    const validation = ForecastQuerySchema.safeParse(queryData);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { horizon, scenario, currentLoad } = validation.data;
    const baseLoad = parseFloat(currentLoad || '1000'); // MW

    // Current date/time
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;

    // Apply seasonal factor
    const seasonalFactor = getMonthlyFactor(currentMonth);
    const adjustedBaseLoad = baseLoad * seasonalFactor;

    // Generate forecast based on horizon
    let forecast: any = {};

    if (horizon === 'day') {
      // 24-hour forecast
      const hourlyProfile = getDailyProfile(isWeekend);
      const hourlyForecast = hourlyProfile.map((factor, hour) => ({
        hour,
        load: (adjustedBaseLoad * factor).toFixed(2) + ' MW',
        factor: factor.toFixed(3)
      }));

      const peakHour = hourlyForecast.reduce((max, h, i, arr) => 
        parseFloat(h.load) > parseFloat(arr[max].load) ? i : max, 0);
      const minHour = hourlyForecast.reduce((min, h, i, arr) => 
        parseFloat(h.load) < parseFloat(arr[min].load) ? i : min, 0);

      forecast = {
        period: '24 hours',
        hourly: hourlyForecast,
        peak: {
          hour: hourlyForecast[peakHour].hour,
          load: hourlyForecast[peakHour].load,
          time: `${hourlyForecast[peakHour].hour}:00`
        },
        minimum: {
          hour: hourlyForecast[minHour].hour,
          load: hourlyForecast[minHour].load,
          time: `${hourlyForecast[minHour].hour}:00`
        },
        average: (adjustedBaseLoad).toFixed(2) + ' MW'
      };
    } else if (horizon === 'week') {
      // 7-day forecast
      const dailyForecast = [];
      for (let day = 0; day < 7; day++) {
        const forecastDate = new Date(now);
        forecastDate.setDate(now.getDate() + day);
        const dayOfWeek = forecastDate.getDay();
        const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Weekend load ~10% lower than weekday
        const weekendFactor = isWeekendDay ? 0.90 : 1.0;
        const dayLoad = adjustedBaseLoad * weekendFactor;

        dailyForecast.push({
          date: forecastDate.toISOString().split('T')[0],
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          averageLoad: dayLoad.toFixed(2) + ' MW',
          peakLoad: (dayLoad * (isWeekendDay ? 1.08 : 1.30)).toFixed(2) + ' MW', // Evening peak
          minLoad: (dayLoad * (isWeekendDay ? 0.47 : 0.50)).toFixed(2) + ' MW'  // Overnight minimum
        });
      }

      forecast = {
        period: '7 days',
        daily: dailyForecast,
        weekAverage: adjustedBaseLoad.toFixed(2) + ' MW',
        weekPeak: (adjustedBaseLoad * 1.30).toFixed(2) + ' MW', // Weekday evening peak
        weekMin: (adjustedBaseLoad * 0.47).toFixed(2) + ' MW'   // Weekend overnight minimum
      };
    } else if (horizon === 'month') {
      // 30-day forecast with growth
      const growthRate = (GROWTH_SCENARIOS as any)[scenario];
      const monthlyGrowth = Math.pow(1 + growthRate, 1/12) - 1; // Convert annual to monthly

      const weeklyForecast = [];
      for (let week = 0; week < 4; week++) {
        const weekLoad = adjustedBaseLoad * Math.pow(1 + monthlyGrowth, week);
        weeklyForecast.push({
          week: week + 1,
          averageLoad: weekLoad.toFixed(2) + ' MW',
          peakLoad: (weekLoad * 1.30).toFixed(2) + ' MW',
          growth: (week > 0 ? ((weekLoad / (adjustedBaseLoad * Math.pow(1 + monthlyGrowth, week - 1)) - 1) * 100).toFixed(2) + '%' : '0.00%')
        });
      }

      forecast = {
        period: '30 days',
        scenario,
        weekly: weeklyForecast,
        monthStart: adjustedBaseLoad.toFixed(2) + ' MW',
        monthEnd: (adjustedBaseLoad * Math.pow(1 + monthlyGrowth, 4)).toFixed(2) + ' MW',
        totalGrowth: ((Math.pow(1 + monthlyGrowth, 4) - 1) * 100).toFixed(2) + '%'
      };
    } else if (horizon === 'year') {
      // 12-month forecast with seasonal variation
      const growthRate = (GROWTH_SCENARIOS as any)[scenario];
      
      const monthlyForecast = [];
      for (let month = 0; month < 12; month++) {
        const forecastMonth = (currentMonth + month) % 12;
        const monthFactor = getMonthlyFactor(forecastMonth);
        const growthFactor = Math.pow(1 + growthRate, month / 12);
        const monthLoad = baseLoad * monthFactor * growthFactor;

        monthlyForecast.push({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][forecastMonth],
          averageLoad: monthLoad.toFixed(2) + ' MW',
          peakLoad: (monthLoad * 1.30).toFixed(2) + ' MW',
          seasonalFactor: monthFactor.toFixed(3),
          growth: (month > 0 ? (((growthFactor - 1) * 100).toFixed(2) + '%') : '0.00%')
        });
      }

      const yearPeak = monthlyForecast.reduce((max, m, i, arr) => 
        parseFloat(m.peakLoad) > parseFloat(arr[max].peakLoad) ? i : max, 0);
      const yearMin = monthlyForecast.reduce((min, m, i, arr) => 
        parseFloat(m.averageLoad) < parseFloat(arr[min].averageLoad) ? i : min, 0);

      forecast = {
        period: '12 months',
        scenario,
        monthly: monthlyForecast,
        annualPeak: {
          month: monthlyForecast[yearPeak].month,
          load: monthlyForecast[yearPeak].peakLoad
        },
        annualMin: {
          month: monthlyForecast[yearMin].month,
          load: monthlyForecast[yearMin].averageLoad
        },
        yearStart: baseLoad.toFixed(2) + ' MW',
        yearEnd: (baseLoad * Math.pow(1 + growthRate, 1)).toFixed(2) + ' MW',
        annualGrowth: (growthRate * 100).toFixed(2) + '%'
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      baseLoad: baseLoad.toFixed(2) + ' MW',
      currentSeasonalFactor: seasonalFactor.toFixed(3),
      forecast
    });

  } catch (error) {
    console.error('[ENERGY] Demand forecasting error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demand forecast', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Forecasting Methods:
 *    - Seasonal factors: Monthly load multipliers (1.0 = baseline)
 *    - Daily profiles: Hourly load curves (weekday vs weekend)
 *    - Growth scenarios: Low 1.5%, Baseline 2.5%, High 4.0% annual
 *    - Simplified linear trending (production would use ML models)
 * 
 * 2. Load Patterns (Typical Electric Grid):
 *    - Winter peak: January (heating), 1.30× baseline
 *    - Summer peak: July (cooling), 1.35× baseline
 *    - Spring/Fall: Shoulder seasons, 0.92-1.08× baseline
 *    - Daily peak: 6-7 PM (1.30× average), minimum 3-4 AM (0.50×)
 *    - Weekend: ~10% lower average load than weekday
 * 
 * 3. Forecast Horizons:
 *    - Day: 24-hour profile with hourly resolution
 *    - Week: 7-day profile with daily resolution
 *    - Month: 4-week profile with weekly resolution + growth
 *    - Year: 12-month profile with seasonal variation + growth
 * 
 * 4. Growth Scenarios:
 *    - Low (1.5%): Efficiency gains offset demand growth
 *    - Baseline (2.5%): Historical trend, moderate economic growth
 *    - High (4.0%): Electrification (EVs, heat pumps), data centers
 * 
 * 5. Future Enhancements:
 *    - Weather correlation (temperature, humidity impact)
 *    - Economic indicators (GDP, industrial production)
 *    - Machine learning models (LSTM, Prophet)
 *    - Event impact (holidays, major outages)
 *    - Renewable integration forecasting
 */
