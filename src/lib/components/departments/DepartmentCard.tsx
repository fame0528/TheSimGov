/**
 * @fileoverview Department Card Component
 * @module lib/components/departments/DepartmentCard
 * 
 * OVERVIEW:
 * Reusable card for displaying department summary (Finance, HR, Marketing, R&D).
 * Shows level, budget, KPIs, and department-specific metrics.
 * Click-through to detailed department view.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Button } from '@heroui/button';
import { formatCurrency } from '@/lib/utils';
import type { Department } from '@/lib/types/department';

// Explicit props interface (was missing, causing TS errors when exporting DepartmentCardProps)
export interface DepartmentCardProps {
  department: Department;
  onViewDetails?: () => void;
  onUpgrade?: () => void;
  showUpgradeButton?: boolean;
  compact?: boolean;
}
const getHealthColor = (score: number): 'success' | 'primary' | 'warning' | 'danger' => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'danger';
};

/**
 * Get department icon/emoji
 */
const getDepartmentIcon = (type: string): string => {
  switch (type) {
    case 'finance': return '💰';
    case 'hr': return '👥';
    case 'marketing': return '📢';
    case 'rd': return '🔬';
    default: return '📊';
  }
};

/**
 * DepartmentCard Component
 * 
 * Displays department summary with KPIs, budget, and level.
 * Reusable across all 4 department types.
 * 
 * @example
 * ```tsx
 * <DepartmentCard
 *   department={financeDept}
 *   onViewDetails={() => router.push('/departments/finance')}
 *   onUpgrade={handleUpgrade}
 *   showUpgradeButton={financeDept.level < 5}
 * />
 * ```
 */
export function DepartmentCard({
  department,
  onViewDetails,
  onUpgrade,
  showUpgradeButton = false,
  compact = false,
}: DepartmentCardProps) {
  // Calculate health score (simple average of KPIs)
  const healthScore = Math.round(
    (department.kpis.efficiency +
      department.kpis.performance +
      Math.max(0, Math.min(100, department.kpis.roi + 50)) + // Normalize ROI to 0-100
      department.kpis.utilization +
      department.kpis.quality) / 5
  );

  return (
    <Card
      isPressable={!!onViewDetails}
      onPress={onViewDetails}
      className="hover:scale-[1.02] transition-transform duration-200"
    >
      <CardHeader className="flex justify-between items-start pb-0">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getDepartmentIcon(department.type)}</span>
          <div>
            <h3 className="text-xl font-bold">{department.name}</h3>
            <p className="text-sm text-default-700">Level {department.level}/5</p>
          </div>
        </div>
        <Chip color={getHealthColor(healthScore)} variant="flat" size="sm">
          Health: {healthScore}%
        </Chip>
      </CardHeader>

      <CardBody className="gap-4">
        {/* Budget */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-default-600">Budget</span>
          <span className="font-semibold">{formatCurrency(department.budget)}</span>
        </div>

        {/* Budget Percentage */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-default-700">Budget Allocation</span>
            <span className="text-xs font-medium">{department.budgetPercentage}%</span>
          </div>
          <Progress
            value={department.budgetPercentage}
            maxValue={100}
            color="primary"
            size="sm"
          />
        </div>

        {!compact && (
          <>
            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-divider">
              <div>
                <p className="text-xs text-default-700">Efficiency</p>
                <Progress
                  value={department.kpis.efficiency}
                  maxValue={100}
                  color={getHealthColor(department.kpis.efficiency)}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-xs text-default-700">Performance</p>
                <Progress
                  value={department.kpis.performance}
                  maxValue={100}
                  color={getHealthColor(department.kpis.performance)}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-xs text-default-700">Utilization</p>
                <Progress
                  value={department.kpis.utilization}
                  maxValue={100}
                  color={getHealthColor(department.kpis.utilization)}
                  size="sm"
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-xs text-default-700">Quality</p>
                <Progress
                  value={department.kpis.quality}
                  maxValue={100}
                  color={getHealthColor(department.kpis.quality)}
                  size="sm"
                  className="mt-1"
                />
              </div>
            </div>

            {/* ROI */}
            <div className="flex justify-between items-center pt-2 border-t border-divider">
              <span className="text-sm text-default-600">ROI</span>
              <span className={`font-semibold ${department.kpis.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                {department.kpis.roi >= 0 ? '+' : ''}{department.kpis.roi.toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              className="flex-1"
              onPress={onViewDetails}
            >
              View Details
            </Button>
          )}
          {showUpgradeButton && onUpgrade && department.level < 5 && (
            <Button
              size="sm"
              variant="solid"
              color="secondary"
              className="flex-1"
              onPress={onUpgrade}
            >
              Upgrade to Level {department.level + 1}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Reusable**: Works for all 4 department types (Finance, HR, Marketing, R&D)
 * 2. **HeroUI**: Uses Card, Chip, Progress, Button components
 * 3. **Health Score**: Weighted average of all 5 KPIs (efficiency, performance, ROI, utilization, quality)
 * 4. **Color Coding**: Green (80+), Blue (60+), Orange (40+), Red (<40)
 * 5. **Compact Mode**: Hides KPI grid for summary views
 * 6. **Interactive**: Clickable card with hover effect
 * 7. **Upgrade Button**: Shows only if level < 5 and showUpgradeButton=true
 * 
 * PREVENTS:
 * - Duplicate department card styling
 * - Inconsistent KPI displays
 * - Missing upgrade paths
 * - Hardcoded department icons
 */
