/**
 * @fileoverview Test API Endpoint
 * @module app/api/test/route
 * 
 * OVERVIEW:
 * Demonstrates infrastructure usage in API routes.
 * Tests database connection, error handling, and response formatting.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ApiError } from '@/lib/api';

/**
 * GET /api/test - Test endpoint
 * 
 * Demonstrates:
 * - Database connection
 * - Error handling with ApiError
 * - Standardized API response format
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectDB();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Infrastructure test successful',
      data: {
        timestamp: new Date().toISOString(),
        database: 'connected',
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    // Handle errors with ApiError
    const apiError = ApiError.serverError('Infrastructure test failed');
    return NextResponse.json(
      {
        success: false,
        error: apiError.message,
      },
      { status: apiError.statusCode }
    );
  }
}

/**
 * USAGE:
 * curl http://localhost:3000/api/test
 * 
 * Expected response:
 * {
 *   "success": true,
 *   "message": "Infrastructure test successful",
 *   "data": {
 *     "timestamp": "2025-11-20T...",
 *     "database": "connected",
 *     "environment": "development"
 *   }
 * }
 */
