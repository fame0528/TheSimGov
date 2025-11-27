/**
 * @file app/api/edtech/certifications/route.ts
 * @description Professional certification program management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles certification program creation and retrieval for Technology/Software companies
 * offering professional credentialing. Implements exam management with pass rates, validity
 * periods, renewals, retake fees, and market recognition tracking.
 * 
 * ENDPOINTS:
 * - POST /api/edtech/certifications - Create new certification program
 * - GET /api/edtech/certifications - List certifications with filtering
 * 
 * BUSINESS LOGIC:
 * - Types: Professional, Technical, Industry, Vendor
 * - Exam fees: $100-$500 typical range
 * - Passing score: 60-80% typical requirement
 * - Validity: 1-5 years before renewal required
 * - Pass rate target: 65-75% (too high = low value, too low = discouraging)
 * - Retake fee: 75% of original exam fee
 * - Renewal fee: 50% of original exam fee
 * - Revenue streams: Initial exams + retakes + renewals
 * 
 * IMPLEMENTATION NOTES:
 * - 70% code reuse from cloud/servers route (auth, validation, filtering)
 * - Certification-specific financial calculations (retake, renewal revenue)
 * - Market demand tracking and employer recognition
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import Certification from '@/lib/db/models/Certification';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/edtech/certifications
 * 
 * Create new certification program with exam configuration
 * 
 * Request Body:
 * {
 *   company: string;                 // Company ID (Technology/Software)
 *   name: string;                    // Certification name
 *   code: string;                    // Unique certification code
 *   type: 'Professional' | 'Technical' | 'Industry' | 'Vendor';
 *   examFee: number;                 // Exam price
 *   passingScore: number;            // Percentage required to pass
 *   examDuration?: number;           // Minutes
 *   validityPeriod?: number;         // Years before renewal
 *   renewalRequired?: boolean;       // Requires periodic renewal
 *   skills?: string[];               // Skills validated
 *   prerequisites?: string[];        // Required certifications/experience
 * }
 * 
 * Response:
 * {
 *   certification: ICertification;
 *   examStructure: {
 *     fee: number;
 *     retakeFee: number;
 *     renewalFee: number;
 *     passingScore: number;
 *     validityYears: number;
 *   };
 *   revenueProjections: {
 *     perCertified: number;
 *     renewalRevenue: number;
 *     retakeRevenue: number;
 *   };
 *   message: string;
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
      code,
      type,
      examFee,
      passingScore,
      examDuration,
      validityPeriod,
      renewalRequired,
      skills,
      prerequisites,
    } = body;

    // Validate required fields
    if (!companyId || !name || !code || !type || !examFee || !passingScore) {
      return NextResponse.json(
        { error: 'Missing required fields: company, name, code, type, examFee, passingScore' },
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

    // Check for duplicate certification code
    const existingCert = await Certification.findOne({ code });
    if (existingCert) {
      return NextResponse.json(
        { error: 'Certification code already exists', code },
        { status: 409 }
      );
    }

    // Validate passing score
    if (passingScore < 50 || passingScore > 95) {
      return NextResponse.json(
        { error: 'Passing score must be between 50 and 95' },
        { status: 400 }
      );
    }

    // Create certification document
    const certification = await Certification.create({
      company: new Types.ObjectId(companyId),
      name,
      code,
      type,
      active: true,
      launchedAt: new Date(),
      examFee,
      passingScore,
      examDuration: examDuration || 120, // Default 2 hours
      validityPeriod: validityPeriod || 3, // Default 3 years
      renewalRequired: renewalRequired !== undefined ? renewalRequired : true,
      skills: skills || [],
      prerequisites: prerequisites || [],
      totalEnrolled: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      totalRevenue: 0,
      employerRecognition: 50, // Default 50% employer recognition
      marketDemand: 60, // Default 60% market demand
      profitMargin: 85, // 85% margin (low marginal cost)
    });

    return NextResponse.json({
      certification,
      examStructure: {
        fee: certification.examFee,
        retakeFee: certification.retakeFee,
        renewalFee: certification.renewalFee,
        passingScore: certification.passingScore,
        validityYears: certification.validityPeriod,
      },
      revenueProjections: {
        perCertified: certification.revenuePerCertified,
        renewalRevenue: certification.renewalRevenue,
        retakeRevenue: certification.retakeRevenue,
      },
      message: `Certification program created successfully. Name: ${name}, Code: ${code}, Exam fee: $${examFee}`,
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/edtech/certifications
 * 
 * List certification programs with filtering and aggregated metrics
 * 
 * Query Parameters:
 * - company: string (required) - Company ID to filter certifications
 * - type?: string - Filter by certification type
 * - active?: boolean - Filter active/inactive certifications
 * - code?: string - Filter by certification code
 * 
 * Response:
 * {
 *   certifications: ICertification[];
 *   company: {
 *     name: string;
 *     level: number;
 *   };
 *   aggregatedMetrics: {
 *     totalCertifications: number;
 *     totalEnrolled: number;
 *     avgPassRate: number;
 *     totalRevenue: number;
 *     avgMarketDemand: number;
 *   };
 *   typeBreakdown: Array<{
 *     type: string;
 *     count: number;
 *     enrolled: number;
 *     passRate: number;
 *   }>;
 *   recommendations: string[];
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
    const typeFilter = searchParams.get('type');
    const activeFilter = searchParams.get('active');
    const codeFilter = searchParams.get('code');

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
    if (typeFilter) filter.type = typeFilter;
    if (activeFilter !== null) filter.active = activeFilter === 'true';
    if (codeFilter) filter.code = codeFilter;

    // Fetch certifications
    const certifications = await Certification.find(filter).sort({ totalRevenue: -1, marketDemand: -1 });

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalCertifications: certifications.length,
      totalEnrolled: certifications.reduce((sum, c) => sum + c.totalEnrolled, 0),
      avgPassRate: 0,
      totalRevenue: certifications.reduce((sum, c) => sum + c.totalRevenue, 0),
      avgMarketDemand: 0,
    };

    // Calculate weighted average pass rate
    if (aggregatedMetrics.totalEnrolled > 0) {
      const weightedPassSum = certifications.reduce(
        (sum, c) => sum + c.passRate * c.totalEnrolled,
        0
      );
      aggregatedMetrics.avgPassRate =
        Math.round((weightedPassSum / aggregatedMetrics.totalEnrolled) * 100) / 100;
    }

    // Calculate average market demand
    if (certifications.length > 0) {
      const totalDemand = certifications.reduce((sum, c) => sum + c.marketDemand, 0);
      aggregatedMetrics.avgMarketDemand = Math.round((totalDemand / certifications.length) * 100) / 100;
    }

    // Generate type breakdown
    const typeBreakdown = certifications.reduce((acc: any[], cert) => {
      const existing = acc.find((item) => item.type === cert.type);
      if (existing) {
        existing.count += 1;
        existing.enrolled += cert.totalEnrolled;
        existing.passRateSum += cert.passRate;
      } else {
        acc.push({
          type: cert.type,
          count: 1,
          enrolled: cert.totalEnrolled,
          passRateSum: cert.passRate,
        });
      }
      return acc;
    }, []);

    // Calculate average pass rate per type
    typeBreakdown.forEach((item) => {
      item.passRate = Math.round((item.passRateSum / item.count) * 100) / 100;
      delete item.passRateSum;
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (certifications.length === 0) {
      recommendations.push('No certifications created yet. Launch Professional, Technical, or Vendor certifications.');
    } else {
      // Check pass rate
      if (aggregatedMetrics.avgPassRate < 50) {
        recommendations.push(
          `Low pass rate at ${aggregatedMetrics.avgPassRate.toFixed(0)}%. Exam may be too difficult. Consider adjusting difficulty or offering prep materials.`
        );
      } else if (aggregatedMetrics.avgPassRate > 85) {
        recommendations.push(
          `Very high pass rate at ${aggregatedMetrics.avgPassRate.toFixed(0)}%. Exam may be too easy. Increase difficulty to maintain credential value.`
        );
      } else if (aggregatedMetrics.avgPassRate >= 65 && aggregatedMetrics.avgPassRate <= 75) {
        recommendations.push(
          `Ideal pass rate at ${aggregatedMetrics.avgPassRate.toFixed(0)}%. Well-balanced exam difficulty.`
        );
      }

      // Check market demand
      if (aggregatedMetrics.avgMarketDemand < 40) {
        recommendations.push(
          `Low market demand at ${aggregatedMetrics.avgMarketDemand.toFixed(0)}%. Focus on marketing or align certifications with industry trends.`
        );
      } else if (aggregatedMetrics.avgMarketDemand > 75) {
        recommendations.push(
          `High market demand at ${aggregatedMetrics.avgMarketDemand.toFixed(0)}%. Strong positioning. Consider premium pricing or expanded offerings.`
        );
      }

      // Check revenue
      if (aggregatedMetrics.totalRevenue > 500000) {
        recommendations.push(
          `Strong certification revenue at $${aggregatedMetrics.totalRevenue.toLocaleString()}. Consider corporate partnerships and bulk licensing.`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Certification programs performing well. Monitor pass rates and market demand.');
    }

    return NextResponse.json({
      certifications,
      company: {
        name: company.name,
        level: company.level,
      },
      aggregatedMetrics,
      typeBreakdown,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
