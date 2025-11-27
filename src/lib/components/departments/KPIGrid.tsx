/**
 * @fileoverview KPI Grid Component
 * @module lib/components/departments/KPIGrid
 * 
 * OVERVIEW:
 * Reusable grid display for department KPIs (Efficiency, Performance, ROI, Utilization, Quality).
 * Used across all department detail pages.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { Card, CardBody } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Tooltip } from '@heroui/tooltip';
import type { KPIs } from '@/lib/types/department';

export interface KPIGridProps {
  /** KPI values */
  kpis: KPIs;
  /** Show descriptions */
  showDescriptions?: boolean;
  /** Grid columns */
  columns?: 2 | 3 | 5;
}

/**
 * Get progress color based on value
 */
const getProgressColor = (value: number): 'success' | 'primary' | 'warning' | 'danger' => {
  if (value >= 80) return 'success';
  if (value >= 60) return 'primary';
  if (value >= 40) return 'warning';
  return 'danger';
};

/**
 * KPI descriptions
 */
const KPI_DESCRIPTIONS = {
  efficiency: 'How well the department uses resources (time, budget, personnel)',
  performance: 'Overall output quality and speed compared to targets',
  roi: 'Return on investment - profit generated vs budget spent',
  utilization: 'Percentage of capacity actively being used',
  quality: 'Excellence of deliverables and adherence to standards',
};

/**
 * KPIGrid Component
 * 
 * Displays all 5 department KPIs in a responsive grid.
 * Includes progress bars, values, and optional tooltips.
 * 
 * @example
 * ```tsx
 * <KPIGrid
 *   kpis={department.kpis}
 *   showDescriptions
 *   columns={5}
 * />
 * ```
 */
export function KPIGrid({
  kpis,
  showDescriptions = false,
  columns = 5,
}: KPIGridProps) {
  const gridClass = columns === 5 
    ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'
    : columns === 3
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
    : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  const kpiEntries: Array<{ key: keyof KPIs; label: string; value: number; isPercentage: boolean }> = [
    { key: 'efficiency', label: 'Efficiency', value: kpis.efficiency, isPercentage: true },
    { key: 'performance', label: 'Performance', value: kpis.performance, isPercentage: true },
    { key: 'roi', label: 'ROI', value: kpis.roi, isPercentage: false },
    { key: 'utilization', label: 'Utilization', value: kpis.utilization, isPercentage: true },
    { key: 'quality', label: 'Quality', value: kpis.quality, isPercentage: true },
  ];

  return (
    <div className={gridClass}>
      {kpiEntries.map(({ key, label, value, isPercentage }) => {
        const normalizedValue = isPercentage ? value : Math.max(0, Math.min(100, value + 50));
        const color = getProgressColor(normalizedValue);

        const content = (
          <Card key={key} className="shadow-sm">
            <CardBody className="gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-default-700">{label}</span>
                <span className={`text-lg font-bold ${value >= 0 ? 'text-success' : 'text-danger'}`}>
                  {isPercentage ? `${value.toFixed(0)}%` : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                </span>
              </div>
              {isPercentage && (
                <Progress
                  value={value}
                  maxValue={100}
                  color={color}
                  size="sm"
                  aria-label={`${label} progress`}
                />
              )}
              {!isPercentage && (
                <div className="h-1 bg-default-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      value >= 0 ? 'bg-success' : 'bg-danger'
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(value))}%` }}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        );

        if (showDescriptions) {
          return (
            <Tooltip key={key} content={KPI_DESCRIPTIONS[key]} placement="top">
              {content}
            </Tooltip>
          );
        }

        return content;
      })}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Reusable**: Works for all department types (same 5 KPIs)
 * 2. **Responsive**: 1 column mobile, 3 columns tablet, 5 columns desktop
 * 3. **Flexible Columns**: Supports 2, 3, or 5 column layouts
 * 4. **ROI Handling**: Special formatting for ROI (can be negative)
 * 5. **Tooltips**: Optional descriptions on hover
 * 6. **Color Coding**: Green (80+), Blue (60+), Orange (40+), Red (<40)
 * 7. **Accessibility**: Proper aria-labels for progress bars
 * 
 * PREVENTS:
 * - Duplicate KPI display code across department pages
 * - Inconsistent color coding
 * - Missing responsive breakpoints
 * - Unclear KPI meanings without tooltips
 */
