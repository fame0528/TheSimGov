/**
 * @fileoverview Lobby Offers Component
 * @module components/politics/LobbyOffers
 * 
 * OVERVIEW:
 * Display lobby positions with payment calculations.
 * Groups lobbies by stance (FOR/AGAINST/NEUTRAL).
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Divider } from '@heroui/divider';
import { FiDollarSign, FiInfo } from 'react-icons/fi';
import { PaymentPreview, StatusBadge } from '@/lib/components/politics/shared';
import { formatCurrency } from '@/lib/utils/currency';
import { formatLobbyType, getLobbyIcon } from '@/lib/utils/politics/billFormatting';
import type { Chamber } from '@/lib/db/models/Bill';
import type { LobbyPositionDisplay } from '@/types/politics/bills';

export interface LobbyOffersProps {
  /** Bill ID */
  billId: string;
  /** User's chamber (for payment preview) */
  chamber?: Chamber;
  /** User's state (for House payment calculation) */
  state?: string;
  /** User's seat count (for weighted payment) */
  seatCount?: number;
  /** Custom class name */
  className?: string;
}

/**
 * LobbyOffers - Display lobby positions with payment calculations
 * 
 * Features:
 * - Grouped by stance (FOR/AGAINST/NEUTRAL)
 * - Lobby icons and types
 * - Payment breakdown (Senate $120k, House $23k × delegation)
 * - Total payment preview
 * - Maximum payments per stance
 * 
 * @example
 * ```tsx
 * <LobbyOffers
 *   billId="bill-123"
 *   chamber="house"
 *   state="CA"
 *   seatCount={52}
 * />
 * ```
 */
export function LobbyOffers({
  billId,
  chamber,
  state,
  seatCount,
  className = '',
}: LobbyOffersProps) {
  // Build query string
  const queryParams = new URLSearchParams();
  if (chamber) queryParams.set('chamber', chamber);
  if (state) queryParams.set('state', state);
  if (seatCount) queryParams.set('seatCount', seatCount.toString());
  
  const { data, error, isLoading } = useSWR(
    `/api/politics/bills/${billId}/lobby?${queryParams.toString()}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch lobby positions');
      return res.json();
    },
    { refreshInterval: 30000 }
  );
  
  const grouped: {
    for: LobbyPositionDisplay[];
    against: LobbyPositionDisplay[];
    neutral: LobbyPositionDisplay[];
  } = data?.data?.grouped || { for: [], against: [], neutral: [] };
  const maxPayments = data?.data?.maxPayments;
  const paymentPreview = data?.data?.paymentPreview;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-danger-50 border border-danger-200">
        <CardBody>
          <p className="text-danger text-center">Failed to load lobby positions</p>
        </CardBody>
      </Card>
    );
  }
  
  const totalLobbies = grouped.for.length + grouped.against.length + grouped.neutral.length;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FiDollarSign className="text-primary text-xl" />
            <h3 className="text-lg font-semibold">Lobby Positions</h3>
          </div>
          
          <Chip variant="flat">
            {totalLobbies} {totalLobbies === 1 ? 'Lobby' : 'Lobbies'}
          </Chip>
        </CardHeader>
        
        <CardBody className="pt-0">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <FiInfo className="text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-sm text-blue-900">
              Multiple lobbies can pay you for the same vote. Your total payment is the sum of all
              lobbies supporting your choice.
            </p>
          </div>
        </CardBody>
      </Card>
      
      {/* Payment Preview */}
      {paymentPreview && chamber && (
        <Card>
          <CardHeader>
            <h4 className="font-semibold">Your Payment Preview</h4>
          </CardHeader>
          <CardBody className="pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">If you vote Aye:</p>
                <PaymentPreview
                  voteOption="Aye"
                  totalPayment={paymentPreview.ayePayment.totalPayment}
                  payments={paymentPreview.ayePayment.payments}
                  showBreakdown
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">If you vote Nay:</p>
                <PaymentPreview
                  voteOption="Nay"
                  totalPayment={paymentPreview.nayPayment.totalPayment}
                  payments={paymentPreview.nayPayment.payments}
                  showBreakdown
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Maximum Payments */}
      {maxPayments && (
        <Card>
          <CardHeader>
            <h4 className="font-semibold">Maximum Payments by Stance</h4>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-none border border-success-200 bg-success-50">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Max Aye</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(maxPayments.maxAyePayment)}
                  </p>
                </CardBody>
              </Card>
              
              <Card className="shadow-none border border-danger-200 bg-danger-50">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Max Nay</p>
                  <p className="text-xl font-bold text-danger">
                    {formatCurrency(maxPayments.maxNayPayment)}
                  </p>
                </CardBody>
              </Card>
              
              <Card className="shadow-none border border-gray-200 bg-gray-50">
                <CardBody className="p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Neutral</p>
                  <p className="text-xl font-bold text-gray-600">
                    {formatCurrency(0)}
                  </p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* FOR Lobbies */}
      {grouped.for.length > 0 && (
        <Card>
          <CardHeader className="bg-success-50">
            <div className="flex items-center gap-2">
              <StatusBadge type="position" value="FOR" size="sm" showIcon />
              <h4 className="font-semibold">Supporting Lobbies ({grouped.for.length})</h4>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="space-y-3">
              {grouped.for.map((lobby, i) => (
                <Card key={`${lobby.lobbyType}-for-${i}`} className="shadow-none border">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLobbyIcon(lobby.lobbyType)}</span>
                        <div>
                          <p className="font-semibold">{formatLobbyType(lobby.lobbyType)}</p>
                          <p className="text-sm text-gray-600">
                            Pays for <StatusBadge type="position" value="FOR" size="sm" /> votes
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(lobby.paymentPerSeat)}
                        </p>
                        <p className="text-xs text-gray-500">per vote</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* AGAINST Lobbies */}
      {grouped.against.length > 0 && (
        <Card>
          <CardHeader className="bg-danger-50">
            <div className="flex items-center gap-2">
              <StatusBadge type="position" value="AGAINST" size="sm" showIcon />
              <h4 className="font-semibold">Opposing Lobbies ({grouped.against.length})</h4>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="space-y-3">
              {grouped.against.map((lobby, i) => (
                <Card key={`${lobby.lobbyType}-against-${i}`} className="shadow-none border">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLobbyIcon(lobby.lobbyType)}</span>
                        <div>
                          <p className="font-semibold">{formatLobbyType(lobby.lobbyType)}</p>
                          <p className="text-sm text-gray-600">
                            Pays for <StatusBadge type="position" value="AGAINST" size="sm" /> votes
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-danger">
                          {formatCurrency(lobby.paymentPerSeat)}
                        </p>
                        <p className="text-xs text-gray-500">per vote</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* NEUTRAL Lobbies */}
      {grouped.neutral.length > 0 && (
        <Card>
          <CardHeader className="bg-gray-50">
            <div className="flex items-center gap-2">
              <StatusBadge type="position" value="NEUTRAL" size="sm" showIcon />
              <h4 className="font-semibold">Neutral Lobbies ({grouped.neutral.length})</h4>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            <div className="space-y-3">
              {grouped.neutral.map((lobby, i) => (
                <Card key={`${lobby.lobbyType}-neutral-${i}`} className="shadow-none border">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLobbyIcon(lobby.lobbyType)}</span>
                        <div>
                          <p className="font-semibold">{formatLobbyType(lobby.lobbyType)}</p>
                          <p className="text-sm text-gray-600">No payment offered</p>
                        </div>
                      </div>
                      
                      <Chip variant="flat" color="default">
                        Neutral
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* No Lobbies */}
      {totalLobbies === 0 && (
        <Card className="bg-gray-50">
          <CardBody>
            <p className="text-gray-500 text-center">No lobby positions on this bill</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Grouped Display**: Clear FOR/AGAINST/NEUTRAL sections
 * 2. **Payment Calculation**: Senate $120k, House $23k × delegation size
 * 3. **Multiple Payments**: Educational info about stacking payments
 * 4. **Visual Hierarchy**: Color-coded sections (green/red/gray)
 * 5. **Icons**: Lobby type icons for quick recognition
 * 
 * PREVENTS:
 * - Payment confusion (clear preview for Aye/Nay)
 * - Lobby spam appearance (grouped by stance)
 * - Missing information (max payments, stacking info)
 */
