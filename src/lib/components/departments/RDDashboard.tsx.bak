/**
 * @fileoverview R&D Department Dashboard Component
 * @module lib/components/departments/RDDashboard
 * 
 * OVERVIEW:
 * Complete R&D department view with research projects, patents, innovation metrics.
 * Reuses KPIGrid, DataTable, shared components.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { KPIGrid } from './KPIGrid';
import { DataTable, Column } from '../shared/DataTable';
import type { RDDepartment, ResearchProject, Patent } from '@/lib/types/department';

export interface RDDashboardProps {
  department: RDDepartment;
  onStartResearch?: () => void;
  onRefresh?: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function RDDashboard({
  department,
  onStartResearch,
  onRefresh,
}: RDDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const researchColumns: Column<ResearchProject>[] = [
    { header: 'Project', accessor: 'name' },
    { header: 'Category', accessor: (p) => <Chip size="sm" variant="flat">{p.category}</Chip> },
    { header: 'Budget', accessor: (p) => formatCurrency(p.budget) },
    { header: 'Progress', accessor: (p) => (
      <div className="flex items-center gap-2">
        <Progress value={p.progress} maxValue={100} size="sm" className="w-20" />
        <span className="text-sm">{p.progress.toFixed(0)}%</span>
      </div>
    )},
    { header: 'Success Chance', accessor: (p) => (
      <Chip size="sm" color={p.successChance >= 75 ? 'success' : p.successChance >= 50 ? 'warning' : 'danger'}>
        {p.successChance.toFixed(0)}%
      </Chip>
    )},
    { header: 'Status', accessor: (p) => (
      <Chip size="sm" color={p.status === 'active' ? 'success' : p.status === 'completed' ? 'primary' : p.status === 'failed' ? 'danger' : 'default'}>
        {p.status}
      </Chip>
    )},
  ];

  const patentColumns: Column<Patent>[] = [
    { header: 'Patent', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Value', accessor: (p) => formatCurrency(p.value) },
    { header: 'Filed', accessor: (p) => formatDate(p.filedAt) },
    { header: 'Status', accessor: (p) => (
      <Chip size="sm" color={p.status === 'approved' ? 'success' : p.status === 'pending' ? 'warning' : 'default'}>
        {p.status}
      </Chip>
    )},
  ];

  const activeResearch = department.researchProjects?.filter(p => p.status === 'active') || [];
  const completedResearch = department.researchProjects?.filter(p => p.status === 'completed') || [];
  const approvedPatents = department.patents?.filter(p => p.status === 'approved') || [];
  const totalPatentValue = approvedPatents.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">🔬 R&D Department</h2>
          <p className="text-default-500">Level {department.level} • {formatCurrency(department.budget)} Budget</p>
        </div>
        {onRefresh && <Button size="sm" variant="flat" onPress={onRefresh}>Refresh</Button>}
      </div>

      {/* KPIs */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* R&D Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Innovation Points</p>
            <p className="text-2xl font-bold">{formatNumber(department.innovationPoints || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Research Speed</p>
            <p className="text-2xl font-bold">
              <Chip color={(department.researchSpeed || 1.0) >= 1.5 ? 'success' : (department.researchSpeed || 1.0) >= 1.0 ? 'warning' : 'default'}>
                {(department.researchSpeed || 1.0).toFixed(2)}x
              </Chip>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Technology Level</p>
            <p className="text-2xl font-bold">{department.technologyLevel || 1}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Active Patents</p>
            <p className="text-2xl font-bold">{approvedPatents.length}</p>
          </CardBody>
        </Card>
      </div>

      {/* Innovation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Patent Portfolio</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between">
              <span className="text-default-500">Total Patents</span>
              <span className="font-semibold">{department.patents?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500">Granted</span>
              <span className="font-semibold text-success">{approvedPatents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500">Total Value</span>
              <span className="font-semibold">{formatCurrency(totalPatentValue)}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <h3 className="text-lg font-semibold">Active Research</h3>
            <Chip size="sm">{activeResearch.length}</Chip>
          </CardHeader>
          <CardBody>
            {activeResearch.slice(0, 3).map(project => (
              <div key={project.id} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-default-500">{project.category}</p>
                </div>
                <div className="text-right">
                  <Progress value={project.progress} maxValue={100} size="sm" className="w-20" />
                  <p className="text-xs text-default-500 mt-1">{project.progress.toFixed(0)}%</p>
                </div>
              </div>
            ))}
            {activeResearch.length === 0 && (
              <p className="text-sm text-default-400">No active research projects</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Research Status</h4>
                </CardHeader>
                <CardBody className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <Chip size="sm" color="success">{activeResearch.length}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <Chip size="sm" color="primary">{completedResearch.length}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Budget</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(activeResearch.reduce((sum, p) => sum + p.budget, 0))}
                    </span>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Innovation Output</h4>
                </CardHeader>
                <CardBody className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Points Generated</span>
                    <span className="text-sm font-semibold">{formatNumber(department.innovationPoints || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Research Speed</span>
                    <span className="text-sm font-semibold">{(department.researchSpeed || 1.0).toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-semibold">
                      {completedResearch.length > 0 
                        ? ((completedResearch.length / Math.max(1, department.researchProjects?.length || 1)) * 100).toFixed(0) 
                        : 0}%
                    </span>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Competitive Edge</h4>
                </CardHeader>
                <CardBody className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Tech Level</span>
                    <Chip size="sm">{department.technologyLevel || 1}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Patent Value</span>
                    <span className="text-sm font-semibold">{formatCurrency(totalPatentValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Approved Patents</span>
                    <span className="text-sm font-semibold text-success">{approvedPatents.length}</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="research" title={`Research (${department.researchProjects?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onStartResearch && (
              <Button color="primary" onPress={onStartResearch}>
                Start New Research Project
              </Button>
            )}
            <DataTable
              data={department.researchProjects || []}
              columns={researchColumns}
              emptyMessage="No research projects. Start one to unlock new innovations!"
            />
          </div>
        </Tab>

        <Tab key="patents" title={`Patents (${department.patents?.length || 0})`}>
          <div className="mt-4">
            <DataTable
              data={department.patents || []}
              columns={patentColumns}
              emptyMessage="No patents yet. Complete research projects to file patents!"
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
