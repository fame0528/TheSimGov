'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { formatCurrency } from '@/lib/utils/formatting';
import BreakthroughPatentTracker from '@/components/ai/BreakthroughPatentTracker';

// NOTE: Phase 5 Research Project Detail Page
// Dynamic route page showing individual research project progress, actions, and breakthrough/patent tracking.
// Integrates BreakthroughPatentTracker component for full IP management.

interface ResearchDetail {
  id: string;
  name: string;
  type: 'Performance' | 'Efficiency' | 'NewCapability';
  complexity: 'Low' | 'Medium' | 'High';
  status: 'InProgress' | 'Completed' | 'Cancelled';
  progress: number;
  budgetAllocated: number;
  budgetSpent: number;
  breakthroughs: number;
  description: string;
  expectedImpact: string;
  createdAt: Date;
  completedAt?: Date;
}

export default function ResearchProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);

  // Placeholder research project data (real implementation would fetch from API)
  const project: ResearchDetail = {
    id,
    name: 'Transformer Architecture Efficiency',
    type: 'Efficiency',
    complexity: 'High',
    status: 'InProgress',
    progress: 45,
    budgetAllocated: 500000,
    budgetSpent: 210000,
    breakthroughs: 2,
    description: 'Research initiative focused on reducing compute requirements for large language models through architectural innovations and training optimizations.',
    expectedImpact: 'Potential 40% reduction in training cost and 25% improvement in inference speed.',
    createdAt: new Date('2025-10-15'),
  };

  const handleAdvanceProgress = () => {
    console.log('Advance progress for project:', id);
  };

  const handleCancel = () => {
    if (confirm(`Cancel research project "${project.name}"?`)) {
      console.log('Cancel project:', id);
      router.push('/ai/research');
    }
  };

  const budgetUtilization = (project.budgetSpent / project.budgetAllocated) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex gap-2 mt-2">
            <Chip size="sm" color={
              project.type === 'Performance' ? 'primary' :
              project.type === 'Efficiency' ? 'success' : 'warning'
            }>
              {project.type}
            </Chip>
            <Chip size="sm" color={
              project.complexity === 'Low' ? 'success' :
              project.complexity === 'Medium' ? 'warning' : 'danger'
            }>
              {project.complexity} Complexity
            </Chip>
            <Chip size="sm" color={
              project.status === 'InProgress' ? 'primary' :
              project.status === 'Completed' ? 'success' : 'danger'
            }>
              {project.status}
            </Chip>
          </div>
        </div>
        <Button variant="flat" onPress={() => router.push('/ai/research')}>
          Back to Research
        </Button>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Project Overview</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <p className="text-sm text-default-700 mb-1">Description</p>
            <p>{project.description}</p>
          </div>
          <div>
            <p className="text-sm text-default-700 mb-1">Expected Impact</p>
            <p className="font-medium">{project.expectedImpact}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-default-700">Created</p>
              <p className="font-bold">{project.createdAt.toLocaleDateString()}</p>
            </div>
            {project.completedAt && (
              <div>
                <p className="text-sm text-default-700">Completed</p>
                <p className="font-bold">{project.completedAt.toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Progress & Budget */}
      {project.status === 'InProgress' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Research Progress</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Overall Progress</span>
                  <span className="font-bold">{project.progress}%</span>
                </div>
                <Progress value={project.progress} color="primary" size="md" />
              </div>
              <Button color="primary" onPress={handleAdvanceProgress} fullWidth>
                +10% Progress
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Budget Tracking</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Budget Utilization</span>
                  <span className="font-bold">
                    {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetAllocated)}
                  </span>
                </div>
                <Progress 
                  value={budgetUtilization} 
                  color={budgetUtilization > 90 ? 'danger' : budgetUtilization > 70 ? 'warning' : 'success'}
                  size="md"
                />
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm text-default-700">Remaining Budget</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(project.budgetAllocated - project.budgetSpent)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Breakthroughs & Patents - Full Tracker */}
      <BreakthroughPatentTracker 
        projectId={id} 
        companyId="placeholder-company-id" // TODO: Get from session/context
      />

      {/* Actions */}
      {project.status === 'InProgress' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Project Actions</h2>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2">
              <Button color="danger" variant="flat" onPress={handleCancel}>
                Cancel Project
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
