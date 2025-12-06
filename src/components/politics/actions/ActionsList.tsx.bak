/**
 * @fileoverview Actions List Component
 * @module components/politics/actions/ActionsList
 * 
 * OVERVIEW:
 * Displays a filterable grid of available political actions.
 * Supports category filtering, search, and sorting.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  Input,
  Tabs,
  Tab,
  Chip,
  Progress,
} from '@heroui/react';
import { Search, Zap } from 'lucide-react';
import {
  ActionType,
  ActionCategory,
  ActionIntensity,
  CATEGORY_ACTIONS,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_ICONS,
  ACTION_DISPLAY_NAMES,
} from '@/lib/types/actions';
import { ActionCard } from './ActionCard';

// ===================== TYPES =====================

export interface ActionsListProps {
  /** Current action points remaining */
  actionPointsRemaining: number;
  /** Maximum action points per day */
  actionPointsMax: number;
  /** Player's current funds */
  playerFunds: number;
  /** Active cooldowns by action type */
  cooldowns?: Partial<Record<ActionType, number>>;
  /** Callback when action is executed */
  onExecuteAction?: (actionType: ActionType, intensity: ActionIntensity) => void;
  /** Action currently being executed */
  executingAction?: ActionType | null;
}

// ===================== COMPONENT =====================

export function ActionsList({
  actionPointsRemaining,
  actionPointsMax,
  playerFunds,
  cooldowns = {},
  onExecuteAction,
  executingAction,
}: ActionsListProps) {
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter actions based on category and search
  const filteredActions = useMemo(() => {
    const categories = selectedCategory === 'all' 
      ? Object.values(ActionCategory)
      : [selectedCategory];
    
    const actions: Array<{ type: ActionType; category: ActionCategory }> = [];
    
    for (const category of categories) {
      for (const actionType of CATEGORY_ACTIONS[category]) {
        const name = ACTION_DISPLAY_NAMES[actionType].toLowerCase();
        if (!searchQuery || name.includes(searchQuery.toLowerCase())) {
          actions.push({ type: actionType, category });
        }
      }
    }
    
    return actions;
  }, [selectedCategory, searchQuery]);
  
  // Calculate cooldown remaining in ms
  const getCooldownRemaining = (actionType: ActionType): number | undefined => {
    const expiresAt = cooldowns[actionType];
    if (!expiresAt) return undefined;
    const remaining = expiresAt - Date.now();
    return remaining > 0 ? remaining : undefined;
  };
  
  return (
    <div className="space-y-4">
      {/* Action Points Display */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <span className="font-semibold">Action Points</span>
            </div>
            <span className="text-lg font-bold">
              {actionPointsRemaining} / {actionPointsMax}
            </span>
          </div>
          <Progress
            value={(actionPointsRemaining / actionPointsMax) * 100}
            color={actionPointsRemaining > 5 ? 'success' : actionPointsRemaining > 2 ? 'warning' : 'danger'}
            size="md"
            className="w-full"
          />
        </CardBody>
      </Card>
      
      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search actions..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          className="max-w-md"
        />
        
        <Tabs
          selectedKey={selectedCategory}
          onSelectionChange={(key) => setSelectedCategory(key as ActionCategory | 'all')}
          variant="bordered"
          classNames={{
            tabList: 'flex-wrap',
          }}
        >
          <Tab 
            key="all" 
            title={
              <div className="flex items-center gap-1">
                <span>All</span>
                <Chip size="sm" variant="flat">{Object.values(ActionType).length}</Chip>
              </div>
            }
          />
          {Object.values(ActionCategory).map((category) => (
            <Tab
              key={category}
              title={
                <div className="flex items-center gap-1">
                  <span>{CATEGORY_ICONS[category]}</span>
                  <span className="hidden sm:inline">{CATEGORY_DISPLAY_NAMES[category]}</span>
                  <Chip size="sm" variant="flat">{CATEGORY_ACTIONS[category].length}</Chip>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>
      
      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map(({ type, category }) => (
          <ActionCard
            key={type}
            actionType={type}
            category={category}
            isAvailable={true}
            cooldownRemaining={getCooldownRemaining(type)}
            onExecute={onExecuteAction}
            isLoading={executingAction === type}
            playerFunds={playerFunds}
            actionPointsRemaining={actionPointsRemaining}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredActions.length === 0 && (
        <Card>
          <CardBody className="text-center py-8 text-default-500">
            <p>No actions found matching your search.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default ActionsList;
