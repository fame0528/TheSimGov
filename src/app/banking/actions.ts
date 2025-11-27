/**
 * @fileoverview Banking Server Actions
 * @module app/banking/actions
 *
 * OVERVIEW:
 * Server actions for banking API operations.
 * Handles all server-side API calls for banking functionality.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use server';

import { auth } from '@/auth';
import type {
  LoanApplicationFormData,
  LoanPaymentData,
  InvestmentPurchaseData,
  PlayerBankCreationData
} from '@/lib/types/models';

/**
 * Submit loan application
 */
export async function handleLoanApplication(data: LoanApplicationFormData) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Process loan payment
 */
export async function handlePayment(data: LoanPaymentData) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Toggle auto-pay for loan
 */
export async function handleAutoPayToggle(loanId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/loans/auto-pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loanId,
      companyId: session.user.companyId,
      enabled,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Purchase investment
 */
export async function handleInvestmentPurchase(data: InvestmentPurchaseData) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/investments/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Rebalance investment portfolio
 */
export async function handleRebalancePortfolio(targetAllocations: Record<string, number>) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/investments/rebalance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetAllocations,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Create player-owned bank
 */
export async function handleBankCreate(data: PlayerBankCreationData) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/player/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Create investment portfolio
 */
export async function handlePortfolioCreate(data: any) {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/investments/portfolios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      companyId: session.user.companyId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

/**
 * Refresh credit score
 */
export async function handleCreditRefresh() {
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/credit-score?companyId=${session.user.companyId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}