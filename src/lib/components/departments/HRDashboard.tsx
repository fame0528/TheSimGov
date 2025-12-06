/**
 * @fileoverview HR Department Dashboard Component
 * @module lib/components/departments/HRDashboard
 * 
 * OVERVIEW:
 * Complete HR department view with training programs, recruitment, skills inventory.
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
import { formatCurrency, formatDate } from '@/lib/utils';
import type { HRDepartment, TrainingProgram, RecruitmentCampaign, SkillInventory } from '@/lib/types/department';

// Props interface added to resolve missing HRDashboardProps type export
export interface HRDashboardProps {
  department: HRDepartment;
  onCreateTraining?: () => void;
  onLaunchRecruitment?: () => void;
  onRefresh?: () => void;
}

export function HRDashboard({
  department,
  onCreateTraining,
  onLaunchRecruitment,
  onRefresh,
}: HRDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const trainingColumns: Column<TrainingProgram>[] = [
    { header: 'Program', accessor: 'name' },
    { header: 'Skill', accessor: (p) => <Chip size="sm" variant="flat">{p.skillTarget}</Chip> },
    { header: 'Enrolled', accessor: (p) => `${p.enrolled}/${p.capacity}` },
    { header: 'Duration', accessor: (p) => `${p.duration} weeks` },
    { header: 'Cost', accessor: (p) => formatCurrency(p.cost) },
    { header: 'Status', accessor: (p) => (
      <Chip size="sm" color={p.status === 'active' ? 'success' : p.status === 'completed' ? 'primary' : 'default'}>
        {p.status}
      </Chip>
    )},
    { header: 'End Date', accessor: (p) => formatDate(p.endDate) },
  ];

  const recruitmentColumns: Column<RecruitmentCampaign>[] = [
    { header: 'Role', accessor: 'role' },
    { header: 'Positions', accessor: 'positions' },
    { header: 'Applicants', accessor: 'applicants' },
    { header: 'Hired', accessor: (c) => `${c.hired}/${c.positions}` },
    { header: 'Budget', accessor: (c) => formatCurrency(c.budget) },
    { header: 'Duration', accessor: (c) => `${c.duration} weeks` },
    { header: 'Status', accessor: (c) => (
      <Chip size="sm" color={c.status === 'active' ? 'success' : 'default'}>
        {c.status}
      </Chip>
    )},
  ];

  const skillsColumns: Column<SkillInventory>[] = [
    { header: 'Skill', accessor: 'skill' },
    { header: 'Employees', accessor: 'employeeCount' },
    { header: 'Avg Level', accessor: (s) => (
      <div className="flex items-center gap-2">
        <Progress value={(s.avgLevel / 5) * 100} maxValue={100} size="sm" className="w-20" />
        <span className="text-sm">{s.avgLevel.toFixed(1)}/5</span>
      </div>
    )},
  ];

  const activeTraining = department.trainingPrograms?.filter(p => p.status === 'active') || [];
  const activeRecruitment = department.recruitmentCampaigns?.filter(c => c.status === 'active') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">👥 HR Department</h2>
          <p className="text-default-700">Level {department.level} • {formatCurrency(department.budget)} Budget</p>
        </div>
        {onRefresh && <Button size="sm" variant="flat" onPress={onRefresh}>Refresh</Button>}
      </div>

      {/* KPIs */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* HR Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Total Employees</p>
            <p className="text-2xl font-bold">{department.totalEmployees || 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Avg Salary</p>
            <p className="text-2xl font-bold">{formatCurrency(department.avgSalary || 0)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Turnover Rate</p>
            <p className="text-2xl font-bold">
              <Chip color={(department.employeeTurnover || 0) < 10 ? 'success' : (department.employeeTurnover || 0) < 20 ? 'warning' : 'danger'}>
                {(department.employeeTurnover || 0).toFixed(1)}%
              </Chip>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-700">Training Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(department.trainingBudget || 0)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="flex justify-between">
                <h3 className="text-lg font-semibold">Active Training</h3>
                <Chip size="sm">{activeTraining.length}</Chip>
              </CardHeader>
              <CardBody>
                {activeTraining.slice(0, 3).map(program => (
                  <div key={program.id} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                    <div>
                      <p className="font-medium">{program.name}</p>
                      <p className="text-xs text-default-700">{program.skillTarget}</p>
                    </div>
                    <Chip size="sm">{program.enrolled}/{program.capacity}</Chip>
                  </div>
                ))}
                {activeTraining.length === 0 && (
                  <p className="text-sm text-default-400">No active training programs</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex justify-between">
                <h3 className="text-lg font-semibold">Active Recruitment</h3>
                <Chip size="sm">{activeRecruitment.length}</Chip>
              </CardHeader>
              <CardBody>
                {activeRecruitment.slice(0, 3).map(campaign => (
                  <div key={campaign.id} className="flex justify-between items-center py-2 border-b border-divider last:border-0">
                    <div>
                      <p className="font-medium">{campaign.role}</p>
                      <p className="text-xs text-default-700">{campaign.applicants} applicants</p>
                    </div>
                    <Chip size="sm">{campaign.hired}/{campaign.positions}</Chip>
                  </div>
                ))}
                {activeRecruitment.length === 0 && (
                  <p className="text-sm text-default-400">No active recruitment campaigns</p>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="training" title={`Training (${department.trainingPrograms?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onCreateTraining && (
              <Button color="primary" onPress={onCreateTraining}>
                Create Training Program
              </Button>
            )}
            <DataTable
              data={department.trainingPrograms || []}
              columns={trainingColumns}
              emptyMessage="No training programs. Create one to improve employee skills!"
            />
          </div>
        </Tab>

        <Tab key="recruitment" title={`Recruitment (${department.recruitmentCampaigns?.length || 0})`}>
          <div className="mt-4 space-y-4">
            {onLaunchRecruitment && (
              <Button color="primary" onPress={onLaunchRecruitment}>
                Launch Recruitment Campaign
              </Button>
            )}
            <DataTable
              data={department.recruitmentCampaigns || []}
              columns={recruitmentColumns}
              emptyMessage="No recruitment campaigns. Launch one to hire new talent!"
            />
          </div>
        </Tab>

        <Tab key="skills" title={`Skills (${department.skillsInventory?.length || 0})`}>
          <div className="mt-4">
            <DataTable
              data={department.skillsInventory || []}
              columns={skillsColumns}
              emptyMessage="No skills tracked yet. Skills appear as employees are hired."
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
