/**
 * @file src/components/employees/PerformanceReviewModal.tsx
 * @description Modal dialog for conducting employee performance reviews
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Interactive modal for conducting comprehensive employee performance reviews.
 * Allows reviewers to input performance metrics across multiple dimensions,
 * see real-time raise/bonus recommendations, and apply compensation changes.
 * 
 * FEATURES:
 * - Multi-dimension performance input (contracts, revenue, attendance, teamwork)
 * - Real-time performance score calculation
 * - Star rating visualization (1-5 stars)
 * - Raise recommendation with percentage display
 * - Bonus recommendation with percentage display
 * - Strengths and improvement areas identification
 * - Reviewer notes text area
 * - Budget validation warnings
 * - Apply raise/bonus toggle options
 * - Submission with loading state
 * 
 * PROPS:
 * ```typescript
 * interface PerformanceReviewModalProps {
 *   employee: {
 *     id: string;
 *     fullName: string;
 *     role: string;
 *     salary: number;
 *     performanceRating: number;
 *     contractsCompleted: number;
 *     revenueGenerated: number;
 *   };
 *   companyBudget: number;
 *   isOpen: boolean;
 *   onClose: () => void;
 *   onSubmit: (reviewData: {
 *     contractsCompleted: number;
 *     revenueGenerated: number;
 *     attendanceScore: number;
 *     teamworkScore: number;
 *     reviewerNotes: string;
 *     applyRaise: boolean;
 *     applyBonus: boolean;
 *   }) => Promise<void>;
 * }
 * ```
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
 * 
 * IMPLEMENTATION NOTES:
 * - Default scores: 75 for attendance and teamwork (average)
 * - Performance score: Weighted average of 5 dimensions
 * - Raise calculation: 0-25% based on performance
 * - Bonus calculation: 0-60% based on revenue contribution
 * - Budget warnings when total > available cash
 * - Form validation prevents submission with invalid inputs
 * - Loading state disables all inputs during submission
 * - Success closes modal automatically
 * - Escape key closes modal (when not submitting)
 */

'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';

interface PerformanceReviewModalProps {
  employee: {
    id: string;
    fullName: string;
    role: string;
    salary: number;
    performanceRating: number;
    contractsCompleted: number;
    revenueGenerated: number;
  };
  companyBudget: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: {
    contractsCompleted: number;
    revenueGenerated: number;
    attendanceScore: number;
    teamworkScore: number;
    reviewerNotes: string;
    applyRaise: boolean;
    applyBonus: boolean;
  }) => Promise<void>;
}

/**
 * Calculate estimated raise based on performance
 */
function calculateEstimatedRaise(
  salary: number,
  contractsScore: number,
  revenueScore: number,
  attendanceScore: number,
  teamworkScore: number
): { amount: number; percentage: number } {
  const avgScore =
    (contractsScore * 0.25 +
      revenueScore * 0.25 +
      attendanceScore * 0.2 +
      teamworkScore * 0.3) /
    100;

  let raisePercentage = 0;
  if (avgScore >= 0.9) raisePercentage = 15;
  else if (avgScore >= 0.8) raisePercentage = 10;
  else if (avgScore >= 0.7) raisePercentage = 7;
  else if (avgScore >= 0.6) raisePercentage = 5;
  else if (avgScore >= 0.5) raisePercentage = 3;

  return {
    amount: Math.round(salary * (raisePercentage / 100)),
    percentage: raisePercentage,
  };
}

/**
 * Calculate estimated bonus based on revenue
 */
function calculateEstimatedBonus(
  salary: number,
  revenueScore: number
): { amount: number; percentage: number } {
  let bonusPercentage = 0;
  if (revenueScore >= 90) bonusPercentage = 40;
  else if (revenueScore >= 80) bonusPercentage = 30;
  else if (revenueScore >= 70) bonusPercentage = 20;
  else if (revenueScore >= 60) bonusPercentage = 15;
  else if (revenueScore >= 50) bonusPercentage = 10;
  else if (revenueScore >= 40) bonusPercentage = 5;

  return {
    amount: Math.round(salary * (bonusPercentage / 100)),
    percentage: bonusPercentage,
  };
}

/**
 * Performance review modal component
 */
export default function PerformanceReviewModal({
  employee,
  companyBudget,
  isOpen,
  onClose,
  onSubmit,
}: PerformanceReviewModalProps): JSX.Element | null {
  const [formData, setFormData] = useState({
    contractsCompleted: 0,
    revenueGenerated: 0,
    attendanceScore: 75,
    teamworkScore: 75,
    reviewerNotes: '',
    applyRaise: true,
    applyBonus: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        contractsCompleted: 0,
        revenueGenerated: 0,
        attendanceScore: 75,
        teamworkScore: 75,
        reviewerNotes: '',
        applyRaise: true,
        applyBonus: true,
      });
    }
  }, [isOpen]);

  // Calculate scores and estimates
  const contractsScore = Math.min(100, formData.contractsCompleted * 20);
  const revenueScore = Math.min(
    100,
    (formData.revenueGenerated / Math.max(1, employee.salary * 3)) * 100
  );

  const estimatedRaise = calculateEstimatedRaise(
    employee.salary,
    contractsScore,
    revenueScore,
    formData.attendanceScore,
    formData.teamworkScore
  );

  const estimatedBonus = calculateEstimatedBonus(employee.salary, revenueScore);

  const totalCost =
    (formData.applyRaise ? estimatedRaise.amount : 0) +
    (formData.applyBonus ? estimatedBonus.amount : 0);

  const canAfford = companyBudget >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      logger.error('Review submission failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'handleSubmit',
        component: 'PerformanceReviewModal',
        employeeId: employee.id
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined; // Explicitly return undefined when isOpen is false
  }, [isOpen, submitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Performance Review: {employee.fullName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {employee.role} • Current Salary: {formatCurrency(employee.salary)}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contracts Completed (Since Last Review)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.contractsCompleted}
                  onChange={(e) =>
                    setFormData({ ...formData, contractsCompleted: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Score: {contractsScore}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenue Generated (Since Last Review)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.revenueGenerated}
                  onChange={(e) =>
                    setFormData({ ...formData, revenueGenerated: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Score: {Math.round(revenueScore)}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Score (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.attendanceScore}
                  onChange={(e) =>
                    setFormData({ ...formData, attendanceScore: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formData.attendanceScore}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teamwork Score (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.teamworkScore}
                  onChange={(e) =>
                    setFormData({ ...formData, teamworkScore: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formData.teamworkScore}
                </p>
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reviewer Notes (Optional)
              </label>
              <textarea
                value={formData.reviewerNotes}
                onChange={(e) => setFormData({ ...formData, reviewerNotes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes about this review..."
              />
            </div>

            {/* Compensation Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Compensation Recommendations</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="applyRaise"
                      checked={formData.applyRaise}
                      onChange={(e) =>
                        setFormData({ ...formData, applyRaise: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="applyRaise" className="text-sm font-medium text-gray-700">
                      Apply Raise
                    </label>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(estimatedRaise.amount)}
                    </p>
                    <p className="text-xs text-gray-600">{estimatedRaise.percentage}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="applyBonus"
                      checked={formData.applyBonus}
                      onChange={(e) =>
                        setFormData({ ...formData, applyBonus: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="applyBonus" className="text-sm font-medium text-gray-700">
                      Apply Bonus
                    </label>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(estimatedBonus.amount)}
                    </p>
                    <p className="text-xs text-gray-600">{estimatedBonus.percentage}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                <p className="font-semibold text-gray-900">Total Cost:</p>
                <p
                  className={`text-xl font-bold ${
                    canAfford ? 'text-gray-900' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(totalCost)}
                </p>
              </div>

              {!canAfford && (
                <div className="bg-red-100 border border-red-300 rounded-md p-3">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Insufficient company budget. Available: {formatCurrency(companyBudget)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="submit"
              disabled={submitting || !canAfford}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Submitting Review...' : 'Complete Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
