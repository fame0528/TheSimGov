/**
 * Global Impact Events API Route
 * 
 * @fileoverview CRUD operations for global impact events (automation waves, regulatory interventions, etc.)
 * Tracks consequences of AI industry dominance on economy, politics, and society
 * 
 * @route GET /api/ai/global-events - List global impact events
 * @route POST /api/ai/global-events - Create new impact event
 * 
 * @created 2025-11-15
 * @updated 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import connectDB from '@/lib/db/mongodb';
import GlobalImpactEvent from '@/lib/db/models/GlobalImpactEvent';
import Company from '@/lib/db/models/Company';
import { generateImpactEvent } from '@/lib/utils/ai/globalImpact';

/**
 * OVERVIEW:
 * 
 * Global impact event tracking system for AI industry consequences.
 * 
 * KEY FEATURES:
 * - 5 event types (Market Monopoly, Regulatory Intervention, Public Backlash, AI Arms Race, Automation Wave)
 * - 4 severity levels (Minor, Major, Critical, Existential)
 * - Economic/political/social consequence tracking
 * - Company involvement and market snapshots
 * - Response tracking (company, government, public)
 * 
 * BUSINESS LOGIC:
 * - GET: List events with filters (company, type, severity, date range, status)
 * - POST: Create new event (manual or auto-generated)
 * - Auto-generate events when trigger conditions met
 * - Track multi-dimensional consequences
 * 
 * DEPENDENCIES:
 * - GlobalImpactEvent schema
 * - Company schema (references)
 * - globalImpact.ts (event generation)
 * - Authentication (public events viewable, creation requires ownership)
 */

// ============================================================================
// GET - List Global Impact Events
// ============================================================================

/**
 * List global impact events with optional filters
 * 
 * @param request - NextRequest with query params
 * @returns Array of global impact events
 * 
 * @queryParams
 * - companyId: string (optional) - Filter by primary company
 * - eventType: string (optional) - Filter by event type
 * - severity: string (optional) - Filter by severity level
 * - status: string (optional) - Filter by event status
 * - startDate: string (optional) - Filter events after date (ISO 8601)
 * - endDate: string (optional) - Filter events before date (ISO 8601)
 * - limit: number (optional) - Max results (default: 50)
 * - page: number (optional) - Page number (default: 1)
 * 
 * @example
 * GET /api/ai/global-events?eventType=Market%20Monopoly&severity=Critical&limit=20
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     events: [...],
 *     pagination: { total: 42, page: 1, pages: 3, limit: 20 }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication (optional for viewing, but helps personalization)
    // const session = await getServerSession();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    // Database connection
    await connectDB();

    // Build filter query
    const filter: { [key: string]: unknown } = {};

    if (companyId) {
      filter.primaryCompany = companyId;
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      filter.triggeredAt = dateFilter;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch events with pagination
    const [events, total] = await Promise.all([
      GlobalImpactEvent.find(filter)
        .populate('primaryCompany', 'name industry subcategory level')
        .populate('affectedCompanies', 'name')
        .sort({ triggeredAt: -1, severity: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GlobalImpactEvent.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch global impact events';
    console.error('Error fetching global impact events:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Global Impact Event
// ============================================================================

/**
 * Create a new global impact event
 * 
 * @param request - NextRequest with body
 * @returns Created event
 * 
 * @body
 * - companyId: string (required) - Primary company triggering event
 * - industry: string (optional) - Industry filter for auto-generation
 * - subcategory: string (optional) - Subcategory filter
 * - autoGenerate: boolean (optional) - Auto-generate event based on conditions (default: false)
 * - manualEvent: object (optional) - Manual event creation data
 * 
 * @example
 * POST /api/ai/global-events
 * Body: { companyId: "673d7...", autoGenerate: true }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     event: { ...created event },
 *     autoGenerated: true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      companyId,
      industry = 'Technology',
      subcategory = 'Artificial Intelligence',
      autoGenerate = false,
      manualEvent,
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: companyId' },
        { status: 400 }
      );
    }

    // Database connection
    await connectDB();

    // Fetch company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Authorization
    if (company.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not own this company' },
        { status: 403 }
      );
    }

    let event;

    // Auto-generation mode
    if (autoGenerate) {
      const generatedEvent = await generateImpactEvent(companyId, industry, subcategory);

      if (!generatedEvent) {
        return NextResponse.json(
          { success: false, error: 'No trigger conditions met for event generation' },
          { status: 400 }
        );
      }

      // Create event from generated data
      event = await GlobalImpactEvent.create({
        eventType: generatedEvent.eventType,
        severity: generatedEvent.severity,
        status: 'Predicted',
        title: generatedEvent.title,
        description: generatedEvent.description,
        primaryCompany: companyId,
        affectedCompanies: [],
        triggeredAt: new Date(),
        triggerConditions: generatedEvent.triggerConditions,
      });

      return NextResponse.json({
        success: true,
        data: {
          event,
          autoGenerated: true,
        },
      });
    }

    // Manual event creation
    if (!manualEvent) {
      return NextResponse.json(
        { success: false, error: 'Missing manualEvent data for manual creation' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!manualEvent.eventType || !manualEvent.severity || !manualEvent.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: eventType, severity, title' },
        { status: 400 }
      );
    }

    // Create manual event
    event = await GlobalImpactEvent.create({
      ...manualEvent,
      primaryCompany: companyId,
      triggeredAt: manualEvent.triggeredAt || new Date(),
      status: manualEvent.status || 'Active',
    });

    return NextResponse.json({
      success: true,
      data: {
        event,
        autoGenerated: false,
      },
    });
  } catch (error: any) {
    console.error('Error creating global impact event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create global impact event' },
      { status: 500 }
    );
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. EVENT TYPES (5 total):
 *    - Market Monopoly: Company achieves >40% market share
 *    - Regulatory Intervention: Government antitrust action
 *    - Public Backlash: Protests, boycotts, reputation damage
 *    - AI Arms Race: International competition escalation
 *    - Automation Wave: Mass job displacement from AGI
 * 
 * 2. SEVERITY LEVELS (4 total):
 *    - Minor: Limited impact, localized consequences
 *    - Major: Significant impact, regional consequences
 *    - Critical: Severe impact, national consequences
 *    - Existential: Catastrophic impact, global consequences
 * 
 * 3. EVENT STATUS (4 total):
 *    - Predicted: Forecasted event not yet occurred
 *    - Active: Currently happening
 *    - Resolved: Event concluded
 *    - Escalating: Event worsening
 * 
 * 4. AUTO-GENERATION TRIGGERS:
 *    - Market Monopoly: >40% market share
 *    - Automation Wave: >80% AGI capability
 *    - Regulatory Intervention: High antitrust risk
 *    - Public Backlash: Low public perception + high job displacement
 *    - AI Arms Race: High geopolitical tension
 * 
 * 5. CONSEQUENCES TRACKING:
 *    - Economic: GDP impact, jobs affected, market value impact, recovery time
 *    - Political: Regulations imposed, countries banning, stability impact
 *    - Social: Public perception change, unrest level, AI trust change, media sentiment
 * 
 * 6. FILTERS SUPPORTED:
 *    - Company: Primary company or affected companies
 *    - Event Type: Specific event category
 *    - Severity: Minor/Major/Critical/Existential
 *    - Status: Predicted/Active/Resolved/Escalating
 *    - Date Range: Start/end date filtering
 *    - Pagination: Limit and page number
 * 
 * 7. AUTHORIZATION:
 *    - GET: Public access (all users can view events)
 *    - POST: Requires company ownership or admin role
 *    - Event creation limited to company owners
 * 
 * 8. MANUAL VS AUTO-GENERATION:
 *    - Auto-generate: System detects trigger conditions, creates event automatically
 *    - Manual: User provides complete event data
 *    - Auto-generated events have "Predicted" status initially
 *    - Manual events default to "Active" status
 * 
 * 9. RESPONSE TRACKING:
 *    - companyResponses: Array of company actions/statements
 *    - governmentResponses: Array of regulatory actions
 *    - publicReactions: Array of social/media reactions
 *    - Tracked separately per event
 * 
 * 10. PERFORMANCE CONSIDERATIONS:
 *     - Pagination prevents large result sets
 *     - Compound indexes on common query patterns
 *     - Populated company references for display
 *     - Sorted by date (desc) and severity
 * 
 * @architecture
 * - RESTful API with GET/POST methods
 * - Auto-generation via trigger detection
 * - Manual creation for scenario planning
 * - Consequence tracking across 3 dimensions
 * - Public viewing, restricted creation
 */
