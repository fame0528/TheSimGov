/**
 * @file src/app/api/edtech/certifications/route.ts
 * @description API endpoints for professional certification management
 * @created 2025-11-28
 * 
 * OVERVIEW:
 * REST API for managing professional certification programs. Supports certification creation,
 * listing with filters, and aggregated metrics. Tracks certification types (Professional,
 * Technical, Industry, Vendor), exam requirements, pass rates, market recognition, and revenue.
 * 
 * ENDPOINTS:
 * GET /api/edtech/certifications - List certifications with filtering
 * POST /api/edtech/certifications - Create new certification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Certification from '@/lib/db/models/edtech/Certification';
import Company from '@/lib/db/models/Company';
import { IndustryType } from '@/lib/types';

/**
 * GET /api/edtech/certifications
 * 
 * @description List certifications with optional filtering and aggregated metrics
 * 
 * @queryparam {string} company - Filter by company ID
 * @queryparam {string} type - Filter by type (Professional, Technical, etc.)
 * @queryparam {boolean} active - Filter by active status
 * 
 * @returns {Object} Certifications array and aggregated metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company');
    const type = searchParams.get('type');
    const activeParam = searchParams.get('active');

    // Build query
    const query: Record<string, unknown> = {};
    if (companyId) query.company = companyId;
    if (type) query.type = type;
    if (activeParam !== null) query.active = activeParam === 'true';

    // Fetch certifications
    const certifications = await Certification.find(query)
      .populate('company', 'name industry')
      .sort({ marketDemand: -1 })
      .lean();

    // Calculate aggregated metrics
    const metrics = {
      totalCertifications: certifications.length,
      totalEnrolled: certifications.reduce((sum, c) => sum + (c.totalEnrolled || 0), 0),
      totalCertified: certifications.reduce((sum, c) => sum + (c.currentCertified || 0), 0),
      avgPassRate: certifications.length > 0
        ? certifications.reduce((sum, c) => sum + (c.passRate || 0), 0) / certifications.length
        : 0,
      totalRevenue: certifications.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
      byType: {} as Record<string, number>,
      avgMarketDemand: certifications.length > 0
        ? certifications.reduce((sum, c) => sum + (c.marketDemand || 0), 0) / certifications.length
        : 0,
    };

    // Count by type
    certifications.forEach(cert => {
      metrics.byType[cert.type] = (metrics.byType[cert.type] || 0) + 1;
    });

    return NextResponse.json({
      certifications,
      metrics,
    });
  } catch (error) {
    console.error('GET /api/edtech/certifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/edtech/certifications
 * 
 * @description Create new professional certification
 * 
 * @body {string} company - Company ID
 * @body {string} name - Certification name
 * @body {string} code - Certification code (unique)
 * @body {string} description - Certification description
 * @body {string} type - Certification type
 * @body {number} examDuration - Exam duration in minutes
 * @body {number} examFee - Exam fee
 * @body {number} passingScore - Passing score percentage
 * @body {number} validityPeriod - Validity period in months
 * 
 * @returns {Object} Created certification document
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
      company,
      name,
      code,
      description,
      type,
      prerequisites,
      examDuration,
      questionCount,
      passingScore,
      examFormat,
      handsOnLabs,
      validityPeriod,
      renewalRequired,
      renewalFee,
      continuingEducation,
      examFee,
      retakeFee,
      trainingMaterialsFee,
      membershipFee,
      developmentCost,
    } = body;

    // Validate company exists and is Technology/Software industry
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (companyDoc.industry !== IndustryType.TECH) {
      return NextResponse.json(
        { error: 'Certifications only available for Technology companies' },
        { status: 400 }
      );
    }

    // Check for duplicate certification code
    const existingCert = await Certification.findOne({ code: code.toUpperCase() });
    if (existingCert) {
      return NextResponse.json(
        { error: 'Certification code already exists' },
        { status: 400 }
      );
    }

    // Create certification
    const certification = await Certification.create({
      company,
      name,
      code: code.toUpperCase(),
      description,
      type,
      prerequisites: prerequisites || [],
      examDuration,
      questionCount: questionCount || 50,
      passingScore: passingScore || 70,
      examFormat: examFormat || 'Multiple-choice',
      handsOnLabs: handsOnLabs || false,
      validityPeriod,
      renewalRequired: renewalRequired !== undefined ? renewalRequired : true,
      renewalFee: renewalFee || 0,
      continuingEducation: continuingEducation || 0,
      examFee,
      retakeFee: retakeFee || Math.round(examFee * 0.75),
      trainingMaterialsFee: trainingMaterialsFee || 0,
      membershipFee: membershipFee || 0,
      developmentCost: developmentCost || 100000,
      active: true,
      launchedAt: new Date(),
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error('POST /api/edtech/certifications error:', error);
    
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate certification code' },
        { status: 400 }
      );
    }

    if ((error as { name?: string }).name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: (error as { errors?: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create certification' },
      { status: 500 }
    );
  }
}
