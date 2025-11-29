'use client';

/**
 * @fileoverview EmployeeDirectory Component
 * @module components/employee
 * 
 * OVERVIEW:
 * Employee directory with sortable DataTable, filtering, searching, and row actions.
 * Displays all company employees with columns: Name, Role, Salary, Performance, 
 * Morale, Retention Risk, Status. Supports hire/fire actions, pagination, and bulk operations.
 * 
 * FEATURES:
 * - DataTable with sorting (name, salary, performance, morale)
 * - Filtering (status, role, performance level, retention risk)
 * - Free-text search by employee name
 * - Row actions: View Details, Conduct Review, Adjust Salary, Start Training, Fire
 * - Hire new employee modal with skill initialization
 * - Pagination and batch size control
 * - Color-coded badges for status, morale, performance, retention risk
 * - Responsive design with HeroUI components
 * 
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Card,
  CardBody,
  Pagination,
  Spinner,
  Badge,
  Divider,
  Tooltip,
} from '@heroui/react';
import { useEmployees, useHireEmployee, useFireEmployee } from '@/lib/hooks/useEmployee';
import {
  getStatusColor,
  getMoraleColor,
  getPerformanceRatingColor,
  getRetentionRiskColor,
  getStatusLabel,
  getMoraleLabel,
  getPerformanceLabel,
  getRetentionRiskLabel,
} from '@/lib/utils/employee';
import type { Employee, EmployeeSkills } from '@/lib/types/models';

interface EmployeeDirectoryProps {
  companyId: string;
}

interface FilterState {
  status: string[];
  role: string[];
  performanceLevel: string;
  retentionRisk: string[];
  searchTerm: string;
}

interface SortConfig {
  column: keyof Employee | 'performanceRating';
  direction: 'ascending' | 'descending';
}

const EMPLOYEE_PARAMETERS = {
  MIN_SALARY: 30000,
  MAX_SALARY: 500000,
  SKILL_DEFAULT: 50,
  MORALE: {
    DEFAULT: 70,
    MIN: 1,
    MAX: 100,
  },
  PERFORMANCE: {
    PRODUCTIVITY_DEFAULT: 1.0,
    QUALITY_DEFAULT: 75,
    ATTENDANCE_DEFAULT: 0.95,
  },
};

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Training', value: 'training' },
  { label: 'On Leave', value: 'onLeave' },
  { label: 'Terminated', value: 'terminated' },
];

const PERFORMANCE_LEVELS = [
  { label: 'All Levels', value: '' },
  { label: 'Exceptional (80-100)', value: 'exceptional' },
  { label: 'Strong (60-79)', value: 'strong' },
  { label: 'Average (40-59)', value: 'average' },
  { label: 'Below Average (1-39)', value: 'belowAverage' },
];

const RETENTION_RISK_OPTIONS = [
  { label: 'Minimal', value: 'minimal' },
  { label: 'Low', value: 'low' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

/**
 * Get performance rating from performance metrics (0-100 scale)
 */
function getPerformanceRating(perf: any): number {
  if (!perf) return 0;
  return Math.round(((perf.productivity * 50) + perf.quality) / 2);
}

/**
 * Convert 0-100 performance rating to 1-5 star scale for color mapping
 */
function getPerformanceRatingScale(rating: number): number {
  if (rating >= 80) return 5; // Exceptional
  if (rating >= 60) return 4; // Exceeds expectations
  if (rating >= 40) return 3; // Meets expectations
  if (rating >= 20) return 2; // Below expectations
  return 1; // Unsatisfactory
}

/**
 * Get retention risk level based on morale
 */
function getRetentionRisk(morale: number): string {
  if (morale >= 80) return 'minimal';
  if (morale >= 60) return 'low';
  if (morale >= 40) return 'moderate';
  if (morale >= 20) return 'high';
  return 'critical';
}

export default function EmployeeDirectory({ companyId }: EmployeeDirectoryProps) {
  const { data: employees = [], isLoading, error } = useEmployees(companyId);
  const { mutate: fireEmployee } = useFireEmployee('');
  const { mutate: hireEmployee } = useHireEmployee();

  // UI State
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    role: [],
    performanceLevel: '',
    retentionRisk: [],
    searchTerm: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'hiredAt',
    direction: 'descending',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmFire, setShowConfirmFire] = useState<string | null>(null);

  // Hire form state
  const [hireForm, setHireForm] = useState({
    name: '',
    role: '',
    salary: EMPLOYEE_PARAMETERS.MIN_SALARY,
  });

  // Filter employees based on active criteria
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((emp) => {
      // Search filter
      if (filters.searchTerm && !emp.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(emp.status)) {
        return false;
      }

      // Role filter
      if (filters.role.length > 0 && !filters.role.includes(emp.role)) {
        return false;
      }

      // Performance level filter
      if (filters.performanceLevel) {
        const perfRating = getPerformanceRating(emp.performance);
        switch (filters.performanceLevel) {
          case 'exceptional':
            if (perfRating < 80) return false;
            break;
          case 'strong':
            if (perfRating < 60 || perfRating >= 80) return false;
            break;
          case 'average':
            if (perfRating < 40 || perfRating >= 60) return false;
            break;
          case 'belowAverage':
            if (perfRating >= 40) return false;
            break;
        }
      }

      // Retention risk filter
      if (filters.retentionRisk.length > 0) {
        const risk = getRetentionRisk(emp.morale);
        if (!filters.retentionRisk.includes(risk)) {
          return false;
        }
      }

      return true;
    });
  }, [employees, filters]);

  // Sort filtered employees
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortConfig.column === 'performanceRating') {
        aVal = getPerformanceRating(a.performance);
        bVal = getPerformanceRating(b.performance);
      } else {
        aVal = a[sortConfig.column];
        bVal = b[sortConfig.column];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredEmployees, sortConfig]);

  // Pagination
  const pages = Math.ceil(sortedEmployees.length / pageSize);
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, page, pageSize]);

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    if (!employees) return [];
    return Array.from(new Set(employees.map((e) => e.role)));
  }, [employees]);

  // Handlers
  const handleSort = useCallback((column: keyof Employee | 'performanceRating') => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  }, []);

  const handleHireEmployee = useCallback(() => {
    if (!hireForm.name.trim() || !hireForm.role.trim()) return;

    hireEmployee({
      companyId,
      name: hireForm.name,
      role: hireForm.role,
      salary: hireForm.salary,
      skills: {
        technical: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        leadership: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        industry: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        sales: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        marketing: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        finance: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        operations: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        hr: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        legal: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        rd: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        quality: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
        customer: EMPLOYEE_PARAMETERS.SKILL_DEFAULT,
      } as EmployeeSkills,
    });
    setShowHireModal(false);
    setHireForm({
      name: '',
      role: '',
      salary: EMPLOYEE_PARAMETERS.MIN_SALARY,
    });
  }, [hireForm, companyId, hireEmployee]);

  const handleFireEmployee = useCallback((employeeId: string) => {
    fireEmployee();
    setShowConfirmFire(null);
  }, [fireEmployee]);

  const renderCell = useCallback((employee: Employee, columnKey: React.Key): React.ReactNode => {
    const perfRating = getPerformanceRating(employee.performance);
    const perfScale = getPerformanceRatingScale(perfRating);
    const retentionRiskLabel = getRetentionRisk(employee.morale);
    // Calculate retention risk as 100 - morale (inverse relationship)
    const retentionRiskScore = Math.max(0, 100 - employee.morale);

    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <p className="font-semibold">{employee.name}</p>
            <p className="text-sm text-gray-500">ID: {employee.id.slice(0, 8)}</p>
          </div>
        );

      case 'role':
        return <span className="capitalize">{employee.role}</span>;

      case 'salary':
        return <span>${employee.salary.toLocaleString()}/yr</span>;

      case 'performance':
        return (
          <Badge
            content={perfRating}
            color={getPerformanceRatingColor(perfScale) as any}
            variant="flat"
          >
            <span className="text-sm">{getPerformanceLabel(perfScale)}</span>
          </Badge>
        );

      case 'morale':
        return (
          <Badge
            color={getMoraleColor(employee.morale) as any}
            variant="flat"
          >
            <span>{employee.morale}%</span>
          </Badge>
        );

      case 'retentionRisk':
        return (
          <Badge
            color={getRetentionRiskColor(retentionRiskScore) as any}
            variant="flat"
          >
            <span className="capitalize">{retentionRiskLabel}</span>
          </Badge>
        );

      case 'status':
        return (
          <Badge
            color={getStatusColor(employee.status) as any}
            variant="flat"
          >
            <span className="capitalize">{getStatusLabel(employee.status)}</span>
          </Badge>
        );

      case 'actions':
        return (
          <div className="flex gap-2">
            <Tooltip content="View Details">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  setSelectedEmployee(employee);
                  setShowDetailsModal(true);
                }}
              >
                👁️
              </Button>
            </Tooltip>
            {employee.status !== 'terminated' && (
              <Tooltip content="Fire Employee">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => setShowConfirmFire(employee.id)}
                >
                  ❌
                </Button>
              </Tooltip>
            )}
          </div>
        );

      default:
        return null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner label="Loading employees..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <CardBody>
          <p className="text-red-700 font-semibold">Error loading employees</p>
          <p className="text-sm text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and hire button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Employee Directory</h2>
        <Button
          color="success"
          onPress={() => setShowHireModal(true)}
          className="font-semibold"
        >
          + Hire Employee
        </Button>
      </div>

      {/* Filter Controls */}
      <Card className="bg-gray-50">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <Input
              placeholder="Search by name..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="md:col-span-2"
            />

            {/* Status Filter */}
            <Select
              label="Status"
              selectedKeys={new Set(filters.status)}
              onSelectionChange={(keys) =>
                setFilters({ ...filters, status: Array.from(keys) as string[] })
              }
              selectionMode="multiple"
            >
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            {/* Role Filter */}
            <Select
              label="Role"
              selectedKeys={new Set(filters.role)}
              onSelectionChange={(keys) =>
                setFilters({ ...filters, role: Array.from(keys) as string[] })
              }
              selectionMode="multiple"
            >
              {uniqueRoles.map((role) => (
                <SelectItem key={role}>
                  {role}
                </SelectItem>
              ))}
            </Select>

            {/* Performance Filter */}
            <Select
              label="Performance"
              selectedKeys={new Set(filters.performanceLevel ? [filters.performanceLevel] : [])}
              onSelectionChange={(keys) =>
                setFilters({
                  ...filters,
                  performanceLevel: Array.from(keys)[0] as string,
                })
              }
            >
              {PERFORMANCE_LEVELS.map((level) => (
                <SelectItem key={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </Select>

            {/* Retention Risk Filter */}
            <Select
              label="Retention Risk"
              selectedKeys={new Set(filters.retentionRisk)}
              onSelectionChange={(keys) =>
                setFilters({ ...filters, retentionRisk: Array.from(keys) as string[] })
              }
              selectionMode="multiple"
            >
              {RETENTION_RISK_OPTIONS.map((option) => (
                <SelectItem key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Clear Filters Button */}
          {Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== '')) && (
            <Button
              size="sm"
              variant="flat"
              onPress={() =>
                setFilters({
                  status: [],
                  role: [],
                  performanceLevel: '',
                  retentionRisk: [],
                  searchTerm: '',
                })
              }
            >
              Clear Filters
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Pagination and batch size controls */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {paginatedEmployees.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, sortedEmployees.length)} of {sortedEmployees.length} employees
        </p>
        <Select
          label="Per Page"
          selectedKeys={new Set([pageSize.toString()])}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            if (typeof selected === 'string') {
              setPageSize(parseInt(selected));
              setPage(1);
            }
          }}
          className="w-32"
        >
          {[5, 10, 20, 50].map((size) => (
            <SelectItem key={`page-${size}`}>
              {size} per page
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* DataTable */}
      {sortedEmployees.length === 0 ? (
        <Card className="bg-gray-50">
          <CardBody className="py-12">
            <p className="text-center text-gray-600 font-semibold">No employees found</p>
            <p className="text-center text-sm text-gray-500">Hire your first employee to get started</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Table
            aria-label="Employee Directory"
            bottomContent={
              pages > 1 ? (
                <div className="flex justify-center w-full">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(newPage) => setPage(newPage)}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('name')}
                className="cursor-pointer"
              >
                Name
              </TableColumn>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('role')}
                className="cursor-pointer"
              >
                Role
              </TableColumn>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('salary')}
                className="cursor-pointer"
              >
                Salary
              </TableColumn>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('performanceRating')}
                className="cursor-pointer"
              >
                Performance
              </TableColumn>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('morale')}
                className="cursor-pointer"
              >
                Morale
              </TableColumn>
              <TableColumn>Retention Risk</TableColumn>
              <TableColumn
                allowsSorting
                onClick={() => handleSort('status')}
                className="cursor-pointer"
              >
                Status
              </TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody items={paginatedEmployees}>
              {(employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{renderCell(employee, 'name')}</TableCell>
                  <TableCell>{renderCell(employee, 'role')}</TableCell>
                  <TableCell>{renderCell(employee, 'salary')}</TableCell>
                  <TableCell>{renderCell(employee, 'performance')}</TableCell>
                  <TableCell>{renderCell(employee, 'morale')}</TableCell>
                  <TableCell>{renderCell(employee, 'retentionRisk')}</TableCell>
                  <TableCell>{renderCell(employee, 'status')}</TableCell>
                  <TableCell>{renderCell(employee, 'actions')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}

      {/* Hire Employee Modal */}
      <Modal isOpen={showHireModal} onOpenChange={setShowHireModal} size="lg">
        <ModalContent>
          <ModalHeader>Hire New Employee</ModalHeader>
          <Divider />
          <ModalBody className="space-y-4">
            <Input
              label="Employee Name"
              placeholder="John Doe"
              value={hireForm.name}
              onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })}
            />
            <Input
              label="Job Role"
              placeholder="Software Engineer"
              value={hireForm.role}
              onChange={(e) => setHireForm({ ...hireForm, role: e.target.value })}
            />
            <Input
              label="Annual Salary"
              type="number"
              value={hireForm.salary.toString()}
              onChange={(e) => setHireForm({ ...hireForm, salary: parseInt(e.target.value) || 0 })}
              description={`Range: $${EMPLOYEE_PARAMETERS.MIN_SALARY.toLocaleString()}-$${EMPLOYEE_PARAMETERS.MAX_SALARY.toLocaleString()}`}
            />
            <p className="text-sm text-gray-600">
              First week salary: ${Math.round(hireForm.salary / 52).toLocaleString()}
            </p>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setShowHireModal(false)}>
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleHireEmployee}
              disabled={!hireForm.name.trim() || !hireForm.role.trim()}
            >
              Hire Employee
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal isOpen={showDetailsModal} onOpenChange={setShowDetailsModal} size="2xl">
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  👤
                </div>
                <div>
                  <h3 className="font-bold">{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-600">{selectedEmployee.role}</p>
                </div>
              </div>
            </ModalHeader>
            <Divider />
            <ModalBody className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="text-2xl font-bold">${selectedEmployee.salary.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Morale</p>
                  <p className="text-2xl font-bold">{selectedEmployee.morale}%</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Performance</p>
                  <p className="text-2xl font-bold">{getPerformanceRating(selectedEmployee.performance)}/100</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-bold capitalize">{getStatusLabel(selectedEmployee.status)}</p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Skills (1-100)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedEmployee.skills).map(([skill, value]: [string, any]) => (
                    <div key={skill}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm capitalize text-gray-700">{skill}</span>
                        <span className="text-sm font-semibold">{value}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              {selectedEmployee.reviews && selectedEmployee.reviews.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Recent Review</h4>
                  {(() => {
                    const lastReview = selectedEmployee.reviews[selectedEmployee.reviews.length - 1];
                    return (
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Score</span>
                          <span className="text-lg font-bold">{lastReview.overallScore}/100</span>
                        </div>
                        {lastReview.strengths && lastReview.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Strengths:</p>
                            <ul className="text-sm text-gray-600 list-disc ml-4">
                              {lastReview.strengths.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Training Status */}
              {selectedEmployee.currentTraining && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Current Training</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold capitalize">{selectedEmployee.currentTraining.skill}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedEmployee.currentTraining.hoursCompleted} hours completed
                    </p>
                  </div>
                </div>
              )}
            </ModalBody>
            <Divider />
            <ModalFooter>
              <Button color="default" variant="light" onPress={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirm Fire Modal */}
      <Modal
        isOpen={showConfirmFire !== null}
        onOpenChange={(isOpen) => !isOpen && setShowConfirmFire(null)}
      >
        <ModalContent>
          <ModalHeader>Confirm Termination</ModalHeader>
          <Divider />
          <ModalBody>
            <p>
              Are you sure you want to terminate{' '}
              <span className="font-bold">
                {employees?.find((e) => e.id === showConfirmFire)?.name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-600">This action cannot be undone.</p>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Button color="default" variant="light" onPress={() => setShowConfirmFire(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => showConfirmFire && handleFireEmployee(showConfirmFire)}
            >
              Terminate Employee
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
