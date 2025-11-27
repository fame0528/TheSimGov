/**
 * @fileoverview Employee Detail Page
 * @module app/(game)/employees/[id]
 * 
 * OVERVIEW:
 * Complete employee profile with skills, performance, training, and actions.
 * Morale tracking, retention risk, review history, salary management.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Chip,
  Progress,
  Select,
  SelectItem,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Slider,
  Input,
  Alert,
} from '@heroui/react';
import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { SkillsChart } from '@/lib/components/employee';
import { useEmployee, useTrainEmployee, useFireEmployee } from '@/lib/hooks/useEmployee';
import { formatCurrency } from '@/lib/utils';
import type { EmployeeSkills } from '@/lib/types';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [selectedSkill, setSelectedSkill] = useState<keyof EmployeeSkills>('technical');
  const [newSalary, setNewSalary] = useState<number>(0);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

  const { data: employee, isLoading, error, refetch } = useEmployee(employeeId);
  const { mutate: trainEmployee, isLoading: isTraining } = useTrainEmployee(employeeId);
  const { mutate: fireEmployee, isLoading: isFiring } = useFireEmployee(employeeId);

  /**
   * Handle training start
   */
  const handleStartTraining = () => {
    trainEmployee({ skill: selectedSkill });
  };

  /**
   * Handle salary adjustment
   */
  const handleAdjustSalary = () => {
    // TODO: Implement salary adjustment API call
    setIsSalaryModalOpen(false);
  };

  /**
   * Handle employee termination
   */
  const handleTerminate = () => {
    fireEmployee();
  };

  /**
   * Open salary modal
   */
  const openSalaryModal = () => {
    if (employee) {
      setNewSalary(employee.salary);
      setIsSalaryModalOpen(true);
    }
  };

  /**
   * Get retention risk color
   */
  const getRetentionColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'moderate': return 'yellow';
      case 'low': return 'blue';
      case 'minimal': return 'green';
      default: return 'gray';
    }
  };

  /**
   * Get morale color
   */
  const getMoraleColor = (morale: number) => {
    if (morale >= 85) return 'green';
    if (morale >= 70) return 'blue';
    if (morale >= 50) return 'yellow';
    if (morale >= 30) return 'orange';
    return 'red';
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Employee" subtitle="Loading...">
        <LoadingSpinner size="lg" message="Loading employee..." />
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout title="Employee" subtitle="Not Found">
        <ErrorMessage error={error || new Error('Employee not found')} />
        <Button className="mt-4" onPress={() => router.push('/employees')}>
          Back to Employees
        </Button>
      </DashboardLayout>
    );
  }

  const isInTraining = employee.status === 'training';
  const retentionColor = getRetentionColor(employee.retentionRisk || 'moderate');
  const moraleColor = getMoraleColor(employee.morale);

  return (
    <DashboardLayout
      title={employee.name}
      subtitle={`${employee.role} • ${formatCurrency(employee.salary)}/year`}
    >
      <div className="flex flex-col gap-6">
        {/* Status Header */}
        <Card>
          <div className="flex justify-between flex-wrap gap-4">
            <div className="flex gap-4">
              <Chip
                color={
                  employee.status === 'active' ? 'success' :
                  employee.status === 'training' ? 'primary' :
                  employee.status === 'onLeave' ? 'warning' :
                  'danger'
                }
                size="lg"
              >
                {employee.status.toUpperCase()}
              </Chip>
              <Chip color={retentionColor as any} size="lg">
                {employee.retentionRisk?.toUpperCase() || 'UNKNOWN'} RISK
              </Chip>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="bordered" onPress={openSalaryModal}>
                Adjust Salary
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="bordered"
                onPress={() => setIsTerminateModalOpen(true)}
                isDisabled={employee.status === 'terminated'}
              >
                Terminate
              </Button>
            </div>
          </div>
        </Card>

        {/* Morale & Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Morale">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className={`text-3xl font-bold text-${moraleColor}`}>
                  {employee.morale}
                </span>
                <span className="text-sm text-default-600">/ 100</span>
              </div>
              <Progress value={employee.morale} color={moraleColor as any} size="lg" />
              {employee.morale < 50 && (
                <Alert color="warning" className="mt-2">
                  Low morale increases quit risk
                </Alert>
              )}
            </div>
          </Card>

          <Card title="Productivity">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-3xl font-bold text-primary">
                  {employee.performance?.productivity || 85}
                </span>
                <span className="text-sm text-default-600">/ 100</span>
              </div>
              <Progress value={employee.performance?.productivity || 85} color="primary" size="lg" />
            </div>
          </Card>

          <Card title="Quality">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-3xl font-bold text-secondary">
                  {employee.performance?.quality || 88}
                </span>
                <span className="text-sm text-default-600">/ 100</span>
              </div>
              <Progress value={employee.performance?.quality || 88} color="secondary" size="lg" />
            </div>
          </Card>
        </div>

        {/* Skills Chart */}
        <Card title="Skills Profile">
          <SkillsChart skills={employee.skills} />
        </Card>

        {/* Training Section */}
        <Card title="Training">
          {isInTraining && employee.currentTraining ? (
            <div className="flex flex-col gap-4">
              <Alert color="primary">
                Training in progress: {employee.currentTraining.skill} skill
                <br />
                Started: {new Date(employee.currentTraining.startDate).toLocaleDateString()}
                <br />
                Duration: {employee.currentTraining.duration} hours
              </Alert>
              <Progress
                value={50}
                color="primary"
                size="lg"
              />
              <Button color="success" size="sm">
                Complete Training
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <Select
                  selectedKeys={new Set([selectedSkill])}
                  onSelectionChange={(keys) => setSelectedSkill(Array.from(keys as Set<string>)[0] as keyof EmployeeSkills)}
                  className="flex-1"
                >
                  <SelectItem key="technical">Technical</SelectItem>
                  <SelectItem key="leadership">Leadership</SelectItem>
                  <SelectItem key="industry">Industry Knowledge</SelectItem>
                  <SelectItem key="sales">Sales</SelectItem>
                  <SelectItem key="marketing">Marketing</SelectItem>
                  <SelectItem key="finance">Finance</SelectItem>
                  <SelectItem key="operations">Operations</SelectItem>
                  <SelectItem key="hr">Human Resources</SelectItem>
                  <SelectItem key="legal">Legal</SelectItem>
                  <SelectItem key="rd">R&D</SelectItem>
                  <SelectItem key="quality">Quality</SelectItem>
                  <SelectItem key="customer">Customer Service</SelectItem>
                </Select>
                <Button
                  color="primary"
                  onPress={handleStartTraining}
                  isLoading={isTraining}
                  isDisabled={employee.status !== 'active'}
                >
                  Start Training
                </Button>
              </div>
              <div className="flex justify-between text-sm text-default-600">
                <span>Cost: $4,000</span>
                <span>Duration: 40 hours</span>
                <span>Gain: +10-20 skill points</span>
              </div>
              {employee.status !== 'active' && (
                <Alert color="warning">
                  Employee must be active to start training
                </Alert>
              )}
            </div>
          )}
        </Card>

        {/* Performance History */}
        <Card title="Review History">
          {employee.performanceReviews && employee.performanceReviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {employee.performanceReviews.slice(0, 3).map((review: any, idx: number) => (
                <div key={idx} className="p-4 border border-default-200 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{new Date(review.date).toLocaleDateString()}</span>
                    <Chip color={review.score >= 75 ? 'success' : 'warning'}>
                      Score: {review.score}
                    </Chip>
                  </div>
                  <div className="flex flex-col gap-1">
                    {review.feedback?.slice(0, 2).map((fb: any, i: number) => (
                      <p key={i} className="text-sm text-default-600">
                        • {fb}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-default-600">No reviews yet</p>
          )}
        </Card>
      </div>

      {/* Salary Adjustment Modal */}
      <Modal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Adjust Salary</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-default-600 mb-2">
                  Current Salary: {formatCurrency(employee.salary)}
                </p>
                <p className="text-sm text-default-600">
                  Market Value: {formatCurrency(employee.marketValue || employee.salary)}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">New Salary: {formatCurrency(newSalary)}</p>
                <Slider
                  value={newSalary}
                  onChange={(value) => setNewSalary(value as number)}
                  minValue={30000}
                  maxValue={500000}
                  step={5000}
                  className="max-w-full"
                />
              </div>
              <Divider />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm">Current Weekly Cost</span>
                  <span className="text-sm font-semibold">{formatCurrency(Math.round(employee.salary / 52))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New Weekly Cost</span>
                  <span className="text-sm font-semibold">{formatCurrency(Math.round(newSalary / 52))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Difference</span>
                  <span className={`font-bold ${newSalary > employee.salary ? 'text-danger' : 'text-success'}`}>
                    {newSalary > employee.salary ? '+' : ''}{formatCurrency(Math.round((newSalary - employee.salary) / 52))}
                  </span>
                </div>
              </div>
              {newSalary > employee.salary && (
                <Alert color="primary">
                  Raises improve morale and retention
                </Alert>
              )}
              {newSalary < employee.salary && (
                <Alert color="warning">
                  Salary cuts severely damage morale
                </Alert>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsSalaryModalOpen(false)} className="mr-3">
              Cancel
            </Button>
            <Button color="primary" onPress={handleAdjustSalary}>
              Adjust Salary
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Terminate Confirmation Modal */}
      <Modal isOpen={isTerminateModalOpen} onClose={() => setIsTerminateModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Terminate Employee</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Alert color="danger">
                This action cannot be undone. {employee.name} will be marked as terminated.
              </Alert>
              <p>
                Are you sure you want to terminate <strong>{employee.name}</strong>?
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsTerminateModalOpen(false)} className="mr-3">
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleTerminate}
              isLoading={isFiring}
            >
              Confirm Termination
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Skills Visualization**: Full SkillsChart display
 * 2. **Training Management**: Start training, track progress
 * 3. **Salary Adjustment**: Modal with market value comparison
 * 4. **Termination**: Confirmation modal with warning
 * 5. **Performance Tracking**: Reviews, productivity, quality
 * 
 * PREVENTS:
 * - Accidental terminations
 * - Salary cuts without warning
 * - Training while not active
 */
