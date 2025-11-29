/**
 * @fileoverview Employee Directory Component
 * @module lib/components/employee/EmployeeDirectory
 * 
 * OVERVIEW:
 * Searchable, filterable employee list with grid/list view toggle.
 * Supports department, role, skill, and morale filtering.
 * Reuses EmployeeCard component for consistent display.
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Employee } from '@/lib/types';
import { EmployeeCard } from './EmployeeCard';
import { EMPLOYEE_PARAMETERS } from '@/lib/utils/constants';

export interface EmployeeDirectoryProps {
  /** List of employees to display */
  employees: Employee[];
  /** Click handler for employee selection */
  onEmployeeClick?: (employee: Employee) => void;
  /** Show action buttons (hire, fire, etc.) */
  showActions?: boolean;
  /** Allow multiple selection */
  multiSelect?: boolean;
  /** Selected employee IDs (for multi-select) */
  selectedIds?: string[];
  /** Selection change handler */
  onSelectionChange?: (ids: string[]) => void;
}

/** Departments derived from employee roles */
const DEPARTMENTS = [
  'All',
  'Executive',
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'HR',
  'Legal',
  'R&D',
  'Quality',
  'Support',
];

/** Status filter options */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'training', label: 'In Training' },
  { value: 'onLeave', label: 'On Leave' },
];

/** Retention risk filter options */
const RETENTION_OPTIONS = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'minimal', label: 'Minimal Risk' },
  { value: 'low', label: 'Low Risk' },
  { value: 'moderate', label: 'Moderate Risk' },
  { value: 'high', label: 'High Risk' },
  { value: 'critical', label: 'Critical Risk' },
];

/** Morale range filter options */
const MORALE_OPTIONS = [
  { value: 'all', label: 'All Morale' },
  { value: 'high', label: 'High (80+)' },
  { value: 'good', label: 'Good (60-79)' },
  { value: 'moderate', label: 'Moderate (40-59)' },
  { value: 'low', label: 'Low (<40)' },
];

/** Sort options */
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'salary', label: 'Salary (Low-High)' },
  { value: 'salary-desc', label: 'Salary (High-Low)' },
  { value: 'morale', label: 'Morale (Low-High)' },
  { value: 'morale-desc', label: 'Morale (High-Low)' },
  { value: 'skills', label: 'Skills (Low-High)' },
  { value: 'skills-desc', label: 'Skills (High-Low)' },
  { value: 'hired', label: 'Newest First' },
  { value: 'hired-desc', label: 'Oldest First' },
];

/**
 * Map role to department
 */
function getDepartmentFromRole(role: string): string {
  const roleUpper = role.toUpperCase();
  if (roleUpper.includes('CEO') || roleUpper.includes('COO') || roleUpper.includes('CFO') || roleUpper.includes('CTO') || roleUpper.includes('EXECUTIVE')) return 'Executive';
  if (roleUpper.includes('ENGINEER') || roleUpper.includes('DEVELOPER') || roleUpper.includes('ARCHITECT')) return 'Engineering';
  if (roleUpper.includes('SALES') || roleUpper.includes('ACCOUNT')) return 'Sales';
  if (roleUpper.includes('MARKETING') || roleUpper.includes('BRAND')) return 'Marketing';
  if (roleUpper.includes('FINANCE') || roleUpper.includes('ACCOUNTING') || roleUpper.includes('CONTROLLER')) return 'Finance';
  if (roleUpper.includes('OPERATIONS') || roleUpper.includes('LOGISTICS')) return 'Operations';
  if (roleUpper.includes('HR') || roleUpper.includes('HUMAN RESOURCE') || roleUpper.includes('RECRUITING')) return 'HR';
  if (roleUpper.includes('LEGAL') || roleUpper.includes('COMPLIANCE') || roleUpper.includes('COUNSEL')) return 'Legal';
  if (roleUpper.includes('RESEARCH') || roleUpper.includes('R&D') || roleUpper.includes('SCIENTIST')) return 'R&D';
  if (roleUpper.includes('QUALITY') || roleUpper.includes('QA') || roleUpper.includes('TESTING')) return 'Quality';
  if (roleUpper.includes('SUPPORT') || roleUpper.includes('CUSTOMER') || roleUpper.includes('SERVICE')) return 'Support';
  return 'Operations'; // Default
}

/**
 * Filter employees based on search and filters
 */
function filterEmployees(
  employees: Employee[],
  search: string,
  department: string,
  status: string,
  retention: string,
  morale: string
): Employee[] {
  return employees.filter(emp => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchLower) ||
        emp.role.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Department filter
    if (department !== 'All') {
      const empDept = getDepartmentFromRole(emp.role);
      if (empDept !== department) return false;
    }

    // Status filter
    if (status !== 'all' && emp.status !== status) return false;

    // Retention risk filter
    if (retention !== 'all' && emp.retentionRisk !== retention) return false;

    // Morale filter
    if (morale !== 'all') {
      switch (morale) {
        case 'high':
          if (emp.morale < 80) return false;
          break;
        case 'good':
          if (emp.morale < 60 || emp.morale >= 80) return false;
          break;
        case 'moderate':
          if (emp.morale < 40 || emp.morale >= 60) return false;
          break;
        case 'low':
          if (emp.morale >= 40) return false;
          break;
      }
    }

    return true;
  });
}

/**
 * Sort employees based on sort option
 */
function sortEmployees(employees: Employee[], sortBy: string): Employee[] {
  const sorted = [...employees];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'salary':
      return sorted.sort((a, b) => a.salary - b.salary);
    case 'salary-desc':
      return sorted.sort((a, b) => b.salary - a.salary);
    case 'morale':
      return sorted.sort((a, b) => a.morale - b.morale);
    case 'morale-desc':
      return sorted.sort((a, b) => b.morale - a.morale);
    case 'skills':
      return sorted.sort((a, b) => (a.skillAverage || 0) - (b.skillAverage || 0));
    case 'skills-desc':
      return sorted.sort((a, b) => (b.skillAverage || 0) - (a.skillAverage || 0));
    case 'hired':
      return sorted.sort((a, b) => new Date(b.hiredAt).getTime() - new Date(a.hiredAt).getTime());
    case 'hired-desc':
      return sorted.sort((a, b) => new Date(a.hiredAt).getTime() - new Date(b.hiredAt).getTime());
    default:
      return sorted;
  }
}

/**
 * Employee Directory Component
 * 
 * FEATURES:
 * - Search by name or role
 * - Filter by department, status, retention risk, morale
 * - Sort by multiple criteria
 * - Grid/list view toggle
 * - Multi-select support
 * - Statistics summary bar
 * 
 * USAGE:
 * ```tsx
 * <EmployeeDirectory
 *   employees={companyEmployees}
 *   onEmployeeClick={(emp) => router.push(`/employees/${emp.id}`)}
 *   showActions={true}
 * />
 * ```
 */
export function EmployeeDirectory({
  employees,
  onEmployeeClick,
  showActions = false,
  multiSelect = false,
  selectedIds = [],
  onSelectionChange,
}: EmployeeDirectoryProps) {
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('all');
  const [retention, setRetention] = useState('all');
  const [morale, setMorale] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    const filtered = filterEmployees(employees, search, department, status, retention, morale);
    return sortEmployees(filtered, sortBy);
  }, [employees, search, department, status, retention, morale, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'active').length;
    const avgMorale = employees.length > 0 
      ? Math.round(employees.reduce((sum, e) => sum + e.morale, 0) / employees.length)
      : 0;
    const atRisk = employees.filter(e => e.retentionRisk === 'high' || e.retentionRisk === 'critical').length;
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    
    return { active, avgMorale, atRisk, totalSalary };
  }, [employees]);

  // Selection handlers
  const handleSelect = (employee: Employee) => {
    if (!multiSelect) {
      onEmployeeClick?.(employee);
      return;
    }

    const newSelection = selectedIds.includes(employee.id)
      ? selectedIds.filter(id => id !== employee.id)
      : [...selectedIds, employee.id];
    
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(filteredEmployees.map(e => e.id));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
          <p className="text-sm text-gray-600">Total Employees</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${stats.avgMorale >= 70 ? 'text-green-600' : stats.avgMorale >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.avgMorale}%
          </p>
          <p className="text-sm text-gray-600">Avg Morale</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${stats.atRisk > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.atRisk}
          </p>
          <p className="text-sm text-gray-600">At Risk</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        {/* Search Row */}
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            startContent={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'solid' : 'bordered'}
              onClick={() => setViewMode('grid')}
              isIconOnly
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'bordered'}
              onClick={() => setViewMode('list')}
              isIconOnly
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select
            label="Department"
            selectedKeys={[department]}
            onChange={(e) => setDepartment(e.target.value)}
            size="sm"
          >
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} textValue={dept}>
                {dept}
              </SelectItem>
            ))}
          </Select>
          
          <Select
            label="Status"
            selectedKeys={[status]}
            onChange={(e) => setStatus(e.target.value)}
            size="sm"
          >
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
          
          <Select
            label="Retention Risk"
            selectedKeys={[retention]}
            onChange={(e) => setRetention(e.target.value)}
            size="sm"
          >
            {RETENTION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
          
          <Select
            label="Morale"
            selectedKeys={[morale]}
            onChange={(e) => setMorale(e.target.value)}
            size="sm"
          >
            {MORALE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
          
          <Select
            label="Sort By"
            selectedKeys={[sortBy]}
            onChange={(e) => setSortBy(e.target.value)}
            size="sm"
          >
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Multi-select Actions */}
      {multiSelect && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Button
            size="sm"
            variant="bordered"
            onClick={handleSelectAll}
          >
            {selectedIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
          </Button>
          <span className="text-sm text-gray-600">
            {selectedIds.length} of {filteredEmployees.length} selected
          </span>
          {selectedIds.length > 0 && showActions && (
            <>
              <div className="flex-1" />
              <Button size="sm" color="primary">Train Selected</Button>
              <Button size="sm" color="warning">Adjust Salary</Button>
            </>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-600">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
        {(search || department !== 'All' || status !== 'all' || retention !== 'all' || morale !== 'all') && (
          <Button
            size="sm"
            variant="light"
            onClick={() => {
              setSearch('');
              setDepartment('All');
              setStatus('all');
              setRetention('all');
              setMorale('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Employee Grid/List */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600">No employees match your filters</p>
          <Button
            className="mt-4"
            size="sm"
            variant="bordered"
            onClick={() => {
              setSearch('');
              setDepartment('All');
              setStatus('all');
              setRetention('all');
              setMorale('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map(employee => (
            <div
              key={employee.id}
              className={`relative ${multiSelect && selectedIds.includes(employee.id) ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
            >
              {multiSelect && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => handleSelect(employee)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              )}
              <EmployeeCard
                employee={employee}
                onClick={() => handleSelect(employee)}
                showDetails={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredEmployees.map(employee => (
            <div
              key={employee.id}
              className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                multiSelect && selectedIds.includes(employee.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelect(employee)}
            >
              {multiSelect && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(employee.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelect(employee);
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
                <p className="text-sm text-gray-600 truncate">{employee.role}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Salary</p>
                  <p className="font-semibold text-green-600">
                    ${(employee.salary / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Skills</p>
                  <p className="font-semibold">{employee.skillAverage || 50}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Morale</p>
                  <p className={`font-semibold ${employee.morale >= 70 ? 'text-green-600' : employee.morale >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {employee.morale}%
                  </p>
                </div>
                <Chip
                  size="sm"
                  color={
                    employee.retentionRisk === 'minimal' || employee.retentionRisk === 'low' ? 'success' :
                    employee.retentionRisk === 'moderate' ? 'warning' : 'danger'
                  }
                >
                  {employee.retentionRisk?.toUpperCase() || 'UNKNOWN'}
                </Chip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
