/**
 * @fileoverview Interest Rate Controls Component
 * @module components/banking/InterestRateControls
 * 
 * OVERVIEW:
 * Controls for adjusting bank interest rates (lending and deposits).
 * Features sliders, market comparison, and profitability calculator.
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
  Slider,
  Tooltip,
  Spinner,
  Divider,
} from '@heroui/react';
import {
  Percent,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Save,
  RotateCcw,
  Info,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { useBankSettings, useUpdateBankSettings, type BankSettings } from '@/lib/hooks/usePlayerBanking';

// ============================================================================
// Types
// ============================================================================

export interface InterestRateControlsProps {
  onSettingsSaved?: (settings: Partial<BankSettings>) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function calculateSpread(lendingRate: number, depositRate: number): number {
  return lendingRate - depositRate;
}

function getSpreadColor(spread: number): string {
  if (spread >= 0.04) return 'text-green-400'; // 4%+ healthy
  if (spread >= 0.02) return 'text-yellow-400'; // 2-4% marginal
  return 'text-red-400'; // <2% risky
}

function getSpreadLabel(spread: number): string {
  if (spread >= 0.04) return 'Healthy';
  if (spread >= 0.02) return 'Marginal';
  return 'Risky';
}

// ============================================================================
// Rate Slider Component
// ============================================================================

interface RateSliderProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'danger';
  marketRate?: number;
  isDeposit?: boolean;
}

function RateSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  icon,
  color,
  marketRate,
  isDeposit,
}: RateSliderProps) {
  const marketComparison = marketRate ? value - marketRate : 0;
  const isCompetitive = isDeposit 
    ? marketComparison >= 0 // For deposits, higher is better
    : marketComparison <= 0; // For loans, lower is better

  return (
    <Card className="bg-slate-800/50 border border-slate-700">
      <CardBody className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <p className="font-semibold text-white">{label}</p>
              <p className="text-xs text-gray-400">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold text-${color}`}>{formatPercent(value)}</p>
            {marketRate && (
              <div className={`flex items-center gap-1 text-xs ${isCompetitive ? 'text-green-400' : 'text-red-400'}`}>
                {marketComparison > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {marketComparison > 0 ? '+' : ''}{formatPercent(marketComparison)} vs market
                </span>
              </div>
            )}
          </div>
        </div>

        <Slider
          size="lg"
          step={step}
          minValue={min}
          maxValue={max}
          value={value}
          onChange={(val) => onChange(val as number)}
          color={color}
          showSteps
          marks={[
            { value: min, label: formatPercent(min) },
            { value: (min + max) / 2, label: formatPercent((min + max) / 2) },
            { value: max, label: formatPercent(max) },
          ]}
        />

        {marketRate && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Market Average: {formatPercent(marketRate)}</span>
            <Tooltip content={isDeposit 
              ? "Higher rates attract more deposits but cost you more in interest" 
              : "Lower rates attract more borrowers but reduce your interest income"
            }>
              <Info className="w-4 h-4" />
            </Tooltip>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Profitability Calculator Component
// ============================================================================

interface ProfitabilityCalcProps {
  lendingRate: number;
  depositRate: number;
  totalDeposits: number;
  totalLoans: number;
}

function ProfitabilityCalc({ lendingRate, depositRate, totalDeposits, totalLoans }: ProfitabilityCalcProps) {
  const spread = calculateSpread(lendingRate, depositRate);
  const annualInterestIncome = totalLoans * lendingRate;
  const annualInterestExpense = totalDeposits * depositRate;
  const netInterestIncome = annualInterestIncome - annualInterestExpense;
  const netInterestMargin = totalLoans > 0 ? netInterestIncome / totalLoans : 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h4 className="text-lg font-semibold text-white">Profitability Analysis</h4>
        </div>
      </CardHeader>
      <CardBody className="pt-0 space-y-4">
        {/* Interest Rate Spread */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Interest Rate Spread</span>
            <div className={`flex items-center gap-2 ${getSpreadColor(spread)}`}>
              <span className="text-xl font-bold">{formatPercent(spread)}</span>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">{getSpreadLabel(spread)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Lending: {formatPercent(lendingRate)}</span>
            <span>-</span>
            <span>Deposit: {formatPercent(depositRate)}</span>
          </div>
        </div>

        {/* Annual Projections */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-900/20 rounded-lg p-3 border border-green-700/30">
            <p className="text-xs text-gray-400">Interest Income</p>
            <p className="text-lg font-bold text-green-400">
              ${(annualInterestIncome / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-gray-500">/year projected</p>
          </div>
          <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/30">
            <p className="text-xs text-gray-400">Interest Expense</p>
            <p className="text-lg font-bold text-red-400">
              ${(annualInterestExpense / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-gray-500">/year projected</p>
          </div>
          <div className={`rounded-lg p-3 border ${
            netInterestIncome >= 0 
              ? 'bg-emerald-900/20 border-emerald-700/30' 
              : 'bg-red-900/30 border-red-700/50'
          }`}>
            <p className="text-xs text-gray-400">Net Interest Income</p>
            <p className={`text-lg font-bold ${netInterestIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(netInterestIncome / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-gray-500">/year projected</p>
          </div>
        </div>

        {/* Warnings */}
        {spread < 0.02 && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 rounded-lg border border-red-700/50 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              Low spread may not cover operating costs. Consider adjusting rates.
            </span>
          </div>
        )}

        {netInterestIncome < 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 rounded-lg border border-red-700/50 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              Negative net interest income! Your deposit costs exceed loan income.
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InterestRateControls({ onSettingsSaved }: InterestRateControlsProps): React.ReactElement {
  const { data, isLoading, error, refetch } = useBankSettings();
  const { mutate: updateSettings, isLoading: isSaving } = useUpdateBankSettings({
    onSuccess: (result) => {
      onSettingsSaved?.(result.settings);
      refetch();
    },
  });

  // Local state for editing
  const [localLendingRate, setLocalLendingRate] = useState<number | null>(null);
  const [localDepositRate, setLocalDepositRate] = useState<number | null>(null);

  // Derived values
  const currentLendingRate = localLendingRate ?? data?.settings.baseInterestRate ?? 0.08;
  const currentDepositRate = localDepositRate ?? 0.02; // TODO: Add to BankSettings model if needed
  const hasChanges = localLendingRate !== null || localDepositRate !== null;

  // Market rates (simulated)
  const marketLendingRate = 0.085;
  const marketDepositRate = 0.025;

  // Handlers
  const handleSave = useCallback(() => {
    const updates: Partial<BankSettings> = {};
    if (localLendingRate !== null) {
      updates.baseInterestRate = localLendingRate;
    }
    updateSettings(updates);
    setLocalLendingRate(null);
    setLocalDepositRate(null);
  }, [localLendingRate, updateSettings]);

  const handleReset = useCallback(() => {
    setLocalLendingRate(null);
    setLocalDepositRate(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardBody className="p-8 flex items-center justify-center">
          <Spinner size="lg" label="Loading rate settings..." />
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className="bg-slate-800/50 border border-red-900/50">
        <CardBody className="p-6 text-center text-red-400">
          Failed to load rate settings
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-yellow-400" />
            Interest Rate Settings
          </h2>
          <p className="text-sm text-gray-400">
            Adjust lending and deposit rates to optimize profitability
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-3">
            <Button
              variant="flat"
              startContent={<RotateCcw className="w-4 h-4" />}
              onPress={handleReset}
            >
              Reset
            </Button>
            <Button
              color="success"
              startContent={<Save className="w-4 h-4" />}
              onPress={handleSave}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Rate Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RateSlider
          label="Lending Rate (APR)"
          description="Interest rate charged on loans"
          value={currentLendingRate}
          min={data.settings.minInterestRate}
          max={data.settings.maxInterestRate}
          step={0.005}
          onChange={setLocalLendingRate}
          icon={<TrendingUp className="w-5 h-5 text-yellow-400" />}
          color="warning"
          marketRate={marketLendingRate}
          isDeposit={false}
        />

        <RateSlider
          label="Deposit Rate (APY)"
          description="Interest rate paid on deposits"
          value={currentDepositRate}
          min={0.005}
          max={0.08}
          step={0.0025}
          onChange={setLocalDepositRate}
          icon={<PiggyBank className="w-5 h-5 text-blue-400" />}
          color="primary"
          marketRate={marketDepositRate}
          isDeposit={true}
        />
      </div>

      {/* Profitability Calculator */}
      <ProfitabilityCalc
        lendingRate={currentLendingRate}
        depositRate={currentDepositRate}
        totalDeposits={data.stats.deposits.totalBalance}
        totalLoans={Object.values(data.stats.loans.byStatus)
          .filter((s) => s)
          .reduce((sum, s) => sum + (s?.totalPrincipal || 0), 0)}
      />

      {/* Rate Ranges Info */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Rate Limits</h4>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Min Lending Rate</p>
              <p className="text-white font-medium">{formatPercent(data.settings.minInterestRate)}</p>
            </div>
            <div>
              <p className="text-gray-400">Max Lending Rate</p>
              <p className="text-white font-medium">{formatPercent(data.settings.maxInterestRate)}</p>
            </div>
            <div>
              <p className="text-gray-400">Reserve Requirement</p>
              <p className="text-white font-medium">{formatPercent(data.settings.reserveRequirement)}</p>
            </div>
            <div>
              <p className="text-gray-400">Loan-to-Deposit Ratio</p>
              <p className="text-white font-medium">{formatPercent(data.settings.loanToDepositRatio)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/30">
        <CardBody className="p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Rate Setting Tips</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Keep a spread of at least 3-4% between lending and deposit rates</li>
            <li>• Lower lending rates attract more borrowers but reduce profit per loan</li>
            <li>• Higher deposit rates attract more deposits but increase your costs</li>
            <li>• Monitor competitors&apos; rates to stay competitive in the market</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export default InterestRateControls;
