/**
 * @fileoverview Loan Application Form Component
 * @module components/banking/LoanApplicationForm
 *
 * OVERVIEW:
 * Interactive form for loan applications with real-time credit scoring.
 * Integrates with banking APIs for application submission and approval.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/react';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Alert } from '@heroui/alert';
import type { LoanApplicationFormData, CreditScoreResponse, Bank } from '@/lib/types/models';
import { LoanType } from '@/lib/types/enums';

interface LoanApplicationFormProps {
  companyId: string;
  availableCash: number;
  creditScore: number;
  onApplicationSubmit: (application: LoanApplicationFormData) => Promise<void>;
  onCancel: () => void;
}

const LOAN_TYPES: Array<{ key: LoanType; label: string; description: string }> = [
  {
    key: LoanType.BUSINESS_LOAN,
    label: 'Business Loan',
    description: 'General purpose business financing'
  },
  {
    key: LoanType.LINE_OF_CREDIT,
    label: 'Line of Credit',
    description: 'Flexible revolving credit line'
  },
  {
    key: LoanType.EQUIPMENT_FINANCING,
    label: 'Equipment Financing',
    description: 'Financing for machinery and equipment'
  },
  {
    key: LoanType.VENTURE_CAPITAL,
    label: 'Venture Capital',
    description: 'High-risk, high-reward investment funding'
  }
];

const TERM_OPTIONS = [
  { key: '12', label: '12 months' },
  { key: '24', label: '24 months' },
  { key: '36', label: '36 months' },
  { key: '60', label: '60 months' }
];

export default function LoanApplicationForm({
  companyId,
  availableCash,
  creditScore,
  onApplicationSubmit,
  onCancel,
}: LoanApplicationFormProps) {
  // Form state
  const [formData, setFormData] = useState<LoanApplicationFormData>({
    amount: 0,
    type: LoanType.BUSINESS_LOAN,
    termMonths: 12,
    purpose: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditScoreData, setCreditScoreData] = useState<CreditScoreResponse | null>(null);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [isLoadingCredit, setIsLoadingCredit] = useState(false);

  // Load available banks
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await fetch('/api/banking/banks');
        if (response.ok) {
          const banks = await response.json();
          setAvailableBanks(banks);
        }
      } catch (err) {
        console.error('Failed to load banks:', err);
      }
    };

    loadBanks();
  }, []);

  // Load credit score when component mounts
  useEffect(() => {
    const loadCreditScore = async () => {
      setIsLoadingCredit(true);
      try {
        const response = await fetch(`/api/banking/credit-score?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setCreditScoreData(data);
        }
      } catch (err) {
        console.error('Failed to load credit score:', err);
      } finally {
        setIsLoadingCredit(false);
      }
    };

    loadCreditScore();
  }, [companyId]);

  // Calculate estimated monthly payment
  const calculateMonthlyPayment = (principal: number, annualRate: number, months: number): number => {
    if (annualRate === 0) return principal / months;
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  // Get interest rate based on credit score and loan type
  const getInterestRate = (score: number, type: LoanType): number => {
    const baseRates: Record<LoanType, number> = {
      'BUSINESS_LOAN': 8.5,
      'LINE_OF_CREDIT': 12.0,
      'EQUIPMENT_FINANCING': 6.5,
      'VENTURE_CAPITAL': 15.0
    };

    const baseRate = baseRates[type];
    const scoreAdjustment = score >= 750 ? -1.5 : score >= 650 ? -0.5 : score >= 550 ? 0.5 : 2.0;
    return Math.max(3.0, baseRate + scoreAdjustment);
  };

  const estimatedMonthlyPayment = formData.amount > 0 ?
    calculateMonthlyPayment(
      formData.amount,
      getInterestRate(creditScore, formData.type),
      formData.termMonths
    ) : 0;

  const totalRepayment = estimatedMonthlyPayment * formData.termMonths;

  // Form validation
  const isFormValid = formData.amount > 0 &&
                     formData.amount <= availableCash * 2 && // Max 2x available cash
                     formData.purpose.trim().length >= 10 &&
                     formData.purpose.trim().length <= 500;

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onApplicationSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit loan application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <h2 className="text-2xl font-bold">Loan Application</h2>
        <p className="text-gray-600">Apply for financing to grow your business</p>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Credit Score Display */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Your Credit Profile</h3>
          {isLoadingCredit ? (
            <div className="animate-pulse">Loading credit score...</div>
          ) : creditScoreData ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-blue-600">
                  {creditScoreData.score}
                </div>
                <Chip color="primary" variant="flat">
                  {creditScoreData.rating}
                </Chip>
              </div>
              <div className="text-sm text-gray-600">
                Based on your company's financial history and payment performance
              </div>
            </div>
          ) : (
            <div className="text-red-600">Unable to load credit score</div>
          )}
        </div>

        {/* Loan Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Loan Amount"
            type="number"
            value={formData.amount.toString()}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              amount: parseFloat(e.target.value) || 0
            }))}
            startContent="$"
            min="1000"
            max={availableCash * 2}
            description={`Available cash: $${availableCash.toLocaleString()}`}
          />

          <Select
            label="Loan Type"
            selectedKeys={[formData.type]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as LoanType;
              setFormData(prev => ({ ...prev, type: selected }));
            }}
          >
            {LOAN_TYPES.map((type) => (
              <SelectItem key={type.key} textValue={type.label}>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Term Length"
            selectedKeys={[formData.termMonths.toString()]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFormData(prev => ({
                ...prev,
                termMonths: parseInt(selected)
              }));
            }}
          >
            {TERM_OPTIONS.map((term) => (
              <SelectItem key={term.key} textValue={term.label}>
                {term.label}
              </SelectItem>
            ))}
          </Select>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Monthly Payment</label>
            <div className="text-xl font-bold text-green-600">
              ${estimatedMonthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">
              Total repayment: ${totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <Textarea
          label="Loan Purpose"
          placeholder="Describe how you will use these funds to grow your business..."
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          minRows={3}
          maxRows={6}
          description="10-500 characters required"
        />

        {/* Bank Selection */}
        {availableBanks.length > 0 && (
          <Select
            label="Preferred Bank"
            placeholder="Select a bank (optional)"
            selectedKeys={formData.bankId ? [formData.bankId] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFormData(prev => ({ ...prev, bankId: selected || undefined }));
            }}
          >
            {availableBanks.map((bank) => (
              <SelectItem key={bank.id} textValue={bank.name}>
                <div>
                  <div className="font-medium">{bank.name}</div>
                  <div className="text-sm text-gray-500">
                    Rate: {bank.baseInterestRate}%, Max: ${bank.maxLoanAmount.toLocaleString()}
                  </div>
                </div>
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Error Display */}
        {error && (
          <Alert color="danger" title="Application Error">
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            color="primary"
            size="lg"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!isFormValid}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>

          <Button
            variant="bordered"
            size="lg"
            onPress={onCancel}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        {/* Validation Summary */}
        {!isFormValid && (
          <div className="text-sm text-gray-500 space-y-1">
            <div>• Amount must be between $1,000 and ${availableCash * 2}</div>
            <div>• Purpose description must be 10-500 characters</div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}