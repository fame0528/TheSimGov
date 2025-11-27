/**
 * @fileoverview Loan Payment Interface Component
 * @module components/banking/PaymentInterface
 *
 * OVERVIEW:
 * Interface for making loan payments and setting up auto-pay.
 * Shows payment history, upcoming payments, and payment options.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Alert } from '@heroui/alert';
import { Badge } from '@heroui/badge';
import type { Loan, LoanPaymentData } from '@/lib/types/models';
import { LoanStatus } from '@/lib/types/enums';

interface PaymentInterfaceProps {
  companyId: string;
  loans: Loan[];
  availableCash: number;
  onPaymentSubmit: (payment: LoanPaymentData) => Promise<void>;
  onAutoPayToggle: (loanId: string, enabled: boolean) => Promise<void>;
}

interface PaymentHistory {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  type: 'scheduled' | 'early' | 'late';
}

export default function PaymentInterface({
  companyId,
  loans,
  availableCash,
  onPaymentSubmit,
  onAutoPayToggle,
}: PaymentInterfaceProps) {
  // State
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isAutoPayEnabled, setIsAutoPayEnabled] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  // Active loans (not paid off)
  const activeLoans = loans.filter(loan => loan.status !== 'PAID_OFF');

  // Selected loan details
  const selectedLoan = activeLoans.find(loan => loan.id === selectedLoanId);

  // Load auto-pay settings and payment history
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Load auto-pay settings
        const autoPayResponse = await fetch(`/api/banking/loans/auto-pay?companyId=${companyId}`);
        if (autoPayResponse.ok) {
          const autoPayData = await autoPayResponse.json();
          setIsAutoPayEnabled(autoPayData);
        }

        // Load payment history
        const historyResponse = await fetch(`/api/banking/payments/history?companyId=${companyId}`);
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          setPaymentHistory(history);
        }
      } catch (err) {
        console.error('Failed to load payment data:', err);
      }
    };

    if (companyId) {
      loadPaymentData();
    }
  }, [companyId]);

  // Update payment amount when loan changes
  useEffect(() => {
    if (selectedLoan) {
      // Default to minimum payment (interest + 10% of principal)
      const minPayment = selectedLoan.monthlyPayment;
      setPaymentAmount(minPayment);
    } else {
      setPaymentAmount(0);
    }
  }, [selectedLoan]);

  // Calculate next payment date
  const getNextPaymentDate = (loan: Loan): Date => {
    const lastPayment = loan.lastPaymentDate || loan.createdAt;
    return new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!selectedLoan || paymentAmount <= 0) return;
    if (paymentAmount > availableCash) {
      setError('Insufficient funds for this payment amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onPaymentSubmit({
        loanId: selectedLoan.id,
        amount: paymentAmount,
      });

      // Reset form
      setPaymentAmount(0);
      setSelectedLoanId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle auto-pay toggle
  const handleAutoPayToggle = async (loanId: string, enabled: boolean) => {
    try {
      await onAutoPayToggle(loanId, enabled);
      setIsAutoPayEnabled(prev => ({ ...prev, [loanId]: enabled }));
    } catch (err) {
      console.error('Failed to update auto-pay:', err);
    }
  };

  // Get status color for loans
  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case LoanStatus.DEFAULTED: return 'danger';
      case 'PAID_OFF': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Loans Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Loan Payments</h2>
          <p className="text-gray-600">Manage your loan payments and auto-pay settings</p>
        </CardHeader>

        <CardBody>
          {activeLoans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active loans to display
            </div>
          ) : (
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{loan.type.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">
                        Principal: ${loan.principal.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: ${(loan.principal - loan.amountPaid).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Chip color={getStatusColor(loan.status)} variant="flat">
                        {loan.status}
                      </Chip>
                      <p className="text-sm text-gray-600 mt-1">
                        Next: {getNextPaymentDate(loan).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Monthly Payment: </span>
                      ${loan.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>

                    <div className="flex items-center gap-4">
                      <Checkbox
                        isSelected={isAutoPayEnabled[loan.id] || false}
                        onValueChange={(enabled) => handleAutoPayToggle(loan.id, enabled)}
                        size="sm"
                      >
                        Auto-Pay
                      </Checkbox>

                      <Button
                        size="sm"
                        variant="bordered"
                        onPress={() => setSelectedLoanId(loan.id)}
                        isDisabled={selectedLoanId === loan.id}
                      >
                        Make Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Form */}
      {selectedLoan && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Make a Payment</h3>
            <p className="text-gray-600">
              {selectedLoan.type.replace('_', ' ')} - Balance: ${(selectedLoan.principal - selectedLoan.amountPaid).toLocaleString()}
            </p>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Payment Amount"
                type="number"
                value={paymentAmount.toString()}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                startContent="$"
                min="1"
                max={availableCash}
                description={`Available cash: $${availableCash.toLocaleString()}`}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Impact</label>
                <div className="text-sm text-gray-600">
                  <div>Principal reduction: ${(paymentAmount - (paymentAmount * 0.1)).toFixed(2)}</div>
                  <div>Interest paid: ${(paymentAmount * 0.1).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {error && (
              <Alert color="danger" title="Payment Error">
                {error}
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                color="primary"
                onPress={handlePayment}
                isLoading={isSubmitting}
                isDisabled={paymentAmount <= 0 || paymentAmount > availableCash}
              >
                {isSubmitting ? 'Processing...' : 'Make Payment'}
              </Button>

              <Button
                variant="bordered"
                onPress={() => {
                  setSelectedLoanId('');
                  setPaymentAmount(0);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment History</h3>
          </CardHeader>

          <CardBody>
            <Table aria-label="Payment history">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>LOAN</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>TYPE</TableColumn>
              </TableHeader>
              <TableBody>
                {paymentHistory.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                    <TableCell>{payment.loanId.slice(-8)}</TableCell>
                    <TableCell>${payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={payment.type === 'late' ? 'danger' : 'success'}
                        variant="flat"
                      >
                        {payment.type}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}