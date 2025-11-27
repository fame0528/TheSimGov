/**
 * @file app/api/ai/global-impact-events/route.ts
 * @description Global impact event tracking and analysis
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Provides global impact event modeling with economic, political, and social consequences.
 * Tracks event types, severity levels, trigger conditions, and mitigation strategies.
 *
 * BUSINESS LOGIC:
 * - Event type classification (Market Monopoly, Regulatory Intervention, etc.)
 * - Severity level assessment (Low/Medium/High/Critical)
 * - Trigger condition monitoring
 * - Consequence calculation and prediction
 * - Mitigation strategy recommendations
 *
 * ENDPOINTS:
 * - GET /api/ai/global-impact-events - Fetch global impact events
 * - POST /api/ai/global-impact-events - Create new impact event
 * - PUT /api/ai/global-impact-events - Update existing event
 * - DELETE /api/ai/global-impact-events - Remove event
 *
 * @implementation FID-20251123-001 Phase 5 API Development
 * @legacy-source old projects/politics/app/api/ai/global-impact-events/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { authenticateRequest, handleAPIError } from '@/lib/utils/api-helpers';
import { connectDB } from '@/lib/db/mongoose';
import GlobalImpactEvent, { IGlobalImpactEvent } from '@/lib/db/models/GlobalImpactEvent';
import {
  calculateEventSeverity,
  predictEventConsequences,
  generateMitigationStrategies,
  assessTriggerConditions,
} from '@/lib/utils/ai/globalImpact';

/**
 * GET /api/ai/global-impact-events
 *
 * Fetch global impact events with optional filtering.
 *
 * QUERY PARAMETERS:
 * - eventType: string (optional) - Filter by event type
 * - severity: string (optional) - Filter by severity level
 * - industry: string (optional) - Filter by affected industry
 * - limit: number (optional) - Limit results (default: 50)
 * - offset: number (optional) - Pagination offset (default: 0)
 *
 * RESPONSE:
 * {
 *   events: [GlobalImpactEvent[]],
 *   total: number,
 *   hasMore: boolean
 * }
 *
 * @example
 * GET /api/ai/global-impact-events?eventType=Market%20Monopoly&severity=High&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const industry = searchParams.get('industry');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to database
    await connectDB();

    // Build query
    const query: any = {};
    if (eventType) query.eventType = eventType;
    if (severity) query.severity = severity;
    if (industry) query.affectedIndustries = { $in: [industry] };

    // Fetch events with pagination
    const events = await GlobalImpactEvent
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await GlobalImpactEvent.countDocuments(query);

    return NextResponse.json({
      events,
      total,
      hasMore: offset + events.length < total,
      limit,
      offset,
    }, { status: 200 });
  } catch (error) {
    return handleAPIError('[GET /api/ai/global-impact-events]', error, 'Failed to fetch global impact events');
  }
}

/**
 * POST /api/ai/global-impact-events
 *
 * Create a new global impact event.
 *
 * REQUEST BODY:
 * {
 *   eventType: string (required) - Type of event
 *   title: string (required) - Event title
 *   description: string (required) - Event description
 *   affectedIndustries: string[] (required) - Industries affected
 *   triggerConditions: object (optional) - Conditions that triggered event
 *   initialSeverity: string (optional) - Initial severity assessment
 * }
 *
 * RESPONSE:
 * {
 *   event: GlobalImpactEvent,
 *   severity: { level: string, score: number },
 *   consequences: { economic: number, political: number, social: number },
 *   mitigationStrategies: string[]
 * }
 *
 * @example
 * POST /api/ai/global-impact-events
 * Body: {
 *   eventType: "Market Monopoly",
 *   title: "AI Market Consolidation",
 *   description: "Major AI companies forming strategic alliances",
 *   affectedIndustries: ["Technology", "Artificial Intelligence"],
 *   triggerConditions: { marketShareThreshold: 0.4 }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const {
      companyId,
      eventType,
      title,
      description,
      affectedIndustries,
      triggerConditions,
      initialSeverity,
    } = body;

    // Validate required fields
    if (!companyId || !eventType || !title || !description || !affectedIndustries) {
      return NextResponse.json({
        error: 'Missing required fields: companyId, eventType, title, description, affectedIndustries'
      }, { status: 422 });
    }

    // Fetch company data
    const Company = (await import('@/lib/db/models/Company')).default;
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({
        error: 'Company not found'
      }, { status: 404 });
    }

    // Connect to database
    await connectDB();

    // Assess trigger conditions
    const triggerAssessment = await assessTriggerConditions(
      triggerConditions.marketShareThreshold,
      triggerConditions.agiCapabilityThreshold,
      company.marketShareAI || 0,
      company.agiCapability || 0
    );

    // Calculate severity
    const severity = await calculateEventSeverity(
      triggerConditions.marketShareThreshold,
      triggerConditions.agiCapabilityThreshold,
      company.marketShareAI || 0,
      company.agiCapability || 0
    );

    // Predict consequences
    const consequences = await predictEventConsequences(eventType, severity, affectedIndustries);

    // Generate mitigation strategies
    const mitigationStrategies = await generateMitigationStrategies(eventType, severity, {
      budget: company.revenue * 0.01, // 1% of revenue for mitigation
      lobbyingPower: 50, // Assume moderate lobbying power
      prTeam: true // Assume they have PR team
    });

    // Create event
    const event = new GlobalImpactEvent({
      company: companyId,
      eventType,
      severity,
      title,
      description,
      triggerConditions,
      economicConsequences: consequences.economic,
      politicalConsequences: consequences.political,
      socialConsequences: consequences.social,
      mitigationStrategies,
      isActive: true,
    });

    await event.save();

    return NextResponse.json({
      event,
      severity,
      consequences,
      mitigationStrategies,
    }, { status: 201 });
  } catch (error) {
    return handleAPIError('[POST /api/ai/global-impact-events]', error, 'Failed to create global impact event');
  }
}

/**
 * PUT /api/ai/global-impact-events
 *
 * Update an existing global impact event.
 *
 * REQUEST BODY:
 * {
 *   eventId: string (required) - Event to update
 *   updates: object (required) - Fields to update
 * }
 *
 * RESPONSE:
 * {
 *   event: GlobalImpactEvent (updated),
 *   severity: { level: string, score: number } (if recalculated),
 *   consequences: object (if recalculated)
 * }
 *
 * @example
 * PUT /api/ai/global-impact-events
 * Body: {
 *   eventId: "673d7...",
 *   updates: { status: "Resolved", description: "Updated description" }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { eventId, updates } = body;

    if (!eventId || !updates) {
      return NextResponse.json({
        error: 'Missing required fields: eventId, updates'
      }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Fetch event
    const event = await GlobalImpactEvent.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Apply valid updates (only update fields that exist in the schema)
    const validUpdates: Partial<IGlobalImpactEvent> = {};

    if (updates.title) validUpdates.title = updates.title;
    if (updates.description) validUpdates.description = updates.description;
    if (updates.isActive !== undefined) validUpdates.isActive = updates.isActive;
    if (updates.resolution) validUpdates.resolution = updates.resolution;

    // Apply updates
    Object.assign(event, validUpdates);

    await event.save();

    return NextResponse.json({
      message: 'Event updated successfully',
      event: {
        id: event._id,
        eventType: event.eventType,
        severity: event.severity,
        title: event.title,
        description: event.description,
        isActive: event.isActive,
        resolution: event.resolution,
      },
    });
  } catch (error) {
    return handleAPIError('[PUT /api/ai/global-impact-events]', error, 'Failed to update global impact event');
  }
}

/**
 * DELETE /api/ai/global-impact-events
 *
 * Remove a global impact event.
 *
 * REQUEST BODY:
 * {
 *   eventId: string (required) - Event to delete
 * }
 *
 * RESPONSE:
 * {
 *   message: string,
 *   deletedEvent: GlobalImpactEvent
 * }
 *
 * @example
 * DELETE /api/ai/global-impact-events
 * Body: { eventId: "673d7..." }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { session, error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { userId } = session!;

    // Parse request body
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing required field: eventId' }, { status: 422 });
    }

    // Connect to database
    await connectDB();

    // Fetch event
    const event = await GlobalImpactEvent.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete event
    await GlobalImpactEvent.findByIdAndDelete(eventId);

    return NextResponse.json({
      message: 'Global impact event deleted successfully',
      deletedEvent: {
        id: event._id,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
      },
    });
  } catch (error) {
    return handleAPIError('[DELETE /api/ai/global-impact-events]', error, 'Failed to delete global impact event');
  }
}