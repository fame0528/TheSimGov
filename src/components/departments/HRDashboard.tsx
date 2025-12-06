/**
 * @fileoverview HR Department Dashboard Component
 * @module components/departments/HRDashboard
 * 
 * OVERVIEW:
 * Displays HR department KPIs, employee metrics, training programs, and recruitment campaigns.
 * Provides interfaces for creating training programs and launching recruitment.
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
import type { HRDepartment, TrainingProgram, RecruitmentCampaign } from '@/lib/types/department';

interface HRDashboardProps {
  department: HRDepartment;
  companyId: string;
  onUpdate?: () => void;
}

export default function HRDashboard({ department, companyId, onUpdate }: HRDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);

  // Training status colors
  const trainingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'danger';
      default: return 'warning';
    }
  };

  // Recruitment status colors
  const recruitmentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
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
              <p className="text-default-700">Level {department.level} • Budget: ${formatNumber(department.budget)}</p>
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
              <p className="text-sm text-default-700">Efficiency</p>
              <Progress value={department.kpis.efficiency} color="primary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.efficiency}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Performance</p>
              <Progress value={department.kpis.performance} color="secondary" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.performance}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">ROI</p>
              <Progress value={department.kpis.roi} color="success" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.roi}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Utilization</p>
              <Progress value={department.kpis.utilization} color="warning" className="mt-2" />
              <p className="text-xs mt-1">{department.kpis.utilization}%</p>
            </div>
            <div>
              <p className="text-sm text-default-700">Quality</p>
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
        aria-label="HR department sections"
        className="w-full"
      >
        {/* Overview Tab */}
        <Tab key="overview" title="Overview">
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-default-700">Total Employees</p>
                  <p className="text-2xl font-bold">{department.totalEmployees || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Turnover Rate</p>
                  <p className="text-2xl font-bold">{(department.employeeTurnover || 0).toFixed(1)}%</p>
                  <Chip size="sm" color={
                    (department.employeeTurnover || 0) < 10 ? 'success' :
                    (department.employeeTurnover || 0) < 20 ? 'warning' : 'danger'
                  } variant="flat" className="mt-2">
                    {(department.employeeTurnover || 0) < 10 ? 'Excellent' :
                     (department.employeeTurnover || 0) < 20 ? 'Good' : 'High'}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-default-700">Avg Salary</p>
                  <p className="text-2xl font-bold">${formatNumber(department.avgSalary || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-700">Training Budget</p>
                  <p className="text-2xl font-bold">${formatNumber(department.trainingBudget || 0)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Training Programs Tab */}
        <Tab key="training" title={`Training (${department.trainingPrograms?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Training Programs</h3>
              <Button color="primary" size="sm" onPress={() => {/* TODO: Open training program modal */}}>
                Create Program
              </Button>
            </CardHeader>
            <CardBody>
              {department.trainingPrograms && department.trainingPrograms.length > 0 ? (
                <Table aria-label="Training programs table">
                  <TableHeader>
                    <TableColumn>PROGRAM NAME</TableColumn>
                    <TableColumn>SKILL TARGET</TableColumn>
                    <TableColumn>DURATION</TableColumn>
                    <TableColumn>COST</TableColumn>
                    <TableColumn>ENROLLMENT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.trainingPrograms.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell>{program.name}</TableCell>
                        <TableCell>{program.skillTarget}</TableCell>
                        <TableCell>{program.duration} weeks</TableCell>
                        <TableCell>${formatNumber(program.cost)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(program.enrolled / program.capacity) * 100} 
                              color="primary" 
                              size="sm"
                              className="w-20"
                            />
                            <span className="text-xs">{program.enrolled}/{program.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip color={trainingStatusColor(program.status)} variant="flat" size="sm">
                            {program.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-700 py-8">No training programs</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Recruitment Tab */}
        <Tab key="recruitment" title={`Recruitment (${department.recruitmentCampaigns?.length || 0})`}>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recruitment Campaigns</h3>
              <Button color="success" size="sm" onPress={() => {/* TODO: Open recruitment modal */}}>
                Launch Campaign
              </Button>
            </CardHeader>
            <CardBody>
              {department.recruitmentCampaigns && department.recruitmentCampaigns.length > 0 ? (
                <Table aria-label="Recruitment campaigns table">
                  <TableHeader>
                    <TableColumn>ROLE</TableColumn>
                    <TableColumn>POSITIONS</TableColumn>
                    <TableColumn>BUDGET</TableColumn>
                    <TableColumn>DURATION</TableColumn>
                    <TableColumn>APPLICANTS</TableColumn>
                    <TableColumn>HIRED</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {department.recruitmentCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>{campaign.role}</TableCell>
                        <TableCell>{campaign.positions}</TableCell>
                        <TableCell>${formatNumber(campaign.budget)}</TableCell>
                        <TableCell>{campaign.duration} days</TableCell>
                        <TableCell>{campaign.applicants}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(campaign.hired / campaign.positions) * 100} 
                              color="success" 
                              size="sm"
                              className="w-20"
                            />
                            <span className="text-xs">{campaign.hired}/{campaign.positions}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip color={recruitmentStatusColor(campaign.status)} variant="flat" size="sm">
                            {campaign.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-default-700 py-8">No recruitment campaigns</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Skills Inventory Tab */}
        <Tab key="skills" title="Skills Inventory">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Company Skills Inventory</h3>
            </CardHeader>
            <CardBody>
              {department.skillsInventory && department.skillsInventory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {department.skillsInventory.map((skill, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{skill.skill}</h4>
                        <Chip size="sm" variant="flat">{skill.employeeCount} employees</Chip>
                      </div>
                      <div>
                        <p className="text-xs text-default-700 mb-1">Average Level</p>
                        <Progress 
                          value={(skill.avgLevel / 5) * 100} 
                          color="primary"
                          size="sm"
                        />
                        <p className="text-xs mt-1">{skill.avgLevel.toFixed(1)}/5.0</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-default-700 py-8">No skills inventory data</p>
              )}
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
 * 1. **Tab Structure**: Overview, Training, Recruitment, Skills Inventory sections
 * 2. **KPI Display**: Progress bars for 5 key metrics
 * 3. **Employee Metrics**: Total employees, turnover rate (color-coded), avg salary, training budget
 * 4. **Training Programs**: Program list with enrollment progress bars
 * 5. **Recruitment Campaigns**: Campaign tracking with hiring progress
 * 6. **Skills Inventory**: Grid layout showing company-wide skill levels
 * 7. **Action Buttons**: Create Program, Launch Campaign (placeholder modals)
 * 8. **Responsive Grid**: Mobile-friendly layouts
 * 
 * USAGE:
 * ```tsx
 * <HRDashboard 
 *   department={hrData} 
 *   companyId={company.id}
 *   onUpdate={() => refetch()}
 * />
 * ```
 */
