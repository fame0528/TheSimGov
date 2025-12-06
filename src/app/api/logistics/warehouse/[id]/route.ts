/**
 * @file src/app/api/logistics/warehouse/[id]/route.ts
 * @description CRUD API route for Warehouse resource
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Handles GET (fetch), PATCH (update), DELETE (remove) for Warehouse by ID.
 * Validates input with Zod, returns errors with proper status codes.
 * Uses auth() for authentication.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Warehouse from '@/lib/db/models/logistics/Warehouse';
import { LogisticsSchemas } from '@/lib/validations/logistics';
import { z } from 'zod';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const { id } = await params;
  try {
    const warehouse = await Warehouse.findOne({ _id: id, companyId: session.user.companyId });
    if (!warehouse) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ warehouse }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch warehouse', details: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  try {
    const parsed = LogisticsSchemas.UpdateWarehouseDTO.parse(body);
    const updated = await Warehouse.findOneAndUpdate(
      { _id: id, companyId: session.user.companyId },
      { $set: parsed },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ updated }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update warehouse', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const { id } = await params;
  try {
    const deleted = await Warehouse.findOneAndDelete({ _id: id, companyId: session.user.companyId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ deleted }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete warehouse', details: String(err) }, { status: 500 });
  }
}
