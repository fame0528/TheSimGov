/**
 * @fileoverview Player Bank Creator Component
 * @module components/banking/PlayerBankCreator
 *
 * OVERVIEW:
 * Component for creating and managing player-owned banks with
 * custom settings and investment portfolios.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Alert } from '@heroui/alert';
import { Badge } from '@heroui/badge';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import type { PlayerBankCreationData, Bank, InvestmentPortfolio } from '@/lib/types/models';

interface PlayerBankCreatorProps {
  companyId: string;
  availableCash: number;
  onBankCreate: (bankData: PlayerBankCreationData) => Promise<void>;
  onPortfolioCreate: (portfolioData: any) => Promise<void>;
}

interface BankCreationForm {
  name: string;
  description: string;
  personality: 'CONSERVATIVE' | 'AGGRESSIVE' | 'BALANCED' | 'SPECIALIZED';
  minCreditScore: number;
  maxLoanAmount: number;
  baseInterestRate: number;
  initialCapital: number;
  services: {
    loans: boolean;
    investments: boolean;
    savings: boolean;
    insurance: boolean;
  };
}

interface PortfolioCreationForm {
  name: string;
  description: string;
  initialInvestment: number;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  targetAllocations: {
    stocks: number;
    bonds: number;
    mutualFunds: number;
    etfs: number;
  };
}

export default function PlayerBankCreator({
  companyId,
  availableCash,
  onBankCreate,
  onPortfolioCreate,
}: PlayerBankCreatorProps) {
  // State
  const [activeTab, setActiveTab] = useState<'bank' | 'portfolio'>('bank');
  const [existingBanks, setExistingBanks] = useState<Bank[]>([]);
  const [existingPortfolios, setExistingPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank creation form
  const [bankForm, setBankForm] = useState<BankCreationForm>({
    name: '',
    description: '',
    personality: 'BALANCED',
    minCreditScore: 550,
    maxLoanAmount: 1000000,
    baseInterestRate: 8.5,
    initialCapital: 100000,
    services: {
      loans: true,
      investments: true,
      savings: false,
      insurance: false,
    },
  });

  // Portfolio creation form
  const [portfolioForm, setPortfolioForm] = useState<PortfolioCreationForm>({
    name: '',
    description: '',
    initialInvestment: 50000,
    riskTolerance: 'MEDIUM',
    targetAllocations: {
      stocks: 40,
      bonds: 30,
      mutualFunds: 20,
      etfs: 10,
    },
  });

  // Load existing banks and portfolios
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Load player banks
        const banksResponse = await fetch(`/api/banking/player/banks?companyId=${companyId}`);
        if (banksResponse.ok) {
          const banks = await banksResponse.json();
          setExistingBanks(banks);
        }

        // Load investment portfolios
        const portfoliosResponse = await fetch(`/api/banking/investments/portfolios?companyId=${companyId}`);
        if (portfoliosResponse.ok) {
          const portfolios = await portfoliosResponse.json();
          setExistingPortfolios(portfolios);
        }
      } catch (err) {
        console.error('Failed to load existing data:', err);
      }
    };

    if (companyId) {
      loadExistingData();
    }
  }, [companyId]);

  // Handle bank creation
  const handleBankCreate = async () => {
    if (!bankForm.name.trim() || bankForm.initialCapital > availableCash) {
      setError('Please provide a bank name and ensure sufficient capital');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onBankCreate({
        name: bankForm.name,
        description: bankForm.description,
        personality: bankForm.personality,
        minCreditScore: bankForm.minCreditScore,
        maxLoanAmount: bankForm.maxLoanAmount,
        baseInterestRate: bankForm.baseInterestRate,
        initialCapital: bankForm.initialCapital,
        services: bankForm.services,
      });

      // Reset form
      setBankForm({
        name: '',
        description: '',
        personality: 'BALANCED',
        minCreditScore: 550,
        maxLoanAmount: 1000000,
        baseInterestRate: 8.5,
        initialCapital: 100000,
        services: {
          loans: true,
          investments: true,
          savings: false,
          insurance: false,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bank creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle portfolio creation
  const handlePortfolioCreate = async () => {
    if (!portfolioForm.name.trim() || portfolioForm.initialInvestment > availableCash) {
      setError('Please provide a portfolio name and ensure sufficient funds');
      return;
    }

    // Validate allocations total 100%
    const total = Object.values(portfolioForm.targetAllocations).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      setError('Target allocations must total 100%');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onPortfolioCreate({
        name: portfolioForm.name,
        description: portfolioForm.description,
        initialInvestment: portfolioForm.initialInvestment,
        riskTolerance: portfolioForm.riskTolerance,
        targetAllocations: portfolioForm.targetAllocations,
      });

      // Reset form
      setPortfolioForm({
        name: '',
        description: '',
        initialInvestment: 50000,
        riskTolerance: 'MEDIUM',
        targetAllocations: {
          stocks: 40,
          bonds: 30,
          mutualFunds: 20,
          etfs: 10,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portfolio creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  // Update portfolio allocations
  const updateAllocation = (type: keyof PortfolioCreationForm['targetAllocations'], value: number) => {
    setPortfolioForm(prev => ({
      ...prev,
      targetAllocations: {
        ...prev.targetAllocations,
        [type]: value,
      },
    }));
  };

  // Get personality description
  const getPersonalityDescription = (personality: string) => {
    switch (personality) {
      case 'CONSERVATIVE':
        return 'Focuses on low-risk lending with higher credit score requirements';
      case 'AGGRESSIVE':
        return 'Takes more risks for higher returns, more lenient approval criteria';
      case 'BALANCED':
        return 'Balanced approach to risk and reward';
      case 'SPECIALIZED':
        return 'Specializes in specific types of loans or investments';
      default:
        return '';
    }
  };

  // Get risk tolerance description
  const getRiskDescription = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'Conservative investments with lower potential returns but higher stability';
      case 'MEDIUM':
        return 'Balanced risk/reward ratio suitable for most investors';
      case 'HIGH':
        return 'Aggressive investments with higher potential returns but increased volatility';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Bank Management</h2>
          <p className="text-gray-600">Create and manage your own banking institutions</p>
        </CardHeader>

        <CardBody>
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === 'bank' ? 'solid' : 'bordered'}
              onPress={() => setActiveTab('bank')}
            >
              Create Bank
            </Button>
            <Button
              variant={activeTab === 'portfolio' ? 'solid' : 'bordered'}
              onPress={() => setActiveTab('portfolio')}
            >
              Investment Portfolio
            </Button>
          </div>

          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Bank Creation Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  value={bankForm.name}
                  onChange={(e) => setBankForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My National Bank"
                  required
                />

                <Select
                  label="Bank Personality"
                  selectedKeys={[bankForm.personality]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as typeof bankForm.personality;
                    setBankForm(prev => ({ ...prev, personality: selected }));
                  }}
                >
                  <SelectItem key="CONSERVATIVE" textValue="Conservative">
                    <div>
                      <div className="font-medium">Conservative</div>
                      <div className="text-sm text-gray-600">{getPersonalityDescription('CONSERVATIVE')}</div>
                    </div>
                  </SelectItem>
                  <SelectItem key="AGGRESSIVE" textValue="Aggressive">
                    <div>
                      <div className="font-medium">Aggressive</div>
                      <div className="text-sm text-gray-600">{getPersonalityDescription('AGGRESSIVE')}</div>
                    </div>
                  </SelectItem>
                  <SelectItem key="BALANCED" textValue="Balanced">
                    <div>
                      <div className="font-medium">Balanced</div>
                      <div className="text-sm text-gray-600">{getPersonalityDescription('BALANCED')}</div>
                    </div>
                  </SelectItem>
                  <SelectItem key="SPECIALIZED" textValue="Specialized">
                    <div>
                      <div className="font-medium">Specialized</div>
                      <div className="text-sm text-gray-600">{getPersonalityDescription('SPECIALIZED')}</div>
                    </div>
                  </SelectItem>
                </Select>
              </div>

              <Textarea
                label="Bank Description"
                value={bankForm.description}
                onChange={(e) => setBankForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A trusted financial institution serving businesses nationwide..."
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Minimum Credit Score"
                  type="number"
                  value={bankForm.minCreditScore.toString()}
                  onChange={(e) => setBankForm(prev => ({ ...prev, minCreditScore: parseInt(e.target.value) || 550 }))}
                  min="300"
                  max="850"
                />

                <Input
                  label="Maximum Loan Amount"
                  type="number"
                  value={bankForm.maxLoanAmount.toString()}
                  onChange={(e) => setBankForm(prev => ({ ...prev, maxLoanAmount: parseInt(e.target.value) || 1000000 }))}
                  startContent="$"
                  min="10000"
                />

                <Input
                  label="Base Interest Rate (%)"
                  type="number"
                  value={bankForm.baseInterestRate.toString()}
                  onChange={(e) => setBankForm(prev => ({ ...prev, baseInterestRate: parseFloat(e.target.value) || 8.5 }))}
                  step="0.1"
                  min="1"
                  max="25"
                />
              </div>

              <Input
                label="Initial Capital Investment"
                type="number"
                value={bankForm.initialCapital.toString()}
                onChange={(e) => setBankForm(prev => ({ ...prev, initialCapital: parseInt(e.target.value) || 100000 }))}
                startContent="$"
                min="50000"
                max={availableCash}
                description={`Available cash: $${availableCash.toLocaleString()}`}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Bank Services</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(bankForm.services).map(([service, enabled]) => (
                    <Checkbox
                      key={service}
                      isSelected={enabled}
                      onValueChange={(checked) => setBankForm(prev => ({
                        ...prev,
                        services: { ...prev.services, [service]: checked }
                      }))}
                    >
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </Checkbox>
                  ))}
                </div>
              </div>

              <Button
                color="primary"
                onPress={handleBankCreate}
                isLoading={isCreating}
                isDisabled={!bankForm.name.trim() || bankForm.initialCapital > availableCash}
              >
                {isCreating ? 'Creating Bank...' : 'Create Bank'}
              </Button>
            </div>
          )}

          {/* Portfolio Creation Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Portfolio Name"
                  value={portfolioForm.name}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Growth Portfolio"
                  required
                />

                <Select
                  label="Risk Tolerance"
                  selectedKeys={[portfolioForm.riskTolerance]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as typeof portfolioForm.riskTolerance;
                    setPortfolioForm(prev => ({ ...prev, riskTolerance: selected }));
                  }}
                >
                  <SelectItem key="LOW" textValue="Low Risk">
                    <div>
                      <div className="font-medium">Low Risk</div>
                      <div className="text-sm text-gray-600">{getRiskDescription('LOW')}</div>
                    </div>
                  </SelectItem>
                  <SelectItem key="MEDIUM" textValue="Medium Risk">
                    <div>
                      <div className="font-medium">Medium Risk</div>
                      <div className="text-sm text-gray-600">{getRiskDescription('MEDIUM')}</div>
                    </div>
                  </SelectItem>
                  <SelectItem key="HIGH" textValue="High Risk">
                    <div>
                      <div className="font-medium">High Risk</div>
                      <div className="text-sm text-gray-600">{getRiskDescription('HIGH')}</div>
                    </div>
                  </SelectItem>
                </Select>
              </div>

              <Textarea
                label="Portfolio Description"
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A diversified portfolio focused on long-term growth..."
                rows={3}
              />

              <Input
                label="Initial Investment"
                type="number"
                value={portfolioForm.initialInvestment.toString()}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, initialInvestment: parseInt(e.target.value) || 50000 }))}
                startContent="$"
                min="10000"
                max={availableCash}
                description={`Available cash: $${availableCash.toLocaleString()}`}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Target Allocations (%)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(portfolioForm.targetAllocations).map(([type, percentage]) => (
                    <Input
                      key={type}
                      label={type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      type="number"
                      value={percentage.toString()}
                      onChange={(e) => updateAllocation(type as keyof typeof portfolioForm.targetAllocations, parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Total: {Object.values(portfolioForm.targetAllocations).reduce((sum, val) => sum + val, 0)}% (must equal 100%)
                </div>
              </div>

              <Button
                color="primary"
                onPress={handlePortfolioCreate}
                isLoading={isCreating}
                isDisabled={
                  !portfolioForm.name.trim() ||
                  portfolioForm.initialInvestment > availableCash ||
                  Object.values(portfolioForm.targetAllocations).reduce((sum, val) => sum + val, 0) !== 100
                }
              >
                {isCreating ? 'Creating Portfolio...' : 'Create Portfolio'}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Existing Banks */}
      {existingBanks.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Banks</h3>
          </CardHeader>

          <CardBody>
            <Table aria-label="Your banks">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>PERSONALITY</TableColumn>
                <TableColumn>CAPITAL</TableColumn>
                <TableColumn>SERVICES</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {existingBanks.map((bank) => (
                  <TableRow key={bank.id}>
                    <TableCell>{bank.name}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {bank.personality}
                      </Chip>
                    </TableCell>
                    <TableCell>${bank.capital?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {bank.services?.loans && <Badge variant="flat">Loans</Badge>}
                        {bank.services?.investments && <Badge variant="flat">Investments</Badge>}
                        {bank.services?.savings && <Badge variant="flat">Savings</Badge>}
                        {bank.services?.insurance && <Badge variant="flat">Insurance</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color="success" variant="flat">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Existing Portfolios */}
      {existingPortfolios.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Portfolios</h3>
          </CardHeader>

          <CardBody>
            <Table aria-label="Your portfolios">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>RISK</TableColumn>
                <TableColumn>VALUE</TableColumn>
                <TableColumn>RETURN</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {existingPortfolios.map((portfolio) => (
                  <TableRow key={portfolio.id}>
                    <TableCell>{portfolio.name}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {portfolio.riskTolerance}
                      </Chip>
                    </TableCell>
                    <TableCell>${portfolio.totalValue?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        color={(portfolio.totalReturn || 0) >= 0 ? 'success' : 'danger'}
                        variant="flat"
                      >
                        {portfolio.totalReturn?.toFixed(2) || '0.00'}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color="success" variant="flat">Active</Badge>
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