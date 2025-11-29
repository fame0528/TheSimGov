/**
 * @fileoverview Onboarding Dashboard Component
 * @module lib/components/employee/OnboardingDashboard
 * 
 * OVERVIEW:
 * Dashboard for managing new hire onboarding process. Tracks onboarding
 * progress, training assignments, equipment provisioning, and access setup
 * for newly hired employees.
 * 
 * FEATURES:
 * - New hire onboarding workflow visualization
 * - Checklist for onboarding tasks
 * - Training assignment interface
 * - Equipment and access provisioning tracking
 * - Welcome message customization
 * - Mentor assignment
 * - First week schedule planning
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Checkbox } from '@heroui/checkbox';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { Employee } from '@/lib/types';

export interface OnboardingTask {
  id: string;
  category: 'paperwork' | 'equipment' | 'access' | 'training' | 'introduction';
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  dueByDay: number; // Day of onboarding (1 = first day)
}

export interface OnboardingDashboardProps {
  /** Employee being onboarded */
  employee: Employee;
  /** List of available mentors */
  availableMentors: Employee[];
  /** Onboarding tasks */
  tasks: OnboardingTask[];
  /** Assigned mentor ID */
  assignedMentorId?: string;
  /** Welcome message */
  welcomeMessage?: string;
  /** Task completion handler */
  onTaskComplete: (taskId: string) => Promise<void>;
  /** Mentor assignment handler */
  onAssignMentor: (mentorId: string) => Promise<void>;
  /** Welcome message update handler */
  onUpdateWelcomeMessage: (message: string) => Promise<void>;
  /** Complete onboarding handler */
  onCompleteOnboarding: () => Promise<void>;
}

/**
 * Default onboarding tasks template
 */
export const DEFAULT_ONBOARDING_TASKS: Omit<OnboardingTask, 'isCompleted' | 'completedAt' | 'completedBy'>[] = [
  // Day 1 - Paperwork & Basics
  { id: 'tax-forms', category: 'paperwork', title: 'Complete Tax Forms', description: 'W-4, I-9, and state tax forms', isRequired: true, dueByDay: 1 },
  { id: 'employee-handbook', category: 'paperwork', title: 'Review Employee Handbook', description: 'Read and acknowledge company policies', isRequired: true, dueByDay: 1 },
  { id: 'workstation', category: 'equipment', title: 'Setup Workstation', description: 'Computer, monitor, keyboard, mouse', isRequired: true, dueByDay: 1 },
  { id: 'email-account', category: 'access', title: 'Create Email Account', description: 'Company email and calendar access', isRequired: true, dueByDay: 1 },
  
  // Day 2 - Access & Tools
  { id: 'badge-access', category: 'access', title: 'Issue Access Badge', description: 'Building and floor access card', isRequired: true, dueByDay: 2 },
  { id: 'software-licenses', category: 'access', title: 'Software Licenses', description: 'Required software and tools access', isRequired: true, dueByDay: 2 },
  { id: 'team-intro', category: 'introduction', title: 'Team Introduction', description: 'Meet immediate team members', isRequired: true, dueByDay: 2 },
  
  // Day 3-5 - Training & Orientation
  { id: 'security-training', category: 'training', title: 'Security Training', description: 'Information security and compliance', isRequired: true, dueByDay: 3 },
  { id: 'hr-orientation', category: 'training', title: 'HR Orientation', description: 'Benefits, policies, and procedures', isRequired: true, dueByDay: 3 },
  { id: 'dept-orientation', category: 'training', title: 'Department Orientation', description: 'Department processes and workflows', isRequired: true, dueByDay: 5 },
  { id: 'mentor-meeting', category: 'introduction', title: 'Mentor Introduction', description: 'Meet assigned mentor', isRequired: false, dueByDay: 2 },
  { id: 'exec-intro', category: 'introduction', title: 'Executive Introduction', description: 'Meet department head or executive', isRequired: false, dueByDay: 5 },
];

/**
 * Get category icon
 */
const getCategoryIcon = (category: OnboardingTask['category']): string => {
  switch (category) {
    case 'paperwork': return '📄';
    case 'equipment': return '💻';
    case 'access': return '🔑';
    case 'training': return '📚';
    case 'introduction': return '👋';
    default: return '📋';
  }
};

/**
 * Get category color
 */
const getCategoryColor = (category: OnboardingTask['category']): 'primary' | 'success' | 'warning' | 'danger' | 'secondary' => {
  switch (category) {
    case 'paperwork': return 'secondary';
    case 'equipment': return 'primary';
    case 'access': return 'warning';
    case 'training': return 'success';
    case 'introduction': return 'danger';
    default: return 'primary';
  }
};

/**
 * Calculate days since hire
 */
const getDaysSinceHire = (hiredAt: Date): number => {
  const now = new Date();
  const hire = new Date(hiredAt);
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Onboarding Dashboard Component
 * 
 * USAGE:
 * ```tsx
 * <OnboardingDashboard
 *   employee={newHire}
 *   availableMentors={seniorEmployees}
 *   tasks={onboardingTasks}
 *   onTaskComplete={handleTaskComplete}
 *   onAssignMentor={handleMentorAssign}
 *   onUpdateWelcomeMessage={handleWelcomeUpdate}
 *   onCompleteOnboarding={handleComplete}
 * />
 * ```
 */
export function OnboardingDashboard({
  employee,
  availableMentors,
  tasks,
  assignedMentorId,
  welcomeMessage = '',
  onTaskComplete,
  onAssignMentor,
  onUpdateWelcomeMessage,
  onCompleteOnboarding,
}: OnboardingDashboardProps) {
  const [selectedMentor, setSelectedMentor] = useState(assignedMentorId || '');
  const [message, setMessage] = useState(welcomeMessage);
  const [completing, setCompleting] = useState<string | null>(null);
  const [savingMessage, setSavingMessage] = useState(false);
  const [savingMentor, setSavingMentor] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  // Calculate progress
  const daysSinceHire = getDaysSinceHire(employee.hiredAt);
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const requiredTasks = tasks.filter(t => t.isRequired);
  const completedRequired = requiredTasks.filter(t => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const canComplete = completedRequired === requiredTasks.length;

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, OnboardingTask[]> = {};
    tasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });
    return grouped;
  }, [tasks]);

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const grouped: Record<number, OnboardingTask[]> = {};
    tasks.forEach(task => {
      if (!grouped[task.dueByDay]) {
        grouped[task.dueByDay] = [];
      }
      grouped[task.dueByDay].push(task);
    });
    return grouped;
  }, [tasks]);

  // Handlers
  const handleTaskComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      await onTaskComplete(taskId);
    } finally {
      setCompleting(null);
    }
  };

  const handleSaveMessage = async () => {
    setSavingMessage(true);
    try {
      await onUpdateWelcomeMessage(message);
    } finally {
      setSavingMessage(false);
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedMentor) return;
    setSavingMentor(true);
    try {
      await onAssignMentor(selectedMentor);
    } finally {
      setSavingMentor(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setCompletingOnboarding(true);
    try {
      await onCompleteOnboarding();
    } finally {
      setCompletingOnboarding(false);
    }
  };

  const assignedMentor = availableMentors.find(m => m.id === assignedMentorId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Onboarding: {employee.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {employee.role} • Hired {new Date(employee.hiredAt).toLocaleDateString()} • 
                Day {daysSinceHire} of onboarding
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{progressPercent}%</p>
                <p className="text-sm text-gray-600">Complete</p>
              </div>
              <Progress
                value={progressPercent}
                color={progressPercent === 100 ? 'success' : 'primary'}
                className="w-32"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{completedTasks}/{tasks.length}</p>
            <p className="text-sm text-gray-600">Tasks Complete</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedRequired}/{requiredTasks.length}</p>
            <p className="text-sm text-gray-600">Required Done</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">Day {daysSinceHire}</p>
            <p className="text-sm text-gray-600">Of Onboarding</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {assignedMentor ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600">Mentor Assigned</p>
          </CardBody>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks by Day */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Onboarding Schedule</h3>
          
          {Object.entries(tasksByDay)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([day, dayTasks]) => {
              const dayNum = parseInt(day);
              const isCurrentDay = dayNum === daysSinceHire;
              const isPastDay = dayNum < daysSinceHire;
              const allComplete = dayTasks.every(t => t.isCompleted);
              
              return (
                <Card 
                  key={day}
                  className={`${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Chip 
                          color={allComplete ? 'success' : isCurrentDay ? 'primary' : 'default'}
                          variant={isCurrentDay ? 'solid' : 'flat'}
                        >
                          Day {day}
                        </Chip>
                        {isCurrentDay && (
                          <span className="text-sm text-blue-600 font-medium">Today</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {dayTasks.filter(t => t.isCompleted).length}/{dayTasks.length} complete
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            task.isCompleted ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            isSelected={task.isCompleted}
                            isDisabled={task.isCompleted || completing === task.id}
                            onValueChange={() => handleTaskComplete(task.id)}
                          />
                          <span className="text-xl">{getCategoryIcon(task.category)}</span>
                          <div className="flex-1">
                            <p className={`font-medium ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                              {task.isRequired && !task.isCompleted && (
                                <span className="ml-2 text-xs text-red-600">Required</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{task.description}</p>
                          </div>
                          <Chip size="sm" color={getCategoryColor(task.category)} variant="flat">
                            {task.category}
                          </Chip>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
        </div>

        {/* Right Column - Settings & Actions */}
        <div className="space-y-4">
          {/* Mentor Assignment */}
          <Card>
            <CardHeader>
              <h4 className="font-semibold text-gray-900">Mentor Assignment</h4>
            </CardHeader>
            <CardBody className="pt-0">
              {assignedMentor ? (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-900">{assignedMentor.name}</p>
                  <p className="text-sm text-purple-700">{assignedMentor.role}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select
                    label="Select Mentor"
                    selectedKeys={selectedMentor ? [selectedMentor] : []}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                  >
                    {availableMentors.map(mentor => (
                      <SelectItem key={mentor.id} textValue={mentor.name}>
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <p className="text-xs text-gray-500">{mentor.role}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  <Button
                    color="primary"
                    size="sm"
                    className="w-full"
                    isDisabled={!selectedMentor}
                    isLoading={savingMentor}
                    onClick={handleAssignMentor}
                  >
                    Assign Mentor
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <h4 className="font-semibold text-gray-900">Welcome Message</h4>
            </CardHeader>
            <CardBody className="pt-0">
              <Textarea
                placeholder="Write a personalized welcome message for the new hire..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minRows={4}
              />
              <Button
                color="primary"
                size="sm"
                className="w-full mt-3"
                isLoading={savingMessage}
                onClick={handleSaveMessage}
              >
                Save Message
              </Button>
            </CardBody>
          </Card>

          {/* Category Progress */}
          <Card>
            <CardHeader>
              <h4 className="font-semibold text-gray-900">Progress by Category</h4>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              {Object.entries(tasksByCategory).map(([category, catTasks]) => {
                const completed = catTasks.filter(t => t.isCompleted).length;
                const percent = Math.round((completed / catTasks.length) * 100);
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(category as OnboardingTask['category'])}
                        <span className="capitalize">{category}</span>
                      </span>
                      <span>{completed}/{catTasks.length}</span>
                    </div>
                    <Progress
                      value={percent}
                      color={getCategoryColor(category as OnboardingTask['category'])}
                      size="sm"
                    />
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Complete Onboarding */}
          <Card className={canComplete ? 'ring-2 ring-green-500' : ''}>
            <CardBody className="p-4">
              <Button
                color="success"
                size="lg"
                className="w-full"
                isDisabled={!canComplete}
                isLoading={completingOnboarding}
                onClick={handleCompleteOnboarding}
              >
                {canComplete ? '✓ Complete Onboarding' : `${requiredTasks.length - completedRequired} Required Tasks Remaining`}
              </Button>
              {!canComplete && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Complete all required tasks to finish onboarding
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
