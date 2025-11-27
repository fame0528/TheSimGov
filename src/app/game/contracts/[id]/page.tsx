/**
 * @fileoverview Contract Detail Page
 * @module app/(game)/contracts/[id]
 * 
 * OVERVIEW:
 * Contract details with bid submission form.
 * Shows requirements, client info, timeline, and upfront cost.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { Divider } from '@heroui/divider';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { useContract, useBidContract } from '@/lib/hooks/useContract';
import { useCompany } from '@/lib/hooks/useCompany';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Contract Detail Page
 */
export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [bidAmount, setBidAmount] = useState<string>('');

  // Fetch contract directly with SWR
  const { data: contract, isLoading, error } = useSWR(
    `/api/contracts/${params.id}`,
    fetcher
  );

  const { data: company } = useCompany(companyId || '');
  const { bid, isLoading: submitting } = useBidContract();

  /**
   * Handle bid submission
   */
  const handleSubmitBid = async () => {
    if (!companyId || !contract) return;

    try {
      const amount = bidAmount ? parseFloat(bidAmount) : contract.baseValue;
      
      await bid(params.id, companyId, amount);
      
      router.push(`/contracts/active?companyId=${companyId}`);
    } catch (err: any) {
      // Error handled by ErrorMessage component
      console.error('Bid failed:', err.message);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error="Failed to load contract" />;
  if (!contract) return <ErrorMessage error="Contract not found" />;

  const canBid = contract.status === 'marketplace' && !contract.isExpired;
  const hasEnoughCash = company && company.cash >= contract.upfrontCost;

  return (
    <DashboardLayout
      title={contract.title}
      subtitle={`${contract.clientName} • ${contract.clientIndustry}`}
      maxWidth="container.lg"
    >
      <div className="flex flex-col gap-6">
        {/* Status & Tier */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Chip color={contract.status === 'marketplace' ? 'primary' : 'secondary'} size="sm">
              {contract.status.toUpperCase()}
            </Chip>
            <Chip color="warning" size="sm">
              Tier {contract.difficulty}
            </Chip>
          </div>
          <Button variant="light" onPress={() => router.back()}>
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Description */}
            <Card>
              <div className="flex flex-col gap-4">
                <p className="text-lg font-semibold">Contract Description</p>
                <p className="text-gray-700 dark:text-gray-300">{contract.description}</p>
              </div>
            </Card>

            {/* Requirements */}
            <Card>
              <div className="flex flex-col gap-4">
                <p className="text-lg font-semibold">Skill Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium">Technical</p>
                    <Progress value={contract.requirements.technical} maxValue={100} size="sm" color="primary" className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{contract.requirements.technical}/100</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Leadership</p>
                    <Progress value={contract.requirements.leadership} maxValue={100} size="sm" color="secondary" className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{contract.requirements.leadership}/100</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <Progress value={contract.requirements.industry} maxValue={100} size="sm" color="success" className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{contract.requirements.industry}/100</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Operations</p>
                    <Progress value={contract.requirements.operations} maxValue={100} size="sm" color="warning" className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{contract.requirements.operations}/100</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average requirement: {Math.round(contract.avgRequirement || 0)}/100
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Financial Details */}
            <Card>
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold">Financial</p>
                <Divider />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Base Value</span>
                  <span className="font-bold">${contract.baseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Upfront Cost (10%)</span>
                  <span className="text-orange-600 dark:text-orange-400">${contract.upfrontCost.toLocaleString()}</span>
                </div>
                {company && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Cash</span>
                    <span className={hasEnoughCash ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      ${company.cash.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold">Timeline</p>
                <Divider />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                  <span>{contract.durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Required Employees</span>
                  <span>{contract.requiredEmployeeCount || 1}</span>
                </div>
              </div>
            </Card>

            {/* Bid Form */}
            {canBid && companyId && (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex flex-col gap-4">
                  <p className="text-lg font-semibold">Submit Bid</p>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Bid Amount (Optional)</label>
                    <Input
                      type="number"
                      placeholder={contract.baseValue.toString()}
                      value={bidAmount}
                      onValueChange={setBidAmount}
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Leave empty to bid base value. Higher bids increase win chance.
                    </p>
                  </div>

                  {!hasEnoughCash && (
                    <p className="text-sm text-red-500">
                      ⚠️ Insufficient funds for upfront cost
                    </p>
                  )}

                  <Button
                    color="primary"
                    size="lg"
                    onPress={handleSubmitBid}
                    isLoading={submitting}
                    isDisabled={!hasEnoughCash}
                  >
                    Submit Bid
                  </Button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    ${contract.upfrontCost.toLocaleString()} will be deducted immediately
                  </p>
                </div>
              </div>
            )}

            {contract.isExpired && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  ⚠️ This contract has expired
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Bid Submission**: Optional higher bid for competitive advantage
 * 2. **Cash Validation**: Prevents bids without sufficient funds
 * 3. **Skill Preview**: Shows top 4 requirements with progress bars
 * 4. **Upfront Cost**: Clear display of 10% deposit required
 * 5. **Expiration Check**: Disables bidding on expired contracts
 * 
 * DISPLAYS:
 * - Contract description and client info
 * - Skill requirements with visual progress
 * - Financial breakdown (base value, upfront, company cash)
 * - Timeline and employee count needed
 * - Bid form with validation
 */
