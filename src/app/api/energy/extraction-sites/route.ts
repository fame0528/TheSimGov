/**
 * @fileoverview Extraction Sites API - Multi-site operations management
 * @module api/energy/extraction-sites
 * 
 * ENDPOINTS:
 * GET  /api/energy/extraction-sites - List all extraction sites for company
 * POST /api/energy/extraction-sites - Create new extraction site
 * 
 * Extraction sites represent multi-well operations with shared infrastructure,
 * aggregating production across conventional, unconventional, and offshore wells.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { OilWell, GasField } from '@/lib/db/models';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@/lib/utils/apiResponse';
import type { OilWellLean, GasFieldLean } from '@/lib/types/energy-lean';

/**
 * GET /api/energy/extraction-sites
 * Aggregate view of all extraction operations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (!companyId) {
      return createErrorResponse('Company ID required', ErrorCode.BAD_REQUEST, 400);
    }

    // Aggregate oil wells and gas fields by location/region (properly typed)
    const oilWells = await OilWell.find({ company: companyId })
      .select('name location status currentProduction reserveEstimate wellType')
      .lean<OilWellLean[]>();

    const gasFields = await GasField.find({ company: companyId })
      .select('name location status currentProduction reserveEstimate quality')
      .lean<GasFieldLean[]>();

    // Group by region to create "sites"
    const siteMap = new Map<string, {
      region: string;
      oilWells: unknown[];
      gasFields: unknown[];
      totalOilProduction: number;
      totalGasProduction: number;
      totalOilReserves: number;
      totalGasReserves: number;
      assetCount: number;
    }>();

    // Add oil wells to sites
    oilWells.forEach(well => {
      const region = well.location.region;
      if (!siteMap.has(region)) {
        siteMap.set(region, {
          region,
          oilWells: [],
          gasFields: [],
          totalOilProduction: 0,
          totalGasProduction: 0,
          totalOilReserves: 0,
          totalGasReserves: 0,
          assetCount: 0,
        });
      }
      const site = siteMap.get(region)!;
      site.oilWells.push(well);
      site.totalOilProduction += well.currentProduction || 0;
      site.totalOilReserves += well.reserveEstimate || 0;
      site.assetCount += 1;
    });

    // Add gas fields to sites
    gasFields.forEach(field => {
      const region = field.location.region;
      if (!siteMap.has(region)) {
        siteMap.set(region, {
          region,
          oilWells: [],
          gasFields: [],
          totalOilProduction: 0,
          totalGasProduction: 0,
          totalOilReserves: 0,
          totalGasReserves: 0,
          assetCount: 0,
        });
      }
      const site = siteMap.get(region)!;
      site.gasFields.push(field);
      site.totalGasProduction += field.currentProduction || 0;
      site.totalGasReserves += (field.reserveEstimate ?? 0);
      site.assetCount += 1;
    });

    const sites = Array.from(siteMap.values());

    // Calculate summary
    const totalOilProduction = sites.reduce((sum, s) => sum + s.totalOilProduction, 0);
    const totalGasProduction = sites.reduce((sum, s) => sum + s.totalGasProduction, 0);

    return createSuccessResponse({
      sites,
      summary: {
        siteCount: sites.length,
        totalAssets: oilWells.length + gasFields.length,
        totalOilProduction,
        totalGasProduction,
        oilWellCount: oilWells.length,
        gasFieldCount: gasFields.length,
      },
    });
  } catch (error) {
    console.error('GET /api/energy/extraction-sites error:', error);
    return createErrorResponse('Failed to fetch extraction sites', ErrorCode.INTERNAL_ERROR, 500);
  }
}

/**
 * POST /api/energy/extraction-sites
 * Create new extraction site (creates base infrastructure)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
    }

    await connectDB();

    const body = await request.json();
    const { company, region, latitude, longitude, siteType } = body;

    if (!company || !region || !latitude || !longitude) {
      return createErrorResponse('Company, region, and location coordinates required', ErrorCode.BAD_REQUEST, 400);
    }

    // Create initial well/field based on site type
    let asset;
    if (siteType === 'oil' || !siteType) {
      asset = await OilWell.create({
        company,
        name: `${region} Site 1`,
        location: { latitude, longitude, region },
        wellType: 'Conventional',
        status: 'Drilling',
        reserveEstimate: 100000,
        currentProduction: 0,
        peakProduction: 500,
        depletionRate: 5,
        extractionCost: 25,
        depth: 5000,
        commissionDate: new Date(),
        equipment: [],
      });
    } else if (siteType === 'gas') {
      asset = await GasField.create({
        company,
        name: `${region} Gas Site 1`,
        location: { latitude, longitude, region },
        status: 'Drilling',
        reserves: 1000000,
        currentProduction: 0,
        peakProduction: 5000,
        depletionRate: 4,
        gasQuality: 'Pipeline',
        pressure: 1000,
        depth: 8000,
        commissionDate: new Date(),
      });
    }

    return createSuccessResponse(
      {
        message: 'Extraction site created',
        site: {
          region,
          location: { latitude, longitude },
          siteType: siteType || 'oil',
          initialAsset: asset,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('POST /api/energy/extraction-sites error:', error);
    return createErrorResponse('Failed to create extraction site', ErrorCode.INTERNAL_ERROR, 500);
  }
}
