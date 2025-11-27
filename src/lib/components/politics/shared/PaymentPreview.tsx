/**
 * @fileoverview Payment Preview Component
 * @module lib/components/politics/shared/PaymentPreview
 * 
 * OVERVIEW:
 * Display component for lobby payment calculations.
 * Shows potential earnings for voting positions with breakdown.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { Card, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { formatCurrency } from '@/lib/utils/currency';
import { formatLobbyType, getLobbyIcon } from '@/lib/utils/politics/billFormatting';

export interface PaymentPreviewProps {
  /** Vote option ('Aye' or 'Nay') */
  voteOption: 'Aye' | 'Nay';
  /** Total payment amount */
  totalPayment: number;
  /** Breakdown of payments by lobby */
  payments: Array<{
    lobbyType: string;
    amount: number;
  }>;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * PaymentPreview - Lobby payment calculation display
 * 
 * Features:
 * - Total payment highlight
 * - Per-lobby breakdown
 * - Vote option indicator
 * - Currency formatting
 * 
 * @example
 * ```tsx
 * <PaymentPreview
 *   voteOption="Aye"
 *   totalPayment={360000}
 *   payments={[
 *     { lobbyType: 'oil_gas', amount: 120000 },
 *     { lobbyType: 'renewable_energy', amount: 240000 },
 *   ]}
 *   showBreakdown
 * />
 * ```
 */
export function PaymentPreview({
  voteOption,
  totalPayment,
  payments,
  showBreakdown = true,
  className = '',
}: PaymentPreviewProps) {
  const hasPayments = totalPayment > 0 && payments.length > 0;
  
  if (!hasPayments) {
    return (
      <Card className={`bg-gray-50 ${className}`}>
        <CardBody className="p-4">
          <p className="text-sm text-gray-500 text-center">
            No lobby payments for {voteOption} vote
          </p>
        </CardBody>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardBody className="p-4 space-y-3">
        {/* Vote Option Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            If you vote {voteOption}:
          </span>
          <span className="text-xl font-bold text-success">
            {formatCurrency(totalPayment, 'compact')}
          </span>
        </div>
        
        {showBreakdown && payments.length > 0 && (
          <>
            <Divider />
            
            {/* Payment Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Payment Breakdown
              </p>
              
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getLobbyIcon(payment.lobbyType)}
                    </span>
                    <span className="text-sm text-gray-700">
                      {formatLobbyType(payment.lobbyType)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount, 'compact')}
                  </span>
                </div>
              ))}
            </div>
            
            {payments.length > 1 && (
              <>
                <Divider />
                <p className="text-xs text-gray-500 italic">
                  💡 Multiple lobbies can pay you on the same bill
                </p>
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Currency Formatting**: Uses formatCurrency with 'compact' mode ($1.5M)
 * 2. **Visual Hierarchy**: Total payment emphasized, breakdown secondary
 * 3. **Empty State**: Graceful handling when no payments available
 * 4. **Lobby Icons**: Visual identification for each lobby type
 * 5. **Educational**: Tooltip explains multiple lobby payments
 * 
 * PREVENTS:
 * - Inconsistent payment displays
 * - Missing payment breakdowns
 * - Confusion about multiple lobby payments
 */
