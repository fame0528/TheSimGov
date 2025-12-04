/**
 * @fileoverview Sector Card Component
 * @module components/sector/SectorCard
 *
 * OVERVIEW:
 * Displays a single sector with details, actions, and status chips.
 * Strictly typed, DRY, AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import React from 'react';
import { Sector, SectorType } from '@/lib/types/sector';
import { Card, CardHeader, CardBody, Chip, Button } from '@heroui/react';

interface SectorCardProps {
  sector: Sector;
  onExpand: (sectorId: string) => void;
  onDownsize: (sectorId: string) => void;
  onTriggerEvent: (sectorId: string) => void;
}

export const SectorCard: React.FC<SectorCardProps> = ({ sector, onExpand, onDownsize, onTriggerEvent }) => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader>
        <Chip color="primary">{sector.type}</Chip> {sector.name || sector.type} ({sector.location})
      </CardHeader>
      <CardBody>
        <div>Revenue: ${sector.revenue}</div>
        <div>Profit: ${sector.profit}</div>
        <div>Status: <Chip color="success">Active</Chip></div>
        <div style={{ marginTop: 8 }}>
          <Button onClick={() => onExpand(sector.id)}>Expand</Button>
          <Button onClick={() => onDownsize(sector.id)} style={{ marginLeft: 8 }}>Downsize</Button>
          <Button onClick={() => onTriggerEvent(sector.id)} style={{ marginLeft: 8 }}>Trigger Event</Button>
        </div>
      </CardBody>
    </Card>
  );
};

/**
 * IMPLEMENTATION NOTES:
 * - Uses HeroUI Card, Chip, Button components
 * - Strictly typed props and sector data
 * - DRY and AAA/ECHO compliant
 */
