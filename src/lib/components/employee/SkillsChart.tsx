/**
 * @fileoverview Skills Chart Component
 * @module lib/components/employee/SkillsChart
 * 
 * OVERVIEW:
 * Visualizes employee's 12 skills as horizontal progress bars.
 * Color-coded by skill level, shows skill names and values.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Progress } from '@heroui/progress';
import { EmployeeSkills } from '@/lib/types';

export interface SkillsChartProps {
  /** Employee skills object */
  skills: EmployeeSkills;
  /** Show skill values */
  showValues?: boolean;
  /** Compact view */
  compact?: boolean;
}

/**
 * Skill display config
 */
const SKILL_CONFIG: Record<keyof EmployeeSkills, { label: string; icon: string }> = {
  technical: { label: 'Technical', icon: '💻' },
  leadership: { label: 'Leadership', icon: '👔' },
  industry: { label: 'Industry', icon: '🏭' },
  sales: { label: 'Sales', icon: '💼' },
  marketing: { label: 'Marketing', icon: '📢' },
  finance: { label: 'Finance', icon: '💰' },
  operations: { label: 'Operations', icon: '⚙️' },
  hr: { label: 'HR', icon: '👥' },
  legal: { label: 'Legal', icon: '⚖️' },
  rd: { label: 'R&D', icon: '🔬' },
  quality: { label: 'Quality', icon: '✅' },
  customer: { label: 'Customer Service', icon: '🤝' },
};

/**
 * Get skill color scheme based on value
 */
const getSkillColor = (value: number): 'success' | 'primary' | 'secondary' | 'warning' | 'danger' | 'default' => {
  if (value >= 90) return 'secondary';
  if (value >= 75) return 'success';
  if (value >= 60) return 'primary';
  if (value >= 40) return 'warning';
  if (value >= 20) return 'danger';
  return 'danger';
};

/**
 * Skills Chart Component
 * 
 * FEATURES:
 * - 12 skill categories displayed as progress bars
 * - Color-coded by skill level (red → purple)
 * - Skill icons for visual identification
 * - Optional compact mode for sidebars
 * - Skill values shown inline
 * 
 * USAGE:
 * ```tsx
 * <SkillsChart 
 *   skills={employee.skills}
 *   showValues
 * />
 * ```
 */
export function SkillsChart({
  skills,
  showValues = true,
  compact = false,
}: SkillsChartProps) {
  // Sort skills by value (highest first)
  const sortedSkills = (Object.entries(skills) as [keyof EmployeeSkills, number][])
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div>
      {!compact && (
        <p className="text-lg font-bold mb-4 text-gray-900">
          Skills Breakdown
        </p>
      )}
      
      <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        {sortedSkills.map(([skillKey, skillValue]) => {
          const config = SKILL_CONFIG[skillKey];
          const colorScheme = getSkillColor(skillValue);

          return (
            <div key={String(skillKey)}>
              <div className="flex justify-between mb-1">
                <div className="flex gap-2">
                  {!compact && <span className="text-sm">{config.icon}</span>}
                  <p
                    className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}
                  >
                    {config.label}
                  </p>
                </div>
                {showValues && (
                  <p
                    className={`${compact ? 'text-xs' : 'text-sm'} font-bold`}
                  >
                    {skillValue}/100
                  </p>
                )}
              </div>
              <Progress
                value={skillValue}
                color={colorScheme}
                size={compact ? 'sm' : 'md'}
                className="h-2"
              />
            </div>
          );
        })}
      </div>

      {/* Skill Average */}
      {!compact && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <p className="text-base font-bold text-gray-900">
              Overall Average
            </p>
            <p className="text-lg font-bold text-blue-600">
              {Math.round((Object.values(skills) as number[]).reduce((sum: number, val: number) => sum + val, 0) / 12)}/100
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Visual Clarity**: Icons + labels + progress bars
 * 2. **Sorted Display**: Highest skills first for quick assessment
 * 3. **Color Coding**: Danger (poor) → Secondary (elite) progression
 * 4. **Responsive**: Compact mode for sidebars/modals
 * 5. **HeroUI Progress**: @heroui/progress components
 * 6. **Tailwind CSS**: Utility classes for layout
 * 
 * PREVENTS:
 * - Flat list of numbers (hard to compare)
 * - Missing visual skill hierarchy
 * - Inconsistent skill display across UI
 */
