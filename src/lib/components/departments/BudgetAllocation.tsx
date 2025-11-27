/**
 * @fileoverview BudgetAllocation Component - Department Budget Distribution
 * @module lib/components/departments/BudgetAllocation
 * 
 * OVERVIEW:
 * Interactive component for allocating company budget across departments.
 * Supports percentage-based or fixed-amount allocation with real-time validation.
 * 
 * @created 2025-11-22
 * @author ECHO v1.3.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Slider, Chip } from '@heroui/react';
import { FaDollarSign, FaUsers, FaChartLine, FaLightbulb, FaSave, FaUndo } from 'react-icons/fa';
import type { Department } from '@/lib/types/department';

/**
 * BudgetAllocation Component Props
 */
export interface BudgetAllocationProps {
  /** Array of all departments */
  departments: Department[];
  /** Total company cash available for allocation */
  companyCash: number;
  /** Callback when budget allocation is saved */
  onSave: (allocations: BudgetAllocation[]) => Promise<void>;
  /** Optional CSS class for container */
  className?: string;
}

/**
 * Budget allocation for a single department
 */
export interface BudgetAllocation {
  /** Department ID */
  departmentId: string;
  /** Department type */
  type: 'finance' | 'hr' | 'marketing' | 'rd';
  /** Allocated budget amount */
  budget: number;
  /** Percentage of total budget */
  percentage: number;
}

/**
 * BudgetAllocation Component
 * 
 * Allows user to distribute company budget across Finance, HR, Marketing, and R&D.
 * Provides both percentage sliders and dollar amount inputs with real-time validation.
 * 
 * FEATURES:
 * - Percentage-based allocation (0-100% per department)
 * - Fixed amount input (validates against available cash)
 * - Real-time total calculation
 * - Remaining cash indicator
 * - Visual feedback (success/warning/danger)
 * - Reset to current allocations
 * - Save with API call
 * 
 * @example
 * ```tsx
 * <BudgetAllocation
 *   departments={allDepartments}
 *   companyCash={500000}
 *   onSave={async (allocations) => {
 *     await fetch('/api/departments/allocate', {
 *       method: 'POST',
 *       body: JSON.stringify({ allocations }),
 *     });
 *   }}
 * />
 * ```
 */
export default function BudgetAllocation({
  departments,
  companyCash,
  onSave,
  className = ''
}: BudgetAllocationProps) {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Initialize allocations from current department budgets
   */
  useEffect(() => {
    const initialAllocations = departments.map(dept => ({
      departmentId: dept.id || '',
      type: dept.type,
      budget: dept.budget,
      percentage: dept.budgetPercentage,
    }));
    setAllocations(initialAllocations);
  }, [departments]);

  /**
   * Calculate total allocated budget
   */
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.budget, 0);

  /**
   * Calculate remaining cash
   */
  const remainingCash = companyCash - totalAllocated;

  /**
   * Check if allocation is valid
   */
  const isValid = remainingCash >= 0 && totalAllocated > 0;

  /**
   * Get department icon
   */
  const getDepartmentIcon = (type: string) => {
    const iconSize = 20;
    switch (type) {
      case 'finance':
        return <FaDollarSign size={iconSize} />;
      case 'hr':
        return <FaUsers size={iconSize} />;
      case 'marketing':
        return <FaChartLine size={iconSize} />;
      case 'rd':
        return <FaLightbulb size={iconSize} />;
      default:
        return null;
    }
  };

  /**
   * Get department name
   */
  const getDepartmentName = (type: string) => {
    switch (type) {
      case 'finance':
        return 'Finance';
      case 'hr':
        return 'Human Resources';
      case 'marketing':
        return 'Marketing';
      case 'rd':
        return 'R&D';
      default:
        return type;
    }
  };

  /**
   * Update budget allocation for a department
   */
  const updateBudget = (index: number, budget: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].budget = Math.max(0, budget);
    newAllocations[index].percentage = totalAllocated > 0 
      ? Math.round((newAllocations[index].budget / companyCash) * 100)
      : 0;
    setAllocations(newAllocations);
  };

  /**
   * Update percentage allocation for a department
   */
  const updatePercentage = (index: number, percentage: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].percentage = Math.max(0, Math.min(100, percentage));
    newAllocations[index].budget = Math.round((percentage / 100) * companyCash);
    setAllocations(newAllocations);
  };

  /**
   * Reset to current department budgets
   */
  const handleReset = () => {
    const resetAllocations = departments.map(dept => ({
      departmentId: dept.id || '',
      type: dept.type,
      budget: dept.budget,
      percentage: dept.budgetPercentage,
    }));
    setAllocations(resetAllocations);
  };

  /**
   * Save budget allocations
   */
  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave(allocations);
    } catch (error) {
      console.error('Failed to save budget allocations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-default-900">Budget Allocation</h3>
          <p className="text-sm text-default-500">
            Distribute ${(companyCash / 1000).toFixed(0)}k across departments
          </p>
        </div>

        <Chip
          color={remainingCash >= 0 ? 'success' : 'danger'}
          variant="flat"
        >
          Remaining: ${(remainingCash / 1000).toFixed(1)}k
        </Chip>
      </CardHeader>

      <CardBody className="space-y-6">
        {allocations.map((allocation, index) => {
          const dept = departments[index];
          if (!dept) return null;

          return (
            <div key={allocation.departmentId} className="space-y-3">
              {/* Department header */}
              <div className="flex items-center gap-2">
                {getDepartmentIcon(allocation.type)}
                <span className="font-medium text-default-900">
                  {getDepartmentName(allocation.type)}
                </span>
              </div>

              {/* Percentage slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-default-600">Percentage</span>
                  <span className="text-sm font-medium text-default-900">
                    {allocation.percentage}%
                  </span>
                </div>
                <Slider
                  value={allocation.percentage}
                  onChange={(value) => updatePercentage(index, value as number)}
                  minValue={0}
                  maxValue={100}
                  step={1}
                  color="primary"
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Amount input */}
              <Input
                type="number"
                label="Budget Amount"
                placeholder="0"
                value={allocation.budget.toString()}
                onValueChange={(value) => updateBudget(index, parseInt(value) || 0)}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-sm">$</span>
                  </div>
                }
                variant="bordered"
                size="sm"
              />
            </div>
          );
        })}

        {/* Summary */}
        <div className="pt-4 border-t border-default-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-default-600">Total Allocated</span>
            <span className="text-lg font-bold text-default-900">
              ${(totalAllocated / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-default-600">Available Cash</span>
            <span className="text-lg font-bold text-default-900">
              ${(companyCash / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-default-600">Remaining</span>
            <span className={`text-lg font-bold ${remainingCash >= 0 ? 'text-success' : 'text-danger'}`}>
              ${(remainingCash / 1000).toFixed(1)}k
            </span>
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex gap-2">
        <Button
          variant="flat"
          color="default"
          startContent={<FaUndo size={16} />}
          onPress={handleReset}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          color="primary"
          startContent={<FaSave size={16} />}
          onPress={handleSave}
          isLoading={isSaving}
          isDisabled={!isValid}
          className="flex-1"
        >
          Save Allocation
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Two-Way Binding**: Percentage and dollar amount sync automatically
 * 2. **Validation**: Prevents over-allocation beyond available cash
 * 3. **Visual Feedback**: Color-coded remaining cash (success/danger)
 * 4. **Reset Capability**: Restore to current department budgets
 * 5. **Real-Time Calculation**: Updates totals as user adjusts allocations
 * 
 * USAGE:
 * ```tsx
 * <BudgetAllocation
 *   departments={departments}
 *   companyCash={company.cash}
 *   onSave={async (allocations) => {
 *     for (const alloc of allocations) {
 *       await fetch(`/api/departments/${alloc.type}`, {
 *         method: 'PATCH',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ budget: alloc.budget, budgetPercentage: alloc.percentage }),
 *       });
 *     }
 *   }}
 * />
 * ```
 */
