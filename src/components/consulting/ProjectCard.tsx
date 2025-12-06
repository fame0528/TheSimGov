/**
 * @file src/components/consulting/ProjectCard.tsx
 * @description HeroUI ProjectCard component for displaying consulting projects
 * @created 2025-11-29
 * 
 * OVERVIEW:
 * Displays consulting project information in a card format using HeroUI components.
 * Shows status badge, billing model, hours tracking, client satisfaction, and revenue.
 */

'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Progress,
  Divider,
  Button,
  Tooltip,
} from '@heroui/react';
import {
  FiClock,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';
import type { ConsultingProjectData } from '@/types/consulting';
import { ConsultingProjectStatus, ConsultingBillingModel, ConsultingProjectType } from '@/types/consulting';
import { calculateDaysUntilDeadline, isProjectAtRisk } from '@/lib/utils/consulting';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectCardProps {
  project: ConsultingProjectData;
  onEdit?: (project: ConsultingProjectData) => void;
  onDelete?: (project: ConsultingProjectData) => void;
  onSelect?: (project: ConsultingProjectData) => void;
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get status chip color based on project status
 */
function getStatusColor(status: ConsultingProjectStatus): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case ConsultingProjectStatus.PROPOSAL:
      return 'default';
    case ConsultingProjectStatus.ACTIVE:
      return 'primary';
    case ConsultingProjectStatus.COMPLETED:
      return 'success';
    case ConsultingProjectStatus.CANCELLED:
      return 'danger';
    default:
      return 'default';
  }
}

/**
 * Get billing model chip color
 */
function getBillingColor(model: ConsultingBillingModel): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (model) {
    case ConsultingBillingModel.HOURLY:
      return 'secondary';
    case ConsultingBillingModel.FIXED:
      return 'primary';
    case ConsultingBillingModel.RETAINER:
      return 'warning';
    case ConsultingBillingModel.PERFORMANCE:
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get project type icon color
 */
function getTypeColor(type: ConsultingProjectType): string {
  switch (type) {
    case ConsultingProjectType.STRATEGY:
      return 'text-blue-500';
    case ConsultingProjectType.IMPLEMENTATION:
      return 'text-green-500';
    case ConsultingProjectType.AUDIT:
      return 'text-orange-500';
    case ConsultingProjectType.TRAINING:
      return 'text-purple-500';
    case ConsultingProjectType.ADVISORY:
      return 'text-cyan-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ProjectCard component for displaying consulting project information
 */
export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onSelect,
  compact = false,
}: ProjectCardProps): React.ReactElement {
  const daysUntilDeadline = calculateDaysUntilDeadline(project.deadline);
  const atRisk = isProjectAtRisk(project);
  const utilizationPercent = Math.min(100, project.utilizationRate);
  const satisfactionPercent = project.clientSatisfaction;

  // Calculate hours progress
  const hoursProgress = project.hoursEstimated > 0
    ? Math.min(100, (project.hoursWorked / project.hoursEstimated) * 100)
    : 0;

  // Calculate outstanding balance
  const outstandingBalance = Math.max(0, project.billedAmount - project.collectedAmount);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(project);
    }
  };

  // Compact card version
  if (compact) {
    return (
      <Card
        className="w-full cursor-pointer hover:shadow-md transition-shadow"
        isPressable={!!onSelect}
        onPress={handleCardClick}
      >
        <CardBody className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{project.projectName}</p>
              <p className="text-xs text-default-700 truncate">{project.client}</p>
            </div>
            <div className="flex items-center gap-2">
              <Chip size="sm" color={getStatusColor(project.status)} variant="flat">
                {project.status}
              </Chip>
              <span className="text-sm font-medium">
                {formatCurrency(project.totalRevenue, project.currency)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Full card version
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        {/* Header Row */}
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-lg truncate">{project.projectName}</h4>
            <p className="text-default-700 text-sm">{project.client}</p>
          </div>
          
          {/* Status & Type Badges */}
          <div className="flex flex-col items-end gap-1">
            <Chip size="sm" color={getStatusColor(project.status)} variant="flat">
              {project.status}
            </Chip>
            <Chip size="sm" variant="bordered" className={getTypeColor(project.projectType)}>
              {project.projectType}
            </Chip>
          </div>
        </div>

        {/* Risk Warning */}
        {atRisk && (
          <div className="flex items-center gap-1 text-warning text-xs">
            <FiAlertCircle className="w-3 h-3" />
            <span>At Risk - Review timeline</span>
          </div>
        )}
      </CardHeader>

      <CardBody className="pt-2">
        {/* Billing & Revenue Row */}
        <div className="flex items-center justify-between mb-3">
          <Chip size="sm" color={getBillingColor(project.billingModel)} variant="dot">
            {project.billingModel}
            {project.billingModel === ConsultingBillingModel.HOURLY && (
              <span className="ml-1 text-xs">@ ${project.hourlyRate}/hr</span>
            )}
          </Chip>
          <div className="text-right">
            <p className="font-semibold text-lg">{formatCurrency(project.totalRevenue, project.currency)}</p>
            <p className="text-xs text-default-700">
              {project.profitMargin.toFixed(1)}% margin
            </p>
          </div>
        </div>

        <Divider className="my-2" />

        {/* Hours Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-sm">
              <FiClock className="w-4 h-4 text-default-400" />
              <span>Hours</span>
            </div>
            <span className="text-sm">
              {project.hoursWorked} / {project.hoursEstimated}
              {project.hoursWorked > project.hoursEstimated && (
                <span className="text-danger ml-1">(+{project.hoursWorked - project.hoursEstimated})</span>
              )}
            </span>
          </div>
          <Progress
            value={hoursProgress}
            color={hoursProgress > 100 ? 'danger' : hoursProgress > 80 ? 'warning' : 'primary'}
            size="sm"
            className="w-full"
          />
        </div>

        {/* Client Satisfaction */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-sm">
              <FiTrendingUp className="w-4 h-4 text-default-400" />
              <span>Satisfaction</span>
            </div>
            <span className="text-sm">{satisfactionPercent}%</span>
          </div>
          <Progress
            value={satisfactionPercent}
            color={satisfactionPercent >= 80 ? 'success' : satisfactionPercent >= 60 ? 'warning' : 'danger'}
            size="sm"
            className="w-full"
          />
        </div>

        <Divider className="my-2" />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* Team Size */}
          <div className="flex items-center gap-1">
            <FiUsers className="w-4 h-4 text-default-400" />
            <span>{project.teamSize} consultant{project.teamSize !== 1 ? 's' : ''}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1">
            <FiCalendar className="w-4 h-4 text-default-400" />
            <Tooltip content={formatDate(project.deadline)}>
              <span className={daysUntilDeadline < 0 ? 'text-danger' : daysUntilDeadline < 7 ? 'text-warning' : ''}>
                {daysUntilDeadline < 0
                  ? `${Math.abs(daysUntilDeadline)}d overdue`
                  : daysUntilDeadline === 0
                  ? 'Due today'
                  : `${daysUntilDeadline}d left`}
              </span>
            </Tooltip>
          </div>

          {/* Billed */}
          <div className="flex items-center gap-1">
            <FiDollarSign className="w-4 h-4 text-default-400" />
            <span>Billed: {formatCurrency(project.billedAmount, project.currency)}</span>
          </div>

          {/* Outstanding */}
          {outstandingBalance > 0 && (
            <div className="flex items-center gap-1">
              <FiAlertCircle className="w-4 h-4 text-warning" />
              <span className="text-warning">Due: {formatCurrency(outstandingBalance, project.currency)}</span>
            </div>
          )}
        </div>

        {/* Scope Creep Warning */}
        {project.scopeCreep > 10 && (
          <div className="mt-2 p-2 bg-warning-50 rounded-lg">
            <p className="text-xs text-warning">
              ⚠️ Scope creep: {project.scopeCreep}% above original estimate
            </p>
          </div>
        )}
      </CardBody>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <CardFooter className="pt-0">
          <div className="flex w-full justify-end gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="flat"
                startContent={<FiEdit className="w-3 h-3" />}
                onPress={() => onEdit(project)}
              >
                Edit
              </Button>
            )}
            {onDelete && project.status !== ConsultingProjectStatus.ACTIVE && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<FiTrash2 className="w-3 h-3" />}
                onPress={() => onDelete(project)}
              >
                Delete
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default ProjectCard;
