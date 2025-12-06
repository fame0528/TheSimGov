/**
 * @fileoverview Action Card Component
 * @module components/politics/actions/ActionCard
 * 
 * OVERVIEW:
 * Displays a single political action with costs, effects preview,
 * and execute button. Used in the Actions dashboard grid.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Tooltip,
  Progress,
} from '@heroui/react';
import {
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Target,
  Play,
} from 'lucide-react';
import {
  ActionType,
  ActionCategory,
  ActionIntensity,
  ACTION_DISPLAY_NAMES,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_ICONS,
  ACTION_BASE_COSTS,
  calculateFinalCost,
} from '@/lib/types/actions';

// ===================== TYPES =====================

export interface ActionCardProps {
  actionType: ActionType;
  category: ActionCategory;
  isAvailable?: boolean;
  cooldownRemaining?: number; // ms remaining
  onExecute?: (actionType: ActionType, intensity: ActionIntensity) => void;
  isLoading?: boolean;
  playerFunds?: number;
  actionPointsRemaining?: number;
}

// ===================== HELPERS =====================

const formatMoney = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

const formatTime = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${hours}h`;
};

const formatCooldown = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getCategoryColor = (category: ActionCategory): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  switch (category) {
    case ActionCategory.ADVERTISING:
      return 'primary';
    case ActionCategory.GROUND_GAME:
      return 'success';
    case ActionCategory.FUNDRAISING:
      return 'warning';
    case ActionCategory.MEDIA:
      return 'secondary';
    case ActionCategory.LOBBYING:
      return 'default';
    case ActionCategory.OPPOSITION:
      return 'danger';
    default:
      return 'default';
  }
};

// ===================== COMPONENT =====================

export function ActionCard({
  actionType,
  category,
  isAvailable = true,
  cooldownRemaining,
  onExecute,
  isLoading = false,
  playerFunds = Infinity,
  actionPointsRemaining = 10,
}: ActionCardProps) {
  const [selectedIntensity, setSelectedIntensity] = useState<ActionIntensity>(ActionIntensity.STANDARD);
  
  const baseCost = ACTION_BASE_COSTS[actionType];
  const finalCost = calculateFinalCost(actionType, selectedIntensity);
  
  const canAfford = playerFunds >= finalCost.money && actionPointsRemaining >= finalCost.actionPoints;
  const isOnCooldown = cooldownRemaining !== undefined && cooldownRemaining > 0;
  const isDisabled = !isAvailable || !canAfford || isOnCooldown || isLoading;
  
  const handleExecute = () => {
    if (!isDisabled && onExecute) {
      onExecute(actionType, selectedIntensity);
    }
  };
  
  return (
    <Card 
      className={`w-full transition-all ${isDisabled ? 'opacity-60' : 'hover:shadow-lg'}`}
      isDisabled={isDisabled}
    >
      <CardHeader className="flex flex-col items-start gap-2 pb-2">
        <div className="flex items-center justify-between w-full">
          <Chip
            size="sm"
            color={getCategoryColor(category)}
            variant="flat"
            startContent={<span>{CATEGORY_ICONS[category]}</span>}
          >
            {CATEGORY_DISPLAY_NAMES[category]}
          </Chip>
          {isOnCooldown && (
            <Chip size="sm" color="warning" variant="bordered">
              <Clock className="w-3 h-3 mr-1" />
              {formatCooldown(cooldownRemaining)}
            </Chip>
          )}
        </div>
        <h3 className="text-lg font-semibold">{ACTION_DISPLAY_NAMES[actionType]}</h3>
      </CardHeader>
      
      <CardBody className="py-2 space-y-3">
        {/* Intensity Selector */}
        <div className="flex flex-wrap gap-1">
          {Object.values(ActionIntensity).map((intensity) => (
            <Button
              key={intensity}
              size="sm"
              variant={selectedIntensity === intensity ? 'solid' : 'flat'}
              color={selectedIntensity === intensity ? 'primary' : 'default'}
              onPress={() => setSelectedIntensity(intensity)}
              className="text-xs px-2 min-w-0"
            >
              {intensity.charAt(0) + intensity.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        
        {/* Cost Display */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Tooltip content="Money Cost">
            <div className={`flex items-center gap-1 ${playerFunds < finalCost.money ? 'text-danger' : ''}`}>
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">{formatMoney(finalCost.money)}</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Action Points">
            <div className={`flex items-center gap-1 ${actionPointsRemaining < finalCost.actionPoints ? 'text-danger' : ''}`}>
              <Zap className="w-4 h-4" />
              <span className="font-medium">{finalCost.actionPoints} AP</span>
            </div>
          </Tooltip>
          
          <Tooltip content="Duration">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(finalCost.timeHours)}</span>
            </div>
          </Tooltip>
        </div>
        
        {/* Effect Preview */}
        <div className="text-xs text-default-700">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>
              {selectedIntensity === ActionIntensity.MAXIMUM && 'Highest impact, but expensive'}
              {selectedIntensity === ActionIntensity.HIGH && 'High impact with moderate cost'}
              {selectedIntensity === ActionIntensity.STANDARD && 'Balanced cost and effect'}
              {selectedIntensity === ActionIntensity.LOW && 'Budget-friendly option'}
              {selectedIntensity === ActionIntensity.MINIMAL && 'Minimum spend, reduced effect'}
            </span>
          </div>
        </div>
        
        {/* Warnings */}
        {!canAfford && !isOnCooldown && (
          <div className="flex items-center gap-1 text-xs text-danger">
            <AlertTriangle className="w-3 h-3" />
            <span>
              {playerFunds < finalCost.money && 'Insufficient funds'}
              {actionPointsRemaining < finalCost.actionPoints && playerFunds >= finalCost.money && 'Not enough action points'}
            </span>
          </div>
        )}
      </CardBody>
      
      <CardFooter className="pt-0">
        <Button
          color="primary"
          className="w-full"
          isDisabled={isDisabled}
          isLoading={isLoading}
          onPress={handleExecute}
          startContent={!isLoading && <Play className="w-4 h-4" />}
        >
          {isOnCooldown 
            ? `On Cooldown` 
            : isLoading 
              ? 'Executing...' 
              : 'Execute Action'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ActionCard;
