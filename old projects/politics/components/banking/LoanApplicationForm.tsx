/**
 * @file components/banking/LoanApplicationForm.tsx
 * @description Loan application form component with collateral and rate calculations
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Multi-step form for applying for business loans. Displays real-time credit score,
 * recommended rates, and required collateral. Supports 5 loan types with dynamic
 * validation and approval probability calculation.
 * 
 * FEATURES:
 * - Real-time credit score display
 * - Dynamic interest rate calculation
 * - Collateral requirements based on credit score
 * - Approval probability estimation
 * - Monthly payment calculation
 * - Loan type selection with descriptions
 * 
 * USAGE:
 * ```tsx
 * import LoanApplicationForm from '@/components/banking/LoanApplicationForm';
 * 
 * <LoanApplicationForm companyId={companyId} onSuccess={handleSuccess} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import type { LoanType, CollateralType } from '@/lib/db/models/Loan';
import { calculateMonthlyPayment } from '@/lib/utils/finance/creditScore';

interface LoanApplicationFormProps {
  companyId: string;
  onSuccess?: () => void;
}

const LOAN_TYPES: { value: LoanType; label: string; description: string }[] = [
  {
    value: 'Term',
    label: 'Term Loan',
    description: 'Fixed monthly payments, general purpose, standard rates',
  },
  {
    value: 'LineOfCredit',
    label: 'Line of Credit',
    description: 'Revolving credit, pay interest on used amount only',
  },
  {
    value: 'Equipment',
    label: 'Equipment Financing',
    description: 'Lower rates, equipment serves as collateral',
  },
  {
    value: 'SBA',
    label: 'SBA Loan',
    description: 'Government-backed, lowest rates, longer approval',
  },
  {
    value: 'Bridge',
    label: 'Bridge Loan',
    description: 'Short-term, higher rates, fast approval',
  },
];

const COLLATERAL_TYPES: { value: CollateralType; label: string }[] = [
  { value: 'None', label: 'None (Unsecured)' },
  { value: 'Equipment', label: 'Equipment/Machinery' },
  { value: 'RealEstate', label: 'Real Estate/Property' },
  { value: 'Inventory', label: 'Inventory/Stock' },
  { value: 'AR', label: 'Accounts Receivable' },
];

export default function LoanApplicationForm({ companyId, onSuccess }: LoanApplicationFormProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [creditRating, setCreditRating] = useState<string>('');
  const [loadingCredit, setLoadingCredit] = useState(true);

  const [formData, setFormData] = useState({
    loanType: 'Term' as LoanType,
    amount: '',
    termMonths: '',
    collateralType: 'None' as CollateralType,
    collateralValue: '',
    collateralDescription: '',
  });

  const [estimatedRate, setEstimatedRate] = useState<number | null>(null);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [approvalProbability, setApprovalProbability] = useState<number | null>(null);

  // Fetch credit score on mount
  useEffect(() => {
    const fetchCreditScore = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/credit-score`);
        if (res.ok) {
          const data = await res.json();
          setCreditScore(data.score);
          setCreditRating(data.rating);
        }
      } catch (error) {
        console.error('Error fetching credit score:', error);
      } finally {
        setLoadingCredit(false);
      }
    };

    fetchCreditScore();
  }, [companyId]);

  // Calculate estimates when inputs change
  useEffect(() => {
    const amount = parseFloat(formData.amount);
    const term = parseInt(formData.termMonths);

    if (amount > 0 && term > 0 && creditScore) {
      // Fetch interest rate estimate
      fetch('/api/banking/estimate-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditScore,
          loanType: formData.loanType,
          amount,
          termMonths: term,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setEstimatedRate(data.adjustedRate);
          setApprovalProbability(data.approvalProbability);

          // Calculate monthly payment
          const payment = calculateMonthlyPayment(amount, data.adjustedRate, term);
          setMonthlyPayment(payment);
        })
        .catch((error) => {
          console.error('Error estimating rate:', error);
        });
    } else {
      setEstimatedRate(null);
      setMonthlyPayment(null);
      setApprovalProbability(null);
    }
  }, [formData.amount, formData.termMonths, formData.loanType, creditScore]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/banking/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          ...formData,
          amount: parseFloat(formData.amount),
          termMonths: parseInt(formData.termMonths),
          collateralValue: parseFloat(formData.collateralValue) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Loan application submitted!',
          description: data.message || 'Your application is under review.',
          status: 'success',
          duration: 5000,
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Application failed',
          description: data.message || 'Unable to submit application.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit loan application.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCredit) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading credit score...</Text>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Credit Score Display */}
        <Alert status={creditScore && creditScore >= 670 ? 'success' : 'warning'}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">
              Credit Score: {creditScore} ({creditRating})
            </Text>
            <Text fontSize="sm">
              {creditScore && creditScore >= 670
                ? 'Good credit! Eligible for competitive rates.'
                : 'Fair/Poor credit. Higher rates or collateral may be required.'}
            </Text>
          </Box>
        </Alert>

        {/* Loan Type */}
        <FormControl isRequired>
          <FormLabel>Loan Type</FormLabel>
          <Select value={formData.loanType} onChange={(e) => handleChange('loanType', e.target.value)}>
            {LOAN_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Amount */}
        <FormControl isRequired>
          <FormLabel>Loan Amount ($)</FormLabel>
          <Input
            type="number"
            min={1000}
            max={10000000}
            step={1000}
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="250000"
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            Min: $1,000 | Max: $10,000,000
          </Text>
        </FormControl>

        {/* Term */}
        <FormControl isRequired>
          <FormLabel>Loan Term (months)</FormLabel>
          <Input
            type="number"
            min={12}
            max={360}
            step={12}
            value={formData.termMonths}
            onChange={(e) => handleChange('termMonths', e.target.value)}
            placeholder="60"
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            Min: 12 months (1 year) | Max: 360 months (30 years)
          </Text>
        </FormControl>

        {/* Collateral Type */}
        <FormControl>
          <FormLabel>Collateral Type</FormLabel>
          <Select
            value={formData.collateralType}
            onChange={(e) => handleChange('collateralType', e.target.value)}
          >
            {COLLATERAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Collateral Value (if applicable) */}
        {formData.collateralType !== 'None' && (
          <>
            <FormControl isRequired>
              <FormLabel>Collateral Value ($)</FormLabel>
              <Input
                type="number"
                min={0}
                step={1000}
                value={formData.collateralValue}
                onChange={(e) => handleChange('collateralValue', e.target.value)}
                placeholder="300000"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Collateral Description</FormLabel>
              <Input
                type="text"
                maxLength={500}
                value={formData.collateralDescription}
                onChange={(e) => handleChange('collateralDescription', e.target.value)}
                placeholder="2 excavators, 1 crane, office building..."
              />
            </FormControl>
          </>
        )}

        {/* Estimates Display */}
        {estimatedRate && monthlyPayment && approvalProbability !== null && (
          <Box p={4} bg="blue.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>
              Loan Estimate
            </Text>
            <HStack spacing={4} wrap="wrap">
              <Stat size="sm">
                <StatLabel>Est. Interest Rate</StatLabel>
                <StatNumber>{estimatedRate.toFixed(2)}%</StatNumber>
                <StatHelpText>Annual</StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel>Monthly Payment</StatLabel>
                <StatNumber>${monthlyPayment.toLocaleString()}</StatNumber>
                <StatHelpText>
                  {parseInt(formData.termMonths)} payments
                </StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel>Approval Probability</StatLabel>
                <StatNumber>{approvalProbability}%</StatNumber>
                <StatHelpText>
                  {approvalProbability >= 75 ? 'Excellent' : approvalProbability >= 50 ? 'Good' : 'Fair'}
                </StatHelpText>
              </Stat>
            </HStack>
          </Box>
        )}

        {/* Submit Button */}
        <Button type="submit" colorScheme="blue" size="lg" isLoading={loading}>
          Submit Loan Application
        </Button>
      </VStack>
    </Box>
  );
}
