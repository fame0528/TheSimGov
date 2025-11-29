/**
 * @fileoverview Training Dashboard Component
 * @module lib/components/employee/TrainingDashboard
 * 
 * OVERVIEW:
 * Comprehensive dashboard for employee training management. Displays available
 * training programs filtered by employee eligibility, shows success probabilities,
 * skill gains preview, and handles enrollment flow with budget validation.
 * 
 * FEATURES:
 * - List of eligible training programs
 * - Program filtering (skill, difficulty, cost)
 * - Success probability calculation
 * - Skill gains preview with before/after values
 * - Cost and duration information
 * - Company budget status
 * - Training cooldown indicator
 * - Enrollment confirmation modal
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Progress } from '@heroui/progress';
import { Select, SelectItem } from '@heroui/select';
import { Tooltip } from '@heroui/tooltip';
import { Employee, EmployeeSkills } from '@/lib/types';

/**
 * Training Program Definition
 */
export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  type: 'Technical' | 'Leadership' | 'Industry' | 'Sales' | 'Finance' | 'Operations' | 'Compliance' | 'General';
  provider: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cost: number;
  durationDays: number;
  schedule: 'Full-time' | 'Part-time' | 'Evening' | 'Weekend' | 'Online';
  targetSkill: keyof EmployeeSkills;
  skillGains: Partial<EmployeeSkills>;
  certificationAwarded?: string;
  industryRecognition?: string;
  prerequisites?: {
    minSkillLevel?: Partial<EmployeeSkills>;
    requiredCertifications?: string[];
  };
  maxParticipants?: number;
  currentEnrollments?: number;
}

export interface TrainingDashboardProps {
  /** Employee to train */
  employee: Employee;
  /** Available training programs */
  programs: TrainingProgram[];
  /** Company budget available */
  companyBudget: number;
  /** Enrollment handler */
  onEnroll: (programId: string) => Promise<void>;
  /** Training cooldown status */
  cooldownEndsAt?: Date;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Format currency for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format skill name for display
 */
const formatSkillName = (skill: string): string => {
  const names: Record<string, string> = {
    technical: 'Technical',
    leadership: 'Leadership',
    industry: 'Industry Knowledge',
    sales: 'Sales',
    marketing: 'Marketing',
    finance: 'Finance',
    operations: 'Operations',
    hr: 'Human Resources',
    legal: 'Legal',
    rd: 'R&D',
    quality: 'Quality',
    customer: 'Customer Service',
  };
  return names[skill] || skill;
};

/**
 * Calculate success probability based on employee skills and program difficulty
 */
function calculateSuccessProbability(employee: Employee, program: TrainingProgram): number {
  const baseSkill = employee.skills[program.targetSkill] || 50;
  const difficultyModifier = (6 - program.difficulty) * 10; // Higher difficulty = lower modifier
  const learningBonus = 10; // Placeholder for learning rate system
  
  const probability = Math.min(95, Math.max(5, baseSkill + difficultyModifier + learningBonus - 30));
  return Math.round(probability);
}

/**
 * Get probability display config
 */
function getProbabilityConfig(probability: number): { color: 'success' | 'primary' | 'warning' | 'danger'; label: string } {
  if (probability >= 80) return { color: 'success', label: 'Very High' };
  if (probability >= 60) return { color: 'primary', label: 'High' };
  if (probability >= 40) return { color: 'warning', label: 'Medium' };
  return { color: 'danger', label: 'Low' };
}

/**
 * Get difficulty display config
 */
function getDifficultyConfig(difficulty: number): { color: 'success' | 'primary' | 'warning' | 'danger'; label: string } {
  switch (difficulty) {
    case 1: return { color: 'success', label: 'Beginner' };
    case 2: return { color: 'success', label: 'Easy' };
    case 3: return { color: 'primary', label: 'Intermediate' };
    case 4: return { color: 'warning', label: 'Advanced' };
    case 5: return { color: 'danger', label: 'Expert' };
    default: return { color: 'primary', label: 'Unknown' };
  }
}

/** Training type filter options */
const TRAINING_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Industry', label: 'Industry' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'General', label: 'General' },
];

/** Cost filter options */
const COST_OPTIONS = [
  { value: 'all', label: 'Any Cost' },
  { value: '5000', label: 'Under $5,000' },
  { value: '10000', label: 'Under $10,000' },
  { value: '25000', label: 'Under $25,000' },
  { value: '50000', label: 'Under $50,000' },
];

/** Success rate filter options */
const SUCCESS_OPTIONS = [
  { value: '0', label: 'Any Success Rate' },
  { value: '40', label: '40%+' },
  { value: '60', label: '60%+' },
  { value: '80', label: '80%+' },
];

/**
 * Training Dashboard Component
 * 
 * Displays training programs with filtering, success probability,
 * skill gains preview, and enrollment flow.
 * 
 * USAGE:
 * ```tsx
 * <TrainingDashboard
 *   employee={selectedEmployee}
 *   programs={availablePrograms}
 *   companyBudget={company.cash}
 *   onEnroll={handleEnroll}
 *   cooldownEndsAt={employee.trainingCooldownEnds}
 * />
 * ```
 */
export function TrainingDashboard({
  employee,
  programs,
  companyBudget,
  onEnroll,
  cooldownEndsAt,
  isLoading = false,
}: TrainingDashboardProps) {
  // Modal state
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [maxCost, setMaxCost] = useState('all');
  const [minSuccess, setMinSuccess] = useState('0');

  // Check cooldown
  const isOnCooldown = cooldownEndsAt && new Date(cooldownEndsAt) > new Date();
  const cooldownDays = cooldownEndsAt 
    ? Math.ceil((new Date(cooldownEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Filter and enrich programs with success probability
  const filteredPrograms = useMemo(() => {
    return programs
      .map(program => ({
        ...program,
        successProbability: calculateSuccessProbability(employee, program),
        canAfford: companyBudget >= program.cost,
        hasSlots: !program.maxParticipants || (program.currentEnrollments || 0) < program.maxParticipants,
      }))
      .filter(program => {
        if (typeFilter !== 'all' && program.type !== typeFilter) return false;
        if (maxCost !== 'all' && program.cost > parseInt(maxCost)) return false;
        if (program.successProbability < parseInt(minSuccess)) return false;
        return true;
      })
      .sort((a, b) => b.successProbability - a.successProbability);
  }, [programs, employee, companyBudget, typeFilter, maxCost, minSuccess]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!selectedProgram) return;
    
    setEnrolling(true);
    setEnrollError(null);
    
    try {
      await onEnroll(selectedProgram.id);
      setSelectedProgram(null);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Training Programs for {employee.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select a program to enhance skills and earn certifications
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Skill Average</p>
                <p className="font-semibold text-lg">{employee.skillAverage || 50}</p>
              </div>
              <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Budget</p>
                <p className="font-semibold text-lg text-green-600">{formatCurrency(companyBudget)}</p>
              </div>
              {isOnCooldown && (
                <div className="px-4 py-2 bg-orange-50 rounded-lg">
                  <p className="text-orange-700 font-medium">On Cooldown</p>
                  <p className="text-sm text-orange-600">{cooldownDays} days remaining</p>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Training Type"
              selectedKeys={[typeFilter]}
              onChange={(e) => setTypeFilter(e.target.value)}
              size="sm"
            >
              {TRAINING_TYPES.map(opt => (
                <SelectItem key={opt.value} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            
            <Select
              label="Max Cost"
              selectedKeys={[maxCost]}
              onChange={(e) => setMaxCost(e.target.value)}
              size="sm"
            >
              {COST_OPTIONS.map(opt => (
                <SelectItem key={opt.value} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            
            <Select
              label="Min Success Rate"
              selectedKeys={[minSuccess]}
              onChange={(e) => setMinSuccess(e.target.value)}
              size="sm"
            >
              {SUCCESS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-600">No training programs match your filters</p>
            <Button
              className="mt-4"
              size="sm"
              variant="bordered"
              onClick={() => {
                setTypeFilter('all');
                setMaxCost('all');
                setMinSuccess('0');
              }}
            >
              Clear Filters
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map(program => {
            const probConfig = getProbabilityConfig(program.successProbability);
            const diffConfig = getDifficultyConfig(program.difficulty);
            const canEnroll = program.canAfford && program.hasSlots && !isOnCooldown;
            
            return (
              <Card 
                key={program.id}
                className={`transition-all ${!canEnroll ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'}`}
              >
                <CardHeader className="flex flex-col gap-2 pb-2">
                  <div className="flex items-start justify-between w-full">
                    <h3 className="font-semibold text-gray-900 text-base flex-1 pr-2">
                      {program.name}
                    </h3>
                    <Tooltip content={`${probConfig.label} success chance`}>
                      <Chip color={probConfig.color} size="sm">
                        {program.successProbability}%
                      </Chip>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat">{program.type}</Chip>
                    <Chip size="sm" variant="flat" color={diffConfig.color}>
                      {diffConfig.label}
                    </Chip>
                  </div>
                </CardHeader>
                
                <CardBody className="py-3 border-t border-gray-100">
                  {/* Cost & Duration */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className={`font-semibold ${program.canAfford ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrency(program.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{program.durationDays} days</p>
                    </div>
                  </div>
                  
                  {/* Skill Gains Preview */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Skill Gains:</p>
                    <div className="space-y-1">
                      {Object.entries(program.skillGains)
                        .sort(([, a], [, b]) => (b || 0) - (a || 0))
                        .slice(0, 3)
                        .map(([skill, gain]) => (
                          <div key={skill} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{formatSkillName(skill)}</span>
                            <span className="font-semibold text-green-600">+{gain}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Certification */}
                  {program.certificationAwarded && (
                    <div className="px-2 py-1.5 bg-purple-50 rounded-md mb-3">
                      <p className="text-xs text-purple-700 font-medium">
                        🎓 {program.certificationAwarded}
                      </p>
                    </div>
                  )}
                  
                  {/* Provider & Schedule */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{program.provider}</span>
                    <span>{program.schedule}</span>
                  </div>
                </CardBody>
                
                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    color={canEnroll ? 'primary' : 'default'}
                    isDisabled={!canEnroll || isLoading}
                    onClick={() => setSelectedProgram(program)}
                  >
                    {!program.canAfford
                      ? 'Insufficient Budget'
                      : !program.hasSlots
                      ? 'No Slots Available'
                      : isOnCooldown
                      ? 'On Cooldown'
                      : 'Enroll'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      <Modal 
        isOpen={selectedProgram !== null} 
        onClose={() => setSelectedProgram(null)}
        size="2xl"
      >
        <ModalContent>
          {selectedProgram && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">Confirm Training Enrollment</h3>
                <p className="text-sm text-gray-600 font-normal">
                  Review program details before enrolling {employee.name}
                </p>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-6">
                  {/* Program Info */}
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">{selectedProgram.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedProgram.description}</p>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Cost</p>
                      <p className="font-semibold text-lg">{formatCurrency(selectedProgram.cost)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-lg">{selectedProgram.durationDays} days</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="font-semibold text-lg">
                        {calculateSuccessProbability(employee, selectedProgram)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Schedule</p>
                      <p className="font-semibold text-lg">{selectedProgram.schedule}</p>
                    </div>
                  </div>
                  
                  {/* Skill Improvements */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Expected Skill Improvements</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedProgram.skillGains).map(([skill, gain]) => {
                        const currentValue = employee.skills[skill as keyof EmployeeSkills] || 0;
                        const newValue = Math.min(100, currentValue + (gain || 0));
                        return (
                          <div key={skill} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 flex-1">
                              {formatSkillName(skill)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{currentValue}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-sm font-semibold text-green-600">{newValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Certification */}
                  {selectedProgram.certificationAwarded && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-900">
                        🎓 Certification: {selectedProgram.certificationAwarded}
                      </p>
                      {selectedProgram.industryRecognition && (
                        <p className="text-sm text-purple-700 mt-1">
                          {selectedProgram.industryRecognition}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Budget Impact */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Budget</span>
                      <span className="font-semibold">{formatCurrency(companyBudget)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Training Cost</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(selectedProgram.cost)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="font-medium">Remaining Budget</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(companyBudget - selectedProgram.cost)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {enrollError && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-red-700">{enrollError}</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button
                  variant="bordered"
                  onClick={() => setSelectedProgram(null)}
                  isDisabled={enrolling}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleEnroll}
                  isLoading={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
