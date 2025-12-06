/**
 * @file src/components/consulting/ConsultingDashboard.tsx
 * @description HeroUI ConsultingDashboard for managing consulting projects
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Comprehensive dashboard for consulting project management using HeroUI components.
 * Features: Metrics cards, project table, pipeline view, filters, and create modal.
 * Converted from legacy Chakra UI dashboard following HeroUI patterns.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Spinner,
  Tooltip,
  Divider,
  useDisclosure,
} from '@heroui/react';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiBriefcase,
  FiCalendar,
} from 'react-icons/fi';
import { useConsulting, useConsultingMutations } from '@/hooks/useConsulting';
import { ProjectCard } from './ProjectCard';
import type { 
  ConsultingProjectData, 
  ConsultingProjectCreate,
  ConsultingMetrics,
  ConsultingRecommendation,
} from '@/types/consulting';
import { 
  ConsultingProjectStatus, 
  ConsultingProjectType, 
  ConsultingBillingModel,
  ConsultingProjectPhase,
} from '@/types/consulting';
import {
  calculatePipelineStats,
  calculateTypeBreakdown,
  calculateBillingBreakdown,
} from '@/lib/utils/consulting';

// ============================================================================
// TYPES
// ============================================================================

export interface ConsultingDashboardProps {
  companyId: string;
}

type TabKey = 'overview' | 'projects' | 'pipeline' | 'analytics';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusColor(status: ConsultingProjectStatus): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case ConsultingProjectStatus.PROPOSAL: return 'default';
    case ConsultingProjectStatus.ACTIVE: return 'primary';
    case ConsultingProjectStatus.COMPLETED: return 'success';
    case ConsultingProjectStatus.CANCELLED: return 'danger';
    default: return 'default';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Metric card for displaying KPIs - AAA Design matching Banking
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'bg-blue-900/30 text-blue-400',
    success: 'bg-green-900/30 text-green-400',
    warning: 'bg-yellow-900/30 text-yellow-400',
    danger: 'bg-red-900/30 text-red-400',
  };

  return (
    <Card className="p-4 bg-slate-800/50 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <Chip 
            size="sm" 
            color={trend.value >= 0 ? 'success' : 'danger'}
            variant="flat"
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </Chip>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

/**
 * Recommendation alert card
 */
function RecommendationCard({ recommendation }: { recommendation: ConsultingRecommendation }) {
  const colorMap = {
    warning: 'warning',
    opportunity: 'primary',
    action: 'danger',
  } as const;

  const iconMap = {
    warning: FiAlertCircle,
    opportunity: FiTrendingUp,
    action: FiCheck,
  };

  const Icon = iconMap[recommendation.type];
  const color = colorMap[recommendation.type];

  return (
    <Card className={`border-l-4 border-${color}`}>
      <CardBody className="p-3">
        <div className="flex items-start gap-3">
          <div className={`text-${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{recommendation.title}</p>
              <Chip size="sm" color={color} variant="flat">
                {recommendation.priority}
              </Chip>
            </div>
            <p className="text-xs text-default-700 mt-1">{recommendation.description}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// CREATE PROJECT MODAL
// ============================================================================

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConsultingProjectCreate) => Promise<void>;
  isLoading: boolean;
}

function CreateProjectModal({ isOpen, onClose, onSubmit, isLoading }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<Partial<ConsultingProjectCreate>>({
    projectType: ConsultingProjectType.STRATEGY,
    billingModel: ConsultingBillingModel.FIXED,
    status: ConsultingProjectStatus.PROPOSAL,
    phase: ConsultingProjectPhase.DISCOVERY,
    hourlyRate: 250,
    teamSize: 1,
    deliverables: [],
  });

  const handleSubmit = async () => {
    const submitData: ConsultingProjectCreate = {
      client: formData.client || '',
      clientContact: {
        name: formData.clientContact?.name || '',
        email: formData.clientContact?.email || '',
      },
      projectName: formData.projectName || '',
      projectType: formData.projectType || ConsultingProjectType.STRATEGY,
      startDate: formData.startDate || new Date(),
      deadline: formData.deadline || new Date(),
      scope: formData.scope || '',
      deliverables: formData.deliverables?.length ? formData.deliverables : ['Initial deliverable'],
      billingModel: formData.billingModel || ConsultingBillingModel.FIXED,
      hoursEstimated: formData.hoursEstimated || 100,
      fixedFee: formData.fixedFee,
      hourlyRate: formData.hourlyRate,
      retainerMonthly: formData.retainerMonthly,
    };

    await onSubmit(submitData);
    setFormData({
      projectType: ConsultingProjectType.STRATEGY,
      billingModel: ConsultingBillingModel.FIXED,
      status: ConsultingProjectStatus.PROPOSAL,
      phase: ConsultingProjectPhase.DISCOVERY,
      hourlyRate: 250,
      teamSize: 1,
      deliverables: [],
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Create Consulting Project</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Client Name"
                placeholder="Enter client company name"
                value={formData.client || ''}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                isRequired
              />
              <Input
                label="Project Name"
                placeholder="Enter project name"
                value={formData.projectName || ''}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                isRequired
              />
            </div>

            {/* Client Contact */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Name"
                placeholder="Client contact name"
                value={formData.clientContact?.name || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  clientContact: { ...formData.clientContact, name: e.target.value, email: formData.clientContact?.email || '' } 
                })}
                isRequired
              />
              <Input
                type="email"
                label="Contact Email"
                placeholder="client@company.com"
                value={formData.clientContact?.email || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  clientContact: { ...formData.clientContact, email: e.target.value, name: formData.clientContact?.name || '' } 
                })}
                isRequired
              />
            </div>

            {/* Project Type & Billing */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Project Type"
                placeholder="Select type"
                selectedKeys={formData.projectType ? [formData.projectType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ConsultingProjectType;
                  setFormData({ ...formData, projectType: selected });
                }}
              >
                {Object.values(ConsultingProjectType).map((type) => (
                  <SelectItem key={type}>{type}</SelectItem>
                ))}
              </Select>
              <Select
                label="Billing Model"
                placeholder="Select billing"
                selectedKeys={formData.billingModel ? [formData.billingModel] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ConsultingBillingModel;
                  setFormData({ ...formData, billingModel: selected });
                }}
              >
                {Object.values(ConsultingBillingModel).map((model) => (
                  <SelectItem key={model}>{model}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-3 gap-4">
              {formData.billingModel === ConsultingBillingModel.HOURLY && (
                <Input
                  type="number"
                  label="Hourly Rate ($)"
                  placeholder="250"
                  value={String(formData.hourlyRate || '')}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                />
              )}
              {(formData.billingModel === ConsultingBillingModel.FIXED || 
                formData.billingModel === ConsultingBillingModel.PERFORMANCE) && (
                <Input
                  type="number"
                  label="Fixed Fee ($)"
                  placeholder="50000"
                  value={String(formData.fixedFee || '')}
                  onChange={(e) => setFormData({ ...formData, fixedFee: Number(e.target.value) })}
                />
              )}
              {formData.billingModel === ConsultingBillingModel.RETAINER && (
                <Input
                  type="number"
                  label="Monthly Retainer ($)"
                  placeholder="10000"
                  value={String(formData.retainerMonthly || '')}
                  onChange={(e) => setFormData({ ...formData, retainerMonthly: Number(e.target.value) })}
                />
              )}
              <Input
                type="number"
                label="Estimated Hours"
                placeholder="100"
                value={String(formData.hoursEstimated || '')}
                onChange={(e) => setFormData({ ...formData, hoursEstimated: Number(e.target.value) })}
                isRequired
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                isRequired
              />
              <Input
                type="date"
                label="Deadline"
                value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, deadline: new Date(e.target.value) })}
                isRequired
              />
            </div>

            {/* Scope */}
            <Textarea
              label="Project Scope"
              placeholder="Describe the project scope and objectives..."
              value={formData.scope || ''}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              minRows={3}
              isRequired
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            Create Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConsultingDashboard({ companyId }: ConsultingDashboardProps): React.ReactElement {
  // State
  const [selectedTab, setSelectedTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConsultingProjectStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ConsultingProjectType | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data fetching
  const {
    projects,
    metrics,
    recommendations,
    isLoading,
    error,
    mutate,
  } = useConsulting(companyId, {
    includeMetrics: true,
    includeRecommendations: true,
  });

  const { createProject, deleteProject } = useConsultingMutations();

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = searchQuery === '' || 
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesType = typeFilter === 'all' || project.projectType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  // Computed stats
  const pipelineStats = useMemo(() => calculatePipelineStats(projects), [projects]);
  const typeBreakdown = useMemo(() => calculateTypeBreakdown(projects), [projects]);
  const billingBreakdown = useMemo(() => calculateBillingBreakdown(projects), [projects]);

  // Handlers
  const handleCreateProject = useCallback(async (data: ConsultingProjectCreate) => {
    setIsCreating(true);
    try {
      await createProject(data);
      await mutate();
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsCreating(false);
    }
  }, [createProject, mutate, onClose]);

  const handleDeleteProject = useCallback(async (project: ConsultingProjectData) => {
    if (confirm(`Delete project "${project.projectName}"?`)) {
      try {
        await deleteProject(project._id);
        await mutate();
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  }, [deleteProject, mutate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" label="Loading consulting data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-danger">
        <CardBody>
          <div className="flex items-center gap-3 text-danger">
            <FiAlertCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">Failed to load consulting data</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
          <Button className="mt-4" onPress={() => mutate()}>
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consulting Dashboard</h1>
          <p className="text-default-700">Manage projects, track revenue, and monitor client satisfaction</p>
        </div>
        <Button color="primary" startContent={<FiPlus />} onPress={onOpen}>
          New Project
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as TabKey)}
        aria-label="Consulting dashboard tabs"
      >
        <Tab key="overview" title="Overview">
          <div className="space-y-6 mt-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(metrics?.totalRevenue || 0)}
                subtitle={`${metrics?.completedProjects || 0} completed projects`}
                icon={FiDollarSign}
                color="success"
              />
              <MetricCard
                title="Active Projects"
                value={metrics?.activeProjects || 0}
                subtitle={`${metrics?.proposalProjects || 0} proposals`}
                icon={FiBriefcase}
                color="primary"
              />
              <MetricCard
                title="Avg Satisfaction"
                value={`${metrics?.averageClientSatisfaction?.toFixed(1) || 0}%`}
                subtitle={`${metrics?.onTimeDeliveryRate || 0}% on-time delivery`}
                icon={FiTrendingUp}
                color={metrics?.averageClientSatisfaction && metrics.averageClientSatisfaction >= 80 ? 'success' : 'warning'}
              />
              <MetricCard
                title="Utilization"
                value={`${metrics?.averageUtilizationRate?.toFixed(1) || 0}%`}
                subtitle={`${metrics?.totalHoursWorked?.toLocaleString() || 0} hours logged`}
                icon={FiClock}
                color={metrics?.averageUtilizationRate && metrics.averageUtilizationRate >= 70 ? 'success' : 'warning'}
              />
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Pipeline Value</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-3xl font-bold">{formatCurrency(metrics?.pipelineValue || 0)}</p>
                  <div className="mt-4 space-y-2">
                    {pipelineStats.map((stat) => (
                      <div key={stat.stage} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color={getStatusColor(stat.stage)} variant="flat">
                            {stat.stage}
                          </Chip>
                          <span className="text-sm">{stat.count}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(stat.totalValue)}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Profit Margin</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-3xl font-bold">{metrics?.averageProfitMargin?.toFixed(1) || 0}%</p>
                  <Progress
                    value={metrics?.averageProfitMargin || 0}
                    color={metrics?.averageProfitMargin && metrics.averageProfitMargin >= 65 ? 'success' : 'warning'}
                    className="mt-4"
                    showValueLabel
                  />
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-default-700">Total Profit</span>
                      <span className="font-medium">{formatCurrency(metrics?.totalProfit || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-default-700">Total Cost</span>
                      <span>{formatCurrency(metrics?.totalCost || 0)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Collections</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-3xl font-bold">{metrics?.collectionRate || 0}%</p>
                  <Progress
                    value={metrics?.collectionRate || 0}
                    color={metrics?.collectionRate && metrics.collectionRate >= 90 ? 'success' : 'warning'}
                    className="mt-4"
                    showValueLabel
                  />
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-default-700">Collected</span>
                      <span className="font-medium text-success">{formatCurrency(metrics?.totalCollected || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-default-700">Outstanding</span>
                      <span className="text-warning">{formatCurrency(metrics?.outstandingBalance || 0)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Recommendations</h3>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    {recommendations.slice(0, 5).map((rec, idx) => (
                      <RecommendationCard key={idx} recommendation={rec} />
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Recent Projects</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.slice(0, 6).map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      compact
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="projects" title="Projects">
          <div className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Input
                className="max-w-xs"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<FiSearch className="text-default-400" />}
              />
              <Select
                className="max-w-[150px]"
                placeholder="Status"
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ConsultingProjectStatus | undefined;
                  setStatusFilter(selected || 'all');
                }}
              >
                {Object.values(ConsultingProjectStatus).map((status) => (
                  <SelectItem key={status}>{status}</SelectItem>
                ))}
              </Select>
              <Select
                className="max-w-[150px]"
                placeholder="Type"
                selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as ConsultingProjectType | undefined;
                  setTypeFilter(selected || 'all');
                }}
              >
                {Object.values(ConsultingProjectType).map((type) => (
                  <SelectItem key={type}>{type}</SelectItem>
                ))}
              </Select>
              <Button
                variant="flat"
                onPress={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>

            {/* Projects Table */}
            <Table aria-label="Consulting projects table">
              <TableHeader>
                <TableColumn>PROJECT</TableColumn>
                <TableColumn>CLIENT</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>REVENUE</TableColumn>
                <TableColumn>HOURS</TableColumn>
                <TableColumn>DEADLINE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No projects found">
                {filteredProjects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.projectName}</p>
                        <p className="text-xs text-default-400">{project.billingModel}</p>
                      </div>
                    </TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">{project.projectType}</Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={getStatusColor(project.status)} variant="flat">
                        {project.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(project.totalRevenue)}</p>
                        <p className="text-xs text-default-400">{project.profitMargin.toFixed(1)}% margin</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{project.hoursWorked} / {project.hoursEstimated}</p>
                        <Progress
                          size="sm"
                          value={Math.min(100, (project.hoursWorked / project.hoursEstimated) * 100)}
                          color={project.hoursWorked > project.hoursEstimated ? 'danger' : 'primary'}
                          className="max-w-[100px]"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip content={formatDate(project.deadline)}>
                        <span>{formatDate(project.deadline)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isDisabled={project.status === ConsultingProjectStatus.ACTIVE}
                          onPress={() => handleDeleteProject(project)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tab>

        <Tab key="pipeline" title="Pipeline">
          <div className="space-y-6 mt-4">
            {/* Pipeline Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.values(ConsultingProjectStatus).map((status) => {
                const statusProjects = projects.filter(p => p.status === status);
                const totalValue = statusProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
                
                return (
                  <Card key={status}>
                    <CardHeader className="pb-0">
                      <div className="flex items-center justify-between w-full">
                        <Chip color={getStatusColor(status)} variant="flat">
                          {status}
                        </Chip>
                        <span className="text-sm font-medium">{statusProjects.length}</span>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <p className="text-lg font-semibold mb-4">{formatCurrency(totalValue)}</p>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {statusProjects.map((project) => (
                          <ProjectCard
                            key={project._id}
                            project={project}
                            compact
                          />
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </Tab>

        <Tab key="analytics" title="Analytics">
          <div className="space-y-6 mt-4">
            {/* Type Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Revenue by Project Type</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-4">
                  {typeBreakdown.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.type}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                      <Progress
                        value={(item.totalRevenue / (metrics?.totalRevenue || 1)) * 100}
                        color="primary"
                        size="sm"
                      />
                      <p className="text-xs text-default-400 mt-1">
                        {item.count} projects | {item.averageMargin.toFixed(1)}% avg margin | {item.averageSatisfaction.toFixed(0)}% satisfaction
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Billing Model Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Revenue by Billing Model</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {billingBreakdown.map((item) => (
                    <div key={item.model} className="p-4 bg-default-100 rounded-lg">
                      <p className="text-sm text-default-700">{item.model}</p>
                      <p className="text-xl font-bold">{formatCurrency(item.totalRevenue)}</p>
                      <p className="text-xs text-default-400 mt-1">
                        {item.count} projects | {item.percentOfRevenue}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}

export default ConsultingDashboard;
