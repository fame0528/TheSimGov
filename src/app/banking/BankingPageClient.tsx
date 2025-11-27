/**
 * @fileoverview Banking Page Client Component
 * @module app/banking/BankingPageClient
 *
 * OVERVIEW:
 * Client component for interactive banking functionality.
 * Handles state management and user interactions.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, Suspense } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Tabs, Tab } from '@heroui/tabs';
import { Spinner } from '@heroui/spinner';
import LoanApplicationForm from '@/components/banking/LoanApplicationForm';
import PaymentInterface from '@/components/banking/PaymentInterface';
import InvestmentDashboard from '@/components/banking/InvestmentDashboard';
import BankSelector from '@/components/banking/BankSelector';
import CreditScoreMonitor from '@/components/banking/CreditScoreMonitor';
import PlayerBankCreator from '@/components/banking/PlayerBankCreator';
import type {
  LoanApplicationFormData,
  LoanPaymentData,
  InvestmentPurchaseData,
  BankSelectionData,
  PlayerBankCreationData
} from '@/lib/types/models';

interface BankingPageClientProps {
  companyData: any;
  onLoanApplication: (data: LoanApplicationFormData) => Promise<any>;
  onPayment: (data: LoanPaymentData) => Promise<any>;
  onAutoPayToggle: (loanId: string, enabled: boolean) => Promise<any>;
  onInvestmentPurchase: (data: InvestmentPurchaseData) => Promise<any>;
  onRebalancePortfolio: (targetAllocations: Record<string, number>) => Promise<any>;
  onBankCreate: (data: PlayerBankCreationData) => Promise<any>;
  onPortfolioCreate: (data: any) => Promise<any>;
  onCreditRefresh: () => Promise<any>;
}

function BankingPageClient({
  companyData,
  onLoanApplication,
  onPayment,
  onAutoPayToggle,
  onInvestmentPurchase,
  onRebalancePortfolio,
  onBankCreate,
  onPortfolioCreate,
  onCreditRefresh,
}: BankingPageClientProps) {
  const [activeTab, setActiveTab] = useState('loans');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Banking Center</h1>
        <p className="text-gray-600">
          Manage loans, investments, and banking services for {companyData.name}
        </p>

        {/* Company Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${companyData.cash.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Available Cash</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {companyData.creditScore}
                </div>
                <div className="text-sm text-gray-600">Credit Score</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {companyData.loans.length}
                </div>
                <div className="text-sm text-gray-600">Active Loans</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Banking Services Tabs */}
      <Tabs
        aria-label="Banking services"
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="loans" title="Loan Services">
          <div className="space-y-6">
            <Suspense fallback={<Spinner />}>
              <LoanApplicationForm
                companyId={companyData.id}
                availableCash={companyData.cash}
                creditScore={companyData.creditScore}
                onApplicationSubmit={onLoanApplication}
                onCancel={() => setActiveTab('overview')}
              />
            </Suspense>

            <Suspense fallback={<Spinner />}>
              <PaymentInterface
                companyId={companyData.id}
                loans={companyData.loans}
                availableCash={companyData.cash}
                onPaymentSubmit={onPayment}
                onAutoPayToggle={onAutoPayToggle}
              />
            </Suspense>
          </div>
        </Tab>

        <Tab key="investments" title="Investments">
          <Suspense fallback={<Spinner />}>
            <InvestmentDashboard
              companyId={companyData.id}
              portfolio={companyData.investmentPortfolio}
              availableCash={companyData.cash}
              onPurchaseInvestment={onInvestmentPurchase}
              onRebalancePortfolio={onRebalancePortfolio}
            />
          </Suspense>
        </Tab>

        <Tab key="credit" title="Credit & Banking">
          <div className="space-y-6">
            <Suspense fallback={<Spinner />}>
              <CreditScoreMonitor
                companyId={companyData.id}
                onRefreshScore={onCreditRefresh}
              />
            </Suspense>

            <Suspense fallback={<Spinner />}>
              <BankSelector
                companyId={companyData.id}
                creditScore={companyData.creditScore}
                loanAmount={0} // Will be set when applying for loans
                loanType="BUSINESS_LOAN"
                onBankSelect={(selection) => {
                  // Handle bank selection for loan applications
                  console.log('Bank selected:', selection);
                }}
              />
            </Suspense>
          </div>
        </Tab>

        <Tab key="management" title="Bank Management">
          <Suspense fallback={<Spinner />}>
            <PlayerBankCreator
              companyId={companyData.id}
              availableCash={companyData.cash}
              onBankCreate={onBankCreate}
              onPortfolioCreate={onPortfolioCreate}
            />
          </Suspense>
        </Tab>
      </Tabs>
    </div>
  );
}

export default BankingPageClient;