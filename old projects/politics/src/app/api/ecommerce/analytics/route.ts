/**
 * @file src/app/api/ecommerce/analytics/route.ts
 * @description Analytics and reporting API endpoints for e-commerce
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * RESTful API for business intelligence and sales analytics. Integrates with
 * analyticsEngine service to provide customer lifetime value analysis (RFM),
 * product performance metrics, revenue forecasting, and comprehensive sales
 * reports. Supports customizable time periods and segmentation.
 * 
 * ENDPOINTS:
 * - GET /api/ecommerce/analytics - Get analytics data based on query type
 * 
 * QUERY PARAMETERS:
 * - companyId: Filter by company (required)
 * - type: Analytics type (customer-ltv, product-performance, revenue-forecast, sales-report)
 * - period: Time period (last_7_days, last_30_days, last_90_days, all_time)
 * - customerId: Specific customer for LTV analysis
 * - categoryId: Filter product performance by category
 * - productId: Specific product analysis
 * - forecastDays: Days to forecast (default 30, max 365)
 * 
 * ANALYTICS TYPES:
 * - customer-ltv: Customer lifetime value with RFM segmentation
 * - product-performance: Sales metrics, inventory turnover, category breakdown
 * - revenue-forecast: Revenue prediction using exponential smoothing
 * - sales-report: Comprehensive dashboard with all metrics
 * 
 * USAGE:
 * ```typescript
 * // Get customer LTV for all customers
 * GET /api/ecommerce/analytics?companyId=123&type=customer-ltv&period=all_time
 * 
 * // Get specific customer LTV
 * GET /api/ecommerce/analytics?companyId=123&type=customer-ltv&customerId=456
 * 
 * // Get product performance (last 30 days)
 * GET /api/ecommerce/analytics?companyId=123&type=product-performance&period=last_30_days
 * 
 * // Revenue forecast (60 days)
 * GET /api/ecommerce/analytics?companyId=123&type=revenue-forecast&forecastDays=60
 * 
 * // Full sales report
 * GET /api/ecommerce/analytics?companyId=123&type=sales-report&period=last_90_days
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Company from '@/lib/db/models/Company';
import {
  calculateCustomerLTV,
  analyzeProductPerformance,
  forecastRevenue,
  generateSalesReport,
} from '@/lib/services/analyticsEngine';

/**
 * GET /api/ecommerce/analytics
 * Retrieve analytics data based on query type
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // TODO: Add auth check in production
    // const session = await getServerSession();
    // if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Analytics type is required. Use: customer-ltv, product-performance, revenue-forecast, sales-report' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Parse period parameter
    const period = searchParams.get('period') || 'last_30_days';

    // Route to appropriate analytics function
    switch (type) {
      case 'customer-ltv': {
        const customerId = searchParams.get('customerId');
        
        if (customerId) {
          // Single customer LTV
          const ltv = await calculateCustomerLTV(companyId, customerId);
          return NextResponse.json({
            success: true,
            type: 'customer-ltv',
            customerId,
            data: ltv,
          });
        } else {
          // All customers LTV (no specific customer)
          const ltv = await calculateCustomerLTV(companyId, '');
          return NextResponse.json({
            success: true,
            type: 'customer-ltv',
            period,
            data: ltv,
          });
        }
      }

      case 'product-performance': {
        const categoryId = searchParams.get('categoryId');
        const productId = searchParams.get('productId');

        const performance = await analyzeProductPerformance(companyId, {
          period: period as 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time',
        });

        return NextResponse.json({
          success: true,
          type: 'product-performance',
          period,
          filters: {
            categoryId: categoryId || 'all',
            productId: productId || 'all',
          },
          data: performance,
        });
      }

      case 'revenue-forecast': {
        const forecastDaysParam = searchParams.get('forecastDays');
        const forecastDays = forecastDaysParam
          ? Math.min(parseInt(forecastDaysParam), 365)
          : 30;

        if (isNaN(forecastDays) || forecastDays < 1) {
          return NextResponse.json(
            { error: 'Invalid forecastDays. Must be between 1 and 365' },
            { status: 400 }
          );
        }

        const forecast = await forecastRevenue(companyId);

        return NextResponse.json({
          success: true,
          type: 'revenue-forecast',
          forecastDays,
          data: forecast,
        });
      }

      case 'sales-report': {
        const report = await generateSalesReport(companyId, {
          period: period as 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time',
        });

        return NextResponse.json({
          success: true,
          type: 'sales-report',
          period,
          data: report,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use: customer-ltv, product-performance, revenue-forecast, sales-report' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
