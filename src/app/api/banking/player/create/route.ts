/**
 * @fileoverview Player Bank Creation API Route
 * @description Allows players to create their own banking institutions
 * @version 1.0.0
 * @created 2025-11-23
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB, Bank, Company } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Validation schema for player bank creation
const playerBankSchema = z.object({
  name: z.string().min(3).max(50, 'Bank name must be 3-50 characters'),
  description: z.string().min(10).max(500, 'Description must be 10-500 characters'),
  initialCapital: z.number().min(1000000).max(100000000, 'Initial capital must be $1M-$100M'),
  riskTolerance: z.number().min(1).max(10, 'Risk tolerance must be 1-10'),
  specialization: z.enum(['Commercial', 'Investment', 'Retail', 'Universal']).default('Universal'),
  headquartersLocation: z.string().min(2, 'Headquarters location is required')
});

/**
 * POST /api/banking/player/create
 * Create a player-owned bank
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = playerBankSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 'VALIDATION_ERROR', 400, validationResult.error.issues);
    }

    const {
      name,
      description,
      initialCapital,
      riskTolerance,
      specialization,
      headquartersLocation
    } = validationResult.data;

    // Connect to database
    await connectDB();

    // Check if user already has a bank
    const existingBank = await Bank.findOne({
      ownerId: session.user.id,
      isPlayerOwned: true
    });

    if (existingBank) {
      return createErrorResponse('You already own a bank', 'ALREADY_EXISTS', 400);
    }

    // Check if bank name is unique
    const nameExists = await Bank.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (nameExists) {
      return createErrorResponse('Bank name already exists', 'NAME_CONFLICT', 400);
    }

    // Check if user has a company with enough capital to fund the bank
    const userCompanies = await Company.find({ userId: session.user.id });
    const totalCompanyCash = userCompanies.reduce((sum, company) => sum + company.cash, 0);

    if (totalCompanyCash < initialCapital) {
      return createErrorResponse('Insufficient funds across all companies', 'INSUFFICIENT_FUNDS', 400, {
        required: initialCapital,
        available: totalCompanyCash
      });
    }

    // Find the company with the most cash to fund the bank
    const fundingCompany = userCompanies.reduce((prev, current) =>
      (prev.cash > current.cash) ? prev : current
    );

    // Deduct capital from the funding company
    fundingCompany.cash -= initialCapital;
    await fundingCompany.save();

    // Create the player bank
    const playerBank = new Bank({
      name,
      description,
      personality: 'Player', // Special personality for player banks
      totalCapital: initialCapital,
      availableCapital: initialCapital,
      riskTolerance,
      specialization,
      headquartersLocation,
      isPlayerOwned: true,
      ownerId: session.user.id,
      minimumCreditScore: 600, // Player banks can be more lenient
      maximumLoanAmount: initialCapital * 0.1, // 10% of capital as max loan
      isActive: true,
      establishedDate: new Date(),
      reputation: 70 // Starting reputation for new player banks
    });

    await playerBank.save();

    return createSuccessResponse({
      bank: {
        id: playerBank._id,
        name: playerBank.name,
        description: playerBank.description,
        totalCapital: playerBank.totalCapital,
        availableCapital: playerBank.availableCapital,
        riskTolerance: playerBank.riskTolerance,
        specialization: playerBank.specialization,
        headquartersLocation: playerBank.headquartersLocation,
        isPlayerOwned: true,
        establishedDate: playerBank.establishedDate
      },
      funding: {
        companyId: fundingCompany._id,
        companyName: fundingCompany.name,
        amountDeducted: initialCapital,
        remainingCash: fundingCompany.cash
      },
      message: 'Player bank created successfully'
    });

  } catch (error) {
    console.error('Player bank creation error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}