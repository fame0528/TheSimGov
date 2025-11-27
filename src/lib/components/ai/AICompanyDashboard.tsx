/**
 * @fileoverview AI Company Dashboard - Overview Component
 * @module lib/components/ai/AICompanyDashboard
 * 
 * OVERVIEW:
 * Main AI company dashboard combining all metrics, activity feeds, and quick actions.
 * Shows AI models, research projects, GPU utilization, monthly revenue, and recent activity.
 * 
 * FEATURES:
 * - KPI grid (total models, active research, GPU utilization, monthly revenue)
 * - Recent activity feed (model deployments, research breakthroughs)
 * - Quick action buttons (New Model, New Research, Hire Talent)
 * - Tab-based interface (Models, Research, Infrastructure, Team, Revenue)
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { KPIGrid } from '../departments/KPIGrid';
import { DataTable, Column } from '../shared/DataTable';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatting';

export interface AICompanyDashboardProps {
  /** Company ID */
  companyId: string;
  /** AI models count */
  totalModels?: number;
  /** Active research projects count */
  activeResearch?: number;
  /** GPU utilization percentage */
  gpuUtilization?: number;
  /** Monthly revenue */
  monthlyRevenue?: number;
  /** Recent activity events */
  recentActivity?: ActivityEvent[];
  /** Quick action handlers */
  onNewModel?: () => void;
  onNewResearch?: () => void;
  onHireTalent?: () => void;
}

export interface ActivityEvent {
  id: string;
  type: 'model' | 'research' | 'deployment' | 'breakthrough';
  title: string;
  description: string;
  timestamp: Date;
  impact?: 'high' | 'medium' | 'low';
}



/**
 * AICompanyDashboard Component
 * 
 * Main overview dashboard for AI companies showing all key metrics and activity.
 * 
 * @example
 * ```tsx
 * <AICompanyDashboard
 *   companyId="123"
 *   totalModels={5}
 *   activeResearch={3}
 *   gpuUtilization={78.5}
 *   monthlyRevenue={450000}
 *   onNewModel={() => router.push('/ai/training')}
 * />
 * ```
 */
export function AICompanyDashboard({
  companyId: _companyId,
  totalModels = 0,
  activeResearch = 0,
  gpuUtilization = 0,
  monthlyRevenue = 0,
  recentActivity = [],
  onNewModel,
  onNewResearch,
  onHireTalent,
}: AICompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Activity table columns
  const activityColumns: Column<ActivityEvent>[] = [
    { 
      header: 'Type', 
      accessor: (event) => (
        <Chip size="sm" color={
          event.type === 'breakthrough' ? 'success' :
          event.type === 'deployment' ? 'primary' :
          event.type === 'research' ? 'warning' : 'default'
        }>
          {event.type}
        </Chip>
      ),
    },
    { header: 'Event', accessor: (event) => event.title },
    { header: 'Description', accessor: (event) => event.description },
    { 
      header: 'Impact', 
      accessor: (event) => event.impact ? (
        <Chip size="sm" color={
          event.impact === 'high' ? 'danger' :
          event.impact === 'medium' ? 'warning' : 'success'
        }>
          {event.impact}
        </Chip>
      ) : '—',
    },
    { header: 'Time', accessor: (event) => formatRelativeTime(event.timestamp) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">🤖 AI Company Dashboard</h2>
          <p className="text-default-500">Overview of AI operations and metrics</p>
        </div>
        <div className="flex gap-2">
          {onNewModel && (
            <Button color="primary" size="sm" onPress={onNewModel}>
              New Model
            </Button>
          )}
          {onNewResearch && (
            <Button color="secondary" size="sm" onPress={onNewResearch}>
              New Research
            </Button>
          )}
          {onHireTalent && (
            <Button color="success" size="sm" onPress={onHireTalent}>
              Hire Talent
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total AI Models</p>
            <p className="text-2xl font-bold text-primary">{totalModels}</p>
            <p className="text-xs text-default-400 mt-1">Trained and deployed models</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Active Research</p>
            <p className="text-2xl font-bold text-warning">{activeResearch}</p>
            <p className="text-xs text-default-400 mt-1">In-progress research projects</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">GPU Utilization</p>
            <p className="text-2xl font-bold text-success">{gpuUtilization.toFixed(1)}%</p>
            <p className="text-xs text-default-400 mt-1">Current compute usage</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Monthly Revenue</p>
            <p className="text-2xl font-bold text-danger">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-default-400 mt-1">API usage & licensing</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <div className="mt-4 space-y-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </CardHeader>
              <CardBody>
                <DataTable
                  data={recentActivity}
                  columns={activityColumns}
                  emptyMessage="No recent activity. Start training models or launching research projects!"
                />
              </CardBody>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardBody>
                  <p className="text-sm text-default-500">Models Deployed</p>
                  <p className="text-2xl font-bold text-primary">{totalModels}</p>
                  <p className="text-xs text-default-400 mt-1">Production-ready AI models</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-500">Research Projects</p>
                  <p className="text-2xl font-bold text-warning">{activeResearch}</p>
                  <p className="text-xs text-default-400 mt-1">Active research initiatives</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-500">GPU Clusters</p>
                  <p className="text-2xl font-bold text-success">
                    {gpuUtilization.toFixed(1)}%
                  </p>
                  <p className="text-xs text-default-400 mt-1">Compute utilization</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="models" title={`Models (${totalModels})`}>
          <div className="mt-4">
            <Card>
              <CardBody>
                <p className="text-center text-default-500 py-8">
                  Model list will be implemented in ModelTrainingWizard component
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="research" title={`Research (${activeResearch})`}>
          <div className="mt-4">
            <Card>
              <CardBody>
                <p className="text-center text-default-500 py-8">
                  Research projects will be shown in ResearchProjectManager component
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="infrastructure" title="Infrastructure">
          <div className="mt-4">
            <Card>
              <CardBody>
                <p className="text-center text-default-500 py-8">
                  Infrastructure details will be shown in InfrastructureManager component
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="team" title="Team">
          <div className="mt-4">
            <Card>
              <CardBody>
                <p className="text-center text-default-500 py-8">
                  AI talent will be managed in TalentMarketplace component
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="revenue" title="Revenue">
          <div className="mt-4">
            <Card>
              <CardBody>
                <p className="text-center text-default-500 py-8">
                  Revenue analytics will be shown in RevenueAnalytics component
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Component Reuse**: Uses KPIGrid, DataTable, Card, Tabs from shared/department components
 * 2. **Tab Structure**: Overview, Models, Research, Infrastructure, Team, Revenue
 * 3. **Activity Feed**: Recent model deployments, research breakthroughs, events
 * 4. **Quick Actions**: Buttons for New Model, New Research, Hire Talent
 * 5. **KPI Display**: Total models, active research, GPU utilization, monthly revenue
 * 6. **Responsive**: Mobile-first grid layouts
 * 7. **Type Safety**: Full TypeScript with proper interfaces
 * 
 * ADAPTED FROM:
 * - FinanceDashboard.tsx tab structure and layout patterns
 * - Old AIResearchDashboard.tsx activity feed concept
 * - Consistent with Department component styling
 */
