/**
 * @file src/app/api/logistics/route.ts
 * @description Main API route for logistics resources (GET list, POST create)
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Handles GET (list all logistics resources) and POST (create new resource).
 * Validates input with Zod, returns errors with proper status codes.
 * Uses auth() for authentication.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Vehicle from '@/lib/db/models/logistics/Vehicle';
import Warehouse from '@/lib/db/models/logistics/Warehouse';
import Route from '@/lib/db/models/logistics/Route';
import ShippingContract from '@/lib/db/models/logistics/ShippingContract';
import Shipment from '@/lib/db/models/logistics/Shipment';
import { LogisticsSchemas } from '@/lib/validations/logistics';
import { z } from 'zod';

/**
 * GET: List all logistics resources for company
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const companyId = session.user.companyId;
  try {
    const vehicles = await Vehicle.find({ companyId });
    const warehouses = await Warehouse.find({ companyId });
    const routes = await Route.find({ companyId });
    const contracts = await ShippingContract.find({ companyId });
    const shipments = await Shipment.find({ companyId });
    return NextResponse.json({
      vehicles,
      warehouses,
      routes,
      contracts,
      shipments,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch logistics data', details: String(err) }, { status: 500 });
  }
}

/**
 * POST: Create new logistics resource (type specified in body)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  const companyId = session.user.companyId;
  const body = await req.json();
  const { type, data } = body;
  try {
    let created;
    switch (type) {
      case 'vehicle': {
        const parsed = LogisticsSchemas.CreateVehicleDTO.parse({ ...data, companyId });
        created = await Vehicle.create(parsed);
        break;
      }
      case 'warehouse': {
        const parsed = LogisticsSchemas.CreateWarehouseDTO.parse({ ...data, companyId });
        created = await Warehouse.create(parsed);
        break;
      }
      case 'route': {
        const parsed = LogisticsSchemas.CreateRouteDTO.parse({ ...data, companyId });
        created = await Route.create(parsed);
        break;
      }
      case 'contract': {
        const parsed = LogisticsSchemas.CreateShippingContractDTO.parse({ ...data, companyId });
        created = await ShippingContract.create(parsed);
        break;
      }
      case 'shipment': {
        const parsed = LogisticsSchemas.CreateShipmentDTO.parse({ ...data, companyId });
        created = await Shipment.create(parsed);
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }
    return NextResponse.json({ created }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create resource', details: String(err) }, { status: 500 });
  }
}
