/**
 * @fileoverview R&D Department Dashboard Component
 * @module components/departments/RDDashboard
 * 
 * OVERVIEW:
 * Displays R&D department KPIs, research projects, patents, and innovation metrics.
 * Provides research project management and patent tracking.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { useState } from 'react';
import { formatNumber } from '@/lib/utils/formatting';
import type { RDDepartment, ResearchProject, Patent } from '@/lib/types/department';

interface RDDashboardProps {
  department: RDDepartment;
  companyId: string;
  onUpdate?: () => void;
}

export default function RDDashboard({ department, companyId, onUpdate }: RDDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);

  // Project status colors
  const projectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'failed': return 'danger';
      case 'cancelled': return 'default';
      default: return 'warning';
    }
  };

  // Patent status colors
  const patentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-2xl font-bold">{department.name} Department</h2>
              <p className="text-default-500">Level {department.level} • Budget: ${formatNumber(department.budget)}</p>
            </div>
            <Chip color={department.active ? 'success' : 'default'} variant="flat">
              {department.active ? 'Active' : 'Inactive'}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-default-500">Efficiency</p>
              <Progress value={department.kpis.efficiency} color="primary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.efficiency}%</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Performance</p>
              <Progress value={department.kpis.performance} color="secondary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.performance}%</p>
            </div>
            <div>
              <p className="text-sm text-default-500">ROI</p>
              <Progress value={department.kpis.roi} color="success" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.roi}%</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Utilization</p>
              <Progress value={department.kpis.utilization} color="warning" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.utilization}%</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Quality</p>
              <Progress value={department.kpis.quality} color="danger" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.quality}%</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs for different sections */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        aria-label="R&D department sections"
        className="w-full"
      >
        {/* Overview Tab */}
        <Tab key="overview" title="Overview">
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-default-500">Innovation Score</p>
                  <p className="text-2xl font-bold">{department.innovationPoints || 0}/100</p>
                  <Progress value={department.innovationPoints || 0} color="primary" size="sm" className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Technology Level</p>
                  <p className="text-2xl font-bold">{department.technologyLevel || department.techLevel || 1}/10</p>
                  <Progress value={((department.technologyLevel || department.techLevel || 1) / 10) * 100} color="secondary" size="sm" className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Active Projects</p>
                  <p className="text-2xl font-bold">{department.researchProjects?.filter(p => p.status === 'active').length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Patents Owned</p>
                  <p className="text-2xl font-bold">{department.patents?.filter(p => p.status === 'approved').length || 0}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Research Projects Tab */}
        <Tab key="projects" title={`Research (${department.researchProjects?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Research Projects</h3>
              <Button color="primary" size="sm" onPress={() => {/* TODO: Open project modal */}}>
                Start Project
              </Button>
            </CardHeader>
            <CardBody>
              {department.researchProjects && department.researchProjects.length > 0 ? (
                <Table aria-label="Research projects table">
                  <TableHeader>
                    <TableColumn>PROJECT NAME</TableColumn>
                    <TableColumn>CATEGORY</TableColumn>
                    <TableColumn>BUDGET</TableColumn>
                    <TableColumn>PROGRESS</TableColumn>
                    <TableColumn>SUCCESS CHANCE</TableColumn>
                    <TableColumn>IMPACT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.researchProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell className="capitalize">{project.category}</TableCell>
                        <TableCell>${formatNumber(project.budget)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={project.progress} 
                              color="primary" 
                              size="sm"
                              className="w-20"
                            />
                            <span className="text-xs">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={
                            project.successChance >= 70 ? 'text-success' :
                            project.successChance >= 40 ? 'text-warning' : 'text-danger'
                          }>
                            {project.successChance}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={
                            project.potentialImpact >= 80 ? 'success' :
                            project.potentialImpact >= 50 ? 'warning' : 'default'
                          } variant="flat">
                            {project.potentialImpact >= 80 ? 'High' :
                             project.potentialImpact >= 50 ? 'Medium' : 'Low'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip color={projectStatusColor(project.status)} variant="flat" size="sm">
                            {project.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-500 py-8">No research projects</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Patents Tab */}
        <Tab key="patents" title={`Patents (${department.patents?.length || 0})`}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Patent Portfolio</h3>
            </CardHeader>
            <CardBody>
              {department.patents && department.patents.length > 0 ? (
                <div className="space-y-4">
                  {department.patents.map((patent) => (
                    <div key={patent.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{patent.name}</h4>
                          <p className="text-sm text-default-500 mt-1">{patent.description}</p>
                        </div>
                        <Chip color={patentStatusColor(patent.status)} variant="flat" size="sm">
                          {patent.status}
                        </Chip>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-default-500">Filed</p>
                          <p className="font-semibold">{new Date(patent.filedAt).toLocaleDateString()}</p>
                        </div>
                        {patent.approvedAt && (
                          <div>
                            <p className="text-default-500">Approved</p>
                            <p className="font-semibold">{new Date(patent.approvedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-default-500">Estimated Value</p>
                          <p className="font-semibold">${formatNumber(patent.value)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-default-500 py-8">No patents filed</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Innovation Tab */}
        <Tab key="innovation" title="Innovation Metrics">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Innovation Performance</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Research Speed */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Research Speed</h4>
                  <Progress 
                    value={((department.researchSpeed || 1) / 2) * 100} 
                    color="primary"
                    size="lg"
                  />
                  <p className="text-sm text-default-500 mt-2">
                    {department.researchSpeed || 1}x base speed
                  </p>
                </div>

                {/* Project Completion Rate */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Project Completion Rate</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-success">
                        {department.researchProjects?.filter(p => p.status === 'completed').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">
                        {department.researchProjects?.filter(p => p.status === 'active').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Active</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-danger">
                        {department.researchProjects?.filter(p => p.status === 'failed').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Failed</p>
                    </div>
                  </div>
                </div>

                {/* Patent Success Rate */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Patent Success Rate</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-success">
                        {department.patents?.filter(p => p.status === 'approved').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Approved</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">
                        {department.patents?.filter(p => p.status === 'pending').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Pending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-danger">
                        {department.patents?.filter(p => p.status === 'rejected').length || 0}
                      </p>
                      <p className="text-xs text-default-500">Rejected</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Tab Structure**: Overview, Research Projects, Patents, Innovation Metrics sections
 * 2. **KPI Display**: Progress bars for 5 key metrics
 * 3. **Innovation Metrics**: Innovation score, tech level, active projects, patents owned
 * 4. **Research Projects Table**: Project tracking with progress, success chance, impact
 * 5. **Patent Portfolio**: Detailed patent cards with status, dates, value
 * 6. **Innovation Performance**: Research speed, completion rate, patent success
 * 7. **Action Buttons**: Start Project (placeholder modal)
 * 8. **Responsive Grid**: Mobile-friendly layouts
 * 
 * USAGE:
 * ```tsx
 * <RDDashboard 
 *   department={rdData} 
 *   companyId={company.id}
 *   onUpdate={() => refetch()}
 * />
 * ```
 */
