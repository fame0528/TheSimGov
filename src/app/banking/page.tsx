/**
 * @fileoverview Banking Page
 * @module app/banking/page
 *
 * OVERVIEW:
 * Main banking page that integrates all banking components
 * for a complete banking experience.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import { Company } from '@/lib/db/models';
import { Card, CardBody } from '@heroui/card';
import BankingPageClient from './BankingPageClient';
import {
  handleLoanApplication,
  handlePayment,
  handleAutoPayToggle,
  handleInvestmentPurchase,
  handleRebalancePortfolio,
  handleBankCreate,
  handlePortfolioCreate,
  handleCreditRefresh,
} from './actions';

async function getCompanyData(companyId: string) {
  await connectDB();

  const company = await Company.findById(companyId).lean();

  if (!company) {
    throw new Error('Company not found');
  }

  // Fetch loans separately since they're not directly on the company model
  const { Loan } = await import('@/lib/db/models');
  const loans = await Loan.find({ companyId }).lean();

  // Fetch credit score from API
  let creditScore = 550; // Default
  try {
    const creditResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/credit-score?companyId=${companyId}`, {
      method: 'GET',
    });
    if (creditResponse.ok) {
      const creditData = await creditResponse.json();
      creditScore = creditData.score || 550;
    }
  } catch (error) {
    console.warn('Could not fetch credit score');
  }

  // Fetch investment portfolio
  let investmentPortfolio = null;
  try {
    const portfolioResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/banking/investments/portfolio?companyId=${companyId}`, {
      method: 'GET',
    });
    if (portfolioResponse.ok) {
      investmentPortfolio = await portfolioResponse.json();
    }
  } catch (error) {
    console.warn('Could not fetch investment portfolio');
  }

  return {
    id: company._id.toString(),
    name: company.name,
    cash: company.cash || 0,
    creditScore,
    investmentPortfolio,
    loans: loans.map(loan => ({
      id: String(loan._id),
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      remainingBalance: loan.remainingBalance,
      status: loan.status,
      createdAt: loan.createdAt,
      lastPaymentDate: loan.lastPaymentDate,
      autoPayEnabled: loan.autoPayEnabled,
    })),
  };
}

// Server component wrapper
export default async function BankingPageWrapper() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody>
            <div className="text-center text-red-600">
              You must be logged in with a company to access banking services.
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const companyData = await getCompanyData(session.user.companyId);

  return (
    <BankingPageClient
      companyData={companyData}
      onLoanApplication={handleLoanApplication}
      onPayment={handlePayment}
      onAutoPayToggle={handleAutoPayToggle}
      onInvestmentPurchase={handleInvestmentPurchase}
      onRebalancePortfolio={handleRebalancePortfolio}
      onBankCreate={handleBankCreate}
      onPortfolioCreate={handlePortfolioCreate}
      onCreditRefresh={handleCreditRefresh}
    />
  );
}