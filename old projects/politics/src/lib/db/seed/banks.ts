/**
 * @file src/lib/db/seed/banks.ts
 * @description Seed 5 NPC banks with realistic lending criteria
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Seeds database with 5 NPC banks representing different banking tiers.
 * Each bank has realistic interest rates, credit requirements, and loan limits.
 * Follows Basel III capital ratio standards and risk tolerance models.
 * 
 * BANK TYPES:
 * 1. Community Credit Union - Small loans, lower credit requirements
 * 2. Regional Bank - Medium loans, moderate credit requirements
 * 3. National Bank - Large loans, higher credit requirements
 * 4. Investment Bank - Huge loans, excellent credit requirements
 * 5. Government Development Bank - Special programs, flexible requirements
 * 
 * USAGE:
 * ```typescript
 * import { seedBanks } from '@/lib/db/seed/banks';
 * 
 * // Seed all 5 banks
 * await seedBanks();
 * 
 * // Seed specific bank only
 * await seedBanks('CREDIT_UNION');
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Uses updateOne with upsert to prevent duplicates
 * - All monetary values stored in cents (USD)
 * - Interest rates stored as decimals (0.08 = 8%)
 * - Basel III capital ratio: 0.08-0.12 (8-12%)
 * - Can be run multiple times safely (idempotent)
 */

import dbConnect from '@/lib/db/mongodb';
import Bank, { BankType } from '@/lib/db/models/Bank';

/**
 * Bank seed data configuration
 * 
 * @description
 * Defines realistic NPC banks with varied lending criteria.
 * Interest rates reflect 2025 market conditions.
 * Loan limits scaled to game economy.
 */
const BANK_SEED_DATA = [
  {
    name: 'Community Credit Union',
    type: BankType.CREDIT_UNION,
    baseInterestRate: 0.08, // 8% annual rate
    creditScoreMin: 550,
    maxLoanAmount: 50000000, // $500,000 (stored in cents)
    loanTermsMonths: [12, 24, 36, 48, 60],
    collateralRequired: false,
    riskTolerance: 0.15, // 15% acceptable default rate
    capitalRatio: 0.12, // 12% Basel III capital ratio
    isNPC: true,
    isActive: true,
    activeLoans: 0,
    totalLent: 0,
    totalCollected: 0,
    defaultRate: 0.0,
    description:
      'Local community-focused lender offering competitive rates to small businesses with flexible approval criteria.',
  },
  {
    name: 'First Regional Bank',
    type: BankType.REGIONAL,
    baseInterestRate: 0.06, // 6% annual rate
    creditScoreMin: 600,
    maxLoanAmount: 500000000, // $5,000,000 (stored in cents)
    loanTermsMonths: [12, 24, 36, 48, 60, 84, 120],
    collateralRequired: false,
    riskTolerance: 0.10, // 10% acceptable default rate
    capitalRatio: 0.10, // 10% Basel III capital ratio
    isNPC: true,
    isActive: true,
    activeLoans: 0,
    totalLent: 0,
    totalCollected: 0,
    defaultRate: 0.0,
    description:
      'Established regional bank providing medium-sized business loans with competitive terms across multiple states.',
  },
  {
    name: 'United National Bank',
    type: BankType.NATIONAL,
    baseInterestRate: 0.05, // 5% annual rate
    creditScoreMin: 650,
    maxLoanAmount: 5000000000, // $50,000,000 (stored in cents)
    loanTermsMonths: [12, 24, 36, 48, 60, 84, 120, 180, 240],
    collateralRequired: false,
    riskTolerance: 0.05, // 5% acceptable default rate
    capitalRatio: 0.08, // 8% Basel III capital ratio
    isNPC: true,
    isActive: true,
    activeLoans: 0,
    totalLent: 0,
    totalCollected: 0,
    defaultRate: 0.0,
    description:
      'Nationwide commercial lender offering large-scale financing solutions with premium rates for qualified businesses.',
  },
  {
    name: 'Global Investment Bank',
    type: BankType.INVESTMENT,
    baseInterestRate: 0.04, // 4% annual rate
    creditScoreMin: 700,
    maxLoanAmount: 50000000000, // $500,000,000 (stored in cents)
    loanTermsMonths: [24, 36, 48, 60, 84, 120, 180, 240, 360],
    collateralRequired: true, // Large loans require collateral
    riskTolerance: 0.03, // 3% acceptable default rate
    capitalRatio: 0.08, // 8% Basel III capital ratio
    isNPC: true,
    isActive: true,
    activeLoans: 0,
    totalLent: 0,
    totalCollected: 0,
    defaultRate: 0.0,
    description:
      'Elite institutional lender providing massive corporate financing with exceptional rates for top-tier borrowers.',
  },
  {
    name: 'Federal Development Bank',
    type: BankType.GOVERNMENT,
    baseInterestRate: 0.03, // 3% annual rate (subsidized)
    creditScoreMin: 500, // Lower requirement for public benefit
    maxLoanAmount: 500000000, // $5,000,000 (stored in cents)
    loanTermsMonths: [12, 24, 36, 48, 60, 84, 120, 180],
    collateralRequired: false,
    riskTolerance: 0.20, // 20% acceptable default rate (government backed)
    capitalRatio: 0.15, // 15% higher capital ratio (conservative)
    isNPC: true,
    isActive: true,
    activeLoans: 0,
    totalLent: 0,
    totalCollected: 0,
    defaultRate: 0.0,
    description:
      'Government-backed development lender supporting economic growth with favorable terms and flexible requirements.',
  },
];

/**
 * Seed NPC banks to database
 * 
 * @param {BankType} [specificType] - Optional: seed only specific bank type
 * @returns {Promise<void>}
 * 
 * @description
 * Seeds 5 NPC banks with realistic lending criteria.
 * Uses upsert to prevent duplicates on repeated runs.
 * Safe to run multiple times (idempotent operation).
 * 
 * @example
 * ```typescript
 * // Seed all banks
 * await seedBanks();
 * 
 * // Seed only credit union
 * await seedBanks(BankType.CREDIT_UNION);
 * ```
 * 
 * @throws {Error} Database connection or insertion errors
 */
export async function seedBanks(specificType?: BankType): Promise<void> {
  try {
    console.log('[Seed] Starting NPC bank seeding...');

    // Connect to database
    await dbConnect();

    // Filter banks if specific type requested
    const banksToSeed = specificType
      ? BANK_SEED_DATA.filter((bank) => bank.type === specificType)
      : BANK_SEED_DATA;

    if (banksToSeed.length === 0) {
      console.log(`[Seed] No banks found for type: ${specificType}`);
      return;
    }

    // Seed each bank
    let createdCount = 0;
    let updatedCount = 0;

    for (const bankData of banksToSeed) {
      const result = await Bank.updateOne(
        { name: bankData.name, isNPC: true }, // Match by name and NPC status
        { $set: bankData }, // Update all fields
        { upsert: true } // Create if doesn't exist
      );

      if (result.upsertedCount > 0) {
        createdCount++;
        console.log(`[Seed] ✓ Created bank: ${bankData.name}`);
      } else if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`[Seed] ↻ Updated bank: ${bankData.name}`);
      } else {
        console.log(`[Seed] ═ Unchanged bank: ${bankData.name}`);
      }
    }

    console.log(
      `[Seed] NPC bank seeding complete: ${createdCount} created, ${updatedCount} updated`
    );
  } catch (error) {
    console.error('[Seed] Failed to seed NPC banks:', error);
    throw error;
  }
}

/**
 * Remove all NPC banks from database
 * 
 * @description
 * Deletes all NPC banks (isNPC: true).
 * Does NOT delete player-owned banks.
 * Useful for testing or resetting bank data.
 * 
 * @example
 * ```typescript
 * await removeBanks();
 * ```
 * 
 * @throws {Error} Database connection or deletion errors
 */
export async function removeBanks(): Promise<void> {
  try {
    console.log('[Seed] Removing NPC banks...');

    // Connect to database
    await dbConnect();

    // Delete only NPC banks
    const result = await Bank.deleteMany({ isNPC: true });

    console.log(`[Seed] Removed ${result.deletedCount} NPC banks`);
  } catch (error) {
    console.error('[Seed] Failed to remove NPC banks:', error);
    throw error;
  }
}

/**
 * Reset NPC banks
 * 
 * @description
 * Removes existing NPC banks and re-seeds fresh data.
 * Useful for testing or resetting to baseline.
 * 
 * @example
 * ```typescript
 * await resetBanks();
 * ```
 * 
 * @throws {Error} Database connection or operation errors
 */
export async function resetBanks(): Promise<void> {
  await removeBanks();
  await seedBanks();
}

// Export seed data for testing/reference
export { BANK_SEED_DATA };

/**
 * Run seeding if executed directly
 * 
 * @description
 * Allows running seed script via Node.js:
 * ```bash
 * node -r ts-node/register src/lib/db/seed/banks.ts
 * ```
 */
if (require.main === module) {
  seedBanks()
    .then(() => {
      console.log('[Seed] ✓ Bank seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] ✗ Bank seeding failed:', error);
      process.exit(1);
    });
}
