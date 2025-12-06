/**
 * @fileoverview Active Loans Table Component
 * @module components/banking/ActiveLoansTable
 * 
 * OVERVIEW:
 * Table component for viewing and managing active loans issued by player's bank.
 * Features payment tracking, default warnings, and loan details modal.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Select,
  SelectItem,
  Input,
  useDisclosure,
  Spinner,
  Pagination,
} from '@heroui/react';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import {
  useBankLoans,
  useBankLoan,
  useProcessLoanPayment,
  useWriteOffLoan,
  type BankLoan,
  type BankLoansResponse,
} from '@/lib/hooks/usePlayerBanking';

// ============================================================================
// Types
// ============================================================================

export interface ActiveLoansTableProps {
  onPaymentProcessed?: (loan: BankLoan) => void;
  onLoanWrittenOff?: (loanId: string) => void;
}

type LoanStatus = 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'WRITTEN_OFF';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusColor(status: LoanStatus): 'success' | 'primary' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'ACTIVE': return 'primary';
    case 'PAID_OFF': return 'success';
    case 'DEFAULTED': return 'danger';
    case 'WRITTEN_OFF': return 'warning';
    default: return 'default';
  }
}

function getStatusIcon(status: LoanStatus): React.ReactNode {
  switch (status) {
    case 'ACTIVE': return <Clock className="w-4 h-4" />;
    case 'PAID_OFF': return <CheckCircle className="w-4 h-4" />;
    case 'DEFAULTED': return <XCircle className="w-4 h-4" />;
    case 'WRITTEN_OFF': return <Trash2 className="w-4 h-4" />;
    default: return null;
  }
}

function calculateProgress(loan: BankLoan): number {
  const paid = loan.principal - loan.remainingBalance;
  return (paid / loan.principal) * 100;
}

function calculatePaymentsRemaining(loan: BankLoan): number {
  if (loan.status !== 'ACTIVE') return 0;
  return Math.ceil(loan.remainingBalance / loan.monthlyPayment);
}

// ============================================================================
// Loan Detail Modal Component
// ============================================================================

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  onProcessPayment: () => void;
  onWriteOff: () => void;
  isProcessing: boolean;
}

function LoanDetailModal({ 
  isOpen, 
  onClose, 
  loanId, 
  onProcessPayment, 
  onWriteOff,
  isProcessing 
}: LoanDetailModalProps) {
  const { data, isLoading } = useBankLoan(loanId);

  if (!loanId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white">Loan Details</h3>
          {data?.loan && (
            <p className="text-sm text-gray-400">
              {data.loan.borrowerName} • {data.loan.purpose}
            </p>
          )}
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" label="Loading loan details..." />
            </div>
          ) : data?.loan ? (
            <div className="space-y-6">
              {/* Loan Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50">
                  <CardBody className="p-3">
                    <p className="text-xs text-gray-400">Principal</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(data.loan.principal)}</p>
                  </CardBody>
                </Card>
                <Card className="bg-slate-900/50">
                  <CardBody className="p-3">
                    <p className="text-xs text-gray-400">Interest Rate</p>
                    <p className="text-lg font-bold text-yellow-400">{(data.loan.interestRate * 100).toFixed(1)}%</p>
                  </CardBody>
                </Card>
                <Card className="bg-slate-900/50">
                  <CardBody className="p-3">
                    <p className="text-xs text-gray-400">Monthly Payment</p>
                    <p className="text-lg font-bold text-blue-400">{formatCurrency(data.loan.monthlyPayment)}</p>
                  </CardBody>
                </Card>
                <Card className="bg-slate-900/50">
                  <CardBody className="p-3">
                    <p className="text-xs text-gray-400">Remaining</p>
                    <p className="text-lg font-bold text-red-400">{formatCurrency(data.loan.remainingBalance)}</p>
                  </CardBody>
                </Card>
              </div>

              {/* Progress */}
              <Card className="bg-slate-900/50">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Repayment Progress</span>
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(data.loan.principal - data.loan.remainingBalance)} of {formatCurrency(data.loan.principal)}
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgress(data.loan)} 
                    color="success"
                    size="lg"
                    showValueLabel
                  />
                </CardBody>
              </Card>

              {/* Financials */}
              {data.financials && (
                <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50">
                  <CardBody className="p-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-3">Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(data.financials.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Interest Earned</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(data.financials.totalInterestEarned)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Expected Total Interest</p>
                        <p className="text-lg font-bold text-yellow-400">{formatCurrency(data.financials.expectedTotalInterest)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Interest Progress</p>
                        <Progress value={data.financials.interestProgress} color="warning" size="sm" showValueLabel />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Next Payment */}
              {data.nextPayment && (
                <Card className="bg-slate-900/50 border border-blue-700/50">
                  <CardBody className="p-4">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3">Next Payment Due</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Payment #</p>
                        <p className="text-lg font-bold text-white">{data.nextPayment.paymentNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Due Date</p>
                        <p className="text-lg font-bold text-white">{formatDate(data.nextPayment.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(data.nextPayment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Interest Portion</p>
                        <p className="text-lg font-bold text-yellow-400">{formatCurrency(data.nextPayment.interestPortion)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Payment History */}
              {data.payments && data.payments.history.length > 0 && (
                <Card className="bg-slate-900/50">
                  <CardHeader>
                    <h4 className="text-sm font-semibold text-white">Payment History</h4>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="flex gap-4 text-sm text-gray-400 mb-4">
                      <span>Total: {data.payments.totalPayments}</span>
                      <span className="text-green-400">On Time: {data.payments.onTimePayments}</span>
                      <span className="text-red-400">Late: {data.payments.latePayments}</span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {data.payments.history.slice(0, 10).map((payment, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            payment.onTime ? 'bg-green-900/20' : 'bg-red-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {payment.onTime ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-white">Payment #{payment.paymentNumber}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-gray-400">{formatDate(payment.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Loan details not found
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Close
          </Button>
          {data?.loan?.status === 'ACTIVE' && (
            <Button 
              color="primary" 
              onPress={onProcessPayment}
              isLoading={isProcessing}
              startContent={<CreditCard className="w-4 h-4" />}
            >
              Simulate Payment
            </Button>
          )}
          {data?.loan?.status === 'DEFAULTED' && (
            <Button 
              color="danger" 
              onPress={onWriteOff}
              isLoading={isProcessing}
              startContent={<Trash2 className="w-4 h-4" />}
            >
              Write Off
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ActiveLoansTable({ 
  onPaymentProcessed, 
  onLoanWrittenOff 
}: ActiveLoansTableProps): React.ReactElement {
  // State
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data fetching
  const { data, isLoading, error, refetch } = useBankLoans({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: pageSize,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const loans = data?.loans || [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  // Filtered loans (client-side search)
  const filteredLoans = useMemo(() => {
    if (!searchQuery) return loans;
    const query = searchQuery.toLowerCase();
    return loans.filter(loan => 
      loan.borrowerName.toLowerCase().includes(query) ||
      loan.purpose.toLowerCase().includes(query)
    );
  }, [loans, searchQuery]);

  // Handlers
  const handleViewLoan = useCallback((loanId: string) => {
    setSelectedLoanId(loanId);
    onOpen();
  }, [onOpen]);

  const handleProcessPayment = useCallback(async () => {
    if (!selectedLoanId) return;
    
    setProcessingLoanId(selectedLoanId);
    try {
      const response = await fetch(`/api/banking/player/bank-loans/${selectedLoanId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const result = await response.json();
        onPaymentProcessed?.(result.data?.loan);
        refetch();
      }
    } finally {
      setProcessingLoanId(null);
    }
  }, [selectedLoanId, onPaymentProcessed, refetch]);

  const handleWriteOff = useCallback(async () => {
    if (!selectedLoanId) return;
    
    setProcessingLoanId(selectedLoanId);
    try {
      const response = await fetch(`/api/banking/player/bank-loans/${selectedLoanId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onLoanWrittenOff?.(selectedLoanId);
        refetch();
        onClose();
      }
    } finally {
      setProcessingLoanId(null);
    }
  }, [selectedLoanId, onLoanWrittenOff, refetch, onClose]);

  // Loading state
  if (isLoading && !data) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-8 flex items-center justify-center">
          <Spinner size="lg" label="Loading loans..." />
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-slate-800/50 border border-red-900/50">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-medium">Failed to load loans</p>
              <p className="text-sm text-gray-400">{error.message}</p>
            </div>
          </div>
          <Button className="mt-4" onPress={() => refetch()} startContent={<RefreshCw className="w-4 h-4" />}>
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-400" />
            Loan Portfolio
          </h2>
          <p className="text-sm text-gray-400">
            {stats?.activeLoans || 0} active loans • {formatCurrency(stats?.totalOutstanding || 0)} outstanding
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Search */}
          <Input
            className="w-48"
            placeholder="Search borrowers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
          />

          {/* Status Filter */}
          <Select
            className="w-36"
            placeholder="Status"
            selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as LoanStatus | undefined;
              setStatusFilter(selected || 'all');
              setPage(1);
            }}
            startContent={<Filter className="w-4 h-4" />}
          >
            {(['ACTIVE', 'PAID_OFF', 'DEFAULTED', 'WRITTEN_OFF'] as LoanStatus[]).map((status) => (
              <SelectItem key={status}>{status.replace('_', ' ')}</SelectItem>
            ))}
          </Select>

          {/* Refresh */}
          <Button variant="flat" isIconOnly onPress={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Active</p>
                  <p className="text-lg font-bold text-blue-400">{stats.activeLoans}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Outstanding</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(stats.totalOutstanding)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Interest Earned</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.totalInterestEarned)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Avg Rate</p>
                  <p className="text-lg font-bold text-yellow-400">{(stats.avgInterestRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-xs text-gray-400">Default Rate</p>
                  <p className="text-lg font-bold text-red-400">{(stats.defaultRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Loans Table */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-0">
          <Table
            aria-label="Loan portfolio table"
            removeWrapper
            classNames={{
              table: 'min-w-full',
              th: 'bg-slate-900/50 text-gray-400 font-semibold',
              td: 'py-3',
            }}
          >
            <TableHeader>
              <TableColumn>BORROWER</TableColumn>
              <TableColumn>PRINCIPAL</TableColumn>
              <TableColumn>RATE</TableColumn>
              <TableColumn>MONTHLY</TableColumn>
              <TableColumn>BALANCE</TableColumn>
              <TableColumn>PROGRESS</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody 
              emptyContent="No loans found"
              isLoading={isLoading}
              loadingContent={<Spinner label="Loading..." />}
            >
              {filteredLoans.map((loan) => (
                <TableRow key={loan._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{loan.borrowerName}</p>
                      <p className="text-xs text-gray-400">{loan.purpose}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-white">{formatCurrency(loan.principal)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-400">{(loan.interestRate * 100).toFixed(1)}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-400">{formatCurrency(loan.monthlyPayment)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-400">{formatCurrency(loan.remainingBalance)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress 
                        value={calculateProgress(loan)} 
                        color={loan.status === 'PAID_OFF' ? 'success' : loan.status === 'DEFAULTED' ? 'danger' : 'primary'}
                        size="sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {calculatePaymentsRemaining(loan)} payments left
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      color={getStatusColor(loan.status as LoanStatus)}
                      variant="flat"
                      startContent={getStatusIcon(loan.status as LoanStatus)}
                    >
                      {loan.status.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content="View Details">
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleViewLoan(loan._id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            total={pagination.totalPages}
            page={page}
            onChange={setPage}
          />
        </div>
      )}

      {/* Loan Detail Modal */}
      <LoanDetailModal
        isOpen={isOpen}
        onClose={onClose}
        loanId={selectedLoanId}
        onProcessPayment={handleProcessPayment}
        onWriteOff={handleWriteOff}
        isProcessing={processingLoanId !== null}
      />
    </div>
  );
}

export default ActiveLoansTable;
