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
          <p className="text-default-700">Overview of AI operations and metrics</p>
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

      {/* KPI Summary Cards - AAA Design matching Banking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-blue-900/30 text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Total AI Models</p>
            <p className="text-2xl font-bold mt-1 text-white">{totalModels}</p>
            <p className="text-xs text-gray-500 mt-1">Trained and deployed models</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-yellow-900/30 text-yellow-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Active Research</p>
            <p className="text-2xl font-bold mt-1 text-white">{activeResearch}</p>
            <p className="text-xs text-gray-500 mt-1">In-progress research projects</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-green-900/30 text-green-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">GPU Utilization</p>
            <p className="text-2xl font-bold mt-1 text-white">{gpuUtilization.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Current compute usage</p>
          </div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border border-slate-700">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-emerald-900/30 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Monthly Revenue</p>
            <p className="text-2xl font-bold mt-1 text-white">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">API usage & licensing</p>
          </div>
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
                  <p className="text-sm text-default-700">Models Deployed</p>
                  <p className="text-2xl font-bold text-primary">{totalModels}</p>
                  <p className="text-xs text-default-400 mt-1">Production-ready AI models</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">Research Projects</p>
                  <p className="text-2xl font-bold text-warning">{activeResearch}</p>
                  <p className="text-xs text-default-400 mt-1">Active research initiatives</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-default-700">GPU Clusters</p>
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
                <p className="text-center text-default-700 py-8">
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
                <p className="text-center text-default-700 py-8">
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
                <p className="text-center text-default-700 py-8">
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
                <p className="text-center text-default-700 py-8">
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
                <p className="text-center text-default-700 py-8">
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
