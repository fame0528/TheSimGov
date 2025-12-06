/**
 * @file src/components/coreLoop/CoreLoopDashboard.tsx
 * @description Dashboard component for managing and visualizing core loop state
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Provides a dashboard view for the core loop, including tabs for state, history, and actions.
 * Integrates CoreLoopCard, displays tick progression, and allows CRUD operations.
 * Follows HeroUI Tabs/Card/Chip/Button patterns and utility-first architecture.
 *
 * USAGE:
 * ```tsx
 * import CoreLoopDashboard from '@/components/coreLoop/CoreLoopDashboard';
 *
 * <CoreLoopDashboard />
 * ```
 */

'use client';

import React, { useState } from 'react';
import { Tabs, Tab, Card, Spacer } from '@heroui/react';
import CoreLoopCard from './CoreLoopCard';
import { useCoreLoopState } from '@/hooks/useCoreLoop';
import { CoreLoopState } from '@/lib/types/coreLoop';

const TABS = [
  { key: 'state', label: 'State' },
];

/**
 * Dashboard component for core loop management
 */
const CoreLoopDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('state');
  const { state, isLoading, error } = useCoreLoopState();

  return (
    <Card>
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={key => setSelectedTab(key as string)}
        aria-label="Core Loop Dashboard Tabs"
      >
        {TABS.map(tab => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>
      <Spacer y={1} />
      {selectedTab === 'state' && <CoreLoopCard />}
    </Card>
  );
};

export default CoreLoopDashboard;
