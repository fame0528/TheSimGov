/**
 * @file src/components/coreLoop/CoreLoopCard.tsx
 * @description Card component to display core loop state and actions
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Displays current core loop state, tick, status, and provides action buttons (advance, pause, resume, reset).
 * Uses useCoreLoop hook for state and mutations. Follows HeroUI Card/Chip/Button patterns.
 *
 * USAGE:
 * ```tsx
 * import CoreLoopCard from '@/components/coreLoop/CoreLoopCard';
 *
 * <CoreLoopCard />
 * ```
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Chip, Button, Spacer } from '@heroui/react';
import useCoreLoop from '@/hooks/useCoreLoop';
import { CoreLoopStatus } from '@/lib/types/coreLoop';

function getStatusColor(status: CoreLoopStatus) {
  switch (status) {
    case CoreLoopStatus.RUNNING: return 'success';
    case CoreLoopStatus.COMPLETED: return 'primary';
    case CoreLoopStatus.ERROR: return 'danger';
    default: return 'default';
  }
}

/**
 * Card component for displaying core loop state and actions
 */
const CoreLoopCard: React.FC = () => {
  const {
    state,
    isLoading,
    error,
    advanceTick,
    mutate,
  } = useCoreLoop();

  if (isLoading) return <Card><CardBody>Loading core loop...</CardBody></Card>;
  if (error) return <Card><CardBody>Error: {error.message}</CardBody></Card>;
  if (!state) return <Card><CardBody>No core loop data available.</CardBody></Card>;

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Core Loop State</span>
          <Chip color={getStatusColor(state.status)}>{state.status}</Chip>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ marginBottom: 8 }}>
          <strong>Tick:</strong> {state.currentTick}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Last Tick At:</strong> {state.lastTickAt ? new Date(state.lastTickAt).toLocaleString() : 'Never'}
        </div>
        <Spacer y={1} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button color="primary" onClick={advanceTick} disabled={state.status !== CoreLoopStatus.RUNNING}>
            Advance Tick
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default CoreLoopCard;
