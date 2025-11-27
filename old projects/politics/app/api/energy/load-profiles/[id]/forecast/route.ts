/**
 * @fileoverview Load Profile Forecast API - Load Forecasting
 * 
 * OVERVIEW:
 * POST: Forecast load for next X hours with weather adjustment
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import LoadProfile from '@/src/lib/db/models/LoadProfile';

// ================== POST HANDLER ==================

/**
 * POST /api/energy/load-profiles/[id]/forecast
 * Forecast load for hours ahead with weather sensitivity
 * 
 * Request Body:
 * - hoursAhead: Hours to forecast (1-168, required)
 * - temperature: Expected temperature in °F (optional)
 * - weatherConditions: Weather description (optional)
 * 
 * Response: { profile, forecast, hourlyForecast, confidence, weatherImpact, message }
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
    const { hoursAhead, temperature, weatherConditions } = body;

    // Validate required fields
    if (hoursAhead === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: hoursAhead' },
        { status: 400 }
      );
    }

    // Validate hours ahead range
    if (hoursAhead < 1 || hoursAhead > 168) {
      return NextResponse.json(
        { error: 'hoursAhead must be between 1 and 168 (1 week)' },
        { status: 400 }
      );
    }

    // Fetch load profile
    const profile = await LoadProfile.findById(id);
    if (!profile) {
      return NextResponse.json(
        { error: 'Load profile not found' },
        { status: 404 }
      );
    }

    // Calculate forecast using profile method
    const forecastMW = profile.forecastLoad(hoursAhead, temperature);

    // Generate hourly forecast for next 24 hours (if hoursAhead >= 24)
    const hourlyForecast = [];
    if (hoursAhead >= 24) {
      for (let h = 1; h <= Math.min(24, hoursAhead); h++) {
        hourlyForecast.push({
          hour: h,
          forecastMW: profile.forecastLoad(h, temperature),
        });
      }
    }

    // Calculate forecast confidence based on hours ahead and weather data
    let confidence = profile.forecastAccuracy;
    
    // Reduce confidence for longer forecasts
    if (hoursAhead > 24) {
      confidence -= (hoursAhead - 24) * 0.1; // -0.1% per hour beyond 24h
    }
    
    // Increase confidence if temperature data provided
    if (temperature !== undefined && profile.temperatureSensitive) {
      confidence += 2; // +2% with weather data
    }
    
    // Cap confidence between 50% and 98%
    confidence = Math.max(50, Math.min(98, confidence));

    // Calculate weather impact if temperature provided
    let weatherImpact = 0;
    let weatherDescription = 'Normal conditions';
    
    if (temperature !== undefined && profile.temperatureSensitive) {
      // Calculate % change from base forecast
      const baseForecast = profile.forecastLoad(hoursAhead);
      weatherImpact = ((forecastMW - baseForecast) / baseForecast) * 100;
      
      if (temperature > 85) {
        weatherDescription = `High temperature (${temperature}°F) increases cooling load by ${weatherImpact.toFixed(1)}%`;
      } else if (temperature < 45) {
        weatherDescription = `Low temperature (${temperature}°F) increases heating load by ${weatherImpact.toFixed(1)}%`;
      } else {
        weatherDescription = `Moderate temperature (${temperature}°F), minimal impact (${weatherImpact.toFixed(1)}%)`;
      }
    }

    // Generate forecast summary
    const forecastSummary = {
      hoursAhead,
      forecastMW: parseFloat(forecastMW.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(1)),
      weatherImpact: parseFloat(weatherImpact.toFixed(1)),
      weatherDescription,
      weatherConditions: weatherConditions || 'Not specified',
      targetHour: (new Date().getHours() + hoursAhead) % 24,
      currentSeason: profile.currentSeason,
      isPeakHour: profile.isPeakHour((new Date().getHours() + hoursAhead) % 24),
    };

    // Update profile forecasts if this is 1-day or 7-day forecast
    if (hoursAhead === 24) {
      profile.oneDayForecastMW = forecastMW;
      await profile.save();
    } else if (hoursAhead === 168) {
      profile.sevenDayForecastMW = forecastMW;
      await profile.save();
    }

    return NextResponse.json({
      profile: {
        _id: profile._id,
        region: profile.region,
        state: profile.state,
        profileType: profile.profileType,
        currentLoadMW: profile.currentLoadMW,
        peakLoadMW: profile.peakLoadMW,
        averageLoadMW: profile.averageLoadMW,
      },
      forecast: forecastSummary,
      hourlyForecast: hourlyForecast.length > 0 ? hourlyForecast : undefined,
      message: `Load forecast: ${forecastMW.toFixed(1)} MW in ${hoursAhead} hours (${confidence.toFixed(1)}% confidence)`,
    });

  } catch (error: unknown) {
    console.error('Load forecast error:', error);
    return NextResponse.json(
      { error: 'Failed to generate load forecast' },
      { status: 500 }
    );
  }
}
