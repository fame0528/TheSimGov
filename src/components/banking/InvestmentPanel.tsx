/**
 * @fileoverview Investment Mini-Game Panel Component
 * @module components/banking/InvestmentPanel
 * 
 * OVERVIEW:
 * Investment panel for player-as-lender banking system.
 * Allows players to invest excess capital in various instruments.
 * Creates strategic depth through risk/reward decisions.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useCallback } from 'react';
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
  useDisclosure,
  Slider,
  Divider,
  Tooltip,
} from '@heroui/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  PieChart,
  Building,
  Landmark,
  Gem,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Lock,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface InvestmentPanelProps {
  availableCapital?: number;
  bankLevel?: number;
  onInvest?: (investmentId: string, amount: number) => void;
  onWithdraw?: (investmentId: string) => void;
}

type InvestmentType = 'BONDS' | 'STOCKS' | 'REAL_ESTATE' | 'CRYPTO' | 'COMMODITIES';
type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  description: string;
  minInvestment: number;
  maxInvestment: number;
  expectedReturn: { min: number; max: number };
  riskLevel: RiskLevel;
  lockPeriod: number; // days
  currentValue: number;
  investedAmount: number;
  startDate?: Date;
  maturityDate?: Date;
  requiredLevel: number;
  isLocked: boolean;
}

interface PortfolioStats {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  returnPercent: number;
  diversification: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'inv-1',
    name: 'Treasury Bonds',
    type: 'BONDS',
    description: 'Ultra-safe government bonds with guaranteed returns. Perfect for conservative investors.',
    minInvestment: 10000,
    maxInvestment: 500000,
    expectedReturn: { min: 2, max: 4 },
    riskLevel: 'VERY_LOW',
    lockPeriod: 30,
    currentValue: 52500,
    investedAmount: 50000,
    requiredLevel: 1,
    isLocked: false,
  },
  {
    id: 'inv-2',
    name: 'Blue Chip Index',
    type: 'STOCKS',
    description: 'Diversified portfolio of established companies. Moderate risk with solid returns.',
    minInvestment: 25000,
    maxInvestment: 1000000,
    expectedReturn: { min: 5, max: 12 },
    riskLevel: 'MEDIUM',
    lockPeriod: 7,
    currentValue: 112000,
    investedAmount: 100000,
    requiredLevel: 2,
    isLocked: false,
  },
  {
    id: 'inv-3',
    name: 'Commercial Real Estate',
    type: 'REAL_ESTATE',
    description: 'Prime commercial properties in major cities. Stable income with appreciation potential.',
    minInvestment: 100000,
    maxInvestment: 5000000,
    expectedReturn: { min: 6, max: 10 },
    riskLevel: 'LOW',
    lockPeriod: 90,
    currentValue: 0,
    investedAmount: 0,
    requiredLevel: 3,
    isLocked: true,
  },
  {
    id: 'inv-4',
    name: 'Crypto Fund',
    type: 'CRYPTO',
    description: 'High-risk, high-reward cryptocurrency basket. Potential for massive gains or losses.',
    minInvestment: 5000,
    maxInvestment: 200000,
    expectedReturn: { min: -30, max: 100 },
    riskLevel: 'VERY_HIGH',
    lockPeriod: 1,
    currentValue: 0,
    investedAmount: 0,
    requiredLevel: 5,
    isLocked: true,
  },
  {
    id: 'inv-5',
    name: 'Gold & Silver',
    type: 'COMMODITIES',
    description: 'Precious metals as a hedge against inflation. Stable value preservation.',
    minInvestment: 10000,
    maxInvestment: 500000,
    expectedReturn: { min: 1, max: 8 },
    riskLevel: 'LOW',
    lockPeriod: 14,
    currentValue: 0,
    investedAmount: 0,
    requiredLevel: 2,
    isLocked: true,
  },
];

const MOCK_PORTFOLIO: PortfolioStats = {
  totalInvested: 150000,
  totalValue: 164500,
  totalReturn: 14500,
  returnPercent: 9.67,
  diversification: 40, // 0-100
};

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getTypeIcon(type: InvestmentType): React.ReactNode {
  switch (type) {
    case 'BONDS': return <Landmark className="w-5 h-5" />;
    case 'STOCKS': return <BarChart3 className="w-5 h-5" />;
    case 'REAL_ESTATE': return <Building className="w-5 h-5" />;
    case 'CRYPTO': return <Coins className="w-5 h-5" />;
    case 'COMMODITIES': return <Gem className="w-5 h-5" />;
    default: return <DollarSign className="w-5 h-5" />;
  }
}

function getTypeColor(type: InvestmentType): string {
  switch (type) {
    case 'BONDS': return 'primary';
    case 'STOCKS': return 'success';
    case 'REAL_ESTATE': return 'warning';
    case 'CRYPTO': return 'danger';
    case 'COMMODITIES': return 'secondary';
    default: return 'default';
  }
}

function getRiskColor(risk: RiskLevel): 'success' | 'primary' | 'warning' | 'danger' {
  switch (risk) {
    case 'VERY_LOW': return 'success';
    case 'LOW': return 'success';
    case 'MEDIUM': return 'warning';
    case 'HIGH': return 'danger';
    case 'VERY_HIGH': return 'danger';
  }
}

function getRiskLabel(risk: RiskLevel): string {
  return risk.replace('_', ' ');
}

// ============================================================================
// Portfolio Overview Component
// ============================================================================

interface PortfolioOverviewProps {
  stats: PortfolioStats;
  availableCapital: number;
}

function PortfolioOverview({ stats, availableCapital }: PortfolioOverviewProps) {
  const isPositive = stats.totalReturn >= 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700">
      <CardBody className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Available Capital */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Available Capital</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(availableCapital)}</p>
          </div>

          {/* Total Invested */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalInvested)}</p>
          </div>

          {/* Current Value */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
          </div>

          {/* Total Return */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Return</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatCurrency(stats.totalReturn)}
              </p>
              <Chip 
                size="sm" 
                color={isPositive ? 'success' : 'danger'} 
                variant="flat"
                startContent={isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              >
                {isPositive ? '+' : ''}{stats.returnPercent.toFixed(1)}%
              </Chip>
            </div>
          </div>
        </div>

        {/* Diversification Score */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Portfolio Diversification</span>
              <Tooltip content="Higher diversification reduces overall risk">
                <Info className="w-3 h-3 text-gray-500" />
              </Tooltip>
            </div>
            <span className="text-sm font-medium text-white">{stats.diversification}%</span>
          </div>
          <Progress 
            value={stats.diversification} 
            color={stats.diversification > 60 ? 'success' : stats.diversification > 30 ? 'warning' : 'danger'}
            size="sm"
          />
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Investment Card Component
// ============================================================================

interface InvestmentCardProps {
  investment: Investment;
  bankLevel: number;
  onInvestClick: (investment: Investment) => void;
  onWithdrawClick: (investment: Investment) => void;
}

function InvestmentCard({ investment, bankLevel, onInvestClick, onWithdrawClick }: InvestmentCardProps) {
  const hasInvestment = investment.investedAmount > 0;
  const returnAmount = investment.currentValue - investment.investedAmount;
  const returnPercent = hasInvestment ? ((returnAmount / investment.investedAmount) * 100) : 0;
  const isPositive = returnAmount >= 0;
  const isUnlocked = bankLevel >= investment.requiredLevel;

  return (
    <Card 
      className={`bg-slate-800/50 border transition-all ${
        !isUnlocked 
          ? 'border-slate-700/50 opacity-60' 
          : hasInvestment
            ? 'border-blue-700/50'
            : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isUnlocked ? `bg-${getTypeColor(investment.type)}/20` : 'bg-slate-700/50'
            }`}>
              {getTypeIcon(investment.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{investment.name}</h4>
                {!isUnlocked && (
                  <Chip size="sm" variant="flat" startContent={<Lock className="w-3 h-3" />}>
                    Lvl {investment.requiredLevel}
                  </Chip>
                )}
              </div>
              <Chip 
                size="sm" 
                color={getRiskColor(investment.riskLevel)} 
                variant="flat"
                className="mt-1"
              >
                {getRiskLabel(investment.riskLevel)} Risk
              </Chip>
            </div>
          </div>
          {hasInvestment && (
            <div className="text-right">
              <p className="text-lg font-bold text-white">{formatCurrency(investment.currentValue)}</p>
              <div className="flex items-center justify-end gap-1">
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{returnPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{investment.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Expected Return</p>
            <p className="text-sm font-medium text-white">
              {investment.expectedReturn.min}% - {investment.expectedReturn.max}%
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Min Investment</p>
            <p className="text-sm font-medium text-white">{formatCurrency(investment.minInvestment)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Lock Period</p>
            <p className="text-sm font-medium text-white">{investment.lockPeriod} days</p>
          </div>
        </div>

        {isUnlocked ? (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              color="primary"
              variant={hasInvestment ? 'bordered' : 'solid'}
              onPress={() => onInvestClick(investment)}
              startContent={<TrendingUp className="w-4 h-4" />}
            >
              {hasInvestment ? 'Invest More' : 'Invest'}
            </Button>
            {hasInvestment && !investment.isLocked && (
              <Button
                className="flex-1"
                color="warning"
                variant="flat"
                onPress={() => onWithdrawClick(investment)}
                startContent={<TrendingDown className="w-4 h-4" />}
              >
                Withdraw
              </Button>
            )}
          </div>
        ) : (
          <Button isDisabled className="w-full" startContent={<Lock className="w-4 h-4" />}>
            Unlock at Level {investment.requiredLevel}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Investment Modal Component
// ============================================================================

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  availableCapital: number;
  onConfirm: (amount: number) => void;
}

function InvestModal({ isOpen, onClose, investment, availableCapital, onConfirm }: InvestModalProps) {
  const [amount, setAmount] = useState<number>(0);

  const minAmount = investment?.minInvestment || 0;
  const maxAmount = Math.min(investment?.maxInvestment || 0, availableCapital);

  React.useEffect(() => {
    if (investment) {
      setAmount(Math.min(investment.minInvestment, maxAmount));
    }
  }, [investment, maxAmount]);

  if (!investment) return null;

  const projectedMin = amount * (1 + investment.expectedReturn.min / 100);
  const projectedMax = amount * (1 + investment.expectedReturn.max / 100);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${getTypeColor(investment.type)}/20`}>
              {getTypeIcon(investment.type)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Invest in {investment.name}</h3>
              <Chip size="sm" color={getRiskColor(investment.riskLevel)} variant="flat">
                {getRiskLabel(investment.riskLevel)} Risk
              </Chip>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Investment Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Investment Amount</span>
                <span className="text-lg font-bold text-white">{formatCurrency(amount)}</span>
              </div>
              <Slider
                value={amount}
                onChange={(val) => setAmount(val as number)}
                minValue={minAmount}
                maxValue={maxAmount}
                step={1000}
                color="primary"
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: {formatCurrency(minAmount)}</span>
                <span>Available: {formatCurrency(availableCapital)}</span>
              </div>
            </div>

            <Divider className="bg-slate-700" />

            {/* Projected Returns */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">PROJECTED VALUE AFTER {investment.lockPeriod} DAYS</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-red-400 mb-1">Conservative</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(projectedMin)}</p>
                  <p className="text-xs text-gray-500">({investment.expectedReturn.min}% return)</p>
                </div>
                <div className="h-12 w-px bg-slate-700" />
                <div className="text-center">
                  <p className="text-xs text-green-400 mb-1">Optimistic</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(projectedMax)}</p>
                  <p className="text-xs text-gray-500">({investment.expectedReturn.max}% return)</p>
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            {(investment.riskLevel === 'HIGH' || investment.riskLevel === 'VERY_HIGH') && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">High Risk Warning</p>
                  <p className="text-sm text-gray-400">
                    This investment carries significant risk. You may lose a substantial portion of your investment.
                  </p>
                </div>
              </div>
            )}

            {/* Lock Period Warning */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Funds will be locked for {investment.lockPeriod} days after investment</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Cancel</Button>
          <Button 
            color="primary" 
            onPress={() => onConfirm(amount)}
            startContent={<DollarSign className="w-4 h-4" />}
          >
            Invest {formatCurrency(amount)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InvestmentPanel({
  availableCapital = 500000,
  bankLevel = 3,
  onInvest,
  onWithdraw,
}: InvestmentPanelProps): React.ReactElement {
  // State
  const [investments] = useState<Investment[]>(MOCK_INVESTMENTS);
  const [portfolioStats] = useState<PortfolioStats>(MOCK_PORTFOLIO);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Handlers
  const handleInvestClick = useCallback((investment: Investment) => {
    setSelectedInvestment(investment);
    onOpen();
  }, [onOpen]);

  const handleWithdrawClick = useCallback((investment: Investment) => {
    onWithdraw?.(investment.id);
  }, [onWithdraw]);

  const handleConfirmInvest = useCallback((amount: number) => {
    if (selectedInvestment) {
      onInvest?.(selectedInvestment.id, amount);
    }
    onClose();
  }, [selectedInvestment, onInvest, onClose]);

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <PortfolioOverview stats={portfolioStats} availableCapital={availableCapital} />

      {/* Investment Options */}
      <Card className="bg-slate-800/30 border border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Investment Opportunities</h4>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.map((investment) => (
              <InvestmentCard
                key={investment.id}
                investment={investment}
                bankLevel={bankLevel}
                onInvestClick={handleInvestClick}
                onWithdrawClick={handleWithdrawClick}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Investment Modal */}
      <InvestModal
        isOpen={isOpen}
        onClose={onClose}
        investment={selectedInvestment}
        availableCapital={availableCapital}
        onConfirm={handleConfirmInvest}
      />
    </div>
  );
}

export default InvestmentPanel;
