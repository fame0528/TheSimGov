/**
 * @fileoverview Load Profiles API Routes - List and Create Load Profiles
 * 
 * OVERVIEW:
 * GET: List load profiles with filtering by company, profile type, state
 * POST: Create new load profile with automatic hourly curve generation
 * 
 * @created 2025-11-18
 * @updated 2025-11-18
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import LoadProfile, { ProfileType, Season } from '@/src/lib/db/models/LoadProfile';

// ================== HELPER FUNCTIONS ==================

/**
 * Get typical load curve shape for profile type
 */
function getTypicalCurve(profileType: ProfileType, season: Season): number[] {
  // Returns 24-hour curve as percentages of peak (0-100%)
  const curves = {
    Residential: {
      Summer: [40, 35, 35, 35, 40, 50, 65, 75, 70, 65, 65, 70, 75, 85, 95, 100, 95, 90, 90, 85, 75, 65, 55, 45],
      Winter: [60, 55, 55, 60, 70, 85, 95, 100, 90, 75, 70, 70, 75, 80, 85, 90, 95, 100, 95, 90, 85, 80, 75, 65],
      Spring: [45, 40, 40, 40, 45, 55, 70, 80, 75, 70, 70, 75, 80, 85, 90, 95, 90, 90, 85, 80, 75, 65, 55, 50],
      Fall: [45, 40, 40, 40, 45, 55, 70, 80, 75, 70, 70, 75, 80, 85, 90, 95, 90, 90, 85, 80, 75, 65, 55, 50],
    },
    Commercial: {
      Summer: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 95, 90, 85, 75, 60, 45, 40, 35, 30, 30, 30],
      Winter: [35, 30, 30, 30, 35, 45, 65, 85, 95, 100, 100, 95, 90, 85, 80, 75, 65, 50, 40, 35, 35, 35, 35, 35],
      Spring: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 90, 85, 80, 70, 55, 40, 35, 30, 30, 30, 30],
      Fall: [30, 25, 25, 25, 30, 40, 60, 80, 90, 95, 100, 100, 95, 90, 85, 80, 70, 55, 40, 35, 30, 30, 30, 30],
    },
    Industrial: {
      Summer: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Winter: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Spring: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
      Fall: [85, 85, 85, 85, 85, 90, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 90, 90, 85, 85, 85, 85],
    },
    Mixed: {
      Summer: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 95, 100, 95, 85, 75, 70, 65, 55, 50, 50],
      Winter: [55, 50, 50, 50, 55, 65, 80, 90, 95, 95, 95, 95, 95, 95, 95, 100, 95, 85, 75, 70, 65, 60, 55, 55],
      Spring: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 90, 90, 85, 75, 65, 60, 55, 50, 50, 50],
      Fall: [50, 45, 45, 45, 50, 60, 75, 85, 90, 90, 95, 95, 95, 95, 90, 90, 85, 75, 65, 60, 55, 50, 50, 50],
    },
  };
  
  return curves[profileType][season];
}

/**
 * Generate hourly load curve based on profile parameters
 */
function generateHourlyLoadCurve(
  profileType: ProfileType,
  season: Season,
  peakLoadMW: number
) {
  const curve = getTypicalCurve(profileType, season);
  
  return curve.map((percent, hour) => ({
    hour,
    loadMW: peakLoadMW * (percent / 100),
  }));
}

// ================== GET HANDLER ==================

/**
 * GET /api/energy/load-profiles
 * List load profiles with filtering
 * 
 * Query Parameters:
 * - profileType: Profile type filter (Residential, Commercial, Industrial, Mixed)
 * - state: State filter
 * - region: Region filter
 * 
 * Response: { profiles: ILoadProfile[] }
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const profileType = searchParams.get('profileType');
    const state = searchParams.get('state');
    const region = searchParams.get('region');

    // Build filter query
    const filter: any = {};
    if (profileType) filter.profileType = profileType;
    if (state) filter.state = state;
    if (region) filter.region = region;

    // Fetch load profiles
    const profiles = await LoadProfile.find(filter)
      .sort({ peakLoadMW: -1 }) // Sort by peak load descending
      .lean();

    return NextResponse.json({
      profiles,
    });

  } catch (error: unknown) {
    console.error('Load profiles list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load profiles' },
      { status: 500 }
    );
  }
}

// ================== POST HANDLER ==================

/**
 * POST /api/energy/load-profiles
 * Create new load profile
 * 
 * Request Body:
 * - region: Region name (required)
 * - state: State (required)
 * - profileType: Load profile type (required)
 * - baseLoadMW: Minimum constant load (required)
 * - peakLoadMW: Maximum load (required)
 * - populationServed: Number of customers (required)
 * - temperatureSensitive: Weather sensitivity (optional, default true)
 * - drProgramsActive: DR programs enabled (optional, default false)
 * - drEnrolledMW: DR capacity enrolled (optional, default 0)
 * 
 * Response: { profile, hourlyLoadCurve, message }
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
    const {
      region,
      state,
      profileType,
      baseLoadMW,
      peakLoadMW,
      populationServed,
      temperatureSensitive = true,
      drProgramsActive = false,
      drEnrolledMW = 0,
    } = body;

    // Validate required fields
    if (!region || !state || !profileType || baseLoadMW === undefined || peakLoadMW === undefined || !populationServed) {
      return NextResponse.json(
        { error: 'Missing required fields: region, state, profileType, baseLoadMW, peakLoadMW, populationServed' },
        { status: 400 }
      );
    }

    // Validate profile type
    const validProfileTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed'];
    if (!validProfileTypes.includes(profileType)) {
      return NextResponse.json(
        { error: `Invalid profile type. Must be one of: ${validProfileTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate load values
    if (baseLoadMW < 0 || peakLoadMW < 0 || baseLoadMW > peakLoadMW) {
      return NextResponse.json(
        { error: 'Invalid load values. baseLoadMW must be >= 0, peakLoadMW must be >= baseLoadMW' },
        { status: 400 }
      );
    }

    if (populationServed < 1) {
      return NextResponse.json(
        { error: 'Population served must be at least 1' },
        { status: 400 }
      );
    }

    // Calculate average load (typically 60-75% of peak)
    const loadFactorEstimate = profileType === 'Industrial' ? 0.85 : (profileType === 'Commercial' ? 0.65 : 0.60);
    const averageLoadMW = peakLoadMW * loadFactorEstimate;

    // Determine current season based on month
    const month = new Date().getMonth();
    let currentSeason: Season;
    if (month >= 11 || month <= 1) currentSeason = 'Winter';
    else if (month >= 2 && month <= 4) currentSeason = 'Spring';
    else if (month >= 5 && month <= 7) currentSeason = 'Summer';
    else currentSeason = 'Fall';

    // Generate hourly load curve
    const hourlyProfile = generateHourlyLoadCurve(profileType, currentSeason, peakLoadMW);

    // Create load profile
    const profile = await LoadProfile.create({
      region,
      state,
      profileType,
      baseLoadMW,
      peakLoadMW,
      averageLoadMW,
      currentLoadMW: averageLoadMW, // Start at average
      currentSeason,
      currentDayType: 'Weekday',
      hourlyProfile,
      dailyPeakMW: peakLoadMW,
      dailyPeakHour: 14, // 2 PM default
      monthlyPeakMW: peakLoadMW,
      annualPeakMW: peakLoadMW,
      annualPeakDate: new Date(),
      populationServed,
      temperatureSensitive,
      drProgramsActive,
      drEnrolledMW,
      averageRetailRate: 100, // $100/MWh default
      peakDemandCharge: 15, // $15/kW-month default
    });

    return NextResponse.json({
      profile,
      hourlyLoadCurve: hourlyProfile,
      message: `Load profile created successfully for ${region}, ${state}. Peak load: ${peakLoadMW} MW, Average: ${averageLoadMW.toFixed(1)} MW, Load factor: ${loadFactorEstimate * 100}%`,
    });

  } catch (error: unknown) {
    console.error('Load profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create load profile' },
      { status: 500 }
    );
  }
}
