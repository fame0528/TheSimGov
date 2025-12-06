/**
 * @fileoverview Action Result Modal Component
 * @module components/politics/actions/ActionResultModal
 * 
 * OVERVIEW:
 * Displays the result of an executed action with detailed breakdowns
 * of polling shifts, reputation changes, fundraising results, and
 * any special outcomes (endorsements, scandals, backfires).
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
  Progress,
} from '@heroui/react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Star,
  Newspaper,
  AlertOctagon,
} from 'lucide-react';
import { ActionType, ActionResultStatus, ACTION_DISPLAY_NAMES } from '@/lib/types/actions';

// ===================== TYPES =====================

export interface ActionResultData {
  status: ActionResultStatus;
  pollingShift?: number;
  reputationChange?: number;
  fundsRaised?: number;
  newDonors?: number;
  didBackfire: boolean;
  backfireReason?: string;
  endorsementTriggered?: boolean;
  scandalTriggered?: boolean;
  mediaBoost?: number;
  details: string;
}

export interface ActionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  result: ActionResultData | null;
}

// ===================== HELPERS =====================

const getStatusColor = (status: ActionResultStatus): "success" | "warning" | "danger" | "default" => {
  switch (status) {
    case ActionResultStatus.COMPLETED:
      return 'success';
    case ActionResultStatus.BACKFIRED:
      return 'danger';
    case ActionResultStatus.FAILED:
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: ActionResultStatus) => {
  switch (status) {
    case ActionResultStatus.COMPLETED:
      return <CheckCircle className="w-6 h-6 text-success" />;
    case ActionResultStatus.BACKFIRED:
      return <AlertTriangle className="w-6 h-6 text-danger" />;
    case ActionResultStatus.FAILED:
      return <XCircle className="w-6 h-6 text-warning" />;
    default:
      return null;
  }
};

const formatMoney = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
};

// ===================== COMPONENT =====================

export function ActionResultModal({
  isOpen,
  onClose,
  actionType,
  result,
}: ActionResultModalProps) {
  if (!result) return null;
  
  const isPositive = !result.didBackfire && (result.pollingShift ?? 0) > 0;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          {getStatusIcon(result.status)}
          <div>
            <h2 className="text-lg font-semibold">{ACTION_DISPLAY_NAMES[actionType]}</h2>
            <Chip
              size="sm"
              color={getStatusColor(result.status)}
              variant="flat"
            >
              {result.status === ActionResultStatus.COMPLETED && 'Success'}
              {result.status === ActionResultStatus.BACKFIRED && 'Backfired!'}
              {result.status === ActionResultStatus.FAILED && 'Failed'}
            </Chip>
          </div>
        </ModalHeader>
        
        <ModalBody className="space-y-4">
          {/* Backfire Warning */}
          {result.didBackfire && result.backfireReason && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-danger">Action Backfired!</p>
                  <p className="text-sm text-danger-600">{result.backfireReason}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Effects */}
          <div className="grid grid-cols-2 gap-4">
            {/* Polling Shift */}
            {result.pollingShift !== undefined && (
              <div className="bg-default-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {(result.pollingShift >= 0) ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-danger" />
                  )}
                  <span className="font-medium">Polling Impact</span>
                </div>
                <p className={`text-2xl font-bold ${result.pollingShift >= 0 ? 'text-success' : 'text-danger'}`}>
                  {result.pollingShift >= 0 ? '+' : ''}{result.pollingShift.toFixed(2)}%
                </p>
              </div>
            )}
            
            {/* Reputation Change */}
            {result.reputationChange !== undefined && (
              <div className="bg-default-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-warning" />
                  <span className="font-medium">Reputation</span>
                </div>
                <p className={`text-2xl font-bold ${result.reputationChange >= 0 ? 'text-success' : 'text-danger'}`}>
                  {result.reputationChange >= 0 ? '+' : ''}{result.reputationChange.toFixed(1)}
                </p>
              </div>
            )}
          </div>
          
          {/* Fundraising Results */}
          {(result.fundsRaised !== undefined && result.fundsRaised > 0) && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span className="font-medium">Funds Raised</span>
                </div>
                <span className="text-xl font-bold text-success">
                  {formatMoney(result.fundsRaised)}
                </span>
              </div>
              {result.newDonors !== undefined && result.newDonors > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-success-700">
                  <Users className="w-4 h-4" />
                  <span>{result.newDonors} new donor{result.newDonors !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Special Outcomes */}
          {(result.endorsementTriggered || result.scandalTriggered || (result.mediaBoost && result.mediaBoost > 0)) && (
            <>
              <Divider />
              <div className="space-y-2">
                <h4 className="font-medium">Special Outcomes</h4>
                
                {result.endorsementTriggered && (
                  <Chip color="success" variant="flat" startContent={<Star className="w-4 h-4" />}>
                    Endorsement Opportunity Unlocked!
                  </Chip>
                )}
                
                {result.scandalTriggered && (
                  <Chip color="danger" variant="flat" startContent={<AlertTriangle className="w-4 h-4" />}>
                    Scandal Risk Increased
                  </Chip>
                )}
                
                {result.mediaBoost !== undefined && result.mediaBoost > 0 && (
                  <Chip color="primary" variant="flat" startContent={<Newspaper className="w-4 h-4" />}>
                    Media Coverage +{(result.mediaBoost * 100).toFixed(0)}%
                  </Chip>
                )}
              </div>
            </>
          )}
          
          {/* Details */}
          <Divider />
          <div>
            <p className="text-sm text-default-500">{result.details}</p>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Continue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ActionResultModal;
