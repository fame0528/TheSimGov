/**
 * @file src/app/api/politics/donate/route.ts
 * @description Campaign donation API endpoint
 * @created 2025-11-24
 *
 * OVERVIEW:
 * POST endpoint for companies to donate to political campaigns.
 * Level 2+ companies can donate (with increasing caps).
 * Donations grant influence points for lobbying and government contracts.
 *
 * ENDPOINTS:
 * POST /api/politics/donate - Make campaign donation
 *
 * REQUEST BODY:
 * {
 *   companyId: string,
 *   candidateName: string,
 *   officeType: 'President' | 'Senate' | 'House' | 'Governor' | 'Mayor',
 *   amount: number,
 *   electionYear: number
 * }
 *
 * RESPONSE:
 * {
 *   success: true,
 *   donation: IPoliticalContribution,
 *   influenceGained: number,
 *   totalInfluence: number,
 *   newCash: number
 * }
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Company from '@/lib/db/models/Company';
import PoliticalContribution from '@/lib/db/models/PoliticalContribution';
import { CompanyLevel } from '@/lib/types/game';
import {
  canDonate,
  getMaxDonation,
  calculateInfluencePoints,
} from '@/lib/utils/politicalinfluence';

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { companyId, candidateName, officeType, amount, electionYear } = body;

    // Validate required fields
    if (!companyId || !candidateName || !officeType || !amount || !electionYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum donation is $100' },
        { status: 400 }
      );
    }

    // Get company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check donation eligibility
    if (!canDonate(company.level as CompanyLevel)) {
      return NextResponse.json(
        { error: 'Company level too low. Level 2+ required to donate.' },
        { status: 403 }
      );
    }

    // Check donation cap
    const maxDonation = getMaxDonation(company.level as CompanyLevel);
    if (amount > maxDonation) {
      return NextResponse.json(
        { error: `Maximum donation for Level ${company.level} is $${maxDonation.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Check cash availability
    if (company.cash < amount) {
      return NextResponse.json(
        { error: 'Insufficient cash for donation' },
        { status: 400 }
      );
    }

    // Calculate influence points gained
    const influenceGained = calculateInfluencePoints(amount, company.level as CompanyLevel);

    // Create donation record
    const donation = await PoliticalContribution.create({
      company: companyId,
      candidateName,
      officeType,
      amount,
      influencePoints: influenceGained,
      donatedAt: new Date(),
      electionYear,
    });

    // Update company cash and expenses
    await company.updateOne({
      $inc: {
        cash: -amount,
        expenses: amount,
      },
    });

    // Calculate total influence (sum of all influence points from donations)
    const allDonations = await PoliticalContribution.find({ company: companyId });
    const totalInfluence = allDonations.reduce((sum, d) => sum + d.influencePoints, 0);

    return NextResponse.json({
      success: true,
      donation: {
        id: donation._id,
        candidateName: donation.candidateName,
        officeType: donation.officeType,
        amount: donation.amount,
        influencePoints: donation.influencePoints,
        donatedAt: donation.donatedAt,
      },
      influenceGained,
      totalInfluence,
      newCash: company.cash - amount,
    });
  } catch (error) {
    console.error('Donation error:', error);
    return NextResponse.json(
      { error: 'Failed to process donation' },
      { status: 500 }
    );
  }
}