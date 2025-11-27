/**
 * @fileoverview HR Department Dashboard
 * @module app/departments/hr/HRDashboard
 * 
 * OVERVIEW:
 * Human Resources department dashboard for recruitment and training management.
 * Integrates with /api/departments/hr/recruitment and /api/departments/hr/training.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Tabs, Tab, Input, Select, SelectItem, Chip, Progress } from '@heroui/react';
import { FaUsers, FaPlus, FaTimes, FaGraduationCap, FaUserPlus } from 'react-icons/fa';
import { KPIGrid } from '@/lib/components/departments/KPIGrid';
import type { Department } from '@/lib/types/department';

export interface HRDashboardProps {
  department: Department;
  onRefresh: () => Promise<void>;
}

export default function HRDashboard({ department, onRefresh }: HRDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreatingRecruitment, setIsCreatingRecruitment] = useState(false);
  const [isCreatingTraining, setIsCreatingTraining] = useState(false);

  // Recruitment form
  const [recruitmentForm, setRecruitmentForm] = useState({
    role: '',
    positions: '5',
    budget: '50000',
    durationWeeks: '4',
  });

  // Training form
  const [trainingForm, setTrainingForm] = useState({
    name: '',
    skillTarget: '',
    durationWeeks: '8',
    cost: '15000',
    capacity: '20',
  });

  /**
   * Create recruitment campaign
   */
  const handleRecruitmentSubmit = async () => {
    try {
      const response = await fetch('/api/departments/hr/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          role: recruitmentForm.role,
          positions: parseInt(recruitmentForm.positions),
          budget: parseFloat(recruitmentForm.budget),
          durationWeeks: parseInt(recruitmentForm.durationWeeks),
        }),
      });

      if (!response.ok) throw new Error('Recruitment creation failed');
      
      setIsCreatingRecruitment(false);
      setRecruitmentForm({ role: '', positions: '5', budget: '50000', durationWeeks: '4' });
      await onRefresh();
    } catch (error) {
      console.error('Recruitment creation error:', error);
    }
  };

  /**
   * Create training program
   */
  const handleTrainingSubmit = async () => {
    try {
      const response = await fetch('/api/departments/hr/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          name: trainingForm.name,
          skillTarget: trainingForm.skillTarget,
          durationWeeks: parseInt(trainingForm.durationWeeks),
          cost: parseFloat(trainingForm.cost),
          capacity: parseInt(trainingForm.capacity),
        }),
      });

      if (!response.ok) throw new Error('Training creation failed');
      
      setIsCreatingTraining(false);
      setTrainingForm({ name: '', skillTarget: '', durationWeeks: '8', cost: '15000', capacity: '20' });
      await onRefresh();
    } catch (error) {
      console.error('Training creation error:', error);
    }
  };

  const hrKPIs = [
    { label: 'Employees', value: (department.totalEmployees || 0).toString(), variant: 'default' as const },
    { label: 'Turnover', value: '8%', change: '-2%', trend: 'down' as const, variant: 'success' as const },
    { label: 'Training Budget', value: '$125k', variant: 'default' as const },
    { label: 'Satisfaction', value: '85%', change: '+5%', trend: 'up' as const, variant: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaUsers size={32} className="text-primary" />
            {department.name}
          </h1>
          <p className="text-default-500">Level {department.level} • {department.budgetPercentage}% Budget Allocation</p>
        </div>
        <Chip color="primary" variant="flat" size="lg">
          Budget: ${(department.budget / 1000).toFixed(0)}k
        </Chip>
      </div>

      {/* KPI Grid */}
      <KPIGrid kpis={department.kpis} showDescriptions columns={5} />

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        variant="underlined"
        color="primary"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Workforce Summary</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Total Employees</span>
                  <span className="font-bold text-lg">{department.totalEmployees || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Active Recruitment</span>
                  <span className="font-semibold">{(department.recruitment || []).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Training Programs</span>
                  <span className="font-semibold">{(department.training || []).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Turnover Rate</span>
                  <span className="font-semibold text-success">8%</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Skills Development</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Leadership</span>
                    <span className="text-sm font-medium">72%</span>
                  </div>
                  <Progress value={72} color="primary" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Technical Skills</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} color="success" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Communication</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <Progress value={68} color="warning" size="sm" />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="recruitment" title="Recruitment">
          <div className="mt-6 space-y-4">
            {!isCreatingRecruitment ? (
              <Button
                color="primary"
                startContent={<FaUserPlus size={16} />}
                onPress={() => setIsCreatingRecruitment(true)}
              >
                New Recruitment Campaign
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Create Recruitment Campaign</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingRecruitment(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Role"
                    placeholder="Software Engineer"
                    value={recruitmentForm.role}
                    onValueChange={(value) => setRecruitmentForm({ ...recruitmentForm, role: value })}
                  />
                  <Input
                    type="number"
                    label="Positions"
                    placeholder="5"
                    value={recruitmentForm.positions}
                    onValueChange={(value) => setRecruitmentForm({ ...recruitmentForm, positions: value })}
                  />
                  <Input
                    type="number"
                    label="Budget"
                    placeholder="50000"
                    value={recruitmentForm.budget}
                    onValueChange={(value) => setRecruitmentForm({ ...recruitmentForm, budget: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Input
                    type="number"
                    label="Duration (Weeks)"
                    placeholder="4"
                    value={recruitmentForm.durationWeeks}
                    onValueChange={(value) => setRecruitmentForm({ ...recruitmentForm, durationWeeks: value })}
                  />
                  <Button color="primary" onPress={handleRecruitmentSubmit}>
                    Launch Campaign
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Active Campaigns */}
            <div className="space-y-3">
              {(department.recruitment || []).map((campaign: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{campaign.role}</p>
                        <p className="text-sm text-default-500">
                          {campaign.positions} positions • {campaign.durationWeeks} weeks
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={(campaign.applicants / campaign.positions) * 100}
                            color="primary"
                            size="sm"
                            label="Applicants"
                          />
                          <p className="text-xs text-default-500 mt-1">
                            {campaign.applicants} applicants, {campaign.hired} hired
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(campaign.budget / 1000).toFixed(0)}k</p>
                        <Chip color="primary" size="sm" className="mt-1">
                          Active
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>

        <Tab key="training" title="Training">
          <div className="mt-6 space-y-4">
            {!isCreatingTraining ? (
              <Button
                color="primary"
                startContent={<FaGraduationCap size={16} />}
                onPress={() => setIsCreatingTraining(true)}
              >
                New Training Program
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Create Training Program</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingTraining(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Program Name"
                    placeholder="Leadership Fundamentals"
                    value={trainingForm.name}
                    onValueChange={(value) => setTrainingForm({ ...trainingForm, name: value })}
                  />
                  <Input
                    label="Skill Target"
                    placeholder="Leadership, Management"
                    value={trainingForm.skillTarget}
                    onValueChange={(value) => setTrainingForm({ ...trainingForm, skillTarget: value })}
                  />
                  <Input
                    type="number"
                    label="Duration (Weeks)"
                    placeholder="8"
                    value={trainingForm.durationWeeks}
                    onValueChange={(value) => setTrainingForm({ ...trainingForm, durationWeeks: value })}
                  />
                  <Input
                    type="number"
                    label="Cost"
                    placeholder="15000"
                    value={trainingForm.cost}
                    onValueChange={(value) => setTrainingForm({ ...trainingForm, cost: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Input
                    type="number"
                    label="Capacity (Employees)"
                    placeholder="20"
                    value={trainingForm.capacity}
                    onValueChange={(value) => setTrainingForm({ ...trainingForm, capacity: value })}
                  />
                  <Button color="primary" onPress={handleTrainingSubmit}>
                    Create Program
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Training Programs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(department.training || []).map((program: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold">{program.name}</p>
                        <Chip
                          color={program.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {program.status}
                        </Chip>
                      </div>
                      <p className="text-sm text-default-500">{program.skillTarget}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">Duration</span>
                        <span className="font-semibold">{program.durationWeeks} weeks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">Enrolled</span>
                        <span className="font-semibold">{program.enrolled || 0} / {program.capacity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">Cost</span>
                        <span className="font-semibold">${(program.cost / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
