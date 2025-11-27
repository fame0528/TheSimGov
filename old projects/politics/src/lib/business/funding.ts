/**
 * Business rules for funding validation.
 * Provides a pure function useful for unit testing server-side funding rules.
 */

export type FundingType = 'Loan' | 'Accelerator' | 'Angel';

export interface FundingRequest {
  type: FundingType;
  amount: number;
}

export interface FundingValidationInput {
  funding: FundingRequest | undefined;
  shortfall: number; // positive number required to cover shortfall
  userScore?: number | null;
  userMaxLoan?: number | null;
  loanMultiplier?: number; // defaults to 5
}

export interface FundingValidationResult {
  valid: boolean;
  error?: string;
  allowedCap?: number; // maximum allowed funding for Loan or other types
}

export function validateFunding(input: FundingValidationInput): FundingValidationResult {
  const { funding, shortfall, userMaxLoan = Infinity, loanMultiplier = 5 } = input;

  if (shortfall <= 0) return { valid: true, allowedCap: Infinity };

  if (!funding) return { valid: false, error: 'Funding required for Technology industry founding' };

  const requested = Number(funding.amount || 0);
  if (isNaN(requested) || requested <= 0) return { valid: false, error: 'Funding amount must be a positive number' };

  const allowedCap = Math.min(userMaxLoan ?? Infinity, shortfall * loanMultiplier);

  if (requested < shortfall) {
    return {
      valid: false,
      error: `Funding amount must cover startup shortfall ($${shortfall.toLocaleString()})`,
      allowedCap,
    };
  }

  if (requested > allowedCap) {
    return {
      valid: false,
      error: `Requested funding exceeds your allowable cap. Max allowed: $${allowedCap.toLocaleString()}`,
      allowedCap,
    };
  }

  // If Loan, additional validation could be added here for interest and term
  return { valid: true, allowedCap };
}
