/**
 * @fileoverview Deposits Panel Component
 * @module components/banking/DepositsPanel
 * 
 * OVERVIEW:
 * Panel for viewing and managing customer deposits in player's bank.
 * Features deposit types, interest tracking, and new deposit acceptance.
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
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Spinner,
  Pagination,
  Divider,
} from '@heroui/react';
import {
  Wallet,
  Plus,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Clock,
  RefreshCw,
  Filter,
  Search,
  Building,
  User,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  useBankDeposits,
  useAcceptDeposit,
  type BankDeposit,
  type DepositsResponse,
} from '@/lib/hooks/usePlayerBanking';

// ============================================================================
// Types
// ============================================================================

export interface DepositsPanelProps {
  onDepositAccepted?: (deposit: BankDeposit) => void;
}

type DepositType = 'CHECKING' | 'SAVINGS' | 'CD' | 'MONEY_MARKET';
type AccountType = 'INDIVIDUAL' | 'JOINT' | 'BUSINESS' | 'TRUST';

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

function getDepositTypeColor(type: DepositType): 'primary' | 'success' | 'warning' | 'secondary' {
  switch (type) {
    case 'CHECKING': return 'primary';
    case 'SAVINGS': return 'success';
    case 'CD': return 'warning';
    case 'MONEY_MARKET': return 'secondary';
    default: return 'primary';
  }
}

function getDepositTypeIcon(type: DepositType): React.ReactNode {
  switch (type) {
    case 'CHECKING': return <Wallet className="w-4 h-4" />;
    case 'SAVINGS': return <PiggyBank className="w-4 h-4" />;
    case 'CD': return <Clock className="w-4 h-4" />;
    case 'MONEY_MARKET': return <TrendingUp className="w-4 h-4" />;
    default: return <DollarSign className="w-4 h-4" />;
  }
}

function getAccountTypeIcon(type: AccountType): React.ReactNode {
  switch (type) {
    case 'INDIVIDUAL': return <User className="w-4 h-4" />;
    case 'JOINT': return <Users className="w-4 h-4" />;
    case 'BUSINESS': return <Building className="w-4 h-4" />;
    case 'TRUST': return <FileText className="w-4 h-4" />;
    default: return null;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// New Deposit Modal Component
// ============================================================================

interface NewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewDepositData) => Promise<void>;
  isLoading: boolean;
}

interface NewDepositData {
  customerName: string;
  customerEmail?: string;
  type: DepositType;
  accountType: AccountType;
  initialDeposit: number;
  termMonths?: number;
}

function NewDepositModal({ isOpen, onClose, onSubmit, isLoading }: NewDepositModalProps) {
  const [formData, setFormData] = useState<Partial<NewDepositData>>({
    type: 'SAVINGS',
    accountType: 'INDIVIDUAL',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.initialDeposit || formData.initialDeposit <= 0) {
      newErrors.initialDeposit = 'Valid deposit amount is required';
    }
    if (formData.type === 'CD' && (!formData.termMonths || formData.termMonths < 1)) {
      newErrors.termMonths = 'Term months required for CD';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData as NewDepositData);
    
    // Reset form
    setFormData({
      type: 'SAVINGS',
      accountType: 'INDIVIDUAL',
    });
    setErrors({});
  };

  // Calculate estimated interest
  const estimatedAnnualInterest = useMemo(() => {
    if (!formData.initialDeposit) return 0;
    const rates: Record<DepositType, number> = {
      'CHECKING': 0.01,
      'SAVINGS': 0.04,
      'CD': 0.05,
      'MONEY_MARKET': 0.045,
    };
    return formData.initialDeposit * (rates[formData.type || 'SAVINGS'] || 0.04);
  }, [formData.initialDeposit, formData.type]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white">Accept New Deposit</h3>
          <p className="text-sm text-gray-400">Add a new customer deposit to your bank</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                placeholder="Enter customer name"
                value={formData.customerName || ''}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setErrors({ ...errors, customerName: '' });
                }}
                isInvalid={!!errors.customerName}
                errorMessage={errors.customerName}
                isRequired
              />
              <Input
                label="Email (Optional)"
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail || ''}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>

            {/* Account Types */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Deposit Type"
                placeholder="Select type"
                selectedKeys={formData.type ? [formData.type] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as DepositType;
                  setFormData({ ...formData, type: selected });
                }}
              >
                {(['CHECKING', 'SAVINGS', 'CD', 'MONEY_MARKET'] as DepositType[]).map((type) => (
                  <SelectItem 
                    key={type} 
                    startContent={getDepositTypeIcon(type)}
                  >
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Account Type"
                placeholder="Select account type"
                selectedKeys={formData.accountType ? [formData.accountType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as AccountType;
                  setFormData({ ...formData, accountType: selected });
                }}
              >
                {(['INDIVIDUAL', 'JOINT', 'BUSINESS', 'TRUST'] as AccountType[]).map((type) => (
                  <SelectItem 
                    key={type}
                    startContent={getAccountTypeIcon(type)}
                  >
                    {type}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Deposit Amount */}
            <Input
              label="Initial Deposit"
              type="number"
              placeholder="Enter deposit amount"
              value={formData.initialDeposit?.toString() || ''}
              onChange={(e) => {
                setFormData({ ...formData, initialDeposit: parseFloat(e.target.value) || 0 });
                setErrors({ ...errors, initialDeposit: '' });
              }}
              isInvalid={!!errors.initialDeposit}
              errorMessage={errors.initialDeposit}
              startContent={<DollarSign className="w-4 h-4 text-gray-400" />}
              isRequired
            />

            {/* CD Term (only for CD type) */}
            {formData.type === 'CD' && (
              <Select
                label="CD Term"
                placeholder="Select term length"
                selectedKeys={formData.termMonths ? [formData.termMonths.toString()] : []}
                onSelectionChange={(keys) => {
                  const selected = parseInt(Array.from(keys)[0] as string);
                  setFormData({ ...formData, termMonths: selected });
                }}
                isInvalid={!!errors.termMonths}
                errorMessage={errors.termMonths}
              >
                <SelectItem key="3">3 Months</SelectItem>
                <SelectItem key="6">6 Months</SelectItem>
                <SelectItem key="12">12 Months (1 Year)</SelectItem>
                <SelectItem key="24">24 Months (2 Years)</SelectItem>
                <SelectItem key="36">36 Months (3 Years)</SelectItem>
                <SelectItem key="60">60 Months (5 Years)</SelectItem>
              </Select>
            )}

            {/* Interest Estimate */}
            {formData.initialDeposit && formData.initialDeposit > 0 && (
              <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50">
                <CardBody className="p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">Interest Liability</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Estimated Annual Interest</p>
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(estimatedAnnualInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly Interest</p>
                      <p className="text-lg font-bold text-yellow-400">{formatCurrency(estimatedAnnualInterest / 12)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the interest you&apos;ll pay to the customer for holding their deposit.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isLoading}
            startContent={<Plus className="w-4 h-4" />}
          >
            Accept Deposit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DepositsPanel({ onDepositAccepted }: DepositsPanelProps): React.ReactElement {
  // State
  const [typeFilter, setTypeFilter] = useState<DepositType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isAccepting, setIsAccepting] = useState(false);
  const pageSize = 10;

  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data fetching
  const { data, isLoading, error, refetch } = useBankDeposits({
    type: typeFilter === 'all' ? undefined : typeFilter,
    isActive: true,
    page,
    limit: pageSize,
    sortBy: 'balance',
    sortOrder: 'desc',
  });

  const deposits = data?.deposits || [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  // Filtered deposits (client-side search)
  const filteredDeposits = useMemo(() => {
    if (!searchQuery) return deposits;
    const query = searchQuery.toLowerCase();
    return deposits.filter(deposit => 
      deposit.customerName.toLowerCase().includes(query) ||
      deposit.accountNumber.toLowerCase().includes(query)
    );
  }, [deposits, searchQuery]);

  // Handlers
  const handleAcceptDeposit = useCallback(async (depositData: NewDepositData) => {
    setIsAccepting(true);
    try {
      const response = await fetch('/api/banking/player/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData),
      });
      
      if (response.ok) {
        const result = await response.json();
        onDepositAccepted?.(result.data?.deposit);
        refetch();
        onClose();
      }
    } finally {
      setIsAccepting(false);
    }
  }, [onDepositAccepted, refetch, onClose]);

  // Loading state
  if (isLoading && !data) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-8 flex items-center justify-center">
          <Spinner size="lg" label="Loading deposits..." />
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
              <p className="font-medium">Failed to load deposits</p>
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
            <Wallet className="w-5 h-5 text-purple-400" />
            Customer Deposits
          </h2>
          <p className="text-sm text-gray-400">
            {stats?.depositCount || 0} accounts • {formatCurrency(stats?.totalDeposits || 0)} in deposits
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Search */}
          <Input
            className="w-48"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
          />

          {/* Type Filter */}
          <Select
            className="w-40"
            placeholder="Type"
            selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as DepositType | undefined;
              setTypeFilter(selected || 'all');
              setPage(1);
            }}
            startContent={<Filter className="w-4 h-4" />}
          >
            {(['CHECKING', 'SAVINGS', 'CD', 'MONEY_MARKET'] as DepositType[]).map((type) => (
              <SelectItem key={type}>{type.replace('_', ' ')}</SelectItem>
            ))}
          </Select>

          {/* New Deposit Button */}
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onOpen}
          >
            Accept Deposit
          </Button>

          {/* Refresh */}
          <Button variant="flat" isIconOnly onPress={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Total Deposits</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(stats.totalDeposits)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Interest Paid</p>
                  <p className="text-lg font-bold text-yellow-400">{formatCurrency(stats.totalInterestPaid)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Avg Rate</p>
                  <p className="text-lg font-bold text-blue-400">{(stats.averageInterestRate * 100).toFixed(2)}%</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Accounts</p>
                  <p className="text-lg font-bold text-purple-400">{stats.depositCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Deposit Type Breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byType).map(([type, data]) => (
            <Card 
              key={type} 
              className={`bg-gradient-to-br border ${
                type === 'SAVINGS' ? 'from-green-900/30 to-emerald-900/30 border-green-700/50' :
                type === 'CHECKING' ? 'from-blue-900/30 to-indigo-900/30 border-blue-700/50' :
                type === 'CD' ? 'from-yellow-900/30 to-orange-900/30 border-yellow-700/50' :
                'from-purple-900/30 to-pink-900/30 border-purple-700/50'
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getDepositTypeIcon(type as DepositType)}
                  <span className="text-sm font-medium text-white">{type.replace('_', ' ')}</span>
                </div>
                <p className="text-xl font-bold text-white">{formatCurrency(data.totalBalance)}</p>
                <p className="text-xs text-gray-400">{data.count} accounts</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Deposits Table */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-0">
          <Table
            aria-label="Customer deposits table"
            removeWrapper
            classNames={{
              table: 'min-w-full',
              th: 'bg-slate-900/50 text-gray-400 font-semibold',
              td: 'py-3',
            }}
          >
            <TableHeader>
              <TableColumn>CUSTOMER</TableColumn>
              <TableColumn>ACCOUNT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>BALANCE</TableColumn>
              <TableColumn>RATE</TableColumn>
              <TableColumn>INTEREST PAID</TableColumn>
              <TableColumn>OPENED</TableColumn>
            </TableHeader>
            <TableBody 
              emptyContent="No deposits found"
              isLoading={isLoading}
              loadingContent={<Spinner label="Loading..." />}
            >
              {filteredDeposits.map((deposit) => (
                <TableRow key={deposit._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAccountTypeIcon(deposit.accountType as AccountType)}
                      <div>
                        <p className="font-medium text-white">{deposit.customerName}</p>
                        <p className="text-xs text-gray-400">{deposit.accountType}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-gray-300">{deposit.accountNumber}</span>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      color={getDepositTypeColor(deposit.type as DepositType)}
                      variant="flat"
                      startContent={getDepositTypeIcon(deposit.type as DepositType)}
                    >
                      {deposit.type.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-400">{formatCurrency(deposit.balance)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-400">{(deposit.interestRate * 100).toFixed(2)}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-400">{formatCurrency(deposit.totalInterestPaid)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400">{formatDate(deposit.createdAt)}</span>
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

      {/* New Deposit Modal */}
      <NewDepositModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleAcceptDeposit}
        isLoading={isAccepting}
      />
    </div>
  );
}

export default DepositsPanel;
