/**
 * @fileoverview Sector Dashboard Component
 * @module components/sector/SectorDashboard
 *
 * OVERVIEW:
 * Displays all sectors owned by a company, with actions, financials, events, and help panel.
 * Strictly typed, DRY, AAA/ECHO compliant.
 *
 * @created 2025-12-03
 */

import React from 'react';
import { Sector, SectorType, SectorEvent } from '@/lib/types/sector';
import { Card, CardHeader, CardBody, Tabs, Tab, Button, Chip } from '@heroui/react';

interface SectorDashboardProps {
  sectors: Sector[];
  onExpand: (sectorId: string) => void;
  onDownsize: (sectorId: string) => void;
  onTriggerEvent: (sectorId: string) => void;
}

export const SectorDashboard: React.FC<SectorDashboardProps> = ({ sectors, onExpand, onDownsize, onTriggerEvent }) => {
  const [selectedTab, setSelectedTab] = React.useState<string>('overview');
  const handleTabChange = (key: any) => setSelectedTab(String(key));

  return (
    <Card>
      <CardHeader>
        <Tabs selectedKey={selectedTab} onSelectionChange={handleTabChange}>
          <Tab key="overview" title="Overview" />
          <Tab key="actions" title="Actions" />
          <Tab key="financials" title="Financials" />
          <Tab key="events" title="Events" />
          <Tab key="help" title="Help" />
        </Tabs>
      </CardHeader>
      <CardBody>
        {selectedTab === 'overview' && (
          <div>
            <h2>Owned Sectors</h2>
            {sectors.map(sector => (
              <div key={sector.id} style={{ marginBottom: 16 }}>
                <Chip color="primary">{sector.type}</Chip> {sector.name || sector.type} ({sector.location})
              </div>
            ))}
          </div>
        )}
        {selectedTab === 'actions' && (
          <div>
            <h2>Sector Actions</h2>
            {sectors.map(sector => (
              <div key={sector.id} style={{ marginBottom: 16 }}>
                <Button onClick={() => onExpand(sector.id)}>Expand</Button>
                <Button onClick={() => onDownsize(sector.id)} style={{ marginLeft: 8 }}>Downsize</Button>
                <Button onClick={() => onTriggerEvent(sector.id)} style={{ marginLeft: 8 }}>Trigger Event</Button>
              </div>
            ))}
          </div>
        )}
        {selectedTab === 'financials' && (
          <div>
            <h2>Sector Financials</h2>
            {sectors.map(sector => (
              <div key={sector.id} style={{ marginBottom: 16 }}>
                Revenue: ${sector.revenue} | Profit: ${sector.profit}
              </div>
            ))}
          </div>
        )}
        {selectedTab === 'events' && (
          <div>
            <h2>Recent Events</h2>
            {/* Placeholder for event list, to be integrated with event system */}
            <div>No events yet.</div>
          </div>
        )}
        {selectedTab === 'help' && (
          <div>
            <h2>Sector System Help</h2>
            <p>
              Sectors are unique per state and must match your company industry. Use actions to expand, downsize, or trigger events. Financials show sector performance. For more info, see the help panel.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

/**
 * IMPLEMENTATION NOTES:
 * - Uses HeroUI Card, Tabs, Chip, Button components
 * - Strictly typed props and sector data
 * - DRY and AAA/ECHO compliant
 * - Ready for event system integration
 */
