/**
 * @fileoverview Departments List Overview Component
 * @module lib/components/departments/DepartmentsList
 * 
 * OVERVIEW:
 * Grid overview of all 4 departments (Finance, HR, Marketing, R&D).
 * Reuses DepartmentCard for maximum code reuse.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { DepartmentCard } from './DepartmentCard';
import type { Department } from '@/lib/types/department';

export interface DepartmentsListProps {
  departments: Department[];
  onViewDepartment: (departmentType: string) => void;
  onUpgradeDepartment: (departmentType: string) => void;
}

export function DepartmentsList({
  departments,
  onViewDepartment,
  onUpgradeDepartment,
}: DepartmentsListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Departments Overview</h2>
        <p className="text-default-500">Manage your company's core departments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map(department => (
          <DepartmentCard
            key={department.type}
            department={department}
            onViewDetails={() => onViewDepartment(department.type)}
            onUpgrade={() => onUpgradeDepartment(department.type)}
          />
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 text-default-400">
          <p>No departments found.</p>
          <p className="text-sm mt-2">Departments are automatically created when you start a company.</p>
        </div>
      )}
    </div>
  );
}
