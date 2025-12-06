/**
 * @fileoverview Budget Allocation Component
 * @module components/departments/BudgetAllocation
 * 
 * OVERVIEW:
 * Interface for allocating company funds across departments.
 * Shows current allocation, allows adjustments, validates totals.
 * 
 * @created 2025-11-21
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import type { AnyDepartment } from '@/lib/types/department';

interface BudgetAllocationProps {
  companyId: string;
  availableCash: number;
  departments: AnyDepartment[];
  onAllocate: (allocations: Record<string, number>) => Promise<void>;
  onCancel: () => void;
}

export default function BudgetAllocation({
  companyId,
  availableCash,
  departments,
  onAllocate,
  onCancel,
}: BudgetAllocationProps) {
  // State: budget allocations by department ID
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize allocations from current department budgets
  useEffect(() => {
    const initial = departments.reduce((acc, dept) => {
      acc[dept.id] = dept.budget;
      return acc;
    }, {} as Record<string, number>);
    setAllocations(initial);
  }, [departments]);

  // Calculate totals
  const totalAllocated = Object.values(allocations).reduce((sum, amt) => sum + amt, 0);
  const remaining = availableCash - totalAllocated;
  const allocationPercentage = (totalAllocated / availableCash) * 100;

  // Update allocation for specific department
  const handleAllocationChange = (deptId: string, value: string) => {
    const amount = parseInt(value, 10) || 0;
    setAllocations(prev => ({ ...prev, [deptId]: amount }));
    setError(null);
  };

  // Submit allocations
  const handleSubmit = async () => {
    // Validation
    if (totalAllocated > availableCash) {
      setError(`Total allocation ($${totalAllocated.toLocaleString()}) exceeds available cash ($${availableCash.toLocaleString()})`);
      return;
    }

    if (totalAllocated === 0) {
      setError('Must allocate at least some budget to departments');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAllocate(allocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-col items-start gap-2">
        <h2 className="text-2xl font-bold">Budget Allocation</h2>
        <p className="text-default-700">Distribute company funds across departments</p>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Available Cash Summary */}
        <Card className="bg-default-100">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-default-700">Available Cash</p>
                <p className="text-2xl font-bold">${availableCash.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-default-700">Total Allocated</p>
                <p className="text-2xl font-bold">${totalAllocated.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-default-700">Remaining</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
                  ${remaining.toLocaleString()}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(allocationPercentage, 100)} 
              color={remaining < 0 ? 'danger' : 'success'}
              className="mt-4"
            />
          </CardBody>
        </Card>

        {/* Department Allocations */}
        <div className="space-y-3">
          {departments.map(dept => {
            const allocation = allocations[dept.id] || 0;
            const percentage = availableCash > 0 ? (allocation / availableCash) * 100 : 0;
            
            return (
              <div key={dept.id} className="flex items-center gap-4 p-4 bg-default-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{dept.name}</p>
                    <Chip size="sm" variant="flat">Level {dept.level}</Chip>
                  </div>
                  <Input
                    type="number"
                    label="Budget Allocation"
                    placeholder="Enter amount"
                    value={allocation.toString()}
                    onValueChange={(val) => handleAllocationChange(dept.id, val)}
                    startContent={<span className="text-default-700">$</span>}
                    min="0"
                    max={availableCash.toString()}
                  />
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm text-default-700">Percentage</p>
                  <p className="text-lg font-bold">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-danger-50 border border-danger">
            <CardBody>
              <p className="text-danger">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="flat" onPress={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={totalAllocated > availableCash || totalAllocated === 0}
          >
            Allocate Budget
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Real-Time Validation**: Checks total ≤ available cash
 * 2. **Visual Feedback**: Progress bar shows allocation percentage
 * 3. **Remaining Calculation**: Shows how much cash left unallocated
 * 4. **Per-Department Input**: Number input for each department
 * 5. **Percentage Display**: Shows allocation as % of available cash
 * 6. **Error Handling**: Clear error messages for validation failures
 * 7. **Loading State**: Disables form during submission
 * 
 * USAGE:
 * ```tsx
 * <BudgetAllocation
 *   companyId="company-123"
 *   availableCash={1000000}
 *   departments={allDepartments}
 *   onAllocate={async (allocations) => {
 *     await updateDepartmentBudgets(allocations);
 *   }}
 *   onCancel={() => setShowAllocation(false)}
 * />
 * ```
 */
