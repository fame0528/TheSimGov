/**
 * @fileoverview Loan Applicants Panel Component
 * @module components/banking/LoanApplicantsPanel
 * 
 * OVERVIEW:
 * Panel for viewing and managing loan applicants for player's bank.
 * Features approve/reject workflow, risk tier indicators, and batch actions.
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
  Input,
  Select,
  SelectItem,
  Slider,
  Tooltip,
  useDisclosure,
  Spinner,
} from '@heroui/react';
import {
  UserPlus,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  RefreshCw,
  Filter,
  ChevronDown,
  Shield,
  Briefcase,
} from 'lucide-react';
import {
  useLoanApplicants,
  useGenerateApplicants,
  useApproveApplicant,
  useRejectApplicant,
  type LoanApplicant,
} from '@/lib/hooks/usePlayerBanking';

// ============================================================================
// Types
// ============================================================================

export interface LoanApplicantsPanelProps {
  onApproveSuccess?: (applicant: LoanApplicant) => void;
  onRejectSuccess?: (applicant: LoanApplicant) => void;
}

type RiskTier = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getRiskColor(tier: RiskTier): 'success' | 'primary' | 'warning' | 'danger' | 'default' {
  switch (tier) {
    case 'EXCELLENT': return 'success';
    case 'GOOD': return 'primary';
    case 'FAIR': return 'warning';
    case 'POOR': return 'danger';
    case 'VERY_POOR': return 'danger';
    default: return 'default';
  }
}

function getCreditScoreColor(score: number): string {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 650) return 'text-green-400';
  if (score >= 550) return 'text-yellow-400';
  if (score >= 450) return 'text-orange-400';
  return 'text-red-400';
}

function getEmploymentIcon(status: string): React.ReactNode {
  switch (status) {
    case 'EMPLOYED': return <Briefcase className="w-4 h-4 text-green-400" />;
    case 'SELF_EMPLOYED': return <TrendingUp className="w-4 h-4 text-blue-400" />;
    case 'UNEMPLOYED': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'RETIRED': return <Shield className="w-4 h-4 text-purple-400" />;
    default: return null;
  }
}

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

// ============================================================================
// Applicant Card Component
// ============================================================================

interface ApplicantCardProps {
  applicant: LoanApplicant;
  onApprove: (applicant: LoanApplicant) => void;
  onReject: (applicant: LoanApplicant) => void;
  isProcessing: boolean;
}

function ApplicantCard({ applicant, onApprove, onReject, isProcessing }: ApplicantCardProps) {
  const timeRemaining = formatTimeRemaining(applicant.expiresAt);
  const isExpiring = timeRemaining.includes('h') && parseInt(timeRemaining) < 6;
  
  return (
    <Card className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
      <CardBody className="p-4 space-y-4">
        {/* Header with name and risk tier */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {applicant.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-white">{applicant.name}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {getEmploymentIcon(applicant.employmentStatus)}
                <span>{applicant.employmentStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <Chip 
            size="sm" 
            color={getRiskColor(applicant.riskTier as RiskTier)} 
            variant="flat"
          >
            {applicant.riskTier}
          </Chip>
        </div>

        {/* Credit Score */}
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Credit Score</span>
            <span className={`text-lg font-bold ${getCreditScoreColor(applicant.creditScore)}`}>
              {applicant.creditScore}
            </span>
          </div>
          <Progress 
            value={(applicant.creditScore / 850) * 100} 
            color={applicant.creditScore >= 650 ? 'success' : applicant.creditScore >= 550 ? 'warning' : 'danger'}
            size="sm"
          />
        </div>

        {/* Loan Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/30 rounded-lg p-2">
            <p className="text-xs text-gray-400">Amount Requested</p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(applicant.requestedAmount)}
            </p>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-2">
            <p className="text-xs text-gray-400">Term</p>
            <p className="text-lg font-semibold text-blue-400">
              {applicant.requestedTermMonths} months
            </p>
          </div>
        </div>

        {/* Monthly Income & Purpose */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Monthly Income</span>
            <span className="text-white font-medium">{formatCurrency(applicant.monthlyIncome)}/mo</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Purpose</span>
            <Tooltip content={applicant.purpose}>
              <span className="text-white font-medium truncate max-w-[150px]">{applicant.purpose}</span>
            </Tooltip>
          </div>
        </div>

        {/* Time Remaining */}
        <div className={`flex items-center gap-2 text-xs ${isExpiring ? 'text-orange-400' : 'text-gray-500'}`}>
          <Clock className="w-3 h-3" />
          <span>{timeRemaining}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            color="success"
            variant="flat"
            className="flex-1"
            startContent={<Check className="w-4 h-4" />}
            onPress={() => onApprove(applicant)}
            isLoading={isProcessing}
            isDisabled={isProcessing}
          >
            Approve
          </Button>
          <Button
            color="danger"
            variant="flat"
            className="flex-1"
            startContent={<X className="w-4 h-4" />}
            onPress={() => onReject(applicant)}
            isLoading={isProcessing}
            isDisabled={isProcessing}
          >
            Reject
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Approval Modal Component
// ============================================================================

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: LoanApplicant | null;
  onConfirm: (customRate?: number, customTerm?: number) => Promise<void>;
  isLoading: boolean;
}

function ApprovalModal({ isOpen, onClose, applicant, onConfirm, isLoading }: ApprovalModalProps) {
  const [customRate, setCustomRate] = useState<number>(8);
  const [customTerm, setCustomTerm] = useState<number>(applicant?.requestedTermMonths || 12);

  React.useEffect(() => {
    if (applicant) {
      // Set default rate based on risk tier
      const defaultRates: Record<RiskTier, number> = {
        'EXCELLENT': 5,
        'GOOD': 7,
        'FAIR': 10,
        'POOR': 15,
        'VERY_POOR': 20,
      };
      setCustomRate(defaultRates[applicant.riskTier as RiskTier] || 8);
      setCustomTerm(applicant.requestedTermMonths);
    }
  }, [applicant]);

  if (!applicant) return null;

  const monthlyPayment = applicant.requestedAmount * 
    (customRate / 100 / 12 * Math.pow(1 + customRate / 100 / 12, customTerm)) / 
    (Math.pow(1 + customRate / 100 / 12, customTerm) - 1);

  const totalInterest = (monthlyPayment * customTerm) - applicant.requestedAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-white">Approve Loan Application</h3>
          <p className="text-sm text-gray-400">Review and customize loan terms for {applicant.name}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Applicant Summary */}
            <Card className="bg-slate-900/50 border border-slate-700">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Applicant</p>
                    <p className="text-lg font-semibold text-white">{applicant.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Credit Score</p>
                    <p className={`text-lg font-bold ${getCreditScoreColor(applicant.creditScore)}`}>
                      {applicant.creditScore}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Loan Amount */}
            <div className="bg-slate-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Loan Amount</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(applicant.requestedAmount)}
                </span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Interest Rate (APR)</span>
                <span className="text-lg font-semibold text-yellow-400">{customRate}%</span>
              </div>
              <Slider
                size="sm"
                step={0.5}
                minValue={3}
                maxValue={25}
                value={customRate}
                onChange={(val) => setCustomRate(val as number)}
                className="max-w-full"
                color="warning"
              />
            </div>

            {/* Term Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Loan Term</span>
                <span className="text-lg font-semibold text-blue-400">{customTerm} months</span>
              </div>
              <Slider
                size="sm"
                step={6}
                minValue={6}
                maxValue={60}
                value={customTerm}
                onChange={(val) => setCustomTerm(val as number)}
                className="max-w-full"
                color="primary"
              />
            </div>

            {/* Loan Summary */}
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50">
              <CardBody className="p-4">
                <h4 className="text-sm font-semibold text-green-400 mb-3">Projected Returns</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Monthly Payment</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Interest Earned</p>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(totalInterest)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onPress={() => onConfirm(customRate, customTerm)}
            isLoading={isLoading}
          >
            Approve Loan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LoanApplicantsPanel({ 
  onApproveSuccess, 
  onRejectSuccess 
}: LoanApplicantsPanelProps): React.ReactElement {
  // State
  const [selectedApplicant, setSelectedApplicant] = useState<LoanApplicant | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskTier | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data fetching
  const { data, isLoading, error, refetch } = useLoanApplicants({ 
    status: 'PENDING',
    riskTier: riskFilter === 'all' ? undefined : riskFilter,
  });
  
  // Mutations
  const { mutate: generateApplicants, isLoading: isGenerating } = useGenerateApplicants({
    onSuccess: () => {
      refetch();
    },
  });

  // Filter applicants
  const applicants = useMemo(() => {
    if (!data?.applicants) return [];
    return data.applicants;
  }, [data]);

  const stats = data?.stats;

  // Handlers
  const handleApproveClick = useCallback((applicant: LoanApplicant) => {
    setSelectedApplicant(applicant);
    onOpen();
  }, [onOpen]);

  const handleApproveConfirm = useCallback(async (customRate?: number, customTerm?: number) => {
    if (!selectedApplicant) return;
    
    setProcessingId(selectedApplicant._id);
    try {
      const response = await fetch(`/api/banking/player/applicants/${selectedApplicant._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve',
          customInterestRate: customRate ? customRate / 100 : undefined,
          customTermMonths: customTerm,
        }),
      });
      
      if (response.ok) {
        onApproveSuccess?.(selectedApplicant);
        refetch();
        onClose();
      }
    } finally {
      setProcessingId(null);
    }
  }, [selectedApplicant, onApproveSuccess, refetch, onClose]);

  const handleReject = useCallback(async (applicant: LoanApplicant) => {
    setProcessingId(applicant._id);
    try {
      const response = await fetch(`/api/banking/player/applicants/${applicant._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: 'Does not meet requirements' }),
      });
      
      if (response.ok) {
        onRejectSuccess?.(applicant);
        refetch();
      }
    } finally {
      setProcessingId(null);
    }
  }, [onRejectSuccess, refetch]);

  const handleGenerateApplicants = useCallback(() => {
    generateApplicants({ count: 5 });
  }, [generateApplicants]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-8 flex items-center justify-center">
          <Spinner size="lg" label="Loading applicants..." />
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
              <p className="font-medium">Failed to load applicants</p>
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
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Loan Applicants
          </h2>
          <p className="text-sm text-gray-400">
            {stats?.pending || 0} pending applications • Avg credit score: {stats?.avgCreditScore?.toFixed(0) || 'N/A'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Risk Filter */}
          <Select
            className="w-40"
            placeholder="Filter by risk"
            selectedKeys={riskFilter !== 'all' ? [riskFilter] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as RiskTier | undefined;
              setRiskFilter(selected || 'all');
            }}
            startContent={<Filter className="w-4 h-4" />}
          >
            {(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR'] as RiskTier[]).map((tier) => (
              <SelectItem key={tier}>{tier}</SelectItem>
            ))}
          </Select>

          {/* Generate Button */}
          <Button
            color="primary"
            variant="flat"
            startContent={<UserPlus className="w-4 h-4" />}
            onPress={handleGenerateApplicants}
            isLoading={isGenerating}
          >
            Generate Applicants
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="flat"
            isIconOnly
            onPress={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border border-slate-700">
            <CardBody className="p-4">
              <p className="text-sm text-gray-400">Total Requested</p>
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(stats.totalRequestedAmount || 0)}
              </p>
            </CardBody>
          </Card>
          {Object.entries(stats.byRisk || {}).map(([tier, count]) => (
            <Card key={tier} className="bg-slate-800/50 border border-slate-700">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">{tier}</p>
                  <Chip size="sm" color={getRiskColor(tier as RiskTier)} variant="flat">
                    {count as number}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Applicants Grid */}
      {applicants.length === 0 ? (
        <Card className="bg-slate-800/50 border border-slate-700">
          <CardBody className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Pending Applicants</h3>
            <p className="text-gray-400 mb-4">
              Generate new applicants to start issuing loans from your bank.
            </p>
            <Button
              color="primary"
              startContent={<UserPlus className="w-4 h-4" />}
              onPress={handleGenerateApplicants}
              isLoading={isGenerating}
            >
              Generate Applicants
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant._id}
              applicant={applicant}
              onApprove={handleApproveClick}
              onReject={handleReject}
              isProcessing={processingId === applicant._id}
            />
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isOpen}
        onClose={onClose}
        applicant={selectedApplicant}
        onConfirm={handleApproveConfirm}
        isLoading={processingId !== null}
      />
    </div>
  );
}

export default LoanApplicantsPanel;
