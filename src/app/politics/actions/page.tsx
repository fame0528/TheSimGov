/**
 * @fileoverview Political Actions Dashboard Page
 * @module app/politics/actions/page
 * 
 * OVERVIEW:
 * Main dashboard for executing political campaign actions.
 * Displays available actions by category, current action points,
 * queue status, and action history.
 * 
 * FEATURES:
 * - Action catalog with category filtering
 * - Action point tracking and reset countdown
 * - Execute actions with targeting options
 * - View action results with detailed breakdowns
 * - Queue management for scheduled actions
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  Chip,
  Spinner,
  Progress,
} from '@heroui/react';
import {
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
  DollarSign,
  History,
} from 'lucide-react';
import { useToast } from '@/lib/hooks/ui/useToast';
import { ActionsList, ActionResultModal } from '@/components/politics/actions';
import type { ActionResultData } from '@/components/politics/actions';
import { ActionType, ActionIntensity } from '@/lib/types/actions';

// ===================== TYPES =====================

interface QueueStatus {
  actionPointsRemaining: number;
  actionPointsMax: number;
  pendingCount: number;
  inProgressCount: number;
  estimatedImpact: {
    estimatedPollingShift: number;
    estimatedFundsRaised: number;
    totalCost: number;
  };
}

interface ExecuteActionResponse {
  success: boolean;
  data?: {
    action: {
      id: string;
      type: ActionType;
      intensity: ActionIntensity;
      status: string;
      cost: { money: number; actionPoints: number; timeHours: number };
    };
    result: ActionResultData | null;
    queue: QueueStatus;
    warnings: string[];
  };
  error?: string;
}

// ===================== FETCHER =====================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

// ===================== COMPONENT =====================

export default function ActionsPage() {
  const toast = useToast();
  
  // State
  const [executingAction, setExecutingAction] = useState<ActionType | null>(null);
  const [lastResult, setLastResult] = useState<{ type: ActionType; result: ActionResultData } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Mock data for now - would come from campaign API
  const [playerFunds] = useState(1000000); // $1M mock funds
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    actionPointsRemaining: 10,
    actionPointsMax: 10,
    pendingCount: 0,
    inProgressCount: 0,
    estimatedImpact: {
      estimatedPollingShift: 0,
      estimatedFundsRaised: 0,
      totalCost: 0,
    },
  });
  const [cooldowns, setCooldowns] = useState<Partial<Record<ActionType, number>>>({});
  
  // Fetch action catalog (for static data)
  const { data: catalogData, error: catalogError, isLoading: catalogLoading } = useSWR(
    '/api/politics/actions',
    fetcher,
    { revalidateOnFocus: false }
  );
  
  // Execute action
  const handleExecuteAction = useCallback(async (actionType: ActionType, intensity: ActionIntensity) => {
    setExecutingAction(actionType);
    
    try {
      const response = await fetch('/api/politics/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          intensity,
        }),
      });
      
      const data: ExecuteActionResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute action');
      }
      
      // Update queue status
      if (data.data?.queue) {
        setQueueStatus(data.data.queue);
      }
      
      // Set cooldown
      if (data.data?.action) {
        const cooldownMs = data.data.action.cost.timeHours * 60 * 60 * 1000;
        setCooldowns(prev => ({
          ...prev,
          [actionType]: Date.now() + cooldownMs,
        }));
      }
      
      // Show result
      if (data.data?.result) {
        setLastResult({ type: actionType, result: data.data.result });
        setShowResultModal(true);
        
        // Toast based on outcome
        if (data.data.result.didBackfire) {
          toast.error(`Action backfired! ${data.data.result.backfireReason}`);
        } else {
          toast.success(`Action executed successfully! +${data.data.result.pollingShift?.toFixed(2) || 0}% polling`);
        }
      }
      
      // Show warnings
      if (data.data?.warnings && data.data.warnings.length > 0) {
        data.data.warnings.forEach(w => toast.warning(w));
      }
      
    } catch (error) {
      console.error('[ActionsPage] Execute error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute action');
    } finally {
      setExecutingAction(null);
    }
  }, [toast]);
  
  // Format money
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };
  
  // Loading state
  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Error state
  if (catalogError) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center text-danger py-8">
            <p>Failed to load actions catalog.</p>
            <Button 
              color="primary" 
              variant="flat" 
              className="mt-4"
              onPress={() => mutate('/api/politics/actions')}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaign Actions</h1>
          <p className="text-default-700">Execute political actions to influence your campaign</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={() => mutate('/api/politics/actions')}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Action Points */}
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-100">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-default-700">Action Points</p>
                <p className="text-xl font-bold">
                  {queueStatus.actionPointsRemaining} / {queueStatus.actionPointsMax}
                </p>
              </div>
            </div>
            <Progress
              value={(queueStatus.actionPointsRemaining / queueStatus.actionPointsMax) * 100}
              color={queueStatus.actionPointsRemaining > 5 ? 'success' : queueStatus.actionPointsRemaining > 2 ? 'warning' : 'danger'}
              size="sm"
              className="mt-2"
            />
          </CardBody>
        </Card>
        
        {/* Available Funds */}
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-100">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-700">Campaign Funds</p>
                <p className="text-xl font-bold">{formatMoney(playerFunds)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Queue Status */}
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-700">Queued Actions</p>
                <p className="text-xl font-bold">
                  {queueStatus.pendingCount + queueStatus.inProgressCount}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Estimated Impact */}
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary-100">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-default-700">Est. Polling Impact</p>
                <p className="text-xl font-bold">
                  +{queueStatus.estimatedImpact.estimatedPollingShift.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Actions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Available Actions</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <ActionsList
            actionPointsRemaining={queueStatus.actionPointsRemaining}
            actionPointsMax={queueStatus.actionPointsMax}
            playerFunds={playerFunds}
            cooldowns={cooldowns}
            onExecuteAction={handleExecuteAction}
            executingAction={executingAction}
          />
        </CardBody>
      </Card>
      
      {/* Result Modal */}
      {lastResult && (
        <ActionResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          actionType={lastResult.type}
          result={lastResult.result}
        />
      )}
    </div>
  );
}
