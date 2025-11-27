/**
 * @fileoverview Investment Portfolio Dashboard Component
 * @module components/banking/InvestmentDashboard
 *
 * OVERVIEW:
 * Dashboard for managing investment portfolios with performance tracking,
 * rebalancing controls, and dividend monitoring.
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
import { Chip } from '@heroui/chip';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Progress } from '@heroui/progress';
import { Badge } from '@heroui/badge';
import type { Investment, InvestmentPortfolio, InvestmentPurchaseData } from '@/lib/types/models';
import { InvestmentType } from '@/lib/types/enums';

interface InvestmentDashboardProps {
  companyId: string;
  portfolio: InvestmentPortfolio | null;
  availableCash: number;
  onPurchaseInvestment: (purchase: InvestmentPurchaseData) => Promise<void>;
  onRebalancePortfolio: (targetAllocations: Record<InvestmentType, number>) => Promise<void>;
}

interface PortfolioPerformance {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  monthlyDividend: number;
  annualizedReturn: number;
}

export default function InvestmentDashboard({
  companyId,
  portfolio,
  availableCash,
  onPurchaseInvestment,
  onRebalancePortfolio,
}: InvestmentDashboardProps) {
  // State
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(10000);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState<InvestmentType>(InvestmentType.STOCKS);
  const [targetAllocations, setTargetAllocations] = useState<Record<InvestmentType, number>>({
    [InvestmentType.STOCKS]: 40,
    [InvestmentType.BONDS]: 30,
    [InvestmentType.REAL_ESTATE]: 15,
    [InvestmentType.INDEX_FUNDS]: 15,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Investment type options
  const investmentTypes: { key: InvestmentType; label: string; description: string }[] = [
    { key: InvestmentType.STOCKS, label: 'Stocks', description: 'Individual company shares with higher risk/reward' },
    { key: InvestmentType.BONDS, label: 'Bonds', description: 'Fixed income securities with lower risk' },
    { key: InvestmentType.REAL_ESTATE, label: 'Real Estate', description: 'Property investments with steady returns' },
    { key: InvestmentType.INDEX_FUNDS, label: 'Index Funds', description: 'Diversified funds tracking market indices' },
  ];

  // Load portfolio performance
  useEffect(() => {
    const loadPerformance = async () => {
      if (!portfolio) return;

      try {
        const response = await fetch(`/api/banking/investments/performance?portfolioId=${portfolio.id}`);
        if (response.ok) {
          const data = await response.json();
          setPerformance(data);
        }
      } catch (err) {
        console.error('Failed to load portfolio performance:', err);
      }
    };

    loadPerformance();
  }, [portfolio]);

  // Handle investment purchase
  const handlePurchase = async () => {
    if (purchaseAmount <= 0 || purchaseAmount > availableCash) return;

    setIsPurchasing(true);
    setError(null);

    try {
      await onPurchaseInvestment({
        portfolioId: portfolio!.id,
        type: selectedInvestmentType,
        amount: purchaseAmount,
        riskTolerance: portfolio!.riskTolerance,
      });

      setPurchaseAmount(10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle portfolio rebalancing
  const handleRebalance = async () => {
    const total = Object.values(targetAllocations).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      setError('Target allocations must total 100%');
      return;
    }

    setIsRebalancing(true);
    setError(null);

    try {
      await onRebalancePortfolio(targetAllocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rebalancing failed');
    } finally {
      setIsRebalancing(false);
    }
  };

  // Calculate current allocations
  const getCurrentAllocations = (): Record<InvestmentType, number> => {
    if (!portfolio || !portfolio.investments.length) {
      return { [InvestmentType.STOCKS]: 0, [InvestmentType.BONDS]: 0, [InvestmentType.REAL_ESTATE]: 0, [InvestmentType.INDEX_FUNDS]: 0 };
    }

    const totalValue = portfolio.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const allocations: Record<InvestmentType, number> = { [InvestmentType.STOCKS]: 0, [InvestmentType.BONDS]: 0, [InvestmentType.REAL_ESTATE]: 0, [InvestmentType.INDEX_FUNDS]: 0 };

    portfolio.investments.forEach(investment => {
      const percentage = (investment.currentValue / totalValue) * 100;
      allocations[investment.type] += percentage;
    });

    return allocations;
  };

  const currentAllocations = getCurrentAllocations();

  // Get performance color
  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'success';
    if (value < 0) return 'danger';
    return 'default';
  };

  if (!portfolio) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            No investment portfolio found. Create one through the Player Bank Creator.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Investment Portfolio</h2>
          <p className="text-gray-600">Track and manage your investment performance</p>
        </CardHeader>

        <CardBody>
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">${performance.totalValue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${performance.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${performance.totalGainLoss.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Gain/Loss</div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${performance.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performance.totalGainLossPercent.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Return %</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${performance.monthlyDividend.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Monthly Dividend</div>
              </div>
            </div>
          )}

          {/* Current Allocations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Allocations</h3>
            {Object.entries(currentAllocations).map(([type, percentage]) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{type}</div>
                <Progress
                  value={percentage}
                  color="primary"
                  className="flex-1"
                  size="sm"
                />
                <div className="w-16 text-right text-sm">{percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Purchase Investments */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Purchase Investments</h3>
          <p className="text-gray-600">Add new investments to your portfolio</p>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Investment Type"
              selectedKeys={[selectedInvestmentType]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as InvestmentType;
                setSelectedInvestmentType(selected);
              }}
            >
              {investmentTypes.map((type) => (
                <SelectItem key={type.key} textValue={type.label}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Investment Amount"
              type="number"
              value={purchaseAmount.toString()}
              onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
              startContent="$"
              min="1000"
              max={availableCash}
              description={`Available cash: $${availableCash.toLocaleString()}`}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            color="primary"
            onPress={handlePurchase}
            isLoading={isPurchasing}
            isDisabled={purchaseAmount < 1000 || purchaseAmount > availableCash}
          >
            {isPurchasing ? 'Purchasing...' : 'Purchase Investment'}
          </Button>
        </CardBody>
      </Card>

      {/* Portfolio Rebalancing */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Rebalance Portfolio</h3>
          <p className="text-gray-600">Adjust your target allocations</p>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(targetAllocations).map(([type, percentage]) => (
              <div key={type} className="space-y-2">
                <label className="text-sm font-medium">{type} Target (%)</label>
                <Input
                  type="number"
                  value={percentage.toString()}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    setTargetAllocations(prev => ({ ...prev, [type]: newValue }));
                  }}
                  min="0"
                  max="100"
                />
                <div className="text-xs text-gray-600">
                  Current: {currentAllocations[type as InvestmentType].toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Total: {Object.values(targetAllocations).reduce((sum, val) => sum + val, 0)}% (must equal 100%)
          </div>

          <Button
            color="secondary"
            onPress={handleRebalance}
            isLoading={isRebalancing}
            isDisabled={Object.values(targetAllocations).reduce((sum, val) => sum + val, 0) !== 100}
          >
            {isRebalancing ? 'Rebalancing...' : 'Rebalance Portfolio'}
          </Button>
        </CardBody>
      </Card>

      {/* Investment Holdings */}
      {portfolio.investments.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Investment Holdings</h3>
          </CardHeader>

          <CardBody>
            <Table aria-label="Investment holdings">
              <TableHeader>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>PURCHASE PRICE</TableColumn>
                <TableColumn>CURRENT VALUE</TableColumn>
                <TableColumn>GAIN/LOSS</TableColumn>
                <TableColumn>DIVIDEND</TableColumn>
              </TableHeader>
              <TableBody>
                {portfolio.investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {investment.type}
                      </Chip>
                    </TableCell>
                    <TableCell>{investment.quantity}</TableCell>
                    <TableCell>${investment.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>${investment.currentValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        color={getPerformanceColor(investment.currentValue - (investment.purchasePrice * investment.quantity))}
                        variant="flat"
                      >
                        ${(investment.currentValue - (investment.purchasePrice * investment.quantity)).toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>${investment.monthlyDividend.toLocaleString()}</TableCell>
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