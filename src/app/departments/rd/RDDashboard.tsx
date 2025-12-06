/**
 * @fileoverview R&D Department Dashboard
 * @module app/departments/rd/RDDashboard
 * 
 * OVERVIEW:
 * Research & Development dashboard for innovation and research project management.
 * Integrates with /api/departments/rd/research endpoint.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Tabs, Tab, Input, Select, SelectItem, Chip, Progress } from '@heroui/react';
import { FaLightbulb, FaPlus, FaTimes, FaFlask } from 'react-icons/fa';
import { KPIGrid } from '@/lib/components/departments/KPIGrid';
import type { Department } from '@/lib/types/department';

export interface RDDashboardProps {
  department: Department;
  onRefresh: () => Promise<void>;
}

export default function RDDashboard({ department, onRefresh }: RDDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Research project form
  const [projectForm, setProjectForm] = useState({
    name: '',
    category: 'product' as 'product' | 'process' | 'technology' | 'sustainability',
    budget: '50000',
    durationWeeks: '12',
    successChance: '70',
    potentialImpact: '3',
  });

  /**
   * Create research project
   */
  const handleProjectSubmit = async () => {
    try {
      const response = await fetch('/api/departments/rd/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: department.companyId,
          name: projectForm.name,
          category: projectForm.category,
          budget: parseFloat(projectForm.budget),
          durationWeeks: parseInt(projectForm.durationWeeks),
          successChance: parseInt(projectForm.successChance),
          potentialImpact: parseInt(projectForm.potentialImpact),
        }),
      });

      if (!response.ok) throw new Error('Research project creation failed');
      
      setIsCreatingProject(false);
      setProjectForm({ name: '', category: 'product', budget: '50000', durationWeeks: '12', successChance: '70', potentialImpact: '3' });
      await onRefresh();
    } catch (error) {
      console.error('Research project creation error:', error);
    }
  };

  const rdKPIs = [
    { label: 'Innovation Points', value: (department.innovationPoints || 0).toString(), change: '+125', trend: 'up' as const, variant: 'success' as const },
    { label: 'Active Projects', value: (department.research?.length || 0).toString(), variant: 'default' as const },
    { label: 'Patents Filed', value: '8', change: '+3', trend: 'up' as const, variant: 'success' as const },
    { label: 'Success Rate', value: '72%', change: '+5%', trend: 'up' as const, variant: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaLightbulb size={32} className="text-secondary" />
            {department.name}
          </h1>
          <p className="text-default-700">Level {department.level} • {department.budgetPercentage}% Budget Allocation</p>
        </div>
        <Chip color="secondary" variant="flat" size="lg">
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
        color="secondary"
      >
        <Tab key="overview" title="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Innovation Metrics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Innovation Portfolio</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Innovation Points</span>
                  <span className="font-bold text-lg">{department.innovationPoints || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Active Projects</span>
                  <span className="font-semibold">{(department.research || []).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Patents Filed</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Patents Granted</span>
                  <span className="font-semibold">5</span>
                </div>
              </CardBody>
            </Card>

            {/* Research Impact */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Research Impact</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Success Rate</span>
                  <span className="font-semibold text-success">72%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Average Impact Score</span>
                  <span className="font-semibold">3.2 / 5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Total Investment</span>
                  <span className="font-semibold">${Math.floor((department.totalInvestment || 0) / 1000)}k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-600">ROI from Innovation</span>
                  <span className="font-semibold text-success">+18%</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="projects" title="Research Projects">
          <div className="mt-6 space-y-4">
            {!isCreatingProject ? (
              <Button
                color="secondary"
                startContent={<FaFlask size={16} />}
                onPress={() => setIsCreatingProject(true)}
              >
                Start New Project
              </Button>
            ) : (
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Create Research Project</h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setIsCreatingProject(false)}
                  >
                    <FaTimes size={16} />
                  </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Project Name"
                    placeholder="AI-Powered Analytics"
                    value={projectForm.name}
                    onValueChange={(value) => setProjectForm({ ...projectForm, name: value })}
                  />
                  <Select
                    label="Research Category"
                    selectedKeys={[projectForm.category]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as typeof projectForm.category;
                      setProjectForm({ ...projectForm, category: value });
                    }}
                  >
                    <SelectItem key="product">Product Innovation</SelectItem>
                    <SelectItem key="process">Process Improvement</SelectItem>
                    <SelectItem key="technology">Technology Advancement</SelectItem>
                    <SelectItem key="sustainability">Sustainability Initiative</SelectItem>
                  </Select>
                  <Input
                    type="number"
                    label="Budget"
                    placeholder="50000"
                    value={projectForm.budget}
                    onValueChange={(value) => setProjectForm({ ...projectForm, budget: value })}
                    startContent={<span className="text-default-400">$</span>}
                  />
                  <Input
                    type="number"
                    label="Duration (Weeks)"
                    placeholder="12"
                    value={projectForm.durationWeeks}
                    onValueChange={(value) => setProjectForm({ ...projectForm, durationWeeks: value })}
                  />
                  <Input
                    type="number"
                    label="Success Chance (%)"
                    placeholder="70"
                    value={projectForm.successChance}
                    onValueChange={(value) => setProjectForm({ ...projectForm, successChance: value })}
                  />
                  <Select
                    label="Potential Impact"
                    selectedKeys={[projectForm.potentialImpact]}
                    onSelectionChange={(keys) => {
                      const value = String(Array.from(keys)[0]);
                      setProjectForm({ ...projectForm, potentialImpact: value });
                    }}
                  >
                    <SelectItem key="1">1 - Minor</SelectItem>
                    <SelectItem key="2">2 - Moderate</SelectItem>
                    <SelectItem key="3">3 - Significant</SelectItem>
                    <SelectItem key="4">4 - Major</SelectItem>
                    <SelectItem key="5">5 - Transformative</SelectItem>
                  </Select>
                  <Button color="secondary" onPress={handleProjectSubmit}>
                    Launch Project
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Active Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(department.research || []).map((project: any, index: number) => (
                <Card key={index}>
                  <CardBody>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{project.name}</p>
                          <p className="text-sm text-default-700 capitalize">
                            {project.category}
                          </p>
                        </div>
                        <Chip
                          color={project.progress === 100 ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {project.progress === 100 ? 'Complete' : 'Active'}
                        </Chip>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-default-600">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress
                          value={project.progress}
                          color="secondary"
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-default-600">Budget</span>
                          <span className="font-semibold">${(project.budget / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">Duration</span>
                          <span className="font-semibold">{project.durationWeeks} weeks</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">Success Chance</span>
                          <span className="font-semibold">{project.successChance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">Impact</span>
                          <span className="font-semibold">{project.potentialImpact} / 5</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>

        <Tab key="patents" title="Patents">
          <div className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Patent Portfolio</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                  <div>
                    <p className="font-semibold">AI-Powered Customer Insights</p>
                    <p className="text-sm text-default-700">Filed: 2024-08-15</p>
                  </div>
                  <Chip color="success" size="sm">Granted</Chip>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                  <div>
                    <p className="font-semibold">Blockchain Supply Chain</p>
                    <p className="text-sm text-default-700">Filed: 2024-09-22</p>
                  </div>
                  <Chip color="warning" size="sm">Pending</Chip>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-default-100 rounded-lg">
                  <div>
                    <p className="font-semibold">Green Energy Optimization</p>
                    <p className="text-sm text-default-700">Filed: 2024-10-11</p>
                  </div>
                  <Chip color="success" size="sm">Granted</Chip>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
