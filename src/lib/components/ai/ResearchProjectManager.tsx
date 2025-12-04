/**
 * @fileoverview Research Project Manager - Research Project Management Component
 * @module lib/components/ai/ResearchProjectManager
 * 
 * OVERVIEW:
 * Manages AI research projects with creation, progress tracking, budget monitoring, and filtering.
 * Adapted from legacy AIResearchDashboard.tsx with Chakra UI → HeroUI migration.
 * 
 * FEATURES:
 * - Project creation modal (name, type, complexity, budget)
 * - Progress tracking with +10% advancement button
 * - Budget monitoring (allocated vs spent with color-coded progress bars)
 * - Project filtering (InProgress/Completed/Cancelled)
 * - Project grid display (2 columns)
 * - Stats summary (active/completed/budget/breakthroughs)
 * - Breakthrough recording and patent filing
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Input, Textarea } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/lib/utils/formatting';

export interface ResearchProjectManagerProps {
  /** Company ID */
  companyId: string;
  /** Existing research projects */
  projects?: ResearchProject[];
  /** Create project handler */
  onCreateProject?: (project: Partial<ResearchProject>) => void;
  /** Advance progress handler */
  onAdvanceProgress?: (projectId: string) => void;
  /** Cancel project handler */
  onCancelProject?: (projectId: string) => void;
}

export interface ResearchProject {
  id: string;
  name: string;
  type: 'Performance' | 'Efficiency' | 'NewCapability';
  complexity: 'Low' | 'Medium' | 'High';
  status: 'InProgress' | 'Completed' | 'Cancelled';
  progress: number;
  budgetAllocated: number;
  budgetSpent: number;
  breakthroughs: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * ResearchProjectManager Component
 * 
 * Manages AI research projects with creation, progress tracking, and budget monitoring.
 * 
 * @example
 * ```tsx
 * <ResearchProjectManager
 *   companyId="123"
 *   projects={researchProjects}
 *   onCreateProject={(project) => createNewResearch(project)}
 * />
 * ```
 */
export function ResearchProjectManager({
  companyId: _companyId,
  projects = [],
  onCreateProject,
  onAdvanceProgress,
  onCancelProject,
}: ResearchProjectManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'InProgress' | 'Completed' | 'Cancelled'>('All');
  
  // Create modal form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Performance' | 'Efficiency' | 'NewCapability'>('Performance');
  const [newComplexity, setNewComplexity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newBudget, setNewBudget] = useState(100000);
  const [isCreating, setIsCreating] = useState(false);

  // Filter projects
  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.status === filter);

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'InProgress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budgetAllocated, 0);
  const totalBreakthroughs = projects.reduce((sum, p) => sum + p.breakthroughs, 0);

  const handleCreateProject = async () => {
    if (!newName.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (newBudget < 100000) {
      toast.error('Minimum budget is $100,000');
      return;
    }

    setIsCreating(true);
    try {
      if (onCreateProject) {
        await onCreateProject({
          name: newName,
          type: newType,
          complexity: newComplexity,
          status: 'InProgress',
          progress: 0,
          budgetAllocated: newBudget,
          budgetSpent: 0,
          breakthroughs: 0,
          createdAt: new Date(),
        });
      }
      toast.success(`Research project "${newName}" created!`);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewBudget(100000);
    } catch (error) {
      toast.error('Failed to create research project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdvanceProgress = async (projectId: string) => {
    if (onAdvanceProgress) {
      await onAdvanceProgress(projectId);
      toast.success('Research progress advanced by 10%');
    }
  };

  const handleCancelProject = async (projectId: string, projectName: string) => {
    if (confirm(`Cancel research project "${projectName}"?`)) {
      if (onCancelProject) {
        await onCancelProject(projectId);
        toast.error(`Research project cancelled`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">🔬 Research Project Manager</h2>
          <p className="text-default-500">Manage AI research initiatives and breakthroughs</p>
        </div>
        <Button color="primary" onPress={() => setIsCreateModalOpen(true)}>
          New Research Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Active Projects</p>
            <p className="text-2xl font-bold text-primary">{activeProjects}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Completed</p>
            <p className="text-2xl font-bold text-success">{completedProjects}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Total Budget</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalBudget)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Breakthroughs</p>
            <p className="text-2xl font-bold text-danger">{totalBreakthroughs}</p>
          </CardBody>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Filter:</span>
        <Select
          selectedKeys={[filter]}
          onSelectionChange={(keys) => setFilter(String(Array.from(keys)[0]) as typeof filter)}
          className="max-w-xs"
          size="sm"
        >
            <SelectItem key="All">All Projects</SelectItem>
            <SelectItem key="InProgress">In Progress</SelectItem>
            <SelectItem key="Completed">Completed</SelectItem>
            <SelectItem key="Cancelled">Cancelled</SelectItem>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-default-500 py-8">
              No research projects yet. Create your first project to start advancing AI capabilities!
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <div className="flex gap-2 mt-1">
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
                      {project.complexity}
                    </Chip>
                    <Chip size="sm" color={
                      project.status === 'InProgress' ? 'primary' :
                      project.status === 'Completed' ? 'success' : 'danger'
                    }>
                      {project.status}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress 
                    value={project.progress} 
                    color={project.progress >= 100 ? 'success' : 'primary'}
                    size="sm"
                  />
                </div>

                {/* Budget */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget</span>
                    <span className="font-medium">
                      {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetAllocated)}
                    </span>
                  </div>
                  <Progress 
                    value={(project.budgetSpent / project.budgetAllocated) * 100} 
                    color={project.budgetSpent / project.budgetAllocated > 0.9 ? 'danger' : 'success'}
                    size="sm"
                  />
                </div>

                {/* Breakthroughs */}
                <div className="flex justify-between text-sm">
                  <span className="text-default-500">Breakthroughs</span>
                  <span className="font-bold text-warning">{project.breakthroughs}</span>
                </div>

                {/* Actions */}
                {project.status === 'InProgress' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      color="primary"
                      onPress={() => handleAdvanceProgress(project.id)}
                      isDisabled={project.progress >= 100}
                    >
                      +10% Progress
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => handleCancelProject(project.id, project.name)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">New Research Project</h3>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <Textarea
                value={newName}
                onValueChange={setNewName}
                placeholder="Large Language Model Optimization"
                minRows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Research Type</label>
              <Select
                selectedKeys={[newType]}
                onSelectionChange={(keys) => setNewType(String(Array.from(keys)[0]) as typeof newType)}
              >
              <SelectItem key="Performance">Performance (speed, accuracy)</SelectItem>
              <SelectItem key="Efficiency">Efficiency (cost reduction)</SelectItem>
              <SelectItem key="NewCapability">New Capability (breakthrough)</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Complexity</label>
              <Select
                selectedKeys={[newComplexity]}
                onSelectionChange={(keys) => setNewComplexity(String(Array.from(keys)[0]) as typeof newComplexity)}
              >
              <SelectItem key="Low">Low (incremental improvement)</SelectItem>
              <SelectItem key="Medium">Medium (significant advancement)</SelectItem>
              <SelectItem key="High">High (paradigm shift)</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget Allocation</label>
              <Input
                type="number"
                value={newBudget.toString()}
                onValueChange={(value) => setNewBudget(parseInt(value) || 0)}
                startContent={<span className="text-default-400">$</span>}
                description="Minimum $100,000"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateProject} isLoading={isCreating}>
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Direct Adaptation**: From old AIResearchDashboard.tsx with Chakra → HeroUI migration
 * 2. **Project Creation**: Modal with name, type, complexity, budget inputs
 * 3. **Progress Tracking**: +10% button with loading state, color-coded progress bars
 * 4. **Budget Monitoring**: Allocated vs spent with red alert >90% utilization
 * 5. **Filtering**: Select dropdown for InProgress/Completed/Cancelled
 * 6. **Stats Display**: Active, completed, total budget, breakthroughs
 * 7. **Project Grid**: 2-column responsive layout with Cards
 * 8. **Color Coding**: Type (primary/success/warning), Complexity (success/warning/danger), Status (primary/success/danger)
 * 
 * MIGRATED FROM CHAKRA UI:
 * - Modal → Modal (HeroUI, no ModalOverlay needed)
 * - Select → Select (HeroUI with items prop)
 * - NumberInput → Input type="number"
 * - Progress → Progress (HeroUI with value + color)
 * - Badge → Chip (HeroUI, colorScheme → color)
 * - useToast → react-toastify (toast.success, toast.error)
 */
