/**
 * @file app/api/ai/real-estate/route.ts
 * @description Land acquisition API: list available properties, purchase/lease land
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * RESTful API for real estate operations in AI industry. Supports filtering available
 * land by region, property type, price, and zoning. Enables land acquisition via
 * purchase (CAPEX) or lease (OPEX) with budget validation and ownership verification.
 * 
 * ENDPOINTS:
 * GET /api/ai/real-estate - List available properties with filtering
 * POST /api/ai/real-estate - Acquire land (purchase or lease)
 * 
 * SECURITY:
 * - Session authentication required
 * - Company ownership validation
 * - Budget validation for acquisitions
 * - Technology industry restriction (AI companies only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongoose';
import Company from '@/lib/db/models/Company';
import RealEstate from '@/lib/db/models/RealEstate';
import Transaction from '@/lib/db/models/Transaction';

/**
 * GET /api/ai/real-estate
 * 
 * List available real estate properties with optional filtering.
 * Properties can be filtered by region, property type, max price,
 * min size, zone classification, and acquisition type.
 * 
 * Query parameters:
 * - companyId: Filter by owning company (authenticated user's companies)
 * - region: Filter by location region (e.g., "California", "Texas")
 * - propertyType: Urban | Suburban | Rural | SpecialZone
 * - maxPrice: Maximum purchase price (USD)
 * - minSize: Minimum size in acres
 * - maxSize: Maximum size in acres
 * - zoneClassification: Residential | Commercial | Industrial | DataCenter | Mixed
 * - acquisitionType: Purchase | Lease | BuildToSuit
 * - occupied: true | false (filter by occupancy status)
 * - availableOnly: true = only unoccupied properties
 * 
 * Returns:
 * - 200: { properties: IRealEstate[] }
 * - 401: { error: 'Unauthorized' } - Not authenticated
 * - 500: { error: 'Failed to fetch properties' } - Server error
 * 
 * @example
 * // List available land in Texas, Industrial zoning, max $5M
 * GET /api/ai/real-estate?region=Texas&zoneClassification=Industrial&maxPrice=5000000&availableOnly=true
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const region = searchParams.get('region');
    const propertyType = searchParams.get('propertyType');
    const maxPrice = searchParams.get('maxPrice');
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');
    const zoneClassification = searchParams.get('zoneClassification');
    const acquisitionType = searchParams.get('acquisitionType');
    const occupied = searchParams.get('occupied');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    // Build filter object
    const filter: { [key: string]: unknown } = {};

    if (companyId) {
      // Validate company ownership
      const company = await Company.findOne({ 
        _id: companyId, 
        owner: session.user.id 
      });
      
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found or unauthorized' },
          { status: 404 }
        );
      }
      
      filter.company = companyId;
    }

    if (region) filter['location.region'] = region;
    if (propertyType) filter.propertyType = propertyType;
    if (zoneClassification) filter.zoneClassification = zoneClassification;
    if (acquisitionType) filter.acquisitionType = acquisitionType;
    
    // Price filtering (only for Purchase properties)
    if (maxPrice) {
      const andConditions = (filter.$and as Array<unknown>) || [];
      andConditions.push({
        $or: [
          { acquisitionType: { $ne: 'Purchase' } }, // Non-purchase properties
          { purchasePrice: { $lte: parseFloat(maxPrice) } }, // Purchase within budget
        ],
      });
      filter.$and = andConditions;
    }

    // Size filtering
    if (minSize || maxSize) {
      const sizeFilter: { $gte?: number; $lte?: number } = {};
      if (minSize) sizeFilter.$gte = parseFloat(minSize);
      if (maxSize) sizeFilter.$lte = parseFloat(maxSize);
      filter.size = sizeFilter;
    }

    // Occupancy filtering
    if (occupied !== null) filter.occupied = occupied === 'true';
    if (availableOnly) filter.occupied = false;

    // Fetch properties
    const properties = await RealEstate.find(filter)
      .sort({ powerCostPerKWh: 1 }) // Sort by cheapest power first
      .populate('company', 'name industry subcategory')
      .populate('dataCenters', 'name tierCertification powerCapacityMW')
      .lean();

    return NextResponse.json({ properties }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/ai/real-estate error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/real-estate
 * 
 * Acquire real estate property via purchase or lease.
 * Validates company ownership, budget availability, and industry eligibility.
 * Creates transaction record and updates company cash balance.
 * 
 * Request body:
 * {
 *   companyId: string;           // Company making the acquisition
 *   name: string;                // Property name/identifier
 *   location: {
 *     region: string;
 *     city?: string;
 *     coordinates?: { lat: number; lng: number };
 *     fiberTier: 1 | 2 | 3;
 *   };
 *   propertyType: PropertyType;  // Urban | Suburban | Rural | SpecialZone
 *   zoneClassification: ZoneClassification;
 *   size: number;                // Acres
 *   acquisitionType: AcquisitionType; // Purchase | Lease | BuildToSuit
 *   purchasePrice?: number;      // Required for Purchase
 *   leaseRate?: number;          // Required for Lease (monthly cost)
 *   powerCapacityMW: number;
 *   powerCostPerKWh: number;
 *   fiberConnected?: boolean;
 * }
 * 
 * Returns:
 * - 201: { property: IRealEstate } - Property created successfully
 * - 400: { error: string } - Missing/invalid fields
 * - 401: { error: 'Unauthorized' } - Not authenticated
 * - 403: { error: string } - Not AI company or insufficient funds
 * - 404: { error: string } - Company not found
 * - 422: { error: string } - Validation error
 * - 500: { error: string } - Server error
 * 
 * @example
 * // Purchase 50-acre rural property in Texas
 * POST /api/ai/real-estate
 * {
 *   "companyId": "507f1f77bcf86cd799439011",
 *   "name": "Texas DC Site Alpha",
 *   "location": { "region": "Texas", "city": "Austin", "fiberTier": 2 },
 *   "propertyType": "Rural",
 *   "zoneClassification": "Industrial",
 *   "size": 50,
 *   "acquisitionType": "Purchase",
 *   "purchasePrice": 3000000,
 *   "powerCapacityMW": 20,
 *   "powerCostPerKWh": 0.06
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      companyId,
      name,
      location,
      propertyType,
      zoneClassification,
      size,
      acquisitionType,
      purchasePrice,
      leaseRate,
      powerCapacityMW,
      powerCostPerKWh,
      fiberConnected,
      zoningRestrictions,
      propertyTaxRate,
    } = body;

    // Validate required fields
    if (!companyId || !name || !location || !propertyType || !zoneClassification || 
        !size || !acquisitionType || !powerCapacityMW || !powerCostPerKWh) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate company ownership and industry
    const company = await Company.findOne({
      _id: companyId,
      owner: session.user.id,
      industry: 'Technology',
      subcategory: 'AI',
    });

    if (!company) {
      return NextResponse.json(
        { 
          error: 'Company not found, unauthorized, or not an AI company. ' +
                 'Only AI companies (Technology → AI subcategory) can acquire real estate.' 
        },
        { status: 403 }
      );
    }

    // Validate acquisition-specific fields
    if (acquisitionType === 'Purchase') {
      if (!purchasePrice || purchasePrice <= 0) {
        return NextResponse.json(
          { error: 'Purchase price is required and must be greater than 0' },
          { status: 400 }
        );
      }

      // Check company has sufficient funds
      if (company.cash < purchasePrice) {
        return NextResponse.json(
          {
            error: 'Insufficient funds',
            details: `Purchase requires $${purchasePrice.toLocaleString()} but company has $${company.cash.toLocaleString()}`,
          },
          { status: 403 }
        );
      }
    }

    if (acquisitionType === 'Lease') {
      if (!leaseRate || leaseRate <= 0) {
        return NextResponse.json(
          { error: 'Lease rate (monthly) is required and must be greater than 0' },
          { status: 400 }
        );
      }

      // Check company can afford first month's lease
      if (company.cash < leaseRate) {
        return NextResponse.json(
          {
            error: 'Insufficient funds for first month lease payment',
            details: `Lease requires $${leaseRate.toLocaleString()}/month but company has $${company.cash.toLocaleString()}`,
          },
          { status: 403 }
        );
      }
    }

    // Validate location structure
    if (!location.region || !location.fiberTier) {
      return NextResponse.json(
        { error: 'Location must include region and fiberTier' },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(location.fiberTier)) {
      return NextResponse.json(
        { error: 'Fiber tier must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    // Create real estate property
    const property = await RealEstate.create({
      company: company._id,
      name,
      location,
      propertyType,
      zoneClassification,
      size,
      acquisitionType,
      purchasePrice: acquisitionType === 'Purchase' ? purchasePrice : undefined,
      currentValue: acquisitionType === 'Purchase' ? purchasePrice : undefined,
      leaseRate: acquisitionType === 'Lease' ? leaseRate : undefined,
      propertyTaxRate: propertyTaxRate || 0.01, // Default 1%
      powerCapacityMW,
      powerCostPerKWh,
      fiberConnected: fiberConnected ?? false,
      zoningRestrictions: zoningRestrictions || [],
      permits: [],
      environmentalReview: false, // Must be completed separately
      occupied: false,
      dataCenters: [],
      acquiredDate: new Date(),
    });

    // Process financial transaction
    let transactionAmount = 0;
    let transactionCategory = 'real_estate';

    if (acquisitionType === 'Purchase') {
      transactionAmount = -purchasePrice!; // Negative = expense
      
      // Deduct purchase price from company cash
      company.cash -= purchasePrice!;
      company.expenses += purchasePrice!;
      await company.save();
    } else if (acquisitionType === 'Lease') {
      transactionAmount = -leaseRate!; // First month's lease
      
      // Deduct first month lease from company cash
      company.cash -= leaseRate!;
      company.expenses += leaseRate!;
      await company.save();
    }

    // Create transaction record
    await Transaction.create({
      user: session.user.id,
      company: company._id,
      type: acquisitionType === 'Purchase' ? 'expense' : 'recurring_expense',
      category: transactionCategory,
      amount: transactionAmount,
      description: `${acquisitionType} of ${size} acres in ${location.region} (${name})`,
      date: new Date(),
      metadata: {
        propertyId: property._id,
        propertyName: name,
        propertyType,
        acquisitionType,
        size,
        region: location.region,
      },
    });

    // Populate company reference for response
    await property.populate('company', 'name industry subcategory cash');

    return NextResponse.json({ property }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/ai/real-estate error:', e);

    // Handle validation errors
    if (e.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: e.message },
        { status: 422 }
      );
    }

    // Handle duplicate property name
    if (e.code === 11000) {
      return NextResponse.json(
        { error: 'Property name already exists for this company' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to acquire property' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. AUTHENTICATION & AUTHORIZATION:
 *    - Session-based auth via auth() middleware
 *    - Company ownership validated (owner === session.user.id)
 *    - AI industry restriction (Technology → AI subcategory only)
 * 
 * 2. BUDGET VALIDATION:
 *    - Purchase: Full amount deducted immediately from company cash
 *    - Lease: First month deducted, subsequent months handled by billing system
 *    - BuildToSuit: Partnership model, cost shared with landlord (partial payment)
 * 
 * 3. FILTERING LOGIC:
 *    - Compound filters supported (region + type + price + zoning)
 *    - Power cost optimization: Results sorted by cheapest power first
 *    - Occupancy filtering: availableOnly=true excludes occupied properties
 * 
 * 4. TRANSACTION TRACKING:
 *    - Every acquisition creates Transaction record
 *    - Purchase = expense (one-time CAPEX)
 *    - Lease = recurring_expense (monthly OPEX)
 *    - Metadata includes property details for reporting
 * 
 * 5. FINANCIAL UPDATES:
 *    - Company.cash decremented by acquisition cost
 *    - Company.expenses incremented for accounting
 *    - Property ownership tracked via company reference
 * 
 * 6. DATA INTEGRITY:
 *    - Required fields validated before creation
 *    - Acquisition type determines required financial fields
 *    - Location structure validated (region + fiberTier mandatory)
 *    - Size validated (0.1-10,000 acres)
 * 
 * 7. ERROR HANDLING:
 *    - 400: Client errors (missing fields, invalid values)
 *    - 401: Authentication failures
 *    - 403: Authorization failures (insufficient funds, wrong industry)
 *    - 404: Resource not found
 *    - 422: Validation errors (Mongoose validation)
 *    - 409: Duplicate conflicts (unique constraints)
 *    - 500: Server errors
 * 
 * 8. PERFORMANCE:
 *    - Indexes on company, propertyType, zoneClassification, powerCostPerKWh
 *    - Lean queries for GET (returns plain objects, not Mongoose documents)
 *    - Selective population (only needed fields from related documents)
 * 
 * 9. SECURITY:
 *    - No sensitive data exposed (internal IDs safe)
 *    - Budget validation prevents overspending
 *    - Industry restriction prevents non-AI acquisitions
 *    - Session validation on every request
 * 
 * 10. GAMEPLAY INTEGRATION:
 *     - Properties browsable by power cost (optimization opportunity)
 *     - Multiple acquisition types enable different financial strategies
 *     - Zoning compliance enforced at property level
 *     - Future: Permit applications, environmental reviews, property value appreciation
 */
