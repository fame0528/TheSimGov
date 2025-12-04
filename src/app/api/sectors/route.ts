import type { Sector } from '@/lib/types/sector';
/**
 * @fileoverview Sector API Endpoints
 * @module app/api/sectors/route
 *
 * OVERVIEW:
 * RESTful endpoints for sector CRUD and event operations.
 * Strict validation, AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import SectorModel from '@/lib/db/models/Sector';
import { generateRandomSectorEvent, triggerSectorEvent } from '@/lib/utils/events';
import { SectorType, SectorEventType } from '@/lib/types/sector';

// Zod validation schemas
const createSectorSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(SectorType),
  location: z.string(),
  companyId: z.string(),
});

const eventSchema = z.object({
  sectorId: z.string(),
  eventType: z.nativeEnum(SectorEventType).optional(),
});

export async function GET(req: NextRequest) {
  // List all sectors
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const query = companyId ? { companyId } : {};
  const sectors = await SectorModel.find(query).lean();
  return NextResponse.json({ sectors });
}

export async function POST(req: NextRequest) {
  // Create sector
  const body = await req.json();
  const parsed = createSectorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error }, { status: 400 });
  }
  // Uniqueness per state enforced by model
  try {
    const sector = await SectorModel.create(parsed.data);
    return NextResponse.json({ sector });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create sector', details: err }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Trigger event for sector
  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event data', details: parsed.error }, { status: 400 });
  }
  const { sectorId, eventType } = parsed.data;
  const sectorDoc = await SectorModel.findById(sectorId);
  if (!sectorDoc) {
    return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
  }
  const sector: Sector = {
    ...sectorDoc.toObject(),
    id: sectorDoc._id.toString(),
  };
  let event;
  if (eventType) {
    event = triggerSectorEvent(sector, eventType);
  } else {
    event = generateRandomSectorEvent(sector);
  }
  // Optionally apply event to sector here
  // await sectorEngine.applySectorEvent(sector, event);
  return NextResponse.json({ event });
}

/**
 * IMPLEMENTATION NOTES:
 * - GET: List sectors (optionally by company)
 * - POST: Create sector (enforces uniqueness per state)
 * - PATCH: Trigger event (random or specific)
 * - Strict validation and error handling
 * - AAA/ECHO compliant
 */
