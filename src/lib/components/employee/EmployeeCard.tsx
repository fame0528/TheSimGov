/**
 * @fileoverview Employee Card Component
 * @module lib/components/employee/EmployeeCard
 * 
 * OVERVIEW:
 * Displays employee summary card with skills, morale, performance, retention risk.
 * Used in employee lists and grids with click-through to detail page.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Tooltip } from '@heroui/tooltip';
import { Employee } from '@/lib/types';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';

export interface EmployeeCardProps {
  /** Employee data */
  employee: Employee;
  /** Click handler */
  onClick?: () => void;
  /** Show full details */
  showDetails?: boolean;
}

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get retention risk config
 */
const getRetentionConfig = (risk: string) => {
  const riskKey = risk.toUpperCase() as keyof typeof EMPLOYEE_PARAMETERS.RETENTION;
  return EMPLOYEE_PARAMETERS.RETENTION[riskKey] || EMPLOYEE_PARAMETERS.RETENTION.MODERATE;
};

/**
 * Get status badge color
 */
const getStatusColor = (status: string): 'success' | 'primary' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'training':
      return 'primary';
    case 'onLeave':
      return 'warning';
    case 'terminated':
      return 'danger';
    default:
      return 'default';
  }
};

/**
 * Employee Card Component
 * 
 * FEATURES:
 * - Employee name, role, salary
 * - Skill average with visual indicator
 * - Morale level with color coding
 * - Retention risk badge
 * - Status badge (active, training, etc.)
 * - Click-through to detail page
 * 
 * USAGE:
 * ```tsx
 * <EmployeeCard 
 *   employee={employee}
 *   onClick={() => router.push(`/employees/${employee.id}`)}
 * />
 * ```
 */
export function EmployeeCard({
  employee,
  onClick,
  showDetails = false,
}: EmployeeCardProps) {
  const retentionConfig = employee.retentionRisk 
    ? getRetentionConfig(employee.retentionRisk)
    : EMPLOYEE_PARAMETERS.RETENTION.MODERATE;

  const getProgressColor = (value: number): 'success' | 'primary' | 'warning' | 'danger' => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'primary';
    if (value >= 40) return 'warning';
    return 'danger';
  };

  const getMoraleColor = (morale: number): 'success' | 'primary' | 'warning' | 'danger' => {
    if (morale >= 85) return 'success';
    if (morale >= 70) return 'primary';
    if (morale >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-5 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        {/* Header: Name, Role, Status */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-lg font-bold text-gray-900">
              {employee.name}
            </p>
            <p className="text-sm text-gray-600">
              {employee.role}
            </p>
          </div>
          <Chip color={getStatusColor(employee.status)}>
            {employee.status.toUpperCase()}
          </Chip>
        </div>

        {/* Salary */}
        <div className="flex justify-between">
          <p className="text-sm text-gray-600">
            Salary
          </p>
          <p className="text-base font-semibold text-green-600">
            {formatCurrency(employee.salary)}/yr
          </p>
        </div>

        {/* Skills Average */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-sm text-gray-600">
              Skill Average
            </p>
            <p className="text-sm font-semibold">
              {employee.skillAverage || 50}/100
            </p>
          </div>
          <Progress
            value={employee.skillAverage || 50}
            color={getProgressColor(employee.skillAverage || 50)}
            size="sm"
            className="h-2"
          />
        </div>

        {/* Morale */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-sm text-gray-600">
              Morale
            </p>
            <p className="text-sm font-semibold">
              {employee.morale}/100
            </p>
          </div>
          <Progress
            value={employee.morale}
            color={getMoraleColor(employee.morale)}
            size="sm"
            className="h-2"
          />
        </div>

        {/* Retention Risk */}
        {employee.retentionRisk && (
          <Tooltip content={`${(retentionConfig.quitChancePerWeek * 100).toFixed(1)}% chance to quit per week`}>
            <div className="flex justify-between">
              <p className="text-sm text-gray-600">
                Retention Risk
              </p>
              <Chip color={retentionConfig.color.includes('green') ? 'success' : retentionConfig.color.includes('orange') ? 'warning' : 'danger' as any}>
                {retentionConfig.label.toUpperCase()}
              </Chip>
            </div>
          </Tooltip>
        )}

        {/* Additional Details */}
        {showDetails && employee.performance && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">
                Productivity
              </p>
              <p className="text-xs font-semibold">
                {(employee.performance.productivity * 100).toFixed(0)}%
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">
                Quality
              </p>
              <p className="text-xs font-semibold">
                {employee.performance.quality}/100
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">
                Attendance
              </p>
              <p className="text-xs font-semibold">
                {(employee.performance.attendance * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Visual Hierarchy**: Name/role prominent, details organized
 * 2. **Color Coding**: Progress bars and chips for quick status
 * 3. **Tooltips**: Additional context on hover via HeroUI
 * 4. **Responsive**: Adapts to container width
 * 5. **Interactive**: Hover effect for clickable cards
 * 6. **HeroUI Components**: @heroui/chip, @heroui/progress, @heroui/tooltip
 * 7. **Tailwind CSS**: Utility classes for layout
 * 
 * PREVENTS:
 * - Inconsistent employee display UI
 * - Missing retention risk indicators
 * - Poor visual hierarchy
 */
