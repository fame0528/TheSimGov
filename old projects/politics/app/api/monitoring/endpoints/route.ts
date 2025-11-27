/**
 * @file app/api/monitoring/endpoints/route.ts
 * @description API endpoint monitoring and management
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles API endpoint registration and monitoring for Technology/Software companies.
 * Tracks request volume, performance metrics, rate limiting, authentication, and revenue
 * per endpoint.
 * 
 * ENDPOINTS:
 * - POST /api/monitoring/endpoints - Register new API endpoint
 * - GET /api/monitoring/endpoints - List endpoints with performance metrics
 * 
 * BUSINESS LOGIC:
 * - Rate limiting: 100/min, 5k/hour, 100k/day defaults
 * - Performance SLA: 99.9% uptime, <200ms p95 latency, <1% error rate
 * - Pricing: Free (1k calls/month), $0.001/call after
 * - Authentication: API Key, OAuth2, JWT, None
 * 
 * IMPLEMENTATION NOTES:
 * - 40% code reuse from software products API (auth/validation structure)
 * - New rate limiting configuration logic
 * - New performance SLA initialization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import APIEndpoint from '@/lib/db/models/APIEndpoint';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/monitoring/endpoints
 * 
 * Register new API endpoint
 * 
 * Request Body:
 * {
 *   company: string;
 *   name: string;
 *   path: string;
 *   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
 *   endpointType?: 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC';
 *   authMethod?: 'API Key' | 'OAuth2' | 'JWT' | 'None';
 *   rateLimitPerMinute?: number;
 *   rateLimitPerHour?: number;
 *   rateLimitPerDay?: number;
 *   pricingModel?: 'Free' | 'Pay-per-call' | 'Tiered';
 *   pricePerCall?: number;
 *   freeCallsPerMonth?: number;
 * }
 * 
 * Response:
 * {
 *   endpoint: IAPIEndpoint;
 *   configuration: {
 *     rateLimit: object;
 *     auth: string;
 *     pricing: object;
 *   };
 *   performanceTargets: {
 *     uptime: number;
 *     p95Latency: number;
 *     errorRate: number;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const {
      company: companyId,
      name,
      path,
      method,
      endpointType,
      authMethod,
      rateLimitPerMinute,
      rateLimitPerHour,
      rateLimitPerDay,
      pricingModel,
      pricePerCall,
      freeCallsPerMonth,
    } = body;

    // Validate required fields
    if (!companyId || !name || !path) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, path' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Verify company is Technology/Software industry
    if (company.industry !== 'Technology' || company.subcategory !== 'Software') {
      return NextResponse.json(
        {
          error: 'Invalid company type - Must be Technology/Software industry',
          industry: company.industry,
          subcategory: company.subcategory,
        },
        { status: 400 }
      );
    }

    // Check for duplicate path
    const existingEndpoint = await APIEndpoint.findOne({ company: companyId, path, active: true });
    if (existingEndpoint) {
      return NextResponse.json(
        { error: 'Endpoint with this path already exists', path },
        { status: 409 }
      );
    }

    // Create API endpoint
    const endpoint = await APIEndpoint.create({
      company: new Types.ObjectId(companyId),
      name,
      path,
      method: method || 'GET',
      endpointType: endpointType || 'REST',
      authMethod: authMethod || 'API Key',
      active: true,
      launchedAt: new Date(),
      rateLimitPerMinute: rateLimitPerMinute !== undefined ? rateLimitPerMinute : 100,
      rateLimitPerHour: rateLimitPerHour !== undefined ? rateLimitPerHour : 5000,
      rateLimitPerDay: rateLimitPerDay !== undefined ? rateLimitPerDay : 100000,
      maxPayloadSize: 100, // 100 KB default
      timeoutSeconds: 30,
      pricingModel: pricingModel || 'Tiered',
      pricePerCall: pricePerCall !== undefined ? pricePerCall : 0.001,
      freeCallsPerMonth: freeCallsPerMonth !== undefined ? freeCallsPerMonth : 1000,
      totalCalls: 0,
      monthlyCalls: 0,
      dailyCalls: 0,
      uniqueCustomers: 0,
      avgCallsPerCustomer: 0,
      avgResponseTime: 100, // 100ms target
      p95ResponseTime: 200, // 200ms p95 target
      p99ResponseTime: 500, // 500ms p99 target
      errorRate: 0.5, // 0.5% target
      uptime: 99.9, // 99.9% target
      totalRevenue: 0,
      monthlyRevenue: 0,
    });

    return NextResponse.json({
      endpoint,
      configuration: {
        rateLimit: {
          perMinute: endpoint.rateLimitPerMinute,
          perHour: endpoint.rateLimitPerHour,
          perDay: endpoint.rateLimitPerDay,
        },
        auth: endpoint.authMethod,
        pricing: {
          model: endpoint.pricingModel,
          pricePerCall: endpoint.pricePerCall,
          freeCallsPerMonth: endpoint.freeCallsPerMonth,
        },
      },
      performanceTargets: {
        uptime: 99.9,
        p95Latency: 200,
        errorRate: 1.0,
      },
      message: `API endpoint registered successfully. Path: ${path}, Method: ${endpoint.method}`,
    });
  } catch (error) {
    console.error('Error registering API endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monitoring/endpoints
 * 
 * List API endpoints with performance metrics
 * 
 * Query Parameters:
 * - company: string (required)
 * - endpointType?: EndpointType
 * - active?: boolean
 * 
 * Response:
 * {
 *   endpoints: IAPIEndpoint[];
 *   company: object;
 *   aggregatedMetrics: {
 *     totalCalls: number;
 *     monthlyRevenue: number;
 *     avgResponseTime: number;
 *     avgErrorRate: number;
 *     avgUptime: number;
 *   };
 *   healthSummary: {
 *     healthy: number;
 *     degraded: number;
 *     down: number;
 *   };
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const endpointType = searchParams.get('endpointType');
    const activeParam = searchParams.get('active');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify company exists and user owns it
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this company' }, { status: 403 });
    }

    // Build query filter
    const filter: any = { company: companyId };
    if (endpointType) filter.endpointType = endpointType;
    if (activeParam !== null) filter.active = activeParam === 'true';

    // Fetch endpoints
    const endpoints = await APIEndpoint.find(filter).sort({ monthlyCalls: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalCalls: endpoints.reduce((sum, ep) => sum + ep.totalCalls, 0),
      monthlyRevenue: endpoints.reduce((sum, ep) => sum + ep.monthlyRevenue, 0),
      avgResponseTime: 0,
      avgErrorRate: 0,
      avgUptime: 0,
    };

    if (endpoints.length > 0) {
      aggregatedMetrics.avgResponseTime =
        Math.round((endpoints.reduce((sum, ep) => sum + ep.avgResponseTime, 0) / endpoints.length) * 100) / 100;
      aggregatedMetrics.avgErrorRate =
        Math.round((endpoints.reduce((sum, ep) => sum + ep.errorRate, 0) / endpoints.length) * 100) / 100;
      aggregatedMetrics.avgUptime =
        Math.round((endpoints.reduce((sum, ep) => sum + ep.uptime, 0) / endpoints.length) * 100) / 100;
    }

    // Health summary
    const healthSummary = {
      healthy: endpoints.filter((ep) => ep.isHealthy).length,
      degraded: endpoints.filter((ep) => !ep.isHealthy && ep.uptime >= 95).length,
      down: endpoints.filter((ep) => ep.uptime < 95).length,
    };

    return NextResponse.json({
      endpoints,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      healthSummary,
    });
  } catch (error) {
    console.error('Error fetching API endpoints:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
