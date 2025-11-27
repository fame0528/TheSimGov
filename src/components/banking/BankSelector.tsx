/**
 * @fileoverview NPC Bank Selector Component
 * @module components/banking/BankSelector
 *
 * OVERVIEW:
 * Component for selecting NPC banks with personality descriptions,
 * approval rates, and interest rate information.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { RadioGroup, Radio } from '@heroui/radio';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Progress } from '@heroui/progress';
import type { Bank, BankSelectionData } from '@/lib/types/models';

interface BankSelectorProps {
  companyId: string;
  creditScore: number;
  loanAmount: number;
  loanType: string;
  onBankSelect: (selection: BankSelectionData) => void;
  selectedBankId?: string;
}

interface BankWithApproval extends Bank {
  approvalChance: number;
  offeredRate: number;
  reasoning: string;
}

export default function BankSelector({
  companyId,
  creditScore,
  loanAmount,
  loanType,
  onBankSelect,
  selectedBankId,
}: BankSelectorProps) {
  // State
  const [banks, setBanks] = useState<BankWithApproval[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>(selectedBankId || '');
  const [isLoading, setIsLoading] = useState(true);

  // Load banks with approval calculations
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/banking/banks');
        if (response.ok) {
          const data = await response.json();
          const banksData: Bank[] = data.banks;

          // Calculate approval chances and rates for each bank
          const banksWithApproval: BankWithApproval[] = banksData.map(bank => {
            const approvalChance = calculateApprovalChance(bank, creditScore, loanAmount, loanType);
            const offeredRate = calculateOfferedRate(bank, creditScore, loanAmount, loanType);

            return {
              ...bank,
              approvalChance,
              offeredRate,
              reasoning: getApprovalReasoning(bank, creditScore, loanAmount, loanType),
            };
          });

          setBanks(banksWithApproval);
        }
      } catch (err) {
        console.error('Failed to load banks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId && creditScore && loanAmount) {
      loadBanks();
    }
  }, [companyId, creditScore, loanAmount, loanType]);

  // Calculate approval chance based on bank personality and applicant factors
  const calculateApprovalChance = (bank: Bank, creditScore: number, loanAmount: number, loanType: string): number => {
    let baseChance = 50; // Base 50% chance

    // Credit score impact (300-850 scale)
    if (creditScore >= 750) baseChance += 30;
    else if (creditScore >= 650) baseChance += 15;
    else if (creditScore >= 550) baseChance += 5;
    else if (creditScore < 450) baseChance -= 20;

    // Bank personality modifiers
    switch (bank.personality) {
      case 'CONSERVATIVE':
        baseChance -= 10; // More strict
        break;
      case 'AGGRESSIVE':
        baseChance += 15; // More lenient
        break;
      case 'BALANCED':
        // No modifier
        break;
      case 'SPECIALIZED':
        // Specialty banks have different criteria
        if (loanType === 'BUSINESS_LOAN') baseChance += 10;
        else baseChance -= 5;
        break;
    }

    // Loan amount impact (larger loans harder to approve)
    if (loanAmount > 1000000) baseChance -= 15;
    else if (loanAmount > 500000) baseChance -= 10;
    else if (loanAmount > 100000) baseChance -= 5;

    return Math.max(5, Math.min(95, baseChance)); // Clamp between 5-95%
  };

  // Calculate offered interest rate
  const calculateOfferedRate = (bank: Bank, creditScore: number, loanAmount: number, loanType: string): number => {
    let baseRate = 8.5; // Base rate

    // Credit score impact
    if (creditScore >= 750) baseRate -= 2.0;
    else if (creditScore >= 650) baseRate -= 1.0;
    else if (creditScore >= 550) baseRate -= 0.5;
    else if (creditScore < 450) baseRate += 2.0;

    // Bank personality modifiers
    switch (bank.personality) {
      case 'CONSERVATIVE':
        baseRate += 0.5; // Higher rates for conservative banks
        break;
      case 'AGGRESSIVE':
        baseRate -= 0.5; // Lower rates for aggressive banks
        break;
      case 'BALANCED':
        // No modifier
        break;
      case 'SPECIALIZED':
        // Specialty rates vary by loan type
        if (loanType === 'BUSINESS_LOAN') baseRate -= 0.3;
        else baseRate += 0.2;
        break;
    }

    // Loan amount impact
    if (loanAmount > 1000000) baseRate += 0.5;
    else if (loanAmount > 500000) baseRate += 0.3;

    return Math.max(3.0, Math.min(25.0, baseRate)); // Clamp between 3-25%
  };

  // Get reasoning for approval chance
  const getApprovalReasoning = (bank: Bank, creditScore: number, loanAmount: number, loanType: string): string => {
    const reasons = [];

    if (creditScore >= 750) reasons.push('Excellent credit score');
    else if (creditScore >= 650) reasons.push('Good credit score');
    else if (creditScore >= 550) reasons.push('Fair credit score');
    else reasons.push('Poor credit score');

    switch (bank.personality) {
      case 'CONSERVATIVE':
        reasons.push('Conservative lending policies');
        break;
      case 'AGGRESSIVE':
        reasons.push('Aggressive lending approach');
        break;
      case 'BALANCED':
        reasons.push('Balanced risk assessment');
        break;
      case 'SPECIALIZED':
        if (loanType === 'BUSINESS_LOAN') reasons.push('Specializes in business loans');
        else reasons.push('Specialized lending focus');
        break;
    }

    if (loanAmount > 500000) reasons.push('Large loan amount');

    return reasons.join(', ');
  };

  // Handle bank selection
  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      onBankSelect({
        bankId: bank.id,
        bankName: bank.name,
        approvalChance: bank.approvalChance,
        offeredRate: bank.offeredRate,
      });
    }
  };

  // Get approval chance color
  const getApprovalColor = (chance: number) => {
    if (chance >= 80) return 'success';
    if (chance >= 60) return 'warning';
    return 'danger';
  };

  // Get personality color
  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case 'CONSERVATIVE': return 'secondary';
      case 'AGGRESSIVE': return 'danger';
      case 'BALANCED': return 'primary';
      case 'SPECIALIZED': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">Loading banks...</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Selection */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Select a Bank</h2>
          <p className="text-gray-600">
            Choose an NPC bank for your loan application. Each bank has different approval criteria and rates.
          </p>
        </CardHeader>

        <CardBody>
          <RadioGroup
            value={selectedBank}
            onValueChange={handleBankSelect}
            className="space-y-4"
          >
            {banks.map((bank) => (
              <div key={bank.id} className="border rounded-lg p-4">
                <Radio value={bank.id} className="w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{bank.name}</h3>
                        <Chip
                          size="sm"
                          color={getPersonalityColor(bank.personality || 'CONSERVATIVE')}
                          variant="flat"
                        >
                          {bank.personality || 'CONSERVATIVE'}
                        </Chip>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{bank.description || 'A reliable banking partner for your business needs.'}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Approval Chance</div>
                          <Badge color={getApprovalColor(bank.approvalChance)} variant="flat">
                            {bank.approvalChance}%
                          </Badge>
                        </div>

                        <div>
                          <div className="font-medium">Offered Rate</div>
                          <div className="text-lg font-semibold">{bank.offeredRate.toFixed(2)}%</div>
                        </div>

                        <div>
                          <div className="font-medium">Min Credit Score</div>
                          <div>{bank.minCreditScore}</div>
                        </div>

                        <div>
                          <div className="font-medium">Max Loan Amount</div>
                          <div>${bank.maxLoanAmount.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Approval Factors:</div>
                        <div className="text-xs text-gray-600">{bank.reasoning}</div>
                      </div>
                    </div>
                  </div>
                </Radio>
              </div>
            ))}
          </RadioGroup>
        </CardBody>
      </Card>

      {/* Selected Bank Summary */}
      {selectedBank && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Selected Bank Summary</h3>
          </CardHeader>

          <CardBody>
            {(() => {
              const bank = banks.find(b => b.id === selectedBank);
              if (!bank) return null;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{bank.name}</div>
                      <Chip color={getPersonalityColor(bank.personality || 'CONSERVATIVE')} variant="flat" className="mt-1">
                        {bank.personality || 'CONSERVATIVE'}
                      </Chip>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{bank.approvalChance}%</div>
                      <div className="text-sm text-gray-600">Approval Chance</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{bank.offeredRate.toFixed(2)}%</div>
                      <div className="text-sm text-gray-600">Interest Rate</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Loan Terms Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Loan Amount</div>
                        <div className="font-medium">${loanAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Monthly Payment</div>
                        <div className="font-medium">
                          ${(loanAmount * (bank.offeredRate / 100 / 12) / (1 - Math.pow(1 + bank.offeredRate / 100 / 12, -60))).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Interest</div>
                        <div className="font-medium">
                          ${(loanAmount * (bank.offeredRate / 100 / 12) / (1 - Math.pow(1 + bank.offeredRate / 100 / 12, -60)) * 60 - loanAmount).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Cost</div>
                        <div className="font-medium">
                          ${(loanAmount * (bank.offeredRate / 100 / 12) / (1 - Math.pow(1 + bank.offeredRate / 100 / 12, -60)) * 60).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardBody>
        </Card>
      )}
    </div>
  );
}