/**
 * @fileoverview OrgChart Component - Organizational Structure Visualization
 * @module components/employee/OrgChart
 *
 * OVERVIEW:
 * Hierarchical visualization of company employee structure. Displays employees
 * with filterable cards showing key metrics (status, morale, performance, retention risk).
 * Supports drilling into employee details via modal.
 *
 * Features:
 * - Employee card grid with color-coded metrics
 * - Multi-filter support (status, performance, retention, search)
 * - Employee detail modal with action buttons
 * - Responsive design (desktop, tablet, mobile)
 * - Real-time data sync with useEmployees hook
 *
 * @created 2025-11-29
 * @author ECHO v1.3.1
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Spinner,
  Divider,
} from '@heroui/react';
import { useEmployees, useEmployee } from '@/lib/hooks/useEmployee';
import {
  getStatusColor,
  getMoraleColor,
  getRetentionRiskColor,
  getPerformanceRatingColor,
  getStatusLabel,
  getMoraleLabel,
  getRetentionRiskLabel,
  getPerformanceLabel,
} from '@/lib/utils/employee';
import type { Employee } from '@/lib/types/models';

interface OrgChartProps {
  companyId: string;
}

interface FilterState {
  status: string[];
  performanceMin: number;
  retentionRisk: string[];
  searchTerm: string;
}

/**
 * OrgChart Component
 *
 * @param {OrgChartProps} props - Component props
 * @returns {JSX.Element} Organizational chart with filterable employee cards
 *
 * @example
 * ```tsx
 * <OrgChart companyId="comp-123" />
 * ```
 */
export default function OrgChart({ companyId }: OrgChartProps): JSX.Element {
  // Data fetching
  const { data: employees, isLoading, error } = useEmployees(companyId);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const {
    data: selectedEmployee,
    isLoading: employeeLoading,
    error: employeeError,
  } = useEmployee(selectedEmployeeId);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    performanceMin: 0,
    retentionRisk: [],
    searchTerm: '',
  });

  /**
   * Filter employees based on active filters
   * Applies status, performance, retention risk, and search filters
   */
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter((emp: Employee) => {
      // Status filter
      if (
        filters.status.length > 0 &&
        !filters.status.includes(emp.status)
      ) {
        return false;
      }

      // Performance filter (0 means all, 1-5 means minimum rating)
      if (filters.performanceMin > 0) {
        const lastReview = emp.reviews?.[emp.reviews.length - 1];
        const performanceScore = lastReview?.overallScore || 50;
        const performanceRating = Math.ceil(performanceScore / 20); // Convert to 1-5 scale
        if (performanceRating < filters.performanceMin) {
          return false;
        }
      }

      // Retention risk filter
      if (filters.retentionRisk.length > 0) {
        const riskLevel = emp.retentionRisk || 'low';
        if (!filters.retentionRisk.includes(riskLevel)) {
          return false;
        }
      }

      // Search by name
      if (filters.searchTerm) {
        if (
          !emp.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [employees, filters]);

  /**
   * Update single filter value
   */
  const updateFilter = useCallback(
    (key: keyof FilterState, value: unknown) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  /**
   * Toggle status filter
   */
  const toggleStatusFilter = useCallback(
    (status: string) => {
      setFilters((prev) => ({
        ...prev,
        status: prev.status.includes(status)
          ? prev.status.filter((s) => s !== status)
          : [...prev.status, status],
      }));
    },
    []
  );

  /**
   * Toggle retention risk filter
   */
  const toggleRiskFilter = useCallback(
    (risk: string) => {
      setFilters((prev) => ({
        ...prev,
        retentionRisk: prev.retentionRisk.includes(risk)
          ? prev.retentionRisk.filter((r) => r !== risk)
          : [...prev.retentionRisk, risk],
      }));
    },
    []
  );

  /**
   * Close detail modal and clear selection
   */
  const closeModal = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading organization data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-500">
        <CardBody className="text-red-600">
          <p>Error loading employees: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </CardBody>
      </Card>
    );
  }

  // No employees
  if (!employees || employees.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12 text-gray-500">
          <p>No employees in this company yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Organization Chart</h2>
        <p className="text-gray-600">
          {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-gray-50">
        <CardHeader className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold">Filters</h3>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          {/* Search by name */}
          <Input
            type="text"
            placeholder="Search by employee name..."
            value={filters.searchTerm}
            onValueChange={(value) => updateFilter('searchTerm', value)}
            className="max-w-xs"
          />

          {/* Status checkboxes */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Status</p>
            <div className="flex gap-4 flex-wrap">
              {['active', 'training', 'onLeave', 'terminated'].map((status) => (
                <Checkbox
                  key={status}
                  checked={filters.status.includes(status)}
                  onChange={() => toggleStatusFilter(status)}
                >
                  <span className="capitalize">{status}</span>
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Performance rating select */}
          <Select
            label="Minimum Performance Rating"
            selectedKeys={new Set([filters.performanceMin.toString()])}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              updateFilter('performanceMin', parseInt(value as string));
            }}
            className="max-w-xs"
          >
            <SelectItem key="0">All</SelectItem>
            <SelectItem key="1">★★★★★ (5 stars)</SelectItem>
            <SelectItem key="2">★★★★☆ (4+ stars)</SelectItem>
            <SelectItem key="3">★★★☆☆ (3+ stars)</SelectItem>
            <SelectItem key="4">★★☆☆☆ (2+ stars)</SelectItem>
          </Select>

          {/* Retention risk checkboxes */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Retention Risk</p>
            <div className="flex gap-4 flex-wrap">
              {['minimal', 'low', 'moderate', 'high', 'critical'].map(
                (risk) => (
                  <Checkbox
                    key={risk}
                    checked={filters.retentionRisk.includes(risk)}
                    onChange={() => toggleRiskFilter(risk)}
                  >
                    <span className="capitalize">{risk}</span>
                  </Checkbox>
                )
              )}
            </div>
          </div>

          {/* Clear filters button */}
          <Button
            variant="bordered"
            size="sm"
            onPress={() => {
              setFilters({
                status: [],
                performanceMin: 0,
                retentionRisk: [],
                searchTerm: '',
              });
            }}
          >
            Clear All Filters
          </Button>
        </CardBody>
      </Card>

      {/* Employee Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Employees</h3>
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 text-gray-500">
              <p>No employees match the selected filters.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((emp: Employee) => (
              <Card
                key={emp.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                isPressable
                onPress={() => setSelectedEmployeeId(emp.id)}
              >
                <CardHeader className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{emp.name}</h4>
                      <p className="text-sm text-gray-600">{emp.role}</p>
                    </div>
                    <Badge
                      color={getStatusColor(emp.status) as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
                      variant="flat"
                    >
                      <span className="w-3 h-3" />
                    </Badge>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="gap-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Status:
                    </span>
                    <Badge
                      color={getStatusColor(emp.status) as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
                      variant="flat"
                    >
                      {getStatusLabel(emp.status)}
                    </Badge>
                  </div>

                  {/* Morale */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Morale:
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${emp.morale}%`,
                            backgroundColor: getMoraleColor(emp.morale),
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8">
                        {emp.morale}%
                      </span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Performance:
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      {(() => {
                        const lastReview = emp.reviews?.[emp.reviews.length - 1];
                        const score = lastReview?.overallScore || 50;
                        const rating = Math.ceil(score / 20);
                        return (
                          <>
                            <Badge
                              color={getPerformanceRatingColor(rating) as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
                              variant="flat"
                            >
                              {getPerformanceLabel(rating)}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {score}/100
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Retention Risk */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Risk:
                    </span>
                    <Badge
                      color={getRetentionRiskColor(
                        emp.morale < 30
                          ? 100
                          : emp.morale < 60
                            ? 60
                            : 20
                      ) as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
                      variant="flat"
                    >
                      {getRetentionRiskLabel(
                        emp.morale < 30
                          ? 100
                          : emp.morale < 60
                            ? 60
                            : 20
                      )}
                    </Badge>
                  </div>

                  {/* Skills Summary */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Skills:
                    </span>
                    <div className="flex-1">
                      {emp.skillAverage && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-full rounded-full transition-all bg-blue-500"
                              style={{
                                width: `${emp.skillAverage}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold w-8">
                            {Math.round(emp.skillAverage)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-24">
                      Salary:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${emp.salary.toLocaleString()}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      <Modal isOpen={!!selectedEmployeeId} onOpenChange={closeModal} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
                <ModalHeader className="flex flex-col gap-1">
                {employeeLoading ? (
                  'Loading...'
                ) : employeeError ? (
                  'Error'
                ) : selectedEmployee ? (
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedEmployee.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedEmployee.role}
                    </p>
                  </div>
                ) : null as React.ReactNode}
              </ModalHeader>
              <Divider />
              <ModalBody>
                {employeeLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : employeeError ? (
                  <p className="text-red-600">
                    Error loading employee details
                  </p>
                ) : selectedEmployee ? (
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge
                          color={getStatusColor(selectedEmployee.status) as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
                          variant="flat"
                        >
                          {getStatusLabel(selectedEmployee.status)}
                        </Badge>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Morale</p>
                        <p className="text-2xl font-bold">
                          {selectedEmployee.morale}%
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Salary</p>
                        <p className="text-xl font-bold">
                          ${selectedEmployee.salary.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Hired</p>
                        <p className="text-sm font-semibold">
                          {new Date(
                            selectedEmployee.hiredAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Skills Breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Skills</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedEmployee.skills).map(
                          ([skill, value]: [string, unknown]) => (
                            <div key={skill}>
                              <div className="flex justify-between mb-1">
                                <span className="capitalize text-gray-700">
                                  {skill}
                                </span>
                                <span className="font-semibold">{value as number}</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all"
                                  style={{
                                    width: `${value as number}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    {selectedEmployee.reviews &&
                      selectedEmployee.reviews.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">
                            Recent Review
                          </h4>
                          {(() => {
                            const lastReview =
                              selectedEmployee.reviews[
                                selectedEmployee.reviews.length - 1
                              ];
                            return (
                              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Score
                                  </span>
                                  <span className="text-lg font-bold">
                                    {lastReview.overallScore}/100
                                  </span>
                                </div>
                                {lastReview.strengths &&
                                  lastReview.strengths.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700">
                                        Strengths:
                                      </p>
                                      <ul className="text-sm text-gray-600 list-disc ml-4">
                                        {lastReview.strengths.map(
                                          (strength: string, i: number) => (
                                            <li key={i}>{strength}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}
                  </div>
                ) : null}
              </ModalBody>
              <Divider />
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  View Full Profile
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
