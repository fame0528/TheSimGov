/**
 * @file components/banking/LoanDashboard.tsx
 * @description Comprehensive loan management dashboard with payment tracking
 * @created 2025-11-15
 * 
 * OVERVIEW:
 * Dashboard for viewing and managing all company loans. Displays active loans,
 * payment schedules, foreclosure warnings, and payment history. Supports manual
 * payments and auto-pay configuration.
 * 
 * FEATURES:
 * - Active loans list with status indicators
 * - Payment schedule with upcoming due dates
 * - Foreclosure risk warnings
 * - Manual payment processing
 * - Auto-pay toggle
 * - Payment history timeline
 * - Loan performance metrics
 * 
 * USAGE:
 * ```tsx
 * import LoanDashboard from '@/components/banking/LoanDashboard';
 * 
 * <LoanDashboard companyId={companyId} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Divider,
} from '@chakra-ui/react';
import type { ILoan } from '@/lib/db/models/Loan';

interface LoanDashboardProps {
  companyId: string;
}

interface LoanWithPayments extends ILoan {
  nextPaymentAmount: number;
  remainingPayments: number;
}

interface ForeclosureWarning {
  loanId: string;
  loanType: string;
  riskLevel: string;
  message: string;
}

export default function LoanDashboard({ companyId }: LoanDashboardProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<LoanWithPayments[]>([]);
  const [foreclosureWarnings, setForeclosureWarnings] = useState<ForeclosureWarning[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithPayments | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/banking/payments?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
        setForeclosureWarnings(data.foreclosureWarnings || []);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load loans.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [companyId]);

  const handleMakePayment = async () => {
    if (!selectedLoan || !paymentAmount) return;

    setProcessingPayment(true);
    try {
      const res = await fetch('/api/banking/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan._id,
          amount: parseFloat(paymentAmount),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Payment successful!',
          description: data.message || 'Payment processed.',
          status: 'success',
          duration: 5000,
        });
        setShowPaymentModal(false);
        setPaymentAmount('');
        setSelectedLoan(null);
        fetchLoans();
      } else {
        toast({
          title: 'Payment failed',
          description: data.message || 'Unable to process payment.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleToggleAutoPay = async (loanId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/banking/loans/auto-pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, enabled }),
      });

      if (res.ok) {
        toast({
          title: enabled ? 'Auto-pay enabled' : 'Auto-pay disabled',
          status: 'success',
          duration: 3000,
        });
        fetchLoans();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update auto-pay setting.',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update auto-pay setting.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Pending':
        return 'yellow';
      case 'Defaulted':
        return 'red';
      case 'PaidOff':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getDelinquencyColor = (days: number) => {
    if (days === 0) return 'green';
    if (days < 30) return 'yellow';
    if (days < 90) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading loans...</Text>
      </Box>
    );
  }

  const activeLoans = loans.filter((l) => l.status === 'Active');
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.balance, 0);
  const totalMonthlyPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const upcomingPayment = activeLoans.length > 0 ? activeLoans[0] : null;

  return (
    <VStack spacing={6} align="stretch">
      {/* Foreclosure Warnings */}
      {foreclosureWarnings.length > 0 && (
        <VStack spacing={3} align="stretch">
          {foreclosureWarnings.map((warning, idx) => (
            <Alert key={idx} status="error" variant="left-accent">
              <AlertIcon />
              <Box>
                <AlertTitle>{warning.riskLevel} Risk - {warning.loanType} Loan</AlertTitle>
                <AlertDescription>{warning.message}</AlertDescription>
              </Box>
            </Alert>
          ))}
        </VStack>
      )}

      {/* Summary Stats */}
      <StatGroup>
        <Stat>
          <StatLabel>Active Loans</StatLabel>
          <StatNumber>{activeLoans.length}</StatNumber>
          <StatHelpText>{loans.length} total loans</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Total Debt</StatLabel>
          <StatNumber>${totalDebt.toLocaleString()}</StatNumber>
          <StatHelpText>Outstanding balance</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Monthly Payments</StatLabel>
          <StatNumber>${totalMonthlyPayments.toLocaleString()}</StatNumber>
          <StatHelpText>Combined monthly</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Next Payment Due</StatLabel>
          <StatNumber>
            {upcomingPayment
              ? new Date(upcomingPayment.nextPaymentDate).toLocaleDateString()
              : 'N/A'}
          </StatNumber>
          <StatHelpText>
            {upcomingPayment ? `$${upcomingPayment.nextPaymentAmount.toLocaleString()}` : 'No active loans'}
          </StatHelpText>
        </Stat>
      </StatGroup>

      <Divider />

      {/* Active Loans Table */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Active Loans
        </Text>
        {activeLoans.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No active loans. Apply for a loan to get started!
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Loan Type</Th>
                  <Th>Lender</Th>
                  <Th isNumeric>Balance</Th>
                  <Th isNumeric>Rate</Th>
                  <Th isNumeric>Monthly Payment</Th>
                  <Th>Next Due</Th>
                  <Th>Status</Th>
                  <Th>Auto-Pay</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activeLoans.map((loan) => (
                  <Tr key={String(loan._id)}>
                    <Td>{loan.loanType}</Td>
                    <Td>{loan.lender}</Td>
                    <Td isNumeric>${loan.balance.toLocaleString()}</Td>
                    <Td isNumeric>{loan.interestRate.toFixed(2)}%</Td>
                    <Td isNumeric>${loan.monthlyPayment.toLocaleString()}</Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </Text>
                      {loan.delinquencyStatus > 0 && (
                        <Badge colorScheme={getDelinquencyColor(loan.delinquencyStatus)} fontSize="xs">
                          {loan.delinquencyStatus}d late
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(loan.status)}>{loan.status}</Badge>
                    </Td>
                    <Td>
                      <Switch
                        isChecked={loan.autoPayEnabled}
                        onChange={(e) => handleToggleAutoPay(String(loan._id), e.target.checked)}
                        colorScheme="green"
                      />
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setPaymentAmount(loan.nextPaymentAmount.toString());
                          setShowPaymentModal(true);
                        }}
                      >
                        Pay
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Payment History */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Recent Payments
        </Text>
        {activeLoans.map((loan) => (
          <Box key={String(loan._id)} mb={4} p={4} bg="gray.50" borderRadius="md">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">{loan.loanType} Loan - {loan.lender}</Text>
              <Text fontSize="sm" color="gray.600">
                {loan.paymentsMade} of {loan.termMonths} payments made
              </Text>
            </HStack>
            <HStack spacing={4}>
              <Stat size="sm">
                <StatLabel>On-Time Streak</StatLabel>
                <StatNumber>{loan.onTimePaymentStreak}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel>Remaining</StatLabel>
                <StatNumber>{loan.remainingPayments} payments</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel>Interest Paid</StatLabel>
                <StatNumber>${loan.totalInterestPaid.toLocaleString()}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel>Principal Paid</StatLabel>
                <StatNumber>${loan.totalPrincipalPaid.toLocaleString()}</StatNumber>
              </Stat>
            </HStack>
          </Box>
        ))}
      </Box>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Make Loan Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedLoan && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">{selectedLoan.loanType} Loan</Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedLoan.lender}
                  </Text>
                </Box>

                <StatGroup>
                  <Stat size="sm">
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber>${selectedLoan.balance.toLocaleString()}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Next Payment</StatLabel>
                    <StatNumber>${selectedLoan.nextPaymentAmount.toLocaleString()}</StatNumber>
                  </Stat>
                </StatGroup>

                <FormControl>
                  <FormLabel>Payment Amount ($)</FormLabel>
                  <Input
                    type="number"
                    min={selectedLoan.monthlyPayment}
                    max={selectedLoan.balance}
                    step={0.01}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={selectedLoan.nextPaymentAmount.toString()}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Min: ${selectedLoan.monthlyPayment.toLocaleString()} | Max: $
                    {selectedLoan.balance.toLocaleString()} (full balance)
                  </Text>
                </FormControl>

                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    onClick={handleMakePayment}
                    isLoading={processingPayment}
                    flex={1}
                  >
                    Process Payment
                  </Button>
                  <Button onClick={() => setShowPaymentModal(false)} flex={1}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
