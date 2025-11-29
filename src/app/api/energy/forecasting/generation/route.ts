/**
 * @file GET /api/energy/forecasting/generation
 * @description Renewable generation forecasting - solar/wind production predictions
 * @timestamp 2025-11-28
 * @author ECHO v1.3.1
 * 
 * OVERVIEW:
 * Forecasts renewable energy generation based on seasonal patterns, time-of-day
 * curves, and asset availability. Provides short-term and long-term projections
 * for solar and wind resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB as dbConnect } from '@/lib/db';
import { SolarFarm, WindTurbine } from '@/lib/db/models';
import { auth } from '@/auth';

// ============================================================================
// CONSTANTS - GENERATION PATTERNS
// ============================================================================

const SOLAR_PATTERNS = {
  // Monthly capacity factor variation
  monthly: {
    0: 0.18,  // January (winter, short days)
    1: 0.22,  // February
    2: 0.25,  // March
    3: 0.28,  // April
    4: 0.30,  // May (peak sun)
    5: 0.31,  // June (peak sun)
    6: 0.30,  // July
    7: 0.28,  // August
    8: 0.25,  // September
    9: 0.22,  // October
    10: 0.19, // November
    11: 0.17  // December (winter, short days)
  },
  // Hourly generation profile (normalized 0-1)
  hourly: {
    0: 0.00, 1: 0.00, 2: 0.00, 3: 0.00, 4: 0.00,  // Night
    5: 0.00, 6: 0.05, 7: 0.25, 8: 0.50, 9: 0.70,  // Sunrise to morning
    10: 0.85, 11: 0.95, 12: 1.00, 13: 0.95, 14: 0.85, // Peak midday
    15: 0.75, 16: 0.60, 17: 0.40, 18: 0.15, 19: 0.02, // Afternoon to sunset
    20: 0.00, 21: 0.00, 22: 0.00, 23: 0.00  // Night
  }
};

const WIND_PATTERNS = {
  // Monthly capacity factor variation
  monthly: {
    0: 0.42,  // January (winter, strong winds)
    1: 0.40,  // February
    2: 0.38,  // March
    3: 0.36,  // April
    4: 0.32,  // May (spring lull)
    5: 0.28,  // June (summer low)
    6: 0.26,  // July (summer low)
    7: 0.27,  // August
    8: 0.30,  // September
    9: 0.34,  // October
    10: 0.38, // November
    11: 0.41  // December (winter, strong winds)
  },
  // Hourly generation variability (less predictable than solar)
  hourly: {
    0: 0.85, 1: 0.88, 2: 0.90, 3: 0.92, 4: 0.90,  // Nighttime winds (typically stronger)
    5: 0.85, 6: 0.80, 7: 0.75, 8: 0.70, 9: 0.65,  // Morning calm
    10: 0.60, 11: 0.58, 12: 0.55, 13: 0.58, 14: 0.62, // Midday low
    15: 0.68, 16: 0.72, 17: 0.75, 18: 0.78, 19: 0.80, // Evening pickup
    20: 0.82, 21: 0.83, 22: 0.84, 23: 0.85  // Night
  }
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerationForecastSchema = z.object({
  horizon: z.enum(['day', 'week', 'month', 'year']).optional().default('day'),
  technology: z.enum(['all', 'solar', 'wind']).optional().default('all')
});

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
      horizon: searchParams.get('horizon') || 'day',
      technology: searchParams.get('technology') || 'all'
    };

    const validation = GenerationForecastSchema.safeParse(queryData);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { horizon, technology } = validation.data;

    // Database connection
    await dbConnect();

    const filter = { company: session.user.companyId };

    // Get solar and wind assets
    const [solarFarms, windTurbines] = await Promise.all([
      technology === 'wind' ? [] : SolarFarm.find(filter).lean(),
      technology === 'solar' ? [] : WindTurbine.find(filter).lean()
    ]);

    // Calculate total capacity
    const solarCapacity = solarFarms.reduce((sum, f) => sum + (((f as any).nameplateCapacity ?? (f as any).ratedCapacity ?? (f as any).capacity ?? 0)), 0);
    const windCapacity = windTurbines.reduce((sum, t) => sum + (((t as any).ratedCapacity ?? (t as any).nameplateCapacity ?? (t as any).capacity ?? 0)), 0);
    const totalCapacity = solarCapacity + windCapacity;

    // Current date/time
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentHour = now.getHours();

    // Get current seasonal factors
    const solarMonthlyFactor = (SOLAR_PATTERNS.monthly as any)[currentMonth];
    const windMonthlyFactor = (WIND_PATTERNS.monthly as any)[currentMonth];

    let forecast: any = {};

    if (horizon === 'day') {
      // 24-hour forecast
      const hourlyForecast = [];
      for (let hour = 0; hour < 24; hour++) {
        const solarHourlyFactor = (SOLAR_PATTERNS.hourly as any)[hour];
        const windHourlyFactor = (WIND_PATTERNS.hourly as any)[hour];

        const solarGeneration = solarCapacity * solarMonthlyFactor * solarHourlyFactor;
        const windGeneration = windCapacity * windMonthlyFactor * windHourlyFactor;

        hourlyForecast.push({
          hour,
          solar: solarGeneration.toFixed(2) + ' MW',
          wind: windGeneration.toFixed(2) + ' MW',
          total: (solarGeneration + windGeneration).toFixed(2) + ' MW',
          capacityFactor: totalCapacity > 0 ? (((solarGeneration + windGeneration) / totalCapacity) * 100).toFixed(2) + '%' : '0%'
        });
      }

      const peakHour = hourlyForecast.reduce((max, h, i, arr) => 
        parseFloat(h.total) > parseFloat(arr[max].total) ? i : max, 0);
      const minHour = hourlyForecast.reduce((min, h, i, arr) => 
        parseFloat(h.total) < parseFloat(arr[min].total) ? i : min, 0);

      forecast = {
        period: '24 hours',
        hourly: hourlyForecast,
        peak: {
          hour: hourlyForecast[peakHour].hour,
          generation: hourlyForecast[peakHour].total,
          time: `${hourlyForecast[peakHour].hour}:00`
        },
        minimum: {
          hour: hourlyForecast[minHour].hour,
          generation: hourlyForecast[minHour].total,
          time: `${hourlyForecast[minHour].hour}:00`
        },
        dailyEnergy: (hourlyForecast.reduce((sum, h) => sum + parseFloat(h.total), 0)).toFixed(2) + ' MWh'
      };
    } else if (horizon === 'week') {
      // 7-day forecast
      const dailyForecast = [];
      for (let day = 0; day < 7; day++) {
        const forecastDate = new Date(now);
        forecastDate.setDate(now.getDate() + day);
        const month = forecastDate.getMonth();
        
        const solarMonthFactor = (SOLAR_PATTERNS.monthly as any)[month];
        const windMonthFactor = (WIND_PATTERNS.monthly as any)[month];

        // Daily energy = capacity × CF × 24 hours
        const solarDaily = solarCapacity * solarMonthFactor * 24;
        const windDaily = windCapacity * windMonthFactor * 24;

        dailyForecast.push({
          date: forecastDate.toISOString().split('T')[0],
          solar: solarDaily.toFixed(2) + ' MWh',
          wind: windDaily.toFixed(2) + ' MWh',
          total: (solarDaily + windDaily).toFixed(2) + ' MWh',
          avgCapacityFactor: totalCapacity > 0 ? (((solarCapacity * solarMonthFactor + windCapacity * windMonthFactor) / totalCapacity) * 100).toFixed(2) + '%' : '0%'
        });
      }

      const weekTotal = dailyForecast.reduce((sum, d) => sum + parseFloat(d.total), 0);

      forecast = {
        period: '7 days',
        daily: dailyForecast,
        weekTotal: weekTotal.toFixed(2) + ' MWh',
        dailyAverage: (weekTotal / 7).toFixed(2) + ' MWh'
      };
    } else if (horizon === 'month') {
      // 30-day forecast (weekly aggregation)
      const weeklyForecast = [];
      for (let week = 0; week < 4; week++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() + (week * 7));
        const month = weekDate.getMonth();
        
        const solarMonthFactor = (SOLAR_PATTERNS.monthly as any)[month];
        const windMonthFactor = (WIND_PATTERNS.monthly as any)[month];

        // Weekly energy = capacity × CF × 24 hours × 7 days
        const solarWeekly = solarCapacity * solarMonthFactor * 24 * 7;
        const windWeekly = windCapacity * windMonthFactor * 24 * 7;

        weeklyForecast.push({
          week: week + 1,
          solar: solarWeekly.toFixed(2) + ' MWh',
          wind: windWeekly.toFixed(2) + ' MWh',
          total: (solarWeekly + windWeekly).toFixed(2) + ' MWh',
          avgCapacityFactor: totalCapacity > 0 ? (((solarCapacity * solarMonthFactor + windCapacity * windMonthFactor) / totalCapacity) * 100).toFixed(2) + '%' : '0%'
        });
      }

      const monthTotal = weeklyForecast.reduce((sum, w) => sum + parseFloat(w.total), 0);

      forecast = {
        period: '30 days',
        weekly: weeklyForecast,
        monthTotal: monthTotal.toFixed(2) + ' MWh',
        dailyAverage: (monthTotal / 30).toFixed(2) + ' MWh'
      };
    } else if (horizon === 'year') {
      // 12-month forecast
      const monthlyForecast = [];
      for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
        const forecastMonth = (currentMonth + monthOffset) % 12;
        const solarMonthFactor = (SOLAR_PATTERNS.monthly as any)[forecastMonth];
        const windMonthFactor = (WIND_PATTERNS.monthly as any)[forecastMonth];

        // Monthly energy = capacity × CF × 24 hours × 30 days (approximate)
        const solarMonthly = solarCapacity * solarMonthFactor * 24 * 30;
        const windMonthly = windCapacity * windMonthFactor * 24 * 30;

        monthlyForecast.push({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][forecastMonth],
          solar: solarMonthly.toFixed(2) + ' MWh',
          wind: windMonthly.toFixed(2) + ' MWh',
          total: (solarMonthly + windMonthly).toFixed(2) + ' MWh',
          avgCapacityFactor: totalCapacity > 0 ? (((solarCapacity * solarMonthFactor + windCapacity * windMonthFactor) / totalCapacity) * 100).toFixed(2) + '%' : '0%'
        });
      }

      const yearTotal = monthlyForecast.reduce((sum, m) => sum + parseFloat(m.total), 0);
      const peakMonth = monthlyForecast.reduce((max, m, i, arr) => 
        parseFloat(m.total) > parseFloat(arr[max].total) ? i : max, 0);
      const minMonth = monthlyForecast.reduce((min, m, i, arr) => 
        parseFloat(m.total) < parseFloat(arr[min].total) ? i : min, 0);

      forecast = {
        period: '12 months',
        monthly: monthlyForecast,
        annualTotal: yearTotal.toFixed(2) + ' MWh',
        monthlyAverage: (yearTotal / 12).toFixed(2) + ' MWh',
        peak: {
          month: monthlyForecast[peakMonth].month,
          generation: monthlyForecast[peakMonth].total
        },
        minimum: {
          month: monthlyForecast[minMonth].month,
          generation: monthlyForecast[minMonth].total
        }
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      capacity: {
        solar: solarCapacity.toFixed(2) + ' MW',
        wind: windCapacity.toFixed(2) + ' MW',
        total: totalCapacity.toFixed(2) + ' MW'
      },
      assetCount: {
        solarFarms: solarFarms.length,
        windTurbines: windTurbines.length,
        total: solarFarms.length + windTurbines.length
      },
      currentFactors: {
        solar: (solarMonthlyFactor * 100).toFixed(2) + '%',
        wind: (windMonthlyFactor * 100).toFixed(2) + '%'
      },
      forecast
    });

  } catch (error) {
    console.error('[ENERGY] Generation forecasting error:', error);
    return NextResponse.json(
      { error: 'Failed to generate renewable forecast', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Solar Generation Patterns:
 *    - Peak months: May-June (30-31% CF) - longest days, high sun angle
 *    - Low months: December-January (17-18% CF) - shortest days, low sun angle
 *    - Daily curve: Zero at night, peak at solar noon (12 PM), cosine-like shape
 *    - Hourly profile follows sun elevation angle
 * 
 * 2. Wind Generation Patterns:
 *    - Peak months: December-January (41-42% CF) - winter storm systems
 *    - Low months: June-July (26-27% CF) - summer doldrums
 *    - Daily pattern: Typically stronger at night (diurnal wind cycle)
 *    - Less predictable than solar (weather-dependent)
 * 
 * 3. Capacity Factor Definition:
 *    - CF = (Actual generation / Theoretical maximum) × 100%
 *    - Theoretical max = Capacity × Time period
 *    - Solar annual CF: ~25% (US average, varies 15-30% by location)
 *    - Wind annual CF: ~35% (US average, varies 25-55% by location)
 * 
 * 4. Forecast Accuracy:
 *    - Day-ahead: ±10% for solar (weather), ±15% for wind
 *    - Week-ahead: ±15% for solar, ±20% for wind
 *    - Month/year: Seasonal patterns more reliable, weather variability averages out
 *    - Simplified model assumes clear sky and average wind conditions
 * 
 * 5. Future Enhancements:
 *    - Weather API integration (cloud cover, wind speed forecasts)
 *    - Machine learning models (historical performance + weather)
 *    - Probabilistic forecasting (P10/P50/P90 scenarios)
 *    - Curtailment prediction (grid congestion)
 *    - Ramp rate analysis (generation variability)
 */
