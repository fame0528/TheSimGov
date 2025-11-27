/**
 * @fileoverview Department Card Component
 * @module components/departments/DepartmentCard
 * 
 * OVERVIEW:
 * Compact department overview card for listing views.
 * Displays key metrics, level, budget, and quick actions.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { formatNumber } from '@/lib/utils/formatting';
import type { AnyDepartment } from '@/lib/types/department';

interface DepartmentCardProps {
  department: AnyDepartment;
  onSelect?: (department: AnyDepartment) => void;
  onUpgrade?: (department: AnyDepartment) => void;
}

export default function DepartmentCard({ department, onSelect, onUpgrade }: DepartmentCardProps) {

  // Department icon/color mapping
  const deptConfig = {
    finance: { icon: '💰', color: 'success' as const },
    hr: { icon: '👥', color: 'primary' as const },
    marketing: { icon: '📢', color: 'secondary' as const },
    rd: { icon: '🔬', color: 'warning' as const },
  };

  const config = deptConfig[department.type] || { icon: '📊', color: 'default' as const };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" isPressable onPress={() => onSelect?.(department)}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-bold">{department.name}</h3>
            <p className="text-sm text-default-500">Level {department.level}</p>
          </div>
        </div>
        <Chip color={department.active ? 'success' : 'default'} variant="flat" size="sm">
          {department.active ? 'Active' : 'Inactive'}
        </Chip>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Budget */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-default-500">Budget</p>
            <p className="text-sm font-semibold">${formatNumber(department.budget)}</p>
          </div>
          <Progress 
            value={department.budgetPercentage} 
            color={config.color}
            size="sm"
          />
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-default-100 rounded">
            <p className="text-xs text-default-500">Efficiency</p>
            <p className="text-lg font-bold">{department.kpis.efficiency}%</p>
          </div>
          <div className="text-center p-2 bg-default-100 rounded">
            <p className="text-xs text-default-500">ROI</p>
            <p className="text-lg font-bold">{department.kpis.roi}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            color={config.color} 
            variant="flat" 
            fullWidth
            onPress={() => onSelect?.(department)}
          >
            View Details
          </Button>
          {department.level < 5 && (
            <Button 
              size="sm" 
              color="primary" 
              variant="bordered"
              onPress={() => onUpgrade?.(department)}
            >
              Upgrade
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
 * 1. **Compact Design**: All key info in card format
 * 2. **Visual Identity**: Icons and colors per department type
 * 3. **Quick Actions**: View Details and Upgrade buttons
 * 4. **KPI Summary**: Efficiency and ROI at-a-glance
 * 5. **Budget Display**: Progress bar with percentage
 * 6. **Active Status**: Chip indicator for active/inactive
 * 7. **Click Handling**: Card click + button click separation
 * 
 * USAGE:
 * ```tsx
 * <DepartmentCard 
 *   department={finance}
 *   onSelect={(dept) => router.push(`/departments/${dept.type}`)}
 *   onUpgrade={(dept) => handleUpgrade(dept)}
 * />
 * ```
 */
