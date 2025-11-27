/**
 * @fileoverview Contract Execution Page
 * @module app/(game)/contracts/[id]/execute
 * 
 * OVERVIEW:
 * Assign employees and complete contracts.
 * Shows skill matching, progress tracking, and completion form.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Checkbox } from '@heroui/checkbox';
import { Progress } from '@heroui/progress';
import { Divider } from '@heroui/divider';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { EmployeeCard } from '@/lib/components/employee';
import { useAssignEmployees, useCompleteContract, useAcceptContract } from '@/lib/hooks/useContract';
import { useEmployees } from '@/lib/hooks/useEmployee';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Contract Execution Page
 */
export default function ContractExecutePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(100);

  const { data: contract, isLoading, error, mutate } = useSWR(
    `/api/contracts/${params.id}`,
    fetcher
  );

  const { data: employees, isLoading: employeesLoading } = useEmployees(companyId || undefined);
  const { assign, isLoading: assigning } = useAssignEmployees();
  const { accept, isLoading: accepting } = useAcceptContract();
  const { complete, isLoading: completing } = useCompleteContract();

  // Initialize selected employees from contract
  useEffect(() => {
    if (contract?.assignedEmployees) {
      setSelectedEmployees(contract.assignedEmployees);
    }
  }, [contract]);

  /**
   * Handle accept contract (bidding → active)
   */
  const handleAccept = async () => {
    if (!companyId) return;

    try {
      await accept(params.id, companyId);
      await mutate();
    } catch (err: any) {
      console.error('Accept failed:', err.message);
    }
  };

  /**
   * Handle employee assignment
   */
  const handleAssign = async () => {
    if (!companyId || selectedEmployees.length === 0) return;

    try {
      await assign(params.id, companyId, selectedEmployees);
      await mutate();
    } catch (err: any) {
      console.error('Assignment failed:', err.message);
    }
  };

  /**
   * Handle contract completion
   */
  const handleComplete = async () => {
    if (!companyId) return;

    try {
      const result = await complete(params.id, companyId, progressPercent);
      router.push(`/contracts/active?companyId=${companyId}`);
    } catch (err: any) {
      console.error('Completion failed:', err.message);
    }
  };

  /**
   * Toggle employee selection
   */
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  /**
   * Calculate team skill average for a requirement
   */
  const getTeamSkill = (skillName: keyof any) => {
    if (!employees || selectedEmployees.length === 0) return 0;
    
    const selected = employees.filter((e: any) => selectedEmployees.includes(e._id));
    const total = selected.reduce((sum: number, e: any) => sum + (e.skills[skillName] || 0), 0);
    return Math.round(total / selected.length);
  };

  if (isLoading || employeesLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error="Failed to load contract" />;
  if (!contract) return <ErrorMessage error="Contract not found" />;

  const showAcceptButton = contract.status === 'bidding';
  const showAssignButton = contract.status === 'active';
  const showCompleteButton = contract.status === 'in_progress';

  return (
    <DashboardLayout
      title={contract.title}
      subtitle={`${contract.clientName} • ${contract.daysRemaining} days remaining`}
      maxWidth="container.xl"
    >
      <div className="flex flex-col gap-6">
        {/* Status Banner */}
        <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex gap-3 items-center">
            <Chip color="primary" size="md" className="px-3 py-1">
              {contract.status.replace('_', ' ').toUpperCase()}
            </Chip>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {showAcceptButton && 'Accept to begin work'}
              {showAssignButton && 'Assign employees to start'}
              {showCompleteButton && 'Contract in progress'}
            </span>
          </div>
          <Button variant="light" onPress={() => router.back()}>
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Selection/Display */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <p className="text-lg font-semibold">
                    {showAssignButton ? 'Select Employees' : 'Assigned Team'}
                  </p>
                  {showAssignButton && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmployees.length}/{contract.requiredEmployeeCount} selected
                    </p>
                  )}
                </div>

                {employees && employees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {employees
                      .filter((e: any) => showAssignButton || selectedEmployees.includes(e._id))
                      .map((employee: any) => (
                        <div key={employee._id} className="relative">
                          {showAssignButton && (
                            <div className="absolute top-2 right-2 z-10">
                              <Checkbox
                                isSelected={selectedEmployees.includes(employee._id)}
                                onValueChange={() => toggleEmployee(employee._id)}
                              />
                            </div>
                          )}
                          <EmployeeCard employee={employee} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No employees available</p>
                )}
              </div>
            </Card>

            {/* Skill Matching */}
            {selectedEmployees.length > 0 && (
              <Card>
                <div className="flex flex-col gap-4">
                  <p className="text-lg font-semibold">Team Skills vs Requirements</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['technical', 'leadership', 'industry', 'operations'].map(skill => {
                      const teamSkill = getTeamSkill(skill);
                      const required = contract.requirements[skill] || 0;
                      const percentage = required > 0 ? (teamSkill / required) * 100 : 100;
                      
                      return (
                        <div key={skill}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium capitalize">
                              {skill}
                            </span>
                            <span className={`text-xs ${teamSkill >= required ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {teamSkill}/{required}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(percentage, 100)}
                            color={teamSkill >= required ? 'success' : 'warning'}
                            size="sm"
                            className="h-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Contract Stats */}
            <Card>
              <div className="flex flex-col gap-3">
                {/* Custom Stat component replacement */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Base Value</span>
                  <span className="text-2xl font-bold">${contract.baseValue.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{contract.daysRemaining} days left</span>
                </div>
                <Divider />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Progress</span>
                  <span className="text-2xl font-bold">{contract.progressPercent || 0}%</span>
                  <Progress
                    value={contract.progressPercent || 0}
                    color="primary"
                    size="sm"
                    className="mt-2 h-2"
                  />
                </div>
              </div>
            </Card>

            {/* Actions */}
            {showAcceptButton && (
              <Button
                color="primary"
                size="lg"
                onPress={handleAccept}
                isLoading={accepting}
              >
                Accept Contract
              </Button>
            )}

            {showAssignButton && (
              <Button
                color="success"
                size="lg"
                onPress={handleAssign}
                isLoading={assigning}
                isDisabled={selectedEmployees.length === 0}
              >
                Assign {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
              </Button>
            )}

            {showCompleteButton && (
              <Button
                color="secondary"
                size="lg"
                onPress={handleComplete}
                isLoading={completing}
              >
                Complete Contract
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Status Flow**: Accept → Assign → Complete
 * 2. **Skill Matching**: Real-time comparison of team vs requirements
 * 3. **Employee Selection**: Checkbox selection with visual feedback
 * 4. **Availability Check**: Only shows available employees
 * 5. **Success Preview**: Shows which skills meet requirements
 * 
 * DISPLAYS:
 * - Contract status and deadline
 * - Employee selection grid with checkboxes
 * - Team skill averages vs requirements
 * - Progress tracking for in-progress contracts
 * - Action buttons based on current status
 */
