/**
 * @fileoverview Performance Review Modal Component
 * @module lib/components/employee/PerformanceReviewModal
 * 
 * OVERVIEW:
 * Modal dialog for conducting employee performance reviews. Allows reviewers
 * to input performance metrics, see raise/bonus recommendations, identify
 * strengths and improvements, and apply compensation changes.
 * 
 * FEATURES:
 * - Multi-dimension performance input (productivity, quality, attendance, teamwork)
 * - Real-time performance score calculation
 * - Raise recommendation with percentage display
 * - Bonus recommendation with percentage display
 * - Strengths and improvement areas identification
 * - Reviewer notes text area
 * - Budget validation warnings
 * - Morale impact preview
 * 
 * @created 2025-11-27
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Progress } from '@heroui/progress';
import { Slider } from '@heroui/slider';
import { Textarea } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Employee, EmployeePerformance, PerformanceReview } from '@/lib/types';

export interface PerformanceReviewModalProps {
  /** Employee being reviewed */
  employee: Employee;
  /** Company budget available */
  companyBudget: number;
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler */
  onSubmit: (review: PerformanceReviewSubmission) => Promise<void>;
}

export interface PerformanceReviewSubmission {
  overallScore: number;
  productivity: number;
  quality: number;
  attendance: number;
  teamwork: number;
  strengths: string[];
  improvements: string[];
  reviewerNotes: string;
  applyRaise: boolean;
  raiseAmount: number;
  applyBonus: boolean;
  bonusAmount: number;
  moraleImpact: number;
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
 * Calculate raise recommendation based on performance scores
 */
function calculateRaiseRecommendation(
  salary: number,
  scores: { productivity: number; quality: number; attendance: number; teamwork: number }
): { amount: number; percentage: number } {
  const avgScore = (scores.productivity + scores.quality + scores.attendance + scores.teamwork) / 4;
  
  let raisePercentage = 0;
  if (avgScore >= 95) raisePercentage = 20;
  else if (avgScore >= 90) raisePercentage = 15;
  else if (avgScore >= 80) raisePercentage = 10;
  else if (avgScore >= 70) raisePercentage = 7;
  else if (avgScore >= 60) raisePercentage = 5;
  else if (avgScore >= 50) raisePercentage = 3;
  
  return {
    amount: Math.round(salary * (raisePercentage / 100)),
    percentage: raisePercentage,
  };
}

/**
 * Calculate bonus recommendation based on productivity and quality
 */
function calculateBonusRecommendation(
  salary: number,
  productivity: number,
  quality: number
): { amount: number; percentage: number } {
  const combined = (productivity + quality) / 2;
  
  let bonusPercentage = 0;
  if (combined >= 95) bonusPercentage = 50;
  else if (combined >= 90) bonusPercentage = 40;
  else if (combined >= 80) bonusPercentage = 30;
  else if (combined >= 70) bonusPercentage = 20;
  else if (combined >= 60) bonusPercentage = 15;
  else if (combined >= 50) bonusPercentage = 10;
  else if (combined >= 40) bonusPercentage = 5;
  
  return {
    amount: Math.round(salary * (bonusPercentage / 100)),
    percentage: bonusPercentage,
  };
}

/**
 * Calculate morale impact based on review outcome
 */
function calculateMoraleImpact(
  overallScore: number,
  applyRaise: boolean,
  applyBonus: boolean,
  currentMorale: number
): number {
  let impact = 0;
  
  // Base impact from score
  if (overallScore >= 80) impact += 10;
  else if (overallScore >= 60) impact += 5;
  else if (overallScore >= 40) impact -= 5;
  else impact -= 10;
  
  // Raise impact
  if (applyRaise) impact += 15;
  else if (overallScore >= 70) impact -= 5; // Expected raise not given
  
  // Bonus impact
  if (applyBonus) impact += 10;
  
  return impact;
}

/** Predefined strength options */
const STRENGTH_OPTIONS = [
  'Exceptional technical skills',
  'Strong leadership abilities',
  'Excellent communication',
  'Great team player',
  'Highly productive',
  'Quality-focused work',
  'Problem-solving skills',
  'Initiative and proactivity',
  'Client relationship management',
  'Innovation and creativity',
];

/** Predefined improvement options */
const IMPROVEMENT_OPTIONS = [
  'Time management',
  'Communication skills',
  'Technical skill development',
  'Leadership development',
  'Collaboration with team',
  'Documentation practices',
  'Meeting deadlines',
  'Attention to detail',
  'Client handling',
  'Work-life balance',
];

/**
 * Performance Review Modal Component
 * 
 * USAGE:
 * ```tsx
 * <PerformanceReviewModal
 *   employee={selectedEmployee}
 *   companyBudget={company.cash}
 *   isOpen={showReviewModal}
 *   onClose={() => setShowReviewModal(false)}
 *   onSubmit={handleReviewSubmit}
 * />
 * ```
 */
export function PerformanceReviewModal({
  employee,
  companyBudget,
  isOpen,
  onClose,
  onSubmit,
}: PerformanceReviewModalProps) {
  // Form state
  const [productivity, setProductivity] = useState(75);
  const [quality, setQuality] = useState(75);
  const [attendance, setAttendance] = useState(90);
  const [teamwork, setTeamwork] = useState(75);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [applyRaise, setApplyRaise] = useState(true);
  const [applyBonus, setApplyBonus] = useState(true);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Pre-fill with existing performance data if available
      const perf = employee.performance;
      setProductivity(Math.round((perf?.productivity || 1) * 50 + 25)); // Convert 0.5-2x to 0-100
      setQuality(perf?.quality || 75);
      setAttendance(Math.round((perf?.attendance || 0.95) * 100));
      setTeamwork(75);
      setStrengths([]);
      setImprovements([]);
      setReviewerNotes('');
      setApplyRaise(true);
      setApplyBonus(true);
      setError(null);
    }
  }, [isOpen, employee]);

  // Calculated values
  const scores = useMemo(() => ({ productivity, quality, attendance, teamwork }), 
    [productivity, quality, attendance, teamwork]);
  
  const overallScore = useMemo(() => 
    Math.round((productivity * 0.3 + quality * 0.3 + attendance * 0.2 + teamwork * 0.2)),
    [productivity, quality, attendance, teamwork]
  );
  
  const raiseRecommendation = useMemo(() => 
    calculateRaiseRecommendation(employee.salary, scores),
    [employee.salary, scores]
  );
  
  const bonusRecommendation = useMemo(() => 
    calculateBonusRecommendation(employee.salary, productivity, quality),
    [employee.salary, productivity, quality]
  );
  
  const totalCost = useMemo(() => 
    (applyRaise ? raiseRecommendation.amount : 0) + (applyBonus ? bonusRecommendation.amount : 0),
    [applyRaise, applyBonus, raiseRecommendation.amount, bonusRecommendation.amount]
  );
  
  const canAfford = companyBudget >= totalCost;
  
  const moraleImpact = useMemo(() => 
    calculateMoraleImpact(overallScore, applyRaise, applyBonus, employee.morale),
    [overallScore, applyRaise, applyBonus, employee.morale]
  );
  
  const newMorale = Math.min(100, Math.max(0, employee.morale + moraleImpact));

  // Get score color
  const getScoreColor = (score: number): 'success' | 'primary' | 'warning' | 'danger' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  // Toggle selection helpers
  const toggleStrength = (strength: string) => {
    setStrengths(prev => 
      prev.includes(strength) 
        ? prev.filter(s => s !== strength)
        : [...prev, strength]
    );
  };

  const toggleImprovement = (improvement: string) => {
    setImprovements(prev => 
      prev.includes(improvement) 
        ? prev.filter(i => i !== improvement)
        : [...prev, improvement]
    );
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!canAfford && (applyRaise || applyBonus)) {
      setError('Insufficient budget for compensation changes');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        overallScore,
        productivity,
        quality,
        attendance,
        teamwork,
        strengths,
        improvements,
        reviewerNotes,
        applyRaise,
        raiseAmount: applyRaise ? raiseRecommendation.amount : 0,
        applyBonus,
        bonusAmount: applyBonus ? bonusRecommendation.amount : 0,
        moraleImpact,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Performance Review: {employee.name}</h3>
          <p className="text-sm text-gray-600 font-normal">
            {employee.role} • Salary: {formatCurrency(employee.salary)}/yr • 
            Current Morale: {employee.morale}%
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Productivity (30%)
                    </label>
                    <span className="text-sm font-semibold">{productivity}%</span>
                  </div>
                  <Slider
                    size="sm"
                    step={1}
                    minValue={0}
                    maxValue={100}
                    value={productivity}
                    onChange={(v) => setProductivity(v as number)}
                    color={getScoreColor(productivity)}
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">Output vs expectations</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quality (30%)
                    </label>
                    <span className="text-sm font-semibold">{quality}%</span>
                  </div>
                  <Slider
                    size="sm"
                    step={1}
                    minValue={0}
                    maxValue={100}
                    value={quality}
                    onChange={(v) => setQuality(v as number)}
                    color={getScoreColor(quality)}
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">Work quality and accuracy</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Attendance (20%)
                    </label>
                    <span className="text-sm font-semibold">{attendance}%</span>
                  </div>
                  <Slider
                    size="sm"
                    step={1}
                    minValue={0}
                    maxValue={100}
                    value={attendance}
                    onChange={(v) => setAttendance(v as number)}
                    color={getScoreColor(attendance)}
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">Days present vs expected</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Teamwork (20%)
                    </label>
                    <span className="text-sm font-semibold">{teamwork}%</span>
                  </div>
                  <Slider
                    size="sm"
                    step={1}
                    minValue={0}
                    maxValue={100}
                    value={teamwork}
                    onChange={(v) => setTeamwork(v as number)}
                    color={getScoreColor(teamwork)}
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">Collaboration effectiveness</p>
                </div>
              </div>

              {/* Overall Score */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Overall Performance Score</span>
                  <div className="flex items-center gap-3">
                    <Chip color={getScoreColor(overallScore)} size="lg">
                      {overallScore}%
                    </Chip>
                    <span className="text-sm text-gray-600">
                      {overallScore >= 80 ? 'Excellent' : 
                       overallScore >= 60 ? 'Good' : 
                       overallScore >= 40 ? 'Needs Improvement' : 'Poor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {STRENGTH_OPTIONS.map(strength => (
                    <Chip
                      key={strength}
                      variant={strengths.includes(strength) ? 'solid' : 'bordered'}
                      color={strengths.includes(strength) ? 'success' : 'default'}
                      className="cursor-pointer"
                      onClick={() => toggleStrength(strength)}
                    >
                      {strength}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
                <div className="flex flex-wrap gap-2">
                  {IMPROVEMENT_OPTIONS.map(improvement => (
                    <Chip
                      key={improvement}
                      variant={improvements.includes(improvement) ? 'solid' : 'bordered'}
                      color={improvements.includes(improvement) ? 'warning' : 'default'}
                      className="cursor-pointer"
                      onClick={() => toggleImprovement(improvement)}
                    >
                      {improvement}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Reviewer Notes</h4>
              <Textarea
                placeholder="Add any additional observations, goals, or feedback..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                minRows={3}
              />
            </div>

            {/* Compensation Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Compensation Recommendations</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      isSelected={applyRaise}
                      onValueChange={setApplyRaise}
                    >
                      <span className="font-medium">Apply Raise</span>
                    </Checkbox>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(raiseRecommendation.amount)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {raiseRecommendation.percentage}% increase
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      isSelected={applyBonus}
                      onValueChange={setApplyBonus}
                    >
                      <span className="font-medium">Apply Bonus</span>
                    </Checkbox>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(bonusRecommendation.amount)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {bonusRecommendation.percentage}% of salary
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Cost & Budget */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Total Cost</p>
                  <p className="text-xs text-gray-600">
                    Available: {formatCurrency(companyBudget)}
                  </p>
                </div>
                <p className={`text-xl font-bold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(totalCost)}
                </p>
              </div>

              {!canAfford && (applyRaise || applyBonus) && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Insufficient budget. Deselect compensation options or add more funds.
                  </p>
                </div>
              )}
            </div>

            {/* Morale Impact Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Morale Impact Preview</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Current</p>
                  <p className="text-lg font-semibold">{employee.morale}%</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${moraleImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {moraleImpact >= 0 ? '+' : ''}{moraleImpact}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">After Review</p>
                  <p className={`text-lg font-semibold ${newMorale >= employee.morale ? 'text-green-600' : 'text-red-600'}`}>
                    {newMorale}%
                  </p>
                </div>
              </div>
              <Progress
                value={newMorale}
                color={newMorale >= 70 ? 'success' : newMorale >= 50 ? 'warning' : 'danger'}
                className="mt-3"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onClick={onClose}
            isDisabled={submitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={!canAfford && (applyRaise || applyBonus)}
          >
            {submitting ? 'Submitting...' : 'Complete Review'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
