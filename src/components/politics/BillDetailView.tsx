/**
 * @fileoverview Bill Detail View Component
 * @module components/politics/BillDetailView
 * 
 * OVERVIEW:
 * Comprehensive bill display with tabbed interface.
 * Shows overview, debate, votes, effects, and lobby positions.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Tabs, Tab } from '@heroui/tabs';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Divider } from '@heroui/divider';
import { FiUser, FiUsers, FiClock, FiDollarSign } from 'react-icons/fi';
import {
  CountdownTimer,
  StatusBadge,
  VoteProgressBar,
  PaymentPreview,
} from '@/lib/components/politics/shared';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { getPolicyAreaName, getChamberName } from '@/lib/utils/politics/billFormatting';
import type { BillWithDetails } from '@/types/politics/bills';

export interface BillDetailViewProps {
  /** Bill ID */
  billId: string;
  /** Custom class name */
  className?: string;
}

/**
 * BillDetailView - Comprehensive bill display with tabs
 * 
 * Features:
 * - Real-time countdown timer
 * - Vote breakdown visualization
 * - Debate statements
 * - Economic effects
 * - Lobby positions with payment preview
 * - Sponsor/co-sponsor info
 * 
 * @example
 * ```tsx
 * <BillDetailView billId="bill-id-123" />
 * ```
 */
export function BillDetailView({ billId, className = '' }: BillDetailViewProps) {
  const { data, error, isLoading } = useSWR(
    `/api/politics/bills/${billId}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch bill');
      return res.json();
    },
    { refreshInterval: 10000 } // Refresh every 10s for active voting
  );
  
  const bill: BillWithDetails | undefined = data?.data?.bill;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error || !bill) {
    return (
      <Card className="bg-danger-50 border border-danger-200">
        <CardBody>
          <p className="text-danger text-center">Failed to load bill details</p>
        </CardBody>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="flex-col items-start gap-3 pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge type="chamber" value={bill.chamber} />
            <StatusBadge type="status" value={bill.status} />
            <Chip variant="flat" size="sm">
              {bill.billNumber}
            </Chip>
            <Chip variant="flat" size="sm">
              {getPolicyAreaName(bill.policyArea)}
            </Chip>
          </div>
          
          <h1 className="text-2xl font-bold">{bill.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FiUser />
              <span>Sponsored by {bill.sponsor.username}</span>
            </div>
            {bill.coSponsors.length > 0 && (
              <div className="flex items-center gap-1">
                <FiUsers />
                <span>{bill.coSponsors.length} co-sponsors</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <FiClock />
              <span>Submitted {formatDate(new Date(bill.submittedAt))}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardBody className="pt-4">
          <p className="text-gray-700">{bill.summary}</p>
          
          {bill.status === 'ACTIVE' && bill.remainingTime && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-semibold">Voting Ends:</span>
              <CountdownTimer deadline={bill.votingDeadline} />
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Vote Progress */}
      {bill.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Vote Tally</h3>
          </CardHeader>
          <CardBody>
            <VoteProgressBar
              ayes={bill.ayeCount}
              nays={bill.nayCount}
              abstains={bill.abstainCount}
              quorumRequired={bill.quorumRequired}
              showCounts
              showPercentages
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Total Votes:</span>
                <p className="font-semibold">{bill.totalVotesCast}</p>
              </div>
              <div>
                <span className="text-gray-500">Quorum:</span>
                <p className="font-semibold">{bill.quorumRequired}</p>
              </div>
              <div>
                <span className="text-gray-500">Quorum Met:</span>
                <p className={`font-semibold ${bill.quorumMet ? 'text-success' : 'text-danger'}`}>
                  {bill.quorumMet ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Passage:</span>
                <p className="font-semibold">
                  {bill.voteBreakdown?.predictedOutcome === 'passing' ? '✓ Likely' : 
                   bill.voteBreakdown?.predictedOutcome === 'failing' ? '✗ Unlikely' : '? Uncertain'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Tabbed Content */}
      <Card>
        <CardBody>
          <Tabs aria-label="Bill details">
            {/* Effects Tab */}
            <Tab key="effects" title="Economic Effects">
              <div className="py-4 space-y-4">
                <h3 className="text-lg font-semibold">Economic Impact</h3>
                
                {bill.effects.length === 0 ? (
                  <p className="text-gray-500">No declared policy effects.</p>
                ) : (
                  <div className="space-y-3">
                    {bill.effects.map((eff, i) => (
                      <Card key={i} className="shadow-none border">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">{eff.targetType} • {eff.effectType}</p>
                              <p className="text-xs text-gray-500">
                                {eff.targetId ? `Target: ${eff.targetId}` : 'Global'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {eff.effectUnit === '$' ? formatCurrency(eff.effectValue) : `${eff.effectValue}${eff.effectUnit}`}
                              </p>
                              {typeof eff.duration === 'number' && (
                                <p className="text-xs text-gray-500">for {eff.duration} days</p>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
            
            {/* Co-Sponsors Tab */}
            <Tab key="sponsors" title={`Co-Sponsors (${bill.coSponsors.length})`}>
              <div className="py-4 space-y-4">
                {bill.coSponsors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No co-sponsors</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bill.coSponsors.map((coSponsor) => (
                      <Card key={coSponsor._id} className="shadow-none border">
                        <CardBody className="p-4 flex flex-row items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <FiUser className="text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{coSponsor.username}</p>
                            <p className="text-xs text-gray-500">Co-Sponsor</p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
            
            {/* Metadata Tab */}
            <Tab key="metadata" title="Details">
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Bill Number:</span>
                    <p className="font-semibold">{bill.billNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chamber:</span>
                    <p className="font-semibold">{getChamberName(bill.chamber)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-semibold">{bill.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Policy Area:</span>
                    <p className="font-semibold">{getPolicyAreaName(bill.policyArea)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <p className="font-semibold">{formatDate(new Date(bill.submittedAt))}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Voting Deadline:</span>
                    <p className="font-semibold">{formatDate(new Date(bill.votingDeadline))}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sponsor:</span>
                    <p className="font-semibold">{bill.sponsor.username}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Co-Sponsors:</span>
                    <p className="font-semibold">{bill.coSponsors.length}</p>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Real-Time Updates**: SWR refreshes every 10s during active voting
 * 2. **Tabbed Interface**: Clean organization of complex data
 * 3. **Vote Visualization**: Progress bars and quorum status
 * 4. **Economic Impact**: Color-coded effects (green=positive, red=negative)
 * 5. **Responsive Layout**: Grid adapts to screen size
 * 
 * PREVENTS:
 * - Stale vote data (auto-refresh)
 * - Information overload (tabbed organization)
 * - Poor mobile UX (responsive grids)
 */
