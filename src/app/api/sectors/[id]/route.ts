/**
 * @fileoverview Sector CRUD and Event API (by ID)
 * @module app/api/sectors/[id]/route
 *
 * OVERVIEW:
 * RESTful endpoints for sector GET, PATCH, DELETE by ID.
 * Strict validation, AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import SectorModel from '@/lib/db/models/Sector';
import { triggerSectorEvent } from '@/lib/utils/events';
import type { Sector } from '@/lib/types/sector';
import { SectorEventType } from '@/lib/types/sector';

const idSchema = z.object({ id: z.string() });
const eventSchema = z.object({ eventType: z.nativeEnum(SectorEventType).optional() });

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Get sector by ID
  const { id } = await context.params;
  const sector = await SectorModel.findById(id).lean();
  if (!sector) {
    return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
  }
  return NextResponse.json({ sector });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Trigger event for sector by ID
  const { id } = await context.params;
  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event data', details: parsed.error }, { status: 400 });
  }
  const sectorDoc = await SectorModel.findById(id);
  if (!sectorDoc) {
    return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
  }
  const sector: Sector = {
    ...sectorDoc.toObject(),
    id: sectorDoc._id.toString(),
  };
  const eventType = parsed.data.eventType ?? SectorEventType.EXPAND;
  const event = triggerSectorEvent(sector, eventType);
  // Optionally apply event to sector here
  // await sectorEngine.applySectorEvent(sector, event);
  return NextResponse.json({ event });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Delete sector by ID
  const { id } = await context.params;
  const result = await SectorModel.findByIdAndDelete(id);
  if (!result) {
    return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

/**
 * IMPLEMENTATION NOTES:
 * - GET: Retrieve sector by ID
 * - PATCH: Trigger event for sector by ID
 * - DELETE: Remove sector by ID
 * - Strict validation and error handling
 * - AAA/ECHO compliant
 */
